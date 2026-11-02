import { useEffect, useState } from 'react';

import { api } from '@/api/client';

const SYMBOLS: Record<string, string> = { AUD: 'A$', NZD: 'NZ$', USD: 'US$', INR: '₹' };

function withCommas(whole: number): string {
  return String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Written by hand rather than with Intl, which isn't the same on every phone.
export function formatMoney(cents: number, currency = 'AUD'): string {
  const symbol = SYMBOLS[currency] ?? `${currency} `;
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(Math.round(cents));
  const pence = String(absolute % 100).padStart(2, '0');
  return `${sign}${symbol}${withCommas(Math.floor(absolute / 100))}.${pence}`;
}

export type BookingTerms = {
  currency: string;
  depositPerTraveller: number;
  cardFeePercent: number;
  onlinePaymentOn: boolean;
};

let cachedTerms: BookingTerms | null = null;

// The server works out the real amounts. This is only for showing them before booking.
export function useBookingTerms(): BookingTerms | null {
  const [terms, setTerms] = useState(cachedTerms);

  useEffect(() => {
    if (cachedTerms) return;
    let active = true;
    api<BookingTerms>('/api/booking-terms')
      .then((result) => {
        cachedTerms = result;
        if (active) setTerms(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return terms;
}

export function checkoutAmounts(pricePerPerson: number, travellers: number, terms: BookingTerms) {
  const baseCents = pricePerPerson * travellers * 100;
  const feeCents = Math.round(baseCents * (terms.cardFeePercent / 100));
  const totalCents = baseCents + feeCents;
  const depositCents = terms.depositPerTraveller * travellers * 100;
  return {
    baseCents,
    feeCents,
    totalCents,
    depositCents,
    depositAllowed: depositCents > 0 && depositCents < totalCents,
  };
}
