import { format, isValid, parseISO } from "date-fns";

export const RETENTION_DAYS = 60;

/** yyyy-MM-dd for "today" in UTC, matching how we bucket articles by day. */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** yyyy-MM-dd for an arbitrary Date, in UTC. */
export function utcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * yyyy-MM-dd for the given Date in the caller's local timezone — used only
 * for "the calendar day a visitor picked" in the browser date picker.
 */
export function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** UTC-midnight Date, RETENTION_DAYS before the current UTC day. */
export function earliestRetainedDate(): Date {
  const [y, m, d] = todayKey().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - RETENTION_DAYS));
}

export function isWithinRetention(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  if (!isValid(parseISO(key))) return false;
  return key >= utcDateKey(earliestRetainedDate()) && key <= todayKey();
}

export function formatLong(key: string): string {
  const parsed = parseISO(key);
  if (!isValid(parsed)) return key;
  return format(parsed, "EEEE, MMMM d, yyyy");
}
