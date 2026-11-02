import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FadeIn, PopIn, ScalePressable } from '@/components/Motion';
import type { Tour } from '@/data/tours';
import { colors, fonts, radius, spacing } from '@/theme';
import {
  activeFilterCount,
  applyTourFilters,
  LENGTH_OPTIONS,
  NO_FILTERS,
  PRICE_OPTIONS,
  SORT_OPTIONS,
  styleOptions,
  type TourFilters,
} from '@/utils/tourFilters';

export function useTourFilters(tours: Tour[]) {
  const [filters, setFilters] = useState<TourFilters>(NO_FILTERS);
  const results = useMemo(() => applyTourFilters(tours, filters), [tours, filters]);
  return { filters, setFilters, results };
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <ScalePressable
      style={[styles.chip, active && styles.chipActive]}
      pressedScale={0.92}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </ScalePressable>
  );
}

function Group<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupChips}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

export function TourFilterBar({
  tours,
  filters,
  onChange,
  resultCount,
}: {
  tours: Tour[];
  filters: TourFilters;
  onChange: (filters: TourFilters) => void;
  resultCount: number;
}) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(filters);
  const styleChoices = styleOptions(tours);

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        <ScalePressable
          style={[styles.chip, styles.filterButton, (open || count > 0) && styles.filterButtonActive]}
          pressedScale={0.92}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={count > 0 ? `Filters, ${count} on` : 'Filters'}
          onPress={() => setOpen((value) => !value)}>
          <Ionicons name="options-outline" size={16} color={colors.primaryText} />
          <Text style={styles.filterText}>Filters</Text>
          {count > 0 && (
            <PopIn key={count} style={styles.count}>
              <Text style={styles.countText}>{count}</Text>
            </PopIn>
          )}
        </ScalePressable>
        {SORT_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            active={option.value === filters.sort}
            onPress={() => onChange({ ...filters, sort: option.value })}
          />
        ))}
      </ScrollView>

      {open && (
        <FadeIn distance={-8} duration={220} style={styles.panel}>
          <Group
            title="Price"
            options={PRICE_OPTIONS}
            value={filters.price}
            onChange={(price) => onChange({ ...filters, price })}
          />
          <Group
            title="Trip length"
            options={LENGTH_OPTIONS}
            value={filters.length}
            onChange={(length) => onChange({ ...filters, length })}
          />
          {styleChoices.length > 1 && (
            <Group
              title="Style"
              options={[
                { value: 'any', label: 'Any style' },
                ...styleChoices.map((style) => ({ value: style, label: style })),
              ]}
              value={filters.style}
              onChange={(style) => onChange({ ...filters, style })}
            />
          )}
          <View style={styles.panelFooter}>
            <Text style={styles.resultCount}>
              {resultCount} {resultCount === 1 ? 'tour' : 'tours'}
            </Text>
            {count > 0 && (
              <Pressable
                hitSlop={8}
                accessibilityRole="button"
                onPress={() => onChange({ ...NO_FILTERS, sort: filters.sort })}>
                <Text style={styles.clear}>Clear filters</Text>
              </Pressable>
            )}
          </View>
        </FadeIn>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  row: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  chipTextActive: { fontFamily: fonts.semibold, color: colors.white },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  filterButtonActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  filterText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primaryText },
  count: {
    minWidth: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countText: { fontFamily: fonts.bold, fontSize: 11, color: colors.white },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  group: { marginBottom: spacing.md },
  groupTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, marginBottom: spacing.xs },
  groupChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  panelFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  clear: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
});
