import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  GitBranch,
  Globe2,
  PencilRuler,
  FileText,
  Sparkles,
} from "lucide-react";

/**
 * /import — discovery hub for every "bring your existing thing into
 * Zoobicon" path. Centralises the funnels we've shipped (URL clone,
 * WordPress, GitHub, Figma, Notion, audit) so visitors who don't
 * know which path to take can compare in one place.
 *
 * Server component — no client JS needed, ships as static HTML for
 * fast TTFB.
 */

const SITE_URL = "https://zoobicon.com";

export const metadata: Metadata = {
  title: "Import Anything Into Zoobicon — 6 Paths from Existing Sites to React",
  description:
    "Bring an existing URL, WordPress site, GitHub repo, Figma file, or Notion page into Zoobicon and rebuild it as a modern React app. Six import funnels, one builder.",
  alternates: { canonical: `${SITE_URL}/import` },
  openGraph: {
    title: "Import Anything Into Zoobicon",
    description: "Six paths from your existing thing to a modern React app.",
    url: `${SITE_URL}/import`,
    type: "website",
  },
};

interface Path {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: typeof Globe2;
  href: string;
  requires?: string;
  bestFor: string;
}

const PATHS: Path[] = [
  {
    slug: "url",
    name: "URL Clone-and-Upgrade",
    tagline: "Any public site → modern React",
    description:
      "Paste any URL. We parse the public HTML to extract brand colors, fonts, headings, sections, and tech stack, then compose a builder prompt that modernizes the lot.",
    icon: Globe2,
    href: "/upgrade",
    bestFor: "Any site (works regardless of stack). The universal entry point.",
  },
  {
    slug: "wordpress",
    name: "WordPress Import",
    tagline: "wp-json → structured React build",
    description:
      "Reads your posts, pages, categories, and tags via the WordPress REST API. Richer structured data than HTML scraping when wp-json is available.",
    icon: Globe2,
    href: "/wordpress-import",
    bestFor: "WordPress sites with wp-json enabled (which is most of them).",
  },
  {
    slug: "github",
    name: "GitHub Repo Import",
    tagline: "Repo → landing page",
    description:
      "Pulls README + package.json + repo metadata via the public GitHub API. Composes a developer-focused landing page tuned for project adoption.",
    icon: GitBranch,
    href: "/github-import",
    bestFor: "Open-source projects that need a polished marketing page.",
  },
  {
    slug: "figma",
    name: "Figma File Import",
    tagline: "Frames → React sections",
    description:
      "Reads top-level frames via the Figma REST API. Maps each frame to a corresponding React section so the planner respects your design's information architecture.",
    icon: PencilRuler,
    href: "/figma-import",
    requires: "FIGMA_TOKEN env var",
    bestFor: "Designs that already exist in Figma — your IA is the spec.",
  },
  {
    slug: "notion",
    name: "Notion Page Import",
    tagline: "Notion content → public site",
    description:
      "Reads page properties + top-level blocks via the Notion API. Headings become section anchors; paragraphs become body copy.",
    icon: FileText,
    href: "/notion-import",
    requires: "NOTION_TOKEN env + per-page integration share",
    bestFor: "Content-first sites where Notion is the writing surface.",
  },
  {
    slug: "audit",
    name: "Site Audit",
    tagline: "Report-first, rebuild-second",
    description:
      "Same URL extractor as /upgrade but renders a 4-category score report (performance / SEO / accessibility / conversion) first. The rebuild CTA fixes every ✗ check.",
    icon: Sparkles,
    href: "/audit",
    bestFor: "Convincing a stakeholder the rebuild is needed before committing.",
  },
];

export default function ImportHubPage() {
  return (
    <main className="pt-[72px] pb-24" style={{ color: "var(--ink)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <header className="mb-12 max-w-3xl">
          <div
            className="inline-flex items-center gap-1.5 mb-4 text-[10px] uppercase tracking-[0.22em] font-semibold"
            style={{ color: "var(--gold-deep)" }}
          >
            <Sparkles className="w-3 h-3" /> Import hub
          </div>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-[-0.025em] mb-4">
            Bring your existing thing.{" "}
            <span className="display-italic font-normal" style={{ color: "var(--gold-deep)" }}>
              Get a modern React app.
            </span>
          </h1>
          <p className="text-[16px] leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
            Six import paths, one builder. Pick whichever describes your starting
            point — a URL, a WordPress site, a GitHub repo, a Figma design, a
            Notion page, or just an audit-first view. Every path feeds the same
            six-agent pipeline.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PATHS.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.slug}
                href={p.href}
                className="group rounded-2xl p-6 transition-all hover:-translate-y-0.5"
                style={{
                  background: "var(--paper-elevated)",
                  border: "1px solid var(--rule)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--rule)",
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: "var(--gold-deep)" }} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h2 className="text-[17px] font-semibold tracking-[-0.01em] mb-1" style={{ color: "var(--ink)" }}>
                  {p.name}
                </h2>
                <p
                  className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3"
                  style={{ color: "var(--gold-deep)" }}
                >
                  {p.tagline}
                </p>
                <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--ink-secondary)" }}>
                  {p.description}
                </p>
                <div className="text-[11px] mb-1" style={{ color: "var(--ink-muted)" }}>
                  <strong style={{ color: "var(--ink-secondary)" }}>Best for:</strong> {p.bestFor}
                </div>
                {p.requires && (
                  <div className="text-[10px] font-mono" style={{ color: "var(--ink-muted)" }}>
                    requires: {p.requires}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        <section className="mt-16 text-center">
          <p className="text-[13px] mb-3" style={{ color: "var(--ink-secondary)" }}>
            Not bringing anything? Start from a sentence:
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #ef5440 0%, #e8402b 100%)",
              color: "#ffffff",
              border: "1px solid #a47d2c",
              boxShadow: "0 6px 18px -8px rgba(194,51,31,0.5), inset 0 1px 0 0 rgba(255,255,255,0.35)",
            }}
          >
            Open the builder
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
