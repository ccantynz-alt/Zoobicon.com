"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Users, Gift, ExternalLink } from "lucide-react";
import { getReferralTier } from "@/lib/referral";

interface ReferralData {
  referralCode: string;
  signups: number;
  buildsEarned: number;
  tier: { name: string; badge: string; color: string };
  history: Array<{ referred_email: string; created_at: string }>;
}

/**
 * ReferralCard — shows the user's referral link, stats, and earned credits.
 * Displayed on the dashboard so users can easily share their referral link.
 */
export default function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const userRaw = localStorage.getItem("zoobicon_user");
        if (!userRaw) {
          setLoading(false);
          return;
        }
        const user = JSON.parse(userRaw);
        if (!user.email) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/referral?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const stats = await res.json();
          setData(stats);
        }
      } catch {
        // Fail silently — referral card is non-critical
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const handleCopy = async () => {
    if (!data?.referralCode) return;
    const link = `https://zoobicon.com/?ref=${data.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a temporary input
      const input = document.createElement("input");
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 animate-pulse">
        <div className="h-5 w-32 bg-white/10 rounded mb-3" />
        <div className="h-4 w-48 bg-white/5 rounded" />
      </div>
    );
  }

  if (!data) return null;

  const tier = getReferralTier(data.signups);
  const referralLink = `https://zoobicon.com/?ref=${data.referralCode}`;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-brand-400" />
          <h3 className="text-sm font-bold">Refer & Earn</h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full bg-white/5 ${tier.color}`}>
          {tier.badge} {tier.name}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-white/50 mb-4">
        Share your link. When a friend signs up, you both get <strong className="text-white/70">1 free build</strong>.
      </p>

      {/* Referral link */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-black/30 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/60 font-mono truncate">
          {referralLink}
        </div>
        <button
          onClick={handleCopy}
          className={`flex-shrink-0 p-2 rounded-lg transition-all ${
            copied
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
          }`}
          title={copied ? "Copied!" : "Copy referral link"}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/[0.03] rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-3 h-3 text-brand-400/60" />
            <span className="text-lg font-bold">{data.signups}</span>
          </div>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Friends Referred</span>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Gift className="w-3 h-3 text-emerald-400/60" />
            <span className="text-lg font-bold text-emerald-400">{data.buildsEarned}</span>
          </div>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Builds Earned</span>
        </div>
      </div>

      {/* Recent referrals */}
      {data.history && data.history.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/[0.04]">
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Recent Referrals</span>
          <div className="mt-2 space-y-1">
            {data.history.slice(0, 3).map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-white/50">{entry.referred_email}</span>
                <span className="text-white/30">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tier progress */}
      {tier.nextTier && tier.nextTierAt && (
        <div className="mt-4 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center justify-between text-[10px] text-white/40 mb-1.5">
            <span>Progress to {tier.nextTier}</span>
            <span>{data.signups}/{tier.nextTierAt}</span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-accent-cyan rounded-full transition-all"
              style={{ width: `${Math.min(100, (data.signups / tier.nextTierAt) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
