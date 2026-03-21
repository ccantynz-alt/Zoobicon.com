"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Sparkles, Zap } from "lucide-react";

const NAMES = [
  "Sarah", "Marcus", "Aisha", "Dev", "Elena", "Kai", "Priya", "James",
  "Luna", "Omar", "Sophie", "Raj", "Mia", "Alex", "Yuki", "Noah", "Zara", "Leo",
];

const SITE_TYPES = [
  "fitness studio", "SaaS dashboard", "restaurant", "portfolio",
  "e-commerce store", "agency", "dental clinic", "real estate",
  "photography", "consulting firm", "bakery", "law firm",
  "startup landing page", "yoga studio", "barber shop", "tech blog",
];

const AVATAR_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-purple-500 to-purple-700",
  "from-cyan-500 to-cyan-700",
  "from-cyan-500 to-cyan-700",
];

const ICONS = [Globe, Sparkles, Zap];

interface ActivityItem {
  id: number;
  name: string;
  siteType: string;
  secondsAgo: number;
  gradientIndex: number;
  iconIndex: number;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateActivity(id: number): ActivityItem {
  return {
    id,
    name: randomItem(NAMES),
    siteType: randomItem(SITE_TYPES),
    secondsAgo: Math.floor(Math.random() * 43) + 3,
    gradientIndex: Math.floor(Math.random() * AVATAR_GRADIENTS.length),
    iconIndex: Math.floor(Math.random() * ICONS.length),
  };
}

export default function ActivityFeed() {
  const [items, setItems] = useState<ActivityItem[]>(() => [
    generateActivity(1),
    generateActivity(2),
    generateActivity(3),
  ]);
  const [nextId, setNextId] = useState(4);

  const addItem = useCallback(() => {
    setItems((prev) => {
      const updated = [generateActivity(nextId), ...prev];
      return updated.slice(0, 3);
    });
    setNextId((id) => id + 1);
  }, [nextId]);

  useEffect(() => {
    const interval = setInterval(addItem, 3000);
    return () => clearInterval(interval);
  }, [addItem]);

  return (
    <div className="w-full max-w-[320px] flex flex-col gap-2">
      <AnimatePresence mode="popLayout" initial={false}>
        {items.map((item) => {
          const Icon = ICONS[item.iconIndex];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.25 } }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              layout
              className="relative flex items-center gap-[10px] rounded-lg p-3 border-l-2 border-[#7c5aff] bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.08] transition-colors cursor-default group"
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[item.gradientIndex]} flex items-center justify-center text-white text-sm font-semibold`}
              >
                {item.name[0]}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-tight truncate">
                  <span className="text-white font-medium">{item.name}</span>{" "}
                  <span className="text-white/60">just built a </span>
                  <span className="text-white/60">{item.siteType}</span>
                </p>
              </div>

              {/* Time badge */}
              <span className="flex-shrink-0 text-[11px] text-white/50 tabular-nums whitespace-nowrap">
                {item.secondsAgo}s ago
              </span>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-[0_0_12px_rgba(124,90,255,0.15)]" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
