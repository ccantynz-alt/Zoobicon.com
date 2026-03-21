"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Globe, Zap, Users, Layers } from "lucide-react";

interface CounterStat {
  label: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
  color: string;
}

const STATS: CounterStat[] = [
  {
    label: "Sites Built",
    value: 47293,
    suffix: "+",
    icon: <Globe className="w-5 h-5" />,
    color: "#7c5aff",
  },
  {
    label: "Builds This Week",
    value: 2847,
    suffix: "",
    icon: <Zap className="w-5 h-5" />,
    color: "#3b82f6",
  },
  {
    label: "Active Builders",
    value: 12400,
    suffix: "+",
    icon: <Users className="w-5 h-5" />,
    color: "#22d3ee",
  },
  {
    label: "AI Agents Deployed",
    value: 331051,
    suffix: "",
    icon: <Layers className="w-5 h-5" />,
    color: "#a78bfa",
  },
];

function AnimatedNumber({
  value,
  duration = 2000,
  started,
}: {
  value: number;
  duration?: number;
  started: boolean;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!started) return;

    let startTime: number;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * value));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration, started]);

  // Format with commas
  return <>{display.toLocaleString()}</>;
}

export default function LiveCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [tick, setTick] = useState(0);

  // Increment counters slightly every few seconds for "live" feel
  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <div ref={ref} className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative group"
          >
            <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 lg:p-6 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]">
              {/* Glow spot */}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle, ${stat.color}20, transparent 70%)`,
                  filter: "blur(20px)",
                }}
              />

              <div className="relative">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: `${stat.color}15`,
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </div>

                <div className="font-display text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-1">
                  <AnimatedNumber
                    value={stat.value + tick * (i === 0 ? 3 : i === 1 ? 7 : i === 2 ? 1 : 21)}
                    started={isInView}
                  />
                  <span className="text-white/50">{stat.suffix}</span>
                </div>

                <div className="text-sm text-white/50 font-medium">
                  {stat.label}
                </div>

                {/* Live pulse indicator */}
                {i === 1 && (
                  <div className="absolute top-0 right-0 flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-medium uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
