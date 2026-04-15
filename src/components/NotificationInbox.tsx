"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Eye,
  Rocket,
  Trophy,
  MessageCircle,
  ThumbsUp,
  AlertTriangle,
  BarChart3,
  UserPlus,
  Flag,
  Info,
  Check,
  X,
  Mail,
  Headphones,
  Reply,
} from "lucide-react";
import Link from "next/link";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  type Notification,
  type NotificationType,
} from "@/lib/notifications-client";

// ── Icon mapping ──

const NOTIFICATION_ICONS: Partial<Record<NotificationType, typeof Eye>> = {
  site_views: Eye,
  deploy_success: Rocket,
  achievement: Trophy,
  gallery_comment: MessageCircle,
  gallery_upvote: ThumbsUp,
  quota_warning: AlertTriangle,
  weekly_report: BarChart3,
  referral: UserPlus,
  challenge: Flag,
  system: Info,
  admin_email: Mail,
  support_ticket: Headphones,
  support_reply: Reply,
};

const NOTIFICATION_COLORS: Partial<Record<NotificationType, string>> = {
  site_views: "#06b6d4",
  deploy_success: "#22c55e",
  achievement: "#eab308",
  gallery_comment: "#8b5cf6",
  gallery_upvote: "#3b82f6",
  quota_warning: "#f97316",
  weekly_report: "#06b6d4",
  referral: "#22c55e",
  challenge: "#ec4899",
  system: "#94a3b8",
  admin_email: "#f59e0b",
  support_ticket: "#ef4444",
  support_reply: "#8b5cf6",
};

// ── Time-ago helper ──

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

// ── Component ──

export default function NotificationInbox() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load and refresh
  const refresh = useCallback(() => {
    setNotifications(getNotifications().slice(0, 10));
    setUnreadCount(getUnreadCount());
  }, []);

  useEffect(() => {
    refresh();

    // Listen for new notifications dispatched from addNotification()
    const handler = () => refresh();
    window.addEventListener("zoobicon_notification", handler);

    // Also poll every 30s in case notifications arrive from other tabs
    const interval = setInterval(refresh, 30_000);

    return () => {
      window.removeEventListener("zoobicon_notification", handler);
      clearInterval(interval);
    };
  }, [refresh]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleMarkAllRead = () => {
    markAllAsRead();
    refresh();
  };

  const handleClickNotification = (notif: Notification) => {
    if (!notif.read) {
      markAsRead(notif.id);
      refresh();
    }
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) refresh();
        }}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/[0.06]"
        aria-label="Notifications"
      >
        <Bell
          size={18}
          className={
            unreadCount > 0
              ? "text-white animate-[bellPulse_2s_ease-in-out_infinite]"
              : "text-white/60"
          }
        />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-semibold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] rounded-xl bg-[#0a0a12] border border-white/10 shadow-2xl shadow-black/40 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Check size={12} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/40 hover:text-white/70 transition-colors"
                  aria-label="Close notifications"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto max-h-[380px] notif-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
                    <Bell size={20} className="text-white/20" />
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed">
                    No notifications yet &mdash; start building to see updates
                    here!
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const IconComponent = NOTIFICATION_ICONS[notif.type] || Info;
                  const iconColor = NOTIFICATION_COLORS[notif.type] || "#94a3b8";

                  const content = (
                    <div
                      className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer ${
                        notif.read
                          ? "hover:bg-white/[0.03]"
                          : "bg-white/[0.02] hover:bg-white/[0.05] border-l-2"
                      }`}
                      style={
                        notif.read
                          ? undefined
                          : { borderLeftColor: "rgba(6, 182, 212, 0.5)" }
                      }
                      onClick={() => handleClickNotification(notif)}
                    >
                      {/* Icon */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                        style={{
                          background: `${iconColor}15`,
                        }}
                      >
                        <IconComponent
                          size={15}
                          style={{ color: iconColor }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-[13px] leading-snug ${
                            notif.read
                              ? "text-white/70 font-normal"
                              : "text-white font-medium"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <p className="text-[12px] text-white/45 mt-0.5 leading-relaxed truncate">
                          {notif.description}
                        </p>
                        <p className="text-[11px] text-white/25 mt-1">
                          {timeAgo(notif.timestamp)}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!notif.read && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-400 mt-2" />
                      )}
                    </div>
                  );

                  // Wrap in Link if notification has a link
                  if (notif.link) {
                    return (
                      <Link
                        key={notif.id}
                        href={notif.link}
                        onClick={() => setOpen(false)}
                        className="block"
                      >
                        {content}
                      </Link>
                    );
                  }

                  return <div key={notif.id}>{content}</div>;
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-white/[0.06] px-4 py-2.5">
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="text-[12px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  See all notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
