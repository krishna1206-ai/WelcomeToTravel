import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useState } from 'react';
import {
  Animated,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { FadeIn, Float, NATIVE_DRIVER, Reveal, useReducedMotion, useRevealOnScroll } from '@/components/Motion';
import { RatingBadge } from '@/components/Stars';
import { TourGallery } from '@/components/TourGallery';
import { TourInclusions } from '@/components/TourInclusions';
import { TourReviews } from '@/components/TourReviews';
import { Button, RoundButton, Timeline, type IconName } from '@/components/ui';
import { SITE } from '@/data/content';
import { ToursStatus } from '@/components/ToursStatus';
import { formatPrice, type Tour } from '@/data/tours';
import { useRequireAuth } from '@/state/auth';
import { useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';

const PHOTO_HEIGHT = 320;
const SHEET_OVERLAP = 28;

function Fact({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <View style={styles.factIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.factBody}>
        <Text style={styles.factValue}>{value}</Text>
        <Text style={styles.factLabel}>{label}</Text>
      </View>
    </View>
  );
}

// Empty or unfinished values like "[DURATION]" are left out instead of shown to customers.
function tourFacts(tour: Tour): { icon: IconName; label: string; value: string }[] {
  const facts: { icon: IconName; label: string; value: string | undefined }[] = [
    { icon: 'calendar-outline', label: 'Tour length', value: tour.duration },
    { icon: 'location-outline', label: 'Start & end', value: tour.subtitle },
    { icon: 'map-outline', label: 'Travel style', value: tour.style },
    { icon: 'bus-outline', label: 'Transport', value: tour.transport },
    { icon: 'people-outline', label: 'Group size', value: tour.groupSize },
    { icon: 'gift-outline', label: 'Traveller age', value: tour.ageRange },
  ];
  return facts.flatMap((fact) =>
    fact.value && !fact.value.startsWith('[') ? [{ ...fact, value: fact.value }] : [],
  );
}

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export default function TourDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { savedIds, toggleSaved, getTour, toursStatus } = useStore();
  const requireAuth = useRequireAuth();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const reveal = useRevealOnScroll();
  const [pastPhoto, setPastPhoto] = useState(false);
  const [scrollY] = useState(() => new Animated.Value(0));
  const tour = getTour(id);
  useStatusBar(tour && !pastPhoto ? 'light' : 'dark');

  if (!tour && toursStatus !== 'ready') {
    return (
      <SafeAreaView style={styles.screen}>
        <ToursStatus />
      </SafeAreaView>
    );
  }

  if (!tour) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.missing}>This tour could not be found.</Text>
        <Pressable style={styles.missingBack} accessibilityRole="button" onPress={goBack}>
          <Text style={styles.missingBackText}>Back to tours</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const saved = savedIds.includes(tour.id);

  function shareTour() {
    if (!tour) return;
    Share.share({ message: `${tour.title} with ${SITE.name}: ${tour.summary}` }).catch((error) =>
      console.warn('Could not share tour', error),
    );
  }

  // The photo drifts slower than the page as it scrolls, and stretches on an iPhone pull-down.
  const photoTranslateY = scrollY.interpolate({
    inputRange: [-PHOTO_HEIGHT, 0, PHOTO_HEIGHT],
    outputRange: [-PHOTO_HEIGHT / 2, 0, PHOTO_HEIGHT * 0.4],
  });
  const photoScale = scrollY.interpolate({
    inputRange: [-PHOTO_HEIGHT, 0],
    outputRange: [2, 1],
    extrapolateRight: 'clamp',
  });

  return (
    <reveal.Provider value={reveal.value}>
    <View style={styles.screen}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: NATIVE_DRIVER,
          listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            reveal.onScroll();
            const sheetTop = PHOTO_HEIGHT - SHEET_OVERLAP - insets.top;
            const nextPastPhoto = event.nativeEvent.contentOffset.y > sheetTop;
            if (nextPastPhoto !== pastPhoto) {
              setPastPhoto(nextPastPhoto);
              setStatusBarStyle(nextPastPhoto ? 'dark' : 'light');
            }
          },
        })}>
        <View>
          <Animated.View
            style={reduced ? undefined : { transform: [{ translateY: photoTranslateY }, { scale: photoScale }] }}>
            <TourGallery tour={tour} height={PHOTO_HEIGHT} />
          </Animated.View>
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0)']}
            style={[styles.scrim, { height: insets.top + 90 }]}
            pointerEvents="none"
          />
        </View>
        <FadeIn delay={80} distance={40} duration={480} style={styles.sheet}>
          <View style={styles.tagRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{tour.badge}</Text>
            </View>
            <Text style={styles.subtitle}>{tour.subtitle}</Text>
          </View>
          <Text style={styles.title}>{tour.title}</Text>
          <RatingBadge rating={tour.rating} count={tour.reviewCount} />

          <View style={styles.facts}>
            {tourFacts(tour).map((fact, index) => (
              <Reveal key={fact.label} delay={(index % 2) * 70} style={styles.factCell}>
                <Fact icon={fact.icon} label={fact.label} value={fact.value} />
              </Reveal>
            ))}
          </View>

          <Text style={styles.description}>{tour.description}</Text>

          {tour.highlights.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Highlights</Text>
              <View style={styles.chips}>
                {tour.highlights.map((item) => (
                  <View key={item} style={styles.chip}>
                    <Text style={styles.chipText}>{item}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <TourInclusions tour={tour} />

          {(tour.pickupPoints ?? []).length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Pick-up points</Text>
              <View style={styles.pickups}>
                {(tour.pickupPoints ?? []).map((point) => (
                  <View key={point} style={styles.pickup}>
                    <Ionicons name="location-outline" size={18} color={colors.primary} />
                    <Text style={styles.pickupText}>{point}</Text>
                  </View>
                ))}
                <Text style={styles.pickupNote}>You’ll choose one when you book.</Text>
              </View>
            </>
          )}

          {tour.route.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Your route</Text>
              <Timeline
                items={tour.route.map((stop) => ({
                  key: stop.place,
                  title: stop.place,
                  text: stop.note,
                }))}
              />
            </>
          )}

          <TourReviews tourId={tour.id} />

          <View style={styles.questions}>
            <Float style={styles.questionsIcon}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.accent} />
            </Float>
            <View style={styles.questionsBody}>
              <Text style={styles.questionsTitle}>Questions about this tour?</Text>
              <Text style={styles.questionsText}>Book a free travel call with our team</Text>
            </View>
            <Pressable
              hitSlop={8}
              accessibilityRole="link"
              onPress={() => router.navigate('/help')}>
              <Text style={styles.chat}>Chat</Text>
            </Pressable>
          </View>
        </FadeIn>
      </Animated.ScrollView>

      <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
        <RoundButton icon="chevron-back" label="Go back" onPress={goBack} />
        <View style={styles.topActions}>
          <RoundButton icon="share-outline" label="Share tour" onPress={shareTour} />
          <RoundButton
            icon={saved ? 'heart' : 'heart-outline'}
            iconColor={saved ? colors.brandDot : colors.text}
            label={saved ? 'Remove from saved' : 'Save tour'}
            onPress={() => requireAuth(`/tour/${tour.id}`, () => toggleSaved(tour.id))}
          />
        </View>
      </View>

      <FadeIn
        delay={220}
        distance={60}
        style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <View>
          <Text style={styles.from}>from</Text>
          <Text style={styles.price}>{formatPrice(tour.price)}</Text>
        </View>
        <Button
          label="Book this tour"
          attention
          style={styles.bookButton}
          onPress={() => requireAuth(`/book/${tour.id}`)}
        />
      </FadeIn>
    </View>
    </reveal.Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  missing: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: spacing.xxl,
    color: colors.textMuted,
  },
  missingBack: { alignSelf: 'center', marginTop: spacing.lg, padding: spacing.sm },
  missingBackText: { fontFamily: fonts.bold, color: colors.primary, fontSize: 15 },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  sheet: {
    marginTop: -SHEET_OVERLAP,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: SHEET_OVERLAP,
    borderTopRightRadius: SHEET_OVERLAP,
    backgroundColor: colors.background,
  },
  topBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topActions: { flexDirection: 'row', gap: spacing.sm },
  tagRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 12, color: colors.accent },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  title: {
    fontFamily: fonts.display,
    fontSize: 29,
    lineHeight: 34,
    color: colors.text,
    marginTop: spacing.md,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
    marginTop: spacing.lg,
  },
  factCell: { width: '48.5%' },
  fact: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  factIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factBody: { flex: 1 },
  factValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  factLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  description: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  pickups: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pickup: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  pickupText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.text },
  pickupNote: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primaryText },
  questions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  questionsIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionsBody: { flex: 1 },
  questionsTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  questionsText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginTop: 2,
  },
  chat: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  from: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  price: { fontFamily: fonts.display, fontSize: 22, color: colors.text },
  bookButton: { flex: 1 },
});
