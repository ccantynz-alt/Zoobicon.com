"use client";

/**
 * DubPanel — One-click multi-language video dub.
 *
 * Streams progress events from /api/video-creator/dub and renders a card
 * grid with the dubbed videos. Editorial-light styling — bone surfaces,
 * gold accents on selection, ink button.
 *
 * Per Bible Law 8: every step that fails surfaces a clear error message
 * naming the language and the underlying cause.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Globe,
  Loader2,
  Check,
  Download,
  AlertTriangle,
  Languages,
  Mic,
  Wand2,
  Square,
  ChevronDown,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Language catalogue — kept in lockstep with /api/video-creator/dub.
// ─────────────────────────────────────────────────────────────────────────────

export interface DubLang {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: "European" | "Asian" | "Latin American" | "Middle Eastern" | "African";
}

export const DUB_LANGUAGES: DubLang[] = [
  // European
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", region: "European" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", region: "European" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", region: "European" },
  { code: "it", name: "Italian", nativeName: "Italiano", flag: "🇮🇹", region: "European" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹", region: "European" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands", flag: "🇳🇱", region: "European" },
  { code: "sv", name: "Swedish", nativeName: "Svenska", flag: "🇸🇪", region: "European" },
  { code: "no", name: "Norwegian", nativeName: "Norsk", flag: "🇳🇴", region: "European" },
  { code: "da", name: "Danish", nativeName: "Dansk", flag: "🇩🇰", region: "European" },
  { code: "fi", name: "Finnish", nativeName: "Suomi", flag: "🇫🇮", region: "European" },
  { code: "pl", name: "Polish", nativeName: "Polski", flag: "🇵🇱", region: "European" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿", region: "European" },
  { code: "el", name: "Greek", nativeName: "Ελληνικά", flag: "🇬🇷", region: "European" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴", region: "European" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺", region: "European" },
  { code: "uk", name: "Ukrainian", nativeName: "Українська", flag: "🇺🇦", region: "European" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", region: "European" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", region: "European" },
  // Asian
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", region: "Asian" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", region: "Asian" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", region: "Asian" },
  { code: "zh-tw", name: "Chinese (Traditional)", nativeName: "繁體中文", flag: "🇹🇼", region: "Asian" },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย", flag: "🇹🇭", region: "Asian" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", region: "Asian" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩", region: "Asian" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu", flag: "🇲🇾", region: "Asian" },
  { code: "tl", name: "Filipino", nativeName: "Filipino", flag: "🇵🇭", region: "Asian" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", region: "Asian" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇧🇩", region: "Asian" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇱🇰", region: "Asian" },
  { code: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", region: "Asian" },
  // Latin American
  { code: "es-mx", name: "Spanish (Mexico)", nativeName: "Español (México)", flag: "🇲🇽", region: "Latin American" },
  { code: "pt-br", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)", flag: "🇧🇷", region: "Latin American" },
  // Middle Eastern
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", region: "Middle Eastern" },
  { code: "he", name: "Hebrew", nativeName: "עברית", flag: "🇮🇱", region: "Middle Eastern" },
  { code: "fa", name: "Persian", nativeName: "فارسی", flag: "🇮🇷", region: "Middle Eastern" },
  // African
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪", region: "African" },
  { code: "af", name: "Afrikaans", nativeName: "Afrikaans", flag: "🇿🇦", region: "African" },
];

const REGIONS: Array<DubLang["region"]> = ["European", "Asian", "Latin American", "Middle Eastern", "African"];

const DEFAULT_TOP_8 = ["es", "fr", "de", "ja", "zh", "pt", "it", "hi"];

// ─────────────────────────────────────────────────────────────────────────────
// Per-language progress state
// ─────────────────────────────────────────────────────────────────────────────

type DubStep = "queued" | "translating" | "voicing" | "lip-syncing" | "done" | "failed";

interface DubLangState {
  code: string;
  step: DubStep;
  translatedScript?: string;
  audioUrl?: string;
  videoUrl?: string;
  durationSec?: number;
  voiceProvider?: "fish-audio-s1" | "replicate-fallback";
  error?: string;
  errorStep?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component props
// ─────────────────────────────────────────────────────────────────────────────

export interface DubPanelProps {
  // Required to know what to translate.
  sourceScript: string;
  // One of these is required so we can re-lip-sync.
  sourceVideoUrl?: string;
  sourceImageUrl?: string;
  // Optional baseline voiceover for future voice-clone matching.
  sourceAudioUrl?: string;
  // Title shown on the card grid (e.g. "Polished Spokesperson Video").
  sourceLabel?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DubPanel({
  sourceScript,
  sourceVideoUrl,
  sourceImageUrl,
  sourceAudioUrl,
  sourceLabel,
}: DubPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(DEFAULT_TOP_8));
  const [voiceMatchSource, setVoiceMatchSource] = useState(false);
  const [running, setRunning] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [state, setState] = useState<Record<string, DubLangState>>({});

  const abortRef = useRef<AbortController | null>(null);

  const groupedByRegion = useMemo(() => {
    const map: Record<string, DubLang[]> = {};
    for (const r of REGIONS) map[r] = [];
    for (const l of DUB_LANGUAGES) map[l.region].push(l);
    return map;
  }, []);

  const toggle = useCallback(
    (code: string) => {
      if (running) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(code)) next.delete(code);
        else next.add(code);
        return next;
      });
    },
    [running]
  );

  const selectRegion = useCallback(
    (region: DubLang["region"]) => {
      if (running) return;
      const codes = groupedByRegion[region].map((l) => l.code);
      setSelected((prev) => {
        const next = new Set(prev);
        codes.forEach((c) => next.add(c));
        return next;
      });
    },
    [groupedByRegion, running]
  );

  const clearAll = useCallback(() => {
    if (running) return;
    setSelected(new Set());
  }, [running]);

  const presetTop8 = useCallback(() => {
    if (running) return;
    setSelected(new Set(DEFAULT_TOP_8));
  }, [running]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setRunning(false);
  }, []);

  const startDub = useCallback(async () => {
    if (running) return;
    if (selected.size === 0) {
      setGlobalError("Pick at least one language to dub into.");
      return;
    }
    if (!sourceScript.trim()) {
      setGlobalError("Source script is empty — generate or paste a script before dubbing.");
      return;
    }
    if (!sourceVideoUrl && !sourceImageUrl) {
      setGlobalError(
        "We need either the rendered video or the avatar still to re-lip-sync against. Render the spokesperson first, then come back."
      );
      return;
    }

    setGlobalError(null);
    setWarnings([]);

    // Initialise per-language state
    const initial: Record<string, DubLangState> = {};
    for (const code of Array.from(selected)) {
      initial[code] = { code, step: "queued" };
    }
    setState(initial);
    setRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/video-creator/dub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceScript,
          sourceVideoUrl,
          sourceImageUrl,
          sourceAudioUrl,
          languages: Array.from(selected),
          voiceMatchSource,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errBody = await res.text().catch(() => "");
        let message = `Dub request failed (${res.status}).`;
        try {
          const parsed = JSON.parse(errBody);
          if (parsed?.error) message = parsed.error;
        } catch {
          if (errBody) message = errBody.slice(0, 280);
        }
        setGlobalError(message);
        setRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        // SSE event boundary is "\n\n"
        while ((idx = buffer.indexOf("\n\n")) >= 0) {
          const raw = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);
          if (!raw) continue;
          const dataLine = raw.startsWith("data:") ? raw.slice(5).trim() : raw;
          if (!dataLine) continue;
          try {
            const evt = JSON.parse(dataLine) as DubEvent;
            handleEvent(evt);
          } catch (parseErr) {
            console.warn("[dub-panel] failed to parse SSE event:", parseErr, dataLine);
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // user cancelled — already cleared running state
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setGlobalError(`Dub stream interrupted: ${msg}`);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }

    function handleEvent(evt: DubEvent) {
      if (evt.type === "warning" && evt.message) {
        setWarnings((w) => [...w, evt.message!]);
        return;
      }
      if (evt.type === "error" && evt.error) {
        setGlobalError(evt.error);
        return;
      }
      if (evt.type === "complete") {
        // Final summary — nothing more to apply, per-language events
        // already updated state.
        return;
      }
      if (!evt.language) return;
      setState((prev) => {
        const cur = prev[evt.language!] || { code: evt.language!, step: "queued" };
        const next: DubLangState = { ...cur };
        if (evt.type === "translation-start") next.step = "translating";
        if (evt.type === "translation-done") {
          next.step = "voicing";
          if (evt.translatedScript) next.translatedScript = evt.translatedScript;
        }
        if (evt.type === "voice-done") {
          next.step = "lip-syncing";
          if (evt.audioUrl) next.audioUrl = evt.audioUrl;
          if (evt.provider) next.voiceProvider = evt.provider;
          if (typeof evt.durationSec === "number") next.durationSec = evt.durationSec;
        }
        if (evt.type === "lip-sync-done") {
          next.step = "done";
          if (evt.videoUrl) next.videoUrl = evt.videoUrl;
          if (typeof evt.durationSec === "number") next.durationSec = evt.durationSec;
        }
        if (evt.type === "language-error") {
          next.step = "failed";
          next.error = evt.error;
          next.errorStep = evt.step;
        }
        return { ...prev, [evt.language!]: next };
      });
    }
  }, [
    running,
    selected,
    sourceScript,
    sourceVideoUrl,
    sourceImageUrl,
    sourceAudioUrl,
    voiceMatchSource,
  ]);

  // Sort languages with "in-progress" first, then done, then failed, then queued.
  const orderedActive = useMemo(() => {
    const stepOrder: Record<DubStep, number> = {
      "lip-syncing": 0,
      voicing: 1,
      translating: 2,
      done: 3,
      queued: 4,
      failed: 5,
    };
    return Object.values(state).sort((a, b) => stepOrder[a.step] - stepOrder[b.step]);
  }, [state]);

  return (
    <div
      className="rounded-2xl"
      style={{
        background: "var(--paper-elevated, #f4f3ed)",
        border: "1px solid var(--rule, #e8e6dc)",
      }}
    >
      {/* Header — expandable */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--ink, #0a0a0b)" }}
          >
            <Globe className="w-5 h-5" style={{ color: "var(--gold, #d4f24e)" }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold tracking-tight" style={{ color: "var(--ink, #0a0a0b)" }}>
                Dub into other languages
              </h3>
              <span
                className="text-[10px] tracking-[0.14em] uppercase px-2 py-[3px] rounded"
                style={{
                  background: "var(--gold-deep, #b6924f)",
                  color: "var(--paper, #fafaf7)",
                }}
              >
                One click · 50+ languages
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: "var(--ink-muted, #6f6e69)" }}>
              Same script, native voice, lip-synced. Powered by Fish Audio S1 + Hedra Character-3.
            </p>
          </div>
        </div>
        <ChevronDown
          className="w-5 h-5 transition-transform"
          style={{
            color: "var(--ink-muted, #6f6e69)",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {expanded && (
        <div
          className="px-5 pb-5 pt-1 space-y-5"
          style={{ borderTop: "1px solid var(--rule, #e8e6dc)" }}
        >
          {/* Quick selectors */}
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <span
              className="text-[10px] uppercase tracking-[0.16em]"
              style={{ color: "var(--ink-muted, #6f6e69)" }}
            >
              Quick select
            </span>
            <button
              type="button"
              onClick={presetTop8}
              disabled={running}
              className="px-3 py-1.5 text-xs rounded-md transition disabled:opacity-50"
              style={{
                background: "var(--paper, #fafaf7)",
                border: "1px solid var(--rule, #e8e6dc)",
                color: "var(--ink, #0a0a0b)",
              }}
            >
              Top 8
            </button>
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => selectRegion(r)}
                disabled={running}
                className="px-3 py-1.5 text-xs rounded-md transition disabled:opacity-50"
                style={{
                  background: "var(--paper, #fafaf7)",
                  border: "1px solid var(--rule, #e8e6dc)",
                  color: "var(--ink, #0a0a0b)",
                }}
              >
                {r}
                <span className="ml-1.5" style={{ color: "var(--ink-muted, #6f6e69)" }}>
                  +{groupedByRegion[r].length}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              disabled={running}
              className="px-3 py-1.5 text-xs rounded-md transition disabled:opacity-50"
              style={{
                background: "transparent",
                border: "1px solid var(--rule, #e8e6dc)",
                color: "var(--ink-muted, #6f6e69)",
              }}
            >
              Clear
            </button>
            <span
              className="ml-auto text-xs tabular-nums"
              style={{ color: "var(--ink-secondary, #2c2c2e)" }}
            >
              {selected.size} selected
            </span>
          </div>

          {/* Language grid grouped by region */}
          <div className="space-y-4">
            {REGIONS.map((region) => (
              <div key={region}>
                <h4
                  className="text-[10px] uppercase tracking-[0.18em] mb-2"
                  style={{ color: "var(--ink-muted, #6f6e69)" }}
                >
                  {region}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {groupedByRegion[region].map((lang) => {
                    const isSelected = selected.has(lang.code);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => toggle(lang.code)}
                        disabled={running}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition disabled:opacity-60"
                        style={{
                          background: isSelected
                            ? "var(--ink, #0a0a0b)"
                            : "var(--paper, #fafaf7)",
                          border: `1px solid ${
                            isSelected
                              ? "var(--gold, #d4f24e)"
                              : "var(--rule, #e8e6dc)"
                          }`,
                          color: isSelected
                            ? "var(--paper, #fafaf7)"
                            : "var(--ink, #0a0a0b)",
                          boxShadow: isSelected
                            ? "0 0 0 2px rgba(201,169,97,0.25)"
                            : "none",
                        }}
                      >
                        <span className="text-xl leading-none">{lang.flag}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-[12px] font-medium truncate">
                            {lang.name}
                          </span>
                          <span
                            className="block text-[10px] truncate"
                            style={{
                              color: isSelected
                                ? "var(--gold, #d4f24e)"
                                : "var(--ink-muted, #6f6e69)",
                            }}
                          >
                            {lang.nativeName}
                          </span>
                        </span>
                        <span className="text-[9px] uppercase tracking-wider opacity-70 hidden sm:inline">
                          {lang.code}
                        </span>
                        {isSelected && (
                          <Check
                            className="w-3.5 h-3.5"
                            style={{ color: "var(--gold, #d4f24e)" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Voice-match toggle */}
          <label
            className="flex items-start gap-3 p-3 rounded-lg cursor-pointer"
            style={{
              background: "var(--paper, #fafaf7)",
              border: "1px solid var(--rule, #e8e6dc)",
            }}
          >
            <input
              type="checkbox"
              checked={voiceMatchSource}
              onChange={(e) => setVoiceMatchSource(e.target.checked)}
              disabled={running || !sourceAudioUrl}
              className="mt-0.5 accent-stone-700"
            />
            <span className="flex-1">
              <span
                className="block text-sm font-medium"
                style={{ color: "var(--ink, #0a0a0b)" }}
              >
                Match the source narrator&apos;s voice
              </span>
              <span
                className="block text-xs mt-0.5"
                style={{ color: "var(--ink-muted, #6f6e69)" }}
              >
                Voice-clone the original narrator and reuse that voice across every dubbed
                language. Requires the source audio URL and the voice-clone API. Falls back
                to a default Fish Audio voice when unavailable.
                {!sourceAudioUrl && " (No source audio available — disabled.)"}
              </span>
            </span>
          </label>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {!running ? (
              <button
                type="button"
                onClick={startDub}
                disabled={selected.size === 0}
                className="px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "var(--ink, #0a0a0b)",
                  color: "var(--paper, #fafaf7)",
                }}
              >
                <Wand2 className="w-4 h-4" />
                Dub now
                {selected.size > 0 && (
                  <span
                    className="ml-1 text-xs tabular-nums px-1.5 py-0.5 rounded"
                    style={{ background: "var(--gold-deep, #b6924f)" }}
                  >
                    {selected.size}
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={cancel}
                className="px-5 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition"
                style={{
                  background: "var(--paper, #fafaf7)",
                  border: "1px solid var(--rule, #e8e6dc)",
                  color: "var(--ink, #0a0a0b)",
                }}
              >
                <Square className="w-4 h-4" />
                Cancel
              </button>
            )}
            <span
              className="text-xs"
              style={{ color: "var(--ink-muted, #6f6e69)" }}
            >
              ~60s for 8 languages · cents per dub
            </span>
          </div>

          {/* Error banner */}
          {globalError && (
            <div
              className="rounded-lg px-4 py-3 flex items-start gap-2.5"
              style={{
                background: "rgba(180,60,40,0.06)",
                border: "1px solid rgba(180,60,40,0.25)",
              }}
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#7a2a18" }} />
              <div className="text-sm" style={{ color: "#7a2a18" }}>
                {globalError}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className="rounded-lg px-4 py-3 flex items-start gap-2.5"
                  style={{
                    background: "rgba(201,169,97,0.08)",
                    border: "1px solid rgba(201,169,97,0.30)",
                  }}
                >
                  <AlertTriangle
                    className="w-4 h-4 mt-0.5 flex-shrink-0"
                    style={{ color: "var(--gold-deep, #b6924f)" }}
                  />
                  <div className="text-xs" style={{ color: "var(--ink-secondary, #2c2c2e)" }}>
                    {w}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Per-language progress + result grid */}
          {orderedActive.length > 0 && (
            <div>
              <h4
                className="text-[10px] uppercase tracking-[0.18em] mb-3"
                style={{ color: "var(--ink-muted, #6f6e69)" }}
              >
                Dub results · {orderedActive.filter((l) => l.step === "done").length} of{" "}
                {orderedActive.length} ready
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {orderedActive.map((s) => {
                  const meta = DUB_LANGUAGES.find((l) => l.code === s.code);
                  if (!meta) return null;
                  return (
                    <DubResultCard key={s.code} state={s} meta={meta} sourceLabel={sourceLabel} />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-language card
// ─────────────────────────────────────────────────────────────────────────────

function DubResultCard({
  state,
  meta,
  sourceLabel,
}: {
  state: DubLangState;
  meta: DubLang;
  sourceLabel?: string;
}) {
  const stepLabel: Record<DubStep, string> = {
    queued: "Queued",
    translating: "Translating script",
    voicing: "Synthesising voice",
    "lip-syncing": "Re-lip-syncing",
    done: "Ready",
    failed: "Failed",
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "var(--paper, #fafaf7)",
        border: `1px solid ${
          state.step === "done"
            ? "var(--gold, #d4f24e)"
            : state.step === "failed"
              ? "rgba(180,60,40,0.30)"
              : "var(--rule, #e8e6dc)"
        }`,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none">{meta.flag}</span>
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-semibold truncate"
            style={{ color: "var(--ink, #0a0a0b)" }}
          >
            {meta.name}
          </div>
          <div
            className="text-[11px] truncate"
            style={{ color: "var(--ink-muted, #6f6e69)" }}
          >
            {meta.nativeName}
          </div>
        </div>
        <StepBadge step={state.step} label={stepLabel[state.step]} />
      </div>

      {/* Translated script preview when available */}
      {state.translatedScript && (
        <div
          className="mt-3 text-[12px] leading-relaxed line-clamp-3"
          style={{ color: "var(--ink-secondary, #2c2c2e)" }}
        >
          <Languages
            className="inline-block w-3 h-3 mr-1 align-text-top"
            style={{ color: "var(--ink-muted, #6f6e69)" }}
          />
          {state.translatedScript}
        </div>
      )}

      {/* Voice provider chip */}
      {state.audioUrl && (
        <div
          className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em]"
          style={{ color: "var(--ink-muted, #6f6e69)" }}
        >
          <Mic className="w-3 h-3" />
          {state.voiceProvider === "fish-audio-s1" ? "Fish Audio S1" : "Fallback voice"}
          {typeof state.durationSec === "number" && state.durationSec > 0 && (
            <span className="ml-1">· {state.durationSec.toFixed(0)}s</span>
          )}
        </div>
      )}

      {/* Final video */}
      {state.step === "done" && state.videoUrl && (
        <div className="mt-3 space-y-2">
          <video
            src={state.videoUrl}
            controls
            playsInline
            className="w-full rounded-lg"
            style={{ background: "var(--ink, #0a0a0b)", maxHeight: 240 }}
            preload="metadata"
          />
          <div className="flex items-center justify-between gap-2">
            <a
              href={state.videoUrl}
              download={`zoobicon-dub-${meta.code}.mp4`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition"
              style={{
                background: "var(--ink, #0a0a0b)",
                color: "var(--paper, #fafaf7)",
              }}
            >
              <Download className="w-3 h-3" />
              Download
            </a>
            {sourceLabel && (
              <span
                className="text-[10px] truncate"
                style={{ color: "var(--ink-muted, #6f6e69)" }}
                title={sourceLabel}
              >
                from {sourceLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error detail */}
      {state.step === "failed" && state.error && (
        <div
          className="mt-3 rounded-lg px-3 py-2 text-[12px] leading-relaxed"
          style={{
            background: "rgba(180,60,40,0.06)",
            border: "1px solid rgba(180,60,40,0.25)",
            color: "#7a2a18",
          }}
        >
          <span className="block font-medium uppercase tracking-[0.14em] text-[10px] mb-0.5">
            {state.errorStep ?? "error"}
          </span>
          {state.error}
        </div>
      )}
    </div>
  );
}

function StepBadge({ step, label }: { step: DubStep; label: string }) {
  if (step === "done") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded"
        style={{
          background: "var(--gold, #d4f24e)",
          color: "var(--ink, #0a0a0b)",
        }}
      >
        <Check className="w-3 h-3" />
        Ready
      </span>
    );
  }
  if (step === "failed") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded"
        style={{
          background: "rgba(180,60,40,0.10)",
          color: "#7a2a18",
        }}
      >
        <AlertTriangle className="w-3 h-3" />
        Failed
      </span>
    );
  }
  if (step === "queued") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded"
        style={{
          background: "var(--paper-elevated, #f4f3ed)",
          color: "var(--ink-muted, #6f6e69)",
        }}
      >
        Queued
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded"
      style={{
        background: "var(--paper-elevated, #f4f3ed)",
        color: "var(--ink-secondary, #2c2c2e)",
      }}
    >
      <Loader2 className="w-3 h-3 animate-spin" />
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SSE event shape (must match /api/video-creator/dub)
//
// Kept as a single open shape (rather than a discriminated union) so the
// reducer can read `evt.language` once and switch on `evt.type` without
// TypeScript narrowing each branch separately.
// ─────────────────────────────────────────────────────────────────────────────

interface DubEvent {
  type:
    | "started"
    | "warning"
    | "translation-start"
    | "translation-done"
    | "voice-done"
    | "lip-sync-done"
    | "language-error"
    | "complete"
    | "error";
  // Per-language fields
  language?: string;
  languageName?: string;
  nativeName?: string;
  flag?: string;
  translatedScript?: string;
  audioUrl?: string;
  videoUrl?: string;
  durationSec?: number;
  provider?: "fish-audio-s1" | "replicate-fallback";
  voiceProvider?: "fish-audio-s1" | "replicate-fallback";
  step?: string;
  // Top-level fields
  message?: string;
  error?: string;
  languages?: Array<{ code: string; name: string; nativeName: string; flag: string }>;
  fishAudioReady?: boolean;
  voiceMatchSource?: boolean;
  videos?: unknown;
  errors?: unknown;
  succeeded?: number;
  failed?: number;
  total?: number;
}
