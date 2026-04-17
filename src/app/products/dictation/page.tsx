"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Minus,
  ChevronDown,
  Mic,
  Languages,
  Users,
  FileText,
  Brain,
  Sparkles,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Video,
  Scale,
  Pen,
  BadgeCheck,
} from "lucide-react";

const STATS = [
  { value: "50+", label: "Languages supported" },
  { value: "95%+", label: "Accuracy rate" },
  { value: "Real-time", label: "Live transcription" },
  { value: "Nova-2", label: "AI model" },
];

const FEATURES = [
  { icon: Mic, title: "Real-Time Dictation", desc: "Speak naturally and watch your words appear instantly. No waiting for batch processing — see results as you talk." },
  { icon: Languages, title: "50+ Languages", desc: "Transcribe in English, Spanish, French, German, Japanese, Mandarin, Hindi, Arabic, and 40+ more languages with native accuracy." },
  { icon: Users, title: "Speaker Diarization", desc: "Automatically identifies who said what in multi-person conversations. Perfect for meetings, interviews, and podcasts." },
  { icon: FileText, title: "Smart Punctuation", desc: "AI adds commas, periods, question marks, and paragraph breaks automatically. No more editing walls of text." },
  { icon: Brain, title: "Summary Generation", desc: "Get an AI-generated summary of any transcription. Turn a 60-minute meeting into key points in seconds." },
  { icon: Sparkles, title: "Custom Vocabulary", desc: "Add industry-specific terms, names, and jargon so the AI recognizes them perfectly every time." },
];

const USE_CASES = [
  { icon: Briefcase, title: "Business Meetings", desc: "Never miss an action item. Transcribe meetings with speaker labels and auto-summaries." },
  { icon: Stethoscope, title: "Medical Notes", desc: "Dictate patient notes hands-free. HIPAA-aware processing with medical vocabulary." },
  { icon: Scale, title: "Legal Transcription", desc: "Depositions, hearings, client calls — accurate transcripts with timestamps." },
  { icon: Video, title: "Content Creators", desc: "Transcribe podcasts, YouTube videos, and interviews. Export as subtitles or blog posts." },
  { icon: GraduationCap, title: "Students", desc: "Record lectures and get searchable, highlighted transcripts for studying." },
  { icon: Pen, title: "Writers & Authors", desc: "Dictate drafts 3x faster than typing. AI handles punctuation so you focus on ideas." },
];

const COMPETITORS = [
  { name: "Real-Time Transcription", zoobicon: true, otter: true, rev: false, descript: false, whisper: false },
  { name: "Languages", zoobicon: "50+", otter: "English only", rev: "12", descript: "23", whisper: "50+" },
  { name: "Speaker Diarization", zoobicon: true, otter: true, rev: true, descript: true, whisper: false },
  { name: "AI Summary", zoobicon: true, otter: true, rev: false, descript: false, whisper: false },
  { name: "Custom Vocabulary", zoobicon: true, otter: false, rev: true, descript: false, whisper: false },
  { name: "API Access", zoobicon: true, otter: "Enterprise", rev: true, descript: false, whisper: true },
  { name: "Bundled Website Builder", zoobicon: true, otter: false, rev: false, descript: false, whisper: false },
  { name: "Bundled eSIM & VPN", zoobicon: true, otter: false, rev: false, descript: false, whisper: false },
  { name: "Self-Hosted Option", zoobicon: false, otter: false, rev: false, descript: false, whisper: true },
  { name: "300 min/mo Price", zoobicon: "$4.99", otter: "$16.99", rev: "$29.99", descript: "$24.00", whisper: "Free" },
  { name: "1000 min/mo Price", zoobicon: "$11.99", otter: "$30.00", rev: "$59.99", descript: "$44.00", whisper: "Free" },
];

const PLANS = [
  { name: "Starter", minutes: "300 min/mo", price: "$4.99", period: "/month", desc: "Personal dictation and short recordings", features: ["Real-time dictation", "30+ languages", "Smart punctuation", "Export to text/PDF"], featured: false },
  { name: "Pro", minutes: "1,000 min/mo", price: "$11.99", period: "/month", desc: "Professionals and content creators", features: ["Everything in Starter", "Speaker diarization", "AI summaries", "Custom vocabulary", "API access"], featured: true },
  { name: "Business", minutes: "5,000 min/mo", price: "$29.99", period: "/month", desc: "Teams and organizations", features: ["Everything in Pro", "Team accounts", "Priority processing", "Webhooks", "Batch transcription"], featured: false },
];

const FAQS = [
  { q: "How accurate is the transcription?", a: "Zoobicon Dictation uses Deepgram's Nova-2 model, which achieves 95%+ accuracy on clear audio in English. Accuracy varies by language, audio quality, and background noise — but it consistently outperforms most competitors. For best results, use a decent microphone and minimize background noise." },
  { q: "What audio formats are supported?", a: "We support all major audio formats: MP3, WAV, M4A, FLAC, OGG, WebM, and MP4 (video files — we extract the audio). Maximum file size is 2GB. For real-time dictation, we use your browser's microphone directly." },
  { q: "Can I use it for real-time meetings?", a: "Yes. Open the dictation tool in your browser and it transcribes in real-time as people speak. Speaker diarization (Pro plan) automatically labels who said what. After the meeting, you get a full transcript with an AI summary." },
  { q: "Is my audio data private?", a: "We don't store your audio files after transcription is complete. The transcript belongs to you. Audio is processed via Deepgram's secure API (SOC 2 Type II certified) and is not used to train AI models. Your data stays yours." },
  { q: "What languages are supported?", a: "50+ languages including English, Spanish, French, German, Portuguese, Italian, Dutch, Japanese, Korean, Mandarin Chinese, Hindi, Arabic, Turkish, Polish, Russian, and many more. Language detection is automatic — just start speaking." },
];

const CARD_BG = "linear-gradient(135deg, rgba(17,17,24,0.85) 0%, rgba(10,10,15,0.7) 100%)";
const PRIMARY_CTA = {
  background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)",
  color: "#0a0a0f",
  boxShadow: "0 14px 40px -16px rgba(232,212,176,0.5)",
} as const;
const SERIF: React.CSSProperties = {
  fontFamily: "Fraunces, ui-serif, Georgia, serif",
  fontStyle: "italic",
  fontWeight: 400,
  color: "#E8D4B0",
};

export default function DictationProductPage() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Zoobicon Dictation",
    description: "AI-powered speech-to-text and transcription. 50+ languages, 95%+ accuracy, real-time dictation with speaker diarization and AI summaries.",
    url: "https://zoobicon.com/products/dictation",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web, iOS, Android",
    keywords: "best dictation app, AI transcription, speech to text, meeting transcription, voice to text",
    offers: { "@type": "AggregateOffer", lowPrice: "4.99", highPrice: "29.99", priceCurrency: "USD" },
    brand: { "@type": "Brand", name: "Zoobicon" },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://zoobicon.com" },
      { "@type": "ListItem", position: 2, name: "Products", item: "https://zoobicon.com/products" },
      { "@type": "ListItem", position: 3, name: "Dictation", item: "https://zoobicon.com/products/dictation" },
    ],
  };
  const faqLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQS.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  const Cell = ({ val, highlight = false }: { val: unknown; highlight?: boolean }) => {
    if (val === true) return <Check className="w-4 h-4 mx-auto" style={{ color: highlight ? "#E8D4B0" : undefined }} />;
    if (val === false) return <Minus className="w-4 h-4 mx-auto text-white/25" />;
    return <span className="text-[13px]" style={{ color: highlight ? "#E8D4B0" : "rgba(255,255,255,0.65)" }}>{String(val)}</span>;
  };

  return (
    <div className="min-h-screen bg-[#050508] text-white fs-grain pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Hero */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute left-1/2 top-0 h-[720px] w-[1200px] -translate-x-1/2 rounded-full blur-[160px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.09), transparent 70%)" }} />
          <div className="absolute right-[-10%] top-[30%] h-[420px] w-[520px] rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(224,139,176,0.07), transparent 70%)" }} />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-8">
            <BadgeCheck className="w-3 h-3" />
            Deepgram Nova-2 · 50+ languages · 95%+ accuracy
          </div>

          <h1 className="fs-display-xl mb-6">
            Speak.{" "}
            <span style={SERIF}>It types.</span>
          </h1>

          <p className="max-w-3xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-white/60 mb-10">
            AI dictation and transcription in 50+ languages. 95%+ accuracy. Real-time or batch.
            Speaker labels, summaries, and smart punctuation — all automatic.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-10 max-w-3xl mx-auto">
            {["Real-time", "Speaker labels", "Auto punctuation", "AI summaries", "50+ languages", "Custom vocabulary"].map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-white/60"
              >
                <Check className="w-3 h-3" style={{ color: "#E8D4B0" }} />
                {pill}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={user ? "/dictation" : "/auth/signup"}
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
              style={PRIMARY_CTA}
            >
              {user ? "Open Dictation" : "Start Dictating"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-7 py-3.5 text-[14px] font-medium text-white/80 backdrop-blur transition-all duration-500 hover:-translate-y-0.5 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
            >
              View plans
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] mb-2" style={{ color: "#E8D4B0" }}>
                  {stat.value}
                </div>
                <div className="text-[13px] text-white/55">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Capabilities
            </div>
            <h2 className="fs-display-lg mb-4">
              Transcription that{" "}
              <span style={SERIF}>actually works.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Powered by Deepgram Nova-2 — the most accurate speech-to-text AI available.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative">
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
                    <f.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2">{f.title}</h3>
                  <p className="text-[13px] text-white/55 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Use cases
            </div>
            <h2 className="fs-display-lg mb-4">
              Built for{" "}
              <span style={SERIF}>every voice.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              From boardrooms to classrooms. Anywhere words matter, dictation delivers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {USE_CASES.map((u) => (
              <div
                key={u.title}
                className="group relative overflow-hidden rounded-[24px] border border-white/[0.08] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#E8D4B0]/25"
                style={{ background: CARD_BG }}
              >
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
                <div className="relative flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05] flex-shrink-0">
                    <u.icon className="h-5 w-5 text-[#E8D4B0]" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-1.5">{u.title}</h3>
                    <p className="text-[13px] text-white/55 leading-relaxed">{u.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor comparison */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.07), transparent 70%)" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Industry comparison
            </div>
            <h2 className="fs-display-lg mb-4">
              See how we{" "}
              <span style={SERIF}>stack up.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              The only transcription platform bundled with website hosting, eSIM, VPN, and a full software suite.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[28px] border border-white/[0.08]" style={{ background: CARD_BG }}>
            <div className="min-w-[820px]">
              <div className="grid grid-cols-6 px-6 py-4 border-b border-white/[0.08] text-[11px] uppercase tracking-[0.15em] font-semibold text-white/55">
                <div>Feature</div>
                <div className="text-center" style={{ color: "#E8D4B0" }}>Zoobicon</div>
                <div className="text-center">Otter.ai</div>
                <div className="text-center">Rev</div>
                <div className="text-center">Descript</div>
                <div className="text-center">Whisper</div>
              </div>
              {COMPETITORS.map((row, i) => (
                <div
                  key={row.name}
                  className={`grid grid-cols-6 px-6 py-4 text-[13px] ${
                    i !== COMPETITORS.length - 1 ? "border-b border-white/[0.04]" : ""
                  }`}
                >
                  <div className="text-white/75 font-medium">{row.name}</div>
                  <div className="text-center"><Cell val={row.zoobicon} highlight /></div>
                  <div className="text-center"><Cell val={row.otter} /></div>
                  <div className="text-center"><Cell val={row.rev} /></div>
                  <div className="text-center"><Cell val={row.descript} /></div>
                  <div className="text-center"><Cell val={row.whisper} /></div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-white/30 mt-4 text-center">
            Comparison based on publicly available information as of March 2026. Features and pricing
            may change. All trademarks belong to their respective owners. See our{" "}
            <Link href="/disclaimers" className="underline hover:text-white/55">disclaimers</Link>.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Pricing
            </div>
            <h2 className="fs-display-lg mb-4">
              Simple, transparent{" "}
              <span style={SERIF}>pricing.</span>
            </h2>
            <p className="max-w-2xl mx-auto text-[15px] text-white/55">
              Pay only for what you speak. No surprises, no hidden minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-[24px] p-7 transition-all duration-500 hover:-translate-y-1 ${
                  p.featured ? "border-2 border-[#E8D4B0]/35" : "border border-white/[0.08] hover:border-[#E8D4B0]/25"
                }`}
                style={{
                  background: p.featured
                    ? "linear-gradient(135deg, rgba(232,212,176,0.08) 0%, rgba(17,17,24,0.85) 100%)"
                    : CARD_BG,
                }}
              >
                {p.featured && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ background: "linear-gradient(135deg, #E8D4B0 0%, #F0DCB8 100%)", color: "#0a0a0f" }}
                  >
                    Most popular
                  </div>
                )}
                <h3 className="text-[17px] font-semibold tracking-[-0.01em] mb-2">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-semibold tracking-[-0.02em]" style={{ color: "#E8D4B0" }}>{p.price}</span>
                  <span className="text-[13px] text-white/50">{p.period}</span>
                </div>
                <p className="text-[12px] text-white/45 mb-3">{p.minutes}</p>
                <p className="text-[13px] text-white/55 mb-6">{p.desc}</p>
                <ul className="space-y-2.5 mb-7">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-white/65">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#E8D4B0" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={user ? "/dictation" : "/auth/signup"}
                  className={`block text-center rounded-full py-3 text-[13px] font-semibold transition-all ${
                    p.featured ? "" : "border border-white/[0.12] bg-white/[0.03] text-white/80 hover:border-[#E8D4B0]/35 hover:text-[#E8D4B0]"
                  }`}
                  style={p.featured ? PRIMARY_CTA : undefined}
                >
                  {user ? "Open App" : "Start Free Trial"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20 md:py-24 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.04] px-3 py-1 text-[11px] font-medium text-[#E8D4B0]/90 mb-6">
              Questions
            </div>
            <h2 className="fs-display-lg mb-4">
              Frequently{" "}
              <span style={SERIF}>asked.</span>
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-[20px] border border-white/[0.08]"
                style={{ background: CARD_BG }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <span className="text-[15px] font-medium pr-4 text-white/85">{f.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`}
                    style={{ color: "#E8D4B0" }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-[14px] text-white/60 leading-relaxed">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 md:py-32 border-t border-white/[0.06] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[560px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ background: "radial-gradient(closest-side, rgba(232,212,176,0.11), transparent 70%)" }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#E8D4B0]/20 bg-[#E8D4B0]/[0.05]">
            <Mic className="h-6 w-6 text-[#E8D4B0]" />
          </div>
          <h2 className="fs-display-lg mb-5">
            Your voice. Your words.{" "}
            <span style={SERIF}>Instantly.</span>
          </h2>
          <p className="text-[17px] text-white/60 mb-10 max-w-xl mx-auto">
            Stop typing. Start talking. 50+ languages, 95%+ accuracy, real-time transcription.
          </p>
          <Link
            href={user ? "/dictation" : "/auth/signup"}
            className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-[15px] font-semibold transition-all duration-500 hover:-translate-y-0.5"
            style={PRIMARY_CTA}
          >
            {user ? "Open Dictation" : "Start Dictating"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-[12px] text-white/55">
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> 14-day free trial</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5" style={{ color: "#E8D4B0" }} /> Cancel anytime</span>
          </div>
        </div>
      </section>
    </div>
  );
}
