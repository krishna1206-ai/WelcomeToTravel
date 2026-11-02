import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Float, Reveal, useRevealOnScroll } from '@/components/Motion';
import { CtaCard, Heading, Hero, Timeline } from '@/components/ui';
import { ABOUT_HIGHLIGHTS, ABOUT_JOURNEY, SITE } from '@/data/content';
import { PHOTOS } from '@/data/tours';
import { colors, fonts, radius, spacing } from '@/theme';
import { openLink } from '@/utils/links';
import { useStatusBar } from '@/utils/useStatusBar';

export default function AboutScreen() {
  useStatusBar('light');
  const reveal = useRevealOnScroll();

  return (
    <reveal.Provider value={reveal.value}>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={48}
      onScroll={reveal.onScroll}>
      <Hero
        photo={PHOTOS.melbourne}
        eyebrow="Our story"
        title="A passion for travel turned into something more"
        text="Our founders arrived in Australia as backpackers on working holiday visas, just like you."
      />
      <View style={styles.content}>
        <Heading>Highlights</Heading>
        <View style={styles.highlights}>
          {ABOUT_HIGHLIGHTS.map((item, index) => (
            <Reveal key={item.title} delay={index * 70}>
              <View style={styles.highlight}>
                <Float delay={index * 300} style={styles.highlightIcon}>
                  <Ionicons name="trophy-outline" size={22} color={colors.accent} />
                </Float>
                <View style={styles.highlightBody}>
                  <Text style={styles.highlightTitle}>{item.title}</Text>
                  <Text style={styles.highlightText}>{item.text}</Text>
                </View>
              </View>
            </Reveal>
          ))}
        </View>

        <View style={styles.journey}>
          <Heading>Our journey</Heading>
          <View style={styles.timeline}>
            <Timeline
              items={ABOUT_JOURNEY.map((item) => ({
                key: item.title + item.text,
                eyebrow: item.when,
                title: item.title,
                text: item.text,
              }))}
            />
          </View>
        </View>

        <Reveal style={styles.cta}>
          <CtaCard
            eyebrow="The future"
            title="Want to be part of the story?"
            text="We’re always looking for good people who love travel as much as we do."
            action="See open roles"
            onPress={() => openLink('Open roles', SITE.links.careers)}
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
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  highlights: { marginTop: spacing.md, gap: spacing.md },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  highlightIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightBody: { flex: 1 },
  highlightTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  highlightText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
  },
  journey: { marginTop: spacing.xxl },
  timeline: { marginTop: spacing.lg },
  cta: { marginTop: spacing.xxl },
});
