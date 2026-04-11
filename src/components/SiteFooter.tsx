"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ShieldCheck,
  Globe2,
  Lock,
  Sparkles,
  Zap,
} from "lucide-react";

/**
 * SiteFooter — the serious business footer.
 *
 * Rule 29 (Filmora standard). Shared across every public page.
 * Hidden on /builder, /admin, /edit, /auth.
 * Columns: Build · Launch · Grow · Scale · Company · Legal.
 * Trust row: four-domain signature, SOC2/GDPR/Stripe-secure badges,
 * live status link. Newsletter handled inline here so every page
 * has a conversion surface at the bottom.
 */
export default function SiteFooter() {
  const pathname = usePathname();

  // Hide on product surfaces that have their own chrome
  if (pathname?.startsWith("/admin")) return null;
  if (pathname === "/builder") return null;
  if (pathname?.startsWith("/edit/")) return null;
  if (pathname?.startsWith("/auth/")) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.06] bg-[#050508] overflow-hidden">
      {/* Ambient warm glow — restrained, just enough to signal depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-0 h-[560px] w-[1100px] -translate-x-1/2 rounded-full blur-[140px]"
          style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.06), transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-10">
        {/* Top CTA strip — conversion surface */}
        <div
          className="relative mb-20 overflow-hidden rounded-[32px] border border-white/[0.08] p-10 sm:p-14"
          style={{
            background:
              "linear-gradient(135deg, rgba(17,17,24,0.85) 0%, rgba(26,26,36,0.65) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-[400px] w-[400px] rounded-full blur-[120px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.18), transparent 70%)" }}
          />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur">
                <Sparkles className="h-3 w-3 text-[#E8D4B0]" />
                Ready when you are
              </div>
              <h2 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.032em] text-white">
                Build the thing.{" "}
                <span
                  className="font-normal"
                  style={{
                    fontFamily: "Fraunces, ui-serif, Georgia, serif",
                    fontStyle: "italic",
                    color: "#E8D4B0",
                  }}
                >
                  Today.
                </span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/55 max-w-md">
                One sentence. Sixty seconds. A complete, responsive site, domain,
                email and video in a single flow. No templates. No code.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
                  color: "#0a0a0f",
                  boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
                }}
              >
                Start building
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
              >
                See pricing
              </Link>
            </div>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #E8D4B0 0%, #F7C8A0 60%, #E08BB0 100%)",
                  boxShadow: "0 10px 30px -12px rgba(232,212,176,0.55)",
                }}
              >
                <span className="text-black font-black text-[15px] tracking-tight">Z</span>
              </div>
              <span className="text-white font-semibold text-[18px] tracking-[-0.02em]">
                Zoobicon
              </span>
            </Link>
            <p className="text-[13px] text-white/50 leading-relaxed max-w-sm mb-6">
              The AI platform for building websites, making videos, registering
              domains and launching a business. Seventy-five tools, one price.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/55">
                <ShieldCheck className="h-3 w-3 text-emerald-400" /> SOC 2 aligned
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/55">
                <Lock className="h-3 w-3 text-[#E8D4B0]" /> GDPR ready
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/55">
                <Zap className="h-3 w-3 text-[#E8D4B0]" /> Stripe Verified
              </span>
            </div>
            <Link
              href="/launch-status"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.04] px-3 py-1.5 text-[11px] font-medium text-emerald-300/90 transition-all hover:border-emerald-400/40 hover:text-emerald-300"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              All systems operational
              <ArrowRight className="h-3 w-3 opacity-60" />
            </Link>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            <FooterColumn
              label="Build"
              links={[
                { name: "AI Builder", href: "/builder" },
                { name: "Generators", href: "/generators" },
                { name: "Templates", href: "/starter-kits" },
                { name: "Video Creator", href: "/video-creator" },
                { name: "Components", href: "/components" },
              ]}
            />
            <FooterColumn
              label="Launch"
              links={[
                { name: "Hosting", href: "/hosting" },
                { name: "Domains", href: "/domains" },
                { name: "SEO Dashboard", href: "/seo" },
                { name: "Email Marketing", href: "/email-marketing" },
                { name: "Status", href: "/launch-status" },
              ]}
            />
            <FooterColumn
              label="Scale"
              links={[
                { name: "Pricing", href: "/pricing" },
                { name: "Agencies", href: "/agencies" },
                { name: "API & Developers", href: "/developers" },
                { name: "Marketplace", href: "/marketplace" },
                { name: "Documentation", href: "/documentation" },
              ]}
            />
            <FooterColumn
              label="Company"
              links={[
                { name: "Sign in", href: "/auth/login" },
                { name: "Create account", href: "/auth/signup" },
                { name: "Contact", href: "/contact" },
                { name: "Legal", href: "/disclaimers" },
                { name: "Privacy", href: "/privacy" },
              ]}
            />
          </div>
        </div>

        {/* Four-domain signature + copyright (rule 11) */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-[11px] text-white/35 flex items-center gap-1.5">
            <Globe2 className="h-3 w-3" />
            <span className="font-mono tracking-tight">
              zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh
            </span>
          </div>
          <div className="text-[11px] text-white/35">
            © {year} Zoobicon Limited. Built on Opus 4.6.
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  label,
  links,
}: {
  label: string;
  links: Array<{ name: string; href: string }>;
}) {
  return (
    <div>
      <div
        className="mb-4 text-[10px] uppercase tracking-[0.2em] font-semibold"
        style={{ color: "rgba(232,212,176,0.75)" }}
      >
        {label}
      </div>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group inline-flex items-center gap-1 text-[13px] text-white/55 hover:text-white transition-colors"
            >
              {l.name}
              <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
