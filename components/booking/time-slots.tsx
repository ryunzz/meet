"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { cn, formatTime, getUserTimezone, formatTimezone } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import type { TimeSlot, MeetingType } from "@/lib/types";

interface TimeSlotsProps {
  date: Date;
  meetingType: MeetingType;
  selectedSlot: TimeSlot | null;
  onSelect: (slot: TimeSlot) => void;
}

export function TimeSlots({
  date,
  meetingType,
  selectedSlot,
  onSelect,
}: TimeSlotsProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string>("America/Los_Angeles");

  useEffect(() => {
    setTimezone(getUserTimezone());
  }, []);

  useEffect(() => {
    async function fetchSlots() {
      setIsLoading(true);
      setError(null);

      const dateStr = format(date, "yyyy-MM-dd");

      try {
        const response = await fetch(
          `/api/slots?type=${meetingType.slug}&date=${dateStr}&timezone=${timezone}`
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to fetch slots");
        }

        const data = await response.json();
        setSlots(data.slots);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load available times");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSlots();
  }, [date, meetingType.slug, timezone]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Spinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">
          Loading available times...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please try again or select a different date.
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          No available times on this date.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Please select a different date.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          {format(date, "EEEE, MMMM d")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {formatTimezone(timezone)}
        </span>
      </div>

      <div className="grid gap-2">
        {slots.map((slot) => {
          const isSelected =
            selectedSlot?.startTime === slot.startTime;
          const timeDisplay = formatTime(slot.startTime, timezone);

          return (
            <button
              key={slot.startTime}
              onClick={() => onSelect(slot)}
              className={cn(
                "w-full py-3 px-4 rounded-lg border text-sm font-medium transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary hover:bg-muted"
              )}
            >
              {timeDisplay}
            </button>
          );
        })}
      </div>
    </div>
  );
}
