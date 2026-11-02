import type { Booking } from '@/state/store';
import { parseDate } from '@/utils/validate';

const DAY_MS = 24 * 60 * 60 * 1000;

// Whole calendar days until the date. 0 is today, and negative means it has passed.
export function daysUntil(date: string, today: Date = new Date()): number | null {
  const start = parseDate(date);
  if (!start) return null;
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((start.getTime() - midnight.getTime()) / DAY_MS);
}

export function countdownLabel(days: number | null): string {
  if (days === null) return '';
  if (days > 1) return `${days} days to go`;
  if (days === 1) return 'Tomorrow';
  if (days === 0) return 'Starts today';
  return 'Your trip has started';
}

// The soonest trip that hasn't been cancelled or already started.
export function nextBooking(bookings: Booking[]): Booking | null {
  const upcoming = bookings
    .filter((booking) => {
      const days = daysUntil(booking.date);
      return booking.status !== 'cancelled' && days !== null && days >= 0;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] ?? null;
}
