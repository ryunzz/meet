import { NextResponse, type NextRequest } from "next/server";
import { addDays } from "date-fns";
import { getMeetingType } from "@/lib/config";
import { CalendarAuthError } from "@/lib/google-calendar";
import { findSlots } from "@/lib/slots";

export const dynamic = "force-dynamic";

const MAX_RANGE_DAYS = 45;

// GET /api/slots?type=30&from=<ISO>&to=<ISO>  ->  { slots: string[] }
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const meetingType = getMeetingType(params.get("type") ?? "");
  const from = new Date(params.get("from") ?? "");
  const to = new Date(params.get("to") ?? "");

  if (!meetingType) {
    return NextResponse.json({ error: "Unknown meeting type." }, { status: 400 });
  }
  if (isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from) {
    return NextResponse.json({ error: "`from` and `to` must be ISO dates with from < to." }, { status: 400 });
  }
  if (to > addDays(from, MAX_RANGE_DAYS)) {
    return NextResponse.json({ error: `Range can't exceed ${MAX_RANGE_DAYS} days.` }, { status: 400 });
  }

  try {
    const slots = await findSlots(meetingType, from, to);
    return NextResponse.json({ slots: slots.map((s) => s.toISOString()) });
  } catch (error) {
    console.error("[slots]", error);
    const status = error instanceof CalendarAuthError ? 503 : 500;
    return NextResponse.json({ error: "Couldn't load availability. Try again in a minute." }, { status });
  }
}
