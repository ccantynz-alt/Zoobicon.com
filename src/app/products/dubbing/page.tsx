"use client";

/**
 * /products/dubbing — One-click multi-language video dub.
 *
 * Editorial-light palette only. SiteNavigation + SiteFooter come from the
 * root layout, so this page only renders content sections.
 */

import Link from "next/link";
import {
  Globe,
  Sparkles,
  Zap,
  DollarSign,
  Languages,
  Mic,
  Wand2,
  Check,
  ArrowRight,
} from "lucide-react";
import { DUB_LANGUAGES } from "@/components/DubPanel";

const TRUST_CARDS = [
  {
    icon: Zap,
    title: "Under 60 seconds",
    stat: "8 languages, parallel",
    desc: "Translate, voice, and re-lip-sync eight languages at once. The whole batch finishes before HeyGen's queue assigns you a slot.",
  },
  {
    icon: DollarSign,
    title: "Cents per dub",
    stat: "vs $29-149/mo HeyGen",
    desc: "Fish Audio S1 charges $15/M characters — about $0.0015 per 30-second script. Re-lip-sync via Hedra Character-3 is $0.05/min.",
  },
  {
    icon: Languages,
    title: "50+ languages",
    stat: "Native voice, every locale",
    desc: "Mexican Spanish, Brazilian Portuguese, Traditional Chinese, MSA Arabic, Hindi, Filipino, Swahili — broadcast register, native speakers.",
  },
];

const PIPELINE_STEPS = [
  {
    step: "01",
    title: "Translate",
    desc: "Claude Haiku rewrites your script into the target language with broadcast-natural cadence. Brand names, product names, and URLs are preserved verbatim.",
  },
  {
    step: "02",
    title: "Voice",
    desc: "Fish Audio S1 — the new #1 TTS on TTS-Arena2 — generates the dubbed voice in the target language. 48 emotion tags, 5 tone tags, native pronunciation.",
  },
  {
    step: "03",
    title: "Lip-sync",
    desc: "Hedra Character-3 re-animates the avatar so the lips match the new audio. Sub-100ms latency, falls back to SadTalker / Wav2Lip if needed.",
  },
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "/forever",
    quota: "1 dub batch / month",
    features: [
      "Up to 3 languages per batch",
      "Up to 60 seconds per source video",
      "Watermark on output",
      "Powered by Fish Audio S1 + Hedra Character-3",
    ],
    cta: "Start free",
    href: "/auth/signup",
    highlighted: false,
  },
  {
    name: "Creator",
    price: "$19",
    cadence: "/month",
    quota: "50 dub batches / month",
    features: [
      "Up to 8 languages per batch",
      "Up to 5 minutes per source video",
      "No watermark",
      "Priority queue",
      "Powered by Fish Audio S1 + Hedra Character-3",
    ],
    cta: "Go Creator",
    href: "/pricing",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$49",
    cadence: "/month",
    quota: "500 dub batches / month",
    features: [
      "Up to 12 languages per batch",
      "Up to 10 minutes per source video",
      "Voice-clone the source narrator",
      "No watermark",
      "Dedicated capacity + API access",
      "Powered by Fish Audio S1 + Hedra Character-3",
    ],
    cta: "Go Pro",
    href: "/pricing",
    highlighted: false,
  },
];

const FAQS = [
  {
    q: "What's the difference between this and HeyGen Translate?",
    a: "Same outcome — different economics. HeyGen ships translation across 175 languages from $29-149/mo. We use Fish Audio S1 (50+ languages, native voice) + Hedra Character-3 (lip-sync) under the hood and charge cents per dub. The pipeline runs in parallel across all your selected languages, so 8 dubs finish in under 60 seconds, not 8× a one-language wait.",
  },
  {
    q: "Will the dub keep my brand voice?",
    a: "By default each language uses a high-quality Fish Audio S1 voice. With voice-cloning enabled (Pro tier) we clone the narrator from your source audio and reuse that voice across every dubbed language — same person, fluent in 50+ languages.",
  },
  {
    q: "How natural is the lip-sync?",
    a: "Hedra Character-3 is the current best-in-class real-time avatar engine. It re-animates the mouth to match the new audio without re-rendering the whole frame. Falls back to SadTalker → Video-ReTalking → Wav2Lip if Hedra is rate-limited, so the batch never stalls on a single failure.",
  },
  {
    q: "Can I bring my own video?",
    a: "Yes. Render a spokesperson on Zoobicon, then click 'Dub into other languages' on the storyboard page. We accept any rendered video URL or avatar still + script combination.",
  },
  {
    q: "Does it support regional variants?",
    a: "Yes — Mexican Spanish (es-mx), Brazilian Portuguese (pt-br), Traditional Chinese (zh-tw), MSA Arabic, plus 38 other locales. Every code maps to a native voice, not a regional approximation.",
  },
];

const REGIONS: Array<"European" | "Asian" | "Latin American" | "Middle Eastern" | "African"> = [
  "European",
  "Asian",
  "Latin American",
  "Middle Eastern",
  "African",
];

export default function DubbingPage() {
  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      {/* ───────── HERO ───────── */}
      <section className="px-6 pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-6xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs uppercase tracking-[0.18em]"
            style={{
              background: "var(--gold-soft, rgba(201,169,97,0.12))",
              border: "1px solid var(--rule)",
              color: "var(--gold-deep)",
              borderRadius: 999,
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            New — One-click video dub
          </div>

          <h1
            className="display-italic text-[3rem] sm:text-[4.5rem] lg:text-[6.5rem] leading-[0.95] tracking-tight"
            style={{ color: "var(--ink)" }}
          >
            Same script.
            <br />
            <span style={{ color: "var(--gold-deep)" }}>Fifty languages.</span>
            <br />
            One button.
          </h1>

          <p
            className="mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed"
            style={{ color: "var(--ink-secondary)" }}
          >
            Translate any spokesperson video into 50+ languages with native voice
            and lip-synced delivery. HeyGen sells this for $29-149/month. We do
            it for cents — and finish 8 languages in under 60 seconds.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/video-creator/storyboard"
              className="group inline-flex items-center gap-2 px-7 py-4 text-sm uppercase tracking-[0.18em] font-medium transition-all"
              style={{
                background: "var(--ink)",
                color: "var(--paper)",
                border: "1px solid var(--ink)",
                borderRadius: 4,
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
              }}
            >
              <Wand2 className="w-4 h-4" />
              Try the dub panel
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 px-7 py-4 text-sm uppercase tracking-[0.18em] font-medium transition-all"
              style={{
                background: "transparent",
                color: "var(--ink)",
                border: "1px solid var(--rule-strong, var(--rule))",
                borderRadius: 4,
                fontFamily: "JetBrains Mono, ui-monospace, monospace",
              }}
            >
              Pricing
            </Link>
          </div>

          <div className="mt-20 h-px w-full" style={{ background: "var(--rule)" }} />
        </div>
      </section>

      {/* ───────── TRUST STRIP ───────── */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-px" style={{ background: "var(--rule)" }}>
          {TRUST_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="p-8"
                style={{ background: "var(--paper)" }}
              >
                <Icon className="w-7 h-7 mb-5" style={{ color: "var(--gold-deep)" }} />
                <div
                  className="text-[10px] uppercase tracking-[0.2em] mb-2"
                  style={{
                    color: "var(--ink-muted)",
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                  }}
                >
                  {card.stat}
                </div>
                <h3
                  className="text-2xl mb-3"
                  style={{
                    color: "var(--ink)",
                    fontFamily: "Playfair Display, Fraunces, serif",
                    fontStyle: "italic",
                  }}
                >
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ───────── PIPELINE ───────── */}
      <section
        className="px-6 py-24"
        style={{ background: "var(--paper-elevated)" }}
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className="display-italic text-[2.5rem] sm:text-[3.5rem] leading-[0.95] tracking-tight mb-4"
            style={{ color: "var(--ink)" }}
          >
            Three stages, all parallel.
          </h2>
          <p className="text-lg max-w-2xl mb-16" style={{ color: "var(--ink-secondary)" }}>
            Every selected language runs through the pipeline at the same time.
            The total wall-clock is whatever the slowest language takes — not the
            sum of all eight.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PIPELINE_STEPS.map((s) => (
              <div
                key={s.step}
                className="p-8 rounded-xl"
                style={{
                  background: "var(--paper)",
                  border: "1px solid var(--rule)",
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-[0.2em] mb-4"
                  style={{
                    color: "var(--gold-deep)",
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                  }}
                >
                  Stage {s.step}
                </div>
                <h3
                  className="text-3xl mb-4"
                  style={{
                    color: "var(--ink)",
                    fontFamily: "Playfair Display, Fraunces, serif",
                    fontStyle: "italic",
                  }}
                >
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── LANGUAGES BY REGION ───────── */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <h2
            className="display-italic text-[2.5rem] sm:text-[3.5rem] leading-[0.95] tracking-tight mb-4"
            style={{ color: "var(--ink)" }}
          >
            Every locale, native voice.
          </h2>
          <p className="text-lg max-w-2xl mb-16" style={{ color: "var(--ink-secondary)" }}>
            {DUB_LANGUAGES.length} languages and regional variants supported.
            Mexican Spanish is not the same as Castilian Spanish — and our voice
            knows the difference.
          </p>

          <div className="space-y-10">
            {REGIONS.map((region) => {
              const langs = DUB_LANGUAGES.filter((l) => l.region === region);
              return (
                <div key={region}>
                  <h3
                    className="text-[11px] uppercase tracking-[0.22em] mb-4"
                    style={{
                      color: "var(--ink-muted)",
                      fontFamily: "JetBrains Mono, ui-monospace, monospace",
                    }}
                  >
                    {region} · {langs.length}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {langs.map((l) => (
                      <div
                        key={l.code}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg"
                        style={{
                          background: "var(--paper-elevated)",
                          border: "1px solid var(--rule)",
                        }}
                      >
                        <span className="text-2xl leading-none">{l.flag}</span>
                        <div className="min-w-0">
                          <div
                            className="text-sm font-medium truncate"
                            style={{ color: "var(--ink)" }}
                          >
                            {l.name}
                          </div>
                          <div
                            className="text-[11px] truncate"
                            style={{ color: "var(--ink-muted)" }}
                          >
                            {l.nativeName}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────── PRICING ───────── */}
      <section
        id="pricing"
        className="px-6 py-24"
        style={{ background: "var(--paper-elevated)" }}
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className="display-italic text-[2.5rem] sm:text-[3.5rem] leading-[0.95] tracking-tight mb-4"
            style={{ color: "var(--ink)" }}
          >
            Pricing.
          </h2>
          <p className="text-lg max-w-2xl mb-16" style={{ color: "var(--ink-secondary)" }}>
            Free to try. Honest pricing. No per-language surcharges, no per-minute
            gotchas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className="p-8 rounded-xl flex flex-col"
                style={{
                  background: tier.highlighted ? "var(--ink)" : "var(--paper)",
                  border: `1px solid ${
                    tier.highlighted ? "var(--gold)" : "var(--rule)"
                  }`,
                  color: tier.highlighted ? "var(--paper)" : "var(--ink)",
                  boxShadow: tier.highlighted ? "0 24px 48px -24px rgba(10,10,11,0.35)" : "none",
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-[0.22em] mb-4"
                  style={{
                    color: tier.highlighted ? "var(--gold)" : "var(--gold-deep)",
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                  }}
                >
                  {tier.name}
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span
                    className="text-5xl"
                    style={{
                      fontFamily: "Playfair Display, Fraunces, serif",
                      fontStyle: "italic",
                    }}
                  >
                    {tier.price}
                  </span>
                  <span
                    className="text-sm"
                    style={{
                      color: tier.highlighted ? "var(--gold)" : "var(--ink-muted)",
                    }}
                  >
                    {tier.cadence}
                  </span>
                </div>
                <div
                  className="text-sm mb-6"
                  style={{
                    color: tier.highlighted ? "var(--gold)" : "var(--ink-secondary)",
                  }}
                >
                  {tier.quota}
                </div>
                <ul className="flex-1 space-y-3 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{
                          color: tier.highlighted ? "var(--gold)" : "var(--gold-deep)",
                        }}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={tier.href}
                  className="inline-flex items-center justify-center gap-2 w-full py-3 text-sm uppercase tracking-[0.18em] transition-all"
                  style={{
                    background: tier.highlighted ? "var(--gold)" : "var(--ink)",
                    color: tier.highlighted ? "var(--ink)" : "var(--paper)",
                    border: "1px solid",
                    borderColor: tier.highlighted ? "var(--gold)" : "var(--ink)",
                    borderRadius: 4,
                    fontFamily: "JetBrains Mono, ui-monospace, monospace",
                  }}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <h2
            className="display-italic text-[2.5rem] sm:text-[3.5rem] leading-[0.95] tracking-tight mb-4"
            style={{ color: "var(--ink)" }}
          >
            Questions.
          </h2>
          <p className="text-lg mb-16" style={{ color: "var(--ink-secondary)" }}>
            Honest answers.
          </p>

          <div className="space-y-px" style={{ background: "var(--rule)" }}>
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group p-6"
                style={{ background: "var(--paper)" }}
              >
                <summary
                  className="flex items-center justify-between cursor-pointer list-none gap-6"
                  style={{ color: "var(--ink)" }}
                >
                  <span
                    className="text-lg"
                    style={{
                      fontFamily: "Playfair Display, Fraunces, serif",
                    }}
                  >
                    {f.q}
                  </span>
                  <span
                    className="text-2xl transition-transform group-open:rotate-45"
                    style={{ color: "var(--gold-deep)" }}
                  >
                    +
                  </span>
                </summary>
                <p
                  className="mt-4 text-sm leading-relaxed"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <Globe
            className="w-12 h-12 mx-auto mb-6"
            style={{ color: "var(--gold-deep)" }}
          />
          <h2
            className="display-italic text-[2.5rem] sm:text-[4rem] leading-[0.95] tracking-tight mb-6"
            style={{ color: "var(--ink)" }}
          >
            Ship to every market.
            <br />
            <span style={{ color: "var(--gold-deep)" }}>By Tuesday.</span>
          </h2>
          <p
            className="text-lg max-w-xl mx-auto mb-10"
            style={{ color: "var(--ink-secondary)" }}
          >
            Render the spokesperson on Zoobicon. Click 'Dub into other languages'.
            Pick eight markets. Ship them all before lunch.
          </p>
          <Link
            href="/video-creator/storyboard"
            className="inline-flex items-center gap-2 px-7 py-4 text-sm uppercase tracking-[0.18em] font-medium transition-all"
            style={{
              background: "var(--ink)",
              color: "var(--paper)",
              border: "1px solid var(--ink)",
              borderRadius: 4,
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
            }}
          >
            <Mic className="w-4 h-4" />
            Open the video creator
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
