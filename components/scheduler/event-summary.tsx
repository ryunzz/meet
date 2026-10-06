import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, Globe, Video } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { site, type MeetingType } from "@/lib/config";
import { formatRange } from "@/lib/time";

const backClass =
  "mb-6 flex size-10 items-center justify-center rounded-full border border-line text-accent outline-none transition-colors hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent";

export function EventSummary(props: {
  meetingType: MeetingType;
  /** Present once a time is picked. */
  booking?: { start: string; end: string; timezone: string };
  /** Defaults to linking home. */
  onBack?: () => void;
}) {
  const { meetingType: mt, booking } = props;

  return (
    <aside className="border-b border-line p-6 md:w-[340px] md:shrink-0 md:border-r md:border-b-0 md:p-8">
      {props.onBack ? (
        <button type="button" onClick={props.onBack} aria-label="Back to times" className={backClass}>
          <ArrowLeft className="size-5" />
        </button>
      ) : (
        <Link href="/" aria-label="All meeting types" className={backClass}>
          <ArrowLeft className="size-5" />
        </Link>
      )}

      <div className="flex items-center gap-3">
        <Avatar size={36} />
        <p className="font-medium text-muted">{site.owner.name}</p>
      </div>
      <h1 className="mt-3 text-[26px] font-bold leading-tight">{mt.title}</h1>

      <ul className="mt-6 space-y-4 font-medium text-muted">
        <Detail icon={Clock}>{mt.duration} min</Detail>
        <Detail icon={Video}>Google Meet details provided upon confirmation</Detail>
        {booking && (
          <>
            <Detail icon={CalendarDays} className="text-ink">
              {formatRange(booking.start, booking.end, booking.timezone)}
            </Detail>
            <Detail icon={Globe}>{booking.timezone.replaceAll("_", " ")}</Detail>
          </>
        )}
      </ul>

      <p className="mt-6 text-[15px] leading-relaxed">{mt.description}</p>
    </aside>
  );
}

export function Detail(props: {
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = props.icon;
  return (
    <li className={`flex gap-3 ${props.className ?? ""}`}>
      <Icon className="mt-0.5 size-5 shrink-0 text-muted" />
      <span>{props.children}</span>
    </li>
  );
}
