import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const CHANNEL_ID = 'default';

// Expo Go has no push support, and loading the module there logs warnings.
export const pushSupported = Platform.OS !== 'web' && !isRunningInExpoGo();

let currentToken: string | null = null;

export function registeredPushToken(): string | null {
  return currentToken;
}

// Asks for permission if needed. Returns null if push isn't possible or was refused.
export async function requestPushToken(): Promise<string | null> {
  if (!pushSupported) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('Push notifications need an EAS project. Run: npx eas-cli@latest init');
    return null;
  }

  const Notifications = await import('expo-notifications');
  // Android 13 and newer need the channel to exist before asking for permission.
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Bookings and messages',
    importance: Notifications.AndroidImportance.HIGH,
  });
  const existing = await Notifications.getPermissionsAsync();
  const { granted } = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!granted) return null;

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  currentToken = data;
  return data;
}
