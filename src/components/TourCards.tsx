import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScalePressable, Shine } from '@/components/Motion';
import { RatingBadge } from '@/components/Stars';
import { formatPrice, type Tour } from '@/data/tours';
import { colors, fonts, radius, spacing } from '@/theme';

function openTour(tour: Tour) {
  router.push(`/tour/${tour.id}`);
}

export function TourFeatureCard({ tour }: { tour: Tour }) {
  return (
    <ScalePressable
      style={styles.feature}
      pressedScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={tour.title}
      onPress={() => openTour(tour)}>
      <View>
        <Image source={tour.photo} style={styles.featurePhoto} contentFit="cover" transition={150} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{tour.badge}</Text>
        </View>
      </View>
      <View style={styles.featureBody}>
        <Text style={styles.featureRoute}>
          {tour.subtitle} · {tour.duration}
        </Text>
        <Text style={styles.featureTitle}>{tour.title}</Text>
        <RatingBadge rating={tour.rating} count={tour.reviewCount} />
        <Text style={styles.featureSummary}>{tour.summary}</Text>
        <View style={styles.featureFooter}>
          <Text style={styles.from}>
            from <Text style={styles.featurePrice}>{formatPrice(tour.price)}</Text>
          </Text>
          {/* Looks like a button, but the whole card is what gets tapped. */}
          <View style={styles.featureAction}>
            <Text style={styles.featureActionText}>Check it out</Text>
            <Shine />
          </View>
        </View>
      </View>
    </ScalePressable>
  );
}

export function TourRow({ tour }: { tour: Tour }) {
  return (
    <ScalePressable
      style={styles.row}
      pressedScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={tour.title}
      onPress={() => openTour(tour)}>
      <Image source={tour.photo} style={styles.rowPhoto} contentFit="cover" transition={150} />
      <View style={styles.rowBody}>
        <Text style={styles.rowBadge}>{tour.badge}</Text>
        <Text style={styles.rowTitle}>{tour.title}</Text>
        <Text style={styles.rowSubtitle}>{tour.subtitle}</Text>
        <RatingBadge rating={tour.rating} count={tour.reviewCount} />
        <Text style={styles.rowFrom}>
          from <Text style={styles.rowPrice}>{formatPrice(tour.price)}</Text>
        </Text>
      </View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  feature: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  featurePhoto: { width: '100%', height: 170, backgroundColor: colors.primarySoft },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.accent },
  featureBody: { padding: spacing.lg },
  featureRoute: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  featureTitle: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.text,
    marginTop: spacing.xs,
  },
  featureSummary: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  featureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  featureAction: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
  },
  featureActionText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  from: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  featurePrice: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  rowPhoto: { width: 100, backgroundColor: colors.primarySoft },
  rowBody: { flex: 1, padding: spacing.md },
  rowBadge: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  rowTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginTop: 2 },
  rowSubtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  rowFrom: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
  rowPrice: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
});
