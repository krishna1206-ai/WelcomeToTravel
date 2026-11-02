export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// 8 to 14 characters including any "+" country code, ignoring spaces, brackets and dashes.
export function isValidPhone(phone: string): boolean {
  return /^(?=.{8,14}$)\+?\d+$/.test(phone.replace(/[\s()-]/g, ''));
}

export function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function parseDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
}

// Accepts a real calendar date in YYYY-MM-DD format, from today onwards.
export function isValidFutureDate(value: string, today: Date = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isRealDate) return false;

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date >= startOfToday;
}
