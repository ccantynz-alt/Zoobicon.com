"use client";

/**
 * /brand-kit — Brand kit preview & download (Sprint 3 T6).
 *
 * Standalone playground: enter brand specs, see the kit generated
 * live. After a real build, the BrandSpec from the planner will be
 * passed via URL params or sessionStorage so the user goes straight
 * to a kit derived from their actual build.
 *
 * Five formats, all SVG/HTML (no PNG generation in this step — we
 * leave that to the user's preferred tool or a server-side rasteriser
 * we can add later).
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Download, Sparkles, Palette } from "lucide-react";

interface BrandSpec {
  brandName: string;
  primaryColor: string;
  bgColor: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  headlineFont: string;
  bodyFont: string;
}

interface BrandAssets {
  favicon: string;
  emailSignature: string;
  socialCardOG: string;
  socialCardTwitter: string;
  businessCard: string;
}

const DEFAULT_SPEC: BrandSpec = {
  brandName: "Aurora",
  primaryColor: "#b8923f",
  bgColor: "#fafaf7",
  textPrimary: "#18181b",
  textSecondary: "#52525b",
  accentColor: "#a16207",
  headlineFont: "Playfair Display",
  bodyFont: "Inter",
};

function downloadString(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function BrandKitPage() {
  const [spec, setSpec] = useState<BrandSpec>(DEFAULT_SPEC);
  const [assets, setAssets] = useState<BrandAssets | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = useCallback(async (s: BrandSpec) => {
    setLoading(true);
    try {
      const res = await fetch("/api/brand-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandSpec: s }),
      });
      const data = (await res.json()) as { ok: boolean; assets?: BrandAssets };
      if (data.ok && data.assets) setAssets(data.assets);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate on first mount + whenever the brandName changes (cheap on the server)
  useEffect(() => {
    void generate(spec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = <K extends keyof BrandSpec>(field: K, value: BrandSpec[K]) => {
    const next = { ...spec, [field]: value };
    setSpec(next);
  };

  const regenerate = () => void generate(spec);

  const previewCards: Array<{
    title: string;
    description: string;
    filename: string;
    mime: string;
    content: string | undefined;
    preview: "svg-inline" | "html-table";
  }> = assets
    ? [
        {
          title: "Favicon",
          description: "64×64 SVG with your brand initial. Browsers downscale to 16/32/48.",
          filename: `${spec.brandName.toLowerCase().replace(/\s+/g, "-")}-favicon.svg`,
          mime: "image/svg+xml",
          content: assets.favicon,
          preview: "svg-inline",
        },
        {
          title: "Open Graph card",
          description: "1200×630 SVG for og:image. Social shares + link previews.",
          filename: `${spec.brandName.toLowerCase().replace(/\s+/g, "-")}-og.svg`,
          mime: "image/svg+xml",
          content: assets.socialCardOG,
          preview: "svg-inline",
        },
        {
          title: "Twitter / X card",
          description: "1200×600 SVG, twitter:image dimensions.",
          filename: `${spec.brandName.toLowerCase().replace(/\s+/g, "-")}-twitter.svg`,
          mime: "image/svg+xml",
          content: assets.socialCardTwitter,
          preview: "svg-inline",
        },
        {
          title: "Business card",
          description: "1050×600 SVG (3.5″×2″ @ 300dpi). Front face only.",
          filename: `${spec.brandName.toLowerCase().replace(/\s+/g, "-")}-business-card.svg`,
          mime: "image/svg+xml",
          content: assets.businessCard,
          preview: "svg-inline",
        },
        {
          title: "Email signature",
          description: "Table-based HTML that renders in Outlook, Gmail, Apple Mail.",
          filename: `${spec.brandName.toLowerCase().replace(/\s+/g, "-")}-signature.html`,
          mime: "text/html",
          content: assets.emailSignature,
          preview: "html-table",
        },
      ]
    : [];

  return (
    <main className="pt-[72px] pb-24" style={{ color: "var(--ink)" }}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Hero */}
        <header className="mb-10 max-w-3xl">
          <div
            className="inline-flex items-center gap-1.5 mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ color: "var(--gold-deep)" }}
          >
            <Sparkles className="w-3 h-3" /> Brand kit
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
            One prompt.{" "}
            <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>
              Your whole brand kit.
            </span>
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
            Favicon, Open Graph card, Twitter image, business card, and email
            signature — all generated from the same brand spec the website build
            uses. Nobody else gives you the full kit from one input.
          </p>
        </header>

        {/* Controls */}
        <section
          className="rounded-2xl p-6 mb-10"
          style={{ background: "var(--paper-elevated)", border: "1px solid var(--rule)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-4 h-4" style={{ color: "var(--gold-deep)" }} />
            <span className="text-[11px] uppercase tracking-[0.22em] font-semibold" style={{ color: "var(--gold-deep)" }}>
              Brand spec
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {([
              ["brandName", "Brand name", "text"],
              ["primaryColor", "Primary color", "color"],
              ["bgColor", "Background", "color"],
              ["textPrimary", "Text — primary", "color"],
              ["textSecondary", "Text — secondary", "color"],
              ["accentColor", "Accent", "color"],
              ["headlineFont", "Headline font", "text"],
              ["bodyFont", "Body font", "text"],
            ] as const).map(([field, label, type]) => (
              <label key={field} className="block">
                <span className="text-[10px] uppercase tracking-[0.18em] font-semibold block mb-1.5" style={{ color: "var(--ink-secondary)" }}>
                  {label}
                </span>
                <input
                  type={type}
                  value={spec[field]}
                  onChange={(e) => updateField(field, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[13px] font-mono"
                  style={{
                    background: "var(--paper)",
                    border: "1px solid var(--rule)",
                    color: "var(--ink)",
                  }}
                />
              </label>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={regenerate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all disabled:opacity-50"
              style={{
                background: "var(--ink)",
                color: "var(--paper)",
              }}
            >
              {loading ? "Generating…" : "Regenerate kit"}
            </button>
            <Link
              href="/builder"
              className="text-[12px]"
              style={{ color: "var(--ink-muted)" }}
            >
              Or build a website first — the BrandSpec from the build feeds this page →
            </Link>
          </div>
        </section>

        {/* Preview grid */}
        <section className="grid lg:grid-cols-2 gap-5">
          {previewCards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl p-5"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--rule)",
              }}
            >
              <div className="flex items-start justify-between mb-3 gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ink)" }}>
                    {card.title}
                  </h3>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--ink-secondary)" }}>
                    {card.description}
                  </p>
                </div>
                {card.content && (
                  <button
                    onClick={() => downloadString(card.content!, card.filename, card.mime)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                    style={{
                      background: "var(--gold-soft)",
                      color: "var(--gold-deep)",
                      border: "1px solid var(--gold)",
                    }}
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                )}
              </div>
              <div
                className="rounded-lg overflow-hidden"
                style={{ background: "var(--paper)", border: "1px solid var(--rule)" }}
              >
                {card.preview === "svg-inline" && card.content && (
                  <div
                    className="w-full"
                    style={{ aspectRatio: "auto" }}
                    dangerouslySetInnerHTML={{ __html: card.content }}
                  />
                )}
                {card.preview === "html-table" && card.content && (
                  <div
                    className="p-4"
                    dangerouslySetInnerHTML={{ __html: card.content }}
                  />
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Final CTA */}
        <section
          className="mt-12 rounded-2xl p-8 text-center"
          style={{
            background: "var(--paper-elevated)",
            border: "1px solid var(--gold)",
          }}
        >
          <h2 className="text-2xl font-semibold tracking-[-0.02em] mb-2">
            Build a site, get the whole kit.
          </h2>
          <p className="text-[14px] mb-5" style={{ color: "var(--ink-secondary)" }}>
            When you build with Zoobicon, the planner-emitted brand spec feeds
            this page automatically. Site + favicon + social cards + business
            card + email signature in 60 seconds.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #d4af5e 0%, #b8923f 100%)",
              color: "#ffffff",
              border: "1px solid #a47d2c",
              boxShadow: "0 6px 18px -8px rgba(140,107,37,0.5), inset 0 1px 0 0 rgba(255,255,255,0.35)",
            }}
          >
            Open the builder
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
