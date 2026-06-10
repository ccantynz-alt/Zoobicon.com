"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Globe2, Loader2 } from "lucide-react";
import VoiceToBuildButton from "@/components/VoiceToBuildButton";

/**
 * HeroBuilder — rebuilt to the Klaviyo reference (2026-06-09).
 *
 * Craig: "I sent you screenshots — that's the output I wanted."
 * The reference pattern: bright canvas, large confident type, ONE
 * red accent, and THE PRODUCT ON STAGE. Left column sells in words
 * (headline + prompt input — Klaviyo's email-capture pattern, but
 * ours takes a business description). Right column SHOWS the builder
 * generating a real site inside a crisp app frame. No lime, no
 * marker highlights, no glow.
 */

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

const AGENT_STEPS = [
  { name: "Strategy & structure", done: true },
  { name: "Brand & art direction", done: true },
  { name: "Copywriting", done: true },
  { name: "Building components", done: false },
];

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
    <section className="zb-bright relative overflow-hidden">
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pt-16 pb-20 sm:pt-24 sm:pb-24 lg:grid-cols-[1.05fr_1fr]">
        {/* ── Left: the pitch ── */}
        <div className="text-center lg:text-left">
          <div className="zb-eyebrow mb-6 justify-center lg:justify-start" style={{ color: "var(--zb-ink-2)" }}>
            The AI website builder
          </div>

          <h1
            className="zb-display mx-auto max-w-2xl text-[2.6rem] leading-[1.04] sm:text-6xl lg:mx-0 lg:text-[4.4rem]"
            style={{ color: "var(--zb-ink)" }}
          >
            Describe your business. Get a website that{" "}
            <span className="zb-mark">sells.</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-xl text-base leading-relaxed sm:text-lg lg:mx-0"
            style={{ color: "var(--zb-ink-2)" }}
          >
            Type one sentence. Six AI agents design the brand, write the copy,
            build the code and ship a deployable site — in under a minute.
            No templates. No drag-and-drop. No dev team.
          </p>

          {/* prompt input — Klaviyo's capture pattern, for prompts */}
          <form onSubmit={submit} className="relative mx-auto mt-9 w-full max-w-xl lg:mx-0">
            <div
              className="relative rounded-2xl transition-shadow duration-300 focus-within:shadow-[0_18px_50px_-22px_rgba(11,11,13,0.25)]"
              style={{
                background: "var(--zb-surface)",
                border: "1px solid var(--rule-strong)",
                boxShadow: "0 14px 40px -24px rgba(11, 11, 13, 0.18)",
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
                className="zb-input-light w-full resize-none bg-transparent px-5 py-4 pr-32 text-left text-[16px] leading-relaxed focus:outline-none"
                style={{ color: "var(--zb-ink)" }}
              />
              <div className="absolute right-[7rem] top-1/2 -translate-y-1/2">
                <VoiceToBuildButton
                  size="sm"
                  onTranscript={(text) => {
                    setPrompt((prev) => (prev ? `${prev} ${text}` : text));
                    inputRef.current?.focus();
                  }}
                />
              </div>
              <button type="submit" className="zb-btn absolute right-2.5 top-1/2 -translate-y-1/2 !px-5 !py-2.5 text-sm">
                Build it
              </button>
            </div>
          </form>

          {/* proof row */}
          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] lg:justify-start"
            style={{ color: "var(--zb-muted)" }}
          >
            {["Free to try", "First preview in seconds", "Hosting + domain included"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" style={{ color: "var(--zb-accent)" }} strokeWidth={2.5} />
                {t}
              </span>
            ))}
          </div>

          {/* already-have-a-site door */}
          <div className="mt-7 flex justify-center lg:justify-start">
            <Link
              href="/upgrade"
              className="group inline-flex items-center gap-2 text-[13.5px] font-medium transition-colors"
              style={{ color: "var(--zb-ink-2)" }}
            >
              <Globe2 className="h-3.5 w-3.5" style={{ color: "var(--zb-accent)" }} />
              Already have a website?{" "}
              <span className="font-semibold underline decoration-2 underline-offset-2" style={{ color: "var(--zb-ink)", textDecorationColor: "var(--zb-accent)" }}>
                Paste the URL — we&rsquo;ll rebuild it better
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>

        {/* ── Right: the product, on stage ── */}
        <div className="relative mx-auto w-full max-w-xl lg:max-w-none" aria-hidden>
          {/* app frame */}
          <div
            className="overflow-hidden rounded-[20px]"
            style={{
              background: "var(--zb-surface)",
              border: "1px solid var(--zb-line)",
              boxShadow: "0 40px 90px -40px rgba(11, 11, 13, 0.35), 0 4px 14px -6px rgba(11, 11, 13, 0.08)",
            }}
          >
            {/* title bar */}
            <div
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderBottom: "1px solid var(--zb-line)", background: "#fbfaf7" }}
            >
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#e5e1d6" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#e5e1d6" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#e5e1d6" }} />
              </div>
              <div
                className="mx-auto flex items-center gap-1.5 rounded-md px-6 py-1 text-[11px] font-medium"
                style={{ background: "#f1efe7", color: "var(--zb-muted)" }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#16a34a" }} />
                brooklynroast.com
              </div>
            </div>

            <div className="grid sm:grid-cols-[200px_1fr]">
              {/* left rail: the conversation */}
              <div
                className="hidden flex-col gap-3 p-4 sm:flex"
                style={{ borderRight: "1px solid var(--zb-line)", background: "#fbfaf7" }}
              >
                <div
                  className="self-end rounded-xl rounded-br-sm px-3 py-2 text-[11px] leading-snug"
                  style={{ background: "var(--zb-ink)", color: "#fff", maxWidth: "92%" }}
                >
                  A specialty coffee roaster in Brooklyn
                </div>
                <div
                  className="rounded-xl rounded-bl-sm px-3 py-2 text-[11px] leading-snug"
                  style={{ background: "#f1efe7", color: "var(--zb-ink-2)", maxWidth: "92%" }}
                >
                  On it. Designing your brand and building the site now.
                </div>
                <div className="mt-1 space-y-2">
                  {AGENT_STEPS.map((s) => (
                    <div key={s.name} className="flex items-center gap-2 text-[10.5px]" style={{ color: "var(--zb-ink-2)" }}>
                      {s.done ? (
                        <span
                          className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
                          style={{ background: "var(--zb-accent)" }}
                        >
                          <Check className="zb-band h-2 w-2 text-white" strokeWidth={3.5} />
                        </span>
                      ) : (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--zb-accent)" }} />
                      )}
                      {s.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* right: the generated site preview */}
              <div className="p-4">
                <div
                  className="overflow-hidden rounded-xl"
                  style={{ border: "1px solid var(--zb-line)" }}
                >
                  {/* mini nav */}
                  <div
                    className="zb-band flex items-center justify-between px-3.5 py-2"
                    style={{ background: "#221d18" }}
                  >
                    <span className="text-[10px] font-bold tracking-wide text-white">BROOKLYN ROAST</span>
                    <div className="flex items-center gap-2.5">
                      <span className="hidden text-[8.5px] text-white/60 sm:block">Beans</span>
                      <span className="hidden text-[8.5px] text-white/60 sm:block">Subscriptions</span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[8.5px] font-bold text-white"
                        style={{ background: "var(--zb-accent)" }}
                      >
                        Shop
                      </span>
                    </div>
                  </div>
                  {/* mini hero */}
                  <div
                    className="px-4 pb-4 pt-5"
                    style={{ background: "linear-gradient(155deg, #f6efe4 0%, #efe2cd 60%, #e9d6ba 100%)" }}
                  >
                    <div className="text-[15px] font-extrabold leading-tight tracking-tight" style={{ color: "#221d18" }}>
                      Small-batch roasts,
                      <br />
                      delivered fresh.
                    </div>
                    <div className="mt-1.5 text-[9px] leading-relaxed" style={{ color: "#6b5d49" }}>
                      Single-origin beans roasted in Williamsburg every morning.
                    </div>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <span
                        className="zb-band rounded-full px-2.5 py-1 text-[8.5px] font-bold text-white"
                        style={{ background: "#221d18" }}
                      >
                        Start a subscription
                      </span>
                      <span
                        className="rounded-full px-2.5 py-1 text-[8.5px] font-semibold"
                        style={{ border: "1px solid #c9b18c", color: "#5d4e38" }}
                      >
                        Our story
                      </span>
                    </div>
                  </div>
                  {/* mini cards */}
                  <div className="grid grid-cols-3 gap-2 p-3" style={{ background: "#ffffff" }}>
                    {["Ethiopia Yirgacheffe", "Colombia Huila", "House Espresso"].map((n, i) => (
                      <div key={n} className="rounded-lg p-2" style={{ border: "1px solid var(--zb-line)" }}>
                        <div
                          className="mb-1.5 h-9 rounded-md"
                          style={{
                            background: ["#d9c4a3", "#c9a97e", "#b08a5c"][i],
                          }}
                        />
                        <div className="text-[8px] font-bold leading-tight" style={{ color: "var(--zb-ink)" }}>
                          {n}
                        </div>
                        <div className="text-[7.5px]" style={{ color: "var(--zb-muted)" }}>
                          from $18
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* deploy row */}
                <div className="mt-3 flex items-center justify-between px-0.5">
                  <span className="text-[10.5px]" style={{ color: "var(--zb-muted)" }}>
                    Built in 47 seconds
                  </span>
                  <span
                    className="zb-band inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10.5px] font-bold text-white"
                    style={{ background: "var(--zb-accent)" }}
                  >
                    Deploy <ArrowRight className="h-2.5 w-2.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
