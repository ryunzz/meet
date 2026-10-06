# meet.ryunzz.tech

A personal, Calendly-style booking page. Guests pick a meeting length, a day, and a time; the site checks Google Calendar for conflicts and creates an event with a Google Meet link, inviting the guest by email.

Next.js (App Router) · Tailwind v4 · Bun · deployed on Vercel.

## Develop

```bash
bun install
cp .env.example .env.local   # fill in Google credentials (see below)
bun dev                      # http://localhost:3000
bun run check                # typecheck + lint + tests
```

## Configure

Everything you'd want to change lives in [`lib/config.ts`](lib/config.ts):

- `site.owner`: name, intro text, and an optional avatar (put the image in `/public`).
- `site.timezone` and `site.hours`: your weekly working hours. A day can have several windows, or `[]` for unavailable.
- `site.maxBookingDays`: how far ahead guests can book.
- `meetingTypes`: each becomes a page at `/<slug>`. Sets the duration, start-time increment, buffer around existing events, and minimum notice.

## How it works

- `GET /api/slots?type=30&from=…&to=…` returns open start times. The client asks for a whole month at a time, in the guest's timezone, so the calendar only highlights days that actually have availability.
- `POST /api/book` recomputes availability for the requested time before creating the event. That rejects times outside working hours and catches double-bookings.
- Slot logic is a pure function in `lib/availability.ts`, unit-tested in `lib/availability.test.ts`.
- `lib/google-calendar.ts` calls the Calendar REST API with `fetch`, not the `googleapis` SDK, to keep serverless cold starts small.

## Google Calendar setup

1. In [Google Cloud Console](https://console.cloud.google.com/), enable the **Google Calendar API**.
2. Create an **OAuth client ID** of type *Web application*, with redirect URI `http://localhost:3333/callback`.
3. On the OAuth consent screen, add yourself as a test user. Then **publish the app** (the "In production" status). Refresh tokens for apps left in *Testing* expire after 7 days.
4. Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`, then run:

   ```bash
   bun run auth:google
   ```

   Copy the printed `GOOGLE_REFRESH_TOKEN` into `.env.local`.

### Checking more than one calendar

Bookings are always created in the main account (`GOOGLE_REFRESH_TOKEN`). Other calendars can block times in two ways:

- **Other Google accounts:** run `bun run auth:google` again, signed in as that account. Add each token it prints to `GOOGLE_EXTRA_REFRESH_TOKENS`, comma-separated. That account's primary calendar is then checked for conflicts. Use the same OAuth client for every account; on the consent screen, add each account as a test user, or publish the app.
- **Calendars shared with the main account:** add their calendar IDs to `GOOGLE_CONFLICT_CALENDARS`, comma-separated. Sharing with "See only free/busy" is enough.

If any calendar can't be read, the site stops offering times rather than risk a double-booking.

## Deploy (Vercel + meet.ryunzz.tech)

1. Import the repo in Vercel. It detects Next.js, and `bun.lock` makes it install with Bun automatically.
2. Under **Settings → Environment Variables**, add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and optionally `GOOGLE_CALENDAR_ID`.
3. Under **Settings → Domains**, add `meet.ryunzz.tech`. At your DNS provider, create a `CNAME` record for `meet` pointing to `cname.vercel-dns.com` (or whatever value Vercel shows).
