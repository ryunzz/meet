import { describe, expect, test } from "bun:test";
import { computeSlots, nextDay } from "./availability";
import type { MeetingType, WeeklyHours } from "./config";

const tz = "America/Los_Angeles";

const mt: MeetingType = {
  slug: "30",
  title: "30",
  description: "",
  duration: 30,
  increment: 30,
  bufferMinutes: 15,
  minNoticeMinutes: 60,
  color: "#000",
};

const closed = { sun: [], mon: [], tue: [], wed: [], thu: [], fri: [], sat: [] };
// Tuesdays 9:00-11:00 Pacific only.
const hours: WeeklyHours = { ...closed, tue: [{ start: "09:00", end: "11:00" }] };

// Monday 2026-10-05 09:00 PDT
const now = new Date("2026-10-05T16:00:00Z");

const base = {
  meetingType: mt,
  now,
  timezone: tz,
  hours,
  maxBookingDays: 30,
  busy: [],
  from: new Date("2026-10-05T00:00:00Z"),
  to: new Date("2026-10-08T00:00:00Z"),
};

const iso = (dates: Date[]) => dates.map((d) => d.toISOString());

describe("computeSlots", () => {
  test("generates slots inside weekly hours in the owner's timezone", () => {
    expect(iso(computeSlots(base))).toEqual([
      "2026-10-06T16:00:00.000Z", // 9:00 PDT
      "2026-10-06T16:30:00.000Z",
      "2026-10-06T17:00:00.000Z",
      "2026-10-06T17:30:00.000Z", // 10:30 PDT, ends 11:00
    ]);
  });

  test("busy periods block overlapping slots plus the buffer", () => {
    const busy = [
      { start: new Date("2026-10-06T17:00:00Z"), end: new Date("2026-10-06T17:15:00Z") },
    ];
    // 9:30 ends 10:00, buffer reaches 10:15 -> blocked. 10:30 starts 15m after -> ok.
    expect(iso(computeSlots({ ...base, busy }))).toEqual([
      "2026-10-06T16:00:00.000Z",
      "2026-10-06T17:30:00.000Z",
    ]);
  });

  test("respects minimum notice", () => {
    const soon = new Date("2026-10-06T15:45:00Z"); // 8:45 PDT, 60m notice -> 9:45
    expect(iso(computeSlots({ ...base, now: soon }))).toEqual([
      "2026-10-06T17:00:00.000Z",
      "2026-10-06T17:30:00.000Z",
    ]);
  });

  test("booking horizon runs through the end of the last allowed day", () => {
    // now is Monday; Tuesday is 1 day out.
    expect(computeSlots({ ...base, maxBookingDays: 0 })).toEqual([]);
    expect(computeSlots({ ...base, maxBookingDays: 1 })).toHaveLength(4);
  });

  test("booking horizon includes the whole last day even late in the day", () => {
    const evening = new Date("2026-10-06T04:00:00Z"); // Monday 21:00 PDT
    const slots = computeSlots({ ...base, now: evening, maxBookingDays: 1 });
    expect(slots).toHaveLength(4); // all of Tuesday, not just up to 21:00
  });

  test("clips to the requested range", () => {
    const from = new Date("2026-10-06T16:30:00Z");
    const to = new Date("2026-10-06T16:30:00.001Z");
    expect(iso(computeSlots({ ...base, from, to }))).toEqual(["2026-10-06T16:30:00.000Z"]);
  });

  test("handles DST: winter slots shift by an hour in UTC", () => {
    const winterNow = new Date("2026-11-09T16:00:00Z"); // Monday, PST
    const slots = computeSlots({
      ...base,
      now: winterNow,
      from: winterNow,
      to: new Date("2026-11-11T00:00:00Z"),
    });
    expect(slots[0].toISOString()).toBe("2026-11-10T17:00:00.000Z"); // 9:00 PST
  });
});

test("nextDay crosses month and year boundaries", () => {
  expect(nextDay("2026-10-31")).toBe("2026-11-01");
  expect(nextDay("2026-12-31")).toBe("2027-01-01");
});
