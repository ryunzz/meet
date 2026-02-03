# Design Decisions, Trade-offs & Assumptions

This document captures all design choices, trade-offs, and assumptions made during the implementation of meet.ryunzz.tech.

---

## Design Choices

### 1. Dynamic Route `[slug]` vs Separate Pages

**Choice**: Use a dynamic `[slug]` route instead of hardcoded `/15min` and `/30min` pages.

**Reasoning**:
- Adding a new meeting type only requires editing `lib/config.ts`
- Single component handles all meeting types, reducing code duplication
- The slug is validated against config at runtime; invalid slugs return 404

**Alternative considered**: Separate static pages (`/15min/page.tsx`, `/30min/page.tsx`). Rejected because it duplicates the BookingFlow component and requires creating new files for each meeting type.

---

### 2. Server-Side Slot Calculation

**Choice**: All slot calculation happens on the server (in API routes), not the client.

**Reasoning**:
- Prevents manipulation (someone could forge requests with fake available times)
- Single source of truth for availability logic
- Client only needs to display what the server returns
- Easier to debug and maintain

**Trade-off**: Slightly slower UX since each date selection requires an API call. Mitigated by showing loading states.

---

### 3. No UI Library (shadcn/ui or Radix)

**Choice**: Build simple UI primitives (Button, Input, Card, Spinner) from scratch with Tailwind.

**Reasoning**:
- The app is small - only needs a few components
- Avoids dependency bloat for a personal project
- Full control over styling without fighting library defaults
- Faster initial load times

**Alternative considered**: Using shadcn/ui. Would be appropriate for a larger app, but overkill here. If the project grows, shadcn components can be added incrementally.

---

### 4. date-fns + date-fns-tz Over dayjs or Luxon

**Choice**: Use date-fns with the date-fns-tz extension for date/timezone handling.

**Reasoning**:
- Tree-shakeable (only imports what's used)
- Widely used and well-documented
- Native Date object based (no wrapper classes)
- date-fns-tz handles IANA timezone conversions correctly

**Trade-off**: Luxon has built-in timezone support without an extension. date-fns requires the separate tz package. Chose date-fns because it's more commonly used and has better tree-shaking.

---

### 5. Progressive Disclosure UI (Single Page)

**Choice**: Show calendar → slots → form → confirmation progressively on a single page, not as separate steps/pages.

**Reasoning**:
- Matches Google Calendar's native appointment scheduling UX (the reference)
- Faster flow since no page navigations
- User can see their selections above while filling the form
- Works well on mobile with vertical scroll

**Trade-off**: The page grows longer as the user progresses. Acceptable since the content is minimal at each step.

---

### 6. 15-Minute Slot Intervals

**Choice**: Generate possible slots at 15-minute intervals (9:00, 9:15, 9:30, etc.).

**Reasoning**:
- Standard industry practice (Calendly, Cal.com do this)
- Provides enough granularity without overwhelming the user
- Works well with both 15 and 30 minute meeting types

**Assumption**: 15-minute intervals are acceptable. To change this, modify `SLOT_INTERVAL` in `lib/slots.ts`.

---

### 7. Buffer Time Applied to Both Sides

**Choice**: Apply buffer time before AND after existing events when calculating available slots.

**Reasoning**:
- Prevents back-to-back meetings
- Gives breathing room if a meeting runs over
- Standard practice in scheduling tools

**Configuration**: Buffer is per-meeting-type in `lib/config.ts` (`bufferMinutes` field). Currently set to 15 minutes.

---

### 8. No Caching Layer

**Choice**: No Redis or in-memory cache for FreeBusy results.

**Reasoning**:
- Simplicity - no additional infrastructure to manage
- FreeBusy API is fast (typically <200ms)
- Stale cache could cause double-booking issues
- For a personal site with low traffic, caching isn't necessary

**Trade-off**: Hitting Google Calendar API on every date selection. If rate limits become an issue, a short-lived (30-second) cache can be added to `lib/google-calendar.ts`.

---

### 9. OAuth Refresh Token Approach

**Choice**: One-time setup script to get refresh token, store in environment variable.

**Reasoning**:
- Single-user app doesn't need a full OAuth login flow
- Simpler than maintaining a token database
- Refresh tokens are long-lived (won't expire if used regularly)

**Risk**: If the refresh token expires (e.g., you revoke access, Google detects suspicious activity, or the OAuth app is in "Testing" mode with 7-day expiry), you'll need to re-run the setup script.

**Mitigation**: Move OAuth app from "Testing" to "Production" status in Google Cloud Console. Error handling indicates when re-authentication is needed.

---

### 10. `sendUpdates: "all"` for Email Notifications

**Choice**: Let Google Calendar handle email notifications instead of building custom email.

**Reasoning**:
- Zero email infrastructure to maintain
- Users get native Google Calendar invites they're familiar with
- Automatically includes Google Meet link in the invite
- Respects users' Google Calendar notification preferences

**Trade-off**: Less control over email formatting. Cannot customize the email template. Acceptable for a personal booking tool.

---

## Trade-offs

### Speed vs Freshness
- **No caching** means every date click fetches fresh data
- Trade-off: Slightly slower UX for guaranteed accuracy
- If needed later: Add 30-second server-side cache with automatic invalidation after booking

### Simplicity vs Scalability
- **No database** means state is only in Google Calendar
- Cannot easily add: booking history, analytics, cancellation tracking
- Trade-off: Perfect for personal use, wouldn't work for multi-user SaaS
- Migration path: If needed later, can add a database to track bookings

### Minimal Dependencies vs Features
- Not using a date picker library (react-day-picker, etc.)
- Trade-off: Custom calendar component is more work but fewer dependencies
- Benefit: Smaller bundle, full styling control

### Client Trust vs Server Validation
- Client sends timezone, server trusts it for display purposes
- Server validates slot availability independently
- Trade-off: Timezone spoofing could show wrong times to the booker (their problem)
- The actual booking is always stored correctly in UTC

---

## Assumptions

### 1. Google Calendar as Primary Calendar
**Assumption**: Your primary calendar (the one checked for busy times) is your main Google Calendar.

If you use a different calendar ID (e.g., a specific work calendar), update `GOOGLE_CALENDAR_ID` in `.env.local`.

### 2. Availability is Consistent Week-to-Week
**Assumption**: Your available hours are the same every Monday, every Tuesday, etc.

The config in `lib/config.ts` defines availability per day of week, not per specific date. For date-specific overrides (vacation days, special hours):
- Block those times in Google Calendar manually, OR
- Add an exceptions system to the config (not currently implemented)

### 3. Single Timezone for Availability
**Assumption**: Your availability config is in a single timezone (America/Los_Angeles).

If you travel and want to set availability in different timezones, you'd need to either:
- Update the config timezone, OR
- Extend the config to support multiple timezone windows

### 4. Google Meet for All Meetings
**Assumption**: All booked meetings should have a Google Meet link auto-generated.

If you prefer Zoom or other platforms, modify the `createEvent` function in `lib/google-calendar.ts`.

### 5. No Phone/In-Person Meetings
**Assumption**: All meetings are virtual via Google Meet.

The confirmation doesn't show a location field. If you need in-person meetings, add a location option to the config and booking form.

### 6. English-Only
**Assumption**: The UI is in English.

No i18n setup is included. If multi-language support is needed, add next-intl or similar.

### 7. No Cancellation/Rescheduling by Booker
**Assumption**: Once booked, only you can cancel/reschedule via Google Calendar.

The booker receives a calendar invite and can decline, but there's no in-app cancellation flow. They can contact you directly.

### 8. Minimum Notice Requirements
**Assumption**: Per-meeting-type minimum notice is enforced.
- 15min meetings: 2 hours minimum notice
- 30min meetings: 4 hours minimum notice

These values are in `lib/config.ts` under `minNoticeHours`.

### 9. Maximum 30 Days Ahead
**Assumption**: Bookings can be made up to 30 days in the future.

This is configurable via `maxBookingDays` in `lib/config.ts`.

### 10. Mobile Users Are Common
**Assumption**: This will be shared via LinkedIn DMs, so mobile experience is critical.

Design prioritizes:
- Vertical layout
- Large touch targets (44px minimum)
- Fast loading
- Single-page flow (no navigations)

---

## Configuration Reference

All configuration lives in `lib/config.ts`:

```typescript
{
  owner: {
    name: "Ryun",
    tagline: "Book a meeting with me",
    avatar: "/avatar.jpg", // Place your photo in public/
  },
  timezone: "America/Los_Angeles",
  availability: {
    monday: { start: "09:00", end: "17:00" },
    tuesday: { start: "09:00", end: "17:00" },
    // ... etc
    saturday: null, // Not available
    sunday: null,
  },
  meetingTypes: [
    {
      slug: "15min",
      title: "15 Minute Chat",
      description: "...",
      duration: 15,
      bufferMinutes: 15,
      minNoticeHours: 2,
      color: "#10b981",
    },
    // ... more meeting types
  ],
  maxBookingDays: 30,
}
```

---

## Environment Variables Reference

```bash
# Required
GOOGLE_CLIENT_ID=           # From Google Cloud Console
GOOGLE_CLIENT_SECRET=       # From Google Cloud Console
GOOGLE_REFRESH_TOKEN=       # From setup script
OWNER_EMAIL=                # Your email for calendar events

# Optional
GOOGLE_CALENDAR_ID=primary  # Usually "primary"
NEXT_PUBLIC_SITE_URL=https://meet.ryunzz.tech
```

---

## File Structure Reference

```
meet/
├── app/
│   ├── layout.tsx           # Root layout with ThemeProvider
│   ├── page.tsx             # Landing page
│   ├── not-found.tsx        # 404 page
│   ├── globals.css          # Tailwind + CSS variables
│   ├── [slug]/
│   │   └── page.tsx         # Dynamic booking page
│   └── api/
│       ├── slots/route.ts   # GET available slots
│       └── book/route.ts    # POST create booking
├── components/
│   ├── ui/                  # Button, Input, Card, etc.
│   ├── booking/             # Calendar, slots, form, confirmation
│   ├── landing/             # Profile header, meeting cards
│   └── theme-toggle.tsx
├── lib/
│   ├── config.ts            # All configuration
│   ├── types.ts             # TypeScript interfaces
│   ├── utils.ts             # Date/timezone helpers
│   ├── slots.ts             # Slot calculation
│   └── google-calendar.ts   # Google API client
├── scripts/
│   └── get-refresh-token.ts # OAuth setup
└── public/
    └── avatar.jpg           # Your profile photo
```
