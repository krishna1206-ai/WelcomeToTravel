import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import {
  FadeIn,
  Float,
  NATIVE_DRIVER,
  Pulse,
  Reveal,
  ScalePressable,
  SlowZoom,
  staggerDelay,
  useReducedMotion,
  useRevealOnScroll,
  useScreenFocused,
} from '@/components/Motion';
import { NextTripCard } from '@/components/NextTripCard';
import { TourFeatureCard } from '@/components/TourCards';
import { ReviewCard } from '@/components/TourReviews';
import { ToursStatus } from '@/components/ToursStatus';
import { Button, Card, Eyebrow, Heading, RoundButton, TextLink } from '@/components/ui';
import { SITE, WHY_TRAVEL } from '@/data/content';
import { PHOTOS } from '@/data/tours';
import { useAuth } from '@/state/auth';
import { useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { openLink } from '@/utils/links';
import { useLatestReviews } from '@/utils/useLatestReviews';
import { useStatusBar } from '@/utils/useStatusBar';

const DESTINATION_WIDTH = 170;
const CAROUSEL_STEP = DESTINATION_WIDTH + spacing.md;
const PHOTO_DRIFT = 28;
const CAROUSEL_ADVANCE_MS = 3200;
const CAROUSEL_RESUME_MS = 6000;

const DESTINATIONS: { label: string; photo: number; href: Href }[] = [
  { label: 'Melbourne', photo: PHOTOS.melbourne, href: '/tours?tab=city' },
  { label: 'Sydney', photo: PHOTOS.sydney, href: '/tours?tab=city' },
  { label: 'East Coast', photo: PHOTOS.eastCoast, href: '/tours?tab=east' },
];

const ADVENTURES: { title: string; text: string; link: string; photo: number; href: Href }[] = [
  {
    title: 'East Coast',
    text: 'Sydney to Cairns, or anywhere in between. The classic backpacker route, your way.',
    link: 'See options →',
    photo: PHOTOS.eastCoast,
    href: '/tours?tab=east',
  },
  {
    title: 'Cities',
    text: 'Want to work down under? Get set up in Melbourne or Sydney in a few days.',
    link: 'Melbourne · Sydney →',
    photo: PHOTOS.melbourne,
    href: '/tours?tab=city',
  },
  {
    title: 'Australia & Beyond',
    text: 'From the Pilbara to Kakadu, the wild side beyond the coast.',
    link: 'See options →',
    photo: PHOTOS.outback,
    href: '/tours?tab=packages',
  },
];

export default function HomeScreen() {
  useStatusBar('dark');
  const { toursIn, unreadCount: unread } = useStore();
  const { user, ready } = useAuth();
  const reduced = useReducedMotion();
  const reveal = useRevealOnScroll();
  const focused = useScreenFocused();
  const latestReviews = useLatestReviews();
  const [carouselX] = useState(() => new Animated.Value(0));
  const carousel = useRef<ComponentRef<typeof Animated.ScrollView>>(null);
  const carouselState = useRef({ x: 0, contentWidth: 0, viewWidth: 0, touchedAt: 0 });

  // The destination row keeps moving by itself until someone touches it, then waits a while.
  useEffect(() => {
    if (!focused || reduced) return;
    const timer = setInterval(() => {
      const state = carouselState.current;
      const max = state.contentWidth - state.viewWidth;
      if (max <= 0 || Date.now() - state.touchedAt < CAROUSEL_RESUME_MS) return;
      const next = state.x >= max - 1 ? 0 : Math.min(state.x + CAROUSEL_STEP, max);
      state.x = next;
      carousel.current?.scrollTo({ x: next, animated: true });
    }, CAROUSEL_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [focused, reduced]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <reveal.Provider value={reveal.value}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={48}
        onScroll={reveal.onScroll}>
        <FadeIn style={styles.header} distance={-10}>
          <Text style={styles.logo}>
            {SITE.name}
            <Text style={styles.logoDot}>.</Text>
          </Text>
          <View style={styles.headerActions}>
            <RoundButton
              icon="search-outline"
              label="Search tours"
              onPress={() => router.push('/search')}
            />
            <RoundButton
              icon="heart-outline"
              label="Saved and requests"
              onPress={() => router.push('/activity')}
            />
            <RoundButton
              icon="notifications-outline"
              label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
              badge={unread}
              onPress={() => router.push('/notifications')}
            />
            {user && (
              <ScalePressable
                style={styles.profile}
                pressedScale={0.88}
                accessibilityRole="button"
                accessibilityLabel="Your profile"
                onPress={() => router.push('/account')}>
                <Avatar user={user} />
              </ScalePressable>
            )}
            {ready && !user && (
              <ScalePressable
                style={styles.signIn}
                pressedScale={0.92}
                accessibilityRole="link"
                onPress={() => router.push('/sign-in')}>
                <Text style={styles.signInText}>Sign in</Text>
              </ScalePressable>
            )}
          </View>
        </FadeIn>

        <NextTripCard />

        <FadeIn delay={80}>
          <Text style={styles.pageTitle}>Your adventure starts here</Text>
        </FadeIn>
        <Animated.ScrollView
          ref={carousel}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
          onContentSizeChange={(width) => {
            carouselState.current.contentWidth = width;
          }}
          onLayout={(event) => {
            carouselState.current.viewWidth = event.nativeEvent.layout.width;
          }}
          onTouchStart={() => {
            carouselState.current.touchedAt = Date.now();
          }}
          onMomentumScrollEnd={(event) => {
            carouselState.current.x = event.nativeEvent.contentOffset.x;
            carouselState.current.touchedAt = Date.now();
          }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: carouselX } } }], {
            useNativeDriver: NATIVE_DRIVER,
          })}>
          {DESTINATIONS.map((item, index) => {
            // Each photo slides inside its card as the row is swiped, like looking through a window.
            const photoX = carouselX.interpolate({
              inputRange: [(index - 1) * CAROUSEL_STEP, index * CAROUSEL_STEP, (index + 1) * CAROUSEL_STEP],
              outputRange: [-PHOTO_DRIFT, 0, PHOTO_DRIFT],
              extrapolate: 'clamp',
            });
            return (
              <FadeIn key={item.label} delay={staggerDelay(index, 140)} distance={28}>
                <ScalePressable
                  style={styles.destination}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => router.navigate(item.href)}>
                  <Animated.View
                    style={[styles.destinationPhoto, !reduced && { transform: [{ translateX: photoX }] }]}>
                    <SlowZoom style={StyleSheet.absoluteFill}>
                      <Image
                        source={item.photo}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={150}
                      />
                    </SlowZoom>
                  </Animated.View>
                  <LinearGradient
                    colors={['rgba(11,20,46,0)', 'rgba(11,20,46,0.75)']}
                    style={styles.destinationScrim}
                  />
                  <Text style={styles.destinationLabel}>{item.label}</Text>
                </ScalePressable>
              </FadeIn>
            );
          })}
        </Animated.ScrollView>

        <FadeIn delay={320}>
        <Card style={styles.section}>
          {latestReviews.average !== null && (
            <View style={styles.reviews}>
              <Pulse>
                <Ionicons name="star" size={16} color="#F5A524" />
              </Pulse>
              <Text style={styles.reviewsText}>
                {latestReviews.average.toFixed(1)} from {latestReviews.count}{' '}
                {latestReviews.count === 1 ? 'traveller review' : 'traveller reviews'}
              </Text>
            </View>
          )}
          <Text style={styles.introTitle}>Made by backpackers, for backpackers</Text>
          <Text style={styles.body}>
            We’ve been where you’re going. Our group tours in Melbourne, Sydney and the East Coast
            connect you with the best itineraries, a new group of mates and support for your whole
            time in Australia.
          </Text>
          <View style={styles.introLink}>
            <TextLink label="Who are we? →" onPress={() => router.navigate('/about')} />
          </View>
        </Card>
        </FadeIn>

        <View style={styles.section}>
          <Reveal>
            <Eyebrow>Where will you go?</Eyebrow>
            <Heading>Pick your adventure</Heading>
          </Reveal>
          <View style={styles.sectionBody}>
            {ADVENTURES.map((item, index) => (
              <Reveal key={item.title} delay={index * 40}>
              <ScalePressable
                style={styles.adventure}
                pressedScale={0.98}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                onPress={() => router.navigate(item.href)}>
                <Image
                  source={item.photo}
                  style={styles.adventurePhoto}
                  contentFit="cover"
                  transition={150}
                />
                <View style={styles.adventureBody}>
                  <Text style={styles.adventureTitle}>{item.title}</Text>
                  <Text style={styles.adventureText}>{item.text}</Text>
                  <Text style={styles.adventureLink}>{item.link}</Text>
                </View>
              </ScalePressable>
              </Reveal>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Reveal>
            <Eyebrow>Best place to start</Eyebrow>
            <Heading>Australia’s East Coast</Heading>
            <Text style={styles.sectionIntro}>
              Beaches, rainforest, reef and everything in between. A tour for every trip length, or
              build your own.
            </Text>
          </Reveal>
          <View style={styles.sectionBody}>
            <ToursStatus />
            {toursIn('east').map((tour) => (
              <Reveal key={tour.id} distance={40}>
                <TourFeatureCard tour={tour} />
              </Reveal>
            ))}
          </View>
        </View>

        <View style={styles.sectionTight}>
          <Reveal>
            <Eyebrow>Not your average tour company</Eyebrow>
            <Heading>Why travel with us</Heading>
          </Reveal>
          <View style={styles.whyGrid}>
            {WHY_TRAVEL.map((item, index) => (
              <Reveal key={item.title} delay={(index % 2) * 90} style={styles.whyCell}>
                <View style={styles.whyCard}>
                  <Float delay={index * 250} style={styles.whyIcon}>
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  </Float>
                  <Text style={styles.whyTitle}>{item.title}</Text>
                  <Text style={styles.whyText}>{item.text}</Text>
                </View>
              </Reveal>
            ))}
          </View>
        </View>

        {latestReviews.reviews.length > 0 && (
          <View style={styles.sectionTight}>
            <Reveal>
              <Eyebrow>From real travellers</Eyebrow>
              <Heading>What people are saying</Heading>
            </Reveal>
            <View style={styles.sectionBody}>
              {latestReviews.reviews.slice(0, 3).map((review) => (
                <Reveal key={review.id}>
                  <ReviewCard review={review} showTrip />
                </Reveal>
              ))}
            </View>
          </View>
        )}

        <Reveal>
        <View style={styles.people}>
          <Text style={styles.peopleTitle}>Find your people</Text>
          <Text style={styles.peopleText}>
            Travelling solo doesn’t mean travelling alone. Every tour starts with strangers and ends
            with lifelong mates. Join the community before you’ve even booked.
          </Text>
          <View style={styles.peopleActions}>
            <Button
              label="Choose your tour"
              attention
              style={styles.peopleButton}
              onPress={() => router.navigate('/tours')}
            />
            <Button
              label="Join the group"
              variant="outline"
              style={styles.peopleButton}
              onPress={() => openLink('Join the group', SITE.links.community)}
            />
          </View>
        </View>
        </Reveal>
      </ScrollView>
      </reveal.Provider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  logo: { flex: 1, fontFamily: fonts.display, fontSize: 22, color: colors.text, letterSpacing: -0.4 },
  logoDot: { color: colors.brandDot },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  profile: { borderRadius: radius.pill },
  signIn: {
    height: 44,
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  signInText: { fontFamily: fonts.bold, fontSize: 14, color: colors.white },
  pageTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  carousel: { marginTop: spacing.md },
  carouselContent: { gap: spacing.md, paddingHorizontal: spacing.lg },
  destination: {
    width: DESTINATION_WIDTH,
    height: 210,
    borderRadius: radius.lg,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: colors.primarySoft,
  },
  destinationPhoto: { position: 'absolute', top: 0, bottom: 0, left: -PHOTO_DRIFT, right: -PHOTO_DRIFT },
  destinationScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 },
  destinationLabel: {
    fontFamily: fonts.display,
    fontSize: 18,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.white,
    textAlign: 'center',
    paddingBottom: spacing.md,
  },
  section: { marginHorizontal: spacing.lg, marginTop: spacing.xl },
  sectionTight: { marginHorizontal: spacing.lg, marginTop: spacing.sm },
  sectionBody: { marginTop: spacing.md },
  sectionIntro: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  reviews: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewsText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  introTitle: {
    fontFamily: fonts.display,
    fontSize: 24,
    lineHeight: 29,
    color: colors.text,
    marginTop: spacing.sm,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  introLink: { marginTop: spacing.md },
  adventure: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  adventurePhoto: { width: 104, backgroundColor: colors.primarySoft },
  adventureBody: { flex: 1, padding: spacing.md },
  adventureTitle: { fontFamily: fonts.display, fontSize: 17, color: colors.text },
  adventureText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  adventureLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  whyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
    marginTop: spacing.md,
  },
  whyCell: { width: '48.5%' },
  whyCard: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  whyIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whyTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginTop: spacing.md },
  whyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  people: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  peopleTitle: { fontFamily: fonts.display, fontSize: 22, color: '#7A2A0E' },
  peopleText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: '#5B2A18',
    marginTop: spacing.sm,
  },
  peopleActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  peopleButton: { flexGrow: 1 },
});
