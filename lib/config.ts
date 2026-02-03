import type { SiteConfig } from "./types";

export const config: SiteConfig = {
  owner: {
    name: "Ryun",
    tagline: "Book a meeting with me",
    avatar: "/avatar.jpg",
  },

  // All availability times are in this timezone
  timezone: "America/Los_Angeles",

  // Weekly availability windows (null = not available)
  // Actual availability is filtered by Google Calendar FreeBusy API
  availability: {
    monday: { start: "09:00", end: "22:00" },
    tuesday: { start: "09:00", end: "22:00" },
    wednesday: { start: "09:00", end: "22:00" },
    thursday: { start: "09:00", end: "22:00" },
    friday: { start: "09:00", end: "22:00" },
    saturday: { start: "09:00", end: "22:00" },
    sunday: { start: "09:00", end: "22:00" },
  },

  // Meeting types available for booking
  meetingTypes: [
    {
      slug: "15",
      title: "15 Minutes",
      description: "A quick 15-minute call",
      duration: 15,
      bufferMinutes: 15,
      minNoticeHours: 2,
      color: "#10b981", // emerald
    },
    {
      slug: "30",
      title: "30 Minutes",
      description: "A 30-minute meeting",
      duration: 30,
      bufferMinutes: 15,
      minNoticeHours: 4,
      color: "#3b82f6", // blue
    },
    {
      slug: "60",
      title: "60 Minutes",
      description: "A 1-hour meeting for in-depth discussions",
      duration: 60,
      bufferMinutes: 15,
      minNoticeHours: 4,
      color: "#8b5cf6", // purple
    },
  ],

  // How far ahead bookings can be made
  maxBookingDays: 30,
};

// Helper to get meeting type by slug
export function getMeetingType(slug: string) {
  return config.meetingTypes.find((mt) => mt.slug === slug);
}

// Helper to get availability for a day of week (0 = Sunday)
export function getAvailabilityForDay(dayOfWeek: number) {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  const day = days[dayOfWeek];
  return config.availability[day];
}
