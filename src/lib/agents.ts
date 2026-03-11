/**
 * Multi-Agent Pipeline v2 — Premium 10-Agent Architecture
 *
 * Orchestrates specialized AI agents to produce $20K+ agency-quality output:
 *
 * Phase 1 (Sequential):
 *   1. Strategist Agent — target audience, goals, competitor positioning
 *
 * Phase 2 (Parallel):
 *   2. Brand Agent — colors, typography, component design rules
 *   3. Copywriter Agent — headlines, body, CTAs, testimonials, meta
 *
 * Phase 3 (Sequential):
 *   4. Architect Agent — decides structure (SPA, sections, components)
 *   5. Developer Agent — builds complete HTML/CSS/JS
 *
 * Phase 4 (Parallel):
 *   6. Animation Agent — scroll reveals, parallax, micro-interactions
 *   7. SEO Agent — OG tags, JSON-LD schema, meta optimization
 *   8. Forms Agent — validation, submission handling, spam protection
 *
 * Phase 5 (Sequential):
 *   9. Integrations Agent — GA4, chat widgets, booking, maps
 *  10. QA Agent — Lighthouse-style audit, WCAG check, fixes
 *
 * The pipeline produces output far superior to a single AI call.
 */

import Anthropic from "@anthropic-ai/sdk";
import { callLLM, type LLMProvider } from "./llm-provider";
import { COMPONENT_LIBRARY_INSTRUCTION, injectComponentLibrary } from "./component-library";

export interface PipelineInput {
  prompt: string;
  industry?: string;
  style?: "modern" | "classic" | "bold" | "minimal";
  pages?: string[];
  tier?: "standard" | "premium" | "ultra";
  model?: string; // User-selected model (e.g., "claude-sonnet-4-6", "gpt-4o", "gemini-2.5-pro")
}

export interface AgentResult {
  agent: string;
  output: string;
  duration: number;
}

export interface PipelineResult {
  html: string;
  agents: AgentResult[];
  totalDuration: number;
}

// ── Agent System Prompts ──

const STRATEGIST_SYSTEM = `You are an elite brand strategist who produces the master blueprint that every downstream agent follows. Given a website brief, analyze it deeply and produce a comprehensive strategy.

CRITICAL: If the user provides a detailed brief with specific instructions (visual direction, copy ideas, content structure, color palettes, typography, section layouts, etc.), you MUST incorporate ALL of those details into your strategy. Do NOT simplify or ignore user-specified instructions — they are the client's vision and take priority over your defaults.

Output a JSON object:
{
  "industry": "detected industry",
  "targetAudience": {
    "primary": "description of primary audience",
    "secondary": "description of secondary audience",
    "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
    "desires": ["desire 1", "desire 2", "desire 3"]
  },
  "positioning": {
    "uniqueValue": "what makes this business unique",
    "competitiveAdvantage": "key differentiator",
    "pricePosition": "budget|mid-range|premium|luxury",
    "tone": "professional|friendly|authoritative|playful|sophisticated"
  },
  "goals": {
    "primary": "main website goal (leads, sales, bookings, etc.)",
    "secondary": "secondary goal",
    "keyMetric": "what success looks like"
  },
  "visualDirection": {
    "heroTreatment": "describe the hero approach (cinematic video, full-bleed photo, gradient, etc.)",
    "imageStrategy": "full-bleed|gallery|editorial|minimal — describe the photo treatment style",
    "whitespaceLevel": "generous|moderate|compact — how much breathing room",
    "animationStyle": "cinematic|subtle|bold|minimal — what the motion should feel like",
    "navStyle": "transparent-sticky|solid|minimal|overlay — navigation treatment"
  },
  "colorDirection": {
    "palette": "describe the palette (e.g., 'Coastal Executive: slate, sand, charcoal, white')",
    "mood": "the emotional feel the colors should evoke",
    "avoidColors": ["colors to avoid and why"]
  },
  "typographyDirection": {
    "headingStyle": "serif|sans-serif|slab — with specific font suggestions if user provided them",
    "bodyStyle": "serif|sans-serif — with specific font suggestions",
    "feel": "elegant|modern|bold|editorial"
  },
  "contentStructure": {
    "sitemap": ["ordered list of sections/pages as specified by user or inferred"],
    "heroApproach": "describe what the hero section should contain and feel like",
    "keyDifferentiator": "the one thing that makes this site stand out from competitors"
  },
  "contentPriority": ["most important section", "second", "third"],
  "trustSignals": ["specific trust signals for this industry"],
  "objections": ["common objections visitors will have"],
  "keywords": ["5-10 SEO keywords for this business"],
  "userInstructions": ["list any SPECIFIC instructions from the user brief that must be followed exactly"]
}

Output ONLY valid JSON, nothing else.`;

const BRAND_SYSTEM = `You are an elite brand designer. Given a strategy and brief, produce a comprehensive design specification.

Output a JSON object:
{
  "colorPalette": {
    "primary": "#hex",
    "primaryLight": "#hex",
    "primaryDark": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "backgroundAlt": "#hex",
    "surface": "#hex",
    "text": "#hex",
    "textMuted": "#hex",
    "border": "#hex",
    "success": "#10b981",
    "warning": "#f59e0b",
    "error": "#ef4444"
  },
  "typography": {
    "headingFont": "Google Font name",
    "bodyFont": "Google Font name",
    "heroSize": "clamp(2.5rem, 5vw, 4.5rem)",
    "h2Size": "clamp(2rem, 4vw, 3rem)",
    "h3Size": "clamp(1.5rem, 3vw, 2rem)",
    "bodySize": "16px or 18px",
    "headingWeight": "600 or 700",
    "letterSpacing": "-0.02em",
    "lineHeight": "1.7"
  },
  "layout": {
    "maxWidth": "1200px",
    "sectionPadding": "120px",
    "mobileSectionPadding": "60px",
    "cardRadius": "12px",
    "buttonRadius": "8px",
    "containerPadding": "24px"
  },
  "shadows": {
    "sm": "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
    "md": "0 4px 12px rgba(0,0,0,0.08)",
    "lg": "0 12px 32px rgba(0,0,0,0.12)",
    "hover": "0 16px 40px rgba(0,0,0,0.16)"
  },
  "sections": [
    { "type": "hero|features|about|testimonials|stats|process|faq|cta|footer", "title": "purpose", "notes": "specific design direction" }
  ],
  "darkMode": {
    "background": "#0f172a",
    "surface": "#1e293b",
    "text": "#f1f5f9",
    "textMuted": "#94a3b8",
    "border": "#334155"
  },
  "designNotes": "overall design philosophy",
  "avoidList": ["things to NOT do"]
}

CRITICAL: Match the industry aesthetic. Luxury = serif headings, warm whites. Tech = modern sans, can be dark. Restaurant = warm tones. Medical = soft, calming.
Output ONLY valid JSON.`;

const COPYWRITER_SYSTEM = `You are an elite copywriter who writes for premium brands. Given a strategy and design spec, produce all website copy.

Output a JSON object:
{
  "businessName": "realistic business name",
  "tagline": "compelling tagline",
  "sections": {
    "hero": {
      "headline": "benefit-focused headline (max 10 words)",
      "subheadline": "supporting text (1-2 sentences addressing the pain point)",
      "ctaPrimary": "action button text",
      "ctaSecondary": "secondary action text",
      "socialProof": "trust signal under CTA (e.g., 'Trusted by 500+ companies')"
    },
    "features": {
      "heading": "section heading",
      "subheading": "section description",
      "items": [
        { "title": "feature name (benefit-focused)", "description": "2-3 sentences", "icon": "suggested icon name" }
      ]
    },
    "about": {
      "heading": "section heading",
      "paragraphs": ["paragraph 1", "paragraph 2"],
      "stats": [{ "number": "100+", "label": "Clients Served" }]
    },
    "testimonials": [
      { "quote": "specific, metric-driven testimonial", "name": "Full Name", "title": "Job Title", "company": "Company", "rating": 5 }
    ],
    "faq": [
      { "question": "objection-handling question", "answer": "reassuring answer" }
    ],
    "cta": {
      "heading": "compelling CTA heading",
      "description": "urgency or benefit restatement",
      "buttonText": "action text",
      "reassurance": "No credit card required / Cancel anytime / etc."
    },
    "footer": {
      "description": "brief company description",
      "phone": "realistic phone",
      "email": "realistic email",
      "address": "realistic address",
      "links": ["About", "Services", "Contact", "Privacy", "Terms"]
    }
  },
  "metaSeo": {
    "title": "SEO-optimized page title (50-60 chars)",
    "description": "compelling meta description (150-160 chars)",
    "keywords": ["keyword1", "keyword2"]
  }
}

Rules:
- Every headline is BENEFIT-focused, not feature-focused
- Testimonials mention specific results/numbers — "Increased our conversion rate by 47%" not "Great service!"
- Address objections in FAQ
- CTA includes friction-reducer
- NO lorem ipsum, NO generic placeholder text
- Copy must match the brand tone: formal/authoritative for legal/finance, warm/inviting for hospitality, aspirational for luxury, energetic for tech
- Hero headline must be punchy and memorable (6-10 words max), not generic
- Include 3-4 testimonials with realistic full names, job titles, and companies
- Stats must be specific and believable: "2,847 homes sold" not "Many homes sold"
- Footer must include realistic phone, email, address, and business hours
Output ONLY valid JSON.`;

const ARCHITECT_SYSTEM = `You are a senior web architect. Given a strategy, design spec, and copy, decide the optimal page structure.

Output a JSON object:
{
  "structure": "single-page|multi-section|multi-page",
  "sectionOrder": ["hero", "social-proof-bar", "problem", "features", "about", "process", "testimonials", "stats", "faq", "cta", "footer"],
  "sectionLayouts": {
    "hero": "full-viewport with background image",
    "features": "3-column grid with icons",
    "about": "split layout - text left, image right",
    "testimonials": "3 cards in a row",
    "faq": "accordion layout"
  },
  "interactivity": ["smooth-scroll", "mobile-menu", "faq-accordion", "scroll-animations", "sticky-nav", "counter-animation"],
  "specialComponents": ["announcement-bar", "social-proof-logo-strip", "process-timeline"],
  "responsive": {
    "breakpoints": ["768px", "1024px"],
    "mobileLayout": "stacked single column, full-width images"
  },
  "notes": "any special architectural decisions"
}

Choose section order strategically:
- Hero → establish value
- Social proof → build trust immediately
- Problem → create need
- Solution/Features → show how you solve it
- About → humanize the brand
- Testimonials → reinforce with social proof
- FAQ → handle objections
- CTA → convert
Output ONLY valid JSON.`;

const DEVELOPER_SYSTEM = `You are an elite front-end developer. Given a complete specification (strategy, design, copy, and architecture), produce a single HTML file that looks like it was built by a $30,000 agency.

You receive five inputs:
1. STRATEGY — audience, positioning, goals, visual direction, color direction, typography direction, and any specific user instructions
2. DESIGN SPEC — colors, fonts, layout, shadows
3. COPY — all text content
4. ARCHITECTURE — section order, layouts, interactivity
5. ORIGINAL BRIEF — the user's own words (if they specified exact visual treatments, copy, colors, or layouts — follow them EXACTLY)

CRITICAL: If the strategy contains "userInstructions", those are non-negotiable requirements from the client. Implement every single one.

## Industry-Aware Design — MANDATORY
Match the visual treatment to the industry detected in the strategy:

**Luxury / Real Estate / Legal / Financial / Medical:** LIGHT backgrounds (warm whites #fefefe, #faf9f7, #f5f3ef, soft creams). Elegant serif headings (Playfair Display, Cormorant Garamond, DM Serif Display). Muted accents: navy, forest green, gold, charcoal. NO dark themes, NO gradient blobs, NO neon, NO glass-morphism. Understated elegance with thin borders, subtle shadows.

**SaaS / Tech / Startup:** Dark themes OK (#0f172a). Modern sans: Inter, Space Grotesk, Sora. Vibrant accents: indigo, violet, emerald. Tasteful glass-morphism and gradient accents allowed.

**Restaurant / Food / Hospitality:** Warm palettes: cream, terracotta, olive. Serif headings. Large food/venue photography. NO tech aesthetic.

**Transportation / Shuttle / Taxi / Logistics:** Clean, trustworthy design with blue, navy, or green accents. Hero with fleet/vehicle imagery. Route maps, booking forms, fleet photos. Trust signals: safety ratings, insurance, years of service. NO random stock photos — every image must relate to transportation, vehicles, or travel.

**E-commerce / Retail:** Clean, white-space heavy. Product-focused grids, trust badges, clear pricing.

**Healthcare / Wellness:** Soft calming palettes: sage, lavender, soft blue. Clean and trustworthy.

## OUTPUT STRUCTURE — FOLLOW THIS EXACT ORDER
1. <!DOCTYPE html>, <html>, <head> with meta + title + Google Fonts <link>
2. <style> — MAXIMUM 150 LINES of CSS. Use CSS custom properties. Use the component library classes for common patterns.
3. </head>
4. <body> — THIS IS THE MOST IMPORTANT PART. Must contain ALL sections from the COPY input as visible content. Every section must appear here with real text, images, interactive elements.
5. <script> before </body>
6. </body></html>

## CRITICAL: BODY CONTENT IS MANDATORY
- An HTML file with CSS but empty <body> is a TOTAL FAILURE. This is the #1 failure mode.
- Budget tokens: ~20% on CSS, ~70% on body content, ~10% on JS.
- If running long, STOP adding CSS and complete the body first.

## Technical Rules
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document: <!DOCTYPE html>, <html lang="en">, <head>, <body>.
- All CSS in <style> in <head>. Import Google Fonts from design spec.
- All JS in <script> before </body>.
- Follow the design spec EXACTLY — use specified colors, fonts, spacing.
- Use the copy EXACTLY as provided — do not rewrite.
- Follow the architecture EXACTLY — section order, layouts, components.
- For images use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT with SPECIFIC keywords matching the content (e.g., seed/luxury-shuttle-van/800/500, seed/auckland-skyline/1200/600, seed/gourmet-plating/600/400). NEVER use generic words like 'hero', 'office', 'team', 'service1'. Set descriptive alt text. Apply object-fit: cover. Add CSS: img { background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%); min-height: 120px; } for graceful fallback.
- CSS custom properties for ALL colors (enables dark mode later).
- Fully responsive with mobile hamburger menu.
- CSS transitions: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) on interactive elements.
- Scroll-triggered fade-in: add class .fade-in to sections you want to animate. Do NOT set opacity:0 in CSS or inline styles — the component library handles hiding and revealing safely with failsafes.
- Sticky navbar with background transition on scroll.
- Smooth scrolling for anchor links.
- FAQ accordion if included in architecture.
- Animated number counters if stats section exists.
- Use semantic HTML throughout (header, nav, main, section, footer).

## Typography — CRITICAL for Premium Feel
- Use clamp() for responsive font sizing: hero clamp(2.5rem, 5vw, 4.5rem)
- letter-spacing: -0.02em on large headings
- Body: 16-18px, line-height 1.7-1.8
- Weight hierarchy: 300 (light sub), 400 (body), 600 (sub-headings), 700-800 (headings)
- Never use pure #000 text. Use #1a1a2e, #2d3748, or similar near-black.

## Visual Polish — What Separates $30K from $300
- Backgrounds: alternate white → subtle tint (#faf9f7, #f8fafc) → white for rhythm. Never flat same-color sections.
- Shadows: multi-layer (0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.06)). Cards get ELEVATED shadow on hover.
- Buttons: translateY(-2px) + enhanced multi-layer shadow + slight scale on hover, not just color change.
- Cards: translateY(-4px) + elevated shadow on hover with 0.3s cubic-bezier transition.
- Images: scale(1.03) on hover with overflow:hidden container and border-radius.
- Section transitions: alternate layout direction (text-left/image-right, then image-left/text-right).
- Decorative accents: small colored lines (40px wide, 3px tall, border-radius) above section headings.
- Thin accent-colored top border (3-4px) on the page body for brand touch.
- SVG wave or curve dividers between hero and first section, and between key sections.
- Social proof strip near hero: "Trusted by" with company names/logos in a muted horizontal bar.
- Include a process/how-it-works section with numbered steps connected by lines or a timeline.
- Stats section with animated counters (JS: count from 0 to target number on scroll).
- FAQ section with smooth accordion expand/collapse.
- TWO CTA buttons in hero: primary (filled, prominent shadow) + secondary (outlined/ghost style).
- Scroll-down indicator in hero: animated bouncing chevron.

${COMPONENT_LIBRARY_INSTRUCTION}

## What to NEVER DO
- Dark cyberpunk theme for a bakery, law firm, or dental practice
- Same purple/cyan palette regardless of industry
- Gradient blobs on professional services sites
- Particle effects or matrix rain on business websites
- Bootstrap-looking output or free template aesthetics
- Cramped spacing or walls of text
- Generic placeholder-sounding copy

CRITICAL quality checklist:
✓ CSS custom properties for every color
✓ Generous whitespace (100-140px section padding desktop, 60-80px mobile)
✓ Refined multi-layer shadows
✓ Proper font hierarchy (weight, size, letter-spacing, line-height)
✓ Hover states on ALL clickable elements
✓ Mobile hamburger menu with smooth animation
✓ No horizontal overflow on any screen size
✓ Alt text on all images
✓ Focus-visible states for keyboard navigation
✓ prefers-reduced-motion media query respected`;

const ANIMATION_SYSTEM = `You are an animation specialist. Take the HTML website and enhance it with smooth micro-interactions and scroll effects.

## CRITICAL: DO NOT HIDE ELEMENTS
- NEVER set any element to opacity:0 in CSS or inline styles.
- NEVER add visibility:hidden, display:none, or height:0 to content elements.
- Elements MUST remain VISIBLE at all times — even before animation triggers.
- The page MUST look complete and fully visible with JavaScript disabled.

## How to Add Scroll Animations SAFELY
Use ONLY the component library's animation system:
1. Add class \`.fade-in\` (or \`.fade-in-left\`, \`.fade-in-right\`, \`.scale-in\`) to elements you want to animate.
2. Do NOT add \`.will-animate\` — the component library's failsafe script handles that automatically.
3. Do NOT write your own IntersectionObserver for fade-in animations — it's already handled.
4. Do NOT set opacity:0 anywhere — the component library handles the initial hidden state safely with failsafes.

## What You CAN Add
- Parallax effect on hero background (0.3x scroll speed via transform, NOT by hiding content).
- Animated number counters (0 → target value on scroll) — numbers must START visible at their target value as a fallback.
- Scroll progress bar at page top (a thin colored bar).
- Smooth hover micro-interactions (scale, shadow changes).
- CSS transition enhancements on buttons, cards, links.
- \`prefers-reduced-motion\` media query that disables all animation.

## Rules
- Output ONLY the complete updated HTML. No markdown, no explanation, no code fences.
- Use ONLY transform and opacity for animation performance.
- Do NOT change any content, colors, or layout.
- Do NOT duplicate IntersectionObserver code that the component library already provides.
- Keep all existing JavaScript intact — do not remove or rewrite scripts.`;

const SEO_SYSTEM = `You are an SEO specialist. Take the HTML and inject comprehensive SEO markup.

Rules:
- Output ONLY the complete updated HTML. No markdown, no explanation, no code fences.
- Add/optimize in <head>:
  - <title> tag (50-60 chars, keyword-rich)
  - <meta name="description"> (150-160 chars)
  - Open Graph tags (og:title, og:description, og:type, og:image, og:url)
  - Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image)
  - <link rel="canonical">
  - <meta name="theme-color">
- Add JSON-LD structured data (schema.org):
  - Detect business type → use appropriate schema (LocalBusiness, ProfessionalService, Restaurant, etc.)
  - Include: name, description, url, telephone, address, openingHours, aggregateRating
  - Add FAQPage schema if FAQ section exists
- Fix heading hierarchy (one h1, sequential h2→h3).
- Add descriptive alt text to all images.
- Add loading="lazy" to below-fold images, loading="eager" to hero.
- Add <link rel="preconnect"> for Google Fonts.
- Do NOT change any visible content or design.`;

const FORMS_SYSTEM = `You are a forms specialist. Take the HTML and make all forms fully functional.

Rules:
- Output ONLY the complete updated HTML. No markdown, no explanation, no code fences.
- For EVERY form, add:
  - Real-time validation on blur (email regex, required fields, min length).
  - Visual feedback: green border valid, red border + error message invalid.
  - Honeypot spam field (hidden input, reject if filled).
  - Submit handler with fetch() to a placeholder endpoint.
  - Loading state on submit button (spinner + "Sending...").
  - Success state (replace form with checkmark + thank you message).
  - Error state (error banner with retry).
  - Prevent double submission.
  - Accessible: aria-invalid, aria-describedby for errors.
- Do NOT change any non-form content or design.
- Keep existing form styling, only enhance functionality.`;

const INTEGRATIONS_SYSTEM = `You are an integrations specialist. Take the HTML website and add essential third-party integrations.

Rules:
- Output ONLY the complete updated HTML. No markdown, no explanation, no code fences.
- Add Google Analytics 4 placeholder (gtag.js) with a configurable GA_MEASUREMENT_ID.
- Add a cookie consent banner (GDPR-compliant, simple bottom bar with Accept/Decline).
- If a map/address section exists, add a Google Maps embed placeholder.
- If a booking/calendar section exists, add Calendly or cal.com embed placeholder.
- Add a "Back to top" smooth-scroll button (appears after scrolling 300px).
- Add a simple live chat widget stub (floating button bottom-right, expandable).
- Add social media share meta tags if not already present.
- Add print stylesheet (@media print) that hides nav, footer, chat widget.
- Do NOT change any existing content, colors, layout, or functionality.
- All integrations must be non-blocking (async/defer scripts).`;

const QA_SYSTEM = `You are a senior QA engineer. Review the website HTML and return a JSON report:

{
  "score": 0-100,
  "issues": [
    { "severity": "critical|warning|info", "category": "responsive|accessibility|performance|visual|seo", "description": "what's wrong", "fix": "how to fix it" }
  ],
  "fixedHtml": "the complete fixed HTML if there are critical/warning issues, or empty string if quality is acceptable"
}

Check for:
- Responsive: no horizontal overflow, mobile menu, readable on all screens
- Accessibility: alt text, ARIA labels, focus states, color contrast, semantic HTML, skip link
- Performance: efficient CSS, minimal JS, lazy loading, preconnect hints
- Visual: consistent spacing, typography hierarchy, professional appearance, no broken layouts
- SEO: meta tags present, heading hierarchy, schema.org, OG tags
- Forms: validation works, states handled, accessible
- Animations: respect reduced motion, performant (transform/opacity only)
- Dark mode: if CSS custom properties present, verify they're complete

If score >= 90 and no critical issues, set fixedHtml to empty string.
If there are fixable issues, return the COMPLETE fixed HTML in fixedHtml.
Output ONLY valid JSON.`;

// ── Pipeline Execution ──

export async function runPipeline(
  input: PipelineInput,
  onProgress?: (agent: string, status: string) => void
): Promise<PipelineResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const agents: AgentResult[] = [];
  const startTime = Date.now();
  const isUltra = input.tier === "ultra";

  // Multi-LLM support: if user selected a non-Claude model, use the unified provider
  const userModel = input.model;
  const useMultiLLM = userModel && !userModel.startsWith("claude");

  // Smart model routing — Haiku for fast JSON, Opus for the build, Sonnet for enhancements
  const MODEL_PLANNER = userModel || "claude-haiku-4-5-20251001";   // Fast JSON agents (strategy, brand, copy, architecture)
  const MODEL_BALANCED = userModel || "claude-sonnet-4-6";           // Enhancement agents (animation, SEO, forms, integrations, QA)
  const MODEL_PREMIUM = userModel || "claude-opus-4-6";              // Developer agent — the actual website build

  // Helper: call the right LLM based on user selection
  // Returns { text, stopReason } so we can detect truncation
  const llmCall = async (opts: { model: string; maxTokens: number; system: string; userMessage: string }): Promise<{ text: string; stopReason: string }> => {
    if (useMultiLLM) {
      const res = await callLLM({
        model: opts.model,
        system: opts.system,
        userMessage: opts.userMessage,
        maxTokens: opts.maxTokens,
      });
      return { text: res.text, stopReason: "end_turn" };
    } else {
      // Direct Anthropic SDK for Claude models (fastest path)
      const client = new Anthropic({ apiKey });
      const res = await client.messages.create({
        model: opts.model,
        max_tokens: opts.maxTokens,
        system: opts.system,
        messages: [{ role: "user", content: opts.userMessage }],
      });
      const text = res.content.find((b) => b.type === "text")?.text || "";
      return { text, stopReason: res.stop_reason || "unknown" };
    }
  };

  // Convenience: just get text (for agents where we don't need stop_reason)
  const llmText = async (opts: { model: string; maxTokens: number; system: string; userMessage: string }): Promise<string> => {
    const r = await llmCall(opts);
    return r.text;
  };

  // ── Phase 1: Strategist ──
  onProgress?.("strategist", "analyzing market & audience");
  const strategyStart = Date.now();

  const strategyText = await llmText({
    model: MODEL_PLANNER,
    maxTokens: 8192,
    system: STRATEGIST_SYSTEM,
    userMessage: `Analyze and create a comprehensive strategy for this brief. If the user has provided specific design/content instructions, incorporate ALL of them into your strategy — do not ignore or simplify any user-specified details.\n\nBRIEF:\n${input.prompt}${input.style ? `\nPreferred style: ${input.style}` : ""}`,
  });

  const strategySpec = extractJSON(strategyText);
  agents.push({ agent: "Strategist", output: strategyText, duration: Date.now() - strategyStart });

  // ── Phase 2: Brand + Copywriter (Parallel) ──
  onProgress?.("brand", "designing visual identity");
  onProgress?.("copywriter", "writing content");
  const phase2Start = Date.now();

  const [brandText, copyText] = await Promise.all([
    llmText({
      model: MODEL_PLANNER,
      maxTokens: 8192,
      system: BRAND_SYSTEM,
      userMessage: `Strategy:\n${strategySpec}\n\nOriginal Brief:\n${input.prompt}${input.style ? `\nStyle: ${input.style}` : ""}\n\nCreate a premium design system. If the brief specifies exact colors, typography, or visual direction, follow those instructions precisely.`,
    }),
    llmText({
      model: MODEL_PLANNER,
      maxTokens: 16000,
      system: COPYWRITER_SYSTEM,
      userMessage: `Strategy:\n${strategySpec}\n\nOriginal Brief:\n${input.prompt}\n\nWrite all website copy. If the brief includes specific copy suggestions, section names, or content structure, incorporate them exactly as specified. Match tone to audience.`,
    }),
  ]);

  const brandSpec = extractJSON(brandText);
  agents.push({ agent: "Brand Designer", output: brandText, duration: Date.now() - phase2Start });

  const copySpec = extractJSON(copyText);
  agents.push({ agent: "Copywriter", output: copyText, duration: Date.now() - phase2Start });

  // ── Phase 3: Architect → Developer ──
  onProgress?.("architect", "planning structure");
  const archStart = Date.now();

  const archText = await llmText({
    model: MODEL_PLANNER,
    maxTokens: 8192,
    system: ARCHITECT_SYSTEM,
    userMessage: `Strategy:\n${strategySpec}\n\nDesign:\n${brandSpec}\n\nCopy:\n${copySpec}\n\nOriginal Brief:\n${input.prompt}\n\nPlan the optimal page structure and section order. If the brief specifies a sitemap, section order, or specific page structure, follow that structure.`,
  });

  const archSpec = extractJSON(archText);
  agents.push({ agent: "Architect", output: archText, duration: Date.now() - archStart });

  onProgress?.("developer", "building website");
  const devStart = Date.now();

  // Helper: validate that HTML has real body content
  function hasBodyContent(rawHtml: string): { valid: boolean; bodyChars: number } {
    const m = rawHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (!m) return { valid: false, bodyChars: 0 };
    const bodyText = m[1]
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return { valid: bodyText.length >= 100, bodyChars: bodyText.length };
  }

  const devUserMessage = `STRATEGY:\n${strategySpec}\n\nDESIGN SPEC:\n${brandSpec}\n\nCOPY:\n${copySpec}\n\nARCHITECTURE:\n${archSpec}\n\nORIGINAL BRIEF:\n${input.prompt}\n\nBuild the complete HTML website. Follow all specs exactly. If the original brief contains specific visual, copy, or structural instructions, those take priority.\n\nCRITICAL REMINDER: The <body> must contain ALL the copy content from the COPY section above. Write the full page content inside <body> — headers, sections, text, images, everything. Do NOT produce only CSS with an empty body.`;

  let devResult = await llmCall({
    model: MODEL_PREMIUM,
    maxTokens: 64000,
    system: DEVELOPER_SYSTEM,
    userMessage: devUserMessage,
  });

  let html = cleanHtml(devResult.text);
  let bodyCheck = hasBodyContent(html);
  console.log(`[Pipeline] Developer attempt 1: ${html.length} chars HTML, ${bodyCheck.bodyChars} body text chars, stop: ${devResult.stopReason}`);

  // If body is empty or response was truncated, retry with increasingly focused prompts
  if (!bodyCheck.valid || devResult.stopReason === "max_tokens") {
    console.warn(`[Pipeline] Developer output invalid (body: ${bodyCheck.bodyChars} chars, stop: ${devResult.stopReason}). Retrying...`);
    onProgress?.("developer", "retrying build (body was empty)...");

    devResult = await llmCall({
      model: MODEL_PREMIUM,
      maxTokens: 64000,
      system: DEVELOPER_SYSTEM,
      userMessage: `CRITICAL FAILURE: Your previous attempt produced HTML with CSS but the <body> was EMPTY — zero visible content.\n\nSTRICT RULES FOR THIS ATTEMPT:\n1. Write the <body> content FIRST. Start with <!DOCTYPE html><html><head> (brief CSS only), then IMMEDIATELY write <body> with ALL sections.\n2. CSS budget: MAXIMUM 80 lines. Use inline styles if needed — body content is more important than perfect CSS.\n3. Every section MUST appear: hero, features, about, testimonials, stats, FAQ, CTA, footer.\n4. Do NOT write elaborate CSS animations, custom properties blocks, or media queries until AFTER all body content is written.\n\n${devUserMessage}`,
    });

    html = cleanHtml(devResult.text);
    bodyCheck = hasBodyContent(html);
    console.log(`[Pipeline] Developer attempt 2: ${html.length} chars HTML, ${bodyCheck.bodyChars} body text chars, stop: ${devResult.stopReason}`);
  }

  // Third attempt — absolutely minimal CSS, maximum body content
  if (!bodyCheck.valid || devResult.stopReason === "max_tokens") {
    console.warn(`[Pipeline] Developer still empty after retry 1 (body: ${bodyCheck.bodyChars} chars). Final attempt...`);
    onProgress?.("developer", "final retry (minimal CSS)...");

    devResult = await llmCall({
      model: MODEL_PREMIUM,
      maxTokens: 64000,
      system: DEVELOPER_SYSTEM,
      userMessage: `FINAL ATTEMPT — YOUR PREVIOUS TWO ATTEMPTS HAD EMPTY BODIES.\n\nWrite a MINIMAL but COMPLETE page. Use barely any CSS — just basic inline styles if needed. The ONLY thing that matters is that <body> contains real, visible content with all sections. Fancy styling is NOT needed — content is everything.\n\n${devUserMessage}`,
    });

    html = cleanHtml(devResult.text);
    bodyCheck = hasBodyContent(html);
    console.log(`[Pipeline] Developer attempt 3: ${html.length} chars HTML, ${bodyCheck.bodyChars} body text chars, stop: ${devResult.stopReason}`);
  }

  agents.push({ agent: "Developer", output: `[${html.length} chars HTML, ${bodyCheck.bodyChars} body text, stop: ${devResult.stopReason}]`, duration: Date.now() - devStart });

  // Final validation
  if (html.length < 500 || !/<body/i.test(html)) {
    console.error("[Pipeline] Developer agent produced invalid/empty HTML after retry");
    throw new Error("Developer agent failed to produce a valid website. Please try again.");
  }
  if (!bodyCheck.valid) {
    console.error(`[Pipeline] Developer produced empty body after retry (${bodyCheck.bodyChars} chars)`);
    throw new Error("Developer agent produced a page with no visible content after retry. Please try again.");
  }

  // ── Phase 4: Animation + SEO + Forms (Parallel) — ALL tiers ──
  // These are ENHANCEMENT agents — failures should not destroy the developer's output.
  // We also race against a timeout for hosting platforms with short request limits.
  {
    onProgress?.("animation", "adding scroll effects");
    onProgress?.("seo", "optimizing for search");
    onProgress?.("forms", "enhancing form functionality");
    const phase4Start = Date.now();

    try {
      const [animText, seoText, formsText] = await Promise.all([
        llmText({
          model: MODEL_BALANCED,
          maxTokens: 64000,
          system: ANIMATION_SYSTEM,
          userMessage: `Add premium animations to this website:\n\n${html}`,
        }).catch((err) => { console.warn("[Pipeline] Animation agent failed:", err.message); return ""; }),
        llmText({
          model: MODEL_BALANCED,
          maxTokens: 64000,
          system: SEO_SYSTEM,
          userMessage: `Add comprehensive SEO markup to this website:\n\n${html}`,
        }).catch((err) => { console.warn("[Pipeline] SEO agent failed:", err.message); return ""; }),
        llmText({
          model: MODEL_BALANCED,
          maxTokens: 64000,
          system: FORMS_SYSTEM,
          userMessage: `Make all forms functional in this website:\n\n${html}`,
        }).catch((err) => { console.warn("[Pipeline] Forms agent failed:", err.message); return ""; }),
      ]);

      // Safely use animation result as base — only if it's valid and substantial
      if (animText) {
        const enhancedHtml = safeReplaceHtml(html, animText, "Animator");
        if (enhancedHtml !== html) html = enhancedHtml;
      }

      // Merge SEO meta tags from the SEO agent into the HTML
      if (seoText) {
        const seoHeadMatch = seoText.match(/<head>([\s\S]*?)<\/head>/i);
        if (seoHeadMatch) {
          const seoMetaTags = seoHeadMatch[1].match(/<meta[^>]*>|<link[^>]*>|<script type="application\/ld\+json">[\s\S]*?<\/script>/gi) || [];
          const newTags = seoMetaTags.filter(tag =>
            tag.includes('og:') || tag.includes('twitter:') || tag.includes('ld+json') || tag.includes('canonical')
          );
          if (newTags.length > 0) {
            html = html.replace('</head>', `${newTags.join('\n')}\n</head>`);
          }
        }
      }

      // Extract form enhancements from forms result
      if (formsText) {
        const formsScriptMatch = formsText.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/i);
        if (formsScriptMatch && formsScriptMatch[1].includes('addEventListener')) {
          const formJS = formsScriptMatch[1];
          if (formJS.length > 200) {
            html = html.replace('</body>', `<script>\n// Form Enhancement\n${formJS}\n</script>\n</body>`);
          }
        }
      }

      agents.push({ agent: "Animator", output: `[animations ${animText ? "applied" : "skipped"}]`, duration: Date.now() - phase4Start });
      agents.push({ agent: "SEO Specialist", output: `[SEO ${seoText ? "applied" : "skipped"}]`, duration: Date.now() - phase4Start });
      agents.push({ agent: "Forms Engineer", output: `[forms ${formsText ? "applied" : "skipped"}]`, duration: Date.now() - phase4Start });
    } catch (phase4Err) {
      console.warn("[Pipeline] Phase 4 failed entirely, keeping developer HTML:", phase4Err);
      agents.push({ agent: "Enhancement Phase", output: `[skipped: ${phase4Err instanceof Error ? phase4Err.message : "error"}]`, duration: Date.now() - phase4Start });
    }
  }

  // ── Phase 5: Integrations Agent ──
  // Optional enhancement — failure is non-fatal
  {
    onProgress?.("integrations", "adding third-party integrations");
    const intStart = Date.now();

    try {
      const intText = await llmText({
        model: MODEL_BALANCED,
        maxTokens: 64000,
        system: INTEGRATIONS_SYSTEM,
        userMessage: `Add essential integrations to this website:\n\n${html}`,
      });

      html = safeReplaceHtml(html, intText, "Integrations");
      agents.push({ agent: "Integrations", output: `[integrations added]`, duration: Date.now() - intStart });
    } catch (intErr) {
      console.warn("[Pipeline] Integrations agent failed, skipping:", intErr);
      agents.push({ agent: "Integrations", output: `[skipped]`, duration: Date.now() - intStart });
    }
  }

  // ── Final Phase: QA Agent ──
  // Optional — failure is non-fatal
  {
    onProgress?.("qa", "quality review");
    const qaStart = Date.now();

    try {
      const qaText = await llmText({
        model: MODEL_BALANCED,
        maxTokens: 64000,
        system: QA_SYSTEM,
        userMessage: `Review this website HTML for quality:\n\n${html}`,
      });

      agents.push({ agent: "QA Engineer", output: qaText, duration: Date.now() - qaStart });

      // Apply QA fixes if any — safely validated
      try {
        const qaJSON = JSON.parse(extractJSON(qaText));
        if (qaJSON.fixedHtml && qaJSON.fixedHtml.trim().length > 100) {
          html = safeReplaceHtml(html, qaJSON.fixedHtml, "QA Engineer");
        }
      } catch {
        // QA output wasn't valid JSON, keep current HTML
      }
    } catch (qaErr) {
      console.warn("[Pipeline] QA agent failed, skipping:", qaErr);
      agents.push({ agent: "QA Engineer", output: `[skipped]`, duration: Date.now() - qaStart });
    }
  }

  // Inject the Zoobicon Component Library CSS for consistent polish
  html = injectComponentLibrary(html);

  return {
    html,
    agents,
    totalDuration: Date.now() - startTime,
  };
}

function extractJSON(text: string): string {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? jsonMatch[0] : text;
}

/** Strip code fences, preamble text, and trailing commentary from HTML output */
function cleanHtml(raw: string): string {
  let html = raw.trim();
  // Remove markdown code fences (```html ... ``` or ``` ... ```)
  html = html.replace(/^```(?:html|HTML)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
  // Remove any preamble text before <!DOCTYPE or <html
  const docStart = html.search(/<!doctype\s+html|<html/i);
  if (docStart > 0) {
    html = html.slice(docStart);
  }
  // Remove any trailing text after </html>
  const htmlEnd = html.lastIndexOf("</html>");
  if (htmlEnd !== -1) {
    html = html.slice(0, htmlEnd + "</html>".length);
  }
  return html.trim();
}

/**
 * Safely replace HTML only if the new version is valid and substantial.
 * Prevents enhancement agents from destroying the Developer's output
 * with truncated, empty, or non-HTML responses.
 */
function safeReplaceHtml(current: string, candidate: string, agentName: string): string {
  const cleaned = cleanHtml(candidate);
  // Must contain basic HTML structure
  const hasHtmlTag = /<html/i.test(cleaned);
  const hasBody = /<body/i.test(cleaned);
  const hasClosingHtml = /<\/html>/i.test(cleaned);
  // Must be at least 50% the size of the original (enhancement shouldn't halve the page)
  const sizeRatio = cleaned.length / current.length;

  if (!hasHtmlTag || !hasBody || !hasClosingHtml) {
    console.warn(`[Pipeline] ${agentName} returned invalid HTML (missing tags), keeping previous version`);
    return current;
  }
  if (sizeRatio < 0.5) {
    console.warn(`[Pipeline] ${agentName} output too small (${Math.round(sizeRatio * 100)}% of original), keeping previous version`);
    return current;
  }
  if (cleaned.length < 500) {
    console.warn(`[Pipeline] ${agentName} output suspiciously small (${cleaned.length} chars), keeping previous version`);
    return current;
  }

  // Body content check: extract text from body and ensure it has real content
  const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    const bodyContent = bodyMatch[1]
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (bodyContent.length < 100) {
      console.warn(`[Pipeline] ${agentName} body has too little text content (${bodyContent.length} chars), keeping previous version`);
      return current;
    }
  }

  return cleaned;
}
