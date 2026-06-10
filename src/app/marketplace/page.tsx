"use client";

/**
 * /marketplace — the Crontech add-on catalog, surfaced inside Zoobicon.
 *
 * Rule 34 phase 2: "once Zoobicon is connected via API the customer
 * can go shopping and add anything from the Crontech website." The
 * customer never leaves zoobicon.com — they browse Crontech add-ons
 * here, click "Add to my plan", check out via Stripe, and the add-on
 * provisions through Crontech's API on success.
 *
 * Pricing in the stub catalog is provisional pending Crontech's final
 * pricing model. The provisional banner makes that honest.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Globe2,
  Server,
  Mail,
  Shield,
  Zap,
  Database,
  Archive,
  BarChart3,
  Sparkles,
  AlertCircle,
  Check,
  Tag,
} from "lucide-react";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type AddOn,
  type AddOnCategory,
  type Catalog,
  formatPrice,
} from "@/lib/crontech-catalog";

const CATEGORY_ICONS: Record<AddOnCategory, typeof Globe2> = {
  domains: Globe2,
  hosting: Server,
  email: Mail,
  security: Shield,
  cdn: Zap,
  storage: Database,
  backups: Archive,
  analytics: BarChart3,
};

export default function MarketplacePage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<AddOnCategory | "all">("all");
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/crontech/catalog", { cache: "no-store" })
      .then((r) => r.json() as Promise<Catalog>)
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch(() => {
        if (!cancelled) setCatalog(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startCheckout = async (addOnId: string) => {
    setCheckingOut(addOnId);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/crontech/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addOnId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Couldn't start checkout");
      }
      window.location.href = data.url;
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed");
      setCheckingOut(null);
    }
  };

  const filtered = catalog?.addOns.filter(
    (a) => activeCategory === "all" || a.category === activeCategory
  );

  // Group by category for the rendered grid (when "all" is active)
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    addOns: (filtered || []).filter((a) => a.category === cat),
  })).filter((g) => g.addOns.length > 0);

  return (
    <main className="pt-[72px] pb-24" style={{ color: "var(--ink)" }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Hero */}
        <header className="mb-10 max-w-3xl">
          <div
            className="inline-flex items-center gap-1.5 mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ color: "var(--gold-deep)" }}
          >
            <Tag className="w-3 h-3" /> Marketplace
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
            Everything you need to scale,{" "}
            <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>
              one click away.
            </span>
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
            Extra domains, premium hosting tiers, more mailboxes, wildcard SSL, dedicated CDN
            regions, backups — every add-on provisions through Crontech&apos;s API on payment success.
            One bill, one dashboard, never leave Zoobicon.
          </p>
        </header>

        {/* Provisional pricing banner */}
        {catalog?.pricingProvisional && (
          <div
            className="mb-6 flex items-start gap-3 rounded-xl px-5 py-4"
            style={{
              background: "var(--gold-soft)",
              border: "1px solid var(--gold)",
              color: "var(--ink)",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--gold-deep)" }} />
            <div>
              <div className="text-[13px] font-semibold mb-0.5">Preview pricing — Crontech final pricing pending</div>
              <p className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>
                The prices below are Zoobicon&apos;s best-guess placeholders. Final pricing comes from
                Crontech&apos;s catalog API the moment it ships; the marketplace updates automatically with
                no code change needed.
              </p>
            </div>
          </div>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setActiveCategory("all")}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors"
            style={{
              background: activeCategory === "all" ? "var(--ink)" : "transparent",
              color: activeCategory === "all" ? "var(--paper)" : "var(--ink-secondary)",
              border: `1px solid ${activeCategory === "all" ? "var(--ink)" : "var(--rule)"}`,
            }}
          >
            All
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const Icon = CATEGORY_ICONS[cat];
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors"
                style={{
                  background: active ? "var(--ink)" : "transparent",
                  color: active ? "var(--paper)" : "var(--ink-secondary)",
                  border: `1px solid ${active ? "var(--ink)" : "var(--rule)"}`,
                }}
              >
                <Icon className="w-3 h-3" />
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>

        {/* Checkout error */}
        {checkoutError && (
          <div
            className="mb-6 flex items-center gap-2 rounded-xl px-4 py-3 text-[13px]"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "var(--ink)",
            }}
          >
            <AlertCircle className="w-4 h-4" style={{ color: "rgb(220, 38, 38)" }} />
            {checkoutError}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-[14px]" style={{ color: "var(--ink-muted)" }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Loading catalog…
          </div>
        )}

        {/* Catalog grid */}
        {!loading && grouped.length > 0 && (
          <div className="space-y-12">
            {grouped.map((group) => {
              const Icon = CATEGORY_ICONS[group.category];
              return (
                <section key={group.category}>
                  <h2 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] font-semibold mb-5" style={{ color: "var(--gold-deep)" }}>
                    <Icon className="w-3.5 h-3.5" />
                    {CATEGORY_LABELS[group.category]}
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.addOns.map((addOn) => (
                      <AddOnCard
                        key={addOn.id}
                        addOn={addOn}
                        loading={checkingOut === addOn.id}
                        onAdd={() => void startCheckout(addOn.id)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {!loading && (!catalog || catalog.addOns.length === 0) && (
          <div
            className="rounded-xl p-8 text-center text-[14px]"
            style={{
              background: "var(--paper-elevated)",
              border: "1px solid var(--rule)",
              color: "var(--ink-secondary)",
            }}
          >
            Couldn&apos;t load the catalog right now. Try refreshing.
          </div>
        )}

        {/* How it works */}
        <section className="mt-20">
          <h2 className="text-[11px] uppercase tracking-[0.22em] font-semibold mb-5" style={{ color: "var(--gold-deep)" }}>
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                title: "Pick an add-on",
                body: "Browse the Crontech catalog from inside Zoobicon. One bill, one dashboard.",
              },
              {
                step: "02",
                title: "Pay through Stripe",
                body: "Standard Stripe checkout. Card, Apple Pay, Google Pay. Same Zoobicon receipt as your subscription.",
              },
              {
                step: "03",
                title: "Crontech provisions",
                body: "On payment success, Zoobicon calls Crontech&apos;s API. The add-on activates within seconds — no second login.",
              },
            ].map((c) => (
              <div
                key={c.step}
                className="rounded-xl p-5"
                style={{
                  background: "var(--paper-elevated)",
                  border: "1px solid var(--rule)",
                }}
              >
                <div className="text-[10px] uppercase tracking-[0.22em] font-semibold mb-2" style={{ color: "var(--gold-deep)" }}>
                  Step {c.step}
                </div>
                <h3 className="text-[15px] font-semibold mb-2 tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                  {c.title}
                </h3>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                  {c.body.replace(/&apos;/g, "'")}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Back to builder */}
        <div className="mt-12 text-center">
          <Link
            href="/builder"
            className="text-[13px] underline"
            style={{ color: "var(--ink-muted)" }}
          >
            ← Back to the builder
          </Link>
        </div>
      </div>
    </main>
  );
}

interface AddOnCardProps {
  addOn: AddOn;
  loading: boolean;
  onAdd: () => void;
}

function AddOnCard({ addOn, loading, onAdd }: AddOnCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col"
      style={{
        background: "var(--paper-elevated)",
        border: addOn.featured ? "1px solid var(--gold)" : "1px solid var(--rule)",
      }}
    >
      {addOn.featured && (
        <div
          className="inline-flex self-start items-center gap-1 mb-3 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
          style={{
            background: "var(--gold-soft)",
            color: "var(--gold-deep)",
            border: "1px solid var(--gold)",
          }}
        >
          <Sparkles className="w-2.5 h-2.5" />
          Featured
        </div>
      )}
      <h3 className="text-[16px] font-semibold tracking-[-0.01em] mb-1.5" style={{ color: "var(--ink)" }}>
        {addOn.name}
      </h3>
      <p className="text-[12px] leading-snug mb-3" style={{ color: "var(--ink-secondary)" }}>
        {addOn.tagline}
      </p>
      {addOn.capacity && (
        <div className="text-[10px] font-mono mb-3" style={{ color: "var(--gold-deep)" }}>
          {addOn.capacity}
        </div>
      )}
      <ul className="space-y-1.5 mb-5">
        {addOn.features.map((f) => (
          <li key={f} className="flex gap-2 text-[12px]" style={{ color: "var(--ink-secondary)" }}>
            <Check className="w-3 h-3 flex-shrink-0 mt-1" style={{ color: "var(--gold-deep)" }} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {addOn.prerequisites && addOn.prerequisites.length > 0 && (
        <div className="text-[10px] mb-3" style={{ color: "var(--ink-muted)" }}>
          Requires: {addOn.prerequisites.join(" · ")}
        </div>
      )}
      <div className="mt-auto flex items-center justify-between gap-3">
        <div>
          <div className="text-[18px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
            {formatPrice(addOn)}
          </div>
        </div>
        <button
          onClick={onAdd}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #ef5440 0%, #e8402b 100%)",
            color: "#ffffff",
            border: "1px solid #a47d2c",
            boxShadow: "0 4px 12px -4px rgba(194,51,31,0.4), inset 0 1px 0 0 rgba(255,255,255,0.25)",
          }}
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
          Add to my plan
        </button>
      </div>
    </div>
  );
}
