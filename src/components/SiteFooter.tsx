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
    <footer className="relative border-t" style={{ borderColor: "var(--rule)", background: "var(--paper)" }}>
      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-10">
        {/* Top CTA strip — conversion surface */}
        <div
          className="relative mb-20 overflow-hidden rounded-[32px] p-10 sm:p-14"
          style={{
            background: "var(--paper-elevated)",
            border: "1px solid var(--rule)",
            boxShadow: "var(--shadow-2)",
          }}
        >
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="max-w-xl">
              <div
                className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium"
                style={{
                  border: "1px solid var(--rule)",
                  background: "var(--paper)",
                  color: "var(--ink-secondary)",
                }}
              >
                <Sparkles className="h-3 w-3" style={{ color: "var(--gold-deep)" }} />
                Ready when you are
              </div>
              <h2
                className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.032em]"
                style={{ color: "var(--ink)" }}
              >
                Build the thing.{" "}
                <span
                  className="display-italic font-normal"
                  style={{ color: "var(--gold-deep)" }}
                >
                  Today.
                </span>
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed max-w-md" style={{ color: "var(--ink-secondary)" }}>
                One sentence. Sixty seconds. A complete, responsive site, domain,
                email and video in a single flow. No templates. No code.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: "var(--ink)",
                  color: "var(--paper)",
                  boxShadow: "0 8px 24px -8px rgba(10,10,11,0.25)",
                }}
              >
                Start building
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-medium transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  border: "1px solid var(--rule-strong)",
                  background: "var(--paper)",
                  color: "var(--ink)",
                }}
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
                  background: "var(--ink)",
                  boxShadow: "var(--shadow-1)",
                }}
              >
                <span style={{ color: "var(--gold)" }} className="font-black text-[15px] tracking-tight">Z</span>
              </div>
              <span className="font-semibold text-[18px] tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
                Zoobicon
              </span>
            </Link>
            <p className="text-[13px] leading-relaxed max-w-sm mb-6" style={{ color: "var(--ink-secondary)" }}>
              The AI platform for building websites, making videos, registering
              domains and launching a business. Seventy-five tools, one price.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px]"
                style={{ border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink-secondary)" }}
              >
                <ShieldCheck className="h-3 w-3 text-amber-600" /> SOC 2 aligned
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px]"
                style={{ border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink-secondary)" }}
              >
                <Lock className="h-3 w-3" style={{ color: "var(--gold-deep)" }} /> GDPR ready
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px]"
                style={{ border: "1px solid var(--rule)", background: "var(--paper)", color: "var(--ink-secondary)" }}
              >
                <Zap className="h-3 w-3" style={{ color: "var(--gold-deep)" }} /> Stripe Verified
              </span>
            </div>
            <Link
              href="/launch-status"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all"
              style={{
                border: "1px solid rgba(16, 185, 129, 0.3)",
                background: "rgba(16, 185, 129, 0.06)",
                color: "rgb(5, 122, 85)",
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
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
                { name: "Contact", href: "/support" },
                { name: "Legal", href: "/disclaimers" },
                { name: "Privacy", href: "/privacy" },
              ]}
            />
          </div>
        </div>

        {/* Four-domain signature + copyright (rule 11) */}
        <div
          className="mt-16 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--rule)" }}
        >
          <div className="text-[11px] flex items-center gap-1.5" style={{ color: "var(--ink-muted)" }}>
            <Globe2 className="h-3 w-3" />
            <span className="font-mono tracking-tight">
              zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh
            </span>
          </div>
          <div className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
            © {year} Zoobicon Limited. Built on Opus 4.7.
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
        style={{ color: "var(--gold-deep)" }}
      >
        {label}
      </div>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group inline-flex items-center gap-1 text-[13px] transition-colors"
              style={{ color: "var(--ink-secondary)" }}
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
