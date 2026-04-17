"use client";

import { useEffect, useRef, useCallback } from "react";
import { addNotification } from "@/lib/notifications-client";
import type { EmailNotificationEvent } from "@/lib/email-notifications";

// ---------------------------------------------------------------------------
// useEmailNotifications — Real-time email alerts with sound + browser push
//
// Drop this hook into any admin/support page. It:
// 1. Polls /api/notifications/email every 5s for new email events
// 2. Plays a notification sound when an email arrives
// 3. Shows a browser Notification (if permitted)
// 4. Adds to the in-app notification system (bell icon)
//
// Usage:
//   useEmailNotifications();                     // all email types
//   useEmailNotifications({ types: ["support_ticket"] }); // specific types
// ---------------------------------------------------------------------------

interface UseEmailNotificationsOptions {
  /** Filter to specific event types. Default: all types. */
  types?: EmailNotificationEvent["type"][];
  /** Polling interval in ms. Default: 5000 (5s). */
  interval?: number;
  /** Enable browser Notification API. Default: true. */
  browserNotification?: boolean;
  /** Enable sound. Default: true. */
  sound?: boolean;
  /** Callback when a new email arrives. */
  onEmail?: (event: EmailNotificationEvent) => void;
}

// Notification sound — synthesized via Web Audio API (no external file needed)
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Two-tone chime: C5 then E5
    const now = ctx.currentTime;

    // Tone 1: C5 (523 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 523;
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2: E5 (659 Hz) — slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 659;
    gain2.gain.setValueAtTime(0.25, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);

    // Cleanup
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Web Audio not available — silent fallback
  }
}

// Request browser notification permission (only once per session)
let permissionRequested = false;
function requestNotificationPermission() {
  if (permissionRequested) return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    permissionRequested = true;
    Notification.requestPermission();
  }
}

function showBrowserNotification(event: EmailNotificationEvent) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (document.hasFocus()) {
    // Still show it — admin might be on a different tab section
  }

  const typeLabels: Record<EmailNotificationEvent["type"], string> = {
    admin_email: "New Admin Email",
    support_ticket: "New Support Ticket",
    support_reply: "Support Ticket Reply",
  };

  const title = typeLabels[event.type] || "New Email";
  const body = event.ticketNumber
    ? `[${event.ticketNumber}] ${event.subject}\nFrom: ${event.fromName || event.from}`
    : `${event.subject}\nFrom: ${event.fromName || event.from}`;

  const notification = new Notification(title, {
    body,
    icon: "/favicon.ico",
    tag: event.id, // Prevents duplicate notifications
    requireInteraction: false,
  });

  // Click to focus the window and navigate to the right page
  notification.onclick = () => {
    window.focus();
    if (event.type === "support_ticket" || event.type === "support_reply") {
      window.location.href = "/email-support";
    } else {
      window.location.href = "/admin/email";
    }
    notification.close();
  };

  // Auto-close after 8s
  setTimeout(() => notification.close(), 8000);
}

export function useEmailNotifications(options: UseEmailNotificationsOptions = {}) {
  const {
    types,
    interval = 5000,
    browserNotification = true,
    sound = true,
    onEmail,
  } = options;

  const lastTimestampRef = useRef<number>(Date.now());
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Request permission on mount
  useEffect(() => {
    if (browserNotification) {
      requestNotificationPermission();
    }
  }, [browserNotification]);

  const processEvent = useCallback(
    (event: EmailNotificationEvent) => {
      // Skip if already seen
      if (seenIdsRef.current.has(event.id)) return;
      seenIdsRef.current.add(event.id);

      // Prune seen set to prevent memory leak
      if (seenIdsRef.current.size > 200) {
        const arr = Array.from(seenIdsRef.current);
        seenIdsRef.current = new Set(arr.slice(-100));
      }

      // Filter by type if specified
      if (types && !types.includes(event.type)) return;

      // Play sound
      if (sound) {
        playNotificationSound();
      }

      // Browser notification
      if (browserNotification) {
        showBrowserNotification(event);
      }

      // Add to in-app notification system (bell icon)
      const typeDescriptions: Record<EmailNotificationEvent["type"], string> = {
        admin_email: "New Admin Email",
        support_ticket: "New Support Ticket",
        support_reply: "Ticket Reply",
      };

      addNotification({
        type: event.type as "admin_email" | "support_ticket" | "support_reply",
        title: typeDescriptions[event.type],
        description: event.ticketNumber
          ? `[${event.ticketNumber}] ${event.subject} — from ${event.fromName || event.from}`
          : `${event.subject} — from ${event.fromName || event.from}`,
        link: event.type === "admin_email" ? "/admin/email" : "/email-support",
        metadata: { emailEvent: event },
      });

      // Custom callback
      if (onEmail) {
        onEmail(event);
      }
    },
    [types, sound, browserNotification, onEmail]
  );

  // Poll for new events
  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      if (!mounted) return;

      try {
        const res = await fetch(
          `/api/notifications/email?since=${lastTimestampRef.current}`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (data.events && data.events.length > 0) {
          for (const event of data.events as EmailNotificationEvent[]) {
            processEvent(event);
          }
          // Update timestamp to latest event
          const maxTs = Math.max(
            ...data.events.map((e: EmailNotificationEvent) => e.timestamp)
          );
          lastTimestampRef.current = maxTs;
        }
      } catch {
        // Network error — skip this poll cycle
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const id = setInterval(poll, interval);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [interval, processEvent]);
}
