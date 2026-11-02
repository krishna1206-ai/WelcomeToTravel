import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/client';
import { FadeIn, ScalePressable } from '@/components/Motion';
import { useAuth } from '@/state/auth';
import { CHAT_NAME, useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';

const CHAT_REFRESH_MS = 5000;
const MAX_MESSAGE = 1000;

export default function ChatScreen() {
  useStatusBar('dark');
  const { user, ready } = useAuth();
  const { chat, unreadChat, refreshChat, sendChatMessage, markChatRead } = useStore();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshChat();
      const timer = setInterval(refreshChat, CHAT_REFRESH_MS);
      return () => clearInterval(timer);
    }, [refreshChat]),
  );

  useFocusEffect(
    useCallback(() => {
      if (unreadChat > 0) markChatRead();
    }, [unreadChat, markChatRead]),
  );

  if (ready && !user) {
    return <Redirect href={{ pathname: '/sign-in', params: { next: '/chat' } }} />;
  }
  if (!user) return null;

  async function send() {
    const message = draft.trim();
    if (!message || busy) return;
    setError('');
    setBusy(true);
    try {
      await sendChatMessage(message);
      setDraft('');
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <ScrollView
        ref={scroll}
        style={styles.screen}
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        {chat.length === 0 && (
          <Text style={styles.empty}>Send us a message and our team will reply here.</Text>
        )}
        {chat.map((item) => {
          const mine = item.sender === 'customer';
          return (
            <FadeIn
              key={item.id}
              distance={10}
              duration={240}
              style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              {!mine && <Text style={styles.name}>{CHAT_NAME}</Text>}
              <Text style={[styles.body, mine && styles.bodyMine]}>{item.body}</Text>
              <Text style={[styles.time, mine && styles.timeMine]}>{item.createdAt} UTC</Text>
            </FadeIn>
          );
        })}
      </ScrollView>

      {error !== '' && <Text style={styles.error}>{error}</Text>}
      <View style={[styles.composer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.input}
          placeholder="Write a message"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel="Write a message"
          value={draft}
          maxLength={MAX_MESSAGE}
          multiline
          onChangeText={setDraft}
        />
        <ScalePressable
          style={[styles.send, (!draft.trim() || busy) && styles.sendDisabled]}
          pressedScale={0.85}
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !draft.trim() || busy }}
          disabled={!draft.trim() || busy}
          onPress={send}>
          <Ionicons name="send" size={18} color={colors.white} />
        </ScalePressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  messages: { flexGrow: 1, justifyContent: 'flex-end', padding: spacing.lg, gap: spacing.sm },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, padding: spacing.md },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  theirs: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary, marginBottom: 2 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.text },
  bodyMine: { color: colors.white },
  time: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: spacing.xs },
  timeMine: { color: colors.primarySoft },
  error: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.error,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
});
