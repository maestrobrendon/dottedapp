/**
 * Returns the next calendar occurrence of a given month/day relative to `today`.
 * For recurring events: next year's date if this year's has passed.
 * For non-recurring: the specific date if still in the future, null otherwise.
 */
export function nextOccurrenceDate(
  month: number,
  day: number,
  year: number | null,
  isRecurring: boolean,
  today: Date,
): Date | null {
  const todayFlat = new Date(today);
  todayFlat.setHours(0, 0, 0, 0);

  if (isRecurring) {
    const thisYear = todayFlat.getFullYear();
    const candidate = new Date(thisYear, month - 1, day);
    if (candidate >= todayFlat) return candidate;
    return new Date(thisYear + 1, month - 1, day);
  }

  const y = year ?? todayFlat.getFullYear();
  const candidate = new Date(y, month - 1, day);
  return candidate >= todayFlat ? candidate : null;
}

export function daysUntil(date: Date, today: Date): number {
  const a = new Date(today);
  a.setHours(0, 0, 0, 0);
  const b = new Date(date);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function relativeLabel(days: number): string {
  if (days === 0) return "today!";
  if (days === 1) return "tomorrow";
  if (days < 7) return `in ${days} days`;
  if (days < 14) return "in 1 week";
  if (days < 30) return `in ${Math.floor(days / 7)} weeks`;
  if (days < 60) return "in 1 month";
  if (days < 365) return `in ${Math.floor(days / 30)} months`;
  const y = Math.floor(days / 365);
  return `in ${y} year${y > 1 ? "s" : ""}`;
}

export type Section = "This week" | "This month" | "Later";

export function sectionFor(days: number): Section {
  if (days < 7) return "This week";
  if (days < 30) return "This month";
  return "Later";
}
