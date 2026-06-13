"use client";

/**
 * THE AI Website Builder — Zoobicon's one product.
 *
 * Architecture (the V2 reliability core, now at the real product URL):
 * the browser NEVER executes generated code. The server assembles the page
 * from the $100K component registry, renders it to static HTML
 * (react-dom/server), and streams it section-by-section over SSE into a
 * srcDoc iframe. AI then tailors each section's copy in the background and
 * hot-swaps it in place. If anything AI-side fails, the polished base page
 * stays — the preview can never be blank. Works identically on iPad WebKit,
 * Safari, everything.
 *
 * Design: ZOOBICON BOLD (Rule 37) — clean white canvas, near-black ink,
 * one red accent, Plus Jakarta Sans display. No dark chrome, no cyberpunk.
 *
 * Endpoints: /api/v2/build/stream (SSE) → /api/v2/build (fallback)
 *            /api/v2/edit (conversational refine — one section hot-swap)
 */

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  Check,
  Download,
  ExternalLink,
  Loader2,
  Monitor,
  MousePointerClick,
  RefreshCw,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react";

const EXAMPLES = [
  "A SaaS analytics platform for product teams",
  "A warm artisan bakery in Brooklyn with online ordering",
  "A minimal portfolio for a wedding photographer",
  "A boutique law firm with fixed-fee pricing",
  "A modern gym with class schedules and trainer bios",
];

type Status = "idle" | "building" | "done" | "error";
type Device = "desktop" | "tablet" | "mobile";

interface BuildResult {
  html: string;
  componentIds: string[];
  industry: string;
  aiUsed: boolean;
}

interface ChatMsg {
  role: "user" | "system";
  text: string;
  ok?: boolean;
  note?: string;
}

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

function BuilderInner() {
  const searchParams = useSearchParams();

  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [shell, setShell] = useState<string | null>(null);
  const [result, setResult] = useState<BuildResult | null>(null);
  // When the page was built by the AI engine it's a single finished HTML
  // document (not streamed sections); aiHtml holds that document so the
  // refine chat can edit the whole page. null ⇒ the streamed/registry engine.
  const [aiHtml, setAiHtml] = useState<string | null>(null);
  const [totalSections, setTotalSections] = useState(0);
  const [sectionsIn, setSectionsIn] = useState(0); // base sections landed
  const [tailoring, setTailoring] = useState(false); // AI copy pass running
  const [device, setDevice] = useState<Device>("desktop");

  // Conversational refine loop.
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [editing, setEditing] = useState(false);
  // Point-and-edit: click a section in the preview to target the next edit.
  const [pickMode, setPickMode] = useState(false);
  const [editTarget, setEditTarget] = useState<{ index: number; category: string } | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const readyRef = useRef(false);
  const queueRef = useRef<Array<{ index: number; html: string; js?: string }>>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const genIdRef = useRef(0); // guards against a stale stream writing state
  const autoStartedRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  // Live source per section index — refine edits stack on the real current code.
  const sectionMetaRef = useRef<Map<number, { category: string; code: string }>>(new Map());

  // The srcDoc iframe posts zb-ready when its hot-swap listener is live;
  // flush anything that streamed in before that.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === "zb-ready") {
        readyRef.current = true;
        const win = iframeRef.current?.contentWindow;
        if (win) {
          for (const s of queueRef.current)
            win.postMessage({ type: "zb-section", index: s.index, html: s.html, js: s.js }, "*");
        }
        queueRef.current = [];
      } else if (e.data && e.data.type === "zb-section-pick" && typeof e.data.index === "number") {
        const idx = e.data.index as number;
        const meta = sectionMetaRef.current.get(idx);
        setEditTarget({ index: idx, category: meta?.category || `section ${idx + 1}` });
        setPickMode(false);
        iframeRef.current?.contentWindow?.postMessage({ type: "zb-edit-mode", on: false }, "*");
        chatInputRef.current?.focus();
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat]);

  const pushSection = useCallback((index: number, html: string, js?: string) => {
    if (readyRef.current && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "zb-section", index, html, js }, "*");
    } else {
      queueRef.current.push({ index, html, js });
    }
  }, []);

  // One-shot fallback if the SSE stream can't be established at all.
  const buildFallback = useCallback(async (text: string, genId: number) => {
    const res = await fetch("/api/v2/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text }),
    });
    if (genId !== genIdRef.current) return;
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    const data = (await res.json()) as { ok: boolean; error?: string } & BuildResult;
    if (!data.ok) throw new Error(data.error || "Build failed");
    if (genId !== genIdRef.current) return;
    setShell(data.html);
    setResult(data);
    setStatus("done");
  }, []);

  const build = useCallback(
    async (p: string) => {
      const text = p.trim();
      if (!text) return;
      const genId = ++genIdRef.current;
      setStatus("building");
      setError("");
      setResult(null);
      setShell(null);
      setAiHtml(null);
      setTotalSections(0);
      setSectionsIn(0);
      setTailoring(false);
      setChat([]);
      setPickMode(false);
      setEditTarget(null);
      readyRef.current = false;
      queueRef.current = [];
      sectionMetaRef.current = new Map();
      setElapsed(0);
      const started = Date.now();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setElapsed((Date.now() - started) / 1000), 100);

      // PRIMARY ENGINE: the model designs + writes the whole page and returns
      // a finished HTML document. Bespoke ($100K) output, and the browser
      // executes none of it — it just displays it — so it can't blank.
      try {
        const aiRes = await fetch("/api/v2/build/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        });
        if (genId !== genIdRef.current) return;
        if (aiRes.ok) {
          const data = (await aiRes.json().catch(() => null)) as
            | { ok: boolean; html?: string; engine?: string; industry?: string; componentIds?: string[] }
            | null;
          if (genId !== genIdRef.current) return;
          if (data?.ok && data.html) {
            setShell(data.html);
            // Only the true AI engine yields an editable single-document page;
            // the registry safety-net falls through to section-based editing.
            setAiHtml(data.engine === "ai" ? data.html : null);
            setResult({
              html: data.html,
              componentIds: data.componentIds || [],
              industry: data.industry || "",
              aiUsed: data.engine === "ai",
            });
            setTailoring(false);
            setStatus("done");
            return;
          }
        }
      } catch {
        // AI route unreachable — fall through to the streaming engine below,
        // which is itself reliable and has its own one-shot fallback.
      }

      try {
        const res = await fetch("/api/v2/build/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        });
        if (!res.ok || !res.body) throw new Error(`stream unavailable (HTTP ${res.status})`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        let gotAnything = false;
        let sawError = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (genId !== genIdRef.current) {
            // A newer build started — abandon this stream entirely.
            try { await reader.cancel(); } catch { /* already closed */ }
            return;
          }
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split("\n\n");
          buf = parts.pop() || "";
          for (const part of parts) {
            const line = part.replace(/^data:\s?/, "").trim();
            if (!line) continue;
            let evt: Record<string, unknown>;
            try {
              evt = JSON.parse(line);
            } catch {
              continue;
            }
            gotAnything = true;
            if (evt.type === "meta") {
              setShell(evt.shell as string);
              setTotalSections((evt.count as number) || 0);
              setTailoring(true);
            } else if (evt.type === "section") {
              const idx = evt.index as number;
              pushSection(idx, evt.html as string, evt.js as string | undefined);
              if (typeof evt.code === "string") {
                sectionMetaRef.current.set(idx, {
                  category: (evt.category as string) || "",
                  code: evt.code as string,
                });
              }
              if (evt.ai === false) setSectionsIn((n) => n + 1);
            } else if (evt.type === "done") {
              setResult({
                html: evt.html as string,
                componentIds: (evt.componentIds as string[]) || [],
                industry: (evt.industry as string) || "",
                aiUsed: Boolean(evt.aiUsed),
              });
              setTailoring(false);
              setStatus("done");
            } else if (evt.type === "error") {
              sawError = (evt.error as string) || "Build failed";
            }
          }
        }

        if (genId !== genIdRef.current) return;
        if (sawError && !gotAnything) throw new Error(sawError);
        // Stream ended without a done event (rare) — settle the UI anyway.
        setTailoring(false);
        setStatus((s) => (s === "building" ? "done" : s));
      } catch (streamErr) {
        if (genId !== genIdRef.current) return;
        try {
          await buildFallback(text, genId);
        } catch (err) {
          if (genId !== genIdRef.current) return;
          setError(
            err instanceof Error
              ? err.message
              : streamErr instanceof Error
                ? streamErr.message
                : "Build failed",
          );
          setStatus("error");
        }
      } finally {
        if (genId === genIdRef.current && timerRef.current) clearInterval(timerRef.current);
      }
    },
    [buildFallback, pushSection],
  );

  // Prefill + auto-build from ?prompt= (homepage hero, SEO pages, share forks).
  useEffect(() => {
    if (autoStartedRef.current) return;
    const p = searchParams.get("prompt");
    if (p && p.trim()) {
      autoStartedRef.current = true;
      setPrompt(p);
      build(p);
    }
  }, [searchParams, build]);

  // Conversational refine — hot-swaps one section, no rebuild.
  const applyEdit = useCallback(
    async (raw: string) => {
      const instruction = raw.trim();
      if (!instruction || editing || status === "building") return;

      // AI-built page: it's one finished document, so edit the whole page and
      // hot-swap the result back into the preview.
      if (aiHtml) {
        setChat((c) => [...c, { role: "user", text: instruction }]);
        setChatInput("");
        setEditing(true);
        try {
          const res = await fetch("/api/v2/edit/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html: aiHtml, instruction }),
          });
          const data = (await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }))) as {
            ok: boolean;
            html?: string;
            error?: string;
          };
          if (!data.ok || !data.html) {
            setChat((c) => [...c, { role: "system", text: data.error || "That change didn't land — try rewording it.", ok: false }]);
            return;
          }
          setAiHtml(data.html);
          setShell(data.html);
          setChat((c) => [...c, { role: "system", text: "Updated your site.", ok: true }]);
        } catch (err) {
          setChat((c) => [...c, { role: "system", text: err instanceof Error ? err.message : "Edit failed — please try again.", ok: false }]);
        } finally {
          setEditing(false);
        }
        return;
      }

      const sections = Array.from(sectionMetaRef.current.entries()).map(([index, m]) => ({
        index,
        category: m.category,
        code: m.code,
      }));
      if (sections.length === 0) {
        setChat((c) => [...c, { role: "system", text: "Build a site first, then refine it here.", ok: false }]);
        return;
      }
      setChat((c) => [...c, { role: "user", text: instruction }]);
      setChatInput("");
      setEditing(true);
      try {
        const res = await fetch("/api/v2/edit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instruction,
            sections,
            ...(editTarget ? { targetIndex: editTarget.index } : {}),
          }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          error?: string;
          index?: number;
          html?: string;
          js?: string;
          code?: string;
          category?: string;
        };
        if (!data.ok) {
          setChat((c) => [...c, { role: "system", text: data.error || "That change didn't land — try rewording it.", ok: false }]);
          return;
        }
        if (typeof data.index === "number" && data.html) {
          pushSection(data.index, data.html, data.js);
          if (typeof data.code === "string") {
            sectionMetaRef.current.set(data.index, {
              category: data.category || sectionMetaRef.current.get(data.index)?.category || "",
              code: data.code,
            });
          }
        }
        setChat((c) => [
          ...c,
          { role: "system", text: `Updated the ${data.category || "section"}.`, ok: true },
        ]);
        setEditTarget(null);
      } catch (err) {
        setChat((c) => [
          ...c,
          { role: "system", text: err instanceof Error ? err.message : "Edit failed — please try again.", ok: false },
        ]);
      } finally {
        setEditing(false);
      }
    },
    [editing, status, pushSection, editTarget, aiHtml],
  );

  // Export the CURRENT page (including refine edits) as a clean, deployable
  // single-file site. Reads the live iframe document and strips the
  // streaming runtime; falls back to the build artifact if unreadable.
  const getExportHtml = useCallback((): string | null => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc?.documentElement && doc.body && doc.body.innerHTML.trim()) {
        const clone = doc.documentElement.cloneNode(true) as HTMLElement;
        clone.querySelectorAll("script").forEach((s) => {
          const t = s.textContent || "";
          if (s.getAttribute("type") === "importmap" || t.includes("__ZB__")) s.remove();
        });
        return `<!DOCTYPE html>\n${clone.outerHTML}`;
      }
    } catch {
      /* cross-origin or detached — fall back to the build artifact */
    }
    return result?.html ?? null;
  }, [result]);

  const downloadHtml = useCallback(() => {
    const html = getExportHtml();
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zoobicon-site.html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [getExportHtml]);

  const openInTab = useCallback(() => {
    const html = getExportHtml();
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, [getExportHtml]);

  const building = status === "building";
  const hasPreview = (building || status === "done") && shell;

  return (
    <div
      className="flex h-[100dvh] flex-col"
      style={{ background: "var(--zb-bg)", color: "var(--zb-ink)" }}
    >
      {/* ── Top bar — clean white chrome ─────────────────────────────── */}
      <header
        className="flex shrink-0 items-center justify-between px-4 sm:px-6"
        style={{ height: 60, background: "var(--zb-surface)", borderBottom: "1px solid var(--zb-line)" }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none", color: "var(--zb-ink)" }}>
            {/* Craig 2026-06-12: red Z on an off-white tile (was white Z on red) */}
            <span
              className="zb-display flex h-8 w-8 items-center justify-center rounded-lg text-[19px]"
              style={{ background: "var(--zb-bg)", border: "1px solid var(--zb-line)", color: "var(--zb-accent)" }}
            >
              Z
            </span>
            <span className="zb-display text-[19px]">Zoobicon</span>
          </Link>
          <span
            className="hidden rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] sm:inline-block"
            style={{ background: "rgba(232,64,43,0.08)", color: "var(--zb-accent)", border: "1px solid rgba(232,64,43,0.22)" }}
          >
            AI Builder
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="zb-chip-light hidden md:inline-flex">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "#2e9e5b" }} />
            Server-rendered preview · reliable on every device
          </span>
          <Link
            href="/pricing"
            className="text-[13px] font-semibold"
            style={{ color: "var(--zb-muted)", textDecoration: "none" }}
          >
            Pricing
          </Link>
        </div>
      </header>

      {/* ── Workspace ────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Left: controls */}
        <aside
          className="flex w-full shrink-0 flex-col overflow-y-auto px-5 py-6 sm:px-7 lg:max-w-[420px]"
          style={{ background: "var(--zb-surface)", borderRight: "1px solid var(--zb-line)" }}
        >
          <h1 className="zb-display text-[clamp(28px,4vw,36px)]">
            Describe it. <span className="zb-mark">Watch it build.</span>
          </h1>
          <p className="mt-3 text-[14.5px] leading-relaxed" style={{ color: "var(--zb-muted)" }}>
            One sentence becomes a complete website — assembled from
            hand-crafted, agency-grade sections, rendered on our servers, and
            tailored to your business by AI.
          </p>

          {/* Prompt */}
          <div className="mt-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) build(prompt);
              }}
              rows={3}
              placeholder="A warm artisan bakery in Brooklyn with online ordering…"
              className="zb-input-light w-full resize-none rounded-2xl px-4 py-3.5 text-[15px] leading-relaxed outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(232,64,43,0.18)]"
              style={{ background: "var(--zb-bg)", border: "1px solid var(--zb-line)", color: "var(--zb-ink)" }}
            />
            <button
              onClick={() => build(prompt)}
              disabled={building || !prompt.trim()}
              className="zb-btn-ink mt-3 w-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              {building ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Building… {elapsed.toFixed(1)}s
                </>
              ) : (
                <>
                  Build my website
                  <ArrowRight size={16} />
                </>
              )}
            </button>
            <p className="mt-2 text-center text-[11px]" style={{ color: "var(--zb-muted)" }}>
              ⌘/Ctrl + Enter to build
            </p>
          </div>

          {/* Examples (idle only) */}
          <AnimatePresence initial={false}>
            {status === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0, marginTop: 0, overflow: "hidden" }}
                className="mt-7"
              >
                <div className="zb-eyebrow" style={{ color: "var(--zb-accent)" }}>
                  Try an example
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => {
                        setPrompt(ex);
                        build(ex);
                      }}
                      className="rounded-xl px-3.5 py-2.5 text-left text-[13px] transition-all hover:-translate-y-0.5"
                      style={{ background: "var(--zb-bg)", border: "1px solid var(--zb-line)", color: "var(--zb-ink)" }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress (building) */}
          <AnimatePresence>
            {building && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="zb-card mt-6 p-4"
                style={{ borderRadius: 16 }}
              >
                <ProgressStep done={Boolean(shell)} active={!shell} label="Selecting your sections" />
                <ProgressStep
                  done={totalSections > 0 && sectionsIn >= totalSections}
                  active={Boolean(shell) && sectionsIn < totalSections}
                  label={
                    totalSections > 0
                      ? `Rendering your page · ${Math.min(sectionsIn, totalSections)}/${totalSections} sections`
                      : "Rendering your page"
                  }
                />
                <ProgressStep done={false} active={tailoring} label="AI tailoring your copy" last />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary + refine (done) */}
          {status === "done" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex min-h-0 flex-1 flex-col">
              <div className="zb-card p-4" style={{ borderRadius: 16 }}>
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: "rgba(46,158,91,0.12)", color: "#2e9e5b" }}
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                  <span className="text-[14px] font-bold">Your site is live in the preview</span>
                </div>
                <div className="mt-2 text-[12.5px]" style={{ color: "var(--zb-muted)" }}>
                  {(result?.componentIds.length ?? sectionMetaRef.current.size) || "—"} sections
                  {result?.industry ? ` · ${result.industry}` : ""}
                  {" · "}
                  {result?.aiUsed ? "AI-tailored copy" : "polished template copy"} · built in {elapsed.toFixed(1)}s
                </div>
              </div>

              {/* Refine chat */}
              <div className="mt-5 flex min-h-0 flex-1 flex-col">
                <div className="zb-eyebrow" style={{ color: "var(--zb-accent)" }}>
                  <Sparkles size={12} />
                  Refine it — just say what to change
                </div>
                <div className="mt-3 flex max-h-[220px] flex-col gap-2 overflow-y-auto lg:max-h-none lg:flex-1">
                  {chat.length === 0 && (
                    <div className="rounded-xl px-3.5 py-3 text-[12.5px] leading-relaxed" style={{ background: "var(--zb-bg)", color: "var(--zb-muted)" }}>
                      Try: &ldquo;Make the hero headline punchier&rdquo; ·
                      &ldquo;Change the pricing to three tiers&rdquo; ·
                      &ldquo;Rewrite the FAQ for beginners&rdquo;
                    </div>
                  )}
                  {chat.map((m, i) =>
                    m.role === "user" ? (
                      <div
                        key={i}
                        className="self-end rounded-2xl rounded-br-md px-3.5 py-2 text-[13px]"
                        style={{ background: "var(--zb-ink)", color: "#ffffff", maxWidth: "85%" }}
                      >
                        {m.text}
                      </div>
                    ) : (
                      <div
                        key={i}
                        className="self-start rounded-2xl rounded-bl-md px-3.5 py-2 text-[13px]"
                        style={{
                          background: m.ok ? "rgba(46,158,91,0.1)" : "rgba(232,64,43,0.08)",
                          color: m.ok ? "#1f7a45" : "var(--zb-accent)",
                          maxWidth: "85%",
                        }}
                      >
                        {m.text}
                      </div>
                    ),
                  )}
                  {editing && (
                    <div
                      className="flex items-center gap-2 self-start rounded-2xl rounded-bl-md px-3.5 py-2 text-[13px]"
                      style={{ background: "var(--zb-bg)", color: "var(--zb-muted)" }}
                    >
                      <Loader2 size={13} className="animate-spin" />
                      Updating that section…
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                {editTarget && (
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{ background: "rgba(232,64,43,0.08)", color: "var(--zb-accent)", border: "1px solid rgba(232,64,43,0.22)" }}
                    >
                      <MousePointerClick size={11} />
                      Editing: {editTarget.category}
                      <button
                        onClick={() => setEditTarget(null)}
                        aria-label="Clear section target"
                        className="ml-0.5 font-bold hover:opacity-60"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                )}
                <div className="mt-3 flex items-end gap-2">
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        applyEdit(chatInput);
                      }
                    }}
                    rows={1}
                    placeholder={editTarget ? `What should change in the ${editTarget.category}?` : "Make the hero darker…"}
                    disabled={editing}
                    className="zb-input-light min-h-[44px] flex-1 resize-none rounded-xl px-3.5 py-2.5 text-[13.5px] outline-none transition-shadow focus:shadow-[0_0_0_3px_rgba(232,64,43,0.18)] disabled:opacity-60"
                    style={{ background: "var(--zb-bg)", border: "1px solid var(--zb-line)", color: "var(--zb-ink)" }}
                  />
                  <button
                    onClick={() => applyEdit(chatInput)}
                    disabled={editing || !chatInput.trim()}
                    aria-label="Apply change"
                    className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ background: "var(--zb-ink)", color: "#ffffff" }}
                  >
                    <ArrowUp size={17} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <div className="mt-auto pt-6 text-[11px] leading-relaxed" style={{ color: "var(--zb-muted)" }}>
            Your site is designed and built on our servers, then shown to you
            as a finished page — menus, accordions and animations included. If
            anything can&rsquo;t load, you still get a complete page. Your
            preview never breaks.
          </div>
        </aside>

        {/* Right: preview */}
        <main className="relative flex min-h-[55dvh] flex-1 flex-col overflow-hidden" style={{ background: "#f1efe8" }}>
          {/* Idle empty state */}
          {status === "idle" && (
            <div className="flex flex-1 items-center justify-center px-8 text-center">
              <div style={{ maxWidth: 400 }}>
                <div
                  className="zb-display mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-[26px]"
                  style={{ background: "var(--zb-surface)", border: "1px solid var(--zb-line)", color: "var(--zb-accent)" }}
                >
                  Z
                </div>
                <h2 className="zb-display text-[22px]">Your website appears here</h2>
                <p className="mt-2 text-[14px]" style={{ color: "var(--zb-muted)" }}>
                  Describe your business on the left and press build. A complete,
                  custom page is designed and built just for you.
                </p>
              </div>
            </div>
          )}

          {/* Building, shell not yet arrived (~1s) */}
          {building && !shell && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div
                  className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full"
                  style={{ border: "3px solid var(--zb-line)", borderTopColor: "var(--zb-accent)" }}
                />
                <p className="text-[14px] font-semibold">
                  {elapsed < 4
                    ? "Understanding your business…"
                    : elapsed < 12
                    ? "Designing a layout that fits…"
                    : elapsed < 24
                    ? "Choosing colours, type & imagery…"
                    : elapsed < 45
                    ? "Writing your page…"
                    : "Polishing the details…"}
                </p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--zb-muted)" }}>
                  {elapsed.toFixed(1)}s
                </p>
              </div>
            </div>
          )}

          {/* Live preview */}
          {hasPreview && (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Browser chrome */}
              <div
                className="flex shrink-0 flex-wrap items-center gap-2 px-3.5 py-2"
                style={{ background: "var(--zb-surface)", borderBottom: "1px solid var(--zb-line)" }}
              >
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#e9e6dd" }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#e9e6dd" }} />
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#e9e6dd" }} />
                </span>
                <span className="font-mono text-[11px]" style={{ color: "var(--zb-muted)" }}>
                  preview
                </span>
                {tailoring && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold"
                    style={{ background: "rgba(232,64,43,0.08)", color: "var(--zb-accent)" }}
                  >
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "var(--zb-accent)" }} />
                    AI tailoring copy…
                  </span>
                )}

                <span className="flex-1" />

                {/* Device toggle */}
                <span
                  className="hidden items-center gap-0.5 rounded-full p-0.5 sm:flex"
                  style={{ background: "var(--zb-bg)", border: "1px solid var(--zb-line)" }}
                >
                  {(
                    [
                      ["desktop", Monitor],
                      ["tablet", Tablet],
                      ["mobile", Smartphone],
                    ] as Array<[Device, typeof Monitor]>
                  ).map(([d, Icon]) => (
                    <button
                      key={d}
                      onClick={() => setDevice(d)}
                      aria-label={`${d} preview`}
                      className="flex h-7 w-8 items-center justify-center rounded-full transition-colors"
                      style={
                        device === d
                          ? { background: "var(--zb-ink)", color: "#ffffff" }
                          : { color: "var(--zb-muted)" }
                      }
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </span>

                {/* Actions */}
                {status === "done" && (
                  <span className="flex items-center gap-1.5">
                    {!aiHtml && (
                      <button
                        onClick={() => {
                          const next = !pickMode;
                          setPickMode(next);
                          iframeRef.current?.contentWindow?.postMessage({ type: "zb-edit-mode", on: next }, "*");
                        }}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-transform hover:-translate-y-0.5"
                        style={
                          pickMode
                            ? { background: "var(--zb-accent)", color: "#ffffff" }
                            : { background: "var(--zb-bg)", border: "1px solid var(--zb-line)", color: "var(--zb-ink)" }
                        }
                        title="Click a section in the preview, then say what to change"
                      >
                        <MousePointerClick size={13} />
                        <span className="hidden md:inline">{pickMode ? "Click a section…" : "Point & edit"}</span>
                      </button>
                    )}
                    <ChromeButton onClick={() => build(prompt)} label="Rebuild">
                      <RefreshCw size={13} />
                    </ChromeButton>
                    <ChromeButton onClick={openInTab} label="Open in new tab">
                      <ExternalLink size={13} />
                    </ChromeButton>
                    <button
                      onClick={downloadHtml}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-transform hover:-translate-y-0.5"
                      style={{ background: "var(--zb-accent)", color: "#ffffff" }}
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">Download site</span>
                    </button>
                  </span>
                )}
              </div>

              {/* Iframe stage */}
              <div className="flex min-h-0 flex-1 justify-center overflow-auto" style={{ padding: device === "desktop" ? 0 : 20 }}>
                <div
                  className="h-full transition-[width] duration-300 ease-out"
                  style={{
                    width: DEVICE_WIDTH[device],
                    maxWidth: "100%",
                    ...(device !== "desktop"
                      ? { borderRadius: 14, overflow: "hidden", boxShadow: "0 22px 60px -24px rgba(11,11,13,0.3)", border: "1px solid var(--zb-line)" }
                      : {}),
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    title="Your website preview"
                    srcDoc={shell ?? undefined}
                    className="h-full w-full border-0"
                    style={{ background: "#ffffff" }}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="flex flex-1 items-center justify-center px-8 text-center">
              <div className="zb-card p-8" style={{ maxWidth: 440 }}>
                <h2 className="zb-display text-[20px]" style={{ color: "var(--zb-accent)" }}>
                  That build hit a snag
                </h2>
                <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--zb-muted)" }}>
                  {error || "Something went wrong on our side."}
                </p>
                <button onClick={() => build(prompt)} className="zb-btn-ink mt-5">
                  <RefreshCw size={15} />
                  Try again
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ProgressStep({
  done,
  active,
  label,
  last,
}: {
  done: boolean;
  active: boolean;
  label: string;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${last ? "" : "mb-2.5"}`}>
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
        style={
          done
            ? { background: "rgba(46,158,91,0.12)", color: "#2e9e5b" }
            : active
              ? { background: "rgba(232,64,43,0.1)", color: "var(--zb-accent)" }
              : { background: "var(--zb-bg)", color: "var(--zb-muted)" }
        }
      >
        {done ? <Check size={11} strokeWidth={3} /> : active ? <Loader2 size={11} className="animate-spin" /> : <span className="h-1 w-1 rounded-full" style={{ background: "currentColor" }} />}
      </span>
      <span
        className="text-[13px]"
        style={{ color: done || active ? "var(--zb-ink)" : "var(--zb-muted)", fontWeight: active ? 600 : 400 }}
      >
        {label}
      </span>
    </div>
  );
}

function ChromeButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:opacity-70"
      style={{ background: "var(--zb-bg)", border: "1px solid var(--zb-line)", color: "var(--zb-ink)" }}
    >
      {children}
    </button>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="h-[100dvh]" style={{ background: "var(--zb-bg)" }} />}>
      <BuilderInner />
    </Suspense>
  );
}
