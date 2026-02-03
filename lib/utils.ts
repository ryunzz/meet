import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Get user's timezone from browser (client-side only)
export function getUserTimezone(): string {
  if (typeof window === "undefined") {
    return "America/Los_Angeles"; // Fallback for SSR
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Format a time for display (e.g., "9:00 AM")
export function formatTime(isoTime: string, timezone: string): string {
  const date = toZonedTime(parseISO(isoTime), timezone);
  return format(date, "h:mm a");
}

// Format a date for display (e.g., "Monday, February 10")
export function formatDate(isoDate: string, timezone: string): string {
  const date = toZonedTime(parseISO(isoDate), timezone);
  return format(date, "EEEE, MMMM d");
}

// Format a date for display (short form, e.g., "Feb 10")
export function formatDateShort(isoDate: string, timezone: string): string {
  const date = toZonedTime(parseISO(isoDate), timezone);
  return format(date, "MMM d");
}

// Format timezone for display (e.g., "PST" or "America/Los_Angeles")
export function formatTimezone(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value || timezone;
  } catch {
    return timezone;
  }
}

// Parse a date string (YYYY-MM-DD) to a Date object in a specific timezone
export function parseDateInTimezone(dateStr: string, timezone: string): Date {
  // Create a date at midnight in the specified timezone
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)); // Use noon to avoid DST issues
  return toZonedTime(date, timezone);
}

// Get today's date string (YYYY-MM-DD) in a specific timezone
export function getTodayInTimezone(timezone: string): string {
  const now = toZonedTime(new Date(), timezone);
  return format(now, "yyyy-MM-dd");
}

// Check if a date string is today
export function isToday(dateStr: string, timezone: string): boolean {
  return dateStr === getTodayInTimezone(timezone);
}

// Check if a date is in the past
export function isPastDate(dateStr: string, timezone: string): boolean {
  const today = getTodayInTimezone(timezone);
  return dateStr < today;
}

// Generate an array of dates for a month
export function getMonthDates(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }

  return dates;
}

// Format date as YYYY-MM-DD
export function formatDateISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// Generate ICS file content for calendar download
export function generateICS(
  title: string,
  description: string,
  startTime: string,
  endTime: string,
  location?: string
): string {
  const formatICSDate = (isoString: string) => {
    return isoString.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@meet.ryunzz.tech`;
  const now = formatICSDate(new Date().toISOString());
  const start = formatICSDate(startTime);
  const end = formatICSDate(endTime);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//meet.ryunzz.tech//Meeting//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`,
  ];

  if (location) {
    lines.push(`LOCATION:${location}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}

// Trigger ICS file download
export function downloadICS(
  filename: string,
  title: string,
  description: string,
  startTime: string,
  endTime: string,
  location?: string
): void {
  const icsContent = generateICS(title, description, startTime, endTime, location);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
