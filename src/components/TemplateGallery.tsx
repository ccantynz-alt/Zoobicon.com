"use client";

import { useState } from "react";
import { X, Search, LayoutTemplate } from "lucide-react";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";

interface TemplateGalleryProps {
  onSelectTemplate: (prompt: string) => void;
  onClose: () => void;
}

export default function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = TEMPLATES.filter((t) => {
    const matchesCategory = activeCategory === "All" || t.category === activeCategory;
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[85vh] mx-4 bg-[#0c0c14] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <LayoutTemplate className="w-5 h-5 text-brand-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">Template Gallery</h2>
            <span className="text-[10px] text-white/50 bg-white/[0.05] px-2 py-0.5 rounded-full">
              {TEMPLATES.length} templates
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search + Category filters */}
        <div className="px-5 pt-4 pb-3 space-y-3 border-b border-white/[0.04]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-sm text-white/80 placeholder:text-white/50 outline-none focus:border-brand-500/40 transition-colors"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                    : "bg-white/[0.03] text-white/50 border border-white/[0.04] hover:text-white/50 hover:border-white/[0.08]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Template grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-white/50 text-sm">
              No templates match your search.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((template) => (
                <button
                  key={template.id}
                  onClick={() => onSelectTemplate(template.prompt)}
                  className="group flex flex-col text-left rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all overflow-hidden"
                >
                  {/* Gradient thumbnail */}
                  <div
                    className={`h-24 w-full bg-gradient-to-br ${template.thumbnail} opacity-70 group-hover:opacity-100 transition-opacity`}
                  />
                  {/* Info */}
                  <div className="p-3 flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors truncate">
                      {template.name}
                    </span>
                    <span className="text-[10px] text-brand-400/50 bg-brand-500/[0.06] px-1.5 py-0.5 rounded w-fit">
                      {template.category}
                    </span>
                    <p className="text-[11px] text-white/50 leading-relaxed line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
