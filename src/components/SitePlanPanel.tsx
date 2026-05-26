"use client";

/**
 * SitePlanPanel — review + edit the multi-page plan before building.
 *
 * Phase 4 (this revision) adds inline editing: rename pages, edit
 * purposes, add/remove/reorder pages, add/remove/reorder sections,
 * change section categories + briefs. Approve hands the edited copy
 * to the orchestrator; Reset reverts to the original LLM plan.
 *
 * State model: the incoming `plan` prop is the original. We clone it
 * into local state on mount so edits don't leak until Approve. The
 * Reset button restores the original.
 */

import { useEffect, useMemo, useState } from "react";
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
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  RotateCcw,
  GripVertical,
} from "lucide-react";
import type { SitePlan, SitePlanPage, PageSection } from "@/lib/site-planner";
import type { ComponentCategory } from "@/lib/component-registry/store";

interface SitePlanPanelProps {
  plan: SitePlan;
  source: "llm" | "fallback";
  modelUsed?: string;
  /** Called with the (possibly edited) plan when the user clicks Approve. */
  onApprove: (plan: SitePlan) => void;
  onCancel: () => void;
  approveDisabled?: boolean;
  approveDisabledReason?: string;
}

const SECTION_CATEGORIES: ComponentCategory[] = [
  "navbar", "hero", "features", "testimonials", "pricing", "stats",
  "faq", "cta", "footer", "about", "contact", "gallery", "blog",
  "ecommerce", "forms", "misc",
];

function categoryIcon(category: string) {
  const map: Record<string, string> = {
    navbar: "🧭", hero: "🎯", features: "✨", testimonials: "💬",
    pricing: "💳", stats: "📊", faq: "❓", cta: "📣", footer: "⚓",
    about: "👋", contact: "✉️", gallery: "🖼️", blog: "📝",
    ecommerce: "🛒", forms: "📋", misc: "•",
  };
  return map[category] || "•";
}

/**
 * Deep-clone a plan. structuredClone isn't safe everywhere yet; this
 * is fast enough for our 6-page typical case and explicit about what's
 * copied.
 */
function clonePlan(plan: SitePlan): SitePlan {
  return {
    brand: { ...plan.brand },
    pages: plan.pages.map((p) => ({
      ...p,
      sections: p.sections.map((s) => ({ ...s })),
    })),
    shared: { ...plan.shared },
    backend: {
      ...plan.backend,
      tables: [...(plan.backend.tables || [])],
      authProviders: [...(plan.backend.authProviders || [])],
    },
    meta: { ...plan.meta },
  };
}

/**
 * Recompute meta.componentCount + estimates from the current page list.
 * Called after every edit so the estimate strip stays accurate.
 */
function recomputeMeta(plan: SitePlan): SitePlan["meta"] {
  const componentCount = plan.pages.reduce((n, p) => n + p.sections.length, 0);
  const estimatedTimeSeconds = plan.pages.reduce(
    (n, p) => n + Math.ceil(p.sections.length / 4) * 7,
    0,
  ) + 5;
  return {
    ...plan.meta,
    pageCount: plan.pages.length,
    componentCount,
    estimatedTimeSeconds,
    estimatedCostUsd: Math.max(0.05, componentCount * 0.0014),
  };
}

interface PageCardProps {
  page: SitePlanPage;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
  onChange: (next: SitePlanPage) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
}

function PageCard({
  page, isFirst, isLast, expanded,
  onToggle, onChange, onDelete, onMove,
}: PageCardProps) {
  const setField = <K extends keyof SitePlanPage>(field: K, value: SitePlanPage[K]) => {
    onChange({ ...page, [field]: value });
  };

  const updateSection = (i: number, next: PageSection) => {
    const sections = [...page.sections];
    sections[i] = next;
    onChange({ ...page, sections });
  };

  const removeSection = (i: number) => {
    const sections = page.sections.filter((_, idx) => idx !== i);
    onChange({ ...page, sections });
  };

  const moveSection = (i: number, direction: -1 | 1) => {
    const j = i + direction;
    if (j < 0 || j >= page.sections.length) return;
    const sections = [...page.sections];
    [sections[i], sections[j]] = [sections[j], sections[i]];
    onChange({ ...page, sections });
  };

  const addSection = () => {
    onChange({
      ...page,
      sections: [
        ...page.sections,
        { category: "features", brief: "New section — describe what it shows." },
      ],
    });
  };

  return (
    <div
      className="rounded-xl border bg-[color:var(--paper-elevated)] overflow-hidden"
      style={{ borderColor: "var(--rule)" }}
    >
      {/* Header row — slug pill, name, controls */}
      <div className="flex items-center justify-between px-3 py-2.5 gap-2">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-3 min-w-0 flex-1 text-left hover:bg-[color:var(--paper)] rounded-md px-1 py-1 transition-colors"
        >
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-[color:var(--paper)] text-[color:var(--ink-muted)] border flex-shrink-0" style={{ borderColor: "var(--rule)" }}>
            {page.slug}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[color:var(--ink)] truncate">
              {page.name}
            </div>
            <div className="text-[11px] text-[color:var(--ink-muted)] truncate">
              {page.sections.length} section{page.sections.length === 1 ? "" : "s"}
              {page.purpose && ` — ${page.purpose}`}
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-[color:var(--ink-muted)] flex-shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={isFirst}
            className="p-1.5 rounded hover:bg-[color:var(--paper)] disabled:opacity-25 disabled:cursor-not-allowed text-[color:var(--ink-muted)]"
            aria-label="Move page up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={isLast}
            className="p-1.5 rounded hover:bg-[color:var(--paper)] disabled:opacity-25 disabled:cursor-not-allowed text-[color:var(--ink-muted)]"
            aria-label="Move page down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove ${page.name}? You can re-add it from the planner.`)) onDelete();
            }}
            className="p-1.5 rounded hover:bg-red-50 text-[color:var(--ink-muted)] hover:text-red-600"
            aria-label="Delete page"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded body — inline editing */}
      {expanded && (
        <div className="border-t px-4 py-3 space-y-3" style={{ borderColor: "var(--rule)" }}>
          {/* Name + slug + purpose */}
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[10px] uppercase tracking-wider text-[color:var(--ink-muted)]">
              Page name
              <input
                type="text"
                value={page.name}
                onChange={(e) => setField("name", e.target.value)}
                className="mt-1 w-full px-2 py-1.5 text-sm rounded border bg-[color:var(--paper)] text-[color:var(--ink)] focus:outline-none focus:ring-1"
                style={{ borderColor: "var(--rule)" }}
              />
            </label>
            <label className="block text-[10px] uppercase tracking-wider text-[color:var(--ink-muted)]">
              Slug
              <input
                type="text"
                value={page.slug}
                onChange={(e) => {
                  const cleaned = e.target.value.startsWith("/")
                    ? e.target.value
                    : `/${e.target.value}`;
                  setField("slug", cleaned.toLowerCase());
                }}
                className="mt-1 w-full px-2 py-1.5 text-sm font-mono rounded border bg-[color:var(--paper)] text-[color:var(--ink)] focus:outline-none focus:ring-1"
                style={{ borderColor: "var(--rule)" }}
              />
            </label>
          </div>
          <label className="block text-[10px] uppercase tracking-wider text-[color:var(--ink-muted)]">
            Purpose
            <textarea
              value={page.purpose}
              onChange={(e) => setField("purpose", e.target.value)}
              rows={2}
              className="mt-1 w-full px-2 py-1.5 text-[12px] rounded border bg-[color:var(--paper)] text-[color:var(--ink)] focus:outline-none focus:ring-1 resize-none"
              style={{ borderColor: "var(--rule)" }}
              placeholder="Why this page exists — drives the AI's tone + content choices."
            />
          </label>

          {/* Sections list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-[color:var(--ink-muted)]">
                Sections
              </span>
              <button
                type="button"
                onClick={addSection}
                className="text-[11px] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add section
              </button>
            </div>
            <div className="space-y-1.5">
              {page.sections.map((section, i) => (
                <div
                  key={i}
                  className="flex items-start gap-1.5 group"
                >
                  <GripVertical className="w-3.5 h-3.5 text-[color:var(--ink-muted)] mt-2 flex-shrink-0 opacity-30 group-hover:opacity-60" />
                  <select
                    value={section.category}
                    onChange={(e) =>
                      updateSection(i, { ...section, category: e.target.value as ComponentCategory })
                    }
                    className="px-1.5 py-1 text-[11px] rounded border bg-[color:var(--paper)] text-[color:var(--ink)] capitalize flex-shrink-0 focus:outline-none"
                    style={{ borderColor: "var(--rule)" }}
                  >
                    {SECTION_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{categoryIcon(c)} {c}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={section.brief}
                    onChange={(e) => updateSection(i, { ...section, brief: e.target.value })}
                    placeholder="What this section shows…"
                    className="flex-1 min-w-0 px-2 py-1 text-[11px] rounded border bg-[color:var(--paper)] text-[color:var(--ink)] focus:outline-none focus:ring-1"
                    style={{ borderColor: "var(--rule)" }}
                  />
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => moveSection(i, -1)}
                      disabled={i === 0}
                      className="p-1 rounded hover:bg-[color:var(--paper)] disabled:opacity-25 disabled:cursor-not-allowed text-[color:var(--ink-muted)]"
                      aria-label="Move section up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(i, 1)}
                      disabled={i === page.sections.length - 1}
                      className="p-1 rounded hover:bg-[color:var(--paper)] disabled:opacity-25 disabled:cursor-not-allowed text-[color:var(--ink-muted)]"
                      aria-label="Move section down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(i)}
                      className="p-1 rounded hover:bg-red-50 text-[color:var(--ink-muted)] hover:text-red-600"
                      aria-label="Delete section"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {page.sections.length === 0 && (
                <p className="text-[11px] text-[color:var(--ink-muted)] italic py-2">
                  No sections — add one or this page will be skipped at build time.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SitePlanPanel({
  plan: originalPlan,
  source,
  modelUsed,
  onApprove,
  onCancel,
  approveDisabled,
  approveDisabledReason,
}: SitePlanPanelProps) {
  // Local editable copy — Approve hands this back, Reset restores from
  // originalPlan, Cancel discards.
  const [editedPlan, setEditedPlan] = useState<SitePlan>(() => clonePlan(originalPlan));
  const [expandedSlug, setExpandedSlug] = useState<string | null>(originalPlan.pages[0]?.slug || null);

  // If the original plan changes (parent re-fetches), reset local state.
  useEffect(() => {
    setEditedPlan(clonePlan(originalPlan));
    setExpandedSlug(originalPlan.pages[0]?.slug || null);
  }, [originalPlan]);

  // Live-recompute meta from the edited page list so the estimate
  // strip + cost stays honest as the user adds/removes pages.
  const planWithMeta = useMemo<SitePlan>(
    () => ({ ...editedPlan, meta: recomputeMeta(editedPlan) }),
    [editedPlan],
  );

  const hasEdits = useMemo(
    () => JSON.stringify(editedPlan) !== JSON.stringify(originalPlan),
    [editedPlan, originalPlan],
  );

  const updateBrand = <K extends keyof SitePlan["brand"]>(field: K, value: SitePlan["brand"][K]) => {
    setEditedPlan((p) => ({ ...p, brand: { ...p.brand, [field]: value } }));
  };

  const updatePage = (index: number, next: SitePlanPage) => {
    setEditedPlan((p) => {
      const pages = [...p.pages];
      pages[index] = next;
      return { ...p, pages };
    });
  };

  const deletePage = (index: number) => {
    setEditedPlan((p) => ({ ...p, pages: p.pages.filter((_, i) => i !== index) }));
  };

  const movePage = (index: number, direction: -1 | 1) => {
    setEditedPlan((p) => {
      const j = index + direction;
      if (j < 0 || j >= p.pages.length) return p;
      const pages = [...p.pages];
      [pages[index], pages[j]] = [pages[j], pages[index]];
      return { ...p, pages };
    });
  };

  const addPage = () => {
    // Sensible default for a new page — name "Untitled", slug derived,
    // basic navbar + hero + footer scaffold so it's not empty.
    let n = 1;
    const taken = new Set(editedPlan.pages.map((p) => p.slug));
    let slug = `/page-${n}`;
    while (taken.has(slug)) {
      n++;
      slug = `/page-${n}`;
    }
    setEditedPlan((p) => ({
      ...p,
      pages: [
        ...p.pages,
        {
          slug,
          name: `Untitled ${n}`,
          purpose: "New page — describe its role on the site.",
          sections: [
            { category: "navbar", brief: "Shared navbar" },
            { category: "hero", brief: "Main headline + CTA" },
            { category: "footer", brief: "Shared footer" },
          ],
          isPublic: true,
          isAdmin: false,
        },
      ],
    }));
    setExpandedSlug(slug);
  };

  const reset = () => {
    if (hasEdits && !confirm("Discard your edits and restore the original AI plan?")) return;
    setEditedPlan(clonePlan(originalPlan));
  };

  const timeStr = planWithMeta.meta.estimatedTimeSeconds < 60
    ? `${planWithMeta.meta.estimatedTimeSeconds}s`
    : `${Math.ceil(planWithMeta.meta.estimatedTimeSeconds / 60)} min`;

  const validApproval = planWithMeta.pages.length > 0
    && planWithMeta.pages.every((p) => p.sections.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border bg-[color:var(--paper)] p-6 max-w-3xl w-full"
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
              {hasEdits && (
                <span className="ml-2 text-[10px] font-medium text-[color:var(--gold-deep)] uppercase tracking-wider">
                  edited
                </span>
              )}
            </h2>
            <p className="text-[11px] text-[color:var(--ink-muted)]">
              {source === "llm"
                ? `Planned by ${modelUsed || "Claude"} — edit anything below, then approve`
                : "Heuristic plan (LLM unavailable) — edit anything below, then approve"}
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

      {/* Brand summary — name + theme inline-editable, primary color
          stays read-only for now (color picker is Phase 5). */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="rounded-lg border p-3" style={{ borderColor: "var(--rule)" }}>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-muted)] mb-1">
            Brand
          </div>
          <input
            type="text"
            value={editedPlan.brand.name}
            onChange={(e) => updateBrand("name", e.target.value)}
            className="text-sm font-semibold text-[color:var(--ink)] bg-transparent border-0 p-0 w-full focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
          />
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: "var(--rule)" }}>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-muted)] mb-1">
            Theme
          </div>
          <select
            value={editedPlan.brand.theme}
            onChange={(e) => updateBrand("theme", e.target.value as SitePlan["brand"]["theme"])}
            className="text-sm font-semibold text-[color:var(--ink)] bg-transparent border-0 p-0 w-full capitalize focus:outline-none"
          >
            <option value="editorial">editorial</option>
            <option value="light">light</option>
            <option value="warm">warm</option>
            <option value="dark">dark</option>
          </select>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: "var(--rule)" }}>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-muted)] mb-1">
            Primary
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={editedPlan.brand.primaryColor}
              onChange={(e) => updateBrand("primaryColor", e.target.value)}
              className="w-5 h-5 rounded-full border-0 cursor-pointer p-0"
              style={{ background: "transparent" }}
              aria-label="Primary color"
            />
            <span className="text-xs font-mono text-[color:var(--ink)]">{editedPlan.brand.primaryColor}</span>
          </div>
        </div>
        <div className="rounded-lg border p-3" style={{ borderColor: "var(--rule)" }}>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-muted)] mb-1">
            Voice
          </div>
          <input
            type="text"
            value={editedPlan.brand.voice}
            onChange={(e) => updateBrand("voice", e.target.value)}
            className="text-[11px] text-[color:var(--ink)] bg-transparent border-0 p-0 w-full focus:outline-none focus:ring-1 focus:ring-[color:var(--gold)]"
          />
        </div>
      </div>

      {/* Sitemap */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[color:var(--ink-muted)]" />
            <h3 className="text-[12px] uppercase tracking-wider font-semibold text-[color:var(--ink-secondary)]">
              Sitemap — {planWithMeta.pages.length} {planWithMeta.pages.length === 1 ? "page" : "pages"}
            </h3>
          </div>
          <button
            type="button"
            onClick={addPage}
            className="text-[11px] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add page
          </button>
        </div>
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {editedPlan.pages.map((page, i) => (
            <PageCard
              key={page.slug + i}
              page={page}
              index={i}
              isFirst={i === 0}
              isLast={i === editedPlan.pages.length - 1}
              expanded={expandedSlug === page.slug}
              onToggle={() =>
                setExpandedSlug(expandedSlug === page.slug ? null : page.slug)
              }
              onChange={(next) => updatePage(i, next)}
              onDelete={() => deletePage(i)}
              onMove={(direction) => movePage(i, direction)}
            />
          ))}
          {editedPlan.pages.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-[12px] text-[color:var(--ink-muted)]" style={{ borderColor: "var(--rule)" }}>
              All pages removed. Add at least one before approving.
            </div>
          )}
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
            <span className="font-mono text-[11px]">{editedPlan.shared.navbarVariant}</span>
          </div>
          <div>
            <span className="text-[color:var(--ink-muted)]">Footer:</span>{" "}
            <span className="font-mono text-[11px]">{editedPlan.shared.footerVariant}</span>
          </div>
        </div>
      </div>

      {/* Backend needs */}
      {(editedPlan.backend.needsAuth || editedPlan.backend.needsDatabase || editedPlan.backend.needsStorage) && (
        <div className="mb-5 rounded-lg border p-3" style={{ borderColor: "var(--rule)" }}>
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[color:var(--ink-secondary)] mb-2">
            Backend (auto-provisioned)
          </div>
          <div className="flex flex-wrap gap-2 text-[12px]">
            {editedPlan.backend.needsAuth && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[color:var(--gold-soft)] text-[color:var(--gold-deep)]">
                <Shield className="w-3 h-3" />
                Auth
                {editedPlan.backend.authProviders && editedPlan.backend.authProviders.length > 0 && (
                  <span className="text-[10px] opacity-70">
                    ({editedPlan.backend.authProviders.join(", ")})
                  </span>
                )}
              </span>
            )}
            {editedPlan.backend.needsDatabase && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[color:var(--gold-soft)] text-[color:var(--gold-deep)]">
                <Database className="w-3 h-3" />
                Database
                {editedPlan.backend.tables && editedPlan.backend.tables.length > 0 && (
                  <span className="text-[10px] opacity-70">
                    ({editedPlan.backend.tables.length} tables)
                  </span>
                )}
              </span>
            )}
            {editedPlan.backend.needsStorage && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[color:var(--gold-soft)] text-[color:var(--gold-deep)]">
                <HardDrive className="w-3 h-3" />
                Storage
              </span>
            )}
          </div>
        </div>
      )}

      {/* Estimate strip — live recomputed */}
      <div className="flex items-center justify-between mb-5 px-4 py-3 rounded-lg bg-[color:var(--paper-elevated)] border" style={{ borderColor: "var(--rule)" }}>
        <div className="flex items-center gap-4 text-[12px]">
          <div className="flex items-center gap-1.5 text-[color:var(--ink)]">
            <Clock className="w-3.5 h-3.5 text-[color:var(--ink-muted)]" />
            <span className="font-semibold">~{timeStr}</span>
            <span className="text-[color:var(--ink-muted)]">build time</span>
          </div>
          <div className="flex items-center gap-1.5 text-[color:var(--ink)]">
            <DollarSign className="w-3.5 h-3.5 text-[color:var(--ink-muted)]" />
            <span className="font-semibold">${planWithMeta.meta.estimatedCostUsd.toFixed(2)}</span>
            <span className="text-[color:var(--ink-muted)]">estimated cost</span>
          </div>
          <div className="text-[color:var(--ink-muted)]">
            {planWithMeta.meta.componentCount} components across {planWithMeta.meta.pageCount} pages
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-[12px] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] transition"
          >
            Cancel
          </button>
          {hasEdits && (
            <button
              type="button"
              onClick={reset}
              className="text-[12px] text-[color:var(--ink-muted)] hover:text-[color:var(--ink)] transition flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset to AI plan
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {approveDisabled && approveDisabledReason && (
            <span className="text-[11px] text-[color:var(--ink-muted)]">
              {approveDisabledReason}
            </span>
          )}
          {!validApproval && (
            <span className="text-[11px] text-red-600">
              {editedPlan.pages.length === 0
                ? "Add a page first"
                : "Every page needs at least one section"}
            </span>
          )}
          <button
            type="button"
            onClick={() => onApprove(planWithMeta)}
            disabled={approveDisabled || !validApproval}
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
