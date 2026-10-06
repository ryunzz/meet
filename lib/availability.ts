import { addDays, addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { MeetingType, Weekday, WeeklyHours } from "./config";

export interface Interval {
  start: Date;
  end: Date;
}

const WEEKDAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** "2026-10-06" -> "2026-10-07", independent of the host timezone. */
export function nextDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function weekdayOf(date: string): Weekday {
  return WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
}

/**
 * Bookable start times in [from, to), honoring weekly hours (in `timezone`),
 * minimum notice, the booking horizon, and busy periods padded by the buffer.
 */
export function computeSlots(opts: {
  meetingType: MeetingType;
  from: Date;
  to: Date;
  busy: Interval[];
  now: Date;
  timezone: string;
  hours: WeeklyHours;
  maxBookingDays: number;
}): Date[] {
  const { meetingType: mt, busy, timezone, hours } = opts;

  const noticeCutoff = addMinutes(opts.now, mt.minNoticeMinutes);
  // Bookable through the end of the last allowed day, in the owner's timezone.
  const lastBookableDay = formatInTimeZone(addDays(opts.now, opts.maxBookingDays), timezone, "yyyy-MM-dd");
  const horizon = fromZonedTime(`${nextDay(lastBookableDay)}T00:00:00`, timezone);
  const earliest = opts.from > noticeCutoff ? opts.from : noticeCutoff;
  const latest = opts.to < horizon ? opts.to : horizon;
  if (earliest >= latest) return [];

  const isFree = (start: Date, end: Date) => {
    const paddedStart = addMinutes(start, -mt.bufferMinutes);
    const paddedEnd = addMinutes(end, mt.bufferMinutes);
    return !busy.some((b) => b.start < paddedEnd && b.end > paddedStart);
  };

  const slots: Date[] = [];
  const lastDay = formatInTimeZone(latest, timezone, "yyyy-MM-dd");

  for (
    let day = formatInTimeZone(earliest, timezone, "yyyy-MM-dd");
    day <= lastDay;
    day = nextDay(day)
  ) {
    for (const window of hours[weekdayOf(day)]) {
      const windowEnd = fromZonedTime(`${day}T${window.end}:00`, timezone);
      let start = fromZonedTime(`${day}T${window.start}:00`, timezone);

      for (; ; start = addMinutes(start, mt.increment)) {
        const end = addMinutes(start, mt.duration);
        if (end > windowEnd || start >= latest) break;
        if (start >= earliest && isFree(start, end)) slots.push(start);
      }
    }
  }

  return slots;
}
