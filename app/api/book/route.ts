import { NextResponse, type NextRequest } from "next/server";
import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { nextDay } from "@/lib/availability";
import { getMeetingType, site } from "@/lib/config";
import { guestKey } from "@/lib/email";
import { CalendarAuthError, countGuestBookings, createEvent } from "@/lib/google-calendar";
import { findSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface BookingResult {
  start: string;
  end: string;
  meetLink: string | null;
}

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return fail("Invalid request body.", 400);

  const type = String(body.type ?? "");
  const name = String(body.name ?? "").trim().slice(0, 100);
  const email = String(body.email ?? "").trim().slice(0, 254);
  const notes = String(body.notes ?? "").trim().slice(0, 2000);
  const timezone = String(body.timezone ?? "").slice(0, 64);
  const start = new Date(String(body.start ?? ""));

  // Honeypot: real people never see or fill this field.
  if (body.website) return fail("Invalid request.", 400);

  const meetingType = getMeetingType(type);
  if (!meetingType) return fail("Unknown meeting type.", 400);
  if (!name) return fail("Enter your name.", 400);
  if (!EMAIL.test(email)) return fail("Enter a valid email address.", 400);
  if (isNaN(start.getTime())) return fail("Invalid start time.", 400);

  try {
    // Re-derive availability for exactly this start time: rejects times outside
    // working hours or notice window, and catches double-bookings.
    const [slot] = await findSlots(meetingType, start, addMinutes(start, 1));
    if (slot?.getTime() !== start.getTime()) {
      return fail("That time is no longer available. Pick another time.", 409);
    }

    const guest = guestKey(email);
    const day = formatInTimeZone(start, site.timezone, "yyyy-MM-dd");
    const booked = await countGuestBookings(
      guest,
      fromZonedTime(`${day}T00:00:00`, site.timezone),
      fromZonedTime(`${nextDay(day)}T00:00:00`, site.timezone)
    );
    if (booked >= site.maxBookingsPerGuestPerDay) {
      return fail(
        `You already have ${booked} meetings booked that day, which is the limit. Pick a different day.`,
        429
      );
    }

    const end = addMinutes(start, meetingType.duration);
    const description = [
      `Booked by ${name} (${email}) via ${new URL(site.url).host}.`,
      timezone && `Guest timezone: ${timezone}`,
      notes && `\nNotes:\n${notes}`,
    ]
      .filter(Boolean)
      .join("\n");

    const { meetLink } = await createEvent({
      summary: `${name} and ${site.owner.name}`,
      description,
      start,
      end,
      guestEmail: email,
      guestName: name,
      guestKey: guest,
    });

    const result: BookingResult = { start: start.toISOString(), end: end.toISOString(), meetLink };
    return NextResponse.json(result);
  } catch (error) {
    console.error("[book]", error);
    if (error instanceof CalendarAuthError) {
      return fail("Booking is temporarily unavailable. Try again later.", 503);
    }
    return fail("Couldn't create the booking. Try again.", 500);
  }
}
