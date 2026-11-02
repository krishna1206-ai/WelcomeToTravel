import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { errorMessage } from '@/api/client';
import { BookingPayment } from '@/components/BookingPayment';
import { FadeIn, Reveal, ScalePressable, useRevealOnScroll } from '@/components/Motion';
import { TourRow } from '@/components/TourCards';
import { Button, Card, Heading, TextLink } from '@/components/ui';
import { formatPrice } from '@/data/tours';
import { useAuth } from '@/state/auth';
import { useStore, type RequestStatus } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';

const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'Requested',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

function RequestCard({
  title,
  status,
  onCancel,
  children,
}: {
  title: string;
  status: RequestStatus;
  onCancel: () => Promise<void>;
  children: ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
      <View style={styles.cardFooter}>
        <View style={[styles.status, status === 'confirmed' && styles.statusConfirmed]}>
          <Text style={[styles.statusText, status === 'confirmed' && styles.statusTextConfirmed]}>
            {STATUS_LABELS[status]}
          </Text>
        </View>
        {status !== 'cancelled' && (
          <Pressable
            hitSlop={8}
            accessibilityRole="button"
            onPress={() => {
              if (!confirming) {
                setConfirming(true);
                return;
              }
              onCancel().catch((failure) => setError(errorMessage(failure)));
            }}>
            <Text style={styles.cancel}>{confirming ? 'Tap again to confirm' : 'Cancel'}</Text>
          </Pressable>
        )}
      </View>
      {error !== '' && <Text style={styles.error}>{error}</Text>}
    </Card>
  );
}

export default function ActivityScreen() {
  useStatusBar('dark');
  const { user } = useAuth();
  const { tours, savedIds, bookings, itineraries, cancelBooking, cancelItinerary } = useStore();
  const reveal = useRevealOnScroll();

  if (!user) {
    return (
      <View style={styles.guest}>
        <Ionicons name="person-circle-outline" size={56} color={colors.primary} />
        <Text style={styles.guestTitle}>Sign in to see your trips</Text>
        <Text style={styles.guestText}>Your saved tours and booking requests will appear here.</Text>
        <Button
          label="Sign in"
          style={styles.guestButton}
          onPress={() => router.push({ pathname: '/sign-in', params: { next: '/activity' } })}
        />
      </View>
    );
  }

  const saved = tours.filter((tour) => savedIds.includes(tour.id));

  return (
    <reveal.Provider value={reveal.value}>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      scrollEventThrottle={48}
      onScroll={reveal.onScroll}>
      <FadeIn distance={-10}>
      <ScalePressable style={styles.account} accessibilityRole="button" onPress={() => router.push('/account')}>
        <View style={styles.accountIcon}>
          <Ionicons name="person-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.accountBody}>
          <Text style={styles.accountName}>{user.name}</Text>
          <Text style={styles.accountEmail}>{user.email}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </ScalePressable>
      </FadeIn>

      <View style={styles.section}>
        <Heading>Saved tours</Heading>
        <View style={styles.body}>
          {saved.length > 0 ? (
            saved.map((tour) => (
              <Reveal key={tour.id}>
                <TourRow tour={tour} />
              </Reveal>
            ))
          ) : (
            <Text style={styles.empty}>Tap the heart on a tour to save it here.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Heading>Your requests</Heading>
        <View style={styles.body}>
          {bookings.length === 0 && itineraries.length === 0 && (
            <Text style={styles.empty}>Your booking and trip requests will appear here.</Text>
          )}
          {bookings.map((booking) => (
            <Reveal key={`booking-${booking.id}`}>
            <RequestCard
              title={booking.tourTitle}
              status={booking.status}
              onCancel={() => cancelBooking(booking.id)}>
              <Text style={styles.line}>Starts {booking.date}</Text>
              <Text style={styles.line}>
                {booking.travellers} {booking.travellers === 1 ? 'traveller' : 'travellers'}
                {booking.total !== null && ` · Estimated ${formatPrice(booking.total)}`}
              </Text>
              <BookingPayment booking={booking} />
              {booking.status !== 'cancelled' && (
                <View style={styles.myTrip}>
                  <TextLink
                    label="Open My Trip →"
                    onPress={() => router.push({ pathname: '/my-trip/[id]', params: { id: booking.id } })}
                  />
                </View>
              )}
            </RequestCard>
            </Reveal>
          ))}
          {itineraries.map((request) => (
            <Reveal key={`itinerary-${request.id}`}>
            <RequestCard
              title={request.startingPoint ?? 'Custom East Coast trip'}
              status={request.status}
              onCancel={() => cancelItinerary(request.id)}>
              <Text style={styles.line}>Starts {request.date}</Text>
              <Text style={styles.line}>
                {request.stay} · {request.transport} · {request.activities.length}{' '}
                {request.activities.length === 1 ? 'activity' : 'activities'}
              </Text>
            </RequestCard>
            </Reveal>
          ))}
        </View>
      </View>
    </ScrollView>
    </reveal.Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  guest: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  guestTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  guestText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  guestButton: { marginTop: spacing.lg, alignSelf: 'stretch' },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountBody: { flex: 1 },
  accountName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  accountEmail: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 1 },
  section: { marginTop: spacing.xl },
  body: { marginTop: spacing.md },
  empty: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  card: { marginBottom: spacing.md },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: spacing.xs },
  line: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  myTrip: { marginTop: spacing.sm },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  status: {
    backgroundColor: colors.subtleStatus,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusConfirmed: { backgroundColor: '#DDF5E4' },
  statusText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  statusTextConfirmed: { color: '#14703A' },
  cancel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.error },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, marginTop: spacing.sm },
});
