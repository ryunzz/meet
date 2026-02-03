"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatTime, getUserTimezone, formatTimezone } from "@/lib/utils";
import type { TimeSlot, MeetingType, BookingResponse } from "@/lib/types";

interface BookingFormProps {
  meetingType: MeetingType;
  slot: TimeSlot;
  onSuccess: (response: BookingResponse, guestName: string) => void;
  onBack: () => void;
}

export function BookingForm({
  meetingType,
  slot,
  onSuccess,
  onBack,
}: BookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezone = getUserTimezone();
  const startDate = new Date(slot.startTime);
  const dateDisplay = format(startDate, "EEEE, MMMM d, yyyy");
  const timeDisplay = formatTime(slot.startTime, timezone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingType: meetingType.slug,
          startTime: slot.startTime,
          guestName: name.trim(),
          guestEmail: email.trim(),
          guestTimezone: timezone,
          notes: notes.trim() || undefined,
        }),
      });

      const data: BookingResponse = await response.json();

      if (!data.success) {
        setError(data.error || "Failed to book meeting");
        return;
      }

      onSuccess(data, name.trim());
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Meeting summary */}
      <div className="mb-6 p-4 rounded-lg bg-muted">
        <h3 className="font-semibold">{meetingType.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {meetingType.duration} minutes
        </p>
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-sm">{dateDisplay}</p>
          <p className="text-sm font-medium">
            {timeDisplay} ({formatTimezone(timezone)})
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium mb-1.5"
          >
            Your name
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            disabled={isSubmitting}
            autoComplete="name"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium mb-1.5"
          >
            Email address
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            disabled={isSubmitting}
            autoComplete="email"
          />
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium mb-1.5"
          >
            Add a message{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What would you like to discuss?"
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Booking..." : "Book meeting"}
          </Button>
        </div>
      </form>
    </div>
  );
}
