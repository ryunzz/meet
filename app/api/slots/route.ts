import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/slots";
import { getMeetingType } from "@/lib/config";
import type { SlotsResponse } from "@/lib/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const date = searchParams.get("date");
  const timezone = searchParams.get("timezone") || "America/Los_Angeles";

  // Validate required parameters
  if (!type) {
    return NextResponse.json(
      { error: "Missing required parameter: type" },
      { status: 400 }
    );
  }

  if (!date) {
    return NextResponse.json(
      { error: "Missing required parameter: date" },
      { status: 400 }
    );
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  // Validate meeting type exists
  const meetingType = getMeetingType(type);
  if (!meetingType) {
    return NextResponse.json(
      { error: `Unknown meeting type: ${type}` },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots(date, type);

    const response: SlotsResponse = {
      date,
      timezone,
      meetingType,
      slots,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching slots:", error);

    // Check for auth errors
    if (error instanceof Error && error.message.includes("authentication")) {
      return NextResponse.json(
        { error: "Calendar service temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch available slots. Please try again." },
      { status: 500 }
    );
  }
}
