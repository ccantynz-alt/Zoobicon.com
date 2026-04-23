"use client";

import { useEffect, useMemo, useRef, useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, AlertTriangle } from "lucide-react";
import InstantRevealStage from "@/components/InstantRevealStage";

interface BrandPayload {
  name?: string;
  tagline?: string;
  colors?: { primary?: string; accent?: string };
  logoUrl?: string;
}

interface DomainSuggestion {
  domain: string;
  available?: boolean;
  price?: number;
}

interface BlogDraft {
  title: string;
  excerpt?: string;
}

interface SiteFile {
  path: string;
  content: string;
}

interface InstantPayload {
  brand?: BrandPayload;
  domains?: DomainSuggestion[];
  blogDrafts?: BlogDraft[];
  files?: SiteFile[];
  previewHtml?: string;
}

const PLACEHOLDERS = [
  "Acme Coffee Roasters",
  "Northbeach Surf School",
  "Lumen Dental Studio",
  "Pixel Forge Agency",
  "Wildroot Botanicals",
  "Apex Mountain Guides",
];

const STAGES = [
  { key: "brand", label: "Generating brand identity" },
  { key: "logo", label: "Designing logo" },
  { key: "site", label: "Building site preview" },
  { key: "domains", label: "Picking domains" },
  { key: "blog", label: "Drafting launch blog posts" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

export default function StartPage(): JSX.Element {
  const [businessName, setBusinessName] = useState<string>("");
  const [placeholderIdx, setPlaceholderIdx] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<InstantPayload | null>(null);
  const [doneStages, setDoneStages] = useState<Record<StageKey, boolean>>({
    brand: false,
    logo: false,
    site: false,
    domains: false,
    blog: false,
  });
  const prefetchedRef = useRef<string>("");

  useEffect(() => {
    const id = window.setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  const previewSrcDoc = useMemo<string>(() => {
    if (!payload) return "";
    if (payload.previewHtml) return payload.previewHtml;
    const html = payload.files?.find((f) => f.path.endsWith(".html"))?.content;
    if (html) return html;
    const merged = (payload.files ?? [])
      .map((f) => `<!-- ${f.path} -->\n${f.content}`)
      .join("\n\n");
    return `<!doctype html><html><body><pre style="font-family:ui-monospace,monospace;padding:24px">${merged
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</pre></body></html>`;
  }, [payload]);

  async function handlePrefetch(): Promise<void> {
    const name = businessName.trim();
    if (!name || name === prefetchedRef.current) return;
    prefetchedRef.current = name;
    try {
      await fetch("/api/onboarding/prefetch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessName: name }),
      });
    } catch {
      // Prefetch is best-effort; ignore errors.
    }
  }

  function runStageTimers(): () => void {
    const timers: number[] = [];
    STAGES.forEach((stage, i) => {
      const id = window.setTimeout(
        () => setDoneStages((d) => ({ ...d, [stage.key]: true })),
        700 + i * 900
      );
      timers.push(id);
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const name = businessName.trim();
    if (!name) {
      setError("Tell us what your business is called first.");
      return;
    }
    setError(null);
    setSubmitting(true);
    setPayload(null);
    setDoneStages({ brand: false, logo: false, site: false, domains: false, blog: false });
    const cancelTimers = runStageTimers();

    try {
      const res = await fetch("/api/onboarding/instant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessName: name }),
      });
      const data = (await res.json()) as InstantPayload & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status}).`);
      }
      setPayload(data);
      setDoneStages({ brand: true, logo: true, site: true, domains: true, blog: true });
    } catch (err) {
      cancelTimers();
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setDoneStages({ brand: false, logo: false, site: false, domains: false, blog: false });
    } finally {
      setSubmitting(false);
    }
  }

  const signupHref = useMemo<string>(() => {
    if (!payload) return "/auth/signup";
    const params = new URLSearchParams();
    params.set("prefilled", "1");
    if (businessName) params.set("businessName", businessName);
    if (payload.brand?.name) params.set("brand", payload.brand.name);
    const firstDomain = payload.domains?.[0]?.domain;
    if (firstDomain) params.set("domain", firstDomain);
    return `/auth/signup?${params.toString()}`;
  }, [payload, businessName]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-stone-500/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-[420px] w-[420px] rounded-full bg-stone-400/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[420px] w-[420px] rounded-full bg-stone-400/10 blur-3xl" />
      </div>

      <section className="mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-stone-300" />
          From a name to a launched business in under 60 seconds
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl md:text-7xl"
        >
          What&apos;s your business{" "}
          <span className="bg-gradient-to-r from-stone-300 via-stone-300 to-stone-200 bg-clip-text text-transparent">
            called?
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mx-auto mt-5 max-w-2xl text-balance text-base text-white/60 sm:text-lg"
        >
          Type the name. Watch us generate your brand, logo, website, domains and launch
          content live in front of you.
        </motion.p>

        <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-2xl">
          <div className="group relative rounded-2xl border border-white/15 bg-white/[0.04] p-2 backdrop-blur-xl transition focus-within:border-white/40 focus-within:bg-white/[0.07]">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onBlur={handlePrefetch}
                  disabled={submitting}
                  className="w-full bg-transparent px-4 py-4 text-lg tracking-tight text-white outline-none placeholder:text-white/30 sm:text-xl"
                  aria-label="Business name"
                />
                {!businessName ? (
                  <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-lg text-white/30 sm:text-xl">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={placeholderIdx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                      >
                        e.g. {PLACEHOLDERS[placeholderIdx]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={submitting || !businessName.trim()}
                className="group/btn inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-stone-500 via-stone-500 to-stone-400 px-5 py-3.5 text-sm font-semibold tracking-tight text-black shadow-lg shadow-stone-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Generating…" : "Launch it"}
                <ArrowRight className="h-4 w-4 transition group-hover/btn:translate-x-0.5" />
              </button>
            </div>
          </div>
        </form>

        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-6 flex max-w-2xl items-start gap-3 rounded-xl border border-stone-500/30 bg-stone-500/10 p-4 text-left text-sm text-stone-200"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none" />
            <div>
              <div className="font-semibold">We hit a snag.</div>
              <div className="mt-0.5 text-stone-200/80">{error}</div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="mt-2 text-xs font-medium text-stone-100 underline underline-offset-2"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        ) : null}
      </section>

      {(submitting || payload) && (
        <section className="mx-auto max-w-5xl px-6 pb-32">
          <div className="grid gap-4 md:grid-cols-2">
            <InstantRevealStage label={STAGES[0].label} done={doneStages.brand}>
              {payload?.brand ? (
                <div>
                  <div className="text-2xl font-semibold tracking-tight">
                    {payload.brand.name ?? businessName}
                  </div>
                  {payload.brand.tagline ? (
                    <div className="mt-1 text-sm text-white/60">{payload.brand.tagline}</div>
                  ) : null}
                  {payload.brand.colors ? (
                    <div className="mt-3 flex gap-2">
                      {payload.brand.colors.primary ? (
                        <span
                          className="h-6 w-6 rounded-full border border-white/20"
                          style={{ background: payload.brand.colors.primary }}
                        />
                      ) : null}
                      {payload.brand.colors.accent ? (
                        <span
                          className="h-6 w-6 rounded-full border border-white/20"
                          style={{ background: payload.brand.colors.accent }}
                        />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </InstantRevealStage>

            <InstantRevealStage label={STAGES[1].label} done={doneStages.logo}>
              {payload?.brand?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={payload.brand.logoUrl}
                  alt="Generated logo"
                  className="h-24 w-24 rounded-xl border border-white/10 bg-white/5 object-contain p-2"
                />
              ) : null}
            </InstantRevealStage>

            <div className="md:col-span-2">
              <InstantRevealStage label={STAGES[2].label} done={doneStages.site}>
                {previewSrcDoc ? (
                  <div className="overflow-hidden rounded-xl border border-white/10 bg-white">
                    <iframe
                      title="Site preview"
                      srcDoc={previewSrcDoc}
                      className="h-[520px] w-full"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : null}
              </InstantRevealStage>
            </div>

            <InstantRevealStage label={STAGES[3].label} done={doneStages.domains}>
              {payload?.domains?.length ? (
                <ul className="space-y-2">
                  {payload.domains.slice(0, 5).map((d) => (
                    <li
                      key={d.domain}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <span className="font-mono">{d.domain}</span>
                      <span
                        className={`text-xs ${
                          d.available === false ? "text-stone-300" : "text-stone-300"
                        }`}
                      >
                        {d.available === false
                          ? "taken"
                          : d.price
                            ? `$${d.price.toFixed(2)}/yr`
                            : "available"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </InstantRevealStage>

            <InstantRevealStage label={STAGES[4].label} done={doneStages.blog}>
              {payload?.blogDrafts?.length ? (
                <ul className="space-y-2">
                  {payload.blogDrafts.slice(0, 3).map((b) => (
                    <li
                      key={b.title}
                      className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                    >
                      <div className="text-sm font-semibold tracking-tight">{b.title}</div>
                      {b.excerpt ? (
                        <div className="mt-0.5 text-xs text-white/60">{b.excerpt}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </InstantRevealStage>
          </div>

          <AnimatePresence>
            {payload ? (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-12 flex flex-col items-center"
              >
                <a
                  href={signupHref}
                  className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-stone-500 via-stone-500 to-stone-400 px-8 py-5 text-base font-semibold tracking-tight text-black shadow-2xl shadow-stone-500/30 transition hover:scale-[1.03]"
                >
                  Claim this for $49/mo
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </a>
                <p className="mt-3 text-xs text-white/50">
                  Includes your domain, hosting, email and everything you just saw.
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>
      )}
    </main>
  );
}
