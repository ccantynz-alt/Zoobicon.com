"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Type,
  Palette,
  Box,
  Square,
  Layout,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  MousePointerClick,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { SelectedElement } from "@/lib/dom-bridge";

interface VisualEditorProps {
  selectedElement: SelectedElement | null;
  onStyleChange: (property: string, value: string) => void;
  onTextChange: (newText: string) => void;
  onSectionReorder: (fromIndex: number, toIndex: number) => void;
  html: string;
}

// --- Collapsible Section ---
function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-white/50 hover:text-white/70 transition-colors"
      >
        <Icon size={13} className="text-blue-400/60" />
        <span className="flex-1">{title}</span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

// --- Number input with +/- buttons ---
function NumberInput({
  value,
  onChange,
  unit = "px",
  min = 0,
  max = 9999,
  step = 1,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}) {
  const numVal = parseFloat(value) || 0;

  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <span className="text-[9px] text-white/30 uppercase tracking-wide">{label}</span>
      )}
      <div className="flex items-center bg-white/5 rounded border border-white/10 overflow-hidden">
        <button
          onClick={() => onChange(Math.max(min, numVal - step) + unit)}
          className="px-1.5 py-1 text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <Minus size={10} />
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent text-center text-[11px] text-white/80 py-1 outline-none"
        />
        <button
          onClick={() => onChange(Math.min(max, numVal + step) + unit)}
          className="px-1.5 py-1 text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        >
          <Plus size={10} />
        </button>
      </div>
    </div>
  );
}

// --- Color picker with hex display ---
function ColorInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  // Try to convert rgb/rgba to hex for the color input
  const hexValue = useMemo(() => {
    if (!value) return "#000000";
    if (value.startsWith("#")) return value;
    const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, "0");
      const g = parseInt(match[2]).toString(16).padStart(2, "0");
      const b = parseInt(match[3]).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`;
    }
    return "#000000";
  }, [value]);

  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <span className="text-[9px] text-white/30 uppercase tracking-wide">{label}</span>
      )}
      <div className="flex items-center gap-2 bg-white/5 rounded border border-white/10 px-2 py-1">
        <input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-0 bg-transparent text-[11px] text-white/80 outline-none"
        />
      </div>
    </div>
  );
}

// --- Select dropdown ---
function SelectInput({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <span className="text-[9px] text-white/30 uppercase tracking-wide">{label}</span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white/5 border border-white/10 rounded text-[11px] text-white/80 px-2 py-1.5 outline-none appearance-none cursor-pointer hover:bg-white/10 transition-colors"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#1a1a2e] text-white">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// --- Font families ---
const FONT_OPTIONS = [
  { value: "inherit", label: "Inherit" },
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "system-ui, sans-serif", label: "System UI" },
  { value: "'Helvetica Neue', sans-serif", label: "Helvetica Neue" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "'Lato', sans-serif", label: "Lato" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Poppins', sans-serif", label: "Poppins" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Source Code Pro', monospace", label: "Source Code Pro" },
];

const FONT_WEIGHT_OPTIONS = [
  { value: "100", label: "Thin (100)" },
  { value: "200", label: "Extra Light (200)" },
  { value: "300", label: "Light (300)" },
  { value: "400", label: "Normal (400)" },
  { value: "500", label: "Medium (500)" },
  { value: "600", label: "Semi Bold (600)" },
  { value: "700", label: "Bold (700)" },
  { value: "800", label: "Extra Bold (800)" },
  { value: "900", label: "Black (900)" },
];

const DISPLAY_OPTIONS = [
  { value: "block", label: "Block" },
  { value: "flex", label: "Flex" },
  { value: "grid", label: "Grid" },
  { value: "inline", label: "Inline" },
  { value: "inline-block", label: "Inline Block" },
  { value: "inline-flex", label: "Inline Flex" },
  { value: "none", label: "None" },
];

const FLEX_DIR_OPTIONS = [
  { value: "row", label: "Row" },
  { value: "column", label: "Column" },
  { value: "row-reverse", label: "Row Reverse" },
  { value: "column-reverse", label: "Column Reverse" },
];

const JUSTIFY_OPTIONS = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "space-between", label: "Space Between" },
  { value: "space-around", label: "Space Around" },
  { value: "space-evenly", label: "Space Evenly" },
];

const ALIGN_OPTIONS = [
  { value: "stretch", label: "Stretch" },
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "baseline", label: "Baseline" },
];

// --- Extract sections from HTML ---
function extractSections(html: string): { index: number; label: string }[] {
  const sections: { index: number; label: string }[] = [];
  const regex = /<section[^>]*>/gi;
  let match;
  let idx = 0;
  while ((match = regex.exec(html)) !== null) {
    // Try to find an id or class
    const idMatch = match[0].match(/id="([^"]*)"/);
    const classMatch = match[0].match(/class="([^"]*)"/);
    let label = `Section ${idx + 1}`;
    if (idMatch && idMatch[1]) {
      label = idMatch[1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    } else if (classMatch && classMatch[1]) {
      const cls = classMatch[1].split(" ")[0];
      if (cls && cls.length < 30) {
        label = cls.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
    sections.push({ index: idx, label });
    idx++;
  }
  return sections;
}

export default function VisualEditor({
  selectedElement,
  onStyleChange,
  onTextChange,
  onSectionReorder,
  html,
}: VisualEditorProps) {
  const [editingText, setEditingText] = useState("");
  const [textDirty, setTextDirty] = useState(false);

  const sections = useMemo(() => extractSections(html), [html]);

  const cs = selectedElement?.computedStyles || {};

  const handleTextEdit = useCallback(
    (text: string) => {
      setEditingText(text);
      setTextDirty(true);
    },
    []
  );

  const commitText = useCallback(() => {
    if (textDirty) {
      onTextChange(editingText);
      setTextDirty(false);
    }
  }, [textDirty, editingText, onTextChange]);

  // When selected element changes, reset text state
  const displayText = textDirty
    ? editingText
    : selectedElement?.textContent?.substring(0, 200) || "";

  // Text align toggle helper
  const textAlignButtons = [
    { value: "left", icon: AlignLeft },
    { value: "center", icon: AlignCenter },
    { value: "right", icon: AlignRight },
    { value: "justify", icon: AlignJustify },
  ];

  if (!selectedElement) {
    return (
      <div className="h-full flex flex-col bg-[#1a1a2e]/95 backdrop-blur-sm border-l border-white/5">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-white/5">
          <MousePointerClick size={14} className="text-blue-400/60" />
          <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
            Visual Editor
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
              <MousePointerClick size={20} className="text-blue-400/50" />
            </div>
            <p className="text-[12px] text-white/40 leading-relaxed max-w-[180px]">
              Click any element in the preview to select it and edit its properties
            </p>
            <p className="text-[10px] text-white/25">
              Double-click text to edit inline
            </p>
          </div>
        </div>

        {/* Section reordering is always available */}
        {sections.length > 0 && (
          <Section title="Sections" icon={Layout} defaultOpen={true}>
            <SectionList sections={sections} onReorder={onSectionReorder} />
          </Section>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1a1a2e]/95 backdrop-blur-sm border-l border-white/5 overflow-hidden">
      {/* Header — Element Info */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-medium text-blue-400">
              &lt;{selectedElement.tagName}&gt;
            </span>
            {selectedElement.id && (
              <span className="text-[10px] font-mono text-purple-400/70">
                #{selectedElement.id}
              </span>
            )}
          </div>
          {selectedElement.className && typeof selectedElement.className === "string" && (
            <p className="text-[9px] text-white/30 font-mono truncate mt-0.5">
              .{selectedElement.className.split(" ").filter(Boolean).slice(0, 3).join(" .")}
            </p>
          )}
        </div>
      </div>

      {/* Scrollable property panels */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Text Editor */}
        {selectedElement.isEditable && (
          <Section title="Text Content" icon={Type} defaultOpen={true}>
            <textarea
              value={displayText}
              onChange={(e) => handleTextEdit(e.target.value)}
              onBlur={commitText}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded text-[11px] text-white/80 p-2 outline-none resize-none focus:border-blue-500/50 transition-colors"
              placeholder="Element text..."
            />
          </Section>
        )}

        {/* Typography */}
        <Section title="Typography" icon={Type}>
          <div className="space-y-2">
            <SelectInput
              label="Font Family"
              value={cs.fontFamily || "inherit"}
              onChange={(v) => onStyleChange("fontFamily", v)}
              options={FONT_OPTIONS}
            />
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Font Size"
                value={cs.fontSize || "16px"}
                onChange={(v) => onStyleChange("fontSize", v)}
                step={1}
              />
              <SelectInput
                label="Weight"
                value={cs.fontWeight || "400"}
                onChange={(v) => onStyleChange("fontWeight", v)}
                options={FONT_WEIGHT_OPTIONS}
              />
            </div>
            <ColorInput
              label="Color"
              value={cs.color || "#000000"}
              onChange={(v) => onStyleChange("color", v)}
            />
            <div className="grid grid-cols-2 gap-2">
              <NumberInput
                label="Line Height"
                value={cs.lineHeight || "1.5"}
                onChange={(v) => onStyleChange("lineHeight", v)}
                step={0.1}
                unit=""
              />
              <NumberInput
                label="Letter Spacing"
                value={cs.letterSpacing || "0px"}
                onChange={(v) => onStyleChange("letterSpacing", v)}
                step={0.5}
              />
            </div>
            {/* Text Align */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-white/30 uppercase tracking-wide">
                Text Align
              </span>
              <div className="flex gap-1">
                {textAlignButtons.map(({ value: val, icon: AlignIcon }) => (
                  <button
                    key={val}
                    onClick={() => onStyleChange("textAlign", val)}
                    className={`flex-1 flex items-center justify-center py-1.5 rounded border transition-colors ${
                      cs.textAlign === val
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <AlignIcon size={12} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* Spacing — Box Model */}
        <Section title="Spacing" icon={Box}>
          <div className="space-y-3">
            {/* Margin */}
            <div>
              <span className="text-[9px] text-white/30 uppercase tracking-wide block mb-1">
                Margin
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <NumberInput
                  label="Top"
                  value={cs.marginTop || "0px"}
                  onChange={(v) => onStyleChange("marginTop", v)}
                />
                <NumberInput
                  label="Right"
                  value={cs.marginRight || "0px"}
                  onChange={(v) => onStyleChange("marginRight", v)}
                />
                <NumberInput
                  label="Bottom"
                  value={cs.marginBottom || "0px"}
                  onChange={(v) => onStyleChange("marginBottom", v)}
                />
                <NumberInput
                  label="Left"
                  value={cs.marginLeft || "0px"}
                  onChange={(v) => onStyleChange("marginLeft", v)}
                />
              </div>
            </div>
            {/* Padding */}
            <div>
              <span className="text-[9px] text-white/30 uppercase tracking-wide block mb-1">
                Padding
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <NumberInput
                  label="Top"
                  value={cs.paddingTop || "0px"}
                  onChange={(v) => onStyleChange("paddingTop", v)}
                />
                <NumberInput
                  label="Right"
                  value={cs.paddingRight || "0px"}
                  onChange={(v) => onStyleChange("paddingRight", v)}
                />
                <NumberInput
                  label="Bottom"
                  value={cs.paddingBottom || "0px"}
                  onChange={(v) => onStyleChange("paddingBottom", v)}
                />
                <NumberInput
                  label="Left"
                  value={cs.paddingLeft || "0px"}
                  onChange={(v) => onStyleChange("paddingLeft", v)}
                />
              </div>
            </div>
            {/* Visual box model */}
            <div className="relative bg-white/5 rounded border border-white/10 p-3">
              <span className="absolute top-1 left-2 text-[8px] text-orange-400/50">margin</span>
              <div className="border border-dashed border-orange-400/30 p-3 rounded">
                <span className="absolute top-[18px] left-[18px] text-[8px] text-green-400/50">padding</span>
                <div className="border border-dashed border-green-400/30 p-2 rounded">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2 text-center">
                    <span className="text-[9px] text-blue-400/60">
                      {Math.round(selectedElement.rect.width)} x{" "}
                      {Math.round(selectedElement.rect.height)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Background */}
        <Section title="Background" icon={Palette} defaultOpen={false}>
          <div className="space-y-2">
            <ColorInput
              label="Background Color"
              value={cs.backgroundColor || "transparent"}
              onChange={(v) => onStyleChange("backgroundColor", v)}
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-white/30 uppercase tracking-wide">
                Background Image URL
              </span>
              <input
                type="text"
                value={
                  cs.backgroundImage && cs.backgroundImage !== "none"
                    ? cs.backgroundImage.replace(/^url\(["']?/, "").replace(/["']?\)$/, "")
                    : ""
                }
                onChange={(e) =>
                  onStyleChange(
                    "backgroundImage",
                    e.target.value ? `url('${e.target.value}')` : "none"
                  )
                }
                placeholder="https://..."
                className="bg-white/5 border border-white/10 rounded text-[11px] text-white/80 px-2 py-1.5 outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
          </div>
        </Section>

        {/* Border */}
        <Section title="Border" icon={Square} defaultOpen={false}>
          <div className="space-y-2">
            <NumberInput
              label="Border Width"
              value={cs.borderTopWidth || "0px"}
              onChange={(v) => onStyleChange("borderWidth", v)}
            />
            <ColorInput
              label="Border Color"
              value={cs.borderColor || "#000000"}
              onChange={(v) => onStyleChange("borderColor", v)}
            />
            <NumberInput
              label="Border Radius"
              value={cs.borderRadius || "0px"}
              onChange={(v) => onStyleChange("borderRadius", v)}
            />
          </div>
        </Section>

        {/* Layout */}
        <Section title="Layout" icon={Layout} defaultOpen={false}>
          <div className="space-y-2">
            <SelectInput
              label="Display"
              value={cs.display || "block"}
              onChange={(v) => onStyleChange("display", v)}
              options={DISPLAY_OPTIONS}
            />
            {(cs.display === "flex" || cs.display === "inline-flex") && (
              <>
                <SelectInput
                  label="Flex Direction"
                  value={cs.flexDirection || "row"}
                  onChange={(v) => onStyleChange("flexDirection", v)}
                  options={FLEX_DIR_OPTIONS}
                />
                <SelectInput
                  label="Justify Content"
                  value={cs.justifyContent || "flex-start"}
                  onChange={(v) => onStyleChange("justifyContent", v)}
                  options={JUSTIFY_OPTIONS}
                />
                <SelectInput
                  label="Align Items"
                  value={cs.alignItems || "stretch"}
                  onChange={(v) => onStyleChange("alignItems", v)}
                  options={ALIGN_OPTIONS}
                />
                <NumberInput
                  label="Gap"
                  value={cs.gap || "0px"}
                  onChange={(v) => onStyleChange("gap", v)}
                />
              </>
            )}
          </div>
        </Section>

        {/* Section Reordering */}
        {sections.length > 0 && (
          <Section title="Sections" icon={Layout}>
            <SectionList sections={sections} onReorder={onSectionReorder} />
          </Section>
        )}
      </div>
    </div>
  );
}

// --- Section list with reorder buttons ---
function SectionList({
  sections,
  onReorder,
}: {
  sections: { index: number; label: string }[];
  onReorder: (from: number, to: number) => void;
}) {
  return (
    <div className="space-y-1">
      {sections.map((section, i) => (
        <div
          key={section.index}
          className="flex items-center gap-2 bg-white/5 rounded border border-white/10 px-2 py-1.5 group"
        >
          <GripVertical size={12} className="text-white/20 shrink-0" />
          <span className="flex-1 text-[11px] text-white/60 truncate">{section.label}</span>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => i > 0 && onReorder(i, i - 1)}
              disabled={i === 0}
              className="p-0.5 text-white/30 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="Move up"
            >
              <ArrowUp size={11} />
            </button>
            <button
              onClick={() => i < sections.length - 1 && onReorder(i, i + 1)}
              disabled={i === sections.length - 1}
              className="p-0.5 text-white/30 hover:text-white/60 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="Move down"
            >
              <ArrowDown size={11} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
