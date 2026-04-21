"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Type, Palette, Move, Image, X, Check, Undo2, Redo2 } from "lucide-react";

/**
 * Visual inline editor overlay for the Sandpack preview.
 *
 * Renders on top of the preview iframe and lets users:
 * - Click any text element to edit it inline
 * - Click any element to see its properties (color, size, spacing)
 * - Drag to reorder sections
 *
 * Changes are applied to the React source files via the parent's
 * onEdit callback, which triggers a diff-based regeneration.
 */

interface EditAction {
  type: "text" | "color" | "image" | "layout";
  target: string; // CSS selector or component name
  property: string;
  oldValue: string;
  newValue: string;
}

interface VisualEditorProps {
  /** Whether the visual editor overlay is active */
  active: boolean;
  /** Callback when user makes a visual edit — sends instruction to AI */
  onEdit: (instruction: string) => void;
  /** Current React files for context */
  files: Record<string, string>;
  /** Toggle editor on/off */
  onToggle: () => void;
}

export default function VisualEditor({ active, onEdit, files, onToggle }: VisualEditorProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<{ selector: string; text: string } | null>(null);
  const [history, setHistory] = useState<EditAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tool, setTool] = useState<"select" | "text" | "color" | "move">("select");

  const pushAction = useCallback((action: EditAction) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), action]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex < 0) return;
    const action = history[historyIndex];
    onEdit(`Undo: change ${action.property} of ${action.target} back to "${action.oldValue}"`);
    setHistoryIndex(prev => prev - 1);
  }, [history, historyIndex, onEdit]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const action = history[historyIndex + 1];
    onEdit(`Change ${action.property} of ${action.target} to "${action.newValue}"`);
    setHistoryIndex(prev => prev + 1);
  }, [history, historyIndex, onEdit]);

  // Handle text edit completion
  const handleTextEditComplete = useCallback((newText: string) => {
    if (!editingText) return;
    if (newText !== editingText.text) {
      const instruction = `Change the text "${editingText.text.slice(0, 50)}" to "${newText.slice(0, 200)}"`;
      pushAction({
        type: "text",
        target: editingText.selector,
        property: "text",
        oldValue: editingText.text,
        newValue: newText,
      });
      onEdit(instruction);
    }
    setEditingText(null);
  }, [editingText, onEdit, pushAction]);

  // Handle color change
  const handleColorChange = useCallback((element: string, color: string) => {
    const instruction = `Change the primary color of the ${element} section to ${color}`;
    pushAction({
      type: "color",
      target: element,
      property: "color",
      oldValue: "",
      newValue: color,
    });
    onEdit(instruction);
  }, [onEdit, pushAction]);

  if (!active) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-30">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-[#0f2148]/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-1 mr-3">
          {([
            { id: "select" as const, icon: Move, label: "Select" },
            { id: "text" as const, icon: Type, label: "Edit Text" },
            { id: "color" as const, icon: Palette, label: "Colors" },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`p-1.5 rounded-lg transition-all ${
                tool === t.id
                  ? "bg-stone-600 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
              title={t.label}
            >
              <t.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/10" />

        <button
          onClick={handleUndo}
          disabled={historyIndex < 0}
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          disabled={historyIndex >= history.length - 1}
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30"
          title="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        <span className="text-[10px] text-white/30 mr-2">{history.length} edits</span>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
          title="Close visual editor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick edit panel — shows when element is selected */}
      {tool === "color" && (
        <div className="mx-3 mt-2 p-3 rounded-xl bg-[#0f2148]/95 backdrop-blur-sm border border-white/10">
          <div className="text-xs font-semibold text-white/70 mb-2">Quick Color Changes</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Hero background", section: "hero" },
              { label: "Navbar", section: "navbar" },
              { label: "CTA section", section: "CTA" },
              { label: "Footer", section: "footer" },
            ].map((item) => (
              <div key={item.section} className="flex items-center gap-2">
                <input
                  type="color"
                  defaultValue="#4f46e5"
                  onChange={(e) => handleColorChange(item.section, e.target.value)}
                  className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                />
                <span className="text-xs text-white/60">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tool === "text" && (
        <div className="mx-3 mt-2 p-3 rounded-xl bg-[#0f2148]/95 backdrop-blur-sm border border-white/10">
          <div className="text-xs font-semibold text-white/70 mb-2">Click any text in the preview to edit it</div>
          <p className="text-[10px] text-white/40">Or type an instruction below to change text via AI</p>
        </div>
      )}
    </div>
  );
}
