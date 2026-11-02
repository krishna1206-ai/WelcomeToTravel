import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeIn, NATIVE_DRIVER, Reveal, useReducedMotion, useRevealOnScroll } from '@/components/Motion';
import { TourRow } from '@/components/TourCards';
import { TourFilterBar, useTourFilters } from '@/components/TourFilterBar';
import { CtaCard, Heading, Hero, TextLink } from '@/components/ui';
import { ToursStatus } from '@/components/ToursStatus';
import { PHOTOS } from '@/data/tours';
import { useStore } from '@/state/store';
import { NO_FILTERS } from '@/utils/tourFilters';
import { colors, fonts, radius, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';

const TABS = [
  { key: 'city', label: 'City tours' },
  { key: 'packages', label: 'Packages' },
  { key: 'east', label: 'East Coast' },
];

const SECTIONS: Record<string, { title: string; text: string }> = {
  city: {
    title: '2026 City Tours',
    text: 'Land, settle in and explore Melbourne or Sydney with a group of new mates.',
  },
  packages: {
    title: 'Packages',
    text: 'Our full packages are coming soon. In the meantime, build your own trip below.',
  },
  east: {
    title: 'East Coast Tours',
    text: 'Beaches, rainforest, reef and everything in between. A tour for every trip length.',
  },
};

export default function ToursScreen() {
  useStatusBar('light');
  const { toursIn } = useStore();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab = params.tab && SECTIONS[params.tab] ? params.tab : 'city';
  const section = SECTIONS[tab];
  const tabTours = useMemo(
    () => (tab === 'city' ? toursIn('city') : tab === 'east' ? toursIn('east') : []),
    [tab, toursIn],
  );
  const { filters, setFilters, results: tours } = useTourFilters(tabTours);
  const activeIndex = TABS.findIndex((item) => item.key === tab);
  const reduced = useReducedMotion();
  const reveal = useRevealOnScroll();
  const [segmentWidth, setSegmentWidth] = useState(0);
  const [indicator] = useState(() => new Animated.Value(activeIndex));

  useEffect(() => {
    if (reduced) {
      indicator.setValue(activeIndex);
      return;
    }
    Animated.spring(indicator, {
      toValue: activeIndex,
      stiffness: 260,
      damping: 24,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  }, [indicator, activeIndex, reduced]);

  const translateX = indicator.interpolate({
    inputRange: [0, TABS.length - 1],
    outputRange: [0, segmentWidth * (TABS.length - 1)],
  });

  return (
    <reveal.Provider value={reveal.value}>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={48}
      onScroll={reveal.onScroll}>
      <Hero
        photo={PHOTOS.whitsundays}
        eyebrow="2026 & 2027 tours"
        title="Pick your adventure"
        text="City tours, full packages or the classic East Coast."
      />
      <View style={styles.content}>
        <View
          style={styles.segments}
          onLayout={(event) =>
            setSegmentWidth((event.nativeEvent.layout.width - spacing.xs * 2) / TABS.length)
          }>
          {segmentWidth > 0 && (
            <Animated.View
              style={[styles.segmentIndicator, { width: segmentWidth, transform: [{ translateX }] }]}
            />
          )}
          {TABS.map((item) => {
            const active = item.key === tab;
            return (
              <Pressable
                key={item.key}
                style={styles.segment}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => router.setParams({ tab: item.key })}>
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FadeIn key={tab} distance={10} duration={300} style={styles.sectionHeader}>
          <Heading>{section.title}</Heading>
          <Text style={styles.sectionText}>{section.text}</Text>
        </FadeIn>

        {tab !== 'packages' && <ToursStatus />}
        {tabTours.length > 0 && (
          <TourFilterBar tours={tabTours} filters={filters} onChange={setFilters} resultCount={tours.length} />
        )}
        {tabTours.length > 0 && tours.length === 0 && (
          <View style={styles.noMatch}>
            <Text style={styles.sectionText}>No tours match these filters.</Text>
            <TextLink label="Clear filters" onPress={() => setFilters(NO_FILTERS)} />
          </View>
        )}
        {tours.map((tour, index) => (
          <Reveal key={tour.id} delay={Math.min(index, 3) * 60}>
            <TourRow tour={tour} />
          </Reveal>
        ))}

        <Reveal style={styles.cta}>
          <CtaCard
            title="Can’t find the right fit?"
            text="Build your own East Coast trip. You choose the length, start and end, and we plan the rest."
            action="Start building"
            onPress={() => router.navigate('/build')}
          />
        </Reveal>
      </View>
    </ScrollView>
    </reveal.Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xl },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  segments: {
    flexDirection: 'row',
    backgroundColor: '#E6EBF3',
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.sm },
  segmentIndicator: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    left: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    boxShadow: '0 1px 3px rgba(16, 26, 51, 0.15)',
  },
  segmentText: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  segmentTextActive: { fontFamily: fonts.semibold, color: colors.text },
  sectionHeader: { marginTop: spacing.xl, marginBottom: spacing.lg },
  sectionText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  noMatch: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  cta: { marginTop: spacing.md },
});
