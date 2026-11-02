import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { api, errorMessage } from '@/api/client';
import { Button, Field } from '@/components/ui';
import { colors, fonts, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';
import { isValidEmail } from '@/utils/validate';

const MIN_PASSWORD = 8;

export default function ForgotPasswordScreen() {
  useStatusBar('dark');
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api('/api/auth/forgot-password', { method: 'POST', body: { email: email.trim() } });
      setCodeSent(true);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!code.trim()) {
      setError('Enter the code from your email.');
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your new password.`);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: { email: email.trim(), code: code.trim(), newPassword: password },
      });
      router.dismissTo('/sign-in');
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
        <Text style={styles.title}>Reset your password</Text>

        {codeSent ? (
          <>
            <Text style={styles.intro}>
              If {email.trim()} has an account, we’ve emailed it a 6-digit code. It expires in 15 minutes.
            </Text>
            <Field
              label="Code"
              value={code}
              onChangeText={setCode}
              autoComplete="one-time-code"
              keyboardType="number-pad"
              maxLength={6}
            />
            <Field
              label="New password"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              secureTextEntry
            />
            {error !== '' && <Text style={styles.error}>{error}</Text>}
            <Button
              label={busy ? 'Saving…' : 'Save new password'}
              style={styles.submit}
              onPress={busy ? () => undefined : resetPassword}
            />
            <Pressable
              style={styles.again}
              hitSlop={8}
              accessibilityRole="button"
              onPress={() => {
                setError('');
                setCodeSent(false);
              }}>
              <Text style={styles.link}>Use a different email or send again</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.intro}>Enter your account email and we’ll send you a code.</Text>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
            />
            {error !== '' && <Text style={styles.error}>{error}</Text>}
            <Button
              label={busy ? 'Sending…' : 'Send code'}
              style={styles.submit}
              onPress={busy ? () => undefined : sendCode}
            />
          </>
        )}
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
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.error, marginTop: spacing.md },
  submit: { marginTop: spacing.lg },
  again: { alignItems: 'center', marginTop: spacing.xl },
  link: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
});
