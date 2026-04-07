import { sql } from "@/lib/db";

export interface Slot {
  start: string;
  end: string;
  available: boolean;
}

export interface Customer {
  name: string;
  email: string;
}

export interface BookingCalendar {
  id: string;
  owner_id: string;
  name: string;
  timezone: string;
  slot_minutes: number;
  created_at: string;
}

export interface Booking {
  id: string;
  calendar_id: string;
  customer_name: string;
  customer_email: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export async function ensureBookingTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS booking_calendars (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      timezone TEXT NOT NULL DEFAULT 'UTC',
      slot_minutes INT NOT NULL DEFAULT 30,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      calendar_id TEXT NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      starts_at TIMESTAMPTZ NOT NULL,
      ends_at TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS bookings_calendar_idx ON bookings(calendar_id, starts_at)`;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createCalendar(
  ownerId: string,
  name: string,
  timezone: string,
  slotMinutes: number
): Promise<BookingCalendar> {
  await ensureBookingTables();
  const id = newId("cal");
  const rows = (await sql`
    INSERT INTO booking_calendars (id, owner_id, name, timezone, slot_minutes)
    VALUES (${id}, ${ownerId}, ${name}, ${timezone}, ${slotMinutes})
    RETURNING *
  `) as BookingCalendar[];
  return rows[0];
}

export async function getAvailability(
  calendarId: string,
  dateFrom: string,
  dateTo: string,
  workdayStartHour = 9,
  workdayEndHour = 17
): Promise<Slot[]> {
  await ensureBookingTables();
  const calRows = (await sql`
    SELECT * FROM booking_calendars WHERE id = ${calendarId} LIMIT 1
  `) as BookingCalendar[];
  if (calRows.length === 0) {
    throw new Error(`Calendar not found: ${calendarId}`);
  }
  const slotMinutes = calRows[0].slot_minutes;

  const existing = (await sql`
    SELECT starts_at, ends_at FROM bookings
    WHERE calendar_id = ${calendarId}
      AND status = 'confirmed'
      AND starts_at < ${dateTo}
      AND ends_at > ${dateFrom}
  `) as Array<{ starts_at: string; ends_at: string }>;

  const busy = existing.map((b) => ({
    start: new Date(b.starts_at).getTime(),
    end: new Date(b.ends_at).getTime(),
  }));

  const slots: Slot[] = [];
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const slotMs = slotMinutes * 60 * 1000;

  const cursor = new Date(from);
  cursor.setUTCHours(workdayStartHour, 0, 0, 0);

  while (cursor < to) {
    const hour = cursor.getUTCHours();
    if (hour >= workdayStartHour && hour < workdayEndHour) {
      const slotStart = cursor.getTime();
      const slotEnd = slotStart + slotMs;
      const overlap = busy.some((b) => !(b.start >= slotEnd || b.end <= slotStart));
      slots.push({
        start: new Date(slotStart).toISOString(),
        end: new Date(slotEnd).toISOString(),
        available: !overlap,
      });
      cursor.setTime(slotEnd);
    } else {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      cursor.setUTCHours(workdayStartHour, 0, 0, 0);
    }
  }

  return slots;
}

export async function createBooking(
  calendarId: string,
  customer: Customer,
  startsAt: string,
  endsAt: string,
  notes?: string
): Promise<Booking> {
  await ensureBookingTables();

  const conflicts = (await sql`
    SELECT id FROM bookings
    WHERE calendar_id = ${calendarId}
      AND status = 'confirmed'
      AND NOT (starts_at >= ${endsAt} OR ends_at <= ${startsAt})
    LIMIT 1
  `) as Array<{ id: string }>;

  if (conflicts.length > 0) {
    throw new Error("Time slot conflict: another booking already exists in this window");
  }

  const id = newId("bk");
  const rows = (await sql`
    INSERT INTO bookings (id, calendar_id, customer_name, customer_email, starts_at, ends_at, status, notes)
    VALUES (${id}, ${calendarId}, ${customer.name}, ${customer.email}, ${startsAt}, ${endsAt}, 'confirmed', ${notes ?? null})
    RETURNING *
  `) as Booking[];
  return rows[0];
}

export async function cancelBooking(
  bookingId: string,
  customerEmail: string
): Promise<Booking> {
  await ensureBookingTables();
  const rows = (await sql`
    UPDATE bookings
    SET status = 'cancelled'
    WHERE id = ${bookingId} AND customer_email = ${customerEmail}
    RETURNING *
  `) as Booking[];
  if (rows.length === 0) {
    throw new Error("Booking not found or email does not match");
  }
  return rows[0];
}

export async function listBookings(
  calendarId: string,
  limit = 100
): Promise<Booking[]> {
  await ensureBookingTables();
  const rows = (await sql`
    SELECT * FROM bookings
    WHERE calendar_id = ${calendarId}
    ORDER BY starts_at DESC
    LIMIT ${limit}
  `) as Booking[];
  return rows;
}
