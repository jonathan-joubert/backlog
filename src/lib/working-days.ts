// South African working-day counter (Mon–Fri, excluding public holidays).
// Holidays per the Public Holidays Act 36 of 1994, including the rule that a
// holiday falling on a Sunday is observed on the following Monday.

export const LEGAL_WORKING_DAYS = 120;

const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

// Once-off holidays declared by the President (e.g. election days).
const SPECIAL_HOLIDAYS: [number, number, number][] = [
  [2016, 7, 3], // Local government elections
  [2019, 4, 8], // National elections
  [2021, 10, 1], // Local government elections
  [2022, 11, 27], // Rugby World Cup / Day of Goodwill observed
  [2023, 11, 15], // Rugby World Cup victory
  [2024, 4, 29], // National elections
];

const cache = new Map<number, Set<string>>();

function holidaysFor(year: number): Set<string> {
  const cached = cache.get(year);
  if (cached) return cached;
  const set = new Set<string>();
  const fixed: [number, number][] = [
    [0, 1], [2, 21], [3, 27], [4, 1], [5, 16], [7, 9], [8, 24], [11, 16], [11, 25], [11, 26],
  ];
  for (const [m, d] of fixed) {
    const date = new Date(year, m, d);
    set.add(key(date));
    if (date.getDay() === 0) set.add(key(new Date(year, m, d + 1)));
  }
  const easter = easterSunday(year);
  set.add(key(new Date(year, easter.getMonth(), easter.getDate() - 2))); // Good Friday
  set.add(key(new Date(year, easter.getMonth(), easter.getDate() + 1))); // Family Day
  for (const [y, m, d] of SPECIAL_HOLIDAYS) if (y === year) set.add(key(new Date(y, m, d)));
  cache.set(year, set);
  return set;
}

export function isWorkingDay(d: Date) {
  const day = d.getDay();
  return day !== 0 && day !== 6 && !holidaysFor(d.getFullYear()).has(key(d));
}

/** Working days elapsed after `isoDate` (yyyy-mm-dd) up to and including today. */
export function workingDaysSince(isoDate: string, today = new Date()): number | null {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  const cursor = new Date(y, m - 1, d);
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (cursor > end) return 0;
  let count = 0;
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= end) {
    if (isWorkingDay(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}
