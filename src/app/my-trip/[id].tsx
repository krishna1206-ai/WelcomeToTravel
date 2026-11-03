import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BookingPayment } from '@/components/BookingPayment';
import {
  FadeIn,
  Float,
  NATIVE_DRIVER,
  PopIn,
  Reveal,
  ScalePressable,
  SlowZoom,
  useReducedMotion,
  useRevealOnScroll,
} from '@/components/Motion';
import { Button, Card, Heading, Timeline } from '@/components/ui';
import { PACKING_LIST } from '@/data/content';
import { formatPrice } from '@/data/tours';
import { useAuth } from '@/state/auth';
import { useStore, type RequestStatus } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { countdownLabel, daysUntil } from '@/utils/trips';
import { useStatusBar } from '@/utils/useStatusBar';

const STATUS_TEXT: Record<RequestStatus, string> = {
  new: 'Requested: our team will confirm this soon',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

function checklistKey(bookingId: string) {
  return `welcometo-travel/checklist/${bookingId}`;
}

function Checklist({ bookingId }: { bookingId: string }) {
  const reduced = useReducedMotion();
  const [checked, setChecked] = useState<string[]>([]);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    AsyncStorage.getItem(checklistKey(bookingId))
      .then((raw) => {
        if (raw) setChecked(JSON.parse(raw));
      })
      .catch((error) => console.warn('Could not load checklist', error));
  }, [bookingId]);

  const share = checked.length / PACKING_LIST.length;

  useEffect(() => {
    if (reduced) {
      progress.setValue(share);
      return;
    }
    Animated.spring(progress, {
      toValue: share,
      stiffness: 120,
      damping: 18,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [progress, share, reduced]);

  function toggle(item: string) {
    const next = checked.includes(item) ? checked.filter((value) => value !== item) : [...checked, item];
    setChecked(next);
    AsyncStorage.setItem(checklistKey(bookingId), JSON.stringify(next)).catch((error) =>
      console.warn('Could not save checklist', error),
    );
  }

  return (
    <Card>
      <Text style={styles.checklistCount}>
        {checked.length} of {PACKING_LIST.length} packed
      </Text>
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              transform: [
                { scaleX: progress },
              ],
            },
          ]}
        />
      </View>
      {PACKING_LIST.map((item) => {
        const done = checked.includes(item);
        return (
          <ScalePressable
            key={item}
            style={styles.checkRow}
            pressedScale={0.98}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
            onPress={() => toggle(item)}>
            <View style={[styles.checkbox, done && styles.checkboxOn]}>
              {done && (
                <PopIn>
                  <Ionicons name="checkmark" size={16} color={colors.white} />
                </PopIn>
              )}
            </View>
            <Text style={[styles.checkText, done && styles.checkTextDone]}>{item}</Text>
          </ScalePressable>
        );
      })}
    </Card>
  );
}

export default function MyTripScreen() {
  useStatusBar('light');
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, ready } = useAuth();
  const { bookings, getTour } = useStore();
  const reveal = useRevealOnScroll();

  if (ready && !user) {
    return <Redirect href={{ pathname: '/sign-in', params: { next: `/my-trip/${id}` } }} />;
  }

  const booking = bookings.find((item) => String(item.id) === id);
  if (!booking) return <Text style={styles.missing}>This trip could not be found.</Text>;

  const tour = getTour(booking.tourId ?? undefined);
  const days = daysUntil(booking.date);
  const cancelled = booking.status === 'cancelled';
  const started = days !== null && days < 0;
  const upcoming = days !== null && days >= 0;

  return (
    <reveal.Provider value={reveal.value}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={48}
        onScroll={reveal.onScroll}>
        <View style={styles.hero}>
          {tour?.photo && (
            <SlowZoom style={StyleSheet.absoluteFill}>
              <Image source={tour.photo} style={StyleSheet.absoluteFill} contentFit="cover" />
            </SlowZoom>
          )}
          <LinearGradient
            colors={['rgba(11,20,46,0.25)', 'rgba(11,20,46,0.85)']}
            style={StyleSheet.absoluteFill}
          />
          <FadeIn>
            <Text style={styles.heroTitle}>{booking.tourTitle}</Text>
            <Text style={styles.heroDate}>Starts {booking.date}</Text>
          </FadeIn>
          {!cancelled && (
            <PopIn style={styles.countdown}>
              {days !== null && days > 1 ? (
                <>
                  <Text style={styles.countdownNumber}>{days}</Text>
                  <Text style={styles.countdownLabel}>days to go</Text>
                </>
              ) : (
                <Text style={styles.countdownOnly}>{countdownLabel(days)}</Text>
              )}
            </PopIn>
          )}
        </View>

        <View style={styles.body}>
          <FadeIn delay={120}>
            <Card>
              <Text style={[styles.status, booking.status === 'confirmed' && styles.statusConfirmed, cancelled && styles.statusCancelled]}>
                {STATUS_TEXT[booking.status]}
              </Text>
              <Text style={styles.line}>
                {booking.travellers} {booking.travellers === 1 ? 'traveller' : 'travellers'}
                {booking.total !== null && ` · ${formatPrice(booking.total)}`}
              </Text>
              <BookingPayment booking={booking} />
              {booking.status === 'confirmed' && upcoming && (
                <Text style={styles.reminderNote}>We’ll remind you 7 days and 1 day before you leave.</Text>
              )}
            </Card>
          </FadeIn>

          {!cancelled && (
            <>
              {booking.pickupPoint ? (
                <Reveal style={styles.section}>
                  <Heading>Your pick-up point</Heading>
                  <Card style={styles.sectionBody}>
                    <View style={styles.meeting}>
                      <Float style={styles.meetingIcon}>
                        <Ionicons name="bus-outline" size={22} color={colors.primary} />
                      </Float>
                      <Text style={styles.meetingText}>{booking.pickupPoint}</Text>
                    </View>
                  </Card>
                </Reveal>
              ) : null}

              <Reveal style={styles.section}>
                <Heading>Meeting point</Heading>
                <Card style={styles.sectionBody}>
                  <View style={styles.meeting}>
                    <Float style={styles.meetingIcon}>
                      <Ionicons name="location-outline" size={22} color={colors.primary} />
                    </Float>
                    <Text style={styles.meetingText}>
                      {tour?.meetingPoint || 'Our team will send you the meeting point and time before you leave.'}
                    </Text>
                  </View>
                </Card>
              </Reveal>

              {tour && tour.route.length > 0 && (
                <View style={styles.section}>
                  <Reveal>
                    <Heading>Your route</Heading>
                  </Reveal>
                  <View style={styles.sectionBody}>
                    <Timeline
                      items={tour.route.map((stop) => ({
                        key: stop.place,
                        title: stop.place,
                        text: stop.note,
                      }))}
                    />
                  </View>
                </View>
              )}

              <Reveal style={styles.section}>
                <Heading>What to pack</Heading>
                <View style={styles.sectionBody}>
                  <Checklist bookingId={String(booking.id)} />
                </View>
              </Reveal>
            </>
          )}

          <Reveal style={styles.section}>
            {started && booking.status === 'confirmed' && booking.tourId && (
              <Button
                label="Review this trip"
                attention
                style={styles.action}
                onPress={() => router.push(`/tour/${booking.tourId}`)}
              />
            )}
            <Button label="Message our team" variant="outline" onPress={() => router.push('/chat')} />
          </Reveal>
        </View>
      </ScrollView>
    </reveal.Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl },
  missing: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.textMuted,
  },
  hero: {
    minHeight: 240,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: colors.primary,
    padding: spacing.xl,
  },
  heroTitle: { fontFamily: fonts.display, fontSize: 28, lineHeight: 33, color: colors.white },
  heroDate: { fontFamily: fonts.medium, fontSize: 15, color: colors.white, marginTop: spacing.xs },
  countdown: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  countdownNumber: { fontFamily: fonts.display, fontSize: 30, color: colors.primary },
  countdownLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  countdownOnly: { fontFamily: fonts.bold, fontSize: 18, color: colors.primary },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  status: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  statusConfirmed: { color: '#14703A' },
  statusCancelled: { color: colors.error },
  line: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
  reminderNote: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textMuted, marginTop: spacing.sm },
  section: { marginTop: spacing.xl },
  sectionBody: { marginTop: spacing.md },
  meeting: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  meetingIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.text },
  checklistCount: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.subtleStatus,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressFill: { height: '100%', width: '100%', backgroundColor: colors.primary, transformOrigin: 'left' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm - 2,
    borderWidth: 1.5,
    borderColor: '#A5AFC2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.text },
  checkTextDone: { color: colors.textMuted, textDecorationLine: 'line-through' },
  action: { marginBottom: spacing.md },
});
