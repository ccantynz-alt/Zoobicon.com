"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import BackgroundEffects from "@/components/BackgroundEffects";
import HeroEffects, { CursorGlowTracker } from "@/components/HeroEffects";
import {
  Zap, ArrowRight, Check, Minus, ChevronDown, ChevronRight,
  Mic, Languages, Users, FileText, Brain, Sparkles,
  Briefcase, GraduationCap, Stethoscope, Video, Scale, Pen,
  LayoutDashboard, LogOut,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

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
  { name: "Feature", zoobicon: "Zoobicon", otter: "Otter.ai", rev: "Rev", descript: "Descript", whisper: "Whisper" },
  { name: "Real-Time Transcription", zoobicon: true, otter: true, rev: false, descript: false, whisper: false },
  { name: "Languages", zoobicon: "50+", otter: "English only", rev: "12", descript: "23", whisper: "50+" },
  { name: "Speaker Diarization", zoobicon: true, otter: true, rev: true, descript: true, whisper: false },
  { name: "AI Summary", zoobicon: true, otter: true, rev: false, descript: false, whisper: false },
  { name: "Custom Vocabulary", zoobicon: true, otter: false, rev: true, descript: false, whisper: false },
  { name: "API Access", zoobicon: true, otter: "Enterprise", rev: true, descript: false, whisper: true },
  { name: "Bundled Website Builder", zoobicon: true, otter: false, rev: false, descript: false, whisper: false },
  { name: "Bundled eSIM & VPN", zoobicon: true, otter: false, rev: false, descript: false, whisper: false },
  { name: "Self-Hosted Option", zoobicon: false, otter: false, rev: false, descript: false, whisper: true },
  { name: "300 min/mo Price", zoobicon: "$9.99", otter: "$16.99", rev: "$29.99", descript: "$24.00", whisper: "Free" },
  { name: "1000 min/mo Price", zoobicon: "$19.99", otter: "$30.00", rev: "$59.99", descript: "$44.00", whisper: "Free" },
];

const PLANS = [
  { name: "Starter", minutes: "300 min/mo", price: "$9.99", period: "/month", desc: "Personal dictation and short recordings", features: ["Real-time dictation", "30+ languages", "Smart punctuation", "Export to text/PDF"], featured: false },
  { name: "Pro", minutes: "1,000 min/mo", price: "$19.99", period: "/month", desc: "Professionals and content creators", features: ["Everything in Starter", "Speaker diarization", "AI summaries", "Custom vocabulary", "API access"], featured: true },
  { name: "Business", minutes: "5,000 min/mo", price: "$49.99", period: "/month", desc: "Teams and organizations", features: ["Everything in Pro", "Team accounts", "Priority processing", "Webhooks", "Batch transcription"], featured: false },
];

const FAQS = [
  { q: "How accurate is the transcription?", a: "Zoobicon Dictation uses Deepgram's Nova-2 model, which achieves 95%+ accuracy on clear audio in English. Accuracy varies by language, audio quality, and background noise — but it consistently outperforms most competitors. For best results, use a decent microphone and minimize background noise." },
  { q: "What audio formats are supported?", a: "We support all major audio formats: MP3, WAV, M4A, FLAC, OGG, WebM, and MP4 (video files — we extract the audio). Maximum file size is 2GB. For real-time dictation, we use your browser's microphone directly." },
  { q: "Can I use it for real-time meetings?", a: "Yes. Open the dictation tool in your browser and it transcribes in real-time as people speak. Speaker diarization (Pro plan) automatically labels who said what. After the meeting, you get a full transcript with an AI summary." },
  { q: "Is my audio data private?", a: "We don't store your audio files after transcription is complete. The transcript belongs to you. Audio is processed via Deepgram's secure API (SOC 2 Type II certified) and is not used to train AI models. Your data stays yours." },
  { q: "What languages are supported?", a: "50+ languages including English, Spanish, French, German, Portuguese, Italian, Dutch, Japanese, Korean, Mandarin Chinese, Hindi, Arabic, Turkish, Polish, Russian, and many more. Language detection is automatic — just start speaking." },
];

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
    offers: { "@type": "AggregateOffer", lowPrice: "9.99", highPrice: "49.99", priceCurrency: "USD" },
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

  const Cell = ({ val }: { val: unknown }) => {
    if (val === true) return <Check className="w-4 h-4 text-emerald-400 mx-auto" />;
    if (val === false) return <Minus className="w-4 h-4 text-white/20 mx-auto" />;
    return <span className="text-sm text-white/70">{String(val)}</span>;
  };

  return (
    <div className="relative min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <BackgroundEffects preset="technical" />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-bold tracking-tight">Zoobicon</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5"><LayoutDashboard className="w-3.5 h-3.5" /> Dashboard</Link>
                <button onClick={() => { try { localStorage.removeItem("zoobicon_user"); } catch {} setUser(null); }} className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5"><LogOut className="w-3.5 h-3.5" /> Sign out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-white/65 hover:text-white transition-colors px-3 py-2">Sign in</Link>
                <Link href="/auth/signup" className="btn-gradient px-4 py-2 rounded-xl text-sm font-semibold text-white">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <HeroEffects variant="purple" cursorGlow particles particleCount={25} aurora />
        <CursorGlowTracker />
        <motion.div className="relative z-10 max-w-5xl mx-auto px-6 text-center" variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
            <Mic className="w-3.5 h-3.5 text-purple-400" /><span className="text-xs font-medium text-purple-300">AI-Powered Transcription</span>
          </motion.div>
          <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            Speak.{" "}<span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">It types.</span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10">
            AI dictation and transcription in 50+ languages. 95%+ accuracy. Real-time or batch. Speaker labels, summaries, and smart punctuation — all automatic.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup" className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 font-semibold hover:from-purple-400 hover:to-pink-500 transition-all flex items-center gap-2">Start Dictating <ArrowRight className="w-4 h-4" /></Link>
            <Link href="#pricing" className="px-8 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.1] font-semibold hover:bg-white/[0.08] transition-all">View Plans</Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-purple-400">{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div className="text-center mb-16" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold mb-4">Transcription that actually works</motion.h2>
            <motion.p variants={fadeInUp} className="text-white/40 max-w-lg mx-auto">Powered by Deepgram Nova-2 — the most accurate speech-to-text AI available.</motion.p>
          </motion.div>
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            {FEATURES.map(f => (
              <motion.div key={f.title} variants={fadeInUp} className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 hover:border-purple-500/20 transition-all">
                <f.icon className="w-6 h-6 text-purple-400 mb-4" />
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-center mb-12">Built for every use case</motion.h2>
          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
            {USE_CASES.map(u => (
              <motion.div key={u.title} variants={fadeInUp} className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
                <u.icon className="w-5 h-5 text-purple-400 mb-3" />
                <h3 className="font-semibold text-sm mb-1">{u.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">{u.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-center mb-12">How Zoobicon Dictation compares</motion.h2>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  {["Feature", "Zoobicon", "Otter.ai", "Rev", "Descript", "Whisper"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-left text-xs uppercase tracking-wider ${i === 1 ? "text-purple-400 bg-purple-500/5" : "text-white/40"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {COMPETITORS.slice(1).map(row => (
                  <tr key={row.name} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white/60 text-sm">{row.name}</td>
                    <td className="px-4 py-3 bg-purple-500/5"><Cell val={row.zoobicon} /></td>
                    <td className="px-4 py-3"><Cell val={row.otter} /></td>
                    <td className="px-4 py-3"><Cell val={row.rev} /></td>
                    <td className="px-4 py-3"><Cell val={row.descript} /></td>
                    <td className="px-4 py-3"><Cell val={row.whisper} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-center mb-12">Simple, transparent pricing</motion.h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map(p => (
              <div key={p.name} className={`rounded-2xl p-6 border ${p.featured ? "bg-purple-500/5 border-purple-500/20 ring-1 ring-purple-500/10" : "bg-white/[0.02] border-white/[0.08]"}`}>
                {p.featured && <div className="text-[10px] text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full inline-block mb-3 font-semibold uppercase tracking-wider">Most Popular</div>}
                <h3 className="text-lg font-bold mb-1">{p.name}</h3>
                <p className="text-xs text-white/40 mb-4">{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-1"><span className="text-3xl font-bold">{p.price}</span><span className="text-sm text-white/30">{p.period}</span></div>
                <p className="text-xs text-white/30 mb-4">{p.minutes}</p>
                <ul className="space-y-2 mb-6">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/50"><Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />{f}</li>
                  ))}
                </ul>
                <Link href="/auth/signup" className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${p.featured ? "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500" : "bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.08]"}`}>Start Free Trial</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6">
          <motion.h2 variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-3xl font-bold text-center mb-12">Frequently asked questions</motion.h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="rounded-xl border border-white/[0.08] overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm font-medium pr-4">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-white/30 shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="px-5 pb-4 text-sm text-white/50 leading-relaxed">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Mic className="w-12 h-12 text-purple-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Your voice. Your words. Instantly.</h2>
          <p className="text-white/40 mb-8 max-w-lg mx-auto">Stop typing. Start talking. 50+ languages, 95%+ accuracy, real-time transcription.</p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 font-semibold hover:from-purple-400 hover:to-pink-500 transition-all">Start Dictating <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-white/30">&copy; 2026 Zoobicon. All rights reserved.</div>
          <div className="text-xs text-white/20">zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot; zoobicon.sh</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-xs text-white/30 hover:text-white/50 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-white/30 hover:text-white/50 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
