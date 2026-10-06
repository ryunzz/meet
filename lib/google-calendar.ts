import type { Interval } from "./availability";
import { site } from "./config";

// Thin wrapper over the Google Calendar REST API. Using fetch directly instead
// of the `googleapis` SDK keeps serverless cold starts fast.

const API = "https://www.googleapis.com/calendar/v3";

export class CalendarAuthError extends Error {}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const calendarId = () => process.env.GOOGLE_CALENDAR_ID || "primary";

const list = (name: string) =>
  (process.env[name] ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

/**
 * Every Google account checked for conflicts. The first is the main account that
 * bookings are created in; each extra account contributes its primary calendar.
 * Calendars shared with the main account can be listed in GOOGLE_CONFLICT_CALENDARS.
 */
function accounts() {
  return [
    { refreshToken: env("GOOGLE_REFRESH_TOKEN"), calendars: [calendarId(), ...list("GOOGLE_CONFLICT_CALENDARS")] },
    ...list("GOOGLE_EXTRA_REFRESH_TOKENS").map((refreshToken) => ({ refreshToken, calendars: ["primary"] })),
  ];
}

const tokenCache = new Map<string, { value: string; expiresAt: number }>();

async function accessToken(refreshToken: string): Promise<string> {
  const cached = tokenCache.get(refreshToken);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.value;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new CalendarAuthError(
      `Google token refresh failed (${res.status}): ${body}. Re-run \`bun run auth:google\`.`
    );
  }

  const data: { access_token: string; expires_in: number } = await res.json();
  tokenCache.set(refreshToken, { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}

async function google<T>(refreshToken: string, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken(refreshToken)}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });

  if (res.status === 401) {
    tokenCache.delete(refreshToken);
    throw new CalendarAuthError("Google Calendar rejected the access token.");
  }
  if (!res.ok) {
    throw new Error(`Google Calendar ${path} failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

/**
 * Busy periods across every connected account and calendar. Fails closed: if any
 * calendar can't be read, this throws rather than risk a double-booking.
 */
export async function getBusy(timeMin: Date, timeMax: Date): Promise<Interval[]> {
  const perAccount = await Promise.all(
    accounts().map(async ({ refreshToken, calendars }) => {
      const data = await google<{
        calendars: Record<string, { busy?: { start: string; end: string }[]; errors?: unknown[] }>;
      }>(refreshToken, "/freeBusy", {
        method: "POST",
        body: JSON.stringify({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: calendars.map((id) => ({ id })),
        }),
      });

      return calendars.flatMap((id) => {
        const calendar = data.calendars[id];
        if (!calendar || calendar.errors?.length) {
          throw new Error(`FreeBusy failed for calendar ${id}: ${JSON.stringify(calendar?.errors)}`);
        }
        return calendar.busy ?? [];
      });
    })
  );

  return perAccount.flat().map((b) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

interface CalendarEvent {
  id: string;
  hangoutLink?: string;
  conferenceData?: {
    createRequest?: { status?: { statusCode: string } };
    entryPoints?: { entryPointType: string; uri: string }[];
  };
}

const meetLinkOf = (e: CalendarEvent) =>
  e.hangoutLink ??
  e.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")?.uri ??
  null;

// Private tags on events this site creates, so bookings can be counted per guest.
const SOURCE = new URL(site.url).host;

/** Upcoming (non-cancelled) bookings this site created for a guest in [from, to). */
export async function countGuestBookings(guestKey: string, from: Date, to: Date): Promise<number> {
  const query = new URLSearchParams({
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: "true",
    maxResults: "50",
  });
  query.append("privateExtendedProperty", `source=${SOURCE}`);
  query.append("privateExtendedProperty", `guest=${guestKey}`);

  const data = await google<{ items?: unknown[] }>(
    env("GOOGLE_REFRESH_TOKEN"),
    `/calendars/${encodeURIComponent(calendarId())}/events?${query}`
  );
  return data.items?.length ?? 0;
}

export async function createEvent(params: {
  summary: string;
  description: string;
  start: Date;
  end: Date;
  guestEmail: string;
  guestName: string;
  guestKey: string;
}): Promise<{ eventId: string; meetLink: string | null }> {
  const id = encodeURIComponent(calendarId());
  const refreshToken = env("GOOGLE_REFRESH_TOKEN");

  let event = await google<CalendarEvent>(
    refreshToken,
    `/calendars/${id}/events?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "POST",
      body: JSON.stringify({
        summary: params.summary,
        description: params.description,
        start: { dateTime: params.start.toISOString(), timeZone: site.timezone },
        end: { dateTime: params.end.toISOString(), timeZone: site.timezone },
        attendees: [{ email: params.guestEmail, displayName: params.guestName }],
        extendedProperties: { private: { source: SOURCE, guest: params.guestKey } },
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    }
  );

  // Meet links are occasionally provisioned asynchronously.
  for (let i = 0; i < 3 && !meetLinkOf(event); i++) {
    if (event.conferenceData?.createRequest?.status?.statusCode !== "pending") break;
    await new Promise((r) => setTimeout(r, 500));
    event = await google<CalendarEvent>(refreshToken, `/calendars/${id}/events/${event.id}`);
  }

  return { eventId: event.id, meetLink: meetLinkOf(event) };
}
