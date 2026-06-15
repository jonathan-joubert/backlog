// SA public holidays (static representative list, 2024-2027).
// Source: SA Public Holidays Act. Holidays falling on a Sunday move to Monday.
const SA_PUBLIC_HOLIDAYS: string[] = [
  // 2024
  "2024-01-01", "2024-03-21", "2024-03-29", "2024-04-01", "2024-04-27",
  "2024-05-01", "2024-05-29", "2024-06-17", "2024-08-09", "2024-09-24",
  "2024-12-16", "2024-12-25", "2024-12-26",
  // 2025
  "2025-01-01", "2025-03-21", "2025-04-18", "2025-04-21", "2025-04-28",
  "2025-05-01", "2025-06-16", "2025-08-09", "2025-09-24", "2025-12-16",
  "2025-12-25", "2025-12-26",
  // 2026
  "2026-01-01", "2026-03-21", "2026-04-03", "2026-04-06", "2026-04-27",
  "2026-05-01", "2026-06-16", "2026-08-10", "2026-09-24", "2026-12-16",
  "2026-12-25", "2026-12-28",
  // 2027
  "2027-01-01", "2027-03-22", "2027-03-26", "2027-03-29", "2027-04-27",
  "2027-05-03", "2027-06-16", "2027-08-09", "2027-09-24", "2027-12-16",
  "2027-12-27", "2027-12-28",
];

const HOLIDAY_SET = new Set(SA_PUBLIC_HOLIDAYS);

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function calendarDaysSince(isoDate: string): number {
  const start = startOfDay(new Date(isoDate));
  const today = startOfDay(new Date());
  const ms = today.getTime() - start.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function saWorkingDaysSince(isoDate: string): number {
  const start = startOfDay(new Date(isoDate));
  const today = startOfDay(new Date());
  if (today <= start) return 0;
  let count = 0;
  const cursor = new Date(start);
  cursor.setDate(cursor.getDate() + 1); // exclude the submission day itself
  while (cursor <= today) {
    const dow = cursor.getDay();
    const iso = toISODate(cursor);
    if (dow !== 0 && dow !== 6 && !HOLIDAY_SET.has(iso)) {
      count++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function addYears(isoDate: string, years: number): Date {
  const d = new Date(isoDate);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

export interface Countdown {
  expired: boolean;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  expiryDate: Date;
}

export function countdownTo(target: Date): Countdown {
  const now = startOfDay(new Date());
  const end = startOfDay(target);
  const totalDays = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const expired = totalDays < 0;

  // Calendar Y/M/D diff
  let years = end.getFullYear() - now.getFullYear();
  let months = end.getMonth() - now.getMonth();
  let days = end.getDate() - now.getDate();
  if (days < 0) {
    months -= 1;
    const prev = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prev.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return {
    expired,
    years: Math.abs(years),
    months: Math.abs(months),
    days: Math.abs(days),
    totalDays,
    expiryDate: end,
  };
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
}
