"use client";

import { useState } from "react";
import { CalendarPicker } from "./calendar-picker";
import { TimeSlots } from "./time-slots";
import { BookingForm } from "./booking-form";
import { Confirmation } from "./confirmation";
import type { MeetingType, TimeSlot, BookingResponse } from "@/lib/types";

type Step = "calendar" | "form" | "confirmed";

interface BookingFlowProps {
  meetingType: MeetingType;
}

export function BookingFlow({ meetingType }: BookingFlowProps) {
  const [step, setStep] = useState<Step>("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);
  const [guestName, setGuestName] = useState("");

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null); // Reset slot when date changes
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep("form");
  };

  const handleBack = () => {
    setStep("calendar");
    setSelectedSlot(null);
  };

  const handleBookingSuccess = (response: BookingResponse, name: string) => {
    setBookingResult(response);
    setGuestName(name);
    setStep("confirmed");
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8">
      {/* Meeting type header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: meetingType.color }}
          />
          <h1 className="text-2xl font-semibold">{meetingType.title}</h1>
        </div>
        {meetingType.description && (
          <p className="text-muted-foreground mt-2 ml-7">
            {meetingType.description}
          </p>
        )}
      </div>

      {/* Step: Calendar and Time Selection */}
      {step === "calendar" && (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-medium mb-4">Select a date</h2>
            <CalendarPicker
              selectedDate={selectedDate}
              onSelect={handleDateSelect}
            />
          </section>

          {selectedDate && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h2 className="text-lg font-medium mb-4">Select a time</h2>
              <TimeSlots
                date={selectedDate}
                meetingType={meetingType}
                selectedSlot={selectedSlot}
                onSelect={handleSlotSelect}
              />
            </section>
          )}
        </div>
      )}

      {/* Step: Booking Form */}
      {step === "form" && selectedSlot && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <h2 className="text-lg font-medium mb-6">Enter your details</h2>
          <BookingForm
            meetingType={meetingType}
            slot={selectedSlot}
            onSuccess={handleBookingSuccess}
            onBack={handleBack}
          />
        </div>
      )}

      {/* Step: Confirmation */}
      {step === "confirmed" && bookingResult && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Confirmation
            meetingType={meetingType}
            booking={bookingResult}
            guestName={guestName}
          />
        </div>
      )}
    </div>
  );
}
