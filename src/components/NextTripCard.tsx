import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { FadeIn, Pulse, ScalePressable, SlowZoom } from '@/components/Motion';
import { useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { countdownLabel, daysUntil, nextBooking } from '@/utils/trips';

// Only appears once someone has a trip coming up.
export function NextTripCard() {
  const { bookings, getTour } = useStore();
  const booking = nextBooking(bookings);
  if (!booking) return null;

  const tour = getTour(booking.tourId ?? undefined);
  const label = countdownLabel(daysUntil(booking.date));

  return (
    <FadeIn delay={40} style={styles.wrap}>
      <ScalePressable
        style={styles.card}
        pressedScale={0.98}
        accessibilityRole="button"
        accessibilityLabel={`My Trip: ${booking.tourTitle}, ${label}`}
        onPress={() => router.push({ pathname: '/my-trip/[id]', params: { id: booking.id } })}>
        {tour?.photo && (
          <SlowZoom style={StyleSheet.absoluteFill}>
            <Image source={tour.photo} style={StyleSheet.absoluteFill} contentFit="cover" />
          </SlowZoom>
        )}
        <LinearGradient
          colors={['rgba(11,20,46,0.35)', 'rgba(11,20,46,0.85)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.body}>
          <Text style={styles.eyebrow}>My Trip</Text>
          <Text style={styles.title}>{booking.tourTitle}</Text>
          <View style={styles.footer}>
            <Pulse style={styles.countdown}>
              <Ionicons name="time-outline" size={15} color={colors.primaryText} />
              <Text style={styles.countdownText}>{label}</Text>
            </Pulse>
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
          </View>
        </View>
      </ScalePressable>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  card: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  body: { padding: spacing.lg },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.white,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.white, marginTop: spacing.xs },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  countdownText: { fontFamily: fonts.bold, fontSize: 13, color: colors.primaryText },
});
