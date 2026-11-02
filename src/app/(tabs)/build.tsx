import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  FadeIn,
  Float,
  PopIn,
  Reveal,
  ScalePressable,
  SlowZoom,
  staggerDelay,
  useRevealOnScroll,
} from '@/components/Motion';
import { ReviewCard } from '@/components/TourReviews';
import { Button, Card, Heading } from '@/components/ui';
import {
  ACTIVITIES,
  BUILD_FACTS,
  BUILD_PLACES,
  BUILD_STEPS,
  FAQS,
  INSPIRATION,
  STAY_OPTIONS,
  TRANSPORT_OPTIONS,
} from '@/data/content';
import { useRequireAuth } from '@/state/auth';
import { useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { useLatestReviews } from '@/utils/useLatestReviews';
import { useStatusBar } from '@/utils/useStatusBar';

function Section({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Reveal>
        <Heading>{title}</Heading>
        {text && <Text style={styles.sectionText}>{text}</Text>}
      </Reveal>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function RadioList({
  options,
  selected,
  onSelect,
}: {
  options: { title: string; text: string }[];
  selected: string;
  onSelect: (title: string) => void;
}) {
  return (
    <>
      {options.map((option) => {
        const active = option.title === selected;
        return (
          <Reveal key={option.title}>
          <ScalePressable
            style={[styles.radio, active && styles.radioActive]}
            pressedScale={0.98}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(option.title)}>
            <View style={styles.radioBody}>
              <Text style={styles.radioTitle}>{option.title}</Text>
              <Text style={styles.radioText}>{option.text}</Text>
            </View>
            <View style={[styles.radioCircle, active && styles.radioCircleActive]}>
              {active && (
                <PopIn>
                  <View style={styles.radioDot} />
                </PopIn>
              )}
            </View>
          </ScalePressable>
          </Reveal>
        );
      })}
    </>
  );
}

function tripSummary(stay: string, transport: string, activityCount: number): string {
  const activities = `${activityCount} ${activityCount === 1 ? 'activity' : 'activities'}`;
  return `${stay} · ${transport} · ${activities}`;
}

export default function BuildScreen() {
  useStatusBar('dark');
  const { build, updateBuild } = useStore();
  const requireAuth = useRequireAuth();
  const [openFaq, setOpenFaq] = useState(0);
  const usingInspiration = build.startingPoint === INSPIRATION.title;
  const reveal = useRevealOnScroll();
  const latestReviews = useLatestReviews();

  function toggleActivity(activity: string) {
    updateBuild({
      activities: build.activities.includes(activity)
        ? build.activities.filter((item) => item !== activity)
        : [...build.activities, activity],
    });
  }

  function applyInspiration() {
    updateBuild({
      startingPoint: INSPIRATION.title,
      activities: [...new Set([...build.activities, ...INSPIRATION.activities])],
    });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <reveal.Provider value={reveal.value}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={48}
        onScroll={reveal.onScroll}>
        <FadeIn distance={-10}>
          <Text style={styles.title}>Build your trip</Text>
        </FadeIn>
        <View style={styles.facts}>
          {BUILD_FACTS.map((fact, index) => (
            <FadeIn key={fact.label} delay={staggerDelay(index)} style={styles.fact}>
              <Text style={styles.factLabel}>{fact.label}</Text>
              <Text style={styles.factValue}>{fact.value}</Text>
            </FadeIn>
          ))}
        </View>

        <Section title="How it works">
          {BUILD_STEPS.map((step, index) => (
            <Reveal key={step.title} delay={index * 50}>
              <View style={styles.step}>
                <Float delay={index * 300} distance={3} style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </Float>
                <View style={styles.stepBody}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              </View>
            </Reveal>
          ))}
        </Section>

        <Reveal>
          <View style={styles.story}>
            <Text style={styles.storyEyebrow}>Our story</Text>
            <Text style={styles.storyTitle}>Made by backpackers, for backpackers</Text>
            <Text style={styles.storyText}>
              No templates. Every trip is planned personally by our Community Team, who have travelled
              the coast themselves and know the hidden gems.
            </Text>
          </View>
        </Reveal>

        <Section title="Where you could go" text="Must-see spots to inspire you. We can add plenty more.">
          <View style={styles.places}>
            {BUILD_PLACES.map((place, index) => (
              <Reveal key={place.title} delay={(index % 2) * 90} style={styles.placeCell}>
                <View style={styles.place}>
                  <View style={styles.placePhotoClip}>
                    <SlowZoom>
                      <Image
                        source={place.photo}
                        style={styles.placePhoto}
                        contentFit="cover"
                        transition={150}
                      />
                    </SlowZoom>
                  </View>
                  <View style={styles.placeBody}>
                    <Text style={styles.placeTitle}>{place.title}</Text>
                    <Text style={styles.placeText}>{place.text}</Text>
                  </View>
                </View>
              </Reveal>
            ))}
          </View>
        </Section>

        <Section
          title="Where you’ll stay"
          text="We only recommend places we’d stay in ourselves: comfortable, social and safe.">
          <RadioList
            options={STAY_OPTIONS}
            selected={build.stay}
            onSelect={(stay) => updateBuild({ stay })}
          />
        </Section>

        <Section
          title="How you’ll travel"
          text="It’s nearly 3,000 km from Melbourne to Cairns. Mix and match to suit your budget.">
          <RadioList
            options={TRANSPORT_OPTIONS}
            selected={build.transport}
            onSelect={(transport) => updateBuild({ transport })}
          />
        </Section>

        <Section title="Bucket list activities" text="Tap to add as many or as few as you like.">
          <View style={styles.chips}>
            {ACTIVITIES.map((activity) => {
              const active = build.activities.includes(activity);
              return (
                <ScalePressable
                  key={activity}
                  style={[styles.chip, active && styles.chipActive]}
                  pressedScale={0.92}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  onPress={() => toggleActivity(activity)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{activity}</Text>
                </ScalePressable>
              );
            })}
          </View>
        </Section>

        <Reveal>
        <Card style={styles.inspiration}>
          <Text style={styles.inspirationEyebrow}>Looking for inspiration?</Text>
          <Text style={styles.inspirationTitle}>{INSPIRATION.title}</Text>
          <Text style={styles.inspirationText}>{INSPIRATION.text}</Text>
          <View style={styles.inspirationStops}>
            {INSPIRATION.stops.map((stop) => (
              <View key={stop.place} style={styles.stop}>
                <View style={styles.stopDot} />
                <View style={styles.stepBody}>
                  <Text style={styles.stopPlace}>{stop.place}</Text>
                  <Text style={styles.stopNote}>{stop.note}</Text>
                </View>
              </View>
            ))}
          </View>
          <Pressable
            style={styles.inspirationButton}
            accessibilityRole="button"
            onPress={applyInspiration}>
            <Text style={styles.inspirationButtonText}>
              {usingInspiration ? 'Added as your starting point ✓' : 'Use this as my starting point'}
            </Text>
          </Pressable>
        </Card>
        </Reveal>

        {latestReviews.reviews.length > 0 && (
          <Section title="What travellers say">
            {latestReviews.reviews.slice(0, 3).map((review) => (
              <Reveal key={review.id}>
                <ReviewCard review={review} showTrip />
              </Reveal>
            ))}
          </Section>
        )}

        <Section title="FAQs">
          {FAQS.map((faq, index) => {
            const open = openFaq === index;
            return (
              <Pressable
                key={faq.question}
                style={styles.faq}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                onPress={() => setOpenFaq(open ? -1 : index)}>
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={open ? 'remove' : 'add'}
                    size={20}
                    color={colors.textMuted}
                  />
                </View>
                {open && (
                  <FadeIn distance={6} duration={220}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </FadeIn>
                )}
              </Pressable>
            );
          })}
        </Section>
      </ScrollView>
      </reveal.Provider>

      <View style={styles.bar}>
        <View style={styles.barBody}>
          <Text style={styles.barLabel}>Your trip so far</Text>
          <Text style={styles.barValue}>
            {tripSummary(build.stay, build.transport, build.activities.length)}
          </Text>
        </View>
        <Button label="Get my itinerary" attention onPress={() => requireAuth('/build-request')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.text, marginBottom: spacing.lg },
  facts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  fact: {
    width: '48.5%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  factLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  factValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginTop: 2 },
  section: { marginTop: spacing.xxl },
  sectionText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sectionBody: { marginTop: spacing.md },
  step: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  stepBody: { flex: 1 },
  stepTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  stepText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 2,
  },
  story: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  storyEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  storyTitle: {
    fontFamily: fonts.display,
    fontSize: 21,
    lineHeight: 26,
    color: '#7A2A0E',
    marginTop: spacing.xs,
  },
  storyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: '#5B2A18',
    marginTop: spacing.sm,
  },
  places: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.md },
  placeCell: { width: '48.5%' },
  placePhotoClip: { overflow: 'hidden' },
  place: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  placePhoto: { width: '100%', height: 100, backgroundColor: colors.primarySoft },
  placeBody: { padding: spacing.md },
  placeTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  placeText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
  },
  radio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  radioActive: { borderColor: colors.primary, borderWidth: 2, backgroundColor: '#F4F8FE' },
  radioBody: { flex: 1 },
  radioTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  radioText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: '#A5AFC2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: radius.pill, backgroundColor: colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  chipTextActive: { fontFamily: fonts.semibold, color: colors.white },
  inspiration: { marginTop: spacing.xxl },
  inspirationEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  inspirationTitle: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.text,
    marginTop: spacing.xs,
  },
  inspirationText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  inspirationStops: { marginTop: spacing.lg },
  stop: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  stopDot: {
    width: 10,
    height: 10,
    marginTop: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  stopPlace: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  stopNote: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 1 },
  inspirationButton: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  inspirationButtonText: { fontFamily: fonts.bold, fontSize: 14, color: colors.primaryText },
  faq: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  faqQuestion: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  faqAnswer: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  barBody: { flex: 1 },
  barLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  barValue: { fontFamily: fonts.bold, fontSize: 13, color: colors.text, marginTop: 2 },
});
