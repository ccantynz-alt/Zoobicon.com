import { neon } from '@neondatabase/serverless';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
  description: string;
  ics: string;
  createdAt: string;
}

export interface FreeSlot {
  start: string;
  end: string;
}

export interface ProposedSlot {
  start: string;
  end: string;
  score: number;
  reason: string;
}

function getSql(): ReturnType<typeof neon> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const err = new Error('DATABASE_URL not configured') as Error & { status?: number };
    err.status = 503;
    throw err;
  }
  return neon(url);
}

function getAnthropicKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const err = new Error('ANTHROPIC_API_KEY not configured') as Error & { status?: number };
    err.status = 503;
    throw err;
  }
  return key;
}

async function ensureTable(): Promise<void> {
  const sql = getSql();
  await sql`CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT NOT NULL DEFAULT '',
    ics TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toIcsDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export function generateIcs(input: {
  id: string;
  title: string;
  start: string;
  end: string;
  description: string;
  attendees: string[];
}): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zoobicon//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.id}@zoobicon.com`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(input.start)}`,
    `DTEND:${toIcsDate(input.end)}`,
    `SUMMARY:${input.title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${input.description.replace(/\n/g, '\\n')}`,
    ...input.attendees.map((a) => `ATTENDEE:mailto:${a}`),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export async function createEvent(input: {
  userId: string;
  title: string;
  start: string;
  end: string;
  attendees: string[];
  description: string;
}): Promise<CalendarEvent> {
  await ensureTable();
  const sql = getSql();
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const ics = generateIcs({
    id,
    title: input.title,
    start: input.start,
    end: input.end,
    description: input.description,
    attendees: input.attendees,
  });
  await sql`INSERT INTO calendar_events (id, user_id, title, start_at, end_at, attendees, description, ics)
    VALUES (${id}, ${input.userId}, ${input.title}, ${input.start}, ${input.end}, ${JSON.stringify(input.attendees)}::jsonb, ${input.description}, ${ics})`;
  return {
    id,
    userId: input.userId,
    title: input.title,
    start: input.start,
    end: input.end,
    attendees: input.attendees,
    description: input.description,
    ics,
    createdAt: new Date().toISOString(),
  };
}

export async function getEvent(id: string): Promise<CalendarEvent | null> {
  await ensureTable();
  const sql = getSql();
  const rows = (await sql`SELECT id, user_id, title, start_at, end_at, attendees, description, ics, created_at
    FROM calendar_events WHERE id = ${id} LIMIT 1`) as Array<{
    id: string;
    user_id: string;
    title: string;
    start_at: string;
    end_at: string;
    attendees: string[];
    description: string;
    ics: string;
    created_at: string;
  }>;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    start: new Date(r.start_at).toISOString(),
    end: new Date(r.end_at).toISOString(),
    attendees: r.attendees,
    description: r.description,
    ics: r.ics,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export async function findFreeSlots(
  userId: string,
  range: { start: string; end: string },
  durationMin: number,
): Promise<FreeSlot[]> {
  await ensureTable();
  const sql = getSql();
  const rows = (await sql`SELECT start_at, end_at FROM calendar_events
    WHERE user_id = ${userId} AND end_at > ${range.start} AND start_at < ${range.end}
    ORDER BY start_at ASC`) as Array<{ start_at: string; end_at: string }>;
  const busy = rows.map((r) => ({
    start: new Date(r.start_at).getTime(),
    end: new Date(r.end_at).getTime(),
  }));
  const rangeStart = new Date(range.start).getTime();
  const rangeEnd = new Date(range.end).getTime();
  const durMs = durationMin * 60 * 1000;
  const slots: FreeSlot[] = [];
  let cursor = rangeStart;
  for (const b of busy) {
    if (b.start - cursor >= durMs) {
      slots.push({
        start: new Date(cursor).toISOString(),
        end: new Date(b.start).toISOString(),
      });
    }
    if (b.end > cursor) cursor = b.end;
  }
  if (rangeEnd - cursor >= durMs) {
    slots.push({
      start: new Date(cursor).toISOString(),
      end: new Date(rangeEnd).toISOString(),
    });
  }
  return slots;
}

interface AnthropicTextBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicTextBlock[];
}

async function callHaiku(prompt: string): Promise<string> {
  const key = getAnthropicKey();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic error ${res.status}`);
  }
  const data = (await res.json()) as AnthropicResponse;
  const block = data.content?.find((c) => c.type === 'text');
  return block?.text ?? '';
}

export async function proposeMeeting(
  participants: string[],
  duration: number,
  range: { start: string; end: string },
): Promise<ProposedSlot[]> {
  const allSlots: FreeSlot[][] = [];
  for (const p of participants) {
    allSlots.push(await findFreeSlots(p, range, duration));
  }
  const intersected: FreeSlot[] = [];
  if (allSlots.length > 0) {
    for (const s of allSlots[0]) {
      const inAll = allSlots.every((list) =>
        list.some(
          (o) =>
            new Date(o.start).getTime() <= new Date(s.start).getTime() &&
            new Date(o.end).getTime() >= new Date(s.end).getTime(),
        ),
      );
      if (inAll) intersected.push(s);
    }
  }
  const candidates = intersected.slice(0, 10);
  if (candidates.length === 0) return [];
  const prompt = `You are a meeting scheduler. Rank these candidate time slots from best to worst for a ${duration}-minute meeting between ${participants.length} people. Prefer mid-morning weekdays. Return ONLY JSON array: [{"start":"iso","end":"iso","score":0-100,"reason":"..."}]\n\nCandidates:\n${JSON.stringify(candidates)}`;
  const text = await callHaiku(prompt);
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    return candidates.map((c) => ({ start: c.start, end: c.end, score: 50, reason: 'fallback' }));
  }
  try {
    const parsed = JSON.parse(match[0]) as ProposedSlot[];
    return parsed;
  } catch {
    return candidates.map((c) => ({ start: c.start, end: c.end, score: 50, reason: 'fallback' }));
  }
}

export async function parseNaturalDate(text: string): Promise<string> {
  const now = new Date().toISOString();
  const prompt = `Current time: ${now}. Extract the date/time from this text and return ONLY a single ISO 8601 datetime string, nothing else: "${text}"`;
  const out = await callHaiku(prompt);
  const match = out.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/);
  if (!match) {
    throw new Error('Could not parse date');
  }
  return new Date(match[0]).toISOString();
}
