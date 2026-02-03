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
  availability: {
    monday: { start: "09:00", end: "17:00" },
    tuesday: { start: "09:00", end: "17:00" },
    wednesday: { start: "09:00", end: "17:00" },
    thursday: { start: "09:00", end: "17:00" },
    friday: { start: "09:00", end: "17:00" },
    saturday: null,
    sunday: null,
  },

  // Meeting types available for booking
  meetingTypes: [
    {
      slug: "15min",
      title: "15 Minute Chat",
      description: "A quick 15-minute call to discuss any topic",
      duration: 15,
      bufferMinutes: 15,
      minNoticeHours: 2,
      color: "#10b981", // emerald
    },
    {
      slug: "30min",
      title: "30 Minute Call",
      description: "A 30-minute meeting for deeper discussions",
      duration: 30,
      bufferMinutes: 15,
      minNoticeHours: 4,
      color: "#3b82f6", // blue
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
