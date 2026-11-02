import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { FadeIn, staggerDelay } from '@/components/Motion';
import { TourRow } from '@/components/TourCards';
import { TourFilterBar, useTourFilters } from '@/components/TourFilterBar';
import { ToursStatus } from '@/components/ToursStatus';
import { useStore } from '@/state/store';
import { colors, fonts, radius, spacing } from '@/theme';
import { useStatusBar } from '@/utils/useStatusBar';

export default function SearchScreen() {
  useStatusBar('dark');
  const { tours: allTours, toursStatus } = useStore();
  const [query, setQuery] = useState('');

  const searched = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return allTours;
    return allTours.filter((tour) =>
      [tour.title, tour.subtitle, ...tour.route.map((stop) => stop.place)]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [query, allTours]);
  const { filters, setFilters, results: tours } = useTourFilters(searched);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={tours}
      keyExtractor={(tour) => tour.id}
      renderItem={({ item, index }) => (
        <FadeIn delay={staggerDelay(index)} distance={14} duration={320}>
          <TourRow tour={item} />
        </FadeIn>
      )}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <>
          <View style={styles.search}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Search tours or places"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Search tours or places"
              returnKeyType="search"
              autoFocus
            />
          </View>
          <TourFilterBar tours={allTours} filters={filters} onChange={setFilters} resultCount={tours.length} />
        </>
      }
      ListEmptyComponent={
        toursStatus === 'ready' ? (
          <Text style={styles.empty}>No tours match your search or filters.</Text>
        ) : (
          <ToursStatus />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  input: { flex: 1, height: 48, fontFamily: fonts.regular, fontSize: 16, color: colors.text },
  empty: {
    fontFamily: fonts.regular,
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
});
