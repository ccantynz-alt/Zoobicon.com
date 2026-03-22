"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  GitFork,
  ExternalLink,
  Search,
  Sparkles,
  Clock,
  TrendingUp,
  Star,
  Award,
  Filter,
  Loader2,
  User,
  LogOut,
  LayoutDashboard,
  Rocket,
  ChevronDown,
  X,
} from "lucide-react";

/* ---------- animation helpers ---------- */
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const staggerContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

/* ---------- types ---------- */
interface GalleryItem {
  id: string;
  prompt: string;
  siteName: string;
  creator: string;
  category: string;
  upvotes: number;
  comments: number;
  buildTime: number;
  url: string;
  createdAt: string;
  staffPick?: boolean;
  tags?: string[];
}

/* ---------- constants ---------- */
const SORT_OPTIONS = [
  { key: "trending", label: "Trending", icon: TrendingUp },
  { key: "newest", label: "Newest", icon: Clock },
  { key: "most_upvoted", label: "Most Upvoted", icon: Heart },
  { key: "staff_picks", label: "Staff Picks", icon: Award },
];

const CATEGORIES = [
  "All",
  "Business",
  "Portfolio",
  "E-Commerce",
  "SaaS",
  "Restaurant",
  "Blog",
  "Agency",
  "Landing Page",
];

/* ---------- gradient map for placeholder cards ---------- */
const GRADIENT_MAP: Record<string, string> = {
  Business: "from-blue-600 to-cyan-500",
  Portfolio: "from-purple-600 to-pink-500",
  "E-Commerce": "from-emerald-600 to-teal-400",
  SaaS: "from-indigo-600 to-blue-400",
  Restaurant: "from-orange-600 to-amber-400",
  Blog: "from-rose-600 to-pink-400",
  Agency: "from-violet-600 to-purple-400",
  "Landing Page": "from-cyan-600 to-blue-400",
};

/* ---------- time ago helper ---------- */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/* ========== GALLERY CARD ========== */
function GalleryCard({ item, index }: { item: GalleryItem; index: number }) {
  const [upvoted, setUpvoted] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(item.upvotes);
  const gradient = GRADIENT_MAP[item.category] || "from-gray-600 to-gray-500";

  const handleUpvote = async () => {
    const wasUpvoted = upvoted;
    setUpvoted(!wasUpvoted);
    setLocalUpvotes((c) => (wasUpvoted ? c - 1 : c + 1));

    try {
      await fetch(`/api/gallery/${item.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upvote" }),
      });
    } catch {
      // revert on error
      setUpvoted(wasUpvoted);
      setLocalUpvotes((c) => (wasUpvoted ? c + 1 : c - 1));
    }
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300"
    >
      {/* Staff pick badge */}
      {item.staffPick && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-medium backdrop-blur-sm">
          <Award className="w-3 h-3" />
          Staff Pick
        </div>
      )}

      {/* Preview image placeholder */}
      <div className={`relative h-48 bg-gradient-to-br ${gradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        {/* Grid overlay for visual texture */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='white' stroke-width='0.5'/%3E%3C/svg%3E\")", backgroundSize: "40px 40px" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-white font-bold text-lg drop-shadow-lg">{item.siteName}</p>
            <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-white/20 text-white/80 text-xs backdrop-blur-sm">
              {item.category}
            </span>
          </div>
        </div>
        {/* Build time badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white/80 text-xs backdrop-blur-sm">
          <Clock className="w-3 h-3" />
          Built in {item.buildTime}s
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Prompt */}
        <p className="text-sm text-gray-300 leading-relaxed line-clamp-2 mb-4 min-h-[2.5rem]">
          &ldquo;{item.prompt}&rdquo;
        </p>

        {/* Creator + time */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
              {item.creator.charAt(0)}
            </div>
            <span className="text-xs text-gray-400">{item.creator}</span>
          </div>
          <span className="text-xs text-gray-500">{timeAgo(item.createdAt)}</span>
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-white/[0.04] text-gray-500 text-[10px] border border-white/[0.06]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            {/* Upvote */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleUpvote}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                upvoted
                  ? "text-pink-400"
                  : "text-gray-500 hover:text-pink-400"
              }`}
            >
              <motion.div
                animate={upvoted ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className="w-4 h-4"
                  fill={upvoted ? "currentColor" : "none"}
                />
              </motion.div>
              {localUpvotes}
            </motion.button>

            {/* Comments */}
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <MessageCircle className="w-4 h-4" />
              {item.comments}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Remix */}
            <Link
              href={`/builder?remix=${item.id}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <GitFork className="w-3.5 h-3.5" />
              Remix
            </Link>

            {/* View Live */}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ========== MAIN PAGE ========== */
export default function GalleryPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState("trending");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Auth check
  useEffect(() => {
    try {
      const u = localStorage.getItem("zoobicon_user");
      if (u) setIsLoggedIn(true);
    } catch {
      /* ignore */
    }
  }, []);

  // Fetch gallery items
  const fetchItems = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          sort,
          category,
          search,
          page: String(pageNum),
          limit: "12",
        });
        const res = await fetch(`/api/gallery?${params}`);
        const data = await res.json();

        if (append) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }
        setTotalPages(data.pagination.totalPages);
      } catch {
        /* fail silently for MVP */
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [sort, category, search]
  );

  // Refetch on filter change
  useEffect(() => {
    setPage(1);
    fetchItems(1);
  }, [fetchItems]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchItems(next, true);
  };

  const activeSort = useMemo(
    () => SORT_OPTIONS.find((s) => s.key === sort) || SORT_OPTIONS[0],
    [sort]
  );

  return (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* ===== NAV ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050508]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            <div className="w-px h-5 bg-white/10" />
            <Link href="/" className="font-bold text-lg tracking-tight">
              Zoobicon
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem("zoobicon_user");
                    setIsLoggedIn(false);
                  }}
                  className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/builder"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Start Building
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <div className="pt-32 pb-6 px-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Community Builds
          </div>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight mb-4">
            Prompt{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Gallery
            </span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            See what the community is building. Every site below was created from a single
            prompt. Get inspired, upvote your favorites, and remix the best.
          </p>

          {/* Share CTA */}
          <Link
            href="/builder?share=true"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30"
          >
            <Rocket className="w-4 h-4" />
            Share Your Build
          </Link>
        </motion.div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {/* Top row: search + sort + filter toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search prompts, sites, creators..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort tabs */}
            <div className="hidden sm:flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
              {SORT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = sort === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                        : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Mobile sort + filter toggle */}
            <div className="flex sm:hidden items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-gray-400 hover:text-white transition-colors flex-1"
              >
                <Filter className="w-4 h-4" />
                {activeSort.label}
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

          {/* Mobile sort dropdown */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="sm:hidden overflow-hidden mb-4"
              >
                <div className="flex flex-wrap gap-2 py-2">
                  {SORT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => { setSort(opt.key); setShowFilters(false); }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          sort === opt.key
                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20"
                            : "bg-white/[0.03] text-gray-400 border border-white/[0.06]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  category === cat
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
                    : "bg-white/[0.03] text-gray-400 border border-white/[0.06] hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ===== GALLERY GRID ===== */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No results found</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              {search
                ? `No builds matching "${search}". Try a different search term.`
                : `No builds in the "${category}" category yet. Be the first!`}
            </p>
            <Link
              href="/builder?share=true"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Create Something
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Results count */}
            <p className="text-xs text-gray-500 mb-4">
              {items.length} build{items.length !== 1 ? "s" : ""} found
            </p>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {items.map((item, idx) => (
                <GalleryCard key={item.id} item={item} index={idx} />
              ))}
            </motion.div>

            {/* Load More */}
            {page < totalPages && (
              <div className="flex justify-center mt-12">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-8 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-medium text-gray-300 hover:bg-white/[0.06] hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {loadingMore ? "Loading..." : "Load More Builds"}
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== BOTTOM CTA ===== */}
      <div className="border-t border-white/[0.06] py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold mb-4">
              Ready to build something{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                amazing
              </span>
              ?
            </h2>
            <p className="text-gray-400 mb-8">
              Join the community. Build a site from a single prompt, deploy it, and share it
              with the world.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
              >
                <Sparkles className="w-4 h-4" />
                Open the Builder
              </Link>
              <Link
                href="/showcase"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.04] border border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.06] font-medium rounded-xl transition-all"
              >
                View Showcase
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/[0.06] py-12 px-6 text-center">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
          <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
          <Link href="/pricing" className="hover:text-gray-400 transition-colors">Pricing</Link>
          <Link href="/showcase" className="hover:text-gray-400 transition-colors">Showcase</Link>
          <Link href="/generators" className="hover:text-gray-400 transition-colors">Generators</Link>
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
          <Link href="/support" className="hover:text-gray-400 transition-colors">Support</Link>
        </div>
        <p className="text-xs text-gray-700 mt-4">&copy; {new Date().getFullYear()} Zoobicon. All rights reserved.</p>
      </footer>
    </div>
  );
}
