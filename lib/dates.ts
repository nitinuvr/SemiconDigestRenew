import { format, isValid, parseISO, subDays } from "date-fns";

export const RETENTION_DAYS = 60;

/** yyyy-MM-dd for "today" in UTC, matching how we bucket articles by day. */
export function todayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function earliestRetainedDate(): Date {
  return subDays(new Date(), RETENTION_DAYS);
}

export function isWithinRetention(key: string): boolean {
  const parsed = parseISO(key);
  if (!isValid(parsed)) return false;
  return parsed >= earliestRetainedDate() && parsed <= new Date();
}

export function formatLong(key: string): string {
  const parsed = parseISO(key);
  if (!isValid(parsed)) return key;
  return format(parsed, "EEEE, MMMM d, yyyy");
}
