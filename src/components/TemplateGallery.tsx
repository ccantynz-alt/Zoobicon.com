"use client";

import { useState } from "react";
import { TEMPLATES, TEMPLATE_CATEGORIES, type Template } from "@/lib/templates";
import { Sparkles } from "lucide-react";

interface TemplateGalleryProps {
  onSelect: (template: Template) => void;
  isGenerating: boolean;
}

export default function TemplateGallery({ onSelect, isGenerating }: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered =
    activeCategory === "All"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-brand-400" />
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Templates</span>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
              activeCategory === cat
                ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                : "bg-white/[0.03] text-white/30 border border-white/[0.04] hover:text-white/50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template cards */}
      <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
        {filtered.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            disabled={isGenerating}
            className="w-full text-left group p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]
                       hover:bg-white/[0.04] hover:border-white/[0.1] transition-all disabled:opacity-40"
          >
            {/* Color bar */}
            <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${template.thumbnail} mb-3`} />
            <div className="text-sm font-semibold mb-1 group-hover:text-white transition-colors">
              {template.name}
            </div>
            <div className="text-xs text-white/30 leading-relaxed mb-2">
              {template.description}
            </div>
            <div className="flex flex-wrap gap-1">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[9px] text-white/25 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
