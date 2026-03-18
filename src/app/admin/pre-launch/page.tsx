"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2, Circle, ArrowLeft, Rocket, Shield, Globe, Zap,
  Server, Mail, CreditCard, Search, Users, Code2, Lock, BarChart3,
  AlertTriangle, Eye, FileText, Bug, Gauge, Accessibility, Bot,
  Database, Cpu, Wifi, Paintbrush, Smartphone, MonitorSmartphone,
  ChevronDown, ChevronRight, Trophy, Target,
} from "lucide-react";
import BackgroundEffects from "@/components/BackgroundEffects";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  link?: string;
  competitorNote?: string;
}

const CATEGORIES = [
  { key: "infrastructure", label: "Infrastructure & DevOps", icon: Server, color: "text-blue-400" },
  { key: "security", label: "Security & Auth", icon: Shield, color: "text-red-400" },
  { key: "email", label: "Email & Notifications", icon: Mail, color: "text-amber-400" },
  { key: "payments", label: "Payments & Billing", icon: CreditCard, color: "text-green-400" },
  { key: "seo", label: "SEO & Marketing", icon: Search, color: "text-purple-400" },
  { key: "performance", label: "Performance & Speed", icon: Zap, color: "text-yellow-400" },
  { key: "quality", label: "Quality & Testing", icon: Bug, color: "text-orange-400" },
  { key: "ux", label: "UX & Accessibility", icon: Accessibility, color: "text-cyan-400" },
  { key: "ai", label: "AI Pipeline & Models", icon: Bot, color: "text-violet-400" },
  { key: "competitive", label: "Competitive Edge", icon: Trophy, color: "text-rose-400" },
  { key: "legal", label: "Legal & Compliance", icon: FileText, color: "text-slate-400" },
  { key: "monitoring", label: "Monitoring & Analytics", icon: BarChart3, color: "text-emerald-400" },
];

const CHECKLIST: ChecklistItem[] = [
  // Infrastructure & DevOps
  { id: "inf-1", label: "Production environment configured on Vercel", description: "Deploy to Vercel with production environment variables. Verify all env vars are set (API keys, DB URL, secrets).", priority: "critical", category: "infrastructure", link: "https://vercel.com" },
  { id: "inf-2", label: "Database (Neon) production instance", description: "Ensure Neon Postgres is on a production-tier plan with connection pooling enabled and backup schedule.", priority: "critical", category: "infrastructure" },
  { id: "inf-3", label: "Custom domains configured", description: "zoobicon.com, zoobicon.ai, zoobicon.sh all pointing to Vercel. SSL certificates auto-provisioned.", priority: "critical", category: "infrastructure", link: "/admin/health" },
  { id: "inf-4", label: "CDN & edge caching enabled", description: "Vercel Edge Network active. Static assets cached at edge. Generated sites served via zoobicon.sh with cache headers.", priority: "high", category: "infrastructure" },
  { id: "inf-5", label: "Cloudflare integration live", description: "DNS management, SSL provisioning, and CDN caching via Cloudflare API for hosted sites.", priority: "high", category: "infrastructure", link: "/admin/integrations" },
  { id: "inf-6", label: "CI/CD pipeline running", description: "GitHub Actions: lint, type-check, build on every PR. Auto-deploy main branch to production.", priority: "high", category: "infrastructure" },
  { id: "inf-7", label: "Database migrations verified", description: "All tables exist: users, sites, deployments, projects, agency_*, collab_*, email_*. Run schema check.", priority: "critical", category: "infrastructure", link: "/admin/health" },
  { id: "inf-8", label: "Backup & disaster recovery plan", description: "Neon PITR (point-in-time recovery) enabled. Document recovery procedure. Test restore.", priority: "high", category: "infrastructure" },

  // Security & Auth
  { id: "sec-1", label: "All API keys rotated for production", description: "Generate fresh API keys for Anthropic, OpenAI, Google AI, Stripe, Resend, Mailgun. Remove dev keys.", priority: "critical", category: "security" },
  { id: "sec-2", label: "Admin credentials secured", description: "Change default admin password (Zoobicon2024!Admin). Set strong ADMIN_EMAIL and ADMIN_PASSWORD in env.", priority: "critical", category: "security", link: "/admin/email-settings" },
  { id: "sec-3", label: "OAuth credentials (Google/GitHub) configured", description: "Production OAuth app with correct redirect URIs: /api/auth/callback/google, /api/auth/callback/github.", priority: "critical", category: "security" },
  { id: "sec-4", label: "Rate limiting active on all API routes", description: "Verify rate limits: Free 10/min, Pro 60/min, Enterprise 600/min. Test with rapid requests.", priority: "high", category: "security" },
  { id: "sec-5", label: "CORS headers configured", description: "Only allow requests from zoobicon.com, zoobicon.ai, zoobicon.sh domains. Block other origins.", priority: "high", category: "security" },
  { id: "sec-6", label: "Input sanitization on all forms", description: "XSS prevention on contact forms, support tickets, user inputs. HTML entities escaped.", priority: "high", category: "security" },
  { id: "sec-7", label: "JWT/session security review", description: "Verify token expiry, secure cookie flags, CSRF protection. Test session hijacking scenarios.", priority: "high", category: "security" },
  { id: "sec-8", label: "API key validation (zbk_live_*) tested", description: "Test HMAC-SHA256 stateless key validation. Verify invalid keys are rejected.", priority: "high", category: "security" },

  // Email & Notifications
  { id: "email-1", label: "Admin email address configured", description: "Set ADMIN_EMAIL and ADMIN_NOTIFICATION_EMAIL in production env vars.", priority: "critical", category: "email", link: "/admin/email-settings" },
  { id: "email-2", label: "Mailgun API key and domain configured", description: "MAILGUN_API_KEY and MAILGUN_DOMAIN set. All emails (notifications, support, password resets) route through Mailgun.", priority: "critical", category: "email", link: "/admin/email-settings" },
  { id: "email-3", label: "Mailgun inbound webhook registered", description: "Inbound webhook URL registered at Mailgun dashboard for receiving support ticket emails.", priority: "high", category: "email" },
  { id: "email-4", label: "Email templates tested", description: "Send test emails for all notification types: signup, deploy, contact, waitlist. Verify HTML rendering.", priority: "high", category: "email" },
  { id: "email-5", label: "SPF/DKIM/DMARC DNS records", description: "Email authentication records set for zoobicon.com to prevent emails landing in spam.", priority: "high", category: "email" },
  { id: "email-6", label: "Support email workflow tested end-to-end", description: "Customer sends email -> ticket created -> agent replies -> customer receives reply. Full round-trip.", priority: "high", category: "email", link: "/email-support" },

  // Payments & Billing
  { id: "pay-1", label: "Stripe live mode keys configured", description: "Switch from test keys (sk_test_) to live keys (sk_live_). Update STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.", priority: "critical", category: "payments" },
  { id: "pay-2", label: "Stripe webhooks configured", description: "Register production webhook endpoint. Verify signature validation. Handle: checkout.session.completed, customer.subscription.*", priority: "critical", category: "payments" },
  { id: "pay-3", label: "Pricing tiers match Stripe products", description: "Free/Pro/Enterprise plans created in Stripe Dashboard. Price IDs match code.", priority: "critical", category: "payments", link: "/pricing" },
  { id: "pay-4", label: "Payment flow tested end-to-end", description: "Complete a real purchase: select plan -> checkout -> payment -> access upgraded. Test with Stripe test card first.", priority: "critical", category: "payments" },
  { id: "pay-5", label: "Subscription management working", description: "Users can upgrade, downgrade, cancel subscriptions. Billing portal accessible.", priority: "high", category: "payments" },
  { id: "pay-6", label: "Marketplace checkout working", description: "Add-on purchase flow: browse -> add to cart -> Stripe checkout -> delivery (delivery needs implementation).", priority: "medium", category: "payments", link: "/marketplace" },

  // SEO & Marketing
  { id: "seo-1", label: "Meta tags on all pages", description: "Title, description, og:title, og:description, og:image on every page. Unique per page.", priority: "high", category: "seo" },
  { id: "seo-2", label: "Sitemap.xml generated", description: "Dynamic sitemap at /sitemap.xml listing all public pages. Submit to Google Search Console.", priority: "high", category: "seo" },
  { id: "seo-3", label: "robots.txt configured", description: "Allow crawling of public pages. Block /admin, /api, /dashboard. Sitemap URL included.", priority: "high", category: "seo" },
  { id: "seo-4", label: "Google Search Console verified", description: "Verify zoobicon.com ownership. Submit sitemap. Monitor indexing.", priority: "high", category: "seo" },
  { id: "seo-5", label: "Google Analytics / Plausible installed", description: "Privacy-friendly analytics tracking pageviews, conversions, funnel completion.", priority: "high", category: "seo" },
  { id: "seo-6", label: "Social media previews tested", description: "Share links on Twitter, LinkedIn, Facebook. Verify og:image renders correctly.", priority: "medium", category: "seo" },
  { id: "seo-7", label: "JSON-LD structured data on key pages", description: "Organization, Product, FAQ schema on homepage, pricing, support pages.", priority: "medium", category: "seo" },

  // Performance & Speed
  { id: "perf-1", label: "Lighthouse score >90 on all pages", description: "Run Lighthouse on homepage, builder, pricing, dashboard. Target 90+ on Performance, Accessibility, Best Practices, SEO.", priority: "high", category: "performance" },
  { id: "perf-2", label: "Bundle size optimized", description: "Tree-shaking for lucide-react and framer-motion working (next.config.js). Check bundle analyzer.", priority: "high", category: "performance" },
  { id: "perf-3", label: "Image optimization enabled", description: "Next.js Image component used where possible. External images have sizes defined. WebP served.", priority: "medium", category: "performance" },
  { id: "perf-4", label: "API response times <500ms", description: "Test all critical API routes. Auth routes <200ms. Generate endpoints have streaming (acceptable longer).", priority: "high", category: "performance" },
  { id: "perf-5", label: "Pipeline build time benchmarked", description: "Target: 95s average for 7-agent pipeline. Document baseline. Monitor for regressions.", priority: "high", category: "performance", competitorNote: "Bolt: 3-5s (WebContainers), Lovable: 30-90s, v0: 5-15s. Our 95s is competitive for full-stack but we need the instant scaffold path." },
  { id: "perf-6", label: "Static pages pre-rendered", description: "Homepage, pricing, terms, privacy should be statically generated at build time.", priority: "medium", category: "performance" },

  // Quality & Testing
  { id: "qa-1", label: "All 30 page routes verified working", description: "Visit every page route. No 404s, no white screens, no console errors.", priority: "critical", category: "quality" },
  { id: "qa-2", label: "All 90+ API routes returning valid responses", description: "Hit every API endpoint with valid/invalid data. Verify error handling.", priority: "critical", category: "quality", link: "/admin/health" },
  { id: "qa-3", label: "Builder generates valid HTML", description: "Generate 10+ sites with different prompts. Verify valid HTML, no broken CSS, no JS errors.", priority: "critical", category: "quality", link: "/builder" },
  { id: "qa-4", label: "Multi-page generation tested", description: "Generate 3-6 page sites. Verify consistent navigation, shared design, all pages render.", priority: "high", category: "quality" },
  { id: "qa-5", label: "Full-stack generation tested", description: "Generate app with DB schema + API + CRUD UI. Verify schema is valid SQL, endpoints are correct.", priority: "high", category: "quality" },
  { id: "qa-6", label: "E-commerce generation tested", description: "Generate storefront with cart, checkout, product grid. Verify all interactive features.", priority: "high", category: "quality" },
  { id: "qa-7", label: "Deploy and serve flow tested", description: "Generate -> Deploy -> Visit zoobicon.sh slug -> Verify live site. Edit -> Redeploy -> Verify update.", priority: "critical", category: "quality" },
  { id: "qa-8", label: "No broken links on any page", description: "Crawl all internal links. Every href points to a real page. No href='#' remaining.", priority: "high", category: "quality" },
  { id: "qa-9", label: "Cross-browser testing", description: "Test on Chrome, Firefox, Safari, Edge. Verify builder, preview panel, visual editor work.", priority: "high", category: "quality" },
  { id: "qa-10", label: "Mobile responsiveness verified", description: "Test all pages on mobile viewport (375px). Builder sidebar collapses. Forms are usable.", priority: "high", category: "quality" },

  // UX & Accessibility
  { id: "ux-1", label: "Empty states on all pages", description: "Dashboard with no projects, email with no emails, support with no tickets — all show helpful empty states.", priority: "medium", category: "ux" },
  { id: "ux-2", label: "Loading states on all async operations", description: "Spinners, skeletons, or progress bars for: generation, deploy, save, email send, API calls.", priority: "high", category: "ux" },
  { id: "ux-3", label: "Error states with helpful messages", description: "API failures, auth errors, rate limits — all show user-friendly messages, not raw errors.", priority: "high", category: "ux" },
  { id: "ux-4", label: "Keyboard navigation works", description: "Tab through all interactive elements. Enter/Space activates buttons. Escape closes modals.", priority: "medium", category: "ux" },
  { id: "ux-5", label: "Color contrast meets WCAG AA", description: "All text has >=4.5:1 contrast ratio. Critical for admin panels which had very dark backgrounds.", priority: "high", category: "ux" },
  { id: "ux-6", label: "Auth flow is smooth end-to-end", description: "Signup -> verify -> login -> dashboard. OAuth (Google/GitHub) -> auto-create user -> dashboard.", priority: "critical", category: "ux", link: "/auth/signup" },

  // AI Pipeline & Models
  { id: "ai-1", label: "Anthropic API key (Claude) working", description: "ANTHROPIC_API_KEY set. Test: Haiku (planners), Opus (developer), Sonnet (enhancers). All respond.", priority: "critical", category: "ai" },
  { id: "ai-2", label: "OpenAI API key (GPT-4o) working", description: "OPENAI_API_KEY set. Test: user selects GPT-4o -> generation completes. Failover works.", priority: "high", category: "ai" },
  { id: "ai-3", label: "Google AI API key (Gemini) working", description: "GOOGLE_AI_API_KEY set. Test: user selects Gemini 2.5 Pro -> generation completes.", priority: "high", category: "ai" },
  { id: "ai-4", label: "Model failover chain tested", description: "Disable primary key -> verify fallback to secondary provider. Test all failover paths.", priority: "high", category: "ai" },
  { id: "ai-5", label: "Body content validation working", description: "Generate with a prompt that might produce empty body -> verify retry with body-first prompt triggers.", priority: "medium", category: "ai" },
  { id: "ai-6", label: "All 43 generators tested", description: "Run at least 1 generation per generator type. Verify type-specific prompts produce relevant output.", priority: "high", category: "ai", link: "/generators" },
  { id: "ai-7", label: "Component library CSS injected correctly", description: "Generated sites include .btn, .card, .section classes. IntersectionObserver failsafe works.", priority: "high", category: "ai" },
  { id: "ai-8", label: "Streaming generation working", description: "Test /api/generate/stream endpoint. Verify chunks arrive progressively. Preview updates live.", priority: "critical", category: "ai", link: "/builder" },

  // Competitive Edge
  { id: "comp-1", label: "White-label agency feature complete", description: "Agency signup -> client portal -> white-label branding -> bulk generation -> quota tracking. UNIQUE vs competitors.", priority: "high", category: "competitive", competitorNote: "No competitor (v0, Bolt, Lovable) offers white-label agency features. This is our differentiator." },
  { id: "comp-2", label: "43 specialized generators live", description: "Each generator has custom UI fields and type-specific system prompts. Far more than any competitor.", priority: "high", category: "competitive", competitorNote: "Competitors offer generic single prompts. Our 43 generators with custom UIs are unique." },
  { id: "comp-3", label: "Full-stack generation working", description: "DB schema + API routes + CRUD frontend in one generation. Matches Lovable, beats v0/Bolt.", priority: "critical", category: "competitive", competitorNote: "Lovable: Supabase integration. Bolt: manual. v0: no backend. We generate complete full-stack." },
  { id: "comp-4", label: "Multi-LLM support verified", description: "Users can choose Claude, GPT-4o, or Gemini. Automatic failover. Model quality parity.", priority: "high", category: "competitive", competitorNote: "Most competitors are locked to one model. Multi-LLM is a strong selling point." },
  { id: "comp-5", label: "Visual editor matching competitors", description: "Click-to-select, property editor, text editing, section reorder, section library all working.", priority: "high", category: "competitive", competitorNote: "Matches v0/Bolt visual editing. Our section library adds unique value." },
  { id: "comp-6", label: "100 templates ready", description: "All 100 templates across 13 categories are accessible and generate good output.", priority: "high", category: "competitive", link: "/builder" },
  { id: "comp-7", label: "Public API v1 documented", description: "API docs page with examples for generate, deploy, sites endpoints. Swagger/OpenAPI spec.", priority: "medium", category: "competitive", link: "/developers" },
  { id: "comp-8", label: "WordPress plugin downloadable", description: "Zoobicon Connect plugin available at /wordpress. Install instructions clear. Deploy flow tested.", priority: "medium", category: "competitive", link: "/wordpress" },

  // Legal & Compliance
  { id: "legal-1", label: "Privacy policy up to date", description: "Covers data collection, AI processing, cookies, third-party services (Stripe, Neon, AI providers).", priority: "critical", category: "legal", link: "/privacy" },
  { id: "legal-2", label: "Terms of service up to date", description: "Covers acceptable use, generated content ownership, service limitations, liability.", priority: "critical", category: "legal", link: "/terms" },
  { id: "legal-3", label: "Cookie consent banner", description: "GDPR/CCPA compliant cookie notice. Allow opt-out of analytics cookies.", priority: "high", category: "legal" },
  { id: "legal-4", label: "Data processing agreements", description: "DPAs with Neon, Anthropic, OpenAI, Google, Stripe as needed for enterprise customers.", priority: "medium", category: "legal" },

  // Monitoring & Analytics
  { id: "mon-1", label: "Error tracking (Sentry) configured", description: "Sentry DSN set. Source maps uploaded. Alert rules for critical errors.", priority: "high", category: "monitoring" },
  { id: "mon-2", label: "Uptime monitoring active", description: "Monitor homepage, /api/v1/status, /api/hosting/serve. Alert on downtime.", priority: "high", category: "monitoring" },
  { id: "mon-3", label: "API usage tracking", description: "Log generation counts, model usage, response times. Dashboard for trends.", priority: "medium", category: "monitoring", link: "/admin/usage" },
  { id: "mon-4", label: "Cost monitoring for AI APIs", description: "Track spend per provider (Anthropic, OpenAI, Google). Set budget alerts. Monitor Opus token usage.", priority: "high", category: "monitoring" },
  { id: "mon-5", label: "Health check endpoint verified", description: "/admin/health shows all systems green. DB, API, email services all connected.", priority: "high", category: "monitoring", link: "/admin/health" },
];

export default function PreLaunchChecklistPage() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(CATEGORIES.map((c) => c.key)));
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showCompetitorNotes, setShowCompetitorNotes] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("zoobicon_prelaunch_checked");
      if (saved) setChecked(new Set(JSON.parse(saved)));
    } catch { /* */ }
  }, []);

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("zoobicon_prelaunch_checked", JSON.stringify([...next]));
      return next;
    });
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const filtered = filterPriority === "all" ? CHECKLIST : CHECKLIST.filter((i) => i.priority === filterPriority);
  const totalItems = filtered.length;
  const checkedItems = filtered.filter((i) => checked.has(i.id)).length;
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const criticalRemaining = CHECKLIST.filter((i) => i.priority === "critical" && !checked.has(i.id)).length;
  const highRemaining = CHECKLIST.filter((i) => i.priority === "high" && !checked.has(i.id)).length;

  const priorityColor: Record<string, string> = {
    critical: "text-red-400 bg-red-500/10 border-red-500/20",
    high: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    low: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };

  return (
    <div className="min-h-screen bg-[#09090f] text-white">
      <BackgroundEffects />

      {/* Navbar */}
      <nav className="relative z-20 border-b border-white/10 bg-zinc-800/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Admin</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-sm text-white font-medium">Pre-Launch Checklist</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-400">{checkedItems}/{totalItems} complete</span>
            <span className={`font-bold ${progress === 100 ? "text-green-400" : progress > 70 ? "text-yellow-400" : "text-red-400"}`}>{progress}%</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shrink-0">
            <Rocket className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Pre-Launch Checklist</h1>
            <p className="text-zinc-400 mt-1">
              Everything that needs to be done before Zoobicon goes live. Complete all critical items before launch.
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/[0.06] border border-white/10 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Overall Progress</h2>
            <span className="text-2xl font-bold">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden mb-4">
            <motion.div
              className={`h-full rounded-full ${progress === 100 ? "bg-green-500" : progress > 70 ? "bg-blue-500" : progress > 40 ? "bg-yellow-500" : "bg-red-500"}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex gap-4 text-sm">
            {criticalRemaining > 0 && (
              <span className="flex items-center gap-1.5 text-red-400">
                <AlertTriangle className="w-4 h-4" /> {criticalRemaining} critical remaining
              </span>
            )}
            {highRemaining > 0 && (
              <span className="flex items-center gap-1.5 text-orange-400">
                <AlertTriangle className="w-4 h-4" /> {highRemaining} high priority remaining
              </span>
            )}
            {criticalRemaining === 0 && highRemaining === 0 && (
              <span className="flex items-center gap-1.5 text-green-400">
                <CheckCircle2 className="w-4 h-4" /> All critical and high priority items complete!
              </span>
            )}
          </div>
        </div>

        {/* Competitive Landscape Summary */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold">Competitive Position at Launch</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div className="bg-white/[0.06] rounded-lg p-3">
              <div className="text-green-400 font-medium mb-1">We Beat</div>
              <div className="text-zinc-300">White-label agency, 43 generators, multi-LLM, full-stack gen, e-commerce gen, 21+ tools</div>
            </div>
            <div className="bg-white/[0.06] rounded-lg p-3">
              <div className="text-blue-400 font-medium mb-1">We Match</div>
              <div className="text-zinc-300">Visual editing, project mode, templates, multi-page sites, GitHub export</div>
            </div>
            <div className="bg-white/[0.06] rounded-lg p-3">
              <div className="text-yellow-400 font-medium mb-1">Gap to Close</div>
              <div className="text-zinc-300">Build speed (95s vs Bolt 3-5s), in-browser runtime, real-time collab</div>
            </div>
            <div className="bg-white/[0.06] rounded-lg p-3">
              <div className="text-purple-400 font-medium mb-1">Unique Moat</div>
              <div className="text-zinc-300">Agency platform, 43 specialized generators, Opus quality, WordPress plugin</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm text-zinc-500 mr-1">Filter:</span>
          {["all", "critical", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterPriority === p
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
              {p !== "all" && (
                <span className="ml-1 opacity-60">
                  ({CHECKLIST.filter((i) => i.priority === p).length})
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => setShowCompetitorNotes(!showCompetitorNotes)}
            className={`ml-auto px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showCompetitorNotes ? "bg-purple-600/20 text-purple-300" : "bg-white/5 text-zinc-500"
            }`}
          >
            <Trophy className="w-3 h-3 inline mr-1" />
            Competitor notes
          </button>
        </div>

        {/* Checklist by Category */}
        <div className="space-y-4">
          {CATEGORIES.map((cat) => {
            const items = filtered.filter((i) => i.category === cat.key);
            if (items.length === 0) return null;
            const catChecked = items.filter((i) => checked.has(i.id)).length;
            const isExpanded = expandedCategories.has(cat.key);
            const Icon = cat.icon;

            return (
              <div key={cat.key} className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat.key)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.03] transition-colors"
                >
                  <Icon className={`w-5 h-5 ${cat.color}`} />
                  <span className="font-semibold flex-1 text-left">{cat.label}</span>
                  <span className="text-sm text-zinc-400">{catChecked}/{items.length}</span>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden mx-2">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${catChecked === items.length ? "bg-green-500" : "bg-blue-500"}`}
                      style={{ width: `${items.length > 0 ? (catChecked / items.length) * 100 : 0}%` }}
                    />
                  </div>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-white/5">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-start gap-3 px-5 py-3 border-b border-white/5 last:border-0 transition-colors ${
                          checked.has(item.id) ? "bg-green-500/[0.03]" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <button
                          onClick={() => toggleCheck(item.id)}
                          className="mt-0.5 shrink-0"
                        >
                          {checked.has(item.id) ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400 transition-colors" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${checked.has(item.id) ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
                              {item.label}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${priorityColor[item.priority]}`}>
                              {item.priority}
                            </span>
                            {item.link && (
                              <Link href={item.link} className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                                Open →
                              </Link>
                            )}
                          </div>
                          <p className={`text-xs mt-1 leading-relaxed ${checked.has(item.id) ? "text-zinc-600" : "text-zinc-400"}`}>
                            {item.description}
                          </p>
                          {showCompetitorNotes && item.competitorNote && (
                            <div className="mt-2 text-[11px] text-purple-300/70 bg-purple-500/[0.06] border border-purple-500/10 rounded px-2.5 py-1.5">
                              <Trophy className="w-3 h-3 inline mr-1 text-purple-400" />
                              {item.competitorNote}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-8 bg-white/[0.06] border border-white/10 rounded-xl p-6">
          <h3 className="font-semibold mb-3">Launch Readiness Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {["critical", "high", "medium", "low"].map((p) => {
              const total = CHECKLIST.filter((i) => i.priority === p).length;
              const done = CHECKLIST.filter((i) => i.priority === p && checked.has(i.id)).length;
              return (
                <div key={p} className="bg-white/[0.04] rounded-lg p-3">
                  <div className={`text-lg font-bold ${done === total ? "text-green-400" : priorityColor[p].split(" ")[0]}`}>
                    {done}/{total}
                  </div>
                  <div className="text-xs text-zinc-500 capitalize mt-0.5">{p}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              {progress === 100
                ? "All items complete! You are ready to launch."
                : criticalRemaining > 0
                ? `${criticalRemaining} critical items must be completed before launch.`
                : `${highRemaining} high priority items remaining. Critical items are done — launch is possible but not recommended.`}
            </p>
            {progress === 100 && (
              <div className="flex items-center gap-2 text-green-400 font-bold">
                <Rocket className="w-5 h-5" /> READY TO LAUNCH
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Quick Links</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Admin Dashboard</Link>
            <Link href="/admin/health" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Health Check</Link>
            <Link href="/admin/email-settings" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Email Settings</Link>
            <Link href="/admin/integrations" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Integrations</Link>
            <Link href="/admin/usage" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Usage & Credits</Link>
            <Link href="/builder" className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-zinc-300 transition-colors">Builder</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
