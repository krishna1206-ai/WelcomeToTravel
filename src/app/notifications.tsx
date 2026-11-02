import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeIn, Pulse, ScalePressable, staggerDelay } from '@/components/Motion';
import { Button } from '@/components/ui';
import { useAuth } from '@/state/auth';
import { CHAT_NAME, useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';

export default function NotificationsScreen() {
  useStatusBar('dark');
  const { user } = useAuth();
  const { notifications, chat, unreadChat, markNotificationRead } = useStore();

  if (!user) {
    return (
      <View style={styles.centered}>
        <Ionicons name="notifications-outline" size={56} color={colors.primary} />
        <Text style={styles.title}>Sign in to see your notifications</Text>
        <Text style={styles.text}>We’ll tell you here when your booking is confirmed or cancelled.</Text>
        <Button
          label="Sign in"
          style={styles.signIn}
          onPress={() => router.push({ pathname: '/sign-in', params: { next: '/notifications' } })}
        />
      </View>
    );
  }

  const lastMessage = chat.at(-1);
  const chatPreview = !lastMessage
    ? 'Send us a message'
    : `${lastMessage.sender === 'customer' ? 'You: ' : ''}${lastMessage.body}`;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <FadeIn distance={14}>
      <ScalePressable
        style={styles.row}
        pressedScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={`${unreadChat > 0 ? 'Unread. ' : ''}${CHAT_NAME}. ${chatPreview}`}
        onPress={() => router.push('/chat')}>
        <View style={styles.icon}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.body}>
          <Text style={styles.rowTitle}>{CHAT_NAME}</Text>
          <Text style={styles.rowText} numberOfLines={2}>
            {chatPreview}
          </Text>
          {lastMessage && <Text style={styles.rowDate}>{lastMessage.createdAt} UTC</Text>}
        </View>
        {unreadChat > 0 && <Pulse style={styles.unreadDot} />}
      </ScalePressable>
      </FadeIn>

      {notifications.map((item, index) => (
        <FadeIn key={item.id} delay={staggerDelay(index, 60)} distance={14}>
        <ScalePressable
          style={styles.row}
          pressedScale={0.98}
          accessibilityRole="button"
          accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}`}
          onPress={() => {
            if (!item.read) markNotificationRead(item.id);
            if (item.link) router.push(item.link as Href);
          }}>
          <View style={styles.icon}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.body}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowText}>{item.body}</Text>
            <Text style={styles.rowDate}>{item.createdAt} UTC</Text>
          </View>
          {!item.read && <Pulse style={styles.unreadDot} />}
        </ScalePressable>
        </FadeIn>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  signIn: { marginTop: spacing.lg, alignSelf: 'stretch' },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
  rowTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  rowText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted, marginTop: 2 },
  rowDate: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
});
