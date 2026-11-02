import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

import { api } from '@/api/client';
import { useAuth } from '@/state/auth';
import { useStore } from '@/state/store';
import { pushSupported, requestPushToken } from '@/utils/push';

const OPENABLE_SCREENS = /^\/(chat|notifications|my-trip\/\d+)$/;

function openFromNotification(url: unknown) {
  if (typeof url === 'string' && OPENABLE_SCREENS.test(url)) router.push(url as Href);
}

// Registers this device for the signed-in customer and handles tapped notifications.
export function PushNotifications() {
  const { token } = useAuth();
  const { refreshAccount } = useStore();

  useEffect(() => {
    if (!token) return;
    requestPushToken()
      .then((pushToken) => {
        if (!pushToken) return;
        return api('/api/me/push-token', { method: 'POST', token, body: { token: pushToken } });
      })
      .catch((error) => console.warn('Could not set up push notifications', error));
  }, [token]);

  useEffect(() => {
    if (!pushSupported || !token) return;
    let active = true;
    const subscriptions: { remove: () => void }[] = [];

    import('expo-notifications').then(async (Notifications) => {
      if (!active) return;
      // The app shows its own banner while open, so the system one would be a duplicate.
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: false,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      subscriptions.push(
        Notifications.addNotificationReceivedListener(() => {
          refreshAccount();
        }),
        Notifications.addNotificationResponseReceivedListener((response) => {
          refreshAccount();
          openFromNotification(response.notification.request.content.data?.url);
        }),
      );

      // Covers a notification that opened the app from closed.
      const last = await Notifications.getLastNotificationResponseAsync();
      if (active && last) {
        openFromNotification(last.notification.request.content.data?.url);
        await Notifications.clearLastNotificationResponseAsync();
      }
    });

    return () => {
      active = false;
      for (const subscription of subscriptions) subscription.remove();
    };
  }, [token, refreshAccount]);

  return null;
}
