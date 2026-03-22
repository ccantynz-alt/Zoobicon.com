/**
 * Zoobicon Notification Management System
 *
 * All notifications stored in localStorage("zoobicon_notifications").
 * Max 100 notifications — oldest pruned on overflow.
 */

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
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = "zoobicon_notifications";
const MAX_NOTIFICATIONS = 100;

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadNotifications(): Notification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveNotifications(notifications: Notification[]): void {
  if (typeof window === "undefined") return;
  try {
    // Prune to max limit — keep the newest
    const pruned =
      notifications.length > MAX_NOTIFICATIONS
        ? notifications.slice(-MAX_NOTIFICATIONS)
        : notifications;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
  } catch {
    /* storage full or unavailable */
  }
}

// ── Core CRUD ──────────────────────────────────────────

export function getNotifications(): Notification[] {
  return loadNotifications().sort((a, b) => b.timestamp - a.timestamp);
}

export function addNotification(
  notification: Omit<Notification, "id" | "timestamp" | "read">
): Notification {
  const all = loadNotifications();
  const entry: Notification = {
    ...notification,
    id: generateId(),
    timestamp: Date.now(),
    read: false,
  };
  all.push(entry);
  saveNotifications(all);
  // Dispatch a custom event so open NotificationInbox components can react
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("zoobicon_notification", { detail: entry }));
  }
  return entry;
}

export function markAsRead(id: string): void {
  const all = loadNotifications();
  const target = all.find((n) => n.id === id);
  if (target) {
    target.read = true;
    saveNotifications(all);
  }
}

export function markAllAsRead(): void {
  const all = loadNotifications();
  all.forEach((n) => {
    n.read = true;
  });
  saveNotifications(all);
}

export function getUnreadCount(): number {
  return loadNotifications().filter((n) => !n.read).length;
}

export function clearNotifications(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// ── Typed notification helpers ─────────────────────────

export function notifyDeploy(siteName: string, siteUrl: string): void {
  addNotification({
    type: "deploy_success",
    title: "Site deployed!",
    description: `${siteName} is now live.`,
    link: siteUrl,
    metadata: { siteName, siteUrl },
  });
}

export function notifyAchievement(achievementTitle: string): void {
  addNotification({
    type: "achievement",
    title: "Achievement unlocked!",
    description: achievementTitle,
    link: "/dashboard",
    metadata: { achievementTitle },
  });
}

export function notifyQuotaWarning(used: number, limit: number): void {
  const pct = Math.round((used / limit) * 100);
  addNotification({
    type: "quota_warning",
    title: "Build quota warning",
    description: `You've used ${used} of ${limit} builds this month (${pct}%).`,
    link: "/pricing",
    metadata: { used, limit, pct },
  });
}

export function notifyViews(siteName: string, viewCount: number): void {
  addNotification({
    type: "site_views",
    title: "Traffic update",
    description: `Your site "${siteName}" got ${viewCount.toLocaleString()} views today.`,
    link: "/dashboard",
    metadata: { siteName, viewCount },
  });
}

export function notifyGalleryActivity(
  activityType: "comment" | "upvote",
  siteName: string
): void {
  if (activityType === "comment") {
    addNotification({
      type: "gallery_comment",
      title: "New comment",
      description: `Someone commented on your site "${siteName}" in the gallery.`,
      link: "/gallery",
      metadata: { siteName },
    });
  } else {
    addNotification({
      type: "gallery_upvote",
      title: "New upvote",
      description: `Your site "${siteName}" got an upvote in the gallery!`,
      link: "/gallery",
      metadata: { siteName },
    });
  }
}

export function notifyReferral(referredUserName: string): void {
  addNotification({
    type: "referral",
    title: "Referral success!",
    description: `${referredUserName} signed up using your referral link.`,
    link: "/dashboard",
    metadata: { referredUserName },
  });
}

export function notifyChallenge(challengeName: string): void {
  addNotification({
    type: "challenge",
    title: "New weekly challenge",
    description: challengeName,
    link: "/gallery",
    metadata: { challengeName },
  });
}

export function notifyWeeklyReport(): void {
  addNotification({
    type: "weekly_report",
    title: "Weekly report ready",
    description: "Your weekly site performance report is available.",
    link: "/dashboard",
  });
}

export function notifySystem(title: string, description: string, link?: string): void {
  addNotification({
    type: "system",
    title,
    description,
    link,
  });
}
