import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/api/client';
import { FadeIn, PopIn, Pulse, ScalePressable, staggerDelay } from '@/components/Motion';
import { Button, TextLink } from '@/components/ui';
import { useAuth } from '@/state/auth';
import { CHAT_NAME, useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';

export default function NotificationsScreen() {
  useStatusBar('dark');
  const { user } = useAuth();
  const { notifications, chat, unreadChat, deleteNotifications } = useStore();
  const [selected, setSelected] = useState<number[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const selecting = selected.length > 0;

  function toggle(id: number) {
    setConfirming(false);
    setError('');
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function clearSelection() {
    setSelected([]);
    setConfirming(false);
    setError('');
  }

  async function remove() {
    setBusy(true);
    setError('');
    try {
      await deleteNotifications(selected);
      clearSelection();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

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
    <View style={styles.screen}>
    {selecting && (
      <FadeIn distance={-10} duration={200} style={styles.bar}>
        {confirming ? (
          <>
            <Text style={styles.barTitle}>
              Delete {selected.length} {selected.length === 1 ? 'notification' : 'notifications'}? This can’t be undone.
            </Text>
            <View style={styles.barActions}>
              <Button label="Keep" variant="outline" style={styles.barButton} onPress={() => setConfirming(false)} />
              <Button
                label={busy ? 'Deleting…' : 'Delete'}
                style={[styles.barButton, styles.deleteButton]}
                onPress={busy ? () => undefined : remove}
              />
            </View>
          </>
        ) : (
          <View style={styles.barRow}>
            <Text style={styles.barTitle}>{selected.length} selected</Text>
            <TextLink
              label={selected.length === notifications.length ? 'Select none' : 'Select all'}
              onPress={() =>
                setSelected(selected.length === notifications.length ? [] : notifications.map((item) => item.id))
              }
            />
            <ScalePressable
              style={styles.trash}
              pressedScale={0.88}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${selected.length} selected`}
              onPress={() => setConfirming(true)}>
              <Ionicons name="trash-outline" size={20} color={colors.white} />
            </ScalePressable>
            <ScalePressable
              style={styles.close}
              pressedScale={0.88}
              accessibilityRole="button"
              accessibilityLabel="Cancel selection"
              onPress={clearSelection}>
              <Ionicons name="close" size={20} color={colors.text} />
            </ScalePressable>
          </View>
        )}
        {error !== '' && <Text style={styles.error}>{error}</Text>}
      </FadeIn>
    )}
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

      {notifications.map((item, index) => {
        const isSelected = selected.includes(item.id);
        return (
        <FadeIn key={item.id} delay={staggerDelay(index, 60)} distance={14}>
        <ScalePressable
          style={[styles.row, isSelected && styles.rowSelected]}
          pressedScale={0.98}
          delayLongPress={400}
          accessibilityRole={selecting ? 'checkbox' : 'button'}
          accessibilityState={selecting ? { checked: isSelected } : undefined}
          accessibilityHint={selecting ? undefined : 'Long-press to select'}
          accessibilityLabel={`${item.read ? '' : 'Unread. '}${item.title}. ${item.body}`}
          onLongPress={() => toggle(item.id)}
          onPress={() =>
            selecting ? toggle(item.id) : router.push({ pathname: '/notification/[id]', params: { id: item.id } })
          }>
          {selecting ? (
            <PopIn key={isSelected ? 'on' : 'off'} style={[styles.icon, isSelected && styles.iconSelected]}>
              <Ionicons
                name={isSelected ? 'checkmark' : 'ellipse-outline'}
                size={20}
                color={isSelected ? colors.white : colors.textMuted}
              />
            </PopIn>
          ) : (
            <View style={styles.icon}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            </View>
          )}
          <View style={styles.body}>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.rowText} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.rowDate}>{item.createdAt} UTC</Text>
          </View>
          <View style={styles.side}>
            {!item.read && <Pulse style={styles.unreadDot} />}
            {!selecting && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
          </View>
        </ScalePressable>
        </FadeIn>
        );
      })}
      {notifications.length > 0 && !selecting && (
        <Text style={styles.hint}>Long-press a notification to select and delete it.</Text>
      )}
    </ScrollView>
    </View>
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
  rowSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: '#F4F8FE' },
  iconSelected: { backgroundColor: colors.primary },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs },
  bar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  barTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  barActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  barButton: { flex: 1 },
  deleteButton: { backgroundColor: colors.error },
  trash: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.subtleStatus,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, marginTop: spacing.sm },
  side: { alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
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
