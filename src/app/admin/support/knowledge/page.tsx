"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Search,
  Edit3,
  Trash2,
  Save,
  X,
  Loader2,
  Tag,
  RefreshCw,
  CheckCircle2,
  FolderOpen,
} from "lucide-react";

interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoryCount {
  category: string;
  count: number;
}

const CATEGORIES = [
  "general",
  "billing",
  "technical",
  "getting-started",
  "features",
  "hosting",
  "account",
  "api",
];

export default function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Article | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "general",
    content: "",
    keywords: "",
  });

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (search) params.set("search", search);
      const res = await fetch(`/api/email/knowledge?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Failed to fetch knowledge base:", err);
    }
    setLoading(false);
  }, [selectedCategory, search]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const startCreate = () => {
    setCreating(true);
    setEditing(null);
    setFormData({ title: "", category: "general", content: "", keywords: "" });
  };

  const startEdit = (article: Article) => {
    setEditing(article);
    setCreating(false);
    setFormData({
      title: article.title,
      category: article.category,
      content: article.content,
      keywords: (article.keywords || []).join(", "),
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    setSaving(true);
    try {
      const keywords = formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      if (editing) {
        await fetch("/api/email/knowledge", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editing.id,
            title: formData.title,
            category: formData.category,
            content: formData.content,
            keywords,
          }),
        });
      } else {
        await fetch("/api/email/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            category: formData.category,
            content: formData.content,
            keywords,
          }),
        });
      }
      cancelEdit();
      await fetchArticles();
    } catch (err) {
      console.error("Failed to save article:", err);
    }
    setSaving(false);
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("Delete this article? The AI will no longer reference it.")) return;
    try {
      await fetch(`/api/email/knowledge?id=${id}`, { method: "DELETE" });
      await fetchArticles();
      if (editing?.id === id) cancelEdit();
    } catch (err) {
      console.error("Failed to delete article:", err);
    }
  };

  const toggleActive = async (article: Article) => {
    await fetch("/api/email/knowledge", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: article.id, is_active: !article.is_active }),
    });
    await fetchArticles();
  };

  return (
    <div>
      {/* Header */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/support" className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <BookOpen className="w-6 h-6 text-indigo-500" />
            <h1 className="text-lg font-semibold text-slate-800">Knowledge Base</h1>
            <span className="text-sm text-slate-700">
              {articles.length} articles
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startCreate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Article
            </button>
            <button onClick={fetchArticles} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto flex" style={{ height: "calc(100vh - 60px)" }}>
        {/* Sidebar — Categories */}
        <div className="w-56 border-r border-slate-200 p-3 flex flex-col gap-1">
          <button
            onClick={() => {
              setSelectedCategory(null);
              cancelEdit();
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              !selectedCategory
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            All Articles
          </button>
          {CATEGORIES.map((cat) => {
            const count = categories.find((c) => c.category === cat)?.count || 0;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  cancelEdit();
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="capitalize">{cat.replace("-", " ")}</span>
                {count > 0 && (
                  <span className="text-xs text-slate-600">{count}</span>
                )}
              </button>
            );
          })}

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="px-3 text-xs text-slate-700 mb-2">How it works</p>
            <p className="px-3 text-xs text-slate-600 leading-relaxed">
              Articles you add here are automatically included as context when the AI
              drafts support responses. More articles = smarter AI replies.
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchArticles()}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {creating || editing ? (
              /* Editor */
              <div className="max-w-3xl mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-slate-800">
                    {editing ? "Edit Article" : "New Article"}
                  </h2>
                  <button
                    onClick={cancelEdit}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, title: e.target.value }))
                      }
                      placeholder="e.g., How to deploy a website"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-600 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, category: e.target.value }))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-600 mb-1">
                      Content{" "}
                      <span className="text-slate-600">
                        — this is what the AI reads when drafting replies
                      </span>
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, content: e.target.value }))
                      }
                      placeholder="Write the full answer here. Include step-by-step instructions, URLs, pricing details — anything the AI should know when answering questions about this topic."
                      rows={15}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 resize-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-slate-600 mb-1">
                      Keywords{" "}
                      <span className="text-slate-600">— comma-separated, helps matching</span>
                    </label>
                    <input
                      type="text"
                      value={formData.keywords}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, keywords: e.target.value }))
                      }
                      placeholder="deploy, hosting, custom domain, DNS"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || !formData.title.trim() || !formData.content.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      {editing ? "Update" : "Create"}
                    </button>
                  </div>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center py-20 text-slate-600">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg mb-2 text-slate-600">No articles yet</p>
                <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
                  Add articles to teach the AI how to respond to common support
                  questions. The more you add, the smarter the AI becomes.
                </p>
                <button
                  onClick={startCreate}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Create your first article
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {articles.map((article) => (
                  <div
                    key={article.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      article.is_active
                        ? "bg-white border-slate-200 hover:border-slate-300"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm text-slate-800 truncate">
                            {article.title}
                          </h3>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize flex-shrink-0">
                            {article.category.replace("-", " ")}
                          </span>
                          {!article.is_active && (
                            <span className="text-xs text-amber-600 flex-shrink-0">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 line-clamp-2">
                          {article.content.substring(0, 200)}
                        </p>
                        {article.keywords && (article.keywords as string[]).length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            <Tag className="w-3 h-3 text-slate-600" />
                            {(article.keywords as string[]).slice(0, 5).map((kw) => (
                              <span
                                key={kw}
                                className="text-xs text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                        <button
                          onClick={() => toggleActive(article)}
                          className={`p-1.5 rounded transition-colors ${
                            article.is_active
                              ? "text-emerald-500 hover:bg-emerald-50"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                          title={article.is_active ? "Disable" : "Enable"}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startEdit(article)}
                          className="p-1.5 rounded text-slate-600 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteArticle(article.id)}
                          className="p-1.5 rounded text-slate-600 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
