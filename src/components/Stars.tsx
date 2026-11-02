import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { PopIn, ScalePressable } from '@/components/Motion';
import { colors, fonts, spacing } from '@/theme';

const STAR_COLOR = '#F5A524';
const STARS = [1, 2, 3, 4, 5];

function starIcon(star: number, rating: number) {
  if (rating >= star) return 'star';
  return rating >= star - 0.5 ? 'star-half' : 'star-outline';
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`${rating} out of 5 stars`}>
      {STARS.map((star) => (
        <Ionicons key={star} name={starIcon(star, rating)} size={size} color={STAR_COLOR} />
      ))}
    </View>
  );
}

export function StarPicker({ rating, onChange }: { rating: number; onChange: (rating: number) => void }) {
  return (
    <View style={styles.picker} accessibilityRole="radiogroup" accessibilityLabel="Your rating">
      {STARS.map((star) => (
        <ScalePressable
          key={star}
          pressedScale={0.8}
          hitSlop={6}
          accessibilityRole="radio"
          accessibilityLabel={`${star} ${star === 1 ? 'star' : 'stars'}`}
          accessibilityState={{ selected: rating === star }}
          onPress={() => onChange(star)}>
          <PopIn key={rating >= star ? 'on' : 'off'}>
            <Ionicons name={rating >= star ? 'star' : 'star-outline'} size={32} color={STAR_COLOR} />
          </PopIn>
        </ScalePressable>
      ))}
    </View>
  );
}

// A small "★ 4.8 (12)" for cards. Shows nothing until a trip has real reviews.
export function RatingBadge({ rating, count }: { rating: number | null; count: number }) {
  if (rating === null || count === 0) return null;
  return (
    <View style={styles.badge} accessibilityLabel={`Rated ${rating} out of 5 from ${count} reviews`}>
      <Ionicons name="star" size={13} color={STAR_COLOR} />
      <Text style={styles.badgeRating}>{rating.toFixed(1)}</Text>
      <Text style={styles.badgeCount}>({count})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  picker: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: spacing.xs },
  badgeRating: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  badgeCount: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
});
