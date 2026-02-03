"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isAfter,
  isBefore,
} from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { config, getAvailabilityForDay } from "@/lib/config";

interface CalendarPickerProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}

export function CalendarPicker({ selectedDate, onSelect }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  const today = new Date();
  const maxDate = addDays(today, config.maxBookingDays);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Check if a date is available
  const isDateAvailable = (date: Date): boolean => {
    // Not in current month display
    if (!isSameMonth(date, currentMonth)) {
      return false;
    }

    // In the past
    if (isBefore(date, startOfDay(today))) {
      return false;
    }

    // Too far in the future
    if (isAfter(date, maxDate)) {
      return false;
    }

    // No availability configured for this day of week
    const dayOfWeek = date.getDay();
    const availability = getAvailabilityForDay(dayOfWeek);
    if (!availability) {
      return false;
    }

    return true;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Can't go to previous month if it's before current month
  const canGoPrevious = !isBefore(startOfMonth(currentMonth), startOfMonth(today));
  // Can't go to next month if max date is in current month
  const canGoNext = isBefore(endOfMonth(currentMonth), maxDate);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious}
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
          disabled={!canGoNext}
          aria-label="Next month"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isAvailable = isDateAvailable(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);

          return (
            <button
              key={index}
              onClick={() => isAvailable && onSelect(day)}
              disabled={!isAvailable}
              className={cn(
                "h-10 w-full rounded-lg text-sm font-medium transition-colors",
                // Base styles
                !isCurrentMonth && "text-muted-foreground/30",
                // Available but not selected
                isAvailable &&
                  !isSelected &&
                  "hover:bg-muted text-foreground cursor-pointer",
                // Not available
                !isAvailable &&
                  isCurrentMonth &&
                  "text-muted-foreground/50 cursor-not-allowed",
                // Selected
                isSelected && "bg-primary text-primary-foreground",
                // Today indicator
                isToday && !isSelected && "ring-1 ring-accent"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Helper to get start of day
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
