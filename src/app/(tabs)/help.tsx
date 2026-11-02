import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/client';
import { FadeIn, Float, Reveal, ScalePressable, useRevealOnScroll } from '@/components/Motion';
import { Button, Card, Field, Heading, TextLink, type IconName } from '@/components/ui';
import { MORE_LINKS, OFFICES, SITE } from '@/data/content';
import { useAuth } from '@/state/auth';
import { useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { openLink } from '@/utils/links';
import { useStatusBar } from '@/utils/useStatusBar';
import { isValidEmail } from '@/utils/validate';

const CONTACTS: {
  title: string;
  note: string;
  icon: IconName;
  tint: string;
  iconColor: string;
  url: string | null;
}[] = [
  {
    title: 'WhatsApp',
    note: 'Fastest reply',
    icon: 'logo-whatsapp',
    tint: '#E3F6E8',
    iconColor: '#1B8A3E',
    url: SITE.links.whatsapp,
  },
  {
    title: 'Instagram',
    note: 'Send a DM',
    icon: 'logo-instagram',
    tint: '#FBE6F1',
    iconColor: '#B4246F',
    url: SITE.links.instagram,
  },
  {
    title: 'Facebook',
    note: 'Message us',
    icon: 'logo-facebook',
    tint: colors.primarySoft,
    iconColor: colors.primary,
    url: SITE.links.facebook,
  },
  {
    title: 'Email',
    note: SITE.email,
    icon: 'mail-outline',
    tint: colors.accentSoft,
    iconColor: colors.accent,
    url: SITE.links.email,
  },
];

type Errors = { name?: string; email?: string; question?: string };

export default function HelpScreen() {
  useStatusBar('dark');
  const { sendMessage } = useStore();
  const { user } = useAuth();
  // Signed-in people start with their account details until they type something else.
  const [typedName, setName] = useState<string | null>(null);
  const [typedEmail, setEmail] = useState<string | null>(null);
  const name = typedName ?? user?.name ?? '';
  const email = typedEmail ?? user?.email ?? '';
  const [question, setQuestion] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const reveal = useRevealOnScroll();

  async function submit() {
    const nextErrors: Errors = {};
    if (!name.trim()) nextErrors.name = 'Enter your name.';
    if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.';
    if (!question.trim()) nextErrors.question = 'Enter your question.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setFailure('');
    setBusy(true);
    try {
      await sendMessage({ name: name.trim(), email: email.trim(), question: question.trim() });
      setName(null);
      setEmail(null);
      setQuestion('');
      setSaved(true);
    } catch (error) {
      setFailure(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <reveal.Provider value={reveal.value}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={48}
          onScroll={reveal.onScroll}>
          <FadeIn distance={-10}>
            <Text style={styles.title}>We’re here to help</Text>
            <Text style={styles.intro}>
              Arranging travel is hard, so we make it easy. The quickest way to reach us is the form
              below.
            </Text>
          </FadeIn>

          <FadeIn delay={120}>
          <Card style={styles.form}>
            <Text style={styles.formTitle}>Ask us anything</Text>
            <Text style={styles.formText}>
              A question about a tour, a booking, or not sure where to start? One of our team will
              get back to you.
            </Text>
            <Field
              label="Name"
              value={name}
              error={errors.name}
              autoComplete="name"
              onChangeText={(text) => {
                setName(text);
                setSaved(false);
                setErrors((current) => ({ ...current, name: undefined }));
              }}
            />
            <Field
              label="Email"
              value={email}
              error={errors.email}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={(text) => {
                setEmail(text);
                setSaved(false);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
            />
            <Field
              label="Your question"
              value={question}
              error={errors.question}
              multiline
              onChangeText={(text) => {
                setQuestion(text);
                setSaved(false);
                setErrors((current) => ({ ...current, question: undefined }));
              }}
            />
            <Button
              label={busy ? 'Sending…' : 'Send message'}
              style={styles.send}
              onPress={busy ? () => undefined : submit}
            />
            {saved && <Text style={styles.savedNote}>Thanks! Your message has been sent to our team.</Text>}
            {failure !== '' && <Text style={styles.failure}>{failure}</Text>}
          </Card>
          </FadeIn>

          <Reveal>
          <View style={styles.call}>
            <Float style={styles.callIcon}>
              <Ionicons name="calendar-outline" size={22} color={colors.white} />
            </Float>
            <View style={styles.callBody}>
              <Text style={styles.callTitle}>Book a free travel call</Text>
              <Text style={styles.callText}>Plan your route with an expert</Text>
            </View>
            <Button
              label="Book"
              variant="white"
              onPress={() => openLink('Book a free travel call', SITE.links.travelCall)}
            />
          </View>
          </Reveal>

          <View style={styles.section}>
            <Reveal>
              <Heading>More ways to say G’day</Heading>
            </Reveal>
            <View style={styles.contacts}>
              {CONTACTS.map((contact, index) => (
                <Reveal key={contact.title} delay={(index % 2) * 90} style={styles.contactCell}>
                  <ScalePressable
                    style={styles.contact}
                    accessibilityRole="link"
                    onPress={() => openLink(contact.title, contact.url)}>
                    <Float
                      delay={index * 250}
                      distance={3}
                      style={[styles.contactIcon, { backgroundColor: contact.tint }]}>
                      <Ionicons name={contact.icon} size={20} color={contact.iconColor} />
                    </Float>
                    <Text style={styles.contactTitle}>{contact.title}</Text>
                    <Text style={styles.contactNote}>{contact.note}</Text>
                  </ScalePressable>
                </Reveal>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Reveal>
              <Heading>Our offices</Heading>
              <Text style={styles.sectionText}>Right in the heart of the city. Pop in for a chat.</Text>
            </Reveal>
            {OFFICES.map((office) => (
              <Reveal key={office.city}>
                <View style={styles.office}>
                  <Image
                    source={office.photo}
                    style={styles.officePhoto}
                    contentFit="cover"
                    transition={150}
                  />
                  <View style={styles.officeBody}>
                    <Text style={styles.officeCity}>{office.city}</Text>
                    <Text style={styles.officeAddress}>{office.address}</Text>
                    <TextLink
                      label="Get directions"
                      onPress={() => openLink(`Directions to ${office.city}`)}
                    />
                  </View>
                </View>
              </Reveal>
            ))}
          </View>

          <View style={styles.section}>
            <Reveal>
              <Heading>More</Heading>
            </Reveal>
            <Reveal>
              <View style={styles.moreList}>
                {MORE_LINKS.map((link, index) => (
                  <Pressable
                    key={link}
                    style={[styles.moreRow, index > 0 && styles.moreRowBorder]}
                    accessibilityRole="link"
                    onPress={() => openLink(link)}>
                    <Text style={styles.moreText}>{link}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            </Reveal>
          </View>
        </ScrollView>
        </reveal.Provider>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  intro: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  form: { marginTop: spacing.lg, borderRadius: radius.xl },
  formTitle: { fontFamily: fonts.display, fontSize: 21, color: colors.text },
  formText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  send: { marginTop: spacing.lg },
  savedNote: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: '#14703A',
    marginTop: spacing.md,
  },
  failure: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
    color: colors.error,
    marginTop: spacing.md,
  },
  call: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  callIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callBody: { flex: 1 },
  callTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  callText: { fontFamily: fonts.regular, fontSize: 13, color: colors.white, marginTop: 2 },
  section: { marginTop: spacing.xl },
  sectionText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  contacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.md,
    marginTop: spacing.md,
  },
  contactCell: { width: '48.5%' },
  contact: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text, marginTop: spacing.md },
  contactNote: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  office: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  officePhoto: { width: 104, backgroundColor: colors.primarySoft },
  officeBody: { flex: 1, padding: spacing.md },
  officeCity: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  officeAddress: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  moreList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  moreRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  moreText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
});
