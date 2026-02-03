"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";
import { formatTime, getUserTimezone, formatTimezone, downloadICS } from "@/lib/utils";
import type { MeetingType, BookingResponse } from "@/lib/types";

interface ConfirmationProps {
  meetingType: MeetingType;
  booking: BookingResponse;
  guestName: string;
}

export function Confirmation({ meetingType, booking, guestName }: ConfirmationProps) {
  const timezone = getUserTimezone();
  const startDate = new Date(booking.startTime!);

  const dateDisplay = format(startDate, "EEEE, MMMM d, yyyy");
  const startTimeDisplay = formatTime(booking.startTime!, timezone);
  const endTimeDisplay = formatTime(booking.endTime!, timezone);

  const handleAddToCalendar = () => {
    const description = `Meeting with ${config.owner.name}${
      booking.meetLink ? `\n\nJoin: ${booking.meetLink}` : ""
    }`;

    downloadICS(
      `meeting-${format(startDate, "yyyy-MM-dd")}.ics`,
      `Meeting with ${config.owner.name}`,
      description,
      booking.startTime!,
      booking.endTime!,
      booking.meetLink
    );
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      {/* Success icon */}
      <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
        <CheckIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
      </div>

      <h2 className="text-2xl font-semibold mb-2">You&apos;re booked!</h2>
      <p className="text-muted-foreground mb-8">
        A calendar invitation has been sent to your email.
      </p>

      {/* Meeting details */}
      <div className="bg-muted rounded-lg p-6 text-left mb-6">
        <h3 className="font-semibold text-lg mb-4">{meetingType.title}</h3>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CalendarIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{dateDisplay}</p>
              <p className="text-sm text-muted-foreground">
                {startTimeDisplay} - {endTimeDisplay} ({formatTimezone(timezone)})
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <UserIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{guestName}</p>
              <p className="text-sm text-muted-foreground">
                with {config.owner.name}
              </p>
            </div>
          </div>

          {booking.meetLink && (
            <div className="flex items-start gap-3">
              <VideoIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Google Meet</p>
                <a
                  href={booking.meetLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline break-all"
                >
                  {booking.meetLink}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {booking.meetLink && (
          <Button
            variant="default"
            className="w-full"
            onClick={() => window.open(booking.meetLink, "_blank")}
          >
            <VideoIcon className="w-4 h-4 mr-2" />
            Open Google Meet
          </Button>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={handleAddToCalendar}
        >
          <CalendarIcon className="w-4 h-4 mr-2" />
          Add to calendar
        </Button>
      </div>
    </div>
  );
}

// Icons
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
