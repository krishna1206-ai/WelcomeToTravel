import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/api/client';
import { Avatar } from '@/components/Avatar';
import { FadeIn } from '@/components/Motion';
import { Button, Card, Field, TextLink } from '@/components/ui';
import { useAuth, type User } from '@/state/auth';
import { colors, fonts, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';
import { isValidEmail, isValidPhone } from '@/utils/validate';

const MIN_PASSWORD = 8;

function PhotoCard({ user }: { user: User }) {
  const { changePhoto, removePhoto } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(action: () => Promise<void>) {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  async function choosePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) await save(() => changePhoto(result.assets[0]));
  }

  return (
    <Card>
      <View style={styles.photoRow}>
        <Avatar user={user} size={72} />
        <View style={styles.photoBody}>
          <Text style={styles.photoName}>{user.name}</Text>
          <View style={styles.photoActions}>
            <TextLink
              label={busy ? 'Saving…' : user.photo ? 'Change photo' : 'Add photo'}
              onPress={busy ? () => undefined : choosePhoto}
            />
            {user.photo && !busy && <TextLink label="Remove" onPress={() => save(removePhoto)} />}
          </View>
        </View>
      </View>
      {error !== '' && <Text style={styles.error}>{error}</Text>}
    </Card>
  );
}

function DetailsCard({ user }: { user: User }) {
  const { updateProfile } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [city, setCity] = useState(user.city);
  const [state, setState] = useState(user.state);
  const [country, setCountry] = useState(user.country);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setDone(false);
    if (!name.trim() || !city.trim() || !state.trim() || !country.trim()) {
      setError('Fill in your name, city, state and country.');
      return;
    }
    if (!isValidPhone(phone)) {
      setError('Enter a valid mobile number.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
      });
      setDone(true);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Your details</Text>
      <Field label="Full name" value={name} autoComplete="name" onChangeText={setName} />
      <Field label="Mobile number" value={phone} autoComplete="tel" keyboardType="phone-pad" onChangeText={setPhone} />
      <Field label="City" value={city} onChangeText={setCity} />
      <Field label="State" value={state} onChangeText={setState} />
      <Field label="Country" value={country} autoComplete="country" onChangeText={setCountry} />
      {error !== '' && <Text style={styles.error}>{error}</Text>}
      {done && <Text style={styles.success}>Your details are saved.</Text>}
      <Button
        label={busy ? 'Saving…' : 'Save details'}
        style={styles.submit}
        onPress={busy ? () => undefined : submit}
      />
    </Card>
  );
}

function EmailCard({ user }: { user: User }) {
  const { changeEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setDone(false);
    if (!isValidEmail(email) || !password) {
      setError('Enter the new email and your current password.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await changeEmail(email.trim(), password);
      setEmail('');
      setPassword('');
      setDone(true);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Change email</Text>
      <Text style={styles.cardText}>You sign in with this email. Current email: {user.email}</Text>
      <Field
        label="New email"
        value={email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={setEmail}
      />
      <Field
        label="Current password for email change"
        value={password}
        autoCapitalize="none"
        autoComplete="current-password"
        secureTextEntry
        onChangeText={setPassword}
      />
      {error !== '' && <Text style={styles.error}>{error}</Text>}
      {done && <Text style={styles.success}>Email updated.</Text>}
      <Button
        label={busy ? 'Saving…' : 'Save new email'}
        style={styles.submit}
        onPress={busy ? () => undefined : submit}
      />
    </Card>
  );
}

function PasswordCard() {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setDone(false);
    if (!current) {
      setError('Enter your current password.');
      return;
    }
    if (next.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your new password.`);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setDone(true);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>Change password</Text>
      <Text style={styles.cardText}>This signs you out on your other devices.</Text>
      <Field
        label="Current password"
        value={current}
        autoCapitalize="none"
        autoComplete="current-password"
        secureTextEntry
        onChangeText={setCurrent}
      />
      <Field
        label="New password"
        value={next}
        autoCapitalize="none"
        autoComplete="new-password"
        secureTextEntry
        onChangeText={setNext}
      />
      {error !== '' && <Text style={styles.error}>{error}</Text>}
      {done && <Text style={styles.success}>Password changed.</Text>}
      <Button
        label={busy ? 'Saving…' : 'Save new password'}
        style={styles.submit}
        onPress={busy ? () => undefined : submit}
      />
    </Card>
  );
}

export default function AccountScreen() {
  useStatusBar('dark');
  const { user, ready, signOut, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (ready && !user) return <Redirect href="/" />;
  if (!user) return null;

  async function confirmDelete() {
    setError('');
    try {
      await deleteAccount(password);
      router.replace('/');
    } catch (failure) {
      setError(errorMessage(failure));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FadeIn>
          <PhotoCard user={user} />
        </FadeIn>
        <FadeIn delay={90}>
          <DetailsCard user={user} />
        </FadeIn>
        <FadeIn delay={180}>
          <EmailCard user={user} />
        </FadeIn>
        <FadeIn delay={270}>
          <PasswordCard />
        </FadeIn>

        <Button
          label="Sign out"
          variant="outline"
          style={styles.signOut}
          onPress={() => {
            signOut().then(() => router.replace('/'));
          }}
        />

        {deleting ? (
          <Card style={styles.delete}>
            <Text style={styles.deleteTitle}>Delete your account?</Text>
            <Text style={styles.deleteText}>
              This can’t be undone. Your saved trips and messages are deleted and your name and contact
              details are removed from your bookings.
            </Text>
            <Field
              label="Enter your password to confirm"
              value={password}
              error={error || undefined}
              onChangeText={setPassword}
              autoCapitalize="none"
              secureTextEntry
            />
            <Button label="Delete my account" style={styles.deleteButton} onPress={confirmDelete} />
            <Pressable style={styles.cancel} accessibilityRole="button" onPress={() => setDeleting(false)}>
              <Text style={styles.cancelText}>Keep my account</Text>
            </Pressable>
          </Card>
        ) : (
          <Pressable style={styles.cancel} accessibilityRole="button" onPress={() => setDeleting(true)}>
            <Text style={styles.deleteLink}>Delete account</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  photoBody: { flex: 1 },
  photoName: { fontFamily: fonts.display, fontSize: 21, color: colors.text },
  photoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.sm },
  card: { marginTop: spacing.lg },
  cardTitle: { fontFamily: fonts.display, fontSize: 21, color: colors.text },
  cardText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.error, marginTop: spacing.md },
  success: { fontFamily: fonts.medium, fontSize: 14, color: '#14703A', marginTop: spacing.md },
  submit: { marginTop: spacing.lg },
  signOut: { marginTop: spacing.lg },
  delete: { marginTop: spacing.xl },
  deleteTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  deleteText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  deleteButton: { marginTop: spacing.lg, backgroundColor: colors.error },
  cancel: { alignItems: 'center', padding: spacing.md, marginTop: spacing.sm },
  cancelText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  deleteLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.error },
});
