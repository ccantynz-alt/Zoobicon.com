"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Globe2,
  Lock,
  Zap,
} from "lucide-react";

/**
 * SiteFooter — ZOOBICON BOLD (Rule 37).
 *
 * The closing dark statement band: a big lime-accented CTA, link
 * columns on ink, trust badges, three-domain signature. Shared across
 * every public page; hidden on /builder, /admin, /edit, /auth.
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
    <footer
      className="zb-dark relative overflow-hidden"
      style={{ borderTop: "1px solid var(--zb-line-dark)" }}
    >
      {/* Ambient lime glow, top-right — same treatment as the dark
          homepage sections so the footer reads as part of one system */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute right-[-10%] top-[-30%] h-[460px] w-[700px] rounded-full blur-[150px]"
          style={{ background: "radial-gradient(closest-side, rgba(212,242,78,0.09), transparent 72%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-10">
        {/* ── CTA band ── */}
        <div className="mb-24 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
          <div className="max-w-2xl">
            <div className="zb-eyebrow mb-5" style={{ color: "var(--zb-accent)" }}>
              <Zap className="h-3.5 w-3.5" />
              Ready when you are
            </div>
            <h2 className="zb-display text-5xl sm:text-6xl" style={{ color: "#ffffff" }}>
              Build the thing.{" "}
              <span style={{ color: "var(--zb-accent)" }}>Today.</span>
            </h2>
            <p
              className="mt-6 max-w-md text-[15.5px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              One sentence. Sixty seconds. A complete, responsive site with
              hosting and a custom domain provisioned in the same deploy step.
              No templates. No code.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/builder" className="zb-btn">
              Start building
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="zb-btn-ghost-dark">
              See pricing
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* ── Link columns ── */}
        <div
          className="grid gap-12 pt-14 lg:grid-cols-12"
          style={{ borderTop: "1px solid var(--zb-line-dark)" }}
        >
          {/* Brand column */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[10px]"
                style={{ background: "var(--zb-accent)" }}
              >
                <span className="zb-display text-[19px] leading-none" style={{ color: "var(--zb-accent-ink)" }}>
                  Z
                </span>
              </div>
              <span className="zb-display text-[19px]" style={{ color: "#ffffff" }}>
                zoobicon
              </span>
            </Link>
            <p
              className="mb-7 max-w-sm text-[13.5px] leading-relaxed"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              The AI Website Builder that ships the whole thing — site, hosting
              and custom domain — from one prompt. Describe your business,
              watch six agents build it, deploy under your own name.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              {[
                { icon: ShieldCheck, label: "SOC 2 aligned" },
                { icon: Lock, label: "GDPR ready" },
                { icon: Zap, label: "Stripe verified" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-semibold"
                  style={{
                    border: "1px solid var(--zb-line-dark)",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  <Icon className="h-3 w-3" style={{ color: "var(--zb-accent)" }} />
                  {label}
                </span>
              ))}
            </div>
            <div
              className="mt-7 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{
                border: "1px solid rgba(212,242,78,0.25)",
                background: "rgba(212,242,78,0.08)",
                color: "var(--zb-accent)",
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full"
                  style={{ background: "rgba(212,242,78,0.6)" }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--zb-accent)" }}
                />
              </span>
              All systems operational
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-8 grid grid-cols-2 gap-10 sm:grid-cols-4">
            <FooterColumn
              label="Build"
              links={[
                { name: "AI Builder", href: "/builder" },
                { name: "Generators", href: "/generators" },
                { name: "Showcase", href: "/showcase" },
                { name: "Import a site", href: "/import" },
              ]}
            />
            <FooterColumn
              label="Platform"
              links={[
                { name: "Pricing", href: "/pricing" },
                { name: "Compare", href: "/compare" },
                { name: "Free audit", href: "/audit" },
                { name: "Changelog", href: "/changelog" },
              ]}
            />
            <FooterColumn
              label="Scale"
              links={[
                { name: "Agencies", href: "/agencies" },
                { name: "AI Agents", href: "/agents" },
                { name: "Marketplace", href: "/marketplace" },
              ]}
            />
            <FooterColumn
              label="Company"
              links={[
                { name: "Contact", href: "/support" },
                { name: "Legal", href: "/disclaimers" },
                { name: "Privacy", href: "/privacy" },
                { name: "Terms", href: "/terms" },
              ]}
            />
          </div>
        </div>

        {/* ── Three-domain signature + copyright. Rule 31 — zoobicon.sh retired. ── */}
        <div
          className="mt-20 flex flex-col items-start justify-between gap-4 pt-8 sm:flex-row sm:items-center"
          style={{ borderTop: "1px solid var(--zb-line-dark)" }}
        >
          <div
            className="flex items-center gap-1.5 text-[11px]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <Globe2 className="h-3 w-3" />
            <span className="font-mono tracking-tight">
              zoobicon.com · zoobicon.ai · zoobicon.io
            </span>
          </div>
          <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>
            © {year} Zoobicon Limited. Built with Claude.
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
      <div className="zb-eyebrow mb-5" style={{ color: "var(--zb-accent)" }}>
        {label}
      </div>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="group inline-flex items-center gap-1 text-[13.5px] font-medium transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              {l.name}
              <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-60" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
