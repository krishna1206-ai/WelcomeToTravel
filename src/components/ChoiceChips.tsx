import { StyleSheet, Text, View } from 'react-native';

import { ScalePressable } from '@/components/Motion';
import { colors, fonts, radius, spacing } from '@/theme';

// A pick-one list, used instead of a dropdown because it works the same on phones and the web.
export function ChoiceChips({
  label,
  options,
  value,
  error,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.field} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {options.map((option) => {
          const active = option === value;
          return (
            <ScalePressable
              key={option}
              style={[styles.chip, active && styles.chipActive]}
              pressedScale={0.94}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(option)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{option}</Text>
            </ScalePressable>
          );
        })}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: spacing.md },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: colors.field,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  chipTextActive: { fontFamily: fonts.semibold, color: colors.white },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, marginTop: spacing.xs },
});
