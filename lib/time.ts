import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

// Client-side date helpers. Calendar days are plain "yyyy-MM-dd" strings in the
// guest's timezone; instants are ISO strings from the API.

export const monthOf = (instant: Date | string, tz: string) => formatInTimeZone(instant, tz, "yyyy-MM");

export const dayOf = (instant: Date | string, tz: string) => formatInTimeZone(instant, tz, "yyyy-MM-dd");

/** "2026-10", 1 -> "2026-11" */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

/** The month as an instant range in the guest's timezone. */
export function monthRange(month: string, tz: string) {
  return {
    from: fromZonedTime(`${month}-01T00:00:00`, tz),
    to: fromZonedTime(`${shiftMonth(month, 1)}-01T00:00:00`, tz),
  };
}

/** Calendar cells for a month, Sunday-first, with nulls as leading padding. */
export function monthGrid(month: string): (string | null)[] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array(first.getUTCDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${month}-${String(d).padStart(2, "0")}`);
  }
  return cells;
}

/** Format a plain calendar day or month ("2026-10-07", "2026-10") with a date-fns pattern. */
export function formatDay(day: string, pattern: string): string {
  const date = day.length === 7 ? `${day}-01` : day;
  return formatInTimeZone(`${date}T12:00:00Z`, "UTC", pattern);
}

/** "9:30am" */
export const formatTime = (instant: Date | string, tz: string) =>
  formatInTimeZone(instant, tz, "h:mmaaa");

/** "9:30am – 10:00am, Tuesday, October 7, 2026" */
export function formatRange(start: Date | string, end: Date | string, tz: string) {
  return `${formatTime(start, tz)} – ${formatTime(end, tz)}, ${formatInTimeZone(start, tz, "EEEE, MMMM d, yyyy")}`;
}

export function formatZone(tz: string, at: Date = new Date()) {
  return `${tz.replaceAll("_", " ")} (${formatTime(at, tz)})`;
}
