// ---------- Types ----------

export interface BookingType {
  id: string;
  name: string;
  duration: number; // minutes
  price: number; // 0 = free
  description: string;
  location: "video" | "phone" | "in-person" | "custom";
  locationDetail?: string;
  color: string;
  slug: string;
  bufferMinutes: number;
  maxAdvanceDays: number;
  enabled: boolean;
}

export interface Appointment {
  id: string;
  bookingTypeId: string;
  clientName: string;
  clientEmail: string;
  dateTime: string; // ISO string
  endTime: string; // ISO string
  status: "confirmed" | "pending" | "cancelled" | "completed";
  notes?: string;
}

export interface BusinessHours {
  [day: string]: { enabled: boolean; start: string; end: string };
}

export interface BookingSettings {
  timezone: string;
  reminder24h: boolean;
  reminder1h: boolean;
  cancellationPolicy: string;
  intakeQuestions: string[];
  googleCalendarSync: boolean;
  stripeConnected: boolean;
}

export interface BookingStats {
  totalBookings: number;
  upcoming: number;
  revenue: number;
  completionRate: number;
}

// ---------- Default Data ----------

export const DEFAULT_BOOKING_TYPES: BookingType[] = [
  {
    id: "bt-1",
    name: "30-min Consultation",
    duration: 30,
    price: 50,
    description: "A quick consultation to discuss your project needs and goals.",
    location: "video",
    locationDetail: "Google Meet",
    color: "#3b82f6",
    slug: "consultation-30",
    bufferMinutes: 10,
    maxAdvanceDays: 30,
    enabled: true,
  },
  {
    id: "bt-2",
    name: "60-min Strategy Session",
    duration: 60,
    price: 150,
    description: "Deep-dive strategy session covering branding, architecture, and growth.",
    location: "video",
    locationDetail: "Zoom",
    color: "#8b5cf6",
    slug: "strategy-60",
    bufferMinutes: 15,
    maxAdvanceDays: 60,
    enabled: true,
  },
  {
    id: "bt-3",
    name: "Quick Chat",
    duration: 15,
    price: 0,
    description: "A brief introductory call to see if we are a good fit.",
    location: "phone",
    color: "#10b981",
    slug: "quick-chat",
    bufferMinutes: 5,
    maxAdvanceDays: 14,
    enabled: true,
  },
];

export const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-1",
    bookingTypeId: "bt-1",
    clientName: "Sarah Chen",
    clientEmail: "sarah@startup.io",
    dateTime: _relDate(1, 10, 0),
    endTime: _relDate(1, 10, 30),
    status: "confirmed",
    notes: "Wants to discuss SaaS landing page redesign",
  },
  {
    id: "apt-2",
    bookingTypeId: "bt-2",
    clientName: "James Rodriguez",
    clientEmail: "james@agency.co",
    dateTime: _relDate(1, 14, 0),
    endTime: _relDate(1, 15, 0),
    status: "pending",
    notes: "Agency partnership discussion",
  },
  {
    id: "apt-3",
    bookingTypeId: "bt-3",
    clientName: "Emily Watson",
    clientEmail: "emily@design.com",
    dateTime: _relDate(2, 9, 0),
    endTime: _relDate(2, 9, 15),
    status: "confirmed",
  },
  {
    id: "apt-4",
    bookingTypeId: "bt-1",
    clientName: "Michael Park",
    clientEmail: "michael@tech.dev",
    dateTime: _relDate(2, 11, 0),
    endTime: _relDate(2, 11, 30),
    status: "confirmed",
    notes: "Portfolio website review",
  },
  {
    id: "apt-5",
    bookingTypeId: "bt-2",
    clientName: "Anna Kowalski",
    clientEmail: "anna@freelance.dev",
    dateTime: _relDate(3, 13, 0),
    endTime: _relDate(3, 14, 0),
    status: "pending",
    notes: "E-commerce platform evaluation",
  },
  {
    id: "apt-6",
    bookingTypeId: "bt-3",
    clientName: "David Kim",
    clientEmail: "david@media.com",
    dateTime: _relDate(-1, 10, 0),
    endTime: _relDate(-1, 10, 15),
    status: "completed",
  },
  {
    id: "apt-7",
    bookingTypeId: "bt-1",
    clientName: "Lisa Park",
    clientEmail: "lisa@design.com",
    dateTime: _relDate(-2, 15, 0),
    endTime: _relDate(-2, 15, 30),
    status: "completed",
    notes: "Follow-up on design system implementation",
  },
  {
    id: "apt-8",
    bookingTypeId: "bt-2",
    clientName: "Tom Harris",
    clientEmail: "tom@corp.biz",
    dateTime: _relDate(-3, 11, 0),
    endTime: _relDate(-3, 12, 0),
    status: "cancelled",
    notes: "Cancelled due to scheduling conflict",
  },
  {
    id: "apt-9",
    bookingTypeId: "bt-1",
    clientName: "Priya Sharma",
    clientEmail: "priya@venture.io",
    dateTime: _relDate(4, 16, 0),
    endTime: _relDate(4, 16, 30),
    status: "confirmed",
    notes: "Investor pitch site",
  },
  {
    id: "apt-10",
    bookingTypeId: "bt-3",
    clientName: "Carlos Mendez",
    clientEmail: "carlos@restaurant.mx",
    dateTime: _relDate(0, 15, 0),
    endTime: _relDate(0, 15, 15),
    status: "confirmed",
    notes: "Restaurant website inquiry",
  },
];

export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  monday: { enabled: true, start: "09:00", end: "17:00" },
  tuesday: { enabled: true, start: "09:00", end: "17:00" },
  wednesday: { enabled: true, start: "09:00", end: "17:00" },
  thursday: { enabled: true, start: "09:00", end: "17:00" },
  friday: { enabled: true, start: "09:00", end: "16:00" },
  saturday: { enabled: false, start: "10:00", end: "14:00" },
  sunday: { enabled: false, start: "10:00", end: "14:00" },
};

export const DEFAULT_SETTINGS: BookingSettings = {
  timezone: "America/New_York",
  reminder24h: true,
  reminder1h: true,
  cancellationPolicy:
    "Cancellations must be made at least 24 hours before the appointment. Late cancellations or no-shows may be charged the full booking fee.",
  intakeQuestions: [
    "What is your business or project about?",
    "What are your main goals for this session?",
  ],
  googleCalendarSync: false,
  stripeConnected: false,
};

// ---------- Helpers ----------

/** Generate a date relative to today: daysOffset from today, at hour:minute */
function _relDate(daysOffset: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const STORAGE_KEY_TYPES = "zoobicon_booking_types";
const STORAGE_KEY_APPTS = "zoobicon_booking_appointments";
const STORAGE_KEY_HOURS = "zoobicon_business_hours";
const STORAGE_KEY_SETTINGS = "zoobicon_booking_settings";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* quota exceeded — ignore */
  }
}

// ---------- Public API ----------

export function getBookingTypes(): BookingType[] {
  return loadJSON(STORAGE_KEY_TYPES, DEFAULT_BOOKING_TYPES);
}

export function saveBookingTypes(types: BookingType[]): void {
  saveJSON(STORAGE_KEY_TYPES, types);
}

export function getAppointments(): Appointment[] {
  return loadJSON(STORAGE_KEY_APPTS, DEFAULT_APPOINTMENTS);
}

export function saveAppointments(appointments: Appointment[]): void {
  saveJSON(STORAGE_KEY_APPTS, appointments);
}

export function getBusinessHours(): BusinessHours {
  return loadJSON(STORAGE_KEY_HOURS, DEFAULT_BUSINESS_HOURS);
}

export function saveBusinessHours(hours: BusinessHours): void {
  saveJSON(STORAGE_KEY_HOURS, hours);
}

export function getBookingSettings(): BookingSettings {
  return loadJSON(STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS);
}

export function saveBookingSettings(settings: BookingSettings): void {
  saveJSON(STORAGE_KEY_SETTINGS, settings);
}

export function createAppointment(
  data: Omit<Appointment, "id" | "status">
): Appointment {
  const appt: Appointment = {
    ...data,
    id: `apt-${Date.now()}`,
    status: "pending",
  };
  const all = getAppointments();
  all.push(appt);
  saveAppointments(all);
  return appt;
}

export function updateAppointmentStatus(
  id: string,
  status: Appointment["status"]
): Appointment | null {
  const all = getAppointments();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], status };
  saveAppointments(all);
  return all[idx];
}

export function cancelAppointment(id: string): void {
  updateAppointmentStatus(id, "cancelled");
}

export function getAvailableSlots(
  date: string,
  bookingTypeId: string
): string[] {
  const types = getBookingTypes();
  const bt = types.find((t) => t.id === bookingTypeId);
  if (!bt) return [];

  const hours = getBusinessHours();
  const d = new Date(date);
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayKey = dayNames[d.getDay()];
  const dayHours = hours[dayKey];
  if (!dayHours || !dayHours.enabled) return [];

  const [startH, startM] = dayHours.start.split(":").map(Number);
  const [endH, endM] = dayHours.end.split(":").map(Number);

  const appointments = getAppointments().filter(
    (a) =>
      a.status !== "cancelled" &&
      new Date(a.dateTime).toDateString() === d.toDateString()
  );

  const slots: string[] = [];
  let cursor = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  while (cursor + bt.duration <= endMin) {
    const slotStart = new Date(d);
    slotStart.setHours(Math.floor(cursor / 60), cursor % 60, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + bt.duration);

    const hasConflict = appointments.some((a) => {
      const aStart = new Date(a.dateTime).getTime();
      const aEnd = new Date(a.endTime).getTime();
      return slotStart.getTime() < aEnd && slotEnd.getTime() > aStart;
    });

    if (!hasConflict) {
      slots.push(slotStart.toISOString());
    }
    cursor += 30; // 30-min increments
  }

  return slots;
}

export function getBookingStats(): BookingStats {
  const appointments = getAppointments();
  const types = getBookingTypes();
  const now = new Date();
  const upcoming = appointments.filter(
    (a) => new Date(a.dateTime) > now && a.status !== "cancelled"
  );
  const completed = appointments.filter((a) => a.status === "completed");
  const nonCancelled = appointments.filter((a) => a.status !== "cancelled");
  const revenue = completed.reduce((sum, a) => {
    const bt = types.find((t) => t.id === a.bookingTypeId);
    return sum + (bt?.price || 0);
  }, 0);

  return {
    totalBookings: appointments.length,
    upcoming: upcoming.length,
    revenue,
    completionRate:
      nonCancelled.length > 0
        ? Math.round((completed.length / nonCancelled.length) * 100)
        : 0,
  };
}

// ---------- Calendar Helpers ----------

export function getWeekDates(referenceDate: Date): Date[] {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
];
