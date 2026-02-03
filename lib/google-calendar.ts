import { google, calendar_v3 } from "googleapis";
import { config } from "./config";
import type { FreeBusyPeriod } from "./types";

// Initialize OAuth2 client with stored refresh token
function getAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN in your environment variables."
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return oauth2Client;
}

// Get Calendar API instance
function getCalendar() {
  return google.calendar({ version: "v3", auth: getAuthClient() });
}

// Get calendar ID from env or default to "primary"
function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || "primary";
}

/**
 * Query FreeBusy information for a time range.
 * Returns busy periods from the calendar.
 */
export async function getFreeBusy(
  timeMin: string,
  timeMax: string
): Promise<FreeBusyPeriod[]> {
  const calendar = getCalendar();
  const calendarId = getCalendarId();

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: config.timezone,
        items: [{ id: calendarId }],
      },
    });

    const busy = response.data.calendars?.[calendarId]?.busy || [];
    return busy.map((period) => ({
      start: period.start!,
      end: period.end!,
    }));
  } catch (error: unknown) {
    // Handle specific OAuth errors
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: number; message?: string };
      if (err.code === 401 || err.message?.includes("invalid_grant")) {
        throw new Error(
          "Google Calendar authentication expired. Please re-run the OAuth setup script."
        );
      }
    }
    throw error;
  }
}

/**
 * Create a calendar event with Google Meet.
 * Returns the event ID and Meet link.
 */
export async function createEvent(params: {
  summary: string;
  description: string;
  startTime: string;
  endTime: string;
  attendeeEmail: string;
}): Promise<{ eventId: string; meetLink: string }> {
  const calendar = getCalendar();
  const calendarId = getCalendarId();
  const ownerEmail = process.env.OWNER_EMAIL;

  if (!ownerEmail) {
    throw new Error("Missing OWNER_EMAIL environment variable.");
  }

  const event: calendar_v3.Schema$Event = {
    summary: params.summary,
    description: params.description,
    start: {
      dateTime: params.startTime,
      timeZone: config.timezone,
    },
    end: {
      dateTime: params.endTime,
      timeZone: config.timezone,
    },
    attendees: [
      { email: ownerEmail, responseStatus: "accepted" },
      { email: params.attendeeEmail },
    ],
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
    reminders: {
      useDefault: true,
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      conferenceDataVersion: 1, // Required for Meet link creation
      sendUpdates: "all", // Send email notifications to all attendees
    });

    const eventId = response.data.id;
    let meetLink =
      response.data.hangoutLink ||
      response.data.conferenceData?.entryPoints?.[0]?.uri ||
      "";

    // If Meet link is not immediately available, poll for it
    if (!meetLink && eventId) {
      meetLink = await waitForConferenceData(eventId);
    }

    if (!eventId) {
      throw new Error("Failed to create event: no event ID returned");
    }

    return {
      eventId,
      meetLink,
    };
  } catch (error: unknown) {
    // Handle specific OAuth errors
    if (error && typeof error === "object" && "code" in error) {
      const err = error as { code: number; message?: string };
      if (err.code === 401 || err.message?.includes("invalid_grant")) {
        throw new Error(
          "Google Calendar authentication expired. Please re-run the OAuth setup script."
        );
      }
    }
    throw error;
  }
}

/**
 * Poll for conference data if the Meet link isn't immediately available.
 */
async function waitForConferenceData(
  eventId: string,
  maxAttempts = 5
): Promise<string> {
  const calendar = getCalendar();
  const calendarId = getCalendarId();

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const event = await calendar.events.get({
        calendarId,
        eventId,
      });

      const meetLink =
        event.data.hangoutLink ||
        event.data.conferenceData?.entryPoints?.[0]?.uri;

      if (meetLink) {
        return meetLink;
      }
    } catch {
      // Ignore errors during polling
    }
  }

  return "";
}

/**
 * Check if a specific time slot is available.
 * Used for race condition handling before booking.
 */
export async function isSlotAvailable(
  startTime: string,
  endTime: string
): Promise<boolean> {
  const busyPeriods = await getFreeBusy(startTime, endTime);
  return busyPeriods.length === 0;
}
