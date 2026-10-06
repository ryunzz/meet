import { addMinutes } from "date-fns";
import { computeSlots } from "./availability";
import { site, type MeetingType } from "./config";
import { getBusy } from "./google-calendar";

/** Live bookable start times in [from, to), checked against Google Calendar. */
export async function findSlots(meetingType: MeetingType, from: Date, to: Date): Promise<Date[]> {
  const now = new Date();
  const busy = await getBusy(
    addMinutes(from, -meetingType.bufferMinutes),
    addMinutes(to, meetingType.duration + meetingType.bufferMinutes)
  );

  return computeSlots({
    meetingType,
    from,
    to,
    busy,
    now,
    timezone: site.timezone,
    hours: site.hours,
    maxBookingDays: site.maxBookingDays,
  });
}
