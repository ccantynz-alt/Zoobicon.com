"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Globe2, Sparkles } from "lucide-react";
import VoiceToBuildButton from "@/components/VoiceToBuildButton";

/**
 * HeroBuilder — the homepage hero, rebuilt 2026-06-09.
 *
 * Zoobicon Bold direction (Craig overrode Rule 29): a near-black
 * statement hero, one electric-lime accent, huge Plus Jakarta Sans
 * display type. The job of this hero is to SELL — so the primary CTA
 * routes reliably into the full builder (`/builder`) instead of
 * running an inline SSE stream on the landing page (that stream has
 * been the thing failing for months). The builder is where building
 * happens; the homepage's job is to convert.
 */

const AGENTS = [
  { icon: "🧭", name: "Strategist" },
  { icon: "🎨", name: "Brand" },
  { icon: "🏗️", name: "Architect" },
  { icon: "✍️", name: "Copywriter" },
  { icon: "⚡", name: "Developer" },
  { icon: "🔍", name: "SEO" },
];

const PLACEHOLDERS = [
  "A specialty coffee roaster in Brooklyn",
  "A law firm with fixed-fee contracts",
  "A wedding photographer in Melbourne",
  "An AI analytics dashboard for cohorts",
  "A dental clinic with online booking",
  "A ceramics shop with Stripe checkout",
];

function usePlaceholder() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);

  useEffect(() => {
    const cur = PLACEHOLDERS[idx];
    if (!del && text === cur) {
      const t = setTimeout(() => setDel(true), 2200);
      return () => clearTimeout(t);
    }
    if (del && text === "") {
      setDel(false);
      setIdx((i) => (i + 1) % PLACEHOLDERS.length);
      return;
    }
    const t = setTimeout(
      () =>
        setText(
          del ? cur.slice(0, text.length - 1) : cur.slice(0, text.length + 1)
        ),
      del ? 22 : 42
    );
    return () => clearTimeout(t);
  }, [text, del, idx]);

  return text;
}

export default function HeroBuilder() {
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const placeholder = usePlaceholder();
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = (prompt.trim() || placeholder).trim();
    if (!p) return;
    router.push(`/builder?prompt=${encodeURIComponent(p)}&fromHero=1`);
  };

  return (
    <section className="zb-dark relative overflow-hidden">
      {/* ambient lime glow */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-[-10%] h-[620px] w-[1100px] -translate-x-1/2 rounded-full blur-[150px]"
          style={{ background: "radial-gradient(closest-side, rgba(212,242,78,0.14), transparent 72%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.6]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
        {/* eyebrow */}
        <div className="zb-eyebrow mb-7 justify-center" style={{ color: "var(--zb-accent)" }}>
          <Sparkles className="h-3.5 w-3.5" />
          Six AI agents · one prompt · a live website
        </div>

        {/* headline */}
        <h1 className="zb-display mx-auto max-w-4xl text-[2.9rem] sm:text-7xl lg:text-[5.6rem]">
          Describe your business.{" "}
          <span className="zb-mark">Get a website</span> that sells.
        </h1>

        <p
          className="mx-auto mt-7 max-w-xl text-base sm:text-lg leading-relaxed"
          style={{ color: "rgba(255,255,255,0.62)" }}
        >
          Type one sentence. Six agents design the brand, write the copy,
          build the code and ship a deployable site — in under a minute.
          No templates. No drag-and-drop. No dev team.
        </p>

        {/* input */}
        <form onSubmit={submit} className="relative mx-auto mt-10 w-full max-w-2xl">
          <div
            className="relative rounded-2xl backdrop-blur-xl transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 30px 80px -40px rgba(0,0,0,0.7)",
            }}
          >
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              rows={2}
              placeholder={placeholder}
              className="zb-input w-full resize-none bg-transparent px-6 py-5 pr-36 text-left text-lg leading-relaxed focus:outline-none sm:text-xl"
              style={{ color: "#ffffff" }}
            />
            <div className="absolute right-[8rem] top-1/2 -translate-y-1/2">
              <VoiceToBuildButton
                size="sm"
                onTranscript={(text) => {
                  setPrompt((prev) => (prev ? `${prev} ${text}` : text));
                  inputRef.current?.focus();
                }}
              />
            </div>
            <button type="submit" className="zb-btn absolute right-3 top-1/2 -translate-y-1/2 !py-2.5 !px-5 text-sm">
              Build it <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* suggestion chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>
              Try:
            </span>
            {["Coffee roaster", "Law firm", "Photographer", "SaaS landing", "Dental clinic"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setPrompt(`A ${t.toLowerCase()} website`);
                  inputRef.current?.focus();
                }}
                className="zb-chip-dark transition-colors hover:!border-[rgba(212,242,78,0.5)]"
              >
                {t}
              </button>
            ))}
          </div>
        </form>

        {/* already-have-a-site door */}
        <div className="mt-8">
          <Link
            href="/upgrade"
            className="group inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] transition-all duration-300 hover:-translate-y-0.5"
            style={{
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            <Globe2 className="h-3.5 w-3.5" style={{ color: "var(--zb-accent)" }} />
            Already have a website?
            <span className="font-semibold" style={{ color: "var(--zb-accent)" }}>
              Paste the URL — we&rsquo;ll rebuild it better
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color: "var(--zb-accent)" }} />
          </Link>
        </div>

        {/* agent rail */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-2.5">
          {AGENTS.map((a) => (
            <div key={a.name} className="zb-chip-dark">
              <span className="text-sm">{a.icon}</span>
              <span className="font-medium tracking-tight">{a.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
