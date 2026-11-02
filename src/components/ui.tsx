import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageProps } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AttentionPressable,
  FadeIn,
  PopIn,
  Reveal,
  ScalePressable,
  SlowZoom,
  Wiggle,
} from '@/components/Motion';
import { colors, fonts, radius, spacing } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export function Eyebrow({ children, light }: { children: string; light?: boolean }) {
  return <Text style={[styles.eyebrow, light && styles.eyebrowLight]}>{children}</Text>;
}

export function Heading({ children }: { children: string }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  style,
  attention = false,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'white' | 'outline';
  style?: StyleProp<ViewStyle>;
  attention?: boolean;
}) {
  const Container = attention ? AttentionPressable : ScalePressable;
  return (
    <Container
      style={[styles.button, styles[`button_${variant}`], style]}
      accessibilityRole="button"
      onPress={onPress}>
      <Text style={[styles.buttonText, variant !== 'primary' && styles.buttonTextDark]}>
        {label}
      </Text>
    </Container>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable hitSlop={6} accessibilityRole="link" onPress={onPress}>
      <Text style={styles.textLink}>{label}</Text>
    </Pressable>
  );
}

export function RoundButton({
  icon,
  label,
  onPress,
  iconColor = colors.text,
  badge = 0,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  iconColor?: string;
  badge?: number;
}) {
  return (
    <ScalePressable
      style={styles.roundButton}
      pressedScale={0.88}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}>
      <PopIn key={icon}>
        <Wiggle trigger={badge}>
          <Ionicons name={icon} size={22} color={iconColor} />
        </Wiggle>
      </PopIn>
      {badge > 0 && (
        <PopIn key={badge} style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
        </PopIn>
      )}
    </ScalePressable>
  );
}

export function Hero({
  photo,
  eyebrow,
  title,
  text,
}: {
  photo: ImageProps['source'];
  eyebrow: string;
  title: string;
  text: string;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { paddingTop: insets.top + 56 }]}>
      <SlowZoom style={StyleSheet.absoluteFill}>
        <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      </SlowZoom>
      <LinearGradient
        colors={['rgba(11,20,46,0.2)', 'rgba(11,20,46,0.85)']}
        style={StyleSheet.absoluteFill}
      />
      <FadeIn>
        <Eyebrow light>{eyebrow}</Eyebrow>
        <Text style={styles.heroTitle}>{title}</Text>
      </FadeIn>
      <FadeIn delay={120}>
        <Text style={styles.heroText}>{text}</Text>
      </FadeIn>
    </View>
  );
}

export function CtaCard({
  eyebrow,
  title,
  text,
  action,
  onPress,
}: {
  eyebrow?: string;
  title: string;
  text: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.cta}>
      {eyebrow && <Eyebrow light>{eyebrow}</Eyebrow>}
      <Text style={styles.ctaTitle}>{title}</Text>
      <Text style={styles.ctaText}>{text}</Text>
      <Button label={action} variant="white" style={styles.ctaButton} attention onPress={onPress} />
    </View>
  );
}

export function Timeline({
  items,
}: {
  items: { key: string; eyebrow?: string; title: string; text: string }[];
}) {
  return (
    <View>
      {items.map((item, index) => {
        const isEnd = index === 0 || index === items.length - 1;
        const isLast = index === items.length - 1;
        return (
          <Reveal key={item.key} distance={16}>
            <View style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, isEnd && styles.timelineDotFilled]} />
                {!isLast && <View style={styles.timelineLine} />}
              </View>
              <View style={[styles.timelineBody, isLast && styles.timelineBodyLast]}>
                {item.eyebrow && <Text style={styles.timelineEyebrow}>{item.eyebrow}</Text>}
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineText}>{item.text}</Text>
              </View>
            </View>
          </Reveal>
        );
      })}
    </View>
  );
}

export function Field({
  label,
  error,
  ...input
}: { label: string; error?: string } & TextInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, input.multiline && styles.fieldInputMulti]}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label}
        {...input}
      />
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  eyebrowLight: { color: colors.white },
  heading: { fontFamily: fonts.display, fontSize: 24, color: colors.text, letterSpacing: -0.3 },
  button: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_primary: { backgroundColor: colors.primary },
  button_white: { backgroundColor: colors.white },
  button_outline: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
  buttonText: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
  buttonTextDark: { color: colors.primary },
  textLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    boxShadow: '0 1px 6px rgba(16, 26, 51, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.white },
  hero: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, overflow: 'hidden' },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 35,
    color: colors.white,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  heroText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.white,
    marginTop: spacing.sm,
  },
  cta: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing.xl },
  ctaTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.white,
    marginTop: spacing.xs,
  },
  ctaText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.white,
    marginTop: spacing.sm,
  },
  ctaButton: { alignSelf: 'flex-start', marginTop: spacing.lg },
  timelineRow: { flexDirection: 'row', gap: spacing.md },
  timelineRail: { width: 16, alignItems: 'center' },
  timelineDot: {
    width: 16,
    height: 16,
    marginTop: 2,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  timelineDotFilled: { backgroundColor: colors.primary },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#C9DBF5' },
  timelineBody: { flex: 1, paddingBottom: spacing.lg },
  timelineBodyLast: { paddingBottom: 0 },
  timelineEyebrow: { fontFamily: fonts.bold, fontSize: 12, color: colors.accent },
  timelineTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  timelineText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    marginTop: 2,
  },
  field: { marginTop: spacing.md },
  fieldLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fieldInput: {
    minHeight: 48,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  fieldInputMulti: { minHeight: 110, paddingTop: spacing.md, textAlignVertical: 'top' },
  fieldError: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
});
