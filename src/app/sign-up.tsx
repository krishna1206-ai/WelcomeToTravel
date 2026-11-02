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
import { FadeIn } from '@/components/Motion';
import { Button, Field } from '@/components/ui';
import { safeNext, useAuth } from '@/state/auth';
import { colors, fonts, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';
import { isValidEmail, isValidPhone } from '@/utils/validate';

const MIN_PASSWORD = 8;

type Errors = {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  password?: string;
  confirm?: string;
};

export default function SignUpScreen() {
  useStatusBar('dark');
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const nextErrors: Errors = {};
    if (!name.trim()) nextErrors.name = 'Enter your full name.';
    if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.';
    if (!isValidPhone(phone)) nextErrors.phone = 'Enter a valid mobile number.';
    if (!city.trim()) nextErrors.city = 'Enter your city.';
    if (!state.trim()) nextErrors.state = 'Enter your state.';
    if (!country.trim()) nextErrors.country = 'Enter your country.';
    if (password.length < MIN_PASSWORD) {
      nextErrors.password = `Use at least ${MIN_PASSWORD} characters.`;
    }
    if (confirm !== password) nextErrors.confirm = 'Passwords don’t match.';
    setErrors(nextErrors);
    setFailure('');
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        password,
      });
      router.replace(safeNext(next));
    } catch (error) {
      setFailure(errorMessage(error));
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
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.intro}>You’ll need an account to book a trip.</Text>
        </FadeIn>

        <Field label="Full name" value={name} error={errors.name} autoComplete="name" onChangeText={setName} />
        <Field
          label="Email"
          value={email}
          error={errors.email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <Field
          label="Mobile number"
          value={phone}
          error={errors.phone}
          onChangeText={setPhone}
          autoComplete="tel"
          keyboardType="phone-pad"
        />
        <Field label="City" value={city} error={errors.city} onChangeText={setCity} />
        <Field label="State" value={state} error={errors.state} onChangeText={setState} />
        <Field
          label="Country"
          value={country}
          error={errors.country}
          autoComplete="country"
          onChangeText={setCountry}
        />
        <Field
          label="Password"
          value={password}
          error={errors.password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          secureTextEntry
        />
        <Field
          label="Confirm password"
          value={confirm}
          error={errors.confirm}
          onChangeText={setConfirm}
          autoCapitalize="none"
          autoComplete="new-password"
          secureTextEntry
        />

        {failure !== '' && <Text style={styles.error}>{failure}</Text>}

        <Button
          label={busy ? 'Creating account…' : 'Sign up'}
          attention
          style={styles.submit}
          onPress={busy ? () => undefined : submit}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Already have an account?</Text>
          <Pressable
            hitSlop={8}
            accessibilityRole="link"
            onPress={() => router.replace({ pathname: '/sign-in', params: next ? { next } : {} })}>
            <Text style={styles.switchLink}>Sign in</Text>
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
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.error, marginTop: spacing.md },
  submit: { marginTop: spacing.xl },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  switchText: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
  switchLink: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
});
