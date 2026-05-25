"use client";

/**
 * SitePlanPanel — review the multi-page plan before building.
 *
 * Shown after the user submits a prompt in Full Site mode (?siteMode=full).
 * Displays the sitemap, per-page sections, brand kit, backend needs, and
 * a time/cost estimate. The user can approve and trigger the parallel
 * build (Phase 2), edit the plan via chat, or cancel.
 *
 * Phase 1: read-only display + Approve / Cancel actions. Edit-via-chat
 * comes in Phase 2 alongside the parallel-build orchestrator.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Globe,
  Layout,
  Database,
  Shield,
  HardDrive,
  Clock,
  DollarSign,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import type { SitePlan, SitePlanPage } from "@/lib/site-planner";

interface SitePlanPanelProps {
  plan: SitePlan;
  source: "llm" | "fallback";
  modelUsed?: string;
  onApprove: () => void;
  onCancel: () => void;
  // Phase 2 hook — disabled in Phase 1 since the parallel orchestrator
  // doesn't exist yet. We surface it so the UI shape is locked in.
  approveDisabled?: boolean;
  approveDisabledReason?: string;
}

function categoryIcon(category: string) {
  const map: Record<string, string> = {
    navbar: "🧭",
    hero: "🎯",
    features: "✨",
    testimonials: "💬",
    pricing: "💳",
    stats: "📊",
    faq: "❓",
    cta: "📣",
    footer: "⚓",
    about: "👋",
    contact: "✉️",
    gallery: "🖼️",
    blog: "📝",
    ecommerce: "🛒",
    forms: "📋",
    misc: "•",
  };
  return map[category] || "•";
}

function PageCard({ page, expanded, onToggle }: {
  page: SitePlanPage;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="rounded-xl border bg-[color:var(--paper-elevated)] overflow-hidden"
      style={{ borderColor: "var(--rule)" }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[color:var(--paper)] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-[color:var(--paper)] text-[color:var(--ink-muted)] border" style={{ borderColor: "var(--rule)" }}>
            {page.slug}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[color:var(--ink)] truncate">
              {page.name}
            </div>
            <div className="text-[11px] text-[color:var(--ink-muted)] truncate">
              {page.purpose}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] text-[color:var(--ink-muted)]">
            {page.sections.length} section{page.sections.length === 1 ? "" : "s"}
          </span>
          {page.isAdmin && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[color:var(--gold-soft)] text-[color:var(--gold-deep)]">
              admin
            </span>
          )}
          <ChevronRight
            className={`w-4 h-4 text-[color:var(--ink-muted)] transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </div>
      </button>
      {expanded && (
        <div className="border-t px-4 py-3 space-y-1.5" style={{ borderColor: "var(--rule)" }}>
          {page.sections.map((section, i) => (
            <div key={i} className="flex items-start gap-2 text-[12px]">
              <span className="text-base leading-5">{categoryIcon(section.category)}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-[color:var(--ink)] capitalize">
                  {section.category}
                </div>
                {section.brief && (
                  <div className="text-[color:var(--ink-muted)] text-[11px] leading-snug">
                    {section.brief}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SitePlanPanel({
  plan,
  source,
  modelUsed,
  onApprove,
  onCancel,
  approveDisabled,
  approveDisabledReason,
}: SitePlanPanelProps) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(plan.pages[0]?.slug || null);
  const timeStr = plan.meta.estimatedTimeSeconds < 60
    ? `${plan.meta.estimatedTimeSeconds}s`
    : `${Math.ceil(plan.meta.estimatedTimeSeconds / 60)} min`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border bg-[color:var(--paper)] p-6 max-w-3xl mx-auto"
      style={{ borderColor: "var(--rule)", boxShadow: "0 4px 24px rgba(0,0,0,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "var(--gold-soft)" }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "var(--gold-deep)" }} />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-[color:var(--ink)]">
              Build Plan
            </h2>
            <p className="text-[11px] text-[color:var(--ink-muted)]">
              {source === "llm"
                ? `Planned by ${modelUsed || "Claude"} — review before building`
                : "Heuristic plan (LLM unavailable) — review before building"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-[color:var(--paper-elevated)] text-[color:var(--ink-muted)] transition"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Brand summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="rounded-lg border p-3" style={{ borderColor: "var(--rule)" }}>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-muted)] mb-1">
            Brand
          </div>
          <div className="text-sm font-semibold text-[color:var(--ink)] truncate">
            {plan.brand.name}
          </div>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: "var(--rule)" }}>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-muted)] mb-1">
            Theme
          </div>
          <div className="text-sm font-semibold text-[color:var(--ink)] capitalize">
            {plan.brand.theme}
          </div>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: "var(--rule)" }}>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-muted)] mb-1">
            Primary
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 rounded-full border"
              style={{ background: plan.brand.primaryColor, borderColor: "var(--rule)" }}
            />
            <span className="text-xs font-mono text-[color:var(--ink)]">{plan.brand.primaryColor}</span>
          </div>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: "var(--rule)" }}>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-muted)] mb-1">
            Voice
          </div>
          <div className="text-[11px] text-[color:var(--ink)] line-clamp-2">
            {plan.brand.voice}
          </div>
        </div>
      </div>

      {/* Sitemap */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-[color:var(--ink-muted)]" />
          <h3 className="text-[12px] uppercase tracking-wider font-semibold text-[color:var(--ink-secondary)]">
            Sitemap — {plan.pages.length} {plan.pages.length === 1 ? "page" : "pages"}
          </h3>
        </div>
        <div className="space-y-2">
          {plan.pages.map((page) => (
            <PageCard
              key={page.slug}
              page={page}
              expanded={expandedSlug === page.slug}
              onToggle={() =>
                setExpandedSlug(expandedSlug === page.slug ? null : page.slug)
              }
            />
          ))}
        </div>
      </div>

      {/* Shared elements */}
      <div className="mb-5 rounded-lg border p-3 bg-[color:var(--paper-elevated)]" style={{ borderColor: "var(--rule)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Layout className="w-3.5 h-3.5 text-[color:var(--ink-muted)]" />
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[color:var(--ink-secondary)]">
            Shared across all pages
          </span>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-[color:var(--ink)]">
          <div>
            <span className="text-[color:var(--ink-muted)]">Navbar:</span>{" "}
            <span className="font-mono text-[11px]">{plan.shared.navbarVariant}</span>
          </div>
          <div>
            <span className="text-[color:var(--ink-muted)]">Footer:</span>{" "}
            <span className="font-mono text-[11px]">{plan.shared.footerVariant}</span>
          </div>
        </div>
      </div>

      {/* Backend needs */}
      {(plan.backend.needsAuth || plan.backend.needsDatabase || plan.backend.needsStorage) && (
        <div className="mb-5 rounded-lg border p-3" style={{ borderColor: "var(--rule)" }}>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[color:var(--ink-secondary)] mb-2">
            Backend (auto-provisioned)
          </div>
          <div className="flex flex-wrap gap-2 text-[12px]">
            {plan.backend.needsAuth && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[color:var(--gold-soft)] text-[color:var(--gold-deep)]">
                <Shield className="w-3 h-3" />
                Auth
                {plan.backend.authProviders && plan.backend.authProviders.length > 0 && (
                  <span className="text-[10px] opacity-70">
                    ({plan.backend.authProviders.join(", ")})
                  </span>
                )}
              </span>
            )}
            {plan.backend.needsDatabase && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[color:var(--gold-soft)] text-[color:var(--gold-deep)]">
                <Database className="w-3 h-3" />
                Database
                {plan.backend.tables && plan.backend.tables.length > 0 && (
                  <span className="text-[10px] opacity-70">
                    ({plan.backend.tables.length} tables)
                  </span>
                )}
              </span>
            )}
            {plan.backend.needsStorage && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[color:var(--gold-soft)] text-[color:var(--gold-deep)]">
                <HardDrive className="w-3 h-3" />
                Storage
              </span>
            )}
          </div>
        </div>
      )}

      {/* Estimate strip */}
      <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-lg bg-[color:var(--paper-elevated)] border" style={{ borderColor: "var(--rule)" }}>
        <div className="flex items-center gap-4 text-[12px]">
          <div className="flex items-center gap-1.5 text-[color:var(--ink)]">
            <Clock className="w-3.5 h-3.5 text-[color:var(--ink-muted)]" />
            <span className="font-semibold">~{timeStr}</span>
            <span className="text-[color:var(--ink-muted)]">build time</span>
          </div>
          <div className="flex items-center gap-1.5 text-[color:var(--ink)]">
            <DollarSign className="w-3.5 h-3.5 text-[color:var(--ink-muted)]" />
            <span className="font-semibold">${plan.meta.estimatedCostUsd.toFixed(2)}</span>
            <span className="text-[color:var(--ink-muted)]">estimated cost</span>
          </div>
          <div className="text-[color:var(--ink-muted)]">
            {plan.meta.componentCount} components across {plan.meta.pageCount} pages
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] transition"
        >
          Cancel
        </button>
        <div className="flex items-center gap-2">
          {approveDisabled && approveDisabledReason && (
            <span className="text-[11px] text-[color:var(--ink-muted)]">
              {approveDisabledReason}
            </span>
          )}
          <button
            type="button"
            onClick={onApprove}
            disabled={approveDisabled}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            <Check className="w-3.5 h-3.5" />
            Approve and build
          </button>
        </div>
      </div>
    </motion.div>
  );
}
