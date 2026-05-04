"use client";

/**
 * Honest disclosure banner for pages that ship with example data while the
 * underlying account has no real records yet. Replaces the previous pattern
 * of rendering mock cards as if they were live, which made the page feel
 * dishonest the moment a user realised the "data" never changed.
 *
 * Pattern:
 *   <DemoDataBanner
 *     entity="invoices"
 *     ctaHref="/invoicing/new"
 *     ctaLabel="Create your first invoice"
 *   />
 *
 * The banner is intentionally restrained — single hairline border, near-ink
 * text, gold accent — so it reads as a friendly note rather than an error.
 */

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface DemoDataBannerProps {
  /** Plural noun for what the page lists ("invoices", "campaigns", "deals") */
  entity: string;
  /** Optional href that opens the create-flow for this entity */
  ctaHref?: string;
  /** Optional CTA label */
  ctaLabel?: string;
}

export default function DemoDataBanner({ entity, ctaHref, ctaLabel }: DemoDataBannerProps) {
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3 rounded-xl mb-6"
      style={{
        background: "var(--paper-elevated)",
        border: "1px solid var(--rule)",
        color: "var(--ink-secondary)",
      }}
    >
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0"
        style={{ background: "var(--gold-soft)", color: "var(--gold-deep)" }}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="text-[13px] leading-snug flex-1">
        <span className="font-semibold" style={{ color: "var(--ink)" }}>
          You haven&apos;t created any {entity} yet.
        </span>{" "}
        The cards below show the layout — your real {entity} appear here as
        soon as you add the first one.
      </div>
      {ctaHref && (
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all"
          style={{
            background: "var(--ink)",
            color: "var(--paper)",
          }}
        >
          {ctaLabel ?? `Create your first ${entity.replace(/s$/, "")}`}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
