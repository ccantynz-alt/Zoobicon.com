/**
 * Zoobicon Component Library — CSS Reset + Premium Design System
 *
 * Like Lovable's shadcn/ui injection, this ensures every generated website
 * has a consistent, polished foundation. Injected into the Developer agent's
 * system prompt so generated HTML automatically looks premium.
 *
 * This library provides:
 * 1. CSS reset for consistent cross-browser rendering
 * 2. Premium component styles (buttons, cards, inputs, badges, etc.)
 * 3. Utility classes for common patterns
 * 4. Dark mode support via CSS custom properties
 * 5. Smooth animations and transitions
 */

export const COMPONENT_LIBRARY_CSS = `
/* ══════════════════════════════════════════════════════════
   ZOOBICON COMPONENT LIBRARY v1.0
   Premium Design System — Injected Into Every Build
   ══════════════════════════════════════════════════════════ */

/* ── CSS Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility; }
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
a { color: inherit; text-decoration: none; }
ul, ol { list-style: none; }

/* ── Premium Button System ── */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.75rem 1.75rem; border-radius: var(--btn-radius, 8px); border: none;
  font-weight: 600; font-size: 0.9375rem; line-height: 1; cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative; overflow: hidden;
}
.btn:focus-visible { outline: 2px solid var(--color-primary, #2563eb); outline-offset: 2px; }
.btn-primary {
  background: var(--color-primary, #2563eb); color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 4px 12px color-mix(in srgb, var(--color-primary, #2563eb) 25%, transparent);
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 8px 24px color-mix(in srgb, var(--color-primary, #2563eb) 30%, transparent);
}
.btn-secondary {
  background: transparent; color: var(--color-primary, #2563eb);
  border: 2px solid var(--color-primary, #2563eb);
}
.btn-secondary:hover { background: color-mix(in srgb, var(--color-primary, #2563eb) 8%, transparent); transform: translateY(-2px); }
.btn-ghost { background: transparent; color: var(--color-text, #0f2148); }
.btn-ghost:hover { background: var(--color-surface, #f1f5f9); }
.btn-lg { padding: 1rem 2.25rem; font-size: 1.0625rem; }
.btn-sm { padding: 0.5rem 1.25rem; font-size: 0.8125rem; }

/* ── Card System ── */
.card {
  background: var(--color-surface, #fff); border-radius: var(--card-radius, 12px);
  border: 1px solid var(--color-border, #e2e8f0);
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
}
.card-body { padding: 1.5rem; }
.card-img { width: 100%; object-fit: cover; }
.card-flat { box-shadow: none; border: 1px solid var(--color-border, #e2e8f0); }
.card-flat:hover { border-color: var(--color-primary, #2563eb); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }

/* ── Input System ── */
.input {
  width: 100%; padding: 0.75rem 1rem; border-radius: 8px;
  border: 1.5px solid var(--color-border, #e2e8f0);
  background: var(--color-surface, #fff); color: var(--color-text, #0f2148);
  font-size: 0.9375rem; transition: all 0.2s;
}
.input:focus { border-color: var(--color-primary, #2563eb); outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #2563eb) 15%, transparent); }
.input::placeholder { color: var(--color-text-muted, #94a3b8); }
.input-group { position: relative; }
.input-group .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--color-text-muted, #94a3b8); }
.input-group .input { padding-left: 2.75rem; }

/* ── Badge System ── */
.badge {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.25rem 0.75rem; border-radius: 100px;
  font-size: 0.75rem; font-weight: 600; letter-spacing: 0.025em;
}
.badge-primary { background: color-mix(in srgb, var(--color-primary, #2563eb) 10%, transparent); color: var(--color-primary, #2563eb); }
.badge-success { background: #ecfdf5; color: #059669; }
.badge-warning { background: #fffbeb; color: #d97706; }
.badge-error { background: #fef2f2; color: #dc2626; }

/* ── Section Patterns ── */
.section { padding: var(--section-padding, 100px) var(--container-padding, 24px); }
.section-alt { background: var(--color-bg-alt, #f8fafc); }
.container { max-width: var(--max-width, 1200px); margin: 0 auto; width: 100%; }
.section-header { text-align: center; max-width: 720px; margin: 0 auto 3.5rem; }
.section-header h2 { margin-bottom: 1rem; }
.section-header p { color: var(--color-text-muted, #64748b); font-size: 1.125rem; line-height: 1.7; }
.section-accent { width: 40px; height: 3px; background: var(--color-primary, #2563eb); border-radius: 100px; margin: 0 auto 1.25rem; }

/* ── Grid Utilities ── */
.grid { display: grid; gap: var(--grid-gap, 2rem); }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
.grid-4 { grid-template-columns: repeat(4, 1fr); }
@media (max-width: 1024px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; } }

/* ── Flex Utilities ── */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 0.5rem; } .gap-2 { gap: 1rem; } .gap-3 { gap: 1.5rem; } .gap-4 { gap: 2rem; }

/* ── Text Utilities ── */
.text-center { text-align: center; }
.text-muted { color: var(--color-text-muted, #64748b); }
.text-primary { color: var(--color-primary, #2563eb); }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }

/* ── Animation Utilities ── */
/* Progressive enhancement: elements are VISIBLE by default.
   JS adds .will-animate to hide them, then IntersectionObserver adds .visible to reveal.
   If JS fails, content stays visible — no more blank pages. */
.fade-in, .fade-in-left, .fade-in-right, .scale-in {
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.fade-in.will-animate { opacity: 0; transform: translateY(20px); }
.fade-in-left.will-animate { opacity: 0; transform: translateX(-30px); }
.fade-in-right.will-animate { opacity: 0; transform: translateX(30px); }
.scale-in.will-animate { opacity: 0; transform: scale(0.95); }
.fade-in.visible, .fade-in-left.visible, .fade-in-right.visible, .scale-in.visible {
  opacity: 1; transform: translate(0) scale(1);
}

/* Failsafe: auto-reveal after 2.5s even if JS observer never fires */
@keyframes zbcn-auto-reveal { to { opacity: 1; transform: none; } }
.fade-in.will-animate, .fade-in-left.will-animate, .fade-in-right.will-animate, .scale-in.will-animate {
  animation: zbcn-auto-reveal 0.6s ease forwards 2.5s;
}
.fade-in.visible, .fade-in-left.visible, .fade-in-right.visible, .scale-in.visible {
  animation: none; /* Cancel failsafe once properly revealed */
}

@media (prefers-reduced-motion: reduce) {
  .fade-in, .fade-in-left, .fade-in-right, .scale-in,
  .fade-in.will-animate, .fade-in-left.will-animate, .fade-in-right.will-animate, .scale-in.will-animate {
    transition: none; opacity: 1; transform: none; animation: none;
  }
}

/* ── Scroll Progress Bar ── */
.scroll-progress { position: fixed; top: 0; left: 0; height: 3px; background: var(--color-primary, #2563eb); z-index: 9999; transition: width 0.1s; }

/* ── Back to Top ── */
.back-to-top {
  position: fixed; bottom: 2rem; right: 2rem; width: 44px; height: 44px;
  border-radius: 50%; background: var(--color-primary, #2563eb); color: #fff;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); opacity: 0; pointer-events: none;
  transition: all 0.3s; z-index: 99; border: none;
}
.back-to-top.visible { opacity: 1; pointer-events: auto; }
.back-to-top:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.2); }

/* ── Testimonial Card ── */
.testimonial-card {
  padding: 2rem; border-radius: 12px;
  background: var(--color-surface, #fff); border: 1px solid var(--color-border, #e2e8f0);
  position: relative;
}
.testimonial-card::before {
  content: '\\201C'; position: absolute; top: 1rem; left: 1.5rem;
  font-size: 4rem; line-height: 1; color: var(--color-primary, #2563eb); opacity: 0.25;
  font-family: Georgia, serif;
}
.testimonial-stars { color: #f59e0b; letter-spacing: 0.1em; }

/* ── Stat Counter ── */
.stat-item { text-align: center; }
.stat-number {
  font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 800;
  color: var(--color-primary, #2563eb); letter-spacing: -0.02em;
  line-height: 1.1;
}
.stat-label { color: var(--color-text-muted, #64748b); font-size: 0.9375rem; margin-top: 0.5rem; }

/* ── FAQ Accordion ── */
.faq-item { border-bottom: 1px solid var(--color-border, #e2e8f0); }
.faq-question {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 0; background: none; border: none; cursor: pointer;
  font-size: 1.0625rem; font-weight: 600; text-align: left;
  color: var(--color-text, #0f2148); transition: color 0.2s;
}
.faq-question:hover { color: var(--color-primary, #2563eb); }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.3s ease; }
.faq-answer.open { max-height: 2000px; padding-bottom: 1.25rem; }
.faq-answer p { color: var(--color-text-muted, #64748b); line-height: 1.7; }

/* ── Social Proof Bar ── */
.logo-strip {
  display: flex; align-items: center; justify-content: center; gap: 3rem;
  padding: 2rem; opacity: 0.6; filter: grayscale(100%);
  flex-wrap: wrap;
  transition: opacity 0.3s;
}
.logo-strip:hover { opacity: 0.85; }
.logo-strip img { height: 28px; object-fit: contain; }

/* ── Hero System ── */
.hero {
  position: relative; overflow: hidden; min-height: 100vh;
  display: flex; align-items: center;
  padding: 140px var(--container-padding, 24px) 100px;
}

/* Aurora gradient background — animated color wash */
.hero-aurora {
  position: relative; overflow: hidden;
}
.hero-aurora > * { position: relative; z-index: 2; }
.hero-aurora::before {
  content: ''; position: absolute; inset: -50%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    color-mix(in srgb, var(--color-primary, #2563eb) 50%, transparent),
    color-mix(in srgb, var(--color-primary, #2563eb) 20%, transparent),
    color-mix(in srgb, var(--color-primary, #2563eb) 10%, transparent),
    color-mix(in srgb, var(--color-primary, #2563eb) 30%, transparent),
    color-mix(in srgb, var(--color-primary, #2563eb) 50%, transparent)
  );
  animation: hero-aurora-spin 20s linear infinite;
  filter: blur(80px);
  z-index: 0;
}
@keyframes hero-aurora-spin { to { transform: rotate(360deg); } }

/* Mesh gradient background — layered radial gradients */
.hero-mesh {
  position: relative; overflow: hidden;
}
.hero-mesh > * { position: relative; z-index: 2; }
.hero-mesh::before {
  content: ''; position: absolute; inset: 0; z-index: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 30%, color-mix(in srgb, var(--color-primary, #2563eb) 30%, transparent), transparent),
    radial-gradient(ellipse 60% 80% at 80% 70%, color-mix(in srgb, var(--color-primary, #2563eb) 20%, transparent), transparent),
    radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in srgb, var(--color-primary, #2563eb) 12%, transparent), transparent);
  animation: hero-mesh-drift 15s ease-in-out infinite alternate;
}
@keyframes hero-mesh-drift {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-30px, 20px) scale(1.05); }
}

/* Animated grain texture overlay */
.hero-grain::after {
  content: ''; position: absolute; inset: -200%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px 256px;
  animation: hero-grain-shift 8s steps(10) infinite;
  pointer-events: none; z-index: 1; opacity: 0.5;
}
@keyframes hero-grain-shift {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  20% { transform: translate(-15%, 5%); }
  30% { transform: translate(7%, -20%); }
  40% { transform: translate(-5%, 15%); }
  50% { transform: translate(-15%, 10%); }
  60% { transform: translate(15%, 0%); }
  70% { transform: translate(0%, 10%); }
  80% { transform: translate(3%, 25%); }
  90% { transform: translate(-10%, 10%); }
}

/* Glassmorphism panel */
.hero-glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
}

/* Gradient text effect */
.hero-gradient-text {
  background: linear-gradient(135deg, var(--color-primary, #2563eb), color-mix(in srgb, var(--color-primary, #2563eb) 60%, #8b5cf6));
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Floating elements — gentle bobbing animation */
.hero-float {
  animation: hero-float 6s ease-in-out infinite;
}
.hero-float-delay { animation-delay: -2s; }
.hero-float-slow { animation-duration: 8s; }
@keyframes hero-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* Glow orb background decoration */
.hero-orb {
  position: absolute; border-radius: 50%;
  filter: blur(80px); opacity: 0.2; pointer-events: none;
  background: radial-gradient(circle, var(--color-primary, #2563eb), transparent 70%);
}

/* Cursor glow — follows mouse via JS */
.hero-cursor-glow {
  position: absolute; width: 600px; height: 600px;
  border-radius: 50%; pointer-events: none; z-index: 0;
  background: radial-gradient(circle, color-mix(in srgb, var(--color-primary, #2563eb) 12%, transparent), transparent 70%);
  transform: translate(-50%, -50%);
  transition: left 0.3s ease-out, top 0.3s ease-out;
  will-change: left, top;
}

/* Staggered reveal for hero text lines */
.hero-reveal > * {
  opacity: 0; transform: translateY(30px);
  animation: hero-reveal-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.hero-reveal > *:nth-child(1) { animation-delay: 0.1s; }
.hero-reveal > *:nth-child(2) { animation-delay: 0.25s; }
.hero-reveal > *:nth-child(3) { animation-delay: 0.4s; }
.hero-reveal > *:nth-child(4) { animation-delay: 0.55s; }
.hero-reveal > *:nth-child(5) { animation-delay: 0.7s; }
.hero-reveal > *:nth-child(6) { animation-delay: 0.85s; }
@keyframes hero-reveal-in {
  to { opacity: 1; transform: translateY(0); }
}

/* Animated border glow on CTA */
.hero-btn-glow {
  position: relative; z-index: 1;
}
.hero-btn-glow::before {
  content: ''; position: absolute; inset: -2px; border-radius: inherit;
  background: linear-gradient(135deg, var(--color-primary, #2563eb), #8b5cf6, var(--color-primary, #2563eb));
  background-size: 200% 200%;
  animation: hero-btn-glow-shift 3s ease infinite;
  z-index: -1; filter: blur(8px); opacity: 0.5;
}
@keyframes hero-btn-glow-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Hero content always above effects — covers .hero, .hero-aurora, .hero-mesh and any section with hero classes */
.hero > .container, .hero > .hero-reveal, .hero > div:not(.hero-orb):not(.hero-cursor-glow),
[class*="hero-aurora"] > .container, [class*="hero-mesh"] > .container,
[class*="hero-aurora"] > div:not(.hero-orb):not(.hero-cursor-glow),
[class*="hero-mesh"] > div:not(.hero-orb):not(.hero-cursor-glow) {
  position: relative; z-index: 2;
}

/* ── Carousel System ── */
.carousel { position: relative; overflow: hidden; width: 100%; }
.carousel-track { display: flex; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); will-change: transform; }
.carousel-slide { flex: 0 0 100%; min-width: 100%; }
.carousel-slide img { width: 100%; height: 100%; object-fit: cover; }
.carousel-nav { position: absolute; bottom: 1.5rem; left: 50%; transform: translateX(-50%); display: flex; gap: 0.5rem; z-index: 10; }
.carousel-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid #fff; background: transparent; cursor: pointer; transition: all 0.3s; box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
.carousel-dot.active { background: #fff; }
.carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 10; font-size: 1.25rem; color: #0f2148; transition: all 0.3s; }
.carousel-arrow:hover { background: #fff; box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
.carousel-arrow-prev { left: 1rem; }
.carousel-arrow-next { right: 1rem; }

/* ── Hero Image (full-bleed background photo) ── */
.hero-image { position: relative; min-height: 100vh; overflow: hidden; display: flex; align-items: center; background-size: cover; background-position: center; background-repeat: no-repeat; }
.hero-image::before { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.6) 100%); z-index: 1; }
.hero-image > * { position: relative; z-index: 2; }

/* ── Hero Carousel (full-bleed slideshow) ── */
.hero-carousel { position: relative; min-height: 100vh; overflow: hidden; }
.hero-carousel .carousel-track { min-height: 100vh; }
.hero-carousel .carousel-slide { min-height: 100vh; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; position: relative; }
.hero-carousel .carousel-slide::before { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.55)); z-index: 1; }
.hero-carousel .carousel-slide > * { position: relative; z-index: 2; }

/* ── Overlay Text (white text readable over images) ── */
.overlay-text { position: relative; color: #fff; text-shadow: 0 2px 12px rgba(0,0,0,0.3); }
.overlay-text h1, .overlay-text h2, .overlay-text h3, .overlay-text p { color: #fff; }
.overlay-gradient { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%); z-index: 1; }

/* ── Property Card ── */
.property-card { background: var(--color-surface, #fff); border-radius: var(--card-radius, 12px); overflow: hidden; border: 1px solid var(--color-border, #e2e8f0); box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: all 0.3s; }
.property-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(0,0,0,0.12); }
.property-card-img { position: relative; height: 240px; overflow: hidden; }
.property-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.property-card:hover .property-card-img img { transform: scale(1.05); }
.property-card-details { padding: 1.25rem; }
.property-card-price { font-size: 1.5rem; font-weight: 800; color: var(--color-primary, #1a365d); margin-bottom: 0.5rem; }
.property-card-meta { display: flex; gap: 1rem; color: var(--color-text-muted, #64748b); font-size: 0.875rem; margin-bottom: 0.75rem; }
.property-card-meta span { display: flex; align-items: center; gap: 0.25rem; }

/* ── Property Grid ── */
.property-grid { display: grid; gap: 2rem; grid-template-columns: repeat(3, 1fr); }
@media (max-width: 1024px) { .property-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .property-grid { grid-template-columns: 1fr; } }

/* ── Image Gallery ── */
.image-gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
.image-gallery-item { position: relative; overflow: hidden; border-radius: 8px; aspect-ratio: 4/3; cursor: pointer; }
.image-gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.image-gallery-item:hover img { transform: scale(1.08); }

/* ── Price Tag ── */
.price-tag { font-size: 1.75rem; font-weight: 800; color: var(--color-primary, #1a365d); letter-spacing: -0.02em; }
.price-tag-sm { font-size: 1.25rem; }

/* ── Feature Badge (beds/baths/sqft) ── */
.feature-badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 6px; background: var(--color-bg-alt, #f8fafc); font-size: 0.8125rem; color: var(--color-text-muted, #64748b); font-weight: 500; }
.feature-badge svg, .feature-badge img { width: 16px; height: 16px; }

/* ── Status Badge (For Sale / Sold / Open House) ── */
.status-badge { position: absolute; top: 1rem; left: 1rem; z-index: 5; padding: 0.375rem 0.875rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.status-for-sale { background: #059669; color: #fff; }
.status-sold { background: #dc2626; color: #fff; }
.status-open-house { background: #d97706; color: #fff; }

/* ── Divider Shapes ── */
.wave-divider { width: 100%; overflow: hidden; line-height: 0; }
.wave-divider svg { display: block; width: calc(100% + 1.3px); height: 60px; }
`.trim();

/**
 * Component library instruction to inject into the Developer agent's system prompt.
 * This tells the agent about available component classes.
 */
export const COMPONENT_LIBRARY_INSTRUCTION = `
## Zoobicon Component Library — USE THESE CLASSES

The following CSS classes are automatically available in every generated website. Use them to ensure polished, consistent output:

**Buttons:** \`.btn\`, \`.btn-primary\`, \`.btn-secondary\`, \`.btn-ghost\`, \`.btn-lg\`, \`.btn-sm\`
**Cards:** \`.card\`, \`.card-body\`, \`.card-img\`, \`.card-flat\`
**Inputs:** \`.input\`, \`.input-group\`, \`.input-icon\`
**Badges:** \`.badge\`, \`.badge-primary\`, \`.badge-success\`, \`.badge-warning\`, \`.badge-error\`
**Layout:** \`.section\`, \`.section-alt\`, \`.container\`, \`.section-header\`, \`.section-accent\`
**Grid:** \`.grid\`, \`.grid-2\`, \`.grid-3\`, \`.grid-4\` (auto-responsive)
**Flex:** \`.flex\`, \`.flex-col\`, \`.items-center\`, \`.justify-center\`, \`.justify-between\`, \`.gap-1\` through \`.gap-4\`
**Text:** \`.text-center\`, \`.text-muted\`, \`.text-primary\`, \`.text-sm\`, \`.text-lg\`, \`.font-bold\`, \`.font-semibold\`
**Animation:** \`.fade-in\`, \`.fade-in-left\`, \`.fade-in-right\`, \`.scale-in\` (add \`.visible\` class via IntersectionObserver)
**Hero:** \`.hero\` (full-viewport), \`.hero-aurora\` (animated conic gradient bg), \`.hero-mesh\` (layered radial gradient bg), \`.hero-grain\` (subtle film grain overlay), \`.hero-glass\` (glassmorphism panel), \`.hero-gradient-text\` (gradient text fill), \`.hero-float\` / \`.hero-float-delay\` / \`.hero-float-slow\` (bobbing animation), \`.hero-orb\` (blurred glow decoration — position via inline style), \`.hero-cursor-glow\` (mouse-following glow — needs empty div), \`.hero-reveal\` (stagger-animate child elements on load), \`.hero-btn-glow\` (animated border glow on CTA button), \`.hero-typed\` (JS typing effect on a span)
**Patterns:** \`.testimonial-card\`, \`.stat-item\`, \`.stat-number\`, \`.stat-label\`, \`.faq-item\`, \`.faq-question\`, \`.faq-answer\`, \`.logo-strip\`
**Carousel:** \`.carousel\`, \`.carousel-track\`, \`.carousel-slide\`, \`.carousel-nav\`, \`.carousel-dot\`, \`.carousel-dot.active\`, \`.carousel-arrow\`, \`.carousel-arrow-prev\`, \`.carousel-arrow-next\` (JS auto-rotation + touch swipe included)
**Hero Image:** \`.hero-image\` (full-viewport bg image with gradient overlay — set background-image inline, content auto z-indexed above)
**Hero Carousel:** \`.hero-carousel\` (full-viewport slideshow — combine with \`.carousel-track\` + \`.carousel-slide\` using background-image on each slide)
**Overlay:** \`.overlay-text\` (white text + text-shadow for readability over images), \`.overlay-gradient\` (bottom-up dark gradient overlay)
**Property Card:** \`.property-card\`, \`.property-card-img\`, \`.property-card-details\`, \`.property-card-price\`, \`.property-card-meta\` (hover lift + image zoom)
**Property Grid:** \`.property-grid\` (responsive 3→2→1 column grid for property listings)
**Image Gallery:** \`.image-gallery\`, \`.image-gallery-item\` (auto-fill grid with hover zoom, 4:3 aspect ratio)
**Price:** \`.price-tag\`, \`.price-tag-sm\`
**Feature Badge:** \`.feature-badge\` (inline pill for beds/baths/sqft indicators)
**Status Badge:** \`.status-badge\`, \`.status-for-sale\` (green), \`.status-sold\` (red), \`.status-open-house\` (amber) — position absolute on \`.property-card-img\`

IMPORTANT: The component library CSS is injected automatically — do NOT duplicate it in your <style> block. Only write CUSTOM styles specific to this website. Use the component classes above to build sections — this reduces your CSS and gives shadcn/ui-level polish.
`;

/**
 * Failsafe observer script — ensures fade-in elements actually appear.
 * 1. Adds .will-animate to hide elements (progressive enhancement)
 * 2. Uses IntersectionObserver to add .visible when scrolled into view
 * 3. Has a hard timeout: force-reveals everything after 3s no matter what
 */
const FAILSAFE_OBSERVER_SCRIPT = `
<script>
(function(){
  var sel = '.fade-in, .fade-in-left, .fade-in-right, .scale-in';
  var els = document.querySelectorAll(sel);
  // Step 1: hide elements that JS will animate
  els.forEach(function(el){ el.classList.add('will-animate'); });
  // Step 2: reveal on scroll
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function(el){ obs.observe(el); });
  } else {
    els.forEach(function(el){ el.classList.add('visible'); });
  }
  // Step 3: hard failsafe — show EVERYTHING after 3s
  setTimeout(function(){
    document.querySelectorAll(sel + ':not(.visible)').forEach(function(el){
      el.classList.add('visible');
    });
  }, 3000);
})();
// Hero cursor glow — follows mouse pointer
(function(){
  var glow = document.querySelector('.hero-cursor-glow');
  var hero = glow && glow.closest('.hero');
  if (hero && glow) {
    hero.addEventListener('mousemove', function(e) {
      var r = hero.getBoundingClientRect();
      glow.style.left = (e.clientX - r.left) + 'px';
      glow.style.top = (e.clientY - r.top) + 'px';
    });
  }
})();
// Hero parallax — subtle depth on scroll
(function(){
  var hero = document.querySelector('.hero');
  if (!hero) return;
  var orbs = hero.querySelectorAll('.hero-orb');
  var floats = hero.querySelectorAll('.hero-float');
  if (orbs.length === 0 && floats.length === 0) return;
  window.addEventListener('scroll', function() {
    var s = window.pageYOffset;
    if (s > window.innerHeight) return;
    orbs.forEach(function(orb, i) {
      orb.style.transform = 'translateY(' + (s * (0.1 + i * 0.05)) + 'px)';
    });
  }, { passive: true });
})();
// Typing effect for hero headline spans with .hero-typed
(function(){
  var el = document.querySelector('.hero-typed');
  if (!el) return;
  var text = el.textContent;
  el.textContent = '';
  el.style.borderRight = '2px solid var(--color-primary, #2563eb)';
  var i = 0;
  (function type() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      setTimeout(type, 45);
    } else {
      setTimeout(function(){ el.style.borderRight = 'none'; }, 1500);
    }
  })();
})();
// Carousel auto-init — rotation, arrows, dots, touch swipe
(function(){
  document.querySelectorAll('.carousel').forEach(function(carousel){
    var track = carousel.querySelector('.carousel-track');
    var slides = carousel.querySelectorAll('.carousel-slide');
    var dots = carousel.querySelectorAll('.carousel-dot');
    var prevBtn = carousel.querySelector('.carousel-arrow-prev');
    var nextBtn = carousel.querySelector('.carousel-arrow-next');
    if (!track || slides.length < 2) return;
    var current = 0, total = slides.length, interval;
    function goTo(idx) {
      current = ((idx % total) + total) % total;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.forEach(function(d, i){ d.classList.toggle('active', i === current); });
    }
    if (nextBtn) nextBtn.addEventListener('click', function(){ goTo(current + 1); resetAuto(); });
    if (prevBtn) prevBtn.addEventListener('click', function(){ goTo(current - 1); resetAuto(); });
    dots.forEach(function(d, i){ d.addEventListener('click', function(){ goTo(i); resetAuto(); }); });
    var startX = 0;
    carousel.addEventListener('touchstart', function(e){ startX = e.touches[0].clientX; }, {passive:true});
    carousel.addEventListener('touchend', function(e){
      var diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { goTo(current + (diff > 0 ? 1 : -1)); resetAuto(); }
    });
    function startAuto(){ interval = setInterval(function(){ goTo(current + 1); }, 5000); }
    function resetAuto(){ clearInterval(interval); startAuto(); }
    startAuto(); goTo(0);
  });
})();
</script>`;

// ══════════════════════════════════════════════════════════
//  THEME PRESETS — Named color schemes for generated sites
// ══════════════════════════════════════════════════════════

export interface ThemePreset {
  name: string;
  description: string;
  preview: { primary: string; bg: string; text: string };
  variables: {
    '--color-primary': string;
    '--color-primary-dark': string;
    '--color-bg': string;
    '--color-bg-alt': string;
    '--color-surface': string;
    '--color-text': string;
    '--color-text-light': string;
    '--color-border': string;
    '--color-accent': string;
  };
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  corporate: {
    name: 'Corporate',
    description: 'Navy and slate tones with a professional, trustworthy feel',
    preview: { primary: '#1e3a5f', bg: '#f8f9fb', text: '#1a202c' },
    variables: {
      '--color-primary': '#1e3a5f',
      '--color-primary-dark': '#152a45',
      '--color-bg': '#f8f9fb',
      '--color-bg-alt': '#eef1f6',
      '--color-surface': '#ffffff',
      '--color-text': '#1a202c',
      '--color-text-light': '#4a5568',
      '--color-border': '#d2d8e3',
      '--color-accent': '#2b6cb0',
    },
  },
  startup: {
    name: 'Startup',
    description: 'Vibrant purple-to-blue gradient energy, modern and bold',
    preview: { primary: '#7c3aed', bg: '#faf5ff', text: '#1e1b4b' },
    variables: {
      '--color-primary': '#7c3aed',
      '--color-primary-dark': '#5b21b6',
      '--color-bg': '#faf5ff',
      '--color-bg-alt': '#f0e7fe',
      '--color-surface': '#ffffff',
      '--color-text': '#1e1b4b',
      '--color-text-light': '#6b63a0',
      '--color-border': '#ddd6fe',
      '--color-accent': '#3b82f6',
    },
  },
  warm: {
    name: 'Warm',
    description: 'Amber, terracotta, and cream for an inviting, earthy aesthetic',
    preview: { primary: '#c2590a', bg: '#fdf8f4', text: '#3b2314' },
    variables: {
      '--color-primary': '#c2590a',
      '--color-primary-dark': '#9a4408',
      '--color-bg': '#fdf8f4',
      '--color-bg-alt': '#f5ebe0',
      '--color-surface': '#fffcf8',
      '--color-text': '#3b2314',
      '--color-text-light': '#7c6353',
      '--color-border': '#e6d5c3',
      '--color-accent': '#d97706',
    },
  },
  dark: {
    name: 'Dark',
    description: 'Deep charcoal with neon accents for a sleek, modern look',
    preview: { primary: '#6ee7b7', bg: '#111827', text: '#f3f4f6' },
    variables: {
      '--color-primary': '#6ee7b7',
      '--color-primary-dark': '#34d399',
      '--color-bg': '#111827',
      '--color-bg-alt': '#1f2937',
      '--color-surface': '#1f2937',
      '--color-text': '#f3f4f6',
      '--color-text-light': '#9ca3af',
      '--color-border': '#374151',
      '--color-accent': '#38bdf8',
    },
  },
  neon: {
    name: 'Neon',
    description: 'Cyberpunk black with electric neon highlights',
    preview: { primary: '#e11dfa', bg: '#09090b', text: '#fafafa' },
    variables: {
      '--color-primary': '#e11dfa',
      '--color-primary-dark': '#b818c9',
      '--color-bg': '#09090b',
      '--color-bg-alt': '#18181b',
      '--color-surface': '#18181b',
      '--color-text': '#fafafa',
      '--color-text-light': '#a1a1aa',
      '--color-border': '#27272a',
      '--color-accent': '#22d3ee',
    },
  },
  minimal: {
    name: 'Minimal',
    description: 'Near-white palette with subtle grays for a clean, focused design',
    preview: { primary: '#18181b', bg: '#fafafa', text: '#18181b' },
    variables: {
      '--color-primary': '#18181b',
      '--color-primary-dark': '#09090b',
      '--color-bg': '#fafafa',
      '--color-bg-alt': '#f4f4f5',
      '--color-surface': '#ffffff',
      '--color-text': '#18181b',
      '--color-text-light': '#71717a',
      '--color-border': '#e4e4e7',
      '--color-accent': '#3f3f46',
    },
  },
};

/**
 * Returns a `:root { ... }` CSS block for the given theme name.
 * Falls back to an empty string if the theme is not found.
 */
export function getThemeCSS(themeName: string): string {
  const key = themeName.toLowerCase().replace(/\s+/g, '');
  const theme = THEME_PRESETS[key];
  if (!theme) return '';

  const lines = Object.entries(theme.variables)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join('\n');

  return `:root {\n${lines}\n}`;
}

/**
 * Injects a theme's `:root` custom properties into HTML.
 * - If the HTML already has a `:root { ... }` block, it is replaced.
 * - Otherwise the block is inserted at the beginning of the first `<style>` tag,
 *   or before `</head>` if no `<style>` exists.
 * Returns the original HTML unchanged if the theme name is not recognised.
 */
export function injectTheme(html: string, themeName: string): string {
  const css = getThemeCSS(themeName);
  if (!css) return html;

  // Replace existing :root block (greedy match the closest closing brace after :root)
  const rootBlockRe = /:root\s*\{[^}]*\}/;
  if (rootBlockRe.test(html)) {
    return html.replace(rootBlockRe, css);
  }

  // No existing :root — inject into first <style> tag
  const styleTagRe = /<style[^>]*>/i;
  if (styleTagRe.test(html)) {
    return html.replace(styleTagRe, (match) => `${match}\n${css}\n`);
  }

  // No <style> tag at all — inject before </head>
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `<style>\n${css}\n</style>\n</head>`);
  }

  // Last resort — prepend
  return `<style>\n${css}\n</style>\n${html}`;
}

/**
 * Inject the component library CSS + failsafe observer into generated HTML
 */
export function injectComponentLibrary(html: string): string {
  // Check if already injected
  if (html.includes("ZOOBICON COMPONENT LIBRARY")) return html;

  // Inject CSS at the top of the <style> block
  const styleMatch = html.match(/<style>/i);
  if (styleMatch) {
    html = html.replace(/<style>/i, `<style>\n${COMPONENT_LIBRARY_CSS}\n\n/* ── Custom Styles ── */\n`);
  } else {
    // If no style tag, inject before </head>
    html = html.replace(
      /<\/head>/i,
      `<style>\n${COMPONENT_LIBRARY_CSS}\n</style>\n</head>`
    );
  }

  // Inject failsafe observer script before </body>
  if (html.includes("</body>")) {
    html = html.replace(/<\/body>/i, `${FAILSAFE_OBSERVER_SCRIPT}\n</body>`);
  }

  return html;
}
