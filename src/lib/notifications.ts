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

// ---------------------------------------------------------------------------
// Client-side in-memory / localStorage notification helpers
//
// These are used by NotificationInbox.tsx, useEmailNotifications.ts, and the
// builder page. They work entirely in the browser — no DB, no server call.
// ---------------------------------------------------------------------------

export type NotificationType =
  | "site_views"
  | "deploy_success"
  | "achievement"
  | "gallery_comment"
  | "gallery_upvote"
  | "quota_warning"
  | "weekly_report"
  | "referral"
  | "challenge"
  | "system"
  | "admin_email"
  | "support_ticket"
  | "support_reply";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  link?: string;
  read: boolean;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = "zoobicon_notifications";
const MAX_STORED = 200;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function loadNotifications(): Notification[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Notification[]) : [];
  } catch {
    return [];
  }
}

function saveNotifications(items: Notification[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_STORED))
    );
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/** Return all in-app notifications, newest first. */
export function getNotifications(): Notification[] {
  return loadNotifications();
}

/** Return the number of unread in-app notifications. */
export function getUnreadCount(): number {
  return loadNotifications().filter((n) => !n.read).length;
}

/** Mark a single in-app notification as read. */
export function markAsRead(notificationId: string): void {
  const items = loadNotifications();
  const target = items.find((n) => n.id === notificationId);
  if (target) {
    target.read = true;
    saveNotifications(items);
  }
}

/** Mark every in-app notification as read. */
export function markAllAsRead(): void {
  const items = loadNotifications();
  for (const n of items) n.read = true;
  saveNotifications(items);
}

/** Add a new in-app notification and emit a DOM event so the bell refreshes. */
export function addNotification(
  input: Omit<Notification, "id" | "read" | "timestamp"> & {
    timestamp?: number;
  }
): Notification {
  const notif: Notification = {
    id: `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`,
    type: input.type,
    title: input.title,
    description: input.description,
    link: input.link,
    read: false,
    timestamp: input.timestamp ?? Date.now(),
    metadata: input.metadata,
  };

  const items = loadNotifications();
  items.unshift(notif);
  saveNotifications(items);

  // Emit custom event so NotificationInbox picks it up instantly
  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent("zoobicon_notification"));
  }

  return notif;
}

/** Convenience helper used by the builder after a successful deploy. */
export function notifyDeploy(siteName: string, url: string): void {
  addNotification({
    type: "deploy_success",
    title: "Site Deployed",
    description: `${siteName || "Your site"} is live at ${url}`,
    link: url,
  });
}
