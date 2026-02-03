"use client";

import Link from "next/link";
import type { MeetingType } from "@/lib/types";

interface MeetingTypeCardProps {
  meetingType: MeetingType;
}

export function MeetingTypeCard({ meetingType }: MeetingTypeCardProps) {
  return (
    <Link
      href={`/${meetingType.slug}`}
      className="block w-full p-6 rounded-xl border border-border bg-background hover:border-primary hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-4">
        {/* Color indicator */}
        <div
          className="w-3 h-3 rounded-full mt-1.5 shrink-0"
          style={{ backgroundColor: meetingType.color }}
        />

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold">{meetingType.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {meetingType.duration} minutes
          </p>
          {meetingType.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {meetingType.description}
            </p>
          )}
        </div>

        {/* Arrow icon */}
        <ArrowRightIcon className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />
      </div>
    </Link>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
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
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
