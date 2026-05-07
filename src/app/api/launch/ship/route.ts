/**
 * POST /api/launch/ship
 *
 * Steps 5–7 of the "domain → brand → site → deploy" single flow.
 * Server-Sent Events stream that:
 *   5. Generates a 4-page site (Home, Features, Pricing, Contact) using
 *      `@/lib/scaffold-engine` with the chosen brand kit applied
 *   6. Registers the .com via the registrar chain (`@/lib/registrar`)
 *   7. Deploys to `https://[name].zoobicon.sh` via `/api/hosting/deploy`
 *
 * Streams progress as `site-step` events while the site builds. Final
 * event is `complete` carrying siteUrl, domain, domainRegistered, and
 * the registrar attempt details.
 *
 * Bible Law 8: every failure path emits a clean error message saying
 * which step failed and why. Even when domain registration fails (the
 * common case until OPENSRS/CENTRALNIC keys are set), the site still
 * deploys and the user gets a working preview — registration is
 * "best-effort" because the customer hasn't paid yet.
 *
 * Request body:
 *   {
 *     name: string,                  // chosen brand name (e.g. "Loomly")
 *     tagline: string,               // chosen tagline
 *     brandKit: BrandKit,            // palette + logoSvg + typography
 *     description: string,           // original business description
 *     registrant?: ContactInfo,      // optional — best-effort domain reg
 *     years?: number                 // 1–10, default 1
 *   }
 *
 * SSE events emitted:
 *   { type: "site-step", message: "Generating Home page..." }
 *   { type: "site-step", message: "Home page done." }
 *   { type: "site-step", message: "Generating Features page..." }
 *   ... etc ...
 *   { type: "deploy-step", message: "Deploying to zoobicon.sh..." }
 *   { type: "register-step", message: "Registering loomly.com..." }
 *   { type: "complete", siteUrl, domain, domainRegistered, registrarOrderId, registrarError, attempts }
 *   { type: "error", message }       // emitted only on fatal site-build failure
 *
 * Status codes:
 *   200 — stream started (errors arrive via SSE, not HTTP status)
 *   400 — bad request body (cannot stream because we never started)
 */

import { NextRequest } from "next/server";
import { getScaffold, getScaffoldConfig, classifyIntent, type SiteConfig } from "@/lib/scaffold-engine";
import { registerWithFallback, type ContactInfo, type ChainAttempt } from "@/lib/registrar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─── Types ───────────────────────────────────────────────────────────────

interface BrandKit {
  palette: string[]; // 3 hex colors
  logoSvg: string;
  typography: { display: string; body: string };
}

interface ShipRequestBody {
  name?: string;
  tagline?: string;
  brandKit?: BrandKit;
  description?: string;
  registrant?: ContactInfo;
  years?: number;
}

// ─── Route ───────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: ShipRequestBody;
  try {
    body = (await req.json()) as ShipRequestBody;
  } catch {
    return jsonError(400, "Step 0 (parse request): invalid JSON body.");
  }

  const validation = validateBody(body);
  if (!validation.ok) return jsonError(400, validation.error);

  const { name, tagline, brandKit, description, registrant, years } = validation.value;
  const slug = nameToSlug(name);
  if (!slug) {
    return jsonError(400, "Step 0 (validate input): name produces an empty slug.");
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        // ── Step 5a: build the site, page by page ────────────────────────
        send({ type: "site-step", message: "Preparing brand-themed scaffold..." });
        const config = applyBrandKitToConfig(name, tagline, description, brandKit);

        const pages: Array<{ id: string; label: string; sections: string }> = [];

        send({ type: "site-step", message: "Generating Home page..." });
        pages.push({
          id: "home",
          label: "Home",
          sections: buildHomeSections(name, tagline, description),
        });
        send({ type: "site-step", message: "Home page done." });

        send({ type: "site-step", message: "Generating Features page..." });
        pages.push({
          id: "features",
          label: "Features",
          sections: buildFeaturesSections(name, description),
        });
        send({ type: "site-step", message: "Features page done." });

        send({ type: "site-step", message: "Generating Pricing page..." });
        pages.push({
          id: "pricing",
          label: "Pricing",
          sections: buildPricingSections(name),
        });
        send({ type: "site-step", message: "Pricing page done." });

        send({ type: "site-step", message: "Generating Contact page..." });
        pages.push({
          id: "contact",
          label: "Contact",
          sections: buildContactSections(name),
        });
        send({ type: "site-step", message: "Contact page done." });

        // ── Step 5b: assemble the single HTML document ────────────────────
        send({ type: "site-step", message: "Assembling site..." });
        const html = assembleHtmlDocument(config, brandKit, pages);

        // ── Step 6 + 7 in PARALLEL ────────────────────────────────────────
        // Deploy and register run together — the customer hasn't paid yet,
        // so we never block the site preview on a registry round-trip.
        send({ type: "deploy-step", message: "Deploying to zoobicon.sh..." });
        send({
          type: "register-step",
          message: registrant
            ? `Registering ${slug}.com via registrar chain...`
            : `Skipping domain registration (no registrant info).`,
        });

        const deployPromise = deploySite({
          name,
          email: registrant?.email || "launch@zoobicon.com",
          code: html,
          description: tagline,
          slug,
        });

        const registerPromise = registrant
          ? registerWithFallback({
              domain: `${slug}.com`,
              period: years,
              registrant,
            })
          : Promise.resolve({
              success: false as const,
              error:
                "Step 7 (register): no registrant contact info supplied — site deployed only. Provide registrant in /api/launch/ship body to register the domain.",
              source: "skipped",
              attempts: [] as ChainAttempt[],
            });

        const [deployResult, registerResult] = await Promise.all([
          deployPromise,
          registerPromise,
        ]);

        if (!deployResult.ok) {
          // Deploy is the must-have. Without it, there is no site.
          send({
            type: "error",
            message: `Step 6 (deploy): ${deployResult.error}`,
          });
          controller.close();
          return;
        }

        send({
          type: "deploy-step",
          message: `Deployed to ${deployResult.url}.`,
        });

        if (registerResult.success) {
          send({
            type: "register-step",
            message: `Registered ${slug}.com (order ${registerResult.orderId || "—"}).`,
          });
        } else {
          send({
            type: "register-step",
            message: `Step 7 (register) skipped: ${registerResult.error}`,
          });
        }

        send({
          type: "complete",
          siteUrl: deployResult.url,
          siteSlug: deployResult.slug,
          domain: `${slug}.com`,
          domainRegistered: registerResult.success === true,
          registrarOrderId: registerResult.success ? registerResult.orderId : undefined,
          registrarError: registerResult.success ? undefined : registerResult.error,
          attempts:
            "attempts" in registerResult && Array.isArray(registerResult.attempts)
              ? registerResult.attempts
              : [],
        });
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        send({
          type: "error",
          message: `Unexpected failure during launch: ${msg}`,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ─── Validation ──────────────────────────────────────────────────────────

type Validated = {
  name: string;
  tagline: string;
  brandKit: BrandKit;
  description: string;
  registrant?: ContactInfo;
  years: number;
};

function validateBody(
  body: ShipRequestBody,
):
  | { ok: true; value: Validated }
  | { ok: false; error: string } {
  const name = (body.name || "").trim();
  if (!name || name.length < 2 || name.length > 30) {
    return { ok: false, error: "Step 0: 'name' must be 2–30 characters." };
  }
  const tagline = (body.tagline || "").trim();
  if (!tagline) {
    return { ok: false, error: "Step 0: 'tagline' is required." };
  }
  const description = (body.description || "").trim();
  if (description.length < 3) {
    return {
      ok: false,
      error: "Step 0: 'description' is required (at least 3 characters).",
    };
  }
  const kit = body.brandKit;
  if (
    !kit ||
    typeof kit !== "object" ||
    !Array.isArray(kit.palette) ||
    kit.palette.length < 3 ||
    typeof kit.logoSvg !== "string" ||
    !kit.logoSvg ||
    !kit.typography ||
    typeof kit.typography.display !== "string" ||
    typeof kit.typography.body !== "string"
  ) {
    return {
      ok: false,
      error:
        "Step 0: 'brandKit' must include palette (≥3 hex), logoSvg (string), and typography {display, body}.",
    };
  }
  const yearsRaw = Number.isFinite(body.years) ? Math.floor(body.years!) : 1;
  const years = Math.max(1, Math.min(yearsRaw, 10));

  let registrant: ContactInfo | undefined;
  if (body.registrant) {
    const r = body.registrant;
    if (
      !r.firstName ||
      !r.lastName ||
      !r.email ||
      !r.phone ||
      !r.address1 ||
      !r.city ||
      !r.state ||
      !r.postalCode ||
      !r.country
    ) {
      return {
        ok: false,
        error:
          "Step 0: 'registrant' is incomplete. Required: firstName, lastName, email, phone, address1, city, state, postalCode, country.",
      };
    }
    registrant = r;
  }

  return {
    ok: true,
    value: { name, tagline, brandKit: kit, description, registrant, years },
  };
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ─── Site assembly ───────────────────────────────────────────────────────

/**
 * Build a SiteConfig that the scaffold engine knows how to render, but
 * with the caller-chosen brand kit grafted onto it. The scaffold engine
 * already understands a config of this shape — we just override the
 * colors and fonts the user picked. Intent is classified from their
 * description so the section content stays domain-appropriate.
 */
function applyBrandKitToConfig(
  name: string,
  tagline: string,
  description: string,
  kit: BrandKit,
): SiteConfig {
  const intent = classifyIntent(description);
  const baseConfig = getScaffoldConfig(intent);
  const [primary, dark, accent] = kit.palette;
  return {
    ...baseConfig,
    title: name,
    description: tagline,
    font1: kit.typography.display,
    font2: kit.typography.body,
    colors: {
      ...baseConfig.colors,
      primary,
      primaryDark: dark || primary,
      accent: accent || primary,
    },
  };
}

/**
 * Build the assembled HTML document. The site is logically four pages
 * (Home, Features, Pricing, Contact) but rendered as a single scrollable
 * document with anchor sections — `/api/hosting/serve/[slug]` accepts a
 * single HTML string per slug, so multi-file sites would require a
 * separate hosting upgrade. Each "page" gets its own h1 and is
 * navigable via the top nav.
 */
function assembleHtmlDocument(
  config: SiteConfig,
  kit: BrandKit,
  pages: Array<{ id: string; label: string; sections: string }>,
): string {
  const fontUrl =
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(config.font1)}:wght@400;500;600;700;800;900` +
    `&family=${encodeURIComponent(config.font2)}:wght@400;500;600;700&display=swap`;

  const navLinks = pages
    .map(
      (p) =>
        `<a href="#${p.id}" class="zb-nav-link">${escapeHtml(p.label)}</a>`,
    )
    .join("");

  const pageSections = pages
    .map(
      (p) => `<section id="${p.id}" class="zb-page">
${p.sections}
</section>`,
    )
    .join("\n");

  const colors = config.colors;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${escapeHtml(config.description)}">
  <title>${escapeHtml(config.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontUrl}" rel="stylesheet">
  <style>
:root {
  --color-primary: ${colors.primary};
  --color-primary-dark: ${colors.primaryDark || colors.primary};
  --color-bg: ${colors.bg || "#ffffff"};
  --color-bg-alt: ${colors.bgAlt || "#f8fafc"};
  --color-surface: ${colors.surface || "#ffffff"};
  --color-text: ${colors.text || "#f4f3ed"};
  --color-text-muted: ${colors.textMuted || "#64748b"};
  --color-border: ${colors.border || "#e2e8f0"};
  --color-accent: ${colors.accent || colors.primary};
  --font-heading: '${config.font1}', Georgia, serif;
  --font-body: '${config.font2}', system-ui, sans-serif;
  --max-width: 1200px;
  --container-padding: 24px;
  --card-radius: 14px;
  --btn-radius: 10px;
}
* { box-sizing: border-box; }
body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  margin: 0;
}
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  line-height: 1.15;
  margin: 0 0 16px;
}
a { color: var(--color-primary); }
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 12px 22px; border-radius: var(--btn-radius); font-weight: 600;
  text-decoration: none; transition: transform .2s ease, box-shadow .2s ease;
  cursor: pointer; border: 1px solid transparent;
}
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,.12); }
.btn-ghost { background: transparent; color: var(--color-text); border-color: var(--color-border); }
.zb-nav {
  position: sticky; top: 0; z-index: 50;
  backdrop-filter: blur(12px);
  background: color-mix(in srgb, var(--color-bg) 85%, transparent);
  border-bottom: 1px solid var(--color-border);
}
.zb-nav-inner {
  max-width: var(--max-width); margin: 0 auto;
  padding: 14px var(--container-padding);
  display: flex; align-items: center; justify-content: space-between; gap: 24px;
}
.zb-nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; }
.zb-nav-brand .zb-mark { width: 36px; height: 36px; }
.zb-nav-brand .zb-name { font-family: var(--font-heading); font-weight: 700; font-size: 1.15rem; }
.zb-nav-links { display: flex; gap: 22px; align-items: center; }
.zb-nav-link {
  color: var(--color-text-muted); text-decoration: none; font-size: .95rem;
  font-weight: 500;
}
.zb-nav-link:hover { color: var(--color-text); }
.zb-page {
  padding: 80px var(--container-padding) 40px;
  max-width: var(--max-width); margin: 0 auto;
  border-bottom: 1px solid var(--color-border);
}
.zb-page:last-child { border-bottom: none; }
.zb-page-eyebrow {
  display: inline-block;
  padding: 6px 14px; border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  font-size: .8rem; font-weight: 600; letter-spacing: .04em;
  text-transform: uppercase; margin-bottom: 16px;
}
.zb-grid-3 {
  display: grid; gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}
.zb-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
  padding: 24px;
}
.zb-pricing-grid {
  display: grid; gap: 20px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  margin-top: 32px;
}
.zb-tier { display: flex; flex-direction: column; }
.zb-tier-price { font-size: 2.4rem; font-weight: 800; margin: 8px 0; }
.zb-tier ul { padding-left: 20px; margin: 12px 0 24px; color: var(--color-text-muted); }
.zb-tier ul li { margin-bottom: 6px; }
.zb-tier .btn { margin-top: auto; }
.zb-contact-grid {
  display: grid; gap: 24px; grid-template-columns: 1fr 1fr;
  margin-top: 32px;
}
@media (max-width: 720px) { .zb-contact-grid { grid-template-columns: 1fr; } }
.zb-contact-form input, .zb-contact-form textarea {
  width: 100%; padding: 12px 14px; border-radius: var(--btn-radius);
  border: 1px solid var(--color-border); background: var(--color-surface);
  color: var(--color-text); font-family: inherit; font-size: 1rem;
  margin-bottom: 12px;
}
.zb-footer {
  padding: 32px var(--container-padding);
  text-align: center; color: var(--color-text-muted);
  font-size: .9rem; border-top: 1px solid var(--color-border);
}
${config.customCss || ""}
  </style>
</head>
<body>
<nav class="zb-nav">
  <div class="zb-nav-inner">
    <a href="#home" class="zb-nav-brand">
      <span class="zb-mark">${kit.logoSvg}</span>
      <span class="zb-name">${escapeHtml(config.title)}</span>
    </a>
    <div class="zb-nav-links">
      ${navLinks}
      <a href="#contact" class="btn btn-primary" style="padding:8px 16px;">Get Started</a>
    </div>
  </div>
</nav>
${pageSections}
<footer class="zb-footer">
  &copy; ${new Date().getFullYear()} ${escapeHtml(config.title)}. Launched on Zoobicon.
  &middot; <a href="https://zoobicon.com" style="color:inherit;">zoobicon.com</a>
  &middot; <a href="https://zoobicon.ai" style="color:inherit;">zoobicon.ai</a>
  &middot; <a href="https://zoobicon.io" style="color:inherit;">zoobicon.io</a>
  &middot; <a href="https://zoobicon.sh" style="color:inherit;">zoobicon.sh</a>
</footer>
<script>
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var t=document.querySelector(this.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}
  });
});
</script>
</body>
</html>`;
}

// ─── Page section builders ──────────────────────────────────────────────

function buildHomeSections(name: string, tagline: string, description: string): string {
  const summary = description.length > 220 ? description.slice(0, 217) + "..." : description;
  return `
<span class="zb-page-eyebrow">Home</span>
<h1 style="font-size:clamp(2.4rem,5vw,3.6rem);font-weight:800;max-width:760px;">${escapeHtml(tagline)}</h1>
<p style="font-size:1.15rem;color:var(--color-text-muted);max-width:640px;margin:16px 0 28px;">${escapeHtml(summary)}</p>
<div style="display:flex;gap:14px;flex-wrap:wrap;">
  <a href="#pricing" class="btn btn-primary">See Pricing</a>
  <a href="#contact" class="btn btn-ghost">Talk to ${escapeHtml(name)} &rarr;</a>
</div>
<div class="zb-grid-3" style="margin-top:48px;">
  <div class="zb-card">
    <h3 style="font-size:1.1rem;">Built for clarity</h3>
    <p style="color:var(--color-text-muted);font-size:.95rem;">No bloat, no busywork. ${escapeHtml(name)} stays out of your way until you need it.</p>
  </div>
  <div class="zb-card">
    <h3 style="font-size:1.1rem;">Made to last</h3>
    <p style="color:var(--color-text-muted);font-size:.95rem;">Modern, accessible, and fast on every device. The internet, the way it should feel.</p>
  </div>
  <div class="zb-card">
    <h3 style="font-size:1.1rem;">Yours to own</h3>
    <p style="color:var(--color-text-muted);font-size:.95rem;">Your domain, your design system, your data. We just power the rails.</p>
  </div>
</div>`;
}

function buildFeaturesSections(name: string, _description: string): string {
  const features: Array<{ title: string; body: string }> = [
    {
      title: "Instant brand identity",
      body: "Palette, typography, and a monogram generated together so every page feels like a single product.",
    },
    {
      title: "Live domain check",
      body: "Real-time RDAP lookups against the .com registry — no guessing, no broken links to checkout.",
    },
    {
      title: "Four pages in one breath",
      body: "Home, Features, Pricing, and Contact — drafted with copy that reflects what you actually do.",
    },
    {
      title: "One-click deploy",
      body: "Pushed to zoobicon.sh the moment your name is picked. Live URL before the registrar finishes.",
    },
    {
      title: "Owned, not rented",
      body: "Your domain is registered to you. Move it whenever you want. We're the rails, not the prison.",
    },
    {
      title: "Editorial polish",
      body: "Generous whitespace, hairline rules, restrained shadows. Built to look at home in a portfolio.",
    },
  ];
  const cards = features
    .map(
      (f) => `<div class="zb-card">
  <h3 style="font-size:1.1rem;">${escapeHtml(f.title)}</h3>
  <p style="color:var(--color-text-muted);font-size:.95rem;">${escapeHtml(f.body)}</p>
</div>`,
    )
    .join("");
  return `
<span class="zb-page-eyebrow">Features</span>
<h1 style="font-size:clamp(2rem,4vw,3rem);font-weight:800;">Everything ${escapeHtml(name)} ships with on day one.</h1>
<p style="color:var(--color-text-muted);max-width:640px;font-size:1.05rem;margin:8px 0 32px;">Not a checklist of widgets. The fundamentals, done well, every time.</p>
<div class="zb-grid-3">
  ${cards}
</div>`;
}

function buildPricingSections(name: string): string {
  const tiers = [
    {
      label: "Starter",
      price: "$49",
      blurb: "For founders who just need to be live.",
      bullets: ["Domain + hosting + email", "Up to 3 pages", "Editorial-quality theme", "Email support"],
      cta: "Start free",
      featured: false,
    },
    {
      label: "Pro",
      price: "$129",
      blurb: "For teams that want to grow without rebuilding.",
      bullets: ["Everything in Starter", "AI auto-reply", "SEO monitor", "Custom analytics"],
      cta: "Pick Pro",
      featured: true,
    },
    {
      label: "Agency",
      price: "$299",
      blurb: "For studios serving clients at scale.",
      bullets: ["Up to 5 sites", "Priority support", "AI video creator", "White-label option"],
      cta: "Talk to sales",
      featured: false,
    },
  ];
  const tierCards = tiers
    .map(
      (t) => `<div class="zb-card zb-tier" style="${
        t.featured ? "border-color:var(--color-primary);box-shadow:0 12px 30px -16px var(--color-primary);" : ""
      }">
  <h3 style="font-size:1rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--color-text-muted);">${escapeHtml(t.label)}</h3>
  <div class="zb-tier-price">${escapeHtml(t.price)}<span style="font-size:1rem;color:var(--color-text-muted);font-weight:500;">/mo</span></div>
  <p style="color:var(--color-text-muted);font-size:.95rem;">${escapeHtml(t.blurb)}</p>
  <ul>${t.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>
  <a href="#contact" class="btn ${t.featured ? "btn-primary" : "btn-ghost"}">${escapeHtml(t.cta)}</a>
</div>`,
    )
    .join("");
  return `
<span class="zb-page-eyebrow">Pricing</span>
<h1 style="font-size:clamp(2rem,4vw,3rem);font-weight:800;">Simple, honest pricing.</h1>
<p style="color:var(--color-text-muted);max-width:640px;font-size:1.05rem;margin:8px 0 12px;">${escapeHtml(name)} is everything you need to be online — domain, hosting, brand, email — for less than the cost of buying any one piece elsewhere.</p>
<div class="zb-pricing-grid">
  ${tierCards}
</div>`;
}

function buildContactSections(name: string): string {
  return `
<span class="zb-page-eyebrow">Contact</span>
<h1 style="font-size:clamp(2rem,4vw,3rem);font-weight:800;">Talk to ${escapeHtml(name)}.</h1>
<p style="color:var(--color-text-muted);max-width:560px;font-size:1.05rem;margin:8px 0 0;">A real human reads every message. We reply within one business day.</p>
<div class="zb-contact-grid">
  <form class="zb-contact-form" onsubmit="event.preventDefault(); this.querySelector('button').textContent='Sent — we\\'ll be in touch.'; this.reset();">
    <input type="text" name="name" placeholder="Your name" required>
    <input type="email" name="email" placeholder="you@example.com" required>
    <textarea name="message" rows="5" placeholder="What can we help with?" required></textarea>
    <button type="submit" class="btn btn-primary" style="width:100%;">Send message</button>
  </form>
  <div class="zb-card">
    <h3 style="font-size:1.05rem;">Direct lines</h3>
    <p style="color:var(--color-text-muted);font-size:.95rem;">Hello — hello@${escapeHtml(nameToSlug(name))}.com</p>
    <p style="color:var(--color-text-muted);font-size:.95rem;">Support — support@${escapeHtml(nameToSlug(name))}.com</p>
    <p style="color:var(--color-text-muted);font-size:.95rem;margin-top:18px;">Powered by Zoobicon. Your domain, your data, your decisions.</p>
  </div>
</div>`;
}

// ─── Deploy helper ──────────────────────────────────────────────────────

interface DeployOk {
  ok: true;
  url: string;
  slug: string;
  deploymentId?: string;
}
interface DeployErr {
  ok: false;
  error: string;
}

function getInternalBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function deploySite(args: {
  name: string;
  email: string;
  code: string;
  description: string;
  slug: string;
}): Promise<DeployOk | DeployErr> {
  const url = `${getInternalBaseUrl()}/api/hosting/deploy`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: args.name,
        email: args.email,
        code: args.code,
        description: args.description,
      }),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return {
        ok: false,
        error: `Step 6 (deploy): hosting endpoint returned non-JSON (${res.status}).`,
      };
    }
    if (!res.ok) {
      const err =
        (data as { error?: string }).error || `${res.status} ${res.statusText}`;
      return { ok: false, error: `Step 6 (deploy): ${err}` };
    }
    const d = data as {
      url?: string;
      siteSlug?: string;
      deploymentId?: string;
    };
    if (!d.url || !d.siteSlug) {
      return {
        ok: false,
        error: "Step 6 (deploy): hosting endpoint succeeded but returned no url.",
      };
    }
    return { ok: true, url: d.url, slug: d.siteSlug, deploymentId: d.deploymentId };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        error: "Step 6 (deploy): hosting endpoint timed out after 25s.",
      };
    }
    return {
      ok: false,
      error: `Step 6 (deploy): ${err instanceof Error ? err.message : String(err)}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Misc ────────────────────────────────────────────────────────────────

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
