import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { errorMessage } from '@/api/client';
import { ChoiceChips } from '@/components/ChoiceChips';
import { DateField } from '@/components/DateField';
import { FadeIn, PopIn } from '@/components/Motion';
import { Button, Card, Field } from '@/components/ui';
import type { Tour } from '@/data/tours';
import { useAuth, type User } from '@/state/auth';
import { useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { openLink } from '@/utils/links';
import { checkoutAmounts, formatMoney, useBookingTerms } from '@/utils/money';
import { useStatusBar } from '@/utils/useStatusBar';
import { formatDate, isValidEmail, isValidFutureDate, isValidPhone, parseDate } from '@/utils/validate';

const MAX_TRAVELLERS = 12;
const STEPS = ['Booking details', 'Billing & contact', 'Payment'];
const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'];
const VISAS = ['Working holiday', 'Tourist', 'Student', 'Citizen or resident', 'Other'];

type Person = {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  dateOfBirth: string;
  country: string;
  gender: string;
  health: string;
  dietary: string;
};

type Errors = Partial<Record<keyof Person | 'date' | 'pickupPoint' | 'travellingWith' | 'visa' | 'terms', string>>;

function personFrom(user: User): Person {
  const [firstName = '', ...rest] = user.name.trim().split(/\s+/);
  return {
    firstName,
    lastName: rest.join(' '),
    mobile: user.phone,
    email: user.email,
    dateOfBirth: '',
    country: user.country,
    gender: '',
    health: '',
    dietary: '',
  };
}

function ageOn(dateOfBirth: string, on: string): number | null {
  const born = parseDate(dateOfBirth);
  const day = parseDate(on);
  if (!born || !day) return null;
  let age = day.getFullYear() - born.getFullYear();
  const hadBirthday =
    day.getMonth() > born.getMonth() || (day.getMonth() === born.getMonth() && day.getDate() >= born.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

// Reads ages like "18 - 36" from the trip. Anything else means there is no age limit to check.
function ageLimits(tour: Tour): { min: number; max: number } | null {
  const match = /(\d+)\s*[-–]\s*(\d+)/.exec(tour.ageRange ?? '');
  return match ? { min: Number(match[1]), max: Number(match[2]) } : null;
}

// "19 Days / 19 Nights" ends 19 nights later, and "30 days" ends on day 30.
function endDate(tour: Tour, start: string): string | null {
  const begins = parseDate(start);
  if (!begins) return null;
  const nights = /(\d+)\s*night/i.exec(tour.duration);
  const days = /(\d+)\s*day/i.exec(tour.duration);
  const length = nights ? Number(nights[1]) : days ? Number(days[1]) - 1 : null;
  if (length === null || length < 1) return null;
  const ends = new Date(begins);
  ends.setDate(ends.getDate() + length);
  return formatDate(ends);
}

function checkPerson(person: Person, errors: Errors) {
  if (!person.firstName.trim()) errors.firstName = 'Enter a first name.';
  if (!person.lastName.trim()) errors.lastName = 'Enter a last name.';
  if (!isValidPhone(person.mobile)) errors.mobile = 'Enter a valid mobile number.';
  if (!isValidEmail(person.email)) errors.email = 'Enter a valid email address.';
  if (!parseDate(person.dateOfBirth)) errors.dateOfBirth = 'Choose a date of birth.';
  if (!person.country.trim()) errors.country = 'Enter a country.';
  if (!person.gender) errors.gender = 'Choose an option.';
  if (!person.health.trim()) errors.health = 'Write N/A if you have none.';
  if (!person.dietary.trim()) errors.dietary = 'Write N/A if you have none.';
}

function trimmed(person: Person): Record<string, string> {
  return Object.fromEntries(Object.entries(person).map(([key, value]) => [key, value.trim()]));
}

function PersonFields({
  person,
  errors,
  onChange,
}: {
  person: Person;
  errors: Errors;
  onChange: (changes: Partial<Person>) => void;
}) {
  return (
    <>
      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="First name" value={person.firstName} error={errors.firstName} autoComplete="given-name" onChangeText={(firstName) => onChange({ firstName })} />
        </View>
        <View style={styles.half}>
          <Field label="Last name" value={person.lastName} error={errors.lastName} autoComplete="family-name" onChangeText={(lastName) => onChange({ lastName })} />
        </View>
      </View>
      <Field label="Mobile" value={person.mobile} error={errors.mobile} autoComplete="tel" keyboardType="phone-pad" onChangeText={(mobile) => onChange({ mobile })} />
      <Field
        label="Email"
        value={person.email}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={(email) => onChange({ email })}
      />
      <DateField
        label="Date of birth"
        value={person.dateOfBirth}
        error={errors.dateOfBirth}
        minimumDate={null}
        maximumDate={new Date()}
        onChange={(dateOfBirth) => onChange({ dateOfBirth })}
      />
      <Field label="Country" value={person.country} error={errors.country} autoComplete="country" onChangeText={(country) => onChange({ country })} />
      <ChoiceChips label="What is your gender identity?" options={GENDERS} value={person.gender} error={errors.gender} onChange={(gender) => onChange({ gender })} />
      <Field
        label="Do you have any health issues or allergies? If you don’t, please write N/A"
        value={person.health}
        error={errors.health}
        multiline
        onChangeText={(health) => onChange({ health })}
      />
      <Field
        label="Do you have any dietary requirements (e.g. vegetarian)? If you don’t, please write N/A"
        value={person.dietary}
        error={errors.dietary}
        multiline
        onChangeText={(dietary) => onChange({ dietary })}
      />
    </>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong]}>{value}</Text>
    </View>
  );
}

export default function BookingScreen() {
  useStatusBar('dark');
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, ready } = useAuth();
  const { getTour, addBooking, payBooking } = useStore();
  const terms = useBookingTerms();
  const tour = getTour(id);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);

  const [step, setStep] = useState(0);
  const [date, setDate] = useState('');
  const [travellers, setTravellers] = useState(1);
  const [pickupPoint, setPickupPoint] = useState('');
  const [traveller, setTraveller] = useState<Person | null>(null);
  const [sameAsTraveller, setSameAsTraveller] = useState(true);
  const [billing, setBilling] = useState<Person | null>(null);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [travellingWith, setTravellingWith] = useState('');
  const [visa, setVisa] = useState('');
  const [plan, setPlan] = useState<'deposit' | 'full'>('deposit');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);

  if (ready && !user) {
    return <Redirect href={{ pathname: '/sign-in', params: { next: `/book/${id}` } }} />;
  }
  if (!user) return null;
  if (!tour) {
    return <Text style={styles.missing}>This tour could not be found.</Text>;
  }

  const lead = traveller ?? personFrom(user);
  const payer = sameAsTraveller ? lead : (billing ?? personFrom(user));
  const limits = ageLimits(tour);
  const pickupPoints = tour.pickupPoints ?? [];
  const ends = endDate(tour, date);
  const currency = terms?.currency ?? 'AUD';
  const amounts = tour.price && tour.price > 0 && terms ? checkoutAmounts(tour.price, travellers, terms) : null;
  const usesDeposit = Boolean(amounts?.depositAllowed) && plan === 'deposit';
  const dueNowCents = amounts ? (usesDeposit ? amounts.depositCents : amounts.totalCents) : 0;

  function goTo(next: number) {
    setErrors({});
    setFailure('');
    setStep(next);
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  function checkStep(): boolean {
    const next: Errors = {};
    if (step === 0) {
      if (!isValidFutureDate(date)) next.date = 'Choose a start date.';
      if (pickupPoints.length > 0 && !pickupPoints.includes(pickupPoint)) next.pickupPoint = 'Choose a pick-up point.';
      checkPerson(lead, next);
      const age = ageOn(lead.dateOfBirth, date || formatDate(new Date()));
      if (limits && age !== null && (age < limits.min || age > limits.max)) {
        next.dateOfBirth = `This tour is for travellers aged ${limits.min} to ${limits.max}.`;
      }
    }
    if (step === 1) {
      if (!sameAsTraveller) checkPerson(payer, next);
      if (!travellingWith.trim()) next.travellingWith = 'Write N/A if you’re travelling alone.';
      if (!visa) next.visa = 'Choose your visa.';
    }
    if (step === 2 && !agreed) next.terms = 'Please agree to the Terms & Conditions to continue.';
    setErrors(next);
    if (Object.keys(next).length > 0) setFailure('Please check the highlighted fields.');
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (!checkStep() || !tour) return;
    setFailure('');
    setBusy(true);
    try {
      const booking = await addBooking({
        tourId: tour.id,
        date: date.trim(),
        travellers,
        plan: usesDeposit ? 'deposit' : 'full',
        pickupPoint: pickupPoints.length > 0 ? pickupPoint : undefined,
        traveller: trimmed(lead),
        billing: { ...trimmed(payer), specialRequirements: specialRequirements.trim(), travellingWith: travellingWith.trim(), visa },
        agreedToTerms: true,
      });
      // The booking is saved by now, so a failed payment is retried with Pay now, not by booking twice.
      if (amounts) {
        await payBooking(booking.id).catch((error) => console.warn('Could not start payment', error));
      }
      router.dismissTo('/activity');
    } catch (error) {
      setFailure(errorMessage(error));
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.progress}>
          <Text style={styles.stepCount}>
            Step {step + 1} of {STEPS.length}
          </Text>
          <View style={styles.bars}>
            {STEPS.map((name, index) => (
              <View key={name} style={[styles.bar, index <= step && styles.barDone]} />
            ))}
          </View>
          <Text style={styles.stepTitle}>{STEPS[step]}</Text>
        </View>

        <FadeIn key={step} distance={14} duration={300}>
          {step === 0 && (
            <>
              <Card>
                <View style={styles.trip}>
                  <Image source={tour.photo} style={styles.photo} contentFit="cover" transition={150} />
                  <View style={styles.tripText}>
                    <Text style={styles.tourTitle}>{tour.title}</Text>
                    <Text style={styles.tourMeta}>{[tour.subtitle, tour.duration].filter((part) => part && !part.startsWith('[')).join(' · ')}</Text>
                  </View>
                </View>
                <DateField label="Start date" value={date} error={errors.date} onChange={setDate} />
                {ends && <Text style={styles.ends}>Ends {ends}</Text>}
                <View style={styles.travellersRow}>
                  <Text style={styles.travellersLabel}>Travellers</Text>
                  <View style={styles.stepper}>
                    <Pressable
                      style={styles.stepButton}
                      accessibilityRole="button"
                      accessibilityLabel="Fewer travellers"
                      onPress={() => setTravellers((count) => Math.max(1, count - 1))}>
                      <Text style={styles.stepText}>−</Text>
                    </Pressable>
                    <PopIn key={travellers}>
                      <Text style={styles.count}>{travellers}</Text>
                    </PopIn>
                    <Pressable
                      style={styles.stepButton}
                      accessibilityRole="button"
                      accessibilityLabel="More travellers"
                      onPress={() => setTravellers((count) => Math.min(MAX_TRAVELLERS, count + 1))}>
                      <Text style={styles.stepText}>+</Text>
                    </Pressable>
                  </View>
                </View>
                {pickupPoints.length > 0 && (
                  <ChoiceChips
                    label="Pick-up point"
                    options={pickupPoints}
                    value={pickupPoint}
                    error={errors.pickupPoint}
                    onChange={setPickupPoint}
                  />
                )}
              </Card>

              <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Traveller</Text>
                <Text style={styles.sectionNote}>
                  The lead traveller. You can tell us who else is coming in the next step.
                </Text>
                <PersonFields person={lead} errors={errors} onChange={(changes) => setTraveller({ ...lead, ...changes })} />
              </Card>
            </>
          )}

          {step === 1 && (
            <>
              <Card>
                <Text style={styles.sectionTitle}>Confirmation and billing</Text>
                <Pressable
                  style={styles.checkRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: sameAsTraveller }}
                  onPress={() => setSameAsTraveller((value) => !value)}>
                  <View style={[styles.checkbox, sameAsTraveller && styles.checkboxOn]}>
                    {sameAsTraveller && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </View>
                  <Text style={styles.checkText}>Same details as the traveller</Text>
                </Pressable>
                {sameAsTraveller ? (
                  <Text style={styles.sectionNote}>
                    {lead.firstName} {lead.lastName} · {lead.email} · {lead.mobile}
                  </Text>
                ) : (
                  <PersonFields person={payer} errors={errors} onChange={(changes) => setBilling({ ...payer, ...changes })} />
                )}
                <Field label="Special requirements" value={specialRequirements} multiline onChangeText={setSpecialRequirements} />
                <Field
                  label="If you are travelling with someone else, please let us know their full name(s) or put N/A if travelling alone."
                  value={travellingWith}
                  error={errors.travellingWith}
                  multiline
                  onChangeText={setTravellingWith}
                />
                <ChoiceChips label="What visa will you be travelling on?" options={VISAS} value={visa} error={errors.visa} onChange={setVisa} />
              </Card>

              <Card style={[styles.section, styles.notice]}>
                <Text style={styles.noticeTitle}>Payments (please read)</Text>
                <Text style={styles.noticeText}>
                  You’ll be sent to Razorpay’s secure checkout to pay. If it asks for your country, enter the country
                  your card is from.
                </Text>
                <Text style={styles.noticeText}>
                  Your booking stays a request until our team confirms it. We’ll let you know in the app and by email.
                </Text>
                <Text style={styles.noticeText}>
                  It is your responsibility to have a valid visa for this trip.
                  {limits ? ` This tour is for people aged ${limits.min} to ${limits.max}.` : ''}
                </Text>
              </Card>
            </>
          )}

          {step === 2 && (
            <>
              <Card>
                <Text style={styles.sectionTitle}>{tour.title}</Text>
                <Text style={styles.sectionNote}>
                  Starts {date}
                  {ends ? ` · Ends ${ends}` : ''} · {travellers} {travellers === 1 ? 'traveller' : 'travellers'}
                </Text>
                {pickupPoint !== '' && <Text style={styles.sectionNote}>Pick-up: {pickupPoint}</Text>}
                {amounts ? (
                  <>
                    <SummaryRow
                      label={`${formatMoney((tour.price ?? 0) * 100, currency)} × ${travellers}`}
                      value={formatMoney(amounts.baseCents, currency)}
                    />
                    {amounts.feeCents > 0 && (
                      <SummaryRow label={`Card fee (${terms?.cardFeePercent}%)`} value={formatMoney(amounts.feeCents, currency)} />
                    )}
                    <SummaryRow label={`Total (${currency})`} value={formatMoney(amounts.totalCents, currency)} strong />
                  </>
                ) : (
                  <Text style={styles.sectionNote}>
                    {tour.price ? 'Loading prices…' : 'Our team will confirm the price with you.'}
                  </Text>
                )}
              </Card>

              {amounts?.depositAllowed && (
                <Card style={styles.section}>
                  <Text style={styles.sectionTitle}>Pay deposit or full amount now?</Text>
                  {(['deposit', 'full'] as const).map((option) => {
                    const on = plan === option;
                    const value = option === 'deposit' ? amounts.depositCents : amounts.totalCents;
                    return (
                      <Pressable
                        key={option}
                        style={[styles.planRow, on && styles.planRowOn]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: on }}
                        onPress={() => setPlan(option)}>
                        <View style={[styles.radio, on && styles.radioOn]}>
                          {on && <PopIn><View style={styles.radioDot} /></PopIn>}
                        </View>
                        <Text style={styles.planLabel}>{option === 'deposit' ? 'Deposit' : 'Full amount'}</Text>
                        <Text style={styles.planValue}>{formatMoney(value, currency)}</Text>
                      </Pressable>
                    );
                  })}
                  <SummaryRow label="Due now" value={formatMoney(dueNowCents, currency)} strong />
                  {usesDeposit && (
                    <Text style={styles.sectionNote}>
                      {formatMoney(amounts.totalCents - amounts.depositCents, currency)} balance paid later, from My Trip.
                    </Text>
                  )}
                </Card>
              )}

              <Card style={styles.section}>
                <View style={styles.secure}>
                  <Ionicons name="lock-closed-outline" size={16} color="#14703A" />
                  <Text style={styles.secureText}>Payment secured by Razorpay</Text>
                </View>
                <Pressable
                  style={styles.checkRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreed }}
                  onPress={() => setAgreed((value) => !value)}>
                  <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
                    {agreed && <Ionicons name="checkmark" size={16} color={colors.white} />}
                  </View>
                  <Text style={styles.checkText}>
                    I agree to the{' '}
                    <Text style={styles.link} onPress={() => openLink('Terms & Conditions')}>
                      Terms & Conditions
                    </Text>{' '}
                    and have read the{' '}
                    <Text style={styles.link} onPress={() => openLink('Privacy Policy')}>
                      Privacy Policy
                    </Text>
                  </Text>
                </Pressable>
                {errors.terms && <Text style={styles.error}>{errors.terms}</Text>}
                {amounts && <Text style={styles.sectionNote}>You will be directed to a secure payment website to complete your booking.</Text>}
              </Card>
            </>
          )}
        </FadeIn>

        {failure !== '' && <Text style={styles.failure}>{failure}</Text>}

        <View style={styles.actions}>
          {step > 0 && (
            <Button label="Back" variant="outline" style={styles.back} onPress={() => goTo(step - 1)} />
          )}
          {step < STEPS.length - 1 ? (
            <Button label="Continue" style={styles.next} onPress={() => checkStep() && goTo(step + 1)} />
          ) : (
            <Button
              label={busy ? 'Sending…' : amounts ? `Book and pay ${formatMoney(dueNowCents, currency)}` : 'Send booking request'}
              attention
              style={styles.next}
              onPress={busy ? () => undefined : submit}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  missing: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: spacing.xl,
    color: colors.textMuted,
  },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  progress: { marginBottom: spacing.md },
  stepCount: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  bars: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  bar: { flex: 1, height: 5, borderRadius: radius.pill, backgroundColor: colors.subtleStatus },
  barDone: { backgroundColor: colors.primary },
  stepTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginTop: spacing.sm },
  section: { marginTop: spacing.md },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  sectionNote: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.textMuted, marginTop: spacing.xs },
  trip: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  photo: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  tripText: { flex: 1 },
  tourTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  tourMeta: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  ends: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
  travellersRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg },
  travellersLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  stepButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontFamily: fonts.bold, fontSize: 20, color: colors.primaryText },
  count: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, minWidth: 20, textAlign: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  half: { flexGrow: 1, flexBasis: 140 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm - 2,
    borderWidth: 1.5,
    borderColor: '#A5AFC2',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { flex: 1, fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.text },
  link: { fontFamily: fonts.bold, color: colors.primary, textDecorationLine: 'underline' },
  notice: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  noticeTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.accent },
  noticeText: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.text, marginTop: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.sm },
  summaryLabel: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
  summaryValue: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  summaryStrong: { fontFamily: fonts.bold, color: colors.text },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  planRowOn: { borderColor: colors.primary, borderWidth: 2, backgroundColor: '#F4F8FE' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: '#A5AFC2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: radius.pill, backgroundColor: colors.primary },
  planLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  planValue: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  secure: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  secureText: { fontFamily: fonts.semibold, fontSize: 14, color: '#14703A' },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, marginTop: spacing.xs },
  failure: { fontFamily: fonts.medium, fontSize: 14, color: colors.error, marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  back: { flex: 1 },
  next: { flex: 2 },
});
