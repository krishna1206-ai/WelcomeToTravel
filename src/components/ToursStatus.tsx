import { StyleSheet, Text, View } from 'react-native';

import { Pulse } from '@/components/Motion';
import { Button } from '@/components/ui';
import { useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';

const PLACEHOLDER_CARDS = [0, 1, 2];

// Shown in place of the trip lists while they load or when the server can't be reached.
export function ToursStatus() {
  const { toursStatus, reloadTours, tours } = useStore();

  if (toursStatus === 'loading' && tours.length === 0) {
    return (
      <View accessibilityRole="progressbar" accessibilityLabel="Loading trips">
        {PLACEHOLDER_CARDS.map((card) => (
          <Pulse key={card} style={styles.placeholder}>
            <View style={styles.placeholderPhoto} />
            <View style={styles.placeholderBody}>
              <View style={styles.placeholderLineShort} />
              <View style={styles.placeholderLine} />
              <View style={styles.placeholderLineShort} />
            </View>
          </Pulse>
        ))}
      </View>
    );
  }
  if (toursStatus === 'error') {
    return (
      <View style={styles.box}>
        <Text style={styles.text}>We couldn’t load the trips. Check your connection and try again.</Text>
        <Button label="Try again" style={styles.retry} onPress={reloadTours} />
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', paddingVertical: spacing.xl },
  text: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retry: { marginTop: spacing.md },
  placeholder: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  placeholderPhoto: { width: 100, height: 104, backgroundColor: colors.subtleStatus },
  placeholderBody: { flex: 1, padding: spacing.md, gap: spacing.sm, justifyContent: 'center' },
  placeholderLine: { height: 14, width: '85%', borderRadius: radius.sm, backgroundColor: colors.subtleStatus },
  placeholderLineShort: { height: 10, width: '45%', borderRadius: radius.sm, backgroundColor: colors.subtleStatus },
});
