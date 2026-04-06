"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface QuotaBarProps {
  mode?: "compact" | "full";
  className?: string;
}

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  creator: 15,
  pro: 50,
  agency: 200,
};

function getBarColor(percent: number): { bg: string; glow: string; text: string } {
  if (percent >= 85) return { bg: "bg-red-500", glow: "shadow-red-500/40", text: "text-red-400" };
  if (percent >= 60) return { bg: "bg-amber-500", glow: "shadow-amber-500/40", text: "text-amber-400" };
  return { bg: "bg-emerald-500", glow: "shadow-emerald-500/40", text: "text-emerald-400" };
}

function getGradient(percent: number): string {
  if (percent >= 85) return "from-red-500 to-red-400";
  if (percent >= 60) return "from-amber-500 to-amber-400";
  return "from-emerald-500 to-emerald-400";
}

export default function QuotaBar({ mode = "full", className = "" }: QuotaBarProps) {
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(3);
  const [plan, setPlan] = useState("free");
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      // Read user plan
      const userRaw = localStorage.getItem("zoobicon_user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        const userPlan = (user.plan || "free").toLowerCase();
        setPlan(userPlan);
        setLimit(PLAN_LIMITS[userPlan] || 3);
        if (user.role === "admin") {
          setIsAdmin(true);
        }
      }

      // Read monthly builds
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const buildsRaw = localStorage.getItem("zoobicon_monthly_builds");
      if (buildsRaw) {
        const builds = JSON.parse(buildsRaw);
        if (builds.period === period) {
          setUsed(builds.count || 0);
        }
        // Different period means 0 used this month
      }
    } catch {
      /* ignore parse errors */
    }
  }, []);

  if (!mounted) return null;

  const percent = isAdmin ? 0 : Math.min((used / limit) * 100, 100);
  const colors = getBarColor(percent);
  const showUpgrade = !isAdmin && percent >= 75 && plan !== "agency";

  if (mode === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Zap className={`w-3.5 h-3.5 ${colors.text}`} />
        <div className="flex-1 min-w-0">
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${getGradient(percent)}`}
              initial={{ width: 0 }}
              animate={{ width: isAdmin ? "100%" : `${percent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
        <span className="text-[11px] text-white/50 whitespace-nowrap">
          {isAdmin ? "Unlimited" : `${used}/${limit}`}
        </span>
        {showUpgrade && (
          <Link
            href="/pricing"
            className="text-[10px] font-medium text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap"
          >
            Upgrade
          </Link>
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div className={`rounded-xl border border-white/[0.06] bg-[#12121a]/60 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${getGradient(percent)} flex items-center justify-center shadow-lg ${colors.glow}`}>
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white/90">Monthly Builds</p>
            <p className="text-[11px] text-white/40 capitalize">{plan} plan</p>
          </div>
        </div>
        <div className="text-right">
          {isAdmin ? (
            <p className="text-sm font-semibold text-emerald-400">Unlimited</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-white/90">
                <span className={colors.text}>{used}</span>
                <span className="text-white/30"> / </span>
                <span className="text-white/50">{limit}</span>
              </p>
              <p className="text-[11px] text-white/30">
                {limit - used > 0 ? `${limit - used} remaining` : "Limit reached"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getGradient(percent)} shadow-lg ${colors.glow}`}
          initial={{ width: 0 }}
          animate={{ width: isAdmin ? "100%" : `${Math.max(percent, 2)}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
      </div>

      {/* Upgrade CTA */}
      {showUpgrade && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white text-xs font-medium transition-all shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30"
          >
            Upgrade Plan
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      )}

      {/* At limit warning */}
      {!isAdmin && used >= limit && (
        <motion.p
          className="text-[11px] text-red-400/80 text-center mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          You&apos;ve reached your monthly limit. Upgrade or wait until next month.
        </motion.p>
      )}
    </div>
  );
}
