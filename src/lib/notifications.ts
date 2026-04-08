import { sql } from "@/lib/db";

export type NotificationChannel = "inapp" | "email" | "sms" | "push";

export interface NotificationInput {
  type: string;
  title: string;
  body: string;
  link?: string;
  channels?: NotificationChannel[];
  email?: string;
  phone?: string;
}

export interface NotificationPreferences {
  inapp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  channel: NotificationChannel;
  status: string;
  read_at: string | null;
  created_at: string;
}

export interface DispatchResult {
  channel: NotificationChannel;
  ok: boolean;
  error?: string;
  note?: string;
}

const DEFAULT_PREFS: NotificationPreferences = {
  inapp: true,
  email: true,
  sms: true,
  push: true,
};

let tablesEnsured = false;

export async function ensureNotificationTables(): Promise<void> {
  if (tablesEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      link TEXT,
      channel TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, created_at DESC)`;
  await sql`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      inapp BOOLEAN NOT NULL DEFAULT TRUE,
      email BOOLEAN NOT NULL DEFAULT TRUE,
      sms BOOLEAN NOT NULL DEFAULT TRUE,
      push BOOLEAN NOT NULL DEFAULT TRUE,
      PRIMARY KEY (user_id, type)
    )
  `;
  tablesEnsured = true;
}

function genId(): string {
  return `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function sendInApp(
  userId: string,
  notif: NotificationInput
): Promise<DispatchResult> {
  try {
    const id = genId();
    await sql`
      INSERT INTO notifications (id, user_id, type, title, body, link, channel, status)
      VALUES (${id}, ${userId}, ${notif.type}, ${notif.title}, ${notif.body}, ${notif.link ?? null}, 'inapp', 'delivered')
    `;
    return { channel: "inapp", ok: true };
  } catch (err) {
    return {
      channel: "inapp",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function sendEmail(notif: NotificationInput): Promise<DispatchResult> {
  try {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    const from =
      process.env.MAILGUN_FROM || `Zoobicon <noreply@${domain || "zoobicon.com"}>`;
    if (!apiKey || !domain) {
      return {
        channel: "email",
        ok: false,
        error: "MAILGUN_API_KEY or MAILGUN_DOMAIN not configured",
      };
    }
    if (!notif.email) {
      return { channel: "email", ok: false, error: "no recipient email" };
    }
    const params = new URLSearchParams();
    params.append("from", from);
    params.append("to", notif.email);
    params.append("subject", notif.title);
    const text = notif.link ? `${notif.body}\n\n${notif.link}` : notif.body;
    params.append("text", text);
    const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) {
      return { channel: "email", ok: false, error: `mailgun ${res.status}` };
    }
    return { channel: "email", ok: true };
  } catch (err) {
    return {
      channel: "email",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function sendSmsChannel(notif: NotificationInput): Promise<DispatchResult> {
  try {
    if (!notif.phone) {
      return { channel: "sms", ok: false, error: "no recipient phone" };
    }
    const mod = (await import("@/lib/twilio-sms")) as {
      sendSms: (req: { to: string; body: string }) => Promise<{ sid: string; status: string }>;
    };
    const text = notif.link
      ? `${notif.title}: ${notif.body} ${notif.link}`
      : `${notif.title}: ${notif.body}`;
    await mod.sendSms({ to: notif.phone, body: text });
    return { channel: "sms", ok: true };
  } catch (err) {
    return {
      channel: "sms",
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function sendPush(): Promise<DispatchResult> {
  return { channel: "push", ok: true, note: "web-push not configured" };
}

export async function dispatch(
  userId: string,
  notif: NotificationInput
): Promise<DispatchResult[]> {
  await ensureNotificationTables();
  const requested: NotificationChannel[] =
    notif.channels && notif.channels.length > 0
      ? notif.channels
      : ["inapp", "email", "sms", "push"];
  const prefs = await getPreferences(userId, notif.type);
  const enabled = requested.filter((c) => prefs[c]);

  const tasks: Array<Promise<DispatchResult>> = enabled.map((c) => {
    if (c === "inapp") return sendInApp(userId, notif);
    if (c === "email") return sendEmail(notif);
    if (c === "sms") return sendSmsChannel(notif);
    return sendPush();
  });

  const settled = await Promise.allSettled(tasks);
  return settled.map((s, i) => {
    if (s.status === "fulfilled") return s.value;
    return {
      channel: enabled[i],
      ok: false,
      error: s.reason instanceof Error ? s.reason.message : String(s.reason),
    };
  });
}

export async function listNotifications(
  userId: string,
  unreadOnly = false
): Promise<NotificationRow[]> {
  await ensureNotificationTables();
  const rows = unreadOnly
    ? await sql`
        SELECT * FROM notifications
        WHERE user_id = ${userId} AND read_at IS NULL
        ORDER BY created_at DESC
        LIMIT 200
      `
    : await sql`
        SELECT * FROM notifications
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 200
      `;
  return rows as unknown as NotificationRow[];
}

export async function markRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await ensureNotificationTables();
  await sql`
    UPDATE notifications SET read_at = NOW()
    WHERE id = ${notificationId} AND user_id = ${userId}
  `;
}

export async function markAllRead(userId: string): Promise<void> {
  await ensureNotificationTables();
  await sql`
    UPDATE notifications SET read_at = NOW()
    WHERE user_id = ${userId} AND read_at IS NULL
  `;
}

export async function getPreferences(
  userId: string,
  type: string
): Promise<NotificationPreferences> {
  await ensureNotificationTables();
  const rows = (await sql`
    SELECT inapp, email, sms, push FROM notification_preferences
    WHERE user_id = ${userId} AND type = ${type}
    LIMIT 1
  `) as unknown as Array<NotificationPreferences>;
  if (rows.length === 0) return { ...DEFAULT_PREFS };
  const r = rows[0];
  return {
    inapp: Boolean(r.inapp),
    email: Boolean(r.email),
    sms: Boolean(r.sms),
    push: Boolean(r.push),
  };
}

export async function setPreferences(
  userId: string,
  type: string,
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  await ensureNotificationTables();
  const current = await getPreferences(userId, type);
  const merged: NotificationPreferences = { ...current, ...prefs };
  await sql`
    INSERT INTO notification_preferences (user_id, type, inapp, email, sms, push)
    VALUES (${userId}, ${type}, ${merged.inapp}, ${merged.email}, ${merged.sms}, ${merged.push})
    ON CONFLICT (user_id, type) DO UPDATE SET
      inapp = EXCLUDED.inapp,
      email = EXCLUDED.email,
      sms = EXCLUDED.sms,
      push = EXCLUDED.push
  `;
  return merged;
}
