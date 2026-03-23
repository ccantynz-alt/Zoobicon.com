"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Hammer,
  UserPlus,
  Share2,
  GitFork,
  Activity,
} from "lucide-react";

/* ---------- types ---------- */

type ActivityType = "build" | "deploy" | "signup" | "share" | "remix";

interface ActivityEvent {
  id: string;
  type: ActivityType;
  userName: string;
  description: string;
  slug: string | null;
  timestamp: string;
}

interface ActivityFeedProps {
  mode?: "compact" | "full";
  limit?: number;
  className?: string;
}

/* ---------- icon map ---------- */

const ICONS: Record<ActivityType, typeof Rocket> = {
  deploy: Rocket,
  build: Hammer,
  signup: UserPlus,
  share: Share2,
  remix: GitFork,
};

const ICON_COLORS: Record<ActivityType, string> = {
  deploy: "text-green-400",
  build: "text-blue-400",
  signup: "text-purple-400",
  share: "text-amber-400",
  remix: "text-pink-400",
};

const ICON_BG: Record<ActivityType, string> = {
  deploy: "bg-green-400/10",
  build: "bg-blue-400/10",
  signup: "bg-purple-400/10",
  share: "bg-amber-400/10",
  remix: "bg-pink-400/10",
};

/* ---------- demo data ---------- */

function generateDemoData(): ActivityEvent[] {
  const now = Date.now();
  const items: Omit<ActivityEvent, "id">[] = [
    { type: "deploy", userName: "Emma W.", description: "deployed a yoga studio site", slug: "zen-yoga", timestamp: new Date(now - 12_000).toISOString() },
    { type: "build", userName: "James R.", description: "built a SaaS landing page", slug: "taskpilot-ai", timestamp: new Date(now - 45_000).toISOString() },
    { type: "signup", userName: "Sofia L.", description: "joined the platform", slug: null, timestamp: new Date(now - 120_000).toISOString() },
    { type: "deploy", userName: "Marcus D.", description: "deployed a crypto dashboard", slug: "chainvault", timestamp: new Date(now - 180_000).toISOString() },
    { type: "build", userName: "Priya G.", description: "built a restaurant website", slug: "bella-cucina", timestamp: new Date(now - 300_000).toISOString() },
    { type: "share", userName: "Alex K.", description: "shared a developer portfolio", slug: "devmatrix", timestamp: new Date(now - 420_000).toISOString() },
    { type: "remix", userName: "Lily R.", description: "remixed a plant shop template", slug: "green-thumb", timestamp: new Date(now - 600_000).toISOString() },
    { type: "deploy", userName: "Chris P.", description: "deployed a fitness coaching site", slug: "ironwill-fit", timestamp: new Date(now - 900_000).toISOString() },
    { type: "build", userName: "Nina W.", description: "built a digital agency site", slug: "pulse-digital", timestamp: new Date(now - 1_200_000).toISOString() },
    { type: "signup", userName: "Tom H.", description: "joined the platform", slug: null, timestamp: new Date(now - 1_500_000).toISOString() },
    { type: "deploy", userName: "Mia C.", description: "deployed a photography portfolio", slug: "shutterschool", timestamp: new Date(now - 1_800_000).toISOString() },
    { type: "share", userName: "Raj S.", description: "shared a cybersecurity site", slug: "cyberguard", timestamp: new Date(now - 2_400_000).toISOString() },
    { type: "build", userName: "Hannah B.", description: "built an organic skincare store", slug: "pureglow", timestamp: new Date(now - 3_000_000).toISOString() },
    { type: "remix", userName: "Oscar Z.", description: "remixed a fintech dashboard", slug: "finscope", timestamp: new Date(now - 3_600_000).toISOString() },
    { type: "deploy", userName: "Katie J.", description: "deployed a pet rescue site", slug: "safe-paws", timestamp: new Date(now - 4_200_000).toISOString() },
    { type: "build", userName: "Leo F.", description: "built a creative agency portfolio", slug: "prism-creative", timestamp: new Date(now - 5_400_000).toISOString() },
    { type: "signup", userName: "Diana M.", description: "joined the platform", slug: null, timestamp: new Date(now - 6_000_000).toISOString() },
    { type: "deploy", userName: "Ben O.", description: "deployed a pet store", slug: "pawpalace", timestamp: new Date(now - 7_200_000).toISOString() },
  ];
  return items.map((item, i) => ({ ...item, id: `demo-${i}` }));
}

/* ---------- time ago ---------- */

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/* ---------- component ---------- */

export default function ActivityFeed({
  mode = "full",
  limit = 20,
  className = "",
}: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`/api/activity?limit=${limit}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data: ActivityEvent[] = await res.json();
        if (data.length > 0) {
          setEvents(data.slice(0, limit));
          setIsLoaded(true);
          return;
        }
      }
    } catch {
      // API unavailable — use demo data
    }
    // Fallback to demo data
    setEvents(generateDemoData().slice(0, limit));
    setIsLoaded(true);
  }, [limit]);

  useEffect(() => {
    fetchActivity();
    pollRef.current = setInterval(fetchActivity, 15_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchActivity]);

  // Auto-scroll for compact mode ticker
  useEffect(() => {
    if (mode !== "compact" || !scrollRef.current) return;
    const el = scrollRef.current;
    let animId: number;
    let scrollPos = 0;
    const speed = 0.5; // px per frame

    function tick() {
      scrollPos += speed;
      if (scrollPos >= el.scrollWidth - el.clientWidth) {
        scrollPos = 0;
      }
      el.scrollLeft = scrollPos;
      animId = requestAnimationFrame(tick);
    }
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [mode, isLoaded]);

  if (!isLoaded) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Activity className="h-5 w-5 animate-pulse text-white/30" />
      </div>
    );
  }

  /* ---------- compact mode: horizontal ticker ---------- */

  if (mode === "compact") {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-gray-950 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-gray-950 to-transparent" />

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-hidden py-2 scrollbar-none"
        >
          {/* Duplicate for infinite scroll effect */}
          {[...events, ...events].map((event, i) => {
            const Icon = ICONS[event.type];
            return (
              <div
                key={`${event.id}-${i}`}
                className="flex flex-shrink-0 items-center gap-2.5 rounded-full border border-white/5 bg-white/[0.03] px-4 py-2"
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${ICON_BG[event.type]}`}
                >
                  <Icon className={`h-3 w-3 ${ICON_COLORS[event.type]}`} />
                </div>
                <span className="whitespace-nowrap text-sm text-white/70">
                  <span className="font-medium text-white/90">
                    {event.userName}
                  </span>{" "}
                  {event.description}
                </span>
                <span className="whitespace-nowrap text-xs text-white/30">
                  {timeAgo(event.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---------- full mode: vertical list ---------- */

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-white/40" />
        <h3 className="text-sm font-medium text-white/60">Live Activity</h3>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        {events.map((event) => {
          const Icon = ICONS[event.type];
          return (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
            >
              {/* Icon */}
              <div
                className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${ICON_BG[event.type]} transition-transform group-hover:scale-110`}
              >
                <Icon className={`h-4 w-4 ${ICON_COLORS[event.type]}`} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-white/80">
                  <span className="font-medium text-white">
                    {event.userName}
                  </span>{" "}
                  {event.description}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs text-white/30">
                    {timeAgo(event.timestamp)}
                  </span>
                  {event.slug && (
                    <a
                      href={`https://${event.slug}.zoobicon.sh`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-white/20 transition-colors hover:text-white/50"
                    >
                      {event.slug}.zoobicon.sh
                    </a>
                  )}
                </div>
              </div>

              {/* Thumbnail placeholder for sites */}
              {event.slug && (
                <div className="hidden flex-shrink-0 overflow-hidden rounded-md border border-white/5 sm:block">
                  <div className="h-10 w-16 bg-gradient-to-br from-white/[0.04] to-white/[0.01]" />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
