import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/api/client';
import { TextLink } from '@/components/ui';
import { useStore, type Booking } from '@/state/store';
import { colors, fonts, spacing } from '@/theme';
import { formatMoney, useBookingTerms } from '@/utils/money';

export function BookingPayment({ booking }: { booking: Booking }) {
  const { payBooking } = useStore();
  const terms = useBookingTerms();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const currency = terms?.currency ?? 'AUD';
  const due = booking.dueNowCents ? formatMoney(booking.dueNowCents, currency) : '';
  const depositPaid = booking.paymentStatus === 'deposit';

  if (booking.paymentStatus === 'paid') {
    return (
      <Text style={styles.paid}>
        {booking.status === 'cancelled' ? 'Paid. Our team will contact you about your refund.' : 'Paid'}
      </Text>
    );
  }
  if (booking.paymentStatus === 'none') return null;
  if (booking.status === 'cancelled') {
    return depositPaid ? (
      <Text style={styles.paid}>Deposit paid. Our team will contact you about your refund.</Text>
    ) : null;
  }

  return (
    <View style={styles.payment}>
      <View style={styles.paymentRow}>
        <Text style={[styles.line, depositPaid && styles.deposit]}>
          {depositPaid
            ? `Deposit paid · ${due} balance due`
            : booking.paymentPlan === 'deposit'
              ? `Deposit of ${due} pending`
              : `Payment of ${due || 'your booking'} pending`}
        </Text>
        <TextLink
          label={busy ? 'Opening…' : depositPaid ? 'Pay balance' : 'Pay now'}
          onPress={() => {
            if (busy) return;
            setError('');
            setBusy(true);
            payBooking(booking.id)
              .catch((failure) => setError(errorMessage(failure)))
              .finally(() => setBusy(false));
          }}
        />
      </View>
      {error !== '' && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  payment: { marginTop: spacing.xs },
  paymentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  paid: { fontFamily: fonts.semibold, fontSize: 14, color: '#14703A', marginTop: spacing.xs },
  line: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  deposit: { fontFamily: fonts.semibold, color: colors.text },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, marginTop: spacing.sm },
});
