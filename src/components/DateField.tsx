import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { colors, fonts, radius, spacing } from '@/theme';
import { formatDate, parseDate } from '@/utils/validate';

type Props = {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  minimumDate?: Date | null;
  maximumDate?: Date;
};

export function DateField({ label, value, error, onChange, minimumDate, maximumDate }: Props) {
  const [picking, setPicking] = useState(false);
  const today = new Date();
  const earliest = minimumDate === undefined ? today : (minimumDate ?? undefined);
  const [draft, setDraft] = useState(today);
  const selected = parseDate(value) ?? maximumDate ?? today;

  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selected,
        mode: 'date',
        minimumDate: earliest,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(formatDate(date));
        },
      });
      return;
    }
    setDraft(selected);
    setPicking(true);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={styles.input}
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}: ${value}` : `${label}: choose a date`}
        onPress={open}>
        <Text style={[styles.value, !value && styles.placeholder]}>{value || 'Choose a date'}</Text>
        <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
      </Pressable>
      {error && <Text style={styles.error}>{error}</Text>}

      {Platform.OS === 'ios' && (
        <Modal visible={picking} transparent animationType="slide" onRequestClose={() => setPicking(false)}>
          <View style={styles.backdrop}>
            <View style={styles.sheet}>
              <DateTimePicker
                value={draft}
                mode="date"
                display="inline"
                minimumDate={earliest}
                maximumDate={maximumDate}
                onChange={(_, date) => {
                  if (date) setDraft(date);
                }}
              />
              <Button
                label="Done"
                onPress={() => {
                  onChange(formatDate(draft));
                  setPicking(false);
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: spacing.md },
  label: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, marginBottom: spacing.xs },
  input: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  value: { fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  placeholder: { color: colors.textMuted },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.error, marginTop: spacing.xs },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(16, 26, 51, 0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
