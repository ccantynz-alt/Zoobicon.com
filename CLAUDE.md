# CLAUDE.md — Zoobicon Project Guide

## What is this project?

Zoobicon is a **white-label AI website builder platform** built with Next.js 14, React 18, TypeScript, and Tailwind CSS. It uses the Anthropic Claude API for AI generation through a 10-agent pipeline architecture. The platform supports multiple brands from a single codebase via `src/lib/brand-config.ts`.

### Brands / Domains
- **Zoobicon** (primary): zoobicon.com, zoobicon.ai, zoobicon.sh
- **Dominat8** (secondary): dominat8.io, dominat8.com — edgy/aggressive brand variant

Brand detection is automatic via hostname. See `src/lib/brand-config.ts` and `src/app/dominat8/page.tsx`.

## Tech Stack

- **Framework**: Next.js 14 (App Router) with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS + CSS custom properties (no styled-jsx, no CSS modules)
- **AI**: Multi-LLM — Anthropic Claude, OpenAI GPT, Google Gemini via `@anthropic-ai/sdk` + `src/lib/llm-provider.ts`
- **Database**: Neon (serverless Postgres) via `@neondatabase/serverless`
- **Payments**: Stripe
- **Icons**: lucide-react (tree-shaken via next.config.js)
- **Animations**: framer-motion

## Build & Run

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint
```

Build has `ignoreBuildErrors: true` and `ignoreDuringBuilds: true` in next.config.js — this is intentional for rapid iteration.

## Architecture

### Page Routes (src/app/)
30 pages total. All verified working. Key routes:
- `/` — Landing page
- `/builder` — Main AI website builder (the core product)
- `/edit/[slug]` — Post-deploy live editor with version history
- `/dashboard` — User dashboard
- `/admin` — Admin dashboard (fallback credentials in auth route)
- `/auth/*` — Login, signup, forgot-password, reset-password, settings
- `/products/*` — Product pages (website-builder, seo-agent, video-creator, email-support, hosting)
- `/generators` — Hub page linking to all 32+ generators
- `/dominat8` — Secondary brand landing page
- `/pricing`, `/privacy`, `/terms`, `/support`, `/domains`, `/marketplace`, `/hosting`
- `/developers`, `/cli`, `/sh`, `/ai`, `/io` — Developer/branded routes
- `/agencies` — Agency-focused page

### API Routes (src/app/api/)
89 route handlers across 26 directories. All verified working. Key APIs:
- `/api/generate/*` — AI generation endpoints (the core pipeline)
- `/api/auth/*` — Authentication (signup, login, reset)
- `/api/hosting/*` — Site hosting and deployment
- `/api/projects/*` — Project CRUD
- `/api/contact` — Contact form handler
- Plus: admin, animate, chat, clone, crm, db, debug, ecommerce, export, figma, github, invoice, keys, performance, qa, scaffold, seo, stripe, support, translate

### Components (src/components/)
32 components. All imports verified. Key ones:
- `PromptInput.tsx` — Main AI prompt input
- `PipelinePanel.tsx` — Shows 10-agent pipeline progress
- `CodePanel.tsx` — Code editor/viewer
- `PreviewPanel.tsx` — Live preview
- `TopBar.tsx` / `StatusBar.tsx` — Builder chrome

### Lib (src/lib/)
- `agents.ts` — 10-agent pipeline orchestration (Strategist → Brand/Copywriter → Architect → Developer → Animation/SEO/Forms → Integrations → QA). Model routing: Haiku for JSON planners, **Opus for Developer**, Sonnet for enhancers.
- `llm-provider.ts` — Multi-LLM abstraction: Claude, OpenAI (GPT-4o, o3), Google (Gemini 2.5 Pro/Flash)
- `component-library.ts` — CSS design system injected into every generated site
- `brand-config.ts` — White-label brand system
- `db.ts` — Neon database connection
- `hosting.ts` — Deployment/hosting logic
- `storage.ts` — File storage abstraction
- `stripe.ts` — Payment integration
- `password.ts` / `resetToken.ts` — Auth utilities
- `apiKey.ts` / `rateLimit.ts` — API security
- `image-gen.ts` — AI image generation
- `templates.ts` — Site templates

## Important Decisions (Do Not Revert)

1. **No styled-jsx** — Removed intentionally. Use Tailwind only. Adding it back causes build errors.
2. **No duplicate Next config** — Only `next.config.js` exists (not `.mjs`). Do not create a second one.
3. **Error boundary** — `src/app/error.tsx` exists and works. Don't remove it.
4. **ESLint/TS ignored in builds** — Intentional in `next.config.js` for speed. Lint separately.
5. **All placeholder `href="#"` links fixed** — Signup, homepage footer, hosting page all point to real routes now.
6. **`/api/contact` route exists** — Created for the forms-backend generator. Don't delete it.
7. **Admin fallback credentials** — The admin auth has fallback credentials for when the database is unavailable. This is intentional.
8. **Tree-shaking config** — `optimizePackageImports` for lucide-react and framer-motion in next.config.js is critical for bundle size.
9. **Auth-aware navbars on homepage & pricing** — These pages read `localStorage("zoobicon_user")` and show Dashboard/Sign out when logged in, Sign in/Start Building when logged out. Auth is localStorage-based (key: `zoobicon_user`). Do not revert to hardcoded "Sign in" links.
10. **Model routing — Opus for builds** — The Developer agent (the one that produces HTML) MUST use `claude-opus-4-6`. The stream fallback also uses Opus for new builds. Edits use Sonnet for speed. JSON planning agents use Haiku. Do NOT downgrade the Developer agent to Sonnet — it produces noticeably worse output.
11. **Multi-LLM support** — Three providers configured in `.env.local`: `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY`. Provider routing is in `src/lib/llm-provider.ts`. When a user selects a non-Claude model, all pipeline agents route through that provider. Default (no selection) uses the Claude Haiku/Opus/Sonnet split.
12. **Component library injection** — `src/lib/component-library.ts` provides a CSS reset + design system (buttons, cards, inputs, badges, grids, animations) injected into every generated site. Like shadcn/ui for generated output. Do not remove.

## Route Audit Status

Full audit completed. **0 broken routes, 0 broken links, 0 missing API endpoints.** The codebase is clean. If you add new routes, make sure:
- Page routes have a `page.tsx`
- API routes have a `route.ts`
- Any `fetch()` calls to `/api/*` have a corresponding handler
- Any `Link href` or `<a href>` points to an existing page (no `href="#"`)

## Code Style

- Use `"use client"` directive on components that use React hooks or browser APIs
- Use Next.js `Link` component for internal navigation (not `<a>` tags)
- Use Tailwind for all styling — no inline style objects unless dynamic values require it
- Use lucide-react for icons
- Use framer-motion for animations
- API routes export named HTTP method functions: `export async function POST(request: Request)`
