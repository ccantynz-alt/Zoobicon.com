"use client";

/**
 * Inline slot editor — KILLER-MOVES-BUILDER.md #B17.
 *
 * The cheap fast path for visual editing of slot-locked components.
 * Distinct from src/components/VisualEditorOverlay.tsx (which routes
 * everything through chat-edits at ~$0.002 + 1-2s each):
 *
 *   Slot-locked component, simple text edit:
 *     - This module: direct string replace in the slot template → $0,
 *       <100ms response.
 *     - Existing VisualEditor: chat edit → ~$0.002, 1-2s.
 *
 *   Slot-locked, ambiguous text:
 *     - This module: falls through to onChatEdit() so the existing
 *       VisualEditor's pipeline handles it.
 *
 * At scale, ~70-80% of text edits are unambiguous single-instance
 * replacements. Routing those off the LLM hot path is a major cost +
 * latency win.
 *
 * Architecture:
 *   1. When enabled, this module injects a script into the Sandpack
 *      iframe (VISUAL_EDITOR_IFRAME_SCRIPT) that hover-outlines text
 *      elements and posts a message on click.
 *   2. Click message arrives → inline editor anchors to the element.
 *   3. User types + Enter → tries direct string replace in the source
 *      files. If unambiguous, applies + refreshes Sandpack.
 *   4. If ambiguous (multiple matches or no source-file match), falls
 *      through to the chat-edit path.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Check, X, Pencil } from "lucide-react";

interface InlineSlotEditorProps {
  enabled: boolean;
  files: Record<string, string> | null;
  /** Called with the updated file map when a direct edit succeeds. */
  onEditApplied: (files: Record<string, string>) => void;
  /** Called when the edit is ambiguous and needs the AI to handle it. */
  onChatEdit?: (instruction: string) => void;
}

interface SelectedTarget {
  selectorPath: string;
  rect: { top: number; left: number; width: number; height: number };
  currentText: string;
  sourceFile: string | null;
}

export function InlineSlotEditor({
  enabled,
  files,
  onEditApplied,
  onChatEdit,
}: InlineSlotEditorProps) {
  const [selected, setSelected] = useState<SelectedTarget | null>(null);
  const [draftText, setDraftText] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Listen for clicks coming back from the Sandpack iframe.
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: MessageEvent) => {
      const data = event.data as
        | { zoobiconType?: string; selectorPath?: string; text?: string; rect?: SelectedTarget["rect"] }
        | undefined;
      if (!data || data.zoobiconType !== "visual-editor-click") return;
      if (typeof data.selectorPath !== "string" || !data.rect) return;
      setSelected({
        selectorPath: data.selectorPath,
        rect: data.rect,
        currentText: (data.text || "").trim(),
        sourceFile: locateSourceFile(files, data.text || ""),
      });
      setDraftText((data.text || "").trim());
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [enabled, files]);

  // Arm + disarm the iframe-side detector when toggling.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Sandpack Preview"]');
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      { zoobiconType: enabled ? "visual-editor-arm" : "visual-editor-disarm" },
      "*",
    );
  }, [enabled]);

  const commit = useCallback(() => {
    if (!selected) return;
    const newText = draftText.trim();
    if (!newText || newText === selected.currentText) {
      setSelected(null);
      return;
    }

    // Fast path — direct replacement if unambiguous.
    if (selected.sourceFile && files) {
      const updated = applyLiteralReplace(
        files,
        selected.sourceFile,
        selected.currentText,
        newText,
      );
      if (updated) {
        onEditApplied(updated);
        setSelected(null);
        return;
      }
    }

    // Fallback — chat edit (existing pipeline handles this).
    onChatEdit?.(
      `Change the text "${selected.currentText.slice(0, 100)}" to "${newText}". Keep all other content + styling identical.`,
    );
    setSelected(null);
  }, [selected, draftText, files, onEditApplied, onChatEdit]);

  if (!enabled || !selected) return null;

  // Pin the editor inside the iframe's visible viewport. The rect is
  // in iframe coordinates so we need the iframe's own offset.
  const iframe =
    typeof document !== "undefined"
      ? document.querySelector<HTMLIFrameElement>('iframe[title="Sandpack Preview"]')
      : null;
  const iframeRect = iframe?.getBoundingClientRect();
  const top = (iframeRect?.top || 0) + selected.rect.top + selected.rect.height + 8;
  const left = (iframeRect?.left || 0) + selected.rect.left;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden="true">
      <div
        className="pointer-events-auto absolute rounded-lg p-3 shadow-xl"
        style={{
          top,
          left,
          minWidth: Math.max(280, selected.rect.width),
          background: "var(--paper-elevated)",
          border: "1.5px solid var(--gold)",
          color: "var(--ink)",
        }}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--gold-deep)" }}
          >
            <Pencil className="mr-1 inline h-3 w-3" />
            Edit text
          </span>
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="Close"
            className="rounded p-1 transition-colors hover:bg-[color:var(--paper)]"
            style={{ color: "var(--ink-muted)" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <textarea
          ref={taRef}
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setSelected(null);
            }
          }}
          autoFocus
          rows={2}
          className="w-full rounded-md px-2 py-1.5 text-sm focus:outline-none"
          style={{
            background: "var(--paper)",
            border: "1px solid var(--rule)",
            color: "var(--ink)",
            fontFamily: "Inter, system-ui, sans-serif",
            resize: "vertical",
          }}
        />
        <div
          className="mt-2 flex items-center justify-between text-[10px]"
          style={{ color: "var(--ink-muted)" }}
        >
          <span>
            {selected.sourceFile ? (
              <>Direct edit · free · &lt;100ms</>
            ) : (
              <>Ambiguous match — will use AI edit (~$0.002 · 1-2s)</>
            )}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded px-2 py-0.5 transition-colors hover:bg-[color:var(--paper)]"
              style={{ color: "var(--ink-muted)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commit}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              <Check className="h-3 w-3" />
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function locateSourceFile(
  files: Record<string, string> | null,
  text: string,
): string | null {
  if (!files || !text || text.length < 4) return null;
  const needle = text.trim().slice(0, 80);
  const ordered = Object.keys(files).sort((a, b) => {
    const aComp = a.startsWith("components/") ? 0 : 1;
    const bComp = b.startsWith("components/") ? 0 : 1;
    return aComp - bComp;
  });
  for (const path of ordered) {
    if (files[path].includes(needle)) return path;
  }
  return null;
}

function applyLiteralReplace(
  files: Record<string, string>,
  path: string,
  fromText: string,
  toText: string,
): Record<string, string> | null {
  const source = files[path];
  if (!source) return null;
  const occurrences = source.split(fromText).length - 1;
  if (occurrences !== 1) return null; // ambiguous → AI handles
  const replacement = toText.replace(/\$/g, "$$$$");
  return {
    ...files,
    [path]: source.replace(fromText, replacement),
  };
}

/**
 * Script string the Sandpack preview injects into the iframe so the
 * iframe can post hover/click messages back. Included separately so
 * caller can wire it via Sandpack's customSetup.
 */
export const INLINE_SLOT_EDITOR_IFRAME_SCRIPT = `
(function () {
  if (window.__zoobiconInlineSlotEditorBound) return;
  window.__zoobiconInlineSlotEditorBound = true;
  let armed = false;
  let hovered = null;

  function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.children.length > 0) return false;
    const text = (el.textContent || "").trim();
    return text.length > 0 && text.length < 500;
  }

  document.addEventListener("mousemove", function (e) {
    if (!armed) return;
    const target = e.target;
    if (target === hovered) return;
    if (hovered) { hovered.style.outline = ""; hovered.style.cursor = ""; }
    if (isEditable(target)) {
      target.style.outline = "2px solid #e8402b";
      target.style.outlineOffset = "2px";
      target.style.cursor = "text";
      hovered = target;
    } else {
      hovered = null;
    }
  }, true);

  document.addEventListener("click", function (e) {
    if (!armed) return;
    const target = e.target;
    if (!isEditable(target)) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = target.getBoundingClientRect();
    window.parent.postMessage({
      zoobiconType: "visual-editor-click",
      selectorPath: target.tagName.toLowerCase() + (target.id ? "#" + target.id : ""),
      text: (target.textContent || "").trim(),
      rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    }, "*");
  }, true);

  window.addEventListener("message", function (e) {
    if (!e.data) return;
    if (e.data.zoobiconType === "visual-editor-arm") {
      armed = true;
    } else if (e.data.zoobiconType === "visual-editor-disarm") {
      armed = false;
      if (hovered) { hovered.style.outline = ""; hovered.style.cursor = ""; hovered = null; }
    }
  });
})();
`;
