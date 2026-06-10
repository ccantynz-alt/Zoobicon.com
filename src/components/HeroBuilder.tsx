"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

/**
 * HeroBuilder — photographic hero, rebuilt to Craig's Klaviyo
 * screenshots (2026-06-10).
 *
 * The reference hero is a full-bleed lifestyle PHOTOGRAPH with the
 * headline overlaid left and the product UI floating over the photo
 * right — not a type-and-cards layout. This component reproduces that
 * architecture: licensed Unsplash photography (graceful dark fallback
 * while it loads / if blocked), a scrim for legibility, the prompt
 * capture row (their email+Sign up pattern), and floating glass
 * product cards showing the builder mid-conversation.
 */

const PLACEHOLDERS = [
  "A specialty coffee roaster in Brooklyn",
  "A law firm with fixed-fee contracts",
  "A wedding photographer in Melbourne",
  "A dental clinic with online booking",
  "A ceramics shop with Stripe checkout",
];

const HERO_PHOTO =
  "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=2400&q=80";

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
      () => setText(del ? cur.slice(0, text.length - 1) : cur.slice(0, text.length + 1)),
      del ? 22 : 42
    );
    return () => clearTimeout(t);
  }, [text, del, idx]);

  return text;
}

export default function HeroBuilder() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const placeholder = usePlaceholder();
  const [prompt, setPrompt] = useState("");

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const p = (prompt.trim() || placeholder).trim();
    if (!p) return;
    router.push(`/builder?prompt=${encodeURIComponent(p)}&fromHero=1`);
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#181410" }}
    >
      {/* full-bleed photograph */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_PHOTO})` }}
        aria-hidden
      />
      {/* legibility scrim — heavier on the left where the copy sits */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(100deg, rgba(12,10,8,0.82) 0%, rgba(12,10,8,0.55) 42%, rgba(12,10,8,0.18) 70%, rgba(12,10,8,0.35) 100%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-20 sm:pt-24 lg:grid-cols-[1.1fr_1fr] lg:pb-28 lg:pt-28">
        {/* ── Left: headline over the photograph ── */}
        <div className="zb-band">
          <div className="zb-eyebrow mb-6 text-white/85">The AI website builder</div>

          <h1 className="zb-display max-w-xl text-[2.7rem] leading-[1.03] text-white sm:text-6xl lg:text-[4.2rem]">
            AI websites that sell. Built while you watch.
          </h1>

          <p className="mt-6 max-w-md text-[16.5px] leading-relaxed text-white/80">
            Describe your business in one sentence. Six AI agents design the
            brand, write the copy and ship a deployable site — domain and
            hosting included.
          </p>

          {/* capture row — input + red CTA, the reference pattern */}
          <form onSubmit={submit} className="mt-9 flex w-full max-w-md items-center gap-2.5">
            <input
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholder}
              className="h-[52px] min-w-0 flex-1 rounded-lg border-0 bg-white px-4 text-[15px] focus:outline-none focus:ring-2"
              style={{ color: "#0b0b0d" }}
            />
            <button type="submit" className="zb-btn h-[52px] flex-none !rounded-lg !px-6">
              Build it
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-white/65">
            {["Free to try", "No credit card", "Live in under a minute"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" style={{ color: "var(--zb-accent-hi)" }} strokeWidth={2.5} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right: the product floating over the photo ── */}
        <div className="zb-band relative mx-auto w-full max-w-md select-none lg:max-w-lg" aria-hidden>
          {/* user message */}
          <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-white px-4 py-3 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.5)]">
            <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--zb-accent)" }}>
              You
            </div>
            <div className="mt-0.5 text-[13.5px] font-medium leading-snug" style={{ color: "#0b0b0d" }}>
              Build a site for my Brooklyn coffee roastery — warm, premium,
              with online ordering.
            </div>
          </div>

          {/* builder reply with generated site */}
          <div className="mt-3 w-fit max-w-[94%] rounded-2xl rounded-bl-md bg-white p-4 shadow-[0_24px_60px_-22px_rgba(0,0,0,0.55)]">
            <div className="flex items-center gap-2">
              <span
                className="zb-display flex h-5 w-5 items-center justify-center rounded-[6px] text-[11px] text-white"
                style={{ background: "var(--zb-accent)" }}
              >
                Z
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6c6c75" }}>
                Zoobicon builder
              </span>
            </div>
            <div className="mt-1.5 text-[13px] leading-snug" style={{ color: "#3b3b42" }}>
              Done — here&rsquo;s your site. Want the domain{" "}
              <span className="font-bold" style={{ color: "#0b0b0d" }}>
                brooklynroast.com
              </span>{" "}
              with it?
            </div>

            {/* generated mini-site */}
            <div className="mt-3 overflow-hidden rounded-xl" style={{ border: "1px solid #e9e6dd" }}>
              <div className="zb-band flex items-center justify-between px-3 py-1.5" style={{ background: "#221d18" }}>
                <span className="text-[9px] font-bold tracking-wide text-white">BROOKLYN ROAST</span>
                <span className="rounded-full px-2 py-0.5 text-[8px] font-bold text-white" style={{ background: "var(--zb-accent)" }}>
                  Order
                </span>
              </div>
              <div className="px-3.5 pb-3 pt-3.5" style={{ background: "linear-gradient(150deg, #f6efe4, #ead9bf)" }}>
                <div className="text-[13px] font-extrabold leading-tight" style={{ color: "#221d18" }}>
                  Small-batch roasts, delivered fresh.
                </div>
                <div className="mt-1 text-[8.5px]" style={{ color: "#6b5d49" }}>
                  Roasted in Williamsburg every morning.
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 bg-white p-2">
                {["#d9c4a3", "#c9a97e", "#b08a5c"].map((c) => (
                  <div key={c} className="h-7 rounded" style={{ background: c }} />
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium" style={{ color: "#6c6c75" }}>
                <Loader2 className="h-3 w-3 animate-spin" style={{ color: "var(--zb-accent)" }} />
                Tailoring copy &amp; SEO…
              </span>
              <span className="rounded-full px-3 py-1 text-[10.5px] font-bold text-white" style={{ background: "#0b0b0d" }}>
                Deploy →
              </span>
            </div>
          </div>

          {/* follow-up edit message */}
          <div className="ml-auto mt-3 w-fit max-w-[75%] rounded-2xl rounded-br-md bg-white/95 px-4 py-2.5 shadow-[0_14px_40px_-18px_rgba(0,0,0,0.5)]">
            <div className="text-[12.5px] font-medium leading-snug" style={{ color: "#0b0b0d" }}>
              Make the hero warmer and add a subscriptions page.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
