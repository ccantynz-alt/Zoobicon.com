"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  Layout,
  Type,
  Image,
  Star,
  DollarSign,
  MessageSquare,
  HelpCircle,
  Megaphone,
  Mail,
  Users,
  Phone,
  Grid3X3,
  BookOpen,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SectionEditorProps {
  files: Record<string, string> | null;
  onFilesUpdate: (files: Record<string, string>) => void;
  onEditSection: (sectionName: string) => void;
  isVisible: boolean;
}

interface DetectedSection {
  name: string;
  importLine: string;
  category: string;
}

/* ------------------------------------------------------------------ */
/*  Category helpers                                                   */
/* ------------------------------------------------------------------ */

const CATEGORY_ICON: Record<string, React.ElementType> = {
  hero: Type,
  navbar: Layout,
  features: Grid3X3,
  testimonials: Star,
  pricing: DollarSign,
  stats: Users,
  faq: HelpCircle,
  cta: Megaphone,
  footer: Layout,
  about: Users,
  contact: Phone,
  gallery: Image,
  blog: BookOpen,
  forms: Mail,
  ecommerce: ShoppingCart,
  logos: Sparkles,
  unknown: MessageSquare,
};

const CATEGORY_LABELS: Record<string, string> = {
  hero: "Hero",
  navbar: "Navbar",
  features: "Features",
  testimonials: "Testimonials",
  pricing: "Pricing",
  stats: "Stats",
  faq: "FAQ",
  cta: "Call to Action",
  footer: "Footer",
  about: "About",
  contact: "Contact",
  gallery: "Gallery",
  blog: "Blog",
  forms: "Forms",
  ecommerce: "E-Commerce",
  logos: "Logos",
};

/** Map a component name like "FeaturesBentoGrid" to a category key. */
function inferCategory(name: string): string {
  const lower = name.toLowerCase();
  // Direct match against known category keys
  const keys = Object.keys(CATEGORY_LABELS);
  for (const key of keys) {
    if (lower.startsWith(key) || lower.includes(key)) return key;
  }
  // Fallback heuristics for synonyms
  if (lower.includes("banner") || lower.includes("splash")) return "hero";
  if (lower.includes("nav") || lower.includes("header") || lower.includes("topbar")) return "navbar";
  if (lower.includes("foot") || lower.includes("bottom")) return "footer";
  if (lower.includes("review") || lower.includes("quote") || lower.includes("social-proof")) return "testimonials";
  if (lower.includes("plan") || lower.includes("tier")) return "pricing";
  if (lower.includes("counter") || lower.includes("metric") || lower.includes("number")) return "stats";
  if (lower.includes("question") || lower.includes("accordion")) return "faq";
  if (lower.includes("newsletter") || lower.includes("subscribe") || lower.includes("calltoaction")) return "cta";
  if (lower.includes("portfolio") || lower.includes("showcase") || lower.includes("masonry")) return "gallery";
  if (lower.includes("post") || lower.includes("article") || lower.includes("news")) return "blog";
  if (lower.includes("shop") || lower.includes("product") || lower.includes("cart") || lower.includes("store")) return "ecommerce";
  if (lower.includes("partner") || lower.includes("client") || lower.includes("brand") || lower.includes("marquee")) return "logos";
  if (lower.includes("team") || lower.includes("mission") || lower.includes("story") || lower.includes("founder")) return "about";
  if (lower.includes("signup") || lower.includes("waitlist") || lower.includes("register")) return "forms";
  return "features"; // safe default — most unknown sections are feature-like
}

/* ------------------------------------------------------------------ */
/*  App.tsx parsing utilities                                          */
/* ------------------------------------------------------------------ */

/** Extract imported component names and their order in JSX from App.tsx. */
function parseSections(appCode: string): DetectedSection[] {
  // 1. Collect all default imports (import Foo from "./Foo")
  const importRe = /import\s+(\w+)\s+from\s+["']\.\/(\w+)["']/g;
  const imported = new Map<string, string>(); // name -> full import line
  let m: RegExpExecArray | null;
  while ((m = importRe.exec(appCode)) !== null) {
    imported.set(m[1], m[0]);
  }

  // 2. Find JSX usage order by scanning for <ComponentName in the return body
  const jsxRe = /<(\w+)\s*[/>]/g;
  const ordered: DetectedSection[] = [];
  const seen = new Set<string>();
  while ((m = jsxRe.exec(appCode)) !== null) {
    const tag = m[1];
    if (imported.has(tag) && !seen.has(tag)) {
      seen.add(tag);
      ordered.push({
        name: tag,
        importLine: imported.get(tag) || "",
        category: inferCategory(tag),
      });
    }
  }

  // 3. Any imports not found in JSX go at the end (shouldn't normally happen)
  imported.forEach((line, name) => {
    if (!seen.has(name)) {
      ordered.push({ name, importLine: line, category: inferCategory(name) });
    }
  });

  return ordered;
}

/** Rewrite App.tsx with a new ordering of JSX component tags. */
function reorderAppTsx(
  appCode: string,
  oldOrder: string[],
  newOrder: string[],
): string {
  // Strategy: find the JSX block between return ( ... ) and reorder
  // the self-closing tags to match newOrder.
  // We locate each <Component .../> or <Component ...>...</Component> and
  // collect them, then reconstruct in the new order.

  const tagSnippets = new Map<string, string>();
  for (const name of oldOrder) {
    // Match self-closing <Name ... /> or opening/closing pairs
    const selfClose = new RegExp(`(\\s*<${name}[^>]*/>[\\s]*)`, "s");
    const paired = new RegExp(
      `(\\s*<${name}[^>]*>[\\s\\S]*?</${name}>[\\s]*)`,
      "s",
    );
    const sm = selfClose.exec(appCode);
    const pm = paired.exec(appCode);
    // Use whichever matched (self-closing is more common for sections)
    tagSnippets.set(name, sm ? sm[1] : pm ? pm[1] : `\n        <${name} />`);
  }

  // Build replacement JSX in new order
  let result = appCode;
  // Remove all old tags first
  for (const name of oldOrder) {
    const snippet = tagSnippets.get(name);
    if (snippet) {
      result = result.replace(snippet, "%%SECTION_PLACEHOLDER%%");
    }
  }

  // Collapse placeholders into one insertion point
  const placeholderRe = /(%%SECTION_PLACEHOLDER%%\s*)+/g;
  const newJsx = newOrder
    .map((n) => tagSnippets.get(n) || `\n        <${n} />`)
    .join("");
  result = result.replace(placeholderRe, newJsx);

  // Clean up any leftover placeholders
  result = result.replace(/%%SECTION_PLACEHOLDER%%/g, "");

  return result;
}

/** Remove a component from App.tsx (import + JSX tag). */
function removeSection(appCode: string, name: string): string {
  // Remove import line
  let result = appCode.replace(
    new RegExp(`\\s*import\\s+${name}\\s+from\\s+["'][^"']+["'];?\\s*\\n?`),
    "\n",
  );
  // Remove JSX self-closing tag
  result = result.replace(new RegExp(`\\s*<${name}\\s*/>\\s*`, "g"), "\n");
  // Remove JSX open/close pair
  result = result.replace(
    new RegExp(`\\s*<${name}[^>]*>[\\s\\S]*?</${name}>\\s*`, "g"),
    "\n",
  );
  return result;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SectionEditor({
  files,
  onFilesUpdate,
  onEditSection,
  isVisible,
}: SectionEditorProps) {
  const [showPicker, setShowPicker] = useState(false);

  const appCode = files?.["App.tsx"] || files?.["/App.tsx"] || "";

  const sections = useMemo(() => parseSections(appCode), [appCode]);

  /* ---- actions --------------------------------------------------- */

  const getAppKey = useCallback((): string => {
    if (!files) return "App.tsx";
    if ("App.tsx" in files) return "App.tsx";
    if ("/App.tsx" in files) return "/App.tsx";
    return "App.tsx";
  }, [files]);

  const handleMove = useCallback(
    (index: number, direction: "up" | "down") => {
      if (!files) return;
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= sections.length) return;

      const names = sections.map((s) => s.name);
      const newNames = [...names];
      [newNames[index], newNames[target]] = [newNames[target], newNames[index]];

      const key = getAppKey();
      const updated = reorderAppTsx(files[key], names, newNames);
      onFilesUpdate({ ...files, [key]: updated });
    },
    [files, sections, getAppKey, onFilesUpdate],
  );

  const handleDelete = useCallback(
    (name: string) => {
      if (!files) return;
      const key = getAppKey();
      const updated = removeSection(files[key], name);
      // Also remove the component file if it exists
      const next = { ...files, [key]: updated };
      const possibleKeys = [
        `${name}.tsx`,
        `/${name}.tsx`,
        `${name}.jsx`,
        `/${name}.jsx`,
      ];
      for (const pk of possibleKeys) {
        if (pk in next) delete next[pk];
      }
      onFilesUpdate(next);
    },
    [files, getAppKey, onFilesUpdate],
  );

  const handleAddSection = useCallback(
    (category: string) => {
      // Delegate to the chat-based AI edit flow
      const label = CATEGORY_LABELS[category] || category;
      const lastSection = sections.length > 0 ? sections[sections.length - 1].name : null;
      const afterHint = lastSection ? ` after the ${lastSection} section` : "";
      onEditSection(`Add a ${label.toLowerCase()} section${afterHint}`);
      setShowPicker(false);
    },
    [sections, onEditSection],
  );

  /* ---- render ---------------------------------------------------- */

  if (!isVisible) return null;

  const availableCategories = Object.keys(CATEGORY_LABELS);

  return (
    <div className="flex flex-col h-full bg-[#131520] text-gray-200 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-white">Sections</span>
          <span className="text-xs text-gray-500">({sections.length})</span>
        </div>
      </div>

      {/* Section list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {sections.length === 0 && (
          <div className="text-center text-gray-500 py-8 text-xs">
            No sections detected.
            <br />
            Generate a site first.
          </div>
        )}

        <AnimatePresence initial={false}>
          {sections.map((section, i) => {
            const Icon = CATEGORY_ICON[section.category] || MessageSquare;
            return (
              <motion.div
                key={section.name}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                {/* Drag handle (visual only -- reorder via arrows) */}
                <GripVertical className="w-3.5 h-3.5 text-gray-600 shrink-0 cursor-grab" />

                {/* Category icon */}
                <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-purple-400" />
                </div>

                {/* Name */}
                <span className="flex-1 truncate text-gray-300 text-xs font-medium">
                  {section.name}
                </span>

                {/* Action buttons -- visible on hover */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMove(i, "up")}
                    disabled={i === 0}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(i, "down")}
                    disabled={i === sections.length - 1}
                    className="p-1 rounded hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEditSection(`Edit the ${section.name} section`)}
                    className="p-1 rounded hover:bg-white/10 text-blue-400"
                    title="Edit section"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(section.name)}
                    className="p-1 rounded hover:bg-red-500/20 text-red-400"
                    title="Delete section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add section button */}
      <div className="px-3 py-3 border-t border-white/10">
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
                     bg-gradient-to-r from-purple-600/20 to-blue-600/20
                     border border-purple-500/30 hover:border-purple-400/50
                     text-purple-300 hover:text-white transition-all"
        >
          {showPicker ? (
            <>
              <X className="w-3.5 h-3.5" /> Close
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> Add Section
            </>
          )}
        </button>

        {/* Category picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-1 mt-2">
                {availableCategories.map((cat) => {
                  const CatIcon = CATEGORY_ICON[cat] || MessageSquare;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleAddSection(cat)}
                      className="flex items-center gap-2 px-2 py-2 rounded-md text-xs
                                 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                      <CatIcon className="w-3.5 h-3.5 text-purple-400/70" />
                      {CATEGORY_LABELS[cat]}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
