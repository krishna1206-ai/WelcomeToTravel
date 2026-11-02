import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { errorMessage } from '@/api/client';
import { FadeIn, PopIn } from '@/components/Motion';
import { Button, Field } from '@/components/ui';
import { safeNext, useAuth } from '@/state/auth';
import { colors, fonts, radius, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';
import { isValidEmail } from '@/utils/validate';

export default function SignInScreen() {
  useStatusBar('dark');
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!isValidEmail(email) || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await signIn(email.trim(), password, remember);
      router.replace(safeNext(next));
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FadeIn>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.intro}>Sign in to book your trip and see your requests.</Text>
        </FadeIn>

        <FadeIn delay={100}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
          />
        </FadeIn>
        <FadeIn delay={180}>
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            autoComplete="current-password"
            secureTextEntry
          />
        </FadeIn>

        <Pressable
          style={styles.forgot}
          hitSlop={8}
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/forgot-password', params: email.trim() ? { email: email.trim() } : {} })}>
          <Text style={styles.switchLink}>Forgot password?</Text>
        </Pressable>

        <Pressable
          style={styles.remember}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: remember }}
          onPress={() => setRemember((value) => !value)}>
          <View style={[styles.checkbox, remember && styles.checkboxOn]}>
            {remember && (
              <PopIn>
                <Ionicons name="checkmark" size={16} color={colors.white} />
              </PopIn>
            )}
          </View>
          <Text style={styles.rememberText}>Remember me</Text>
        </Pressable>

        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <Button
          label={busy ? 'Signing in…' : 'Sign in'}
          attention
          style={styles.submit}
          onPress={busy ? () => undefined : submit}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don’t have an account?</Text>
          <Pressable
            hitSlop={8}
            accessibilityRole="link"
            onPress={() => router.replace({ pathname: '/sign-up', params: next ? { next } : {} })}>
            <Text style={styles.switchLink}>Sign up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  intro: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  forgot: { alignSelf: 'flex-end', marginTop: spacing.md },
  remember: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm - 2,
    borderWidth: 1.5,
    borderColor: '#A5AFC2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  rememberText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.error, marginTop: spacing.md },
  submit: { marginTop: spacing.lg },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  switchText: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
  switchLink: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
});
