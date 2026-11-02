import type { ImageProps } from 'expo-image';

// Pictures for the app's fixed destination sections. Trip photos come from the server.
export const PHOTOS = {
  melbourne: require('../../assets/places/melbourne.jpg'),
  sydney: require('../../assets/places/sydney.jpg'),
  bondi: require('../../assets/places/bondi.jpg'),
  eastCoast: require('../../assets/places/east-coast.jpg'),
  greatOceanRoad: require('../../assets/places/great-ocean-road.jpg'),
  blueMountains: require('../../assets/places/blue-mountains.jpg'),
  byron: require('../../assets/places/byron.jpg'),
  noosa: require('../../assets/places/noosa.jpg'),
  kgari: require('../../assets/places/kgari.jpg'),
  whitsundays: require('../../assets/places/whitsundays.jpg'),
  reef: require('../../assets/places/reef.jpg'),
  rainforest: require('../../assets/places/rainforest.jpg'),
  outback: require('../../assets/places/outback.jpg'),
};

export type TourCollection = 'city' | 'east';

export type RouteStop = { place: string; note: string };

export type InclusionGroup = 'experiences' | 'accommodation' | 'included' | 'addOns' | 'transport' | 'meals';

export type Tour = {
  id: string;
  collection: TourCollection;
  title: string;
  badge: string;
  subtitle: string;
  duration: string;
  style: string;
  travel: string;
  price: number | null;
  summary: string;
  description: string;
  highlights: string[];
  route: RouteStop[];
  photo: ImageProps['source'];
  gallery: { uri: string }[];
  meetingPoint: string;
  transport?: string;
  groupSize?: string;
  ageRange?: string;
  inclusions?: Partial<Record<InclusionGroup, string[]>>;
  rating: number | null;
  reviewCount: number;
};

export const PLACEHOLDER_PRICE = '[PRICE]';

export function formatPrice(amount: number | null): string {
  return amount === null ? PLACEHOLDER_PRICE : `$${amount.toLocaleString('en-US')}`;
}
