# Session Handover — March 19, 2026

## Branch
`claude/setup-mailgun-api-zrhbI`

## What Was Done This Session

### Commits (oldest → newest):
1. **Phase 1-7 of website redesign** (prior session) — new design system, homepage overhaul, domain pages, scroll effects, conversion optimization, social sharing, performance optimization
2. **Admin pages brightened** — better contrast across admin sub-pages
3. **Hero redesign** (`43560b7`) — full-screen cinematic background image with gradient overlay, bolder "Build the Future" headline, bigger CTAs with glow, live builder demo moved below the fold as its own section
4. **Build fix** (`42e3b0e`) — restored `eslint.ignoreDuringBuilds: true` in `next.config.js` (Vercel runs Next.js 14, not 16; removing it caused ESLint errors to fail the build)
5. **ShowcaseGallery rewrite** (`c435557`) — replaced all wireframe/mockup components with real HTML rendered in sandboxed iframes (6 high-quality showcase sites: SaaS analytics, fashion e-commerce, dev portfolio, creative agency, bakery, cloud SaaS)

### Key Files Modified:
- `next.config.js` — removed `turbopack` key (only valid for Next.js 16+), restored `eslint.ignoreDuringBuilds`
- `src/app/page.tsx` — full-screen image hero, removed rotating words animation, added builder demo as separate section below fold
- `src/components/HeroDemo.tsx` — upgraded demo previews with rich HTML (SaaS dashboard with charts, e-commerce with products, portfolio with terminal aesthetic)
- `src/components/ShowcaseGallery.tsx` — complete rewrite: 6 items with real HTML in iframes instead of 12 items with colored div wireframes

## Known Issues / Things to Watch
1. **Vercel runs Next.js 14.2.35** — do NOT add Next.js 16-only config keys (`turbopack`, etc.)
2. **`eslint.ignoreDuringBuilds: true` is critical** — without it, pre-existing ESLint errors in `src/app/api/marketplace/install/route.ts` and `src/app/builder/page.tsx` will fail the Vercel build
3. **Hero image** uses Unsplash direct URL (`photo-1639322537228-f710d846310a`) — works but consider self-hosting for reliability
4. **Font download warning** — Google Fonts stylesheet sometimes fails to download during build (non-blocking, just skips font optimization)

## What's Left from the Redesign Checklist (CLAUDE.md)
- **ShowcaseGallery** — done but could add more items (currently 6, was 12)
- **BeforeAfter component** — exists but may need polish
- **Phase 3: Domain pages** (.ai, .io, .sh, dominat8) — were updated in prior phases
- **Phase 4: Conversion** — segmented CTAs, sticky nav done; before/after slider exists
- **Phase 5: Viral/Social** — OG images, Twitter cards done; prompt gallery page not built
- **Phase 6: Design system** — spacing, gradients, card effects, cursor spotlight done
- **Phase 7: Performance** — lazy loading, font subsetting, DNS prefetch done

## Build & Deploy
```bash
npm install          # node_modules must be installed first
npm run build        # or: npx next build
git push -u origin claude/setup-mailgun-api-zrhbI
```

## Environment Notes
- Local has Next.js 16.2.0 installed (`node_modules`)
- Vercel deploys with Next.js 14.2.35 (from `package.json`)
- This mismatch means some features/configs work locally but not on Vercel
