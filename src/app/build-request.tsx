import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { errorMessage } from '@/api/client';
import { DateField } from '@/components/DateField';
import { Button, Card } from '@/components/ui';
import { useAuth } from '@/state/auth';
import { useStore } from '@/state/store';
import { colors, fonts, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';
import { isValidFutureDate } from '@/utils/validate';

export default function BuildRequestScreen() {
  useStatusBar('dark');
  const { user, ready } = useAuth();
  const { build, addItinerary } = useStore();
  const [date, setDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && !user) {
    return <Redirect href={{ pathname: '/sign-in', params: { next: '/build-request' } }} />;
  }
  if (!user) return null;

  async function submit() {
    if (!isValidFutureDate(date)) {
      setDateError('Choose a start date.');
      return;
    }
    setFailure('');
    setBusy(true);
    try {
      await addItinerary(date.trim());
      router.dismissTo('/activity');
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
        <Card>
          <Text style={styles.cardLabel}>Your trip so far</Text>
          {build.startingPoint && <Text style={styles.line}>Starting point: {build.startingPoint}</Text>}
          <Text style={styles.line}>Stay: {build.stay}</Text>
          <Text style={styles.line}>Travel: {build.transport}</Text>
          <Text style={styles.line}>
            Activities: {build.activities.length > 0 ? build.activities.join(', ') : 'None yet'}
          </Text>
        </Card>

        <Text style={styles.requestingAs}>Requesting as {user.name} ({user.email})</Text>

        <DateField
          label="Start date"
          value={date}
          error={dateError || undefined}
          onChange={(text) => {
            setDate(text);
            setDateError('');
          }}
        />

        <Text style={styles.note}>Our team will use these choices to plan your custom itinerary.</Text>
        {failure !== '' && <Text style={styles.error}>{failure}</Text>}
        <Button
          label={busy ? 'Sending…' : 'Send my trip request'}
          style={styles.submit}
          onPress={busy ? () => undefined : submit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  cardLabel: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, marginBottom: spacing.xs },
  line: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  requestingAs: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.error, marginTop: spacing.md },
  submit: { marginTop: spacing.lg },
});
