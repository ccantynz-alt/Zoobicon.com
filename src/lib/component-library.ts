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
.btn-ghost { background: transparent; color: var(--color-text, #1a1a2e); }
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
  background: var(--color-surface, #fff); color: var(--color-text, #1a1a2e);
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
  font-size: 4rem; line-height: 1; color: var(--color-primary, #2563eb); opacity: 0.15;
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
  color: var(--color-text, #1a1a2e); transition: color 0.2s;
}
.faq-question:hover { color: var(--color-primary, #2563eb); }
.faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.3s ease; }
.faq-answer.open { max-height: 500px; padding-bottom: 1.25rem; }
.faq-answer p { color: var(--color-text-muted, #64748b); line-height: 1.7; }

/* ── Social Proof Bar ── */
.logo-strip {
  display: flex; align-items: center; justify-content: center; gap: 3rem;
  padding: 2rem; opacity: 0.4; filter: grayscale(100%);
  flex-wrap: wrap;
}
.logo-strip img { height: 28px; object-fit: contain; }

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
**Patterns:** \`.testimonial-card\`, \`.stat-item\`, \`.stat-number\`, \`.stat-label\`, \`.faq-item\`, \`.faq-question\`, \`.faq-answer\`, \`.logo-strip\`

IMPORTANT: Include the full component library CSS at the TOP of your <style> block (it will be injected automatically). Then add your custom styles below it. Use the component classes to build sections — this gives a shadcn/ui-level polish to every output.
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
</script>`;

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
