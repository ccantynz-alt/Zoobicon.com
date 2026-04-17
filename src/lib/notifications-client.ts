/**
 * notifications-client — client-side localStorage-backed bell/inbox.
 *
 * The server-side module `@/lib/notifications` talks to Neon Postgres and is
 * not safe to import from the client (pulls in `@neondatabase/serverless`).
 * Client components (NotificationInbox, useEmailNotifications, builder page)
 * use these helpers instead to persist per-device unread counts and toasts.
 */

"use client";

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
  timestamp: number;
  read: boolean;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = "zoobicon_notifications";
const MAX_NOTIFICATIONS = 200;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function loadAll(): Notification[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Notification[];
  } catch {
    return [];
  }
}

function saveAll(list: Notification[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_NOTIFICATIONS)));
  } catch {
    // quota exceeded — drop silently
  }
}

function genId(): string {
  return `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function addNotification(input: {
  type: NotificationType;
  title: string;
  description: string;
  link?: string;
  metadata?: Record<string, unknown>;
}): Notification {
  const notif: Notification = {
    id: genId(),
    type: input.type,
    title: input.title,
    description: input.description,
    link: input.link,
    metadata: input.metadata,
    timestamp: Date.now(),
    read: false,
  };
  const existing = loadAll();
  existing.unshift(notif);
  saveAll(existing);
  return notif;
}

export function getNotifications(): Notification[] {
  return loadAll();
}

export function getUnreadCount(): number {
  return loadAll().filter((n) => !n.read).length;
}

export function markAsRead(id: string): void {
  const all = loadAll();
  const next = all.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveAll(next);
}

export function markAllAsRead(): void {
  const all = loadAll();
  const next = all.map((n) => ({ ...n, read: true }));
  saveAll(next);
}

export function clearNotifications(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ── Convenience wrappers for common product events ──

export function notifyDeploy(siteName: string, url?: string): Notification {
  return addNotification({
    type: "deploy_success",
    title: "Deployed",
    description: `${siteName} is live.`,
    link: url,
  });
}

export function notifySiteViews(siteName: string, views: number): Notification {
  return addNotification({
    type: "site_views",
    title: `${views.toLocaleString()} views`,
    description: `${siteName} is getting traction.`,
  });
}

export function notifyQuotaWarning(used: number, limit: number): Notification {
  return addNotification({
    type: "quota_warning",
    title: "Quota warning",
    description: `You've used ${used} of ${limit} requests this period.`,
    link: "/pricing",
  });
}
