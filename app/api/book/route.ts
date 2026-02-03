import { NextRequest, NextResponse } from "next/server";
import { addMinutes, parseISO } from "date-fns";
import { createEvent, isSlotAvailable } from "@/lib/google-calendar";
import { getMeetingType } from "@/lib/config";
import type { BookingRequest, BookingResponse } from "@/lib/types";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: BookingRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { meetingType: meetingTypeSlug, startTime, guestName, guestEmail, guestTimezone, notes } = body;

  // Validate required fields
  if (!meetingTypeSlug) {
    return NextResponse.json(
      { success: false, error: "Missing required field: meetingType" },
      { status: 400 }
    );
  }

  if (!startTime) {
    return NextResponse.json(
      { success: false, error: "Missing required field: startTime" },
      { status: 400 }
    );
  }

  if (!guestName || guestName.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "Please enter your name" },
      { status: 400 }
    );
  }

  if (!guestEmail || !EMAIL_REGEX.test(guestEmail)) {
    return NextResponse.json(
      { success: false, error: "Please enter a valid email address" },
      { status: 400 }
    );
  }

  if (!guestTimezone) {
    return NextResponse.json(
      { success: false, error: "Missing required field: guestTimezone" },
      { status: 400 }
    );
  }

  // Validate meeting type
  const meetingType = getMeetingType(meetingTypeSlug);
  if (!meetingType) {
    return NextResponse.json(
      { success: false, error: `Unknown meeting type: ${meetingTypeSlug}` },
      { status: 400 }
    );
  }

  // Calculate end time
  const startDate = parseISO(startTime);
  const endDate = addMinutes(startDate, meetingType.duration);
  const endTime = endDate.toISOString();

  // Validate start time is in the future
  if (startDate < new Date()) {
    return NextResponse.json(
      { success: false, error: "Cannot book a time in the past" },
      { status: 400 }
    );
  }

  try {
    // Race condition check: verify slot is still available
    const available = await isSlotAvailable(startTime, endTime);
    if (!available) {
      return NextResponse.json(
        {
          success: false,
          error: "This time slot is no longer available. Please select another time."
        },
        { status: 409 } // Conflict
      );
    }

    // Build event description
    const descriptionParts = [
      `Meeting with ${guestName}`,
      `Email: ${guestEmail}`,
      `Timezone: ${guestTimezone}`,
    ];
    if (notes && notes.trim()) {
      descriptionParts.push(`\nNotes:\n${notes.trim()}`);
    }
    descriptionParts.push(`\nBooked via meet.ryunzz.tech`);

    // Create the calendar event
    const { eventId, meetLink } = await createEvent({
      summary: `Meeting with ${guestName}`,
      description: descriptionParts.join("\n"),
      startTime,
      endTime,
      attendeeEmail: guestEmail,
    });

    const response: BookingResponse = {
      success: true,
      eventId,
      meetLink,
      startTime,
      endTime,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating booking:", error);

    // Check for auth errors
    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking service temporarily unavailable. Please try again later."
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create booking. Please try again."
      },
      { status: 500 }
    );
  }
}
