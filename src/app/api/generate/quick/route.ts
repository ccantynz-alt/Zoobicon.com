import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { COMPONENT_LIBRARY_CSS } from "@/lib/component-library";
import { callLLMWithFailover } from "@/lib/llm-provider";

/** Check if an error is a rate limit or overload that warrants model fallback */
function isRetryableError(err: unknown): boolean {
  if (err instanceof Anthropic.RateLimitError) return true;
  if (err instanceof Anthropic.InternalServerError) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return /rate.limit|overloaded|529|too many/i.test(msg);
}

/** Extract a user-friendly error message from Anthropic SDK errors */
function friendlyError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return "AI service is temporarily unavailable. The site owner needs to update their API key.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "AI service is busy. Please wait a moment and try again.";
  }
  if (err instanceof Anthropic.InternalServerError) {
    return "AI service is temporarily overloaded. Please try again in a moment.";
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (/rate.limit|too many/i.test(msg)) {
    return "AI service is busy. Please wait a moment and try again.";
  }
  if (/api.key|auth/i.test(msg)) {
    return "AI service is temporarily unavailable. The site owner needs to update their API key.";
  }
  return "Generation failed. Please try again.";
}

/**
 * POST /api/generate/quick — Primary generation endpoint (v2 architecture)
 *
 * KEY INSIGHT: Lovable/Bolt/v0 never ask the AI to write CSS from scratch.
 * They have pre-built design systems. The AI only writes structure + content.
 *
 * Our approach:
 * 1. AI outputs ONLY a JSON config (colors, fonts, business name) + body HTML
 * 2. We wrap it in a pre-built template with the component library
 * 3. The AI spends 95% of tokens on CONTENT, not CSS
 *
 * This eliminates the "spent all tokens on CSS, empty body" problem permanently.
 */

export const maxDuration = 300;

// ── The template that wraps AI output ──
// AI never writes this. We control it. Zero tokens wasted.
function buildFullPage(config: SiteConfig, bodyHtml: string): string {
  const { title, description, font1, font2, colors, customCss } = config;

  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font1)}:wght@400;500;600;700;800;900&family=${encodeURIComponent(font2)}:wght@400;500;600;700&display=swap`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description.replace(/"/g, "&quot;")}">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontUrl}" rel="stylesheet">
  <style>
${COMPONENT_LIBRARY_CSS}

/* ── Site Theme ── */
:root {
  --color-primary: ${colors.primary};
  --color-primary-dark: ${colors.primaryDark || colors.primary};
  --color-bg: ${colors.bg};
  --color-bg-alt: ${colors.bgAlt};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-text-muted: ${colors.textMuted};
  --color-border: ${colors.border};
  --color-accent: ${colors.accent || colors.primary};
  --font-heading: '${font1}', ${font1 === "Playfair Display" || font1 === "Cormorant Garamond" || font1 === "Merriweather" ? "serif" : "sans-serif"};
  --font-body: '${font2}', sans-serif;
  --section-padding: 100px;
  --container-padding: 24px;
  --max-width: 1200px;
  --btn-radius: 8px;
  --card-radius: 12px;
}
body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
}
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  line-height: 1.15;
}
${customCss || ""}
  </style>
</head>
<body>
${bodyHtml}
<script>
// Mobile menu
(function(){
  var btn = document.querySelector('.mobile-menu-btn');
  var nav = document.querySelector('.nav-links');
  if (btn && nav) {
    btn.addEventListener('click', function() {
      nav.classList.toggle('open');
      btn.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { nav.classList.remove('open'); btn.classList.remove('open'); });
    });
  }
})();
// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var t=document.querySelector(this.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}
  });
});
// FAQ accordion
document.querySelectorAll('.faq-question').forEach(function(q){
  q.addEventListener('click',function(){
    var a=this.nextElementSibling;
    if(a){a.classList.toggle('open');}
    var icon=this.querySelector('.faq-icon');
    if(icon){icon.textContent=a&&a.classList.contains('open')?'−':'+';}
  });
});
// Scroll animations
(function(){
  var sel='.fade-in,.fade-in-left,.fade-in-right,.scale-in';
  var els=document.querySelectorAll(sel);
  els.forEach(function(el){el.classList.add('will-animate');});
  if('IntersectionObserver' in window){
    var obs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}
      });
    },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
    els.forEach(function(el){obs.observe(el);});
  } else {
    els.forEach(function(el){el.classList.add('visible');});
  }
  setTimeout(function(){
    document.querySelectorAll(sel+':not(.visible)').forEach(function(el){el.classList.add('visible');});
  },3000);
})();
// Animated counters
document.querySelectorAll('.stat-number[data-target]').forEach(function(el){
  var obs=new IntersectionObserver(function(entries){
    if(entries[0].isIntersecting){
      var target=parseInt(el.dataset.target);
      var suffix=el.dataset.suffix||'';
      var prefix=el.dataset.prefix||'';
      var duration=1500;
      var start=Date.now();
      (function animate(){
        var p=Math.min((Date.now()-start)/duration,1);
        p=1-Math.pow(1-p,3);
        el.textContent=prefix+Math.floor(target*p).toLocaleString()+suffix;
        if(p<1)requestAnimationFrame(animate);
      })();
      obs.unobserve(el);
    }
  },{threshold:0.5});
  obs.observe(el);
});
</script>
</body>
</html>`;
}

interface SiteConfig {
  title: string;
  description: string;
  font1: string;
  font2: string;
  colors: {
    primary: string;
    primaryDark?: string;
    bg: string;
    bgAlt: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    accent?: string;
  };
  customCss?: string;
}

// ── System Prompt: Body-Only Architecture ──
// The AI outputs a JSON config block + raw body HTML. That's it.
// No <!DOCTYPE>, no <head>, no <style>, no <script>. Just content.
const BODY_ONLY_SYSTEM = `You are Zoobicon, an elite AI website builder. You output ONLY two things:

1. A JSON config block (wrapped in <config>...</config> tags)
2. Raw HTML for the <body> content (wrapped in <body-html>...</body-html> tags)

You do NOT write <!DOCTYPE>, <html>, <head>, <style>, or <script>. Those are handled by the server. You ONLY write body content using pre-built component classes.

## STEP 1: CONFIG BLOCK
Output a JSON object with site theme settings:
<config>
{
  "title": "Business Name | Tagline",
  "description": "Meta description for SEO, 1-2 sentences",
  "font1": "Inter",
  "font2": "Inter",
  "colors": {
    "primary": "#2563eb",
    "primaryDark": "#1d4ed8",
    "bg": "#ffffff",
    "bgAlt": "#f8fafc",
    "surface": "#ffffff",
    "text": "#1a1a2e",
    "textMuted": "#64748b",
    "border": "#e2e8f0",
    "accent": "#7c3aed"
  },
  "customCss": ""
}
</config>

## COLOR RULES — CRITICAL
DEFAULT TO LIGHT/WHITE BACKGROUNDS. Most professional websites use white or very light backgrounds. Only use a dark background (bg: "#0a0a0a" or similar) if the business explicitly requires it (nightclub, gaming, cinema, goth brand).

Light theme examples by industry:
- Luxury/Legal/Finance: bg "#fffdf8", bgAlt "#faf7f2", text "#1a1a2e", primary "#b8860b" or "#1e3a5f" — warm cream + gold/navy
- SaaS/Tech: bg "#ffffff", bgAlt "#f0f4ff", text "#1a1a2e", primary "#2563eb" — clean white + blue
- Restaurant/Food: bg "#fffaf5", bgAlt "#fdf2e9", text "#2d1810", primary "#c4611a" — warm cream + terracotta
- Healthcare: bg "#f8fffe", bgAlt "#f0faf7", text "#1a2e2a", primary "#0d9488" — soft white + teal
- Creative/Agency: bg "#ffffff", bgAlt "#faf5ff", text "#1a1a2e", primary "#7c3aed" — white + purple
- Real Estate: bg "#ffffff", bgAlt "#f8f6f3", text "#1a1a2e", primary "#1e3a5f" — white + navy
- Fitness: bg "#ffffff", bgAlt "#fef2f2", text "#1a1a2e", primary "#dc2626" — white + red

Font pairings:
- Luxury/Legal/Finance: font1: "Playfair Display", font2: "Inter"
- SaaS/Tech: font1: "Inter", font2: "Inter"
- Restaurant/Food: font1: "Playfair Display", font2: "Lato"
- Healthcare: font1: "Inter", font2: "Inter"
- Creative/Agency: font1: "Space Grotesk", font2: "Inter"

The "customCss" field is for ONLY site-specific CSS that the component library doesn't cover (max 30 lines). Things like hero gradient overlays, custom nav styling, accent decorations. Most sites need very little here.

NEVER use neon colors (#00ff00, #ff00ff, #00ffff, etc.) unless explicitly requested. Use sophisticated, muted accent colors.

## STEP 2: BODY HTML
Output the complete body content wrapped in <body-html>...</body-html> tags.

AVAILABLE COMPONENT CLASSES (these are pre-styled — just use them):
- Buttons: .btn .btn-primary .btn-secondary .btn-ghost .btn-lg .btn-sm
- Cards: .card .card-body .card-img .card-flat
- Layout: .section .section-alt .container .section-header .section-accent
- Grid: .grid .grid-2 .grid-3 .grid-4 (auto-responsive at 768px)
- Flex: .flex .flex-col .items-center .justify-center .justify-between .gap-1 .gap-2 .gap-3 .gap-4
- Text: .text-center .text-muted .text-primary .text-sm .text-lg .font-bold .font-semibold
- Animations: .fade-in .fade-in-left .fade-in-right .scale-in (on each <section>)
- Hero: .hero (full-viewport section) .hero-aurora (animated conic gradient bg) .hero-mesh (layered radial gradients) .hero-grain (film grain overlay) .hero-glass (glassmorphism panel) .hero-gradient-text (gradient text fill) .hero-float .hero-float-delay .hero-float-slow (bobbing) .hero-orb (blurred glow ball — set size/position via inline style) .hero-cursor-glow (mouse-following glow — add empty div) .hero-reveal (stagger-animate children on load) .hero-btn-glow (animated CTA border glow) .hero-typed (typing effect on span)
- Patterns: .testimonial-card .stat-item .stat-number .stat-label .faq-item .faq-question .faq-answer .logo-strip
- Badges: .badge .badge-primary .badge-success
- Inputs: .input .input-group

## BODY SECTIONS — WRITE ALL OF THESE:`;

const STANDARD_SECTIONS = `
1. <nav> — Use: <nav style="position:sticky;top:0;z-index:100;background:var(--color-bg);border-bottom:1px solid var(--color-border)"><div class="container flex justify-between items-center" style="padding:1rem var(--container-padding)">. Include logo text, nav links, CTA button (.btn .btn-primary .btn-sm), and a mobile hamburger button (.mobile-menu-btn).
2. Hero <section> — class="hero hero-mesh fade-in" with full-viewport feel. Wrap text in <div class="container hero-reveal">. Big headline in <h1> with <span class="hero-gradient-text"> on key words, subheading in <p class="text-lg text-muted">, two CTAs (.btn-primary.btn-lg.hero-btn-glow + .btn-ghost.btn-lg), and a social proof line. Add 1-2 <div class="hero-orb"> for ambient glow.
3. Social proof — <section class="section-alt fade-in"> with <div class="logo-strip"> containing 4-5 company name spans.
4. Features — <section class="section fade-in"> with .section-header (h2 + p) then .grid.grid-3 > .card > .card-body. Each card: inline SVG icon (24x24), <h3>, <p class="text-muted">. Write 6 cards.
5. About — <section class="section section-alt fade-in"> with .grid.grid-2: one side = <img> (picsum, 800x500), other side = story text + stats in .flex.gap-3 using .stat-item.
6. Testimonials — <section class="section fade-in"> with .section-header then .grid.grid-3 > .testimonial-card. Each: .testimonial-stars ("★★★★★"), <p> with specific quote mentioning metrics, <div> with name+title. 3 testimonials.
7. Stats — <section class="section section-alt fade-in" with dark or accent background via inline style> with .grid.grid-4 > .stat-item. Use <div class="stat-number" data-target="NUMBER" data-suffix="+" data-prefix="">0</div> for animated counters + .stat-label. 4 stats.
8. FAQ — <section class="section fade-in"> with .section-header then .faq-item > .faq-question (text + <span class="faq-icon">+</span>) + .faq-answer > p. Write 5 Q&As.
9. CTA — <section class="section fade-in" with dark/accent background via inline style, text-center> Compelling headline, subtext, .btn-primary.btn-lg, trust line.
10. Footer — <footer class="section fade-in" style="background:var(--color-text);color:#fff;padding:60px var(--container-padding)"> with .container > .grid.grid-4: about blurb, quick links, services, contact info.

## IMAGE RULES — MANDATORY
Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for ALL images. These are PLACEHOLDER URLs — the server automatically replaces them with real, contextually matched stock photos based on the KEYWORD you provide.

THE KEYWORD IS CRITICAL — it determines which real photo is shown. Make keywords descriptive and include the business industry.

Each image MUST use a UNIQUE seed from this list (assign in order):
- img1: hero image (1200/600)
- img2: about photo (800/500)
- img3: feature card 1 (400/300)
- img4: feature card 2 (400/300)
- img5: feature card 3 (400/300)
- img6: testimonial avatar 1 (80/80)
- img7: testimonial avatar 2 (80/80)
- img8: testimonial avatar 3 (80/80)

For KEYWORD: use the business INDUSTRY plus image purpose, separated by hyphens. Include the core industry word so our photo matcher can find the right category.
Examples for a bakery (note "restaurant" and "food" keywords for matching):
img1=restaurant-bakery-interior, img2=food-baker-kneading-dough, img3=restaurant-fresh-pastries, img4=food-cafe-interior, img5=restaurant-wedding-cake, img6=professional-woman-portrait, img7=professional-man-portrait, img8=professional-young-portrait

Examples for a cybersecurity startup:
img1=cybersecurity-dark-operations-center, img2=technology-security-team, img3=cybersecurity-shield-protection, img4=technology-code-screen, img5=cybersecurity-network-monitoring, img6=technology-professional-man, img7=technology-professional-woman, img8=business-young-professional

ALWAYS include a descriptive alt="" attribute on every <img> tag describing what the image should show.

NEVER reuse a keyword. Every src must be different.

## RULES
- Output ONLY the <config> block and <body-html> block. Nothing else.
- No <!DOCTYPE>, <html>, <head>, <style> tags. The server handles all of that.
- Use ONLY the component classes listed above. They are already styled.
- Every headline is BENEFIT-FOCUSED (what the customer gets, not what the product does).
- Testimonials must include specific metrics and results.
- WRITE REAL, DETAILED CONTENT. Every section should have multiple sentences/paragraphs.
- An empty body is UNACCEPTABLE.
- BACKGROUND: Use WHITE or LIGHT backgrounds unless the business is explicitly dark-themed.`;

const PREMIUM_SECTIONS = `
1. <nav> — Use: <nav style="position:sticky;top:0;z-index:100;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);background:rgba(255,255,255,0.85);border-bottom:1px solid var(--color-border)"><div class="container flex justify-between items-center" style="padding:1rem var(--container-padding)">. Logo text, nav links, CTA button (.btn .btn-primary .btn-sm), mobile hamburger (.mobile-menu-btn). Feels floating/premium.
2. Hero <section> — class="hero hero-aurora hero-grain fade-in" (or "hero hero-mesh hero-grain fade-in" for a softer look). Uses dedicated hero system:
   - Wrap all text content in <div class="container hero-reveal"> for staggered entrance animation
   - Add 2-3 decorative <div class="hero-orb"> positioned via inline style (e.g. style="width:400px;height:400px;top:-100px;right:-100px") for ambient glow
   - Add <div class="hero-cursor-glow"></div> for interactive mouse-follow glow effect
   - Large <h1> with <span class="hero-gradient-text"> on the key phrase (e.g. "Build <span class='hero-gradient-text'>Stunning Websites</span> in Seconds")
   - Optionally add class "hero-typed" to a <span> inside <h1> for a typing animation on the tagline
   - <p class="text-lg text-muted"> addressing the customer's pain point
   - TWO CTAs: .btn-primary.btn-lg.hero-btn-glow (animated glow border) + .btn-ghost.btn-lg
   - Social proof line with avatars or star rating
   - For SaaS/tech sites: add a .hero-glass panel showing a product UI preview or floating feature cards with .hero-float
   - Think Linear.app / Stripe.com level polish — the hero should feel alive and premium.
3. Social proof bar — <section class="fade-in" style="padding:2.5rem var(--container-padding);border-top:1px solid var(--color-border);border-bottom:1px solid var(--color-border)"> with company names.
4. Problem/Pain — <section class="section section-alt fade-in"> addressing frustrations with empathy. "Tired of X? Struggling with Y?" Use .grid.grid-2 or .grid.grid-3 for pain point cards.
5. Solution/Features — <section class="section fade-in"> with .section-header then .grid.grid-3 > .card > .card-body. Each: colorful inline SVG icon in a tinted circle (via inline style), benefit headline, 3-line description connecting feature→benefit→outcome. 6 cards.
6. About/Story — <section class="section section-alt fade-in-left"> with .grid.grid-2. One side: large image. Other: founder story, mission, 3-4 stats inline using .stat-item.
7. Process/How it works — <section class="section fade-in"> with .section-header then numbered steps (1→2→3→4) with icons in accent circles, connected by a subtle line. Each step: number badge, heading, description.
8. Testimonials — <section class="section section-alt fade-in"> with .grid.grid-3 > .testimonial-card. Each: stars, DETAILED quote with specific metrics ("Increased conversion by 47% in 3 months"), avatar image (picsum 80x80), name, title, company. 3 testimonials.
9. Stats — <section class="section fade-in" with subtle accent background (e.g. deep navy #1e3a5f or brand primary, NOT neon) via inline style, white text> with .grid.grid-4 > .stat-item. Use animated counters: <div class="stat-number" data-target="NUMBER" data-suffix="%" data-prefix="">0</div>. 4 impressive stats.
10. Pricing — <section class="section section-alt fade-in"> with .section-header then .grid.grid-3 for 3 pricing tiers. Middle card gets scale(1.05), accent border, "Most Popular" .badge-primary. Each: price, feature list with checkmarks (✓), CTA button.
11. FAQ — <section class="section fade-in"> with .section-header then .faq-item > .faq-question (text + <span class="faq-icon">+</span>) + .faq-answer > p. 6 Q&As handling real objections.
12. Final CTA — <section class="section fade-in" with dramatic dark/gradient background via inline style, centered text, light colors> Big emotional headline, urgency line, .btn-primary.btn-lg, trust badges ("30-day guarantee • No credit card • Cancel anytime").
13. Footer — <footer class="section" style="background:var(--color-text);color:rgba(255,255,255,0.9);padding:80px var(--container-padding) 40px"> with .container > .grid.grid-4: about + newsletter .input, nav links, services, contact + social icons. Bottom: copyright bar.

## IMAGE RULES — MANDATORY
Use https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT for ALL images. These are PLACEHOLDER URLs — the server automatically replaces them with real, contextually matched stock photos based on the KEYWORD.

THE KEYWORD IS CRITICAL — it determines which real photo is shown. Make keywords descriptive and include the business industry.

Each image MUST use a UNIQUE seed. Assign in order:
- img1: hero (1200/600)
- img2: about/story (800/500)
- img3: feature 1 (400/300)
- img4: feature 2 (400/300)
- img5: feature 3 (400/300)
- img6: feature 4 (400/300)
- img7: process step (600/400)
- img8: testimonial avatar 1 (80/80)
- img9: testimonial avatar 2 (80/80)
- img10: testimonial avatar 3 (80/80)
- img11: additional section (800/500)

For KEYWORD: use the business INDUSTRY plus image purpose, separated by hyphens. Include the core industry word so our photo matcher can find the right category.
Example for a law firm (note "legal" and "law" keywords):
img1=legal-modern-law-office-lobby, img2=legal-team-conference-room, img3=legal-courthouse-architecture, img4=legal-contract-signing, img5=legal-client-consultation, img6=legal-library-books, img7=legal-justice-scales-closeup, img8=business-professional-woman, img9=business-senior-businessman, img10=business-young-entrepreneur, img11=legal-city-skyline-downtown

ALWAYS include a descriptive alt="" attribute on every <img> tag describing what the image should show.

NEVER reuse a keyword. Every src must be different.

## PREMIUM QUALITY MARKERS
- Inline SVG icons should be colorful and detailed (not generic), using the primary/accent color
- Use inline styles for premium touches: subtle gradient backgrounds on stats/CTA sections (prefer dark navy or deep brand-color gradients, NOT neon), accent borders on featured cards, generous padding (120px+ on hero/CTA)
- Testimonial quotes must be LONG and SPECIFIC — at least 2-3 sentences with real metrics
- Copy should handle objections, build trust, and create urgency
- The overall feel should be "high-end agency" — lots of whitespace, big typography, confident copy, LIGHT backgrounds with pops of color
- Think Apple.com or Stripe.com — clean, white, spacious. NOT dark/neon/cyberpunk.

## RULES
- Output ONLY the <config> block and <body-html> block. Nothing else.
- No <!DOCTYPE>, <html>, <head>, <style> tags. The server handles all of that.
- Use ONLY the component classes listed above plus inline styles for unique touches.
- An empty body is UNACCEPTABLE.
- BACKGROUND: Use WHITE or LIGHT backgrounds. "Premium" means Apple/Stripe clean — NOT dark/neon.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, tier, model: requestedModel, isAdmin } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "A prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const isPremium = tier === "premium";
    // Admin: full throttle — Opus + fast mode, max tokens, max timeout
    const model = requestedModel || (isAdmin ? "claude-opus-4-6" : isPremium ? "claude-opus-4-6" : "claude-sonnet-4-6");
    const maxTokens = isAdmin ? 64000 : isPremium ? 32000 : 16000;
    const timeout = isAdmin ? 300_000 : isPremium ? 180_000 : 90_000;

    const systemPrompt = BODY_ONLY_SYSTEM + (isPremium ? PREMIUM_SECTIONS : STANDARD_SECTIONS);

    const client = new Anthropic({ apiKey, timeout });
    const encoder = new TextEncoder();

    const userMessage = isPremium
      ? `Build a world-class PREMIUM website for: ${prompt}

This must look like a $30,000 agency built it. Think Apple.com or Stripe.com — clean white background, generous whitespace, sophisticated typography. Include ALL 13 sections with rich, specific content. Every testimonial mentions real metrics. Every headline drives action. Use a LIGHT color scheme with white/cream backgrounds. Every image must use a unique picsum seed.

Output the <config> block first, then the <body-html> block. Nothing else.`
      : `Build a stunning website for: ${prompt}

Include all 10 sections with real, detailed content. Match the aesthetic to the industry. Make it impressive.

Output the <config> block first, then the <body-html> block. Nothing else.`;

    const readable = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        const generate = async (useModel: string, useMaxTokens: number, useTimeout: number): Promise<string> => {
          const isOpus = useModel.includes("opus");
          const c = new Anthropic({
            apiKey,
            timeout: useTimeout,
          });
          const stream = c.messages.stream({
            model: useModel,
            max_tokens: useMaxTokens,
            // Prompt caching: cache the system prompt (identical across requests)
            // Saves ~90% latency on time-to-first-token for repeated calls
            system: [
              {
                type: "text" as const,
                text: systemPrompt,
                cache_control: { type: "ephemeral" as const },
              },
            ],
            messages: isOpus
              ? [{ role: "user", content: userMessage }]
              : [
                  { role: "user", content: userMessage },
                  // Assistant prefill: skip preamble (not supported on Opus 4.6)
                  { role: "assistant", content: "<config>\n{" },
                ],
          });

          // Prepend prefill for non-Opus models so parsing regexes still match
          let accumulated = isOpus ? "" : "<config>\n{";
          for await (const ev of stream) {
            if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
              accumulated += ev.delta.text;
              // Stream body-html chunks to client for live preview
              if (accumulated.includes("<body-html>")) {
                sendEvent({ type: "chunk", content: ev.delta.text });
              }
            }
          }
          return accumulated;
        };

        let sonnetAlreadyTried = false;

        try {
          let raw = "";

          // Try primary model, fall back to Sonnet on any failure
          try {
            raw = await generate(model, maxTokens, timeout);
          } catch (primaryErr) {
            // Fall back to Sonnet for any error when primary is Opus
            // (rate limits, bad requests, timeouts, auth issues, etc.)
            const canFallback = model !== "claude-sonnet-4-6";
            if (canFallback) {
              console.warn(`[Quick] ${model} failed (${primaryErr instanceof Error ? primaryErr.message : "unknown"}), falling back to Sonnet`);
              sendEvent({ type: "status", message: "Switching to fast mode..." });
              sonnetAlreadyTried = true;
              raw = await generate("claude-sonnet-4-6", 16000, 90_000);
            } else {
              throw primaryErr;
            }
          }

          // Parse the config block
          const configMatch = raw.match(/<config>\s*([\s\S]*?)\s*<\/config>/);
          const bodyMatch = raw.match(/<body-html>\s*([\s\S]*?)\s*<\/body-html>/);

          // Fallback: if AI didn't use tags, try to find JSON + HTML directly
          let config: SiteConfig = getDefaultConfig(prompt);
          let bodyHtml: string;

          if (configMatch && bodyMatch) {
            try {
              config = JSON.parse(configMatch[1]);
            } catch {
              // If JSON parse fails, use defaults
              config = getDefaultConfig(prompt);
            }
            bodyHtml = bodyMatch[1].trim();
          } else {
            // AI didn't follow format — check if it output raw HTML instead
            console.warn("[Quick] AI didn't use config/body-html tags, attempting raw HTML extraction");

            // Try to extract a leading JSON config even without <config> tags
            // Opus sometimes outputs raw JSON before the HTML
            const leadingJsonMatch = raw.match(/^\s*(\{[\s\S]*?\})\s*(?=<[a-zA-Z!])/);
            if (leadingJsonMatch) {
              try {
                const parsed = JSON.parse(leadingJsonMatch[1]);
                if (parsed.title || parsed.colors || parsed.font1) {
                  config = { ...getDefaultConfig(prompt), ...parsed };
                  if (parsed.colors) config.colors = { ...getDefaultConfig(prompt).colors, ...parsed.colors };
                  console.log("[Quick] Extracted inline JSON config from raw output");
                }
              } catch {
                // JSON parse failed — use defaults
              }
              // Strip the JSON from raw before extracting body
              raw = raw.slice(leadingJsonMatch[0].length).trim();
            }

            // Try to extract body from raw HTML output
            const rawBodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
            if (rawBodyMatch) {
              bodyHtml = rawBodyMatch[1].trim();
              // Strip scripts — our template adds them
              bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, "");
            } else {
              // Last resort: strip any HTML boilerplate and use everything
              bodyHtml = raw
                .replace(/```(?:html|HTML)?\s*\n?/g, "")
                .replace(/\n?\s*```\s*/g, "")
                .replace(/<!DOCTYPE[^>]*>/i, "")
                .replace(/<\/?html[^>]*>/gi, "")
                .replace(/<head>[\s\S]*?<\/head>/i, "")
                .replace(/<\/?body[^>]*>/gi, "")
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                // Strip any remaining leading JSON objects (safety net)
                .replace(/^\s*\{[\s\S]*?\}\s*(?=<)/, "")
                .trim();
            }
            if (!config.title || config.title === getDefaultConfig(prompt).title) {
              config = getDefaultConfig(prompt);
            }
          }

          // Validate body content
          const textContent = bodyHtml
            .replace(/<[^>]+>/g, "")
            .replace(/\s+/g, " ")
            .trim();

          console.log(`[Quick] ${isPremium ? "Premium" : "Standard"} (${model}): body=${textContent.length} chars`);

          // If body is empty after primary attempt, retry with Sonnet
          if (textContent.length < 50 && isPremium) {
            console.warn(`[Quick] Empty body (${textContent.length} chars), retrying with Sonnet`);
            sendEvent({ type: "status", message: "Optimizing..." });

            const retryRaw = await generate("claude-sonnet-4-6", 16000, 90_000);
            const retryConfig = retryRaw.match(/<config>\s*([\s\S]*?)\s*<\/config>/);
            const retryBody = retryRaw.match(/<body-html>\s*([\s\S]*?)\s*<\/body-html>/);

            if (retryBody) {
              bodyHtml = retryBody[1].trim();
              if (retryConfig) {
                try { config = JSON.parse(retryConfig[1]); } catch { /* keep existing */ }
              }
            }
          }

          // Build the complete page
          const fullPage = buildFullPage(config, bodyHtml);

          sendEvent({ type: "replace", content: fullPage });
          sendEvent({ type: "done" });
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : "Generation error";
          console.error("[Quick] Error:", message);

          // If primary failed and error is retryable, try Sonnet fallback (skip if already tried)
          if (isRetryableError(err) && !sonnetAlreadyTried && model !== "claude-sonnet-4-6") {
            try {
              sendEvent({ type: "status", message: "Switching to fast mode..." });
              const fallbackRaw = await generate("claude-sonnet-4-6", 16000, 90_000);
              const fbConfig = fallbackRaw.match(/<config>\s*([\s\S]*?)\s*<\/config>/);
              const fbBody = fallbackRaw.match(/<body-html>\s*([\s\S]*?)\s*<\/body-html>/);

              let config = getDefaultConfig(prompt);
              let bodyHtml = "";
              if (fbConfig) { try { config = JSON.parse(fbConfig[1]); } catch { /* default */ } }
              if (fbBody) { bodyHtml = fbBody[1].trim(); }

              if (bodyHtml) {
                sendEvent({ type: "replace", content: buildFullPage(config, bodyHtml) });
                sendEvent({ type: "done" });
                controller.close();
                return;
              }
            } catch (fbErr) {
              console.error("[Quick] Sonnet fallback also failed:", fbErr);
            }
          }

          // Cross-provider failover: try OpenAI / Gemini when all Claude models fail
          if (isRetryableError(err)) {
            try {
              sendEvent({ type: "status", message: "Switching AI provider..." });
              const failoverRes = await callLLMWithFailover(
                {
                  model: "gpt-4o", // start with OpenAI as first non-Claude choice
                  system: systemPrompt,
                  userMessage,
                  maxTokens: 16000,
                },
                (_provider, fbModel) => {
                  console.log(`[Quick] Cross-provider failover → ${fbModel}`);
                  sendEvent({ type: "status", message: `Using ${fbModel}...` });
                }
              );

              if (failoverRes.text) {
                // Parse the response — other providers may or may not use our tag format
                const fbRaw = failoverRes.text;
                const fbConfigMatch = fbRaw.match(/<config>\s*([\s\S]*?)\s*<\/config>/);
                const fbBodyMatch = fbRaw.match(/<body-html>\s*([\s\S]*?)\s*<\/body-html>/);

                let config = getDefaultConfig(prompt);
                let bodyHtml = "";

                if (fbConfigMatch) {
                  try { config = JSON.parse(fbConfigMatch[1]); } catch { /* default */ }
                }
                if (fbBodyMatch) {
                  bodyHtml = fbBodyMatch[1].trim();
                } else {
                  // Try extracting raw HTML body if provider didn't use tags
                  const rawBody = fbRaw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                  if (rawBody) {
                    bodyHtml = rawBody[1].trim().replace(/<script[\s\S]*?<\/script>/gi, "");
                  } else {
                    // Last resort: use the whole response if it looks like HTML
                    const trimmed = fbRaw.replace(/^```(?:html)?\n?/i, "").replace(/\n?```\s*$/, "").trim();
                    if (trimmed.includes("<") && trimmed.includes(">")) {
                      bodyHtml = trimmed;
                    }
                  }
                }

                if (bodyHtml) {
                  console.log(`[Quick] Cross-provider failover succeeded via ${failoverRes.provider}/${failoverRes.model}`);
                  sendEvent({ type: "replace", content: buildFullPage(config, bodyHtml) });
                  sendEvent({ type: "done" });
                  controller.close();
                  return;
                }
              }
            } catch (crossErr) {
              console.error("[Quick] Cross-provider failover failed:", crossErr instanceof Error ? crossErr.message : crossErr);
            }
          }

          sendEvent({ type: "error", message: friendlyError(err) });
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[Quick] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Default config when AI doesn't provide one or JSON parsing fails
function getDefaultConfig(prompt: string): SiteConfig {
  const name = prompt.trim().split(/\s+/).slice(0, 3).join(" ");
  return {
    title: `${name} — Professional Services`,
    description: `${name} provides professional services tailored to your needs.`,
    font1: "Inter",
    font2: "Inter",
    colors: {
      primary: "#2563eb",
      primaryDark: "#1d4ed8",
      bg: "#ffffff",
      bgAlt: "#f8fafc",
      surface: "#ffffff",
      text: "#1a1a2e",
      textMuted: "#64748b",
      border: "#e2e8f0",
      accent: "#7c3aed",
    },
  };
}
