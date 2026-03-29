/**
 * Booking & Scheduling Provider Abstraction Layer
 *
 * Supports: Cal.com self-hosted (primary), Mock (development)
 * Set CALCOM_API_URL + CALCOM_API_KEY for live mode.
 *
 * Architecture: Cal.com handles the scheduling engine (calendar sync,
 * availability, conflicts, timezone math). We layer AI on top for:
 * - Conversational booking (chat/voice → appointment)
 * - Smart gap-filling (suggest underbooked times at discount)
 * - No-show prediction (flag high-risk appointments)
 * - AI receptionist (answer questions + book via phone/chat)
 *
 * White-label: every business gets their own branded booking page.
 * Agencies can resell the entire system under their brand.
 */

// ─── Types ───────────────────────────────────────────────

export interface BookingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: "monthly";
  features: string[];
  maxStaff: number;
  maxServicesPerStaff: number;
  aiFeatures: boolean;
  whiteLabel: boolean;
  smsReminders: boolean;
}

export interface BookingService {
  id: string;
  businessId: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  currency: string;
  category: string;
  staffIds: string[];
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  maxAdvanceDays: number;
  requiresDeposit: boolean;
  depositAmount: number;
  active: boolean;
}

export interface TimeSlot {
  start: string;       // ISO datetime
  end: string;         // ISO datetime
  staffId: string;
  staffName: string;
  available: boolean;
  aiSuggested?: boolean;  // AI flagged this as a good time to fill
  discountPercent?: number; // Off-peak discount
}

export interface Appointment {
  id: string;
  businessId: string;
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  start: string;
  end: string;
  status: "confirmed" | "pending" | "cancelled" | "completed" | "no-show";
  notes?: string;
  price: number;
  currency: string;
  reminderSent: boolean;
  noShowRisk?: number;  // 0-100, AI predicted
  createdAt: string;
  source: "website" | "ai-chat" | "ai-voice" | "manual" | "api";
}

export interface BusinessProfile {
  id: string;
  name: string;
  industry: string;
  timezone: string;
  workingHours: Record<string, { start: string; end: string; closed: boolean }>;
  bookingPageSlug: string;
  brandColor: string;
  logoUrl?: string;
  whiteLabel: boolean;
  plan: string;
}

export interface AiBookingSuggestion {
  message: string;
  suggestedSlots: TimeSlot[];
  reasoning: string;
}

// ─── Provider Interface ──────────────────────────────────

interface BookingProviderAdapter {
  name: string;
  getPlans(): Promise<BookingPlan[]>;
  getServices(businessId: string): Promise<BookingService[]>;
  createService(service: Omit<BookingService, "id">): Promise<BookingService>;
  getAvailability(businessId: string, serviceId: string, date: string): Promise<TimeSlot[]>;
  createAppointment(appointment: Omit<Appointment, "id" | "createdAt" | "reminderSent" | "noShowRisk">): Promise<Appointment>;
  getAppointments(businessId: string, from?: string, to?: string): Promise<Appointment[]>;
  cancelAppointment(appointmentId: string, reason?: string): Promise<boolean>;
}

// ─── Cal.com Provider ────────────────────────────────────

class CalcomProvider implements BookingProviderAdapter {
  name = "calcom";
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.apiKey = apiKey;
  }

  private async request(method: string, path: string, body?: unknown) {
    const res = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      throw new Error(`Cal.com API ${res.status}: ${err}`);
    }
    return res.json();
  }

  async getPlans(): Promise<BookingPlan[]> {
    return PLANS;
  }

  async getServices(businessId: string): Promise<BookingService[]> {
    const data = await this.request("GET", `/event-types?teamId=${businessId}`);
    return (data.event_types || []).map(mapCalcomEventType);
  }

  async createService(service: Omit<BookingService, "id">): Promise<BookingService> {
    const data = await this.request("POST", "/event-types", {
      title: service.name,
      description: service.description,
      length: service.durationMinutes,
      price: service.price * 100,
      currency: service.currency.toLowerCase(),
    });
    return mapCalcomEventType(data.event_type);
  }

  async getAvailability(businessId: string, serviceId: string, date: string): Promise<TimeSlot[]> {
    const data = await this.request("GET", `/availability?eventTypeId=${serviceId}&dateFrom=${date}&dateTo=${date}&teamId=${businessId}`);
    return (data.slots || []).map((s: Record<string, unknown>) => ({
      start: s.time as string,
      end: s.endTime as string || "",
      staffId: String(s.userId || ""),
      staffName: s.userName as string || "",
      available: true,
    }));
  }

  async createAppointment(appt: Omit<Appointment, "id" | "createdAt" | "reminderSent" | "noShowRisk">): Promise<Appointment> {
    const data = await this.request("POST", "/bookings", {
      eventTypeId: appt.serviceId,
      start: appt.start,
      end: appt.end,
      responses: {
        name: appt.customerName,
        email: appt.customerEmail,
        phone: appt.customerPhone,
        notes: appt.notes,
      },
    });
    return {
      ...appt,
      id: String(data.booking?.id || data.id),
      status: "confirmed",
      reminderSent: false,
      createdAt: new Date().toISOString(),
    };
  }

  async getAppointments(businessId: string, from?: string, to?: string): Promise<Appointment[]> {
    let path = `/bookings?teamId=${businessId}`;
    if (from) path += `&dateFrom=${from}`;
    if (to) path += `&dateTo=${to}`;
    const data = await this.request("GET", path);
    return (data.bookings || []).map(mapCalcomBooking);
  }

  async cancelAppointment(appointmentId: string, reason?: string): Promise<boolean> {
    await this.request("DELETE", `/bookings/${appointmentId}`, reason ? { reason } : undefined);
    return true;
  }
}

function mapCalcomEventType(e: Record<string, unknown>): BookingService {
  return {
    id: String(e.id),
    businessId: String(e.teamId || ""),
    name: e.title as string || "",
    description: e.description as string || "",
    durationMinutes: e.length as number || 30,
    price: ((e.price as number) || 0) / 100,
    currency: (e.currency as string || "USD").toUpperCase(),
    category: "general",
    staffIds: [],
    bufferBeforeMinutes: (e.beforeEventBuffer as number) || 0,
    bufferAfterMinutes: (e.afterEventBuffer as number) || 0,
    maxAdvanceDays: 60,
    requiresDeposit: false,
    depositAmount: 0,
    active: !(e.hidden as boolean),
  };
}

function mapCalcomBooking(b: Record<string, unknown>): Appointment {
  const attendees = (b.attendees as Array<Record<string, string>>) || [];
  const customer = attendees[0] || {};
  return {
    id: String(b.id),
    businessId: "",
    serviceId: String(b.eventTypeId || ""),
    serviceName: b.title as string || "",
    staffId: String(b.userId || ""),
    staffName: "",
    customerName: customer.name || "",
    customerEmail: customer.email || "",
    start: b.startTime as string || "",
    end: b.endTime as string || "",
    status: b.status === "CANCELLED" ? "cancelled" : "confirmed",
    price: 0,
    currency: "USD",
    reminderSent: false,
    createdAt: b.createdAt as string || "",
    source: "website",
  };
}

// ─── Mock Provider ───────────────────────────────────────

class MockBookingProvider implements BookingProviderAdapter {
  name = "mock";

  async getPlans(): Promise<BookingPlan[]> { return PLANS; }

  async getServices(): Promise<BookingService[]> {
    return [
      { id: "svc-1", businessId: "biz-1", name: "Haircut", description: "Standard haircut and style", durationMinutes: 30, price: 45, currency: "USD", category: "Hair", staffIds: ["staff-1", "staff-2"], bufferBeforeMinutes: 0, bufferAfterMinutes: 10, maxAdvanceDays: 30, requiresDeposit: false, depositAmount: 0, active: true },
      { id: "svc-2", businessId: "biz-1", name: "Colour & Cut", description: "Full colour treatment with cut", durationMinutes: 90, price: 120, currency: "USD", category: "Hair", staffIds: ["staff-1"], bufferBeforeMinutes: 0, bufferAfterMinutes: 15, maxAdvanceDays: 30, requiresDeposit: true, depositAmount: 30, active: true },
      { id: "svc-3", businessId: "biz-1", name: "Consultation", description: "Free 15-minute consultation", durationMinutes: 15, price: 0, currency: "USD", category: "General", staffIds: ["staff-1", "staff-2", "staff-3"], bufferBeforeMinutes: 0, bufferAfterMinutes: 5, maxAdvanceDays: 14, requiresDeposit: false, depositAmount: 0, active: true },
    ];
  }

  async createService(service: Omit<BookingService, "id">): Promise<BookingService> {
    return { ...service, id: `svc-${Date.now()}` };
  }

  async getAvailability(_businessId: string, _serviceId: string, date: string): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour <= 16; hour++) {
      const h = String(hour).padStart(2, "0");
      const available = Math.random() > 0.3;
      const aiSuggested = !available ? false : hour === 11 || hour === 14;
      slots.push({
        start: `${date}T${h}:00:00`,
        end: `${date}T${h}:30:00`,
        staffId: "staff-1",
        staffName: "Sarah",
        available,
        aiSuggested,
        discountPercent: hour === 9 || hour === 16 ? 10 : undefined,
      });
      if (hour < 16) {
        slots.push({
          start: `${date}T${h}:30:00`,
          end: `${date}T${String(hour + 1).padStart(2, "0")}:00:00`,
          staffId: "staff-2",
          staffName: "Mike",
          available: Math.random() > 0.4,
        });
      }
    }
    return slots;
  }

  async createAppointment(appt: Omit<Appointment, "id" | "createdAt" | "reminderSent" | "noShowRisk">): Promise<Appointment> {
    return {
      ...appt,
      id: `appt-${Date.now()}`,
      reminderSent: false,
      noShowRisk: Math.floor(Math.random() * 30),
      createdAt: new Date().toISOString(),
    };
  }

  async getAppointments(): Promise<Appointment[]> {
    const now = new Date();
    return [
      { id: "appt-1", businessId: "biz-1", serviceId: "svc-1", serviceName: "Haircut", staffId: "staff-1", staffName: "Sarah", customerName: "Emma Wilson", customerEmail: "emma@example.com", start: new Date(now.getTime() + 3600000).toISOString(), end: new Date(now.getTime() + 5400000).toISOString(), status: "confirmed", price: 45, currency: "USD", reminderSent: true, noShowRisk: 8, createdAt: now.toISOString(), source: "website" },
      { id: "appt-2", businessId: "biz-1", serviceId: "svc-2", serviceName: "Colour & Cut", staffId: "staff-1", staffName: "Sarah", customerName: "James Chen", customerEmail: "james@example.com", start: new Date(now.getTime() + 7200000).toISOString(), end: new Date(now.getTime() + 12600000).toISOString(), status: "confirmed", price: 120, currency: "USD", reminderSent: false, noShowRisk: 45, createdAt: now.toISOString(), source: "ai-chat" },
      { id: "appt-3", businessId: "biz-1", serviceId: "svc-1", serviceName: "Haircut", staffId: "staff-2", staffName: "Mike", customerName: "Sophie Taylor", customerEmail: "sophie@example.com", start: new Date(now.getTime() + 86400000).toISOString(), end: new Date(now.getTime() + 88200000).toISOString(), status: "pending", price: 45, currency: "USD", reminderSent: false, noShowRisk: 12, createdAt: now.toISOString(), source: "ai-voice" },
    ];
  }

  async cancelAppointment(): Promise<boolean> { return true; }
}

// ─── Shared Plans ────────────────────────────────────────

const PLANS: BookingPlan[] = [
  {
    id: "booking-starter", name: "Starter", price: 0, currency: "USD", period: "monthly",
    features: ["1 staff member", "Unlimited bookings", "Email confirmations", "Calendar sync (Google/Outlook)", "Booking page", "Basic analytics"],
    maxStaff: 1, maxServicesPerStaff: 5, aiFeatures: false, whiteLabel: false, smsReminders: false,
  },
  {
    id: "booking-pro", name: "Pro", price: 6.99, currency: "USD", period: "monthly",
    features: ["3 staff members", "AI smart scheduling", "SMS reminders", "No-show prediction", "Deposits & payments", "Custom branding", "Group bookings", "Buffer times", "Recurring appointments"],
    maxStaff: 3, maxServicesPerStaff: 20, aiFeatures: true, whiteLabel: false, smsReminders: true,
  },
  {
    id: "booking-business", name: "Business", price: 14.99, currency: "USD", period: "monthly",
    features: ["Unlimited staff", "Everything in Pro", "White-label (your brand)", "AI voice receptionist", "AI chat booking", "Multi-location", "API access", "Webhook integrations", "Priority support"],
    maxStaff: 999, maxServicesPerStaff: 999, aiFeatures: true, whiteLabel: true, smsReminders: true,
  },
];

// ─── Provider Factory ────────────────────────────────────

function getProvider(): BookingProviderAdapter {
  if (process.env.CALCOM_API_URL && process.env.CALCOM_API_KEY) {
    return new CalcomProvider(process.env.CALCOM_API_URL, process.env.CALCOM_API_KEY);
  }
  return new MockBookingProvider();
}

let _provider: BookingProviderAdapter | null = null;
function provider(): BookingProviderAdapter {
  if (!_provider) _provider = getProvider();
  return _provider;
}

export const getProviderName = () => provider().name;
export const getBookingPlans = () => provider().getPlans();
export const getServices = (businessId: string) => provider().getServices(businessId);
export const createService = (service: Omit<BookingService, "id">) => provider().createService(service);
export const getAvailability = (businessId: string, serviceId: string, date: string) => provider().getAvailability(businessId, serviceId, date);
export const createAppointment = (appt: Omit<Appointment, "id" | "createdAt" | "reminderSent" | "noShowRisk">) => provider().createAppointment(appt);
export const getAppointments = (businessId: string, from?: string, to?: string) => provider().getAppointments(businessId, from, to);
export const cancelAppointment = (id: string, reason?: string) => provider().cancelAppointment(id, reason);
