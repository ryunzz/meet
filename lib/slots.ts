import {
  startOfDay,
  endOfDay,
  addMinutes,
  addDays,
  isBefore,
  isAfter,
  parseISO,
  setHours,
  setMinutes,
  getDay,
  format,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { config, getMeetingType, getAvailabilityForDay } from "./config";
import { getFreeBusy } from "./google-calendar";
import type { TimeSlot, FreeBusyPeriod, MeetingType, DateAvailability } from "./types";

const SLOT_INTERVAL = 15; // Generate slots at 15-minute intervals

/**
 * Generate all possible slot start times for a day based on availability config.
 */
function generatePossibleSlots(
  dateStr: string,
  meetingType: MeetingType
): { start: Date; end: Date }[] {
  // Parse the date and get day of week
  const [year, month, day] = dateStr.split("-").map(Number);
  const dateInTz = new Date(year, month - 1, day);
  const dayOfWeek = getDay(dateInTz);

  // Get availability window for this day
  const availability = getAvailabilityForDay(dayOfWeek);
  if (!availability) {
    return []; // Not available on this day
  }

  // Parse start and end times
  const [startHour, startMin] = availability.start.split(":").map(Number);
  const [endHour, endMin] = availability.end.split(":").map(Number);

  // Create start and end times in config timezone
  const windowStart = fromZonedTime(
    setMinutes(setHours(dateInTz, startHour), startMin),
    config.timezone
  );
  const windowEnd = fromZonedTime(
    setMinutes(setHours(dateInTz, endHour), endMin),
    config.timezone
  );

  const slots: { start: Date; end: Date }[] = [];
  let slotStart = windowStart;

  // Generate slots at SLOT_INTERVAL minute intervals
  while (true) {
    const slotEnd = addMinutes(slotStart, meetingType.duration);

    // Stop if slot would extend past window end
    if (isAfter(slotEnd, windowEnd)) {
      break;
    }

    slots.push({ start: slotStart, end: slotEnd });
    slotStart = addMinutes(slotStart, SLOT_INTERVAL);
  }

  return slots;
}

/**
 * Check if a slot overlaps with any busy period (including buffer time).
 */
function isSlotBusy(
  slot: { start: Date; end: Date },
  busyPeriods: FreeBusyPeriod[],
  bufferMinutes: number
): boolean {
  // Expand the slot by buffer time on both sides
  const slotStartWithBuffer = addMinutes(slot.start, -bufferMinutes);
  const slotEndWithBuffer = addMinutes(slot.end, bufferMinutes);

  return busyPeriods.some((busy) => {
    const busyStart = parseISO(busy.start);
    const busyEnd = parseISO(busy.end);

    // Check for overlap
    return (
      isBefore(slotStartWithBuffer, busyEnd) &&
      isAfter(slotEndWithBuffer, busyStart)
    );
  });
}

/**
 * Get available slots for a specific date and meeting type.
 */
export async function getAvailableSlots(
  dateStr: string, // "2026-02-10" format
  meetingTypeSlug: string
): Promise<TimeSlot[]> {
  // Find meeting type
  const meetingType = getMeetingType(meetingTypeSlug);
  if (!meetingType) {
    throw new Error(`Unknown meeting type: ${meetingTypeSlug}`);
  }

  // Generate all possible slots for the day
  const possibleSlots = generatePossibleSlots(dateStr, meetingType);
  if (possibleSlots.length === 0) {
    return [];
  }

  // Get the day's boundaries for FreeBusy query
  const [year, month, day] = dateStr.split("-").map(Number);
  const dateInTz = new Date(year, month - 1, day);
  const dayStart = fromZonedTime(startOfDay(dateInTz), config.timezone);
  const dayEnd = fromZonedTime(endOfDay(dateInTz), config.timezone);

  // Query Google Calendar for busy periods
  const busyPeriods = await getFreeBusy(
    dayStart.toISOString(),
    dayEnd.toISOString()
  );

  // Current time for filtering past slots
  const now = new Date();
  const minNoticeTime = addMinutes(now, meetingType.minNoticeHours * 60);

  // Filter slots
  const availableSlots: TimeSlot[] = possibleSlots
    .filter((slot) => {
      // Filter out slots that don't meet minimum notice requirement
      if (isBefore(slot.start, minNoticeTime)) {
        return false;
      }

      // Filter out slots that conflict with busy periods
      if (isSlotBusy(slot, busyPeriods, meetingType.bufferMinutes)) {
        return false;
      }

      return true;
    })
    .map((slot) => ({
      startTime: slot.start.toISOString(),
      endTime: slot.end.toISOString(),
    }));

  return availableSlots;
}

/**
 * Get date availability for a range of dates (for calendar display).
 * Returns whether each date has any available slots.
 */
export async function getDateAvailability(
  startDate: string,
  numDays: number,
  meetingTypeSlug: string
): Promise<DateAvailability[]> {
  const meetingType = getMeetingType(meetingTypeSlug);
  if (!meetingType) {
    throw new Error(`Unknown meeting type: ${meetingTypeSlug}`);
  }

  const results: DateAvailability[] = [];
  const now = new Date();
  const maxDate = addDays(now, config.maxBookingDays);

  // Parse start date
  const [year, month, day] = startDate.split("-").map(Number);
  let currentDate = new Date(year, month - 1, day);

  for (let i = 0; i < numDays; i++) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const dayOfWeek = getDay(currentDate);

    // Check if date is within booking window
    const dateInTz = toZonedTime(currentDate, config.timezone);
    const isPast = isBefore(endOfDay(dateInTz), now);
    const isTooFar = isAfter(startOfDay(dateInTz), maxDate);

    // Check if there's availability configured for this day
    const availability = getAvailabilityForDay(dayOfWeek);
    const hasAvailabilityConfig = availability !== null;

    results.push({
      date: dateStr,
      dayOfWeek,
      available: hasAvailabilityConfig && !isPast && !isTooFar,
    });

    currentDate = addDays(currentDate, 1);
  }

  return results;
}

/**
 * Check if a specific date has any availability (without querying FreeBusy).
 * Used for quick calendar rendering.
 */
export function hasAvailabilityConfig(dateStr: string): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = getDay(date);
  const availability = getAvailabilityForDay(dayOfWeek);
  return availability !== null;
}

/**
 * Check if a date is within the booking window.
 */
export function isDateBookable(dateStr: string): boolean {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();
  const maxDate = addDays(now, config.maxBookingDays);

  // Check if date is in the past
  if (isBefore(endOfDay(date), now)) {
    return false;
  }

  // Check if date is too far in the future
  if (isAfter(startOfDay(date), maxDate)) {
    return false;
  }

  // Check if there's availability config for this day
  return hasAvailabilityConfig(dateStr);
}
