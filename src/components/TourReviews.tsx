import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { api, errorMessage } from '@/api/client';
import { Avatar } from '@/components/Avatar';
import { Reveal } from '@/components/Motion';
import { StarPicker, Stars } from '@/components/Stars';
import { Button, Card, Field, TextLink } from '@/components/ui';
import { useAuth } from '@/state/auth';
import { useStore } from '@/state/store';
import { colors, fonts, spacing } from '@/theme';

export type Review = {
  id: number;
  tourId: string;
  tourTitle: string;
  rating: number;
  body: string;
  name: string;
  photo: string | null;
  createdAt: string;
};

type ReviewData = {
  count: number;
  average: number | null;
  reviews: Review[];
  mine: Review | null;
  canReview: boolean;
};

const MAX_REVIEW = 1000;

export function ReviewCard({ review, showTrip = false }: { review: Review; showTrip?: boolean }) {
  return (
    <Card style={styles.review}>
      <View style={styles.reviewHeader}>
        <ReviewerPhoto review={review} />
        <View style={styles.reviewPerson}>
          <Text style={styles.reviewName}>{review.name}</Text>
          <Stars rating={review.rating} size={13} />
        </View>
        <Text style={styles.reviewDate}>{review.createdAt.slice(0, 10)}</Text>
      </View>
      {showTrip && <Text style={styles.reviewTrip}>{review.tourTitle}</Text>}
      {review.body !== '' && <Text style={styles.reviewBody}>{review.body}</Text>}
    </Card>
  );
}

function ReviewerPhoto({ review }: { review: Review }) {
  return (
    <Avatar
      size={38}
      user={{
        id: review.id,
        name: review.name,
        email: '',
        phone: '',
        city: '',
        state: '',
        country: '',
        role: 'customer',
        photo: review.photo,
      }}
    />
  );
}

export function TourReviews({ tourId }: { tourId: string }) {
  const { token } = useAuth();
  const { reloadTours } = useStore();
  const [data, setData] = useState<ReviewData | null>(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await api<ReviewData>(`/api/tours/${tourId}/reviews`, { token });
    setData(result);
  }, [tourId, token]);

  useFocusEffect(
    useCallback(() => {
      load().catch((failure) => console.warn('Could not load reviews', failure));
    }, [load]),
  );

  function startEditing() {
    setRating(data?.mine?.rating ?? 0);
    setBody(data?.mine?.body ?? '');
    setError('');
    setEditing(true);
  }

  async function run(action: () => Promise<unknown>) {
    setError('');
    setBusy(true);
    try {
      await action();
      await load();
      await reloadTours();
      setEditing(false);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (rating === 0) {
      setError('Tap the stars to choose a rating.');
      return;
    }
    run(() =>
      api(`/api/tours/${tourId}/reviews/mine`, {
        method: 'PUT',
        token,
        body: { rating, body: body.trim() },
      }),
    );
  }

  if (!data) return null;

  const others = data.reviews.filter((review) => review.id !== data.mine?.id);

  return (
    <View>
      <Reveal>
        <Text style={styles.heading}>Reviews</Text>
        {data.average !== null ? (
          <View style={styles.summary}>
            <Text style={styles.average}>{data.average.toFixed(1)}</Text>
            <View>
              <Stars rating={data.average} size={16} />
              <Text style={styles.count}>
                {data.count} {data.count === 1 ? 'review' : 'reviews'}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.empty}>No reviews yet. They come from travellers who have taken this trip.</Text>
        )}
      </Reveal>

      {data.canReview && !editing && !data.mine && (
        <Button label="Write a review" variant="outline" style={styles.writeButton} onPress={startEditing} />
      )}

      {editing && (
        <Card style={styles.form}>
          <Text style={styles.formTitle}>{data.mine ? 'Edit your review' : 'How was your trip?'}</Text>
          <StarPicker rating={rating} onChange={setRating} />
          <Field
            label="Your review (optional)"
            value={body}
            maxLength={MAX_REVIEW}
            multiline
            onChangeText={setBody}
          />
          {error !== '' && <Text style={styles.error}>{error}</Text>}
          <Button label={busy ? 'Saving…' : 'Post review'} style={styles.save} onPress={busy ? () => undefined : save} />
          <View style={styles.formLink}>
            <TextLink label="Cancel" onPress={() => setEditing(false)} />
          </View>
        </Card>
      )}

      {data.mine && !editing && (
        <View>
          <ReviewCard review={data.mine} />
          <View style={styles.mineActions}>
            <TextLink label="Edit your review" onPress={startEditing} />
            <TextLink
              label={busy ? 'Removing…' : 'Remove'}
              onPress={() => run(() => api(`/api/tours/${tourId}/reviews/mine`, { method: 'DELETE', token }))}
            />
          </View>
          {error !== '' && <Text style={styles.error}>{error}</Text>}
        </View>
      )}

      {others.map((review) => (
        <Reveal key={review.id}>
          <ReviewCard review={review} />
        </Reveal>
      ))}
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
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  average: { fontFamily: fonts.display, fontSize: 36, color: colors.text },
  count: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  empty: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  writeButton: { marginTop: spacing.md },
  form: { marginTop: spacing.md },
  formTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  save: { marginTop: spacing.md },
  formLink: { alignItems: 'center', marginTop: spacing.md },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.error, marginTop: spacing.sm },
  review: { marginBottom: spacing.md },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reviewPerson: { flex: 1, gap: 2 },
  reviewName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  reviewDate: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  reviewTrip: { fontFamily: fonts.semibold, fontSize: 13, color: colors.primary, marginTop: spacing.sm },
  reviewBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.text, marginTop: spacing.sm },
  mineActions: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
});
