import type { Tour } from '@/data/tours';

export type SortKey = 'recommended' | 'priceLow' | 'priceHigh' | 'rating' | 'shortest';
export type PriceKey = 'any' | 'under1000' | 'mid' | 'over5000';
export type LengthKey = 'any' | 'short' | 'medium' | 'long';

export type TourFilters = { sort: SortKey; price: PriceKey; length: LengthKey; style: string };

export const NO_FILTERS: TourFilters = { sort: 'recommended', price: 'any', length: 'any', style: 'any' };

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'priceLow', label: 'Price: low to high' },
  { value: 'priceHigh', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'shortest', label: 'Shortest first' },
];

export const PRICE_OPTIONS: { value: PriceKey; label: string }[] = [
  { value: 'any', label: 'Any price' },
  { value: 'under1000', label: 'Under $1,000' },
  { value: 'mid', label: '$1,000 to $5,000' },
  { value: 'over5000', label: 'Over $5,000' },
];

export const LENGTH_OPTIONS: { value: LengthKey; label: string }[] = [
  { value: 'any', label: 'Any length' },
  { value: 'short', label: 'Up to 7 days' },
  { value: 'medium', label: '8 to 30 days' },
  { value: 'long', label: 'Over 30 days' },
];

// Durations are typed by the admin, like "30 days". Anything without a number stays unknown.
export function tourDays(tour: Tour): number | null {
  const match = /\d+/.exec(tour.duration);
  return match ? Number(match[0]) : null;
}

function matchesPrice(tour: Tour, price: PriceKey): boolean {
  if (price === 'any') return true;
  if (tour.price === null) return false;
  if (price === 'under1000') return tour.price < 1000;
  if (price === 'mid') return tour.price >= 1000 && tour.price <= 5000;
  return tour.price > 5000;
}

function matchesLength(tour: Tour, length: LengthKey): boolean {
  if (length === 'any') return true;
  const days = tourDays(tour);
  if (days === null) return false;
  if (length === 'short') return days <= 7;
  if (length === 'medium') return days >= 8 && days <= 30;
  return days > 30;
}

// Trips missing the value being sorted on always go last.
function byNumber(a: number | null, b: number | null, direction: 1 | -1): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * direction;
}

export function applyTourFilters(tours: Tour[], filters: TourFilters): Tour[] {
  const matching = tours.filter(
    (tour) =>
      matchesPrice(tour, filters.price) &&
      matchesLength(tour, filters.length) &&
      (filters.style === 'any' || tour.style === filters.style),
  );
  if (filters.sort === 'priceLow') return matching.slice().sort((a, b) => byNumber(a.price, b.price, 1));
  if (filters.sort === 'priceHigh') return matching.slice().sort((a, b) => byNumber(a.price, b.price, -1));
  if (filters.sort === 'rating') return matching.slice().sort((a, b) => byNumber(a.rating, b.rating, -1));
  if (filters.sort === 'shortest') return matching.slice().sort((a, b) => byNumber(tourDays(a), tourDays(b), 1));
  return matching;
}

export function activeFilterCount(filters: TourFilters): number {
  return [filters.price !== 'any', filters.length !== 'any', filters.style !== 'any'].filter(Boolean).length;
}

// Leaves out unfinished values like "[STYLE]" so customers never see them as a choice.
export function styleOptions(tours: Tour[]): string[] {
  return [...new Set(tours.map((tour) => tour.style))].filter((style) => style && !style.startsWith('['));
}
