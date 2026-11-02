import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { api } from '@/api/client';
import type { Review } from '@/components/TourReviews';

type LatestReviews = { count: number; average: number | null; reviews: Review[] };

const NO_REVIEWS: LatestReviews = { count: 0, average: null, reviews: [] };

// Without a connection these sections just stay hidden, like they do before any reviews exist.
export function useLatestReviews(): LatestReviews {
  const [data, setData] = useState(NO_REVIEWS);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      api<LatestReviews>('/api/reviews/latest')
        .then((result) => {
          if (active) setData(result);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  return data;
}
