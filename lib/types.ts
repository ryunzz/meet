// Meeting type configuration
export interface MeetingType {
  slug: string;
  title: string;
  description: string;
  duration: number; // minutes
  bufferMinutes: number;
  minNoticeHours: number;
  color: string;
}

// Availability window for a day of week
export interface AvailabilityWindow {
  start: string; // "09:00" in 24h format
  end: string; // "17:00" in 24h format
}

// Weekly availability (null means not available)
export interface WeeklyAvailability {
  monday: AvailabilityWindow | null;
  tuesday: AvailabilityWindow | null;
  wednesday: AvailabilityWindow | null;
  thursday: AvailabilityWindow | null;
  friday: AvailabilityWindow | null;
  saturday: AvailabilityWindow | null;
  sunday: AvailabilityWindow | null;
}

// Site configuration
export interface SiteConfig {
  owner: {
    name: string;
    tagline: string;
    avatar: string;
  };
  timezone: string;
  availability: WeeklyAvailability;
  meetingTypes: MeetingType[];
  maxBookingDays: number;
}

// Time slot returned by the API
export interface TimeSlot {
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
}

// API request to get available slots
export interface SlotsRequest {
  type: string; // meeting type slug
  date: string; // YYYY-MM-DD
  timezone: string; // IANA timezone
}

// API response for available slots
export interface SlotsResponse {
  date: string;
  timezone: string;
  meetingType: MeetingType;
  slots: TimeSlot[];
}

// Booking request from the form
export interface BookingRequest {
  meetingType: string; // slug
  startTime: string; // ISO 8601
  guestName: string;
  guestEmail: string;
  guestTimezone: string;
  notes?: string;
}

// Booking response after creation
export interface BookingResponse {
  success: boolean;
  eventId?: string;
  meetLink?: string;
  startTime?: string;
  endTime?: string;
  error?: string;
}

// Google Calendar FreeBusy period
export interface FreeBusyPeriod {
  start: string; // ISO 8601
  end: string; // ISO 8601
}

// Date availability for calendar display
export interface DateAvailability {
  date: string; // YYYY-MM-DD
  available: boolean;
  dayOfWeek: number; // 0 = Sunday
}
