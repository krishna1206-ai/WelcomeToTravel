import Ionicons from '@expo/vector-icons/Ionicons';
import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NATIVE_DRIVER, useReducedMotion } from '@/components/Motion';
import { CHAT_NAME, useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';

const VISIBLE_MS = 6000;
const HIDDEN_OFFSET = -160;

// Announces the newest unread chat message or notification over any screen.
export function NotificationBanner() {
  const { notifications, chat, unreadCount } = useStore();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [dismissed, setDismissed] = useState({ chat: 0, notification: 0 });
  const [progress] = useState(() => new Animated.Value(0));

  const message = chat.filter((item) => item.sender === 'admin' && !item.read).at(-1);
  const notification = notifications.find((item) => !item.read);

  let visible: { kind: 'chat' | 'notification'; id: number; name: string; text: string } | null = null;
  if (message && message.id > dismissed.chat) {
    visible = { kind: 'chat', id: message.id, name: CHAT_NAME, text: message.body };
  } else if (notification && notification.id > dismissed.notification) {
    visible = { kind: 'notification', id: notification.id, name: notification.title, text: notification.body };
  }

  const visibleKind = visible?.kind;
  const visibleId = visible?.id;

  useEffect(() => {
    if (!visibleKind || !visibleId) return;
    progress.setValue(reduced ? 1 : 0);
    if (!reduced) {
      Animated.spring(progress, {
        toValue: 1,
        stiffness: 180,
        damping: 18,
        useNativeDriver: NATIVE_DRIVER,
      }).start();
    }
    const dismiss = () => setDismissed((current) => ({ ...current, [visibleKind]: visibleId }));
    const timer = setTimeout(() => {
      if (reduced) {
        dismiss();
        return;
      }
      Animated.timing(progress, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: NATIVE_DRIVER,
      }).start(dismiss);
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [visibleKind, visibleId, progress, reduced]);

  if (!visible || pathname === '/chat') return null;

  const { kind, id, name, text } = visible;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [HIDDEN_OFFSET, 0] });

  return (
    <Animated.View
      style={[styles.wrap, { top: insets.top + spacing.sm, opacity: progress, transform: [{ translateY }] }]}
      pointerEvents="box-none">
      <Pressable
        style={styles.banner}
        accessibilityRole="alert"
        onPress={() => {
          setDismissed((current) => ({ ...current, [kind]: id }));
          if (kind === 'chat') router.push('/chat');
          else router.push({ pathname: '/notification/[id]', params: { id } });
        }}>
        <Ionicons name="notifications" size={20} color={colors.primary} />
        <View style={styles.body}>
          <Text style={styles.title}>
            {unreadCount} new {unreadCount === 1 ? 'notification' : 'notifications'}
          </Text>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.text} numberOfLines={2}>
            {text}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg },
  banner: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    boxShadow: '0 4px 16px rgba(16, 26, 51, 0.25)',
    padding: spacing.md,
  },
  body: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  name: { fontFamily: fonts.semibold, fontSize: 14, color: colors.primary, marginTop: 2 },
  text: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted, marginTop: 2 },
});
