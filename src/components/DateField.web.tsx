import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme';
import { formatDate } from '@/utils/validate';

type Props = {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  minimumDate?: Date | null;
  maximumDate?: Date;
};

// The native picker doesn't run in a browser, which has its own date input.
export function DateField({ label, value, error, onChange, minimumDate, maximumDate }: Props) {
  const earliest = minimumDate === undefined ? new Date() : minimumDate;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {createElement('input', {
        type: 'date',
        value,
        min: earliest ? formatDate(earliest) : undefined,
        max: maximumDate ? formatDate(maximumDate) : undefined,
        'aria-label': label,
        style: inputStyle,
        onChange: (event: { target: { value: string } }) => onChange(event.target.value),
      })}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const inputStyle = {
  minHeight: 48,
  boxSizing: 'border-box',
  backgroundColor: colors.field,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  padding: `0 ${spacing.md}px`,
  fontFamily: fonts.regular,
  fontSize: 16,
  color: colors.text,
};

const styles = StyleSheet.create({
  field: { marginTop: spacing.md },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, marginBottom: spacing.xs },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, marginTop: spacing.xs },
});
