import Link from "next/link";
import { CalendarDays, CircleCheck, Globe, User, Video } from "lucide-react";
import type { BookingResult } from "@/app/api/book/route";
import { site, type MeetingType } from "@/lib/config";
import { formatRange } from "@/lib/time";
import { Detail } from "./event-summary";

export function Confirmation(props: {
  meetingType: MeetingType;
  booking: BookingResult;
  guest: { name: string; email: string };
  timezone: string;
}) {
  const { meetingType: mt, booking, guest, timezone } = props;

  return (
    <div className="animate-rise flex flex-col items-center px-6 py-12 text-center sm:px-12">
      <h1 className="flex items-center gap-2 text-xl font-bold">
        <CircleCheck className="size-6 text-[#12b886]" />
        You&apos;re scheduled
      </h1>
      <p className="mt-2 text-[15px] text-muted">
        A calendar invitation has been sent to <span className="font-medium text-ink">{guest.email}</span>.
      </p>

      <div className="mt-8 w-full max-w-md rounded-lg border border-line p-6 text-left">
        <h2 className="text-lg font-bold">{mt.title}</h2>
        <ul className="mt-4 space-y-3 font-medium text-muted">
          <Detail icon={User}>
            {guest.name} and {site.owner.name}
          </Detail>
          <Detail icon={CalendarDays} className="text-ink">
            {formatRange(booking.start, booking.end, timezone)}
          </Detail>
          <Detail icon={Globe}>{timezone.replaceAll("_", " ")}</Detail>
          <Detail icon={Video}>
            {booking.meetLink ? (
              <a href={booking.meetLink} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Join Google Meet
              </a>
            ) : (
              "Google Meet link is in your calendar invite"
            )}
          </Detail>
        </ul>
      </div>

      <Link href="/" className="mt-8 text-[15px] font-medium text-accent hover:underline">
        Schedule another meeting
      </Link>
    </div>
  );
}
