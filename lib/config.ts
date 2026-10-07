export type Weekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

// "HH:mm" in the owner's timezone. A day can have several windows.
export type WeeklyHours = Record<Weekday, { start: string; end: string }[]>;

export interface MeetingType {
  slug: string;
  title: string;
  description: string;
  duration: number; // minutes
  increment: number; // minutes between offered start times
  bufferMinutes: number; // kept free before and after other events
  minNoticeMinutes: number;
  color: string;
}

const workday = [{ start: "09:00", end: "19:00" }];

export const site = {
  url: "https://meet.ryunzz.tech",
  owner: {
    name: "Ryun",
    // Image in /public, or null to show initials.
    avatar: "/avatar.png" as string | null,
    // Plain strings and links; rendered under the name and flattened for link previews.
    intro: [
      "Prev SWE @ Apple, Founder @ ",
      { text: "Lightyear", href: "https://x.com/eostudi0/status/2085019791077900397" },
      " (S26, incubated by HF0)",
    ] as (string | { text: string; href: string })[],
  },
  timezone: "America/Los_Angeles",
  // Guests can book through the end of this many days from today.
  maxBookingDays: 14,
  // Per guest email, per calendar day (owner's timezone).
  maxBookingsPerGuestPerDay: 4,
  hours: {
    sun: [],
    mon: workday,
    tue: workday,
    wed: workday,
    thu: workday,
    fri: workday,
    sat: workday,
  } satisfies WeeklyHours,
};

export const meetingTypes: MeetingType[] = [
  {
    slug: "15",
    title: "15 minute chat",
    description: "A quick call to say hi, ask a question, or sync on something small.",
    duration: 15,
    increment: 15,
    bufferMinutes: 15,
    minNoticeMinutes: 2 * 60,
    color: "#12b886",
  },
  {
    slug: "30",
    title: "30 minute meeting",
    description: "Enough time to talk through an idea or project properly.",
    duration: 30,
    increment: 30,
    bufferMinutes: 15,
    minNoticeMinutes: 4 * 60,
    color: "#0069ff",
  },
  {
    slug: "60",
    title: "60 minute deep dive",
    description: "For in-depth discussions, working sessions, or anything that needs room.",
    duration: 60,
    increment: 30,
    bufferMinutes: 15,
    minNoticeMinutes: 4 * 60,
    color: "#8247f5",
  },
];

export const introText = site.owner.intro.map((part) => (typeof part === "string" ? part : part.text)).join("");

export function getMeetingType(slug: string) {
  return meetingTypes.find((mt) => mt.slug === slug);
}
