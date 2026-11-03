import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeIn } from '@/components/Motion';
import { Button, TextLink } from '@/components/ui';
import { CHAT_NAME, useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';

// Names the button after where a notification's link goes.
function linkLabel(link: string): string {
  if (link.startsWith('/my-trip/')) return 'Open My Trip';
  if (link === '/chat') return 'Open chat';
  return 'Open';
}

// The full message, shown like a chat message from the team. It's an update, so there's no reply box.
export default function NotificationScreen() {
  useStatusBar('dark');
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notifications, markNotificationRead } = useStore();
  const notification = notifications.find((item) => String(item.id) === id);

  const unreadId = notification && !notification.read ? notification.id : null;
  useEffect(() => {
    if (unreadId !== null) markNotificationRead(unreadId);
  }, [unreadId, markNotificationRead]);

  if (!notification) {
    return <Text style={styles.missing}>This notification could not be found.</Text>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <FadeIn distance={10} duration={300}>
        <View style={styles.sender}>
          <View style={styles.avatar}>
            <Ionicons name="notifications" size={18} color={colors.white} />
          </View>
          <Text style={styles.senderName}>{CHAT_NAME}</Text>
        </View>
        <View style={styles.bubble}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.body} selectable>
            {notification.body}
          </Text>
          <Text style={styles.time}>{notification.createdAt} UTC</Text>
        </View>
      </FadeIn>

      {notification.link && (
        <FadeIn delay={120}>
          <Button
            label={linkLabel(notification.link)}
            style={styles.action}
            onPress={() => router.push(notification.link as Href)}
          />
        </FadeIn>
      )}

      <View style={styles.note}>
        <Text style={styles.noteText}>This is an update from our team, so you can’t reply here.</Text>
        <TextLink label="Have a question? Message us" onPress={() => router.push('/chat')} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  missing: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.textMuted,
  },
  sender: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  bubble: {
    alignSelf: 'flex-start',
    maxWidth: '92%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text, marginTop: spacing.xs },
  time: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: spacing.sm },
  action: { marginTop: spacing.lg },
  note: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.xl },
  noteText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});
