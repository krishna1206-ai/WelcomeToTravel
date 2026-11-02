import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeIn, ScalePressable } from '@/components/Motion';
import type { IconName } from '@/components/ui';
import type { InclusionGroup, Tour } from '@/data/tours';
import { colors, fonts, radius, spacing } from '@/theme';

const GROUPS: { key: InclusionGroup; label: string; icon: IconName }[] = [
  { key: 'experiences', label: 'Experiences', icon: 'walk-outline' },
  { key: 'accommodation', label: 'Accommodation', icon: 'bed-outline' },
  { key: 'included', label: 'Included', icon: 'checkmark-circle-outline' },
  { key: 'addOns', label: 'Add-ons', icon: 'add-circle-outline' },
  { key: 'transport', label: 'Transport', icon: 'bus-outline' },
  { key: 'meals', label: 'Meals', icon: 'restaurant-outline' },
];

// Only groups with something in them get a tab, and the section disappears when all are empty.
export function TourInclusions({ tour }: { tour: Tour }) {
  const groups = GROUPS.filter((group) => (tour.inclusions?.[group.key] ?? []).length > 0);
  const [selected, setSelected] = useState<InclusionGroup | null>(null);

  if (groups.length === 0) return null;

  const active = groups.find((group) => group.key === selected) ?? groups[0];
  const items = tour.inclusions?.[active.key] ?? [];

  return (
    <View>
      <Text style={styles.heading}>Tour inclusions</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {groups.map((group) => {
          const on = group.key === active.key;
          return (
            <ScalePressable
              key={group.key}
              style={[styles.tab, on && styles.tabActive]}
              pressedScale={0.92}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => setSelected(group.key)}>
              <Ionicons name={group.icon} size={15} color={on ? colors.white : colors.textMuted} />
              <Text style={[styles.tabText, on && styles.tabTextActive]}>{group.label}</Text>
            </ScalePressable>
          );
        })}
      </ScrollView>
      <FadeIn key={active.key} distance={8} duration={260} style={styles.panel}>
        {items.map((item, index) => (
          <View key={`${index}-${item}`} style={styles.item}>
            <Ionicons name={active.icon} size={17} color={colors.accent} />
            <Text style={styles.itemText}>{item}</Text>
          </View>
        ))}
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.display,
    fontSize: 21,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  tabs: { gap: spacing.sm, paddingBottom: spacing.md },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.subtleStatus,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tabActive: { backgroundColor: colors.accent },
  tabText: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted },
  tabTextActive: { color: colors.white },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  itemText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, color: colors.text },
});
