"use client";

import Link from "next/link";
import { Wifi, Zap, ArrowLeft } from "lucide-react";
import BackgroundEffects from "@/components/BackgroundEffects";

export default function EsimPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <BackgroundEffects preset="minimal" />
      <div className="relative z-10 text-center px-6 max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto mb-8 flex items-center justify-center">
          <Wifi className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Coming Soon</h1>
        <p className="text-white/40 mb-8">
          eSIM data plans for 190+ countries. Instant activation. No physical SIM needed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Zoobicon
        </Link>
        <p className="text-[10px] text-white/15 mt-12">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</p>
      </div>
    </div>
  );
}
