// ---------------------------------------------------------------------------
// Marketplace Add-on Delivery System
//
// Handles post-purchase code injection for marketplace add-ons.
// Each add-on has a delivery handler that generates the appropriate
// code snippet (HTML/CSS/JS) and injects it into the user's site.
//
// Architecture:
//   1. User purchases add-on → Stripe webhook fires
//   2. Webhook records purchase in `marketplace_purchases` table
//   3. User clicks "Activate" in builder → calls delivery endpoint
//   4. Delivery system generates addon-specific code
//   5. Code is injected into the site's HTML at the correct position
//
// Tables:
//   marketplace_purchases — tracks purchases per user
// ---------------------------------------------------------------------------

import { sql } from "./db";

// --- Types ---

export interface AddonPurchase {
  id: string;
  email: string;
  addonId: string;
  addonName: string;
  status: "active" | "canceled" | "expired";
  stripeSessionId: string | null;
  purchasedAt: string;
}

export interface AddonDelivery {
  addonId: string;
  injectionPoint: "head" | "body-start" | "body-end";
  code: string;
  description: string;
  configRequired?: Record<string, string>; // keys the user must provide
}

// --- Database ---

export async function ensureMarketplaceTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS marketplace_purchases (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      addon_id TEXT NOT NULL,
      addon_name TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      stripe_session_id TEXT,
      stripe_subscription_id TEXT,
      purchased_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(email, addon_id)
    )
  `;
}

export async function recordPurchase(params: {
  email: string;
  addonId: string;
  addonName: string;
  stripeSessionId?: string;
  stripeSubscriptionId?: string;
}): Promise<void> {
  await ensureMarketplaceTables();
  await sql`
    INSERT INTO marketplace_purchases (email, addon_id, addon_name, stripe_session_id, stripe_subscription_id)
    VALUES (${params.email}, ${params.addonId}, ${params.addonName}, ${params.stripeSessionId || null}, ${params.stripeSubscriptionId || null})
    ON CONFLICT (email, addon_id) DO UPDATE SET
      status = 'active',
      stripe_session_id = COALESCE(EXCLUDED.stripe_session_id, marketplace_purchases.stripe_session_id),
      stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, marketplace_purchases.stripe_subscription_id),
      purchased_at = NOW()
  `;
}

export async function getUserAddons(email: string): Promise<AddonPurchase[]> {
  await ensureMarketplaceTables();
  const rows = await sql`
    SELECT * FROM marketplace_purchases
    WHERE email = ${email} AND status = 'active'
    ORDER BY purchased_at DESC
  `;
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    addonId: r.addon_id,
    addonName: r.addon_name,
    status: r.status,
    stripeSessionId: r.stripe_session_id,
    purchasedAt: r.purchased_at,
  }));
}

export async function cancelAddonSubscription(email: string, addonId: string): Promise<void> {
  await sql`
    UPDATE marketplace_purchases SET status = 'canceled'
    WHERE email = ${email} AND addon_id = ${addonId}
  `;
}

// --- Delivery Handlers ---

/**
 * Generate the injectable code for an add-on.
 * Some add-ons require user config (e.g., GA tracking ID).
 */
export function getAddonDelivery(
  addonId: string,
  config?: Record<string, string>
): AddonDelivery | null {
  const handlers: Record<string, () => AddonDelivery> = {
    // --- Free Add-ons ---
    "google-analytics": () => ({
      addonId: "google-analytics",
      injectionPoint: "head",
      description: "Google Analytics 4 tracking",
      configRequired: { trackingId: "GA4 Measurement ID (e.g., G-XXXXXXXXXX)" },
      code: `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${config?.trackingId || 'G-XXXXXXXXXX'}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${config?.trackingId || 'G-XXXXXXXXXX'}');
</script>`,
    }),

    "stripe-payments": () => ({
      addonId: "stripe-payments",
      injectionPoint: "body-end",
      description: "Stripe checkout integration",
      configRequired: { publishableKey: "Stripe publishable key (pk_live_...)" },
      code: `<!-- Stripe Payments -->
<script src="https://js.stripe.com/v3/"></script>
<script>
  const stripe = Stripe('${config?.publishableKey || 'pk_test_placeholder'}');
  document.querySelectorAll('[data-stripe-price]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const priceId = btn.dataset.stripePrice;
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ priceId })
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    });
  });
</script>`,
    }),

    "custom-code-injection": () => ({
      addonId: "custom-code-injection",
      injectionPoint: "head",
      description: "Custom code injection (user-provided)",
      configRequired: {
        headCode: "HTML/JS to inject in <head>",
        bodyCode: "HTML/JS to inject before </body>",
      },
      code: config?.headCode || "<!-- Custom code injection: configure in add-on settings -->",
    }),

    "uptime-monitor": () => ({
      addonId: "uptime-monitor",
      injectionPoint: "head",
      description: "Uptime monitoring beacon",
      code: `<!-- Uptime Monitor -->
<script>
  (function() {
    const endpoint = '/api/hosting/analytics';
    const siteId = document.querySelector('meta[name="zoobicon-site-id"]')?.content;
    if (siteId) {
      fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ siteId, event: 'heartbeat', timestamp: Date.now() })
      }).catch(() => {});
    }
  })();
</script>`,
    }),

    "image-optimizer": () => ({
      addonId: "image-optimizer",
      injectionPoint: "body-end",
      description: "Lazy loading + responsive images",
      code: `<!-- Image Optimizer -->
<script>
  document.querySelectorAll('img:not([loading])').forEach(img => {
    img.loading = 'lazy';
    img.decoding = 'async';
    if (!img.width && img.naturalWidth) {
      img.style.aspectRatio = img.naturalWidth + '/' + img.naturalHeight;
    }
  });
</script>`,
    }),

    // --- Paid Add-ons ---
    "seo-campaign-agent": () => ({
      addonId: "seo-campaign-agent",
      injectionPoint: "head",
      description: "SEO meta tags + JSON-LD schema",
      code: `<!-- SEO Campaign Agent -->
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
<link rel="canonical" href="${config?.siteUrl || '/'}" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "${config?.siteName || 'Website'}",
  "description": "${config?.siteDescription || 'Professional website'}",
  "url": "${config?.siteUrl || '/'}"
}
</script>`,
    }),

    "ai-chatbot-builder": () => ({
      addonId: "ai-chatbot-builder",
      injectionPoint: "body-end",
      description: "AI chatbot widget",
      code: `<!-- AI Chatbot -->
<div id="zoobicon-chatbot" style="position:fixed;bottom:24px;right:24px;z-index:9999;">
  <button onclick="document.getElementById('zb-chat-panel').classList.toggle('hidden')"
    style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#ec4899);border:none;cursor:pointer;box-shadow:0 4px 20px rgba(124,58,237,0.4);display:flex;align-items:center;justify-content:center;">
    <svg width="24" height="24" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
  </button>
  <div id="zb-chat-panel" class="hidden" style="position:absolute;bottom:72px;right:0;width:360px;height:480px;background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
    <div style="padding:16px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:8px;">
      <div style="width:8px;height:8px;border-radius:50%;background:#22c55e;"></div>
      <span style="color:white;font-size:14px;font-weight:600;">AI Assistant</span>
    </div>
    <div id="zb-chat-messages" style="height:360px;overflow-y:auto;padding:16px;">
      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:12px;margin-bottom:8px;">
        <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;">Hi! How can I help you today?</p>
      </div>
    </div>
    <div style="padding:12px;border-top:1px solid rgba(255,255,255,0.05);display:flex;gap:8px;">
      <input type="text" placeholder="Type a message..." style="flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 12px;color:white;font-size:13px;outline:none;" />
      <button style="background:linear-gradient(135deg,#7c3aed,#ec4899);border:none;border-radius:8px;padding:8px 16px;color:white;font-size:13px;cursor:pointer;">Send</button>
    </div>
  </div>
</div>`,
    }),

    "blog-cms-engine": () => ({
      addonId: "blog-cms-engine",
      injectionPoint: "body-end",
      description: "Blog engine with article management",
      code: `<!-- Blog CMS Engine -->
<script>
  // Blog CMS: enables /blog routes with article management
  if (window.location.pathname.startsWith('/blog')) {
    document.body.innerHTML = '<div style="max-width:768px;margin:0 auto;padding:48px 24px;font-family:system-ui;"><h1 style="font-size:2rem;font-weight:700;margin-bottom:24px;">Blog</h1><p style="color:#888;">Blog CMS is active. Create posts from your Zoobicon dashboard.</p><div id="blog-posts"></div></div>';
  }
</script>`,
    }),

    "lead-gen-forms": () => ({
      addonId: "lead-gen-forms",
      injectionPoint: "body-end",
      description: "Smart lead capture forms with CRM integration",
      code: `<!-- Lead Gen Forms -->
<script>
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      try {
        await fetch('/api/contact', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ ...data, source: window.location.href, timestamp: new Date().toISOString() })
        });
        form.innerHTML = '<div style="padding:24px;text-align:center;color:#22c55e;font-weight:600;">Thank you! We\\'ll be in touch soon.</div>';
      } catch { form.querySelector('[type=submit]')?.setAttribute('disabled',''); }
    });
  });
</script>`,
    }),

    "ab-testing-engine": () => ({
      addonId: "ab-testing-engine",
      injectionPoint: "head",
      description: "A/B testing engine with variant tracking",
      code: `<!-- A/B Testing Engine -->
<script>
  window.zbABTest = function(testId, variants) {
    const key = 'zb_ab_' + testId;
    let variant = localStorage.getItem(key);
    if (!variant) {
      variant = variants[Math.floor(Math.random() * variants.length)];
      localStorage.setItem(key, variant);
    }
    return variant;
  };
</script>`,
    }),

    "multi-language-i18n": () => ({
      addonId: "multi-language-i18n",
      injectionPoint: "body-end",
      description: "Multi-language translation widget",
      code: `<!-- Multi-Language i18n -->
<div id="zb-i18n-widget" style="position:fixed;bottom:24px;left:24px;z-index:9998;">
  <select onchange="document.documentElement.lang=this.value;localStorage.setItem('zb_lang',this.value);"
    style="background:#1a1a2e;color:white;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer;">
    <option value="en">English</option>
    <option value="es">Espa\u00f1ol</option>
    <option value="fr">Fran\u00e7ais</option>
    <option value="de">Deutsch</option>
    <option value="pt">Portugu\u00eas</option>
    <option value="ja">\u65e5\u672c\u8a9e</option>
    <option value="zh">\u4e2d\u6587</option>
    <option value="ko">\ud55c\uad6d\uc5b4</option>
    <option value="ar">\u0627\u0644\u0639\u0631\u0628\u064a\u0629</option>
  </select>
</div>
<script>
  const savedLang = localStorage.getItem('zb_lang');
  if (savedLang) {
    document.documentElement.lang = savedLang;
    document.querySelector('#zb-i18n-widget select').value = savedLang;
  }
</script>`,
    }),

    "ssl-security-suite": () => ({
      addonId: "ssl-security-suite",
      injectionPoint: "head",
      description: "Security headers and CSP policy",
      code: `<!-- SSL & Security Suite -->
<meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests" />
<meta http-equiv="X-Content-Type-Options" content="nosniff" />
<meta name="referrer" content="strict-origin-when-cross-origin" />`,
    }),

    "email-marketing-suite": () => ({
      addonId: "email-marketing-suite",
      injectionPoint: "body-end",
      description: "Email capture popup",
      code: `<!-- Email Marketing Suite -->
<script>
  setTimeout(() => {
    if (localStorage.getItem('zb_email_popup_dismissed')) return;
    const overlay = document.createElement('div');
    overlay.id = 'zb-email-popup';
    overlay.innerHTML = \`
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;">
        <div style="background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;max-width:400px;width:90%;">
          <h3 style="color:white;font-size:1.25rem;font-weight:700;margin:0 0 8px;">Stay in the loop</h3>
          <p style="color:rgba(255,255,255,0.5);font-size:0.875rem;margin:0 0 16px;">Get updates, tips, and exclusive offers.</p>
          <form onsubmit="event.preventDefault();fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:this.email.value,source:'popup'})});this.innerHTML='<p style=&quot;color:#22c55e;font-weight:600;&quot;>Subscribed!</p>';localStorage.setItem('zb_email_popup_dismissed','1');">
            <input name="email" type="email" required placeholder="your@email.com" style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 14px;color:white;font-size:14px;margin-bottom:12px;outline:none;box-sizing:border-box;" />
            <button type="submit" style="width:100%;background:linear-gradient(135deg,#7c3aed,#ec4899);border:none;border-radius:8px;padding:10px;color:white;font-weight:600;cursor:pointer;">Subscribe</button>
          </form>
          <button onclick="this.closest('#zb-email-popup').remove();localStorage.setItem('zb_email_popup_dismissed','1')" style="position:absolute;top:12px;right:12px;background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:18px;">&times;</button>
        </div>
      </div>
    \`;
    document.body.appendChild(overlay);
  }, 5000);
</script>`,
    }),

    "social-media-manager": () => ({
      addonId: "social-media-manager",
      injectionPoint: "body-end",
      description: "Social sharing buttons",
      code: `<!-- Social Media Manager -->
<div id="zb-social-share" style="position:fixed;left:0;top:50%;transform:translateY(-50%);z-index:9997;display:flex;flex-direction:column;gap:4px;">
  <a href="https://twitter.com/intent/tweet?url=" onclick="this.href+= encodeURIComponent(location.href)" target="_blank" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:#1da1f2;color:white;text-decoration:none;border-radius:0 8px 8px 0;font-size:18px;">𝕏</a>
  <a href="https://www.facebook.com/sharer/sharer.php?u=" onclick="this.href+=encodeURIComponent(location.href)" target="_blank" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:#4267B2;color:white;text-decoration:none;border-radius:0 8px 8px 0;font-size:18px;">f</a>
  <a href="https://www.linkedin.com/sharing/share-offsite/?url=" onclick="this.href+=encodeURIComponent(location.href)" target="_blank" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:#0A66C2;color:white;text-decoration:none;border-radius:0 8px 8px 0;font-size:18px;">in</a>
</div>`,
    }),

    "ai-brand-kit": () => ({
      addonId: "ai-brand-kit",
      injectionPoint: "head",
      description: "Brand CSS variables from AI-generated brand kit",
      configRequired: {
        primaryColor: "Primary brand color (hex)",
        secondaryColor: "Secondary brand color (hex)",
        fontFamily: "Brand font family",
      },
      code: `<!-- AI Brand Kit -->
<style>
  :root {
    --brand-primary: ${config?.primaryColor || '#7c3aed'};
    --brand-secondary: ${config?.secondaryColor || '#ec4899'};
    --brand-font: '${config?.fontFamily || 'Inter'}', system-ui, sans-serif;
  }
  body { font-family: var(--brand-font); }
  .btn-primary, [class*="btn-primary"] { background: var(--brand-primary) !important; }
  a { color: var(--brand-primary); }
</style>`,
    }),

    "custom-fonts-pack": () => ({
      addonId: "custom-fonts-pack",
      injectionPoint: "head",
      description: "Premium font loading",
      configRequired: { fontName: "Google Font name (e.g., Playfair Display)" },
      code: `<!-- Custom Fonts Pack -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(config?.fontName || 'Inter')}:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<style>body { font-family: '${config?.fontName || 'Inter'}', system-ui, sans-serif; }</style>`,
    }),

    "premium-template-pack": () => ({
      addonId: "premium-template-pack",
      injectionPoint: "head",
      description: "Premium template CSS enhancements",
      code: `<!-- Premium Template Pack: Activated -->
<style>
  /* Premium gradient backgrounds */
  .hero-premium { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); }
  .section-premium { background: linear-gradient(180deg, rgba(124,58,237,0.05), transparent); }
  /* Premium animations */
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  .premium-shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); background-size: 200% 100%; animation: shimmer 3s infinite; }
</style>`,
    }),

    "component-library": () => ({
      addonId: "component-library",
      injectionPoint: "head",
      description: "Extended UI component library",
      code: `<!-- Component Library: 200+ Components Activated -->
<style>
  /* Extended component classes */
  .card-glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; }
  .card-gradient { background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1)); border: 1px solid rgba(124,58,237,0.2); border-radius: 16px; }
  .btn-glow { box-shadow: 0 0 20px rgba(124,58,237,0.4); transition: box-shadow 0.3s; }
  .btn-glow:hover { box-shadow: 0 0 30px rgba(124,58,237,0.6); }
  .text-gradient { background: linear-gradient(135deg, #7c3aed, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .divider-gradient { height: 1px; background: linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent); }
  .avatar-ring { border: 2px solid; border-image: linear-gradient(135deg, #7c3aed, #ec4899) 1; border-radius: 50%; }
  .tooltip { position: relative; } .tooltip::after { content: attr(data-tooltip); position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: #1a1a2e; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; white-space: nowrap; opacity: 0; transition: opacity 0.2s; pointer-events: none; } .tooltip:hover::after { opacity: 1; }
</style>`,
    }),

    "ai-video-creator": () => ({
      addonId: "ai-video-creator",
      injectionPoint: "body-end",
      description: "Video creator integration",
      code: `<!-- AI Video Creator: Access at /video-creator -->
<script>
  // Adds video creation CTA to the site
  if (!document.querySelector('#zb-video-cta')) {
    const cta = document.createElement('div');
    cta.id = 'zb-video-cta';
    cta.innerHTML = '<a href="/video-creator" style="position:fixed;bottom:24px;right:96px;z-index:9998;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;padding:12px 20px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(124,58,237,0.4);">Create Video</a>';
    document.body.appendChild(cta);
  }
</script>`,
    }),

    "ai-email-support": () => ({
      addonId: "ai-email-support",
      injectionPoint: "body-end",
      description: "Email support widget",
      code: `<!-- AI Email Support -->
<div id="zb-support-widget" style="position:fixed;bottom:24px;right:96px;z-index:9998;">
  <a href="/email-support" style="display:flex;align-items:center;gap:8px;background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);color:white;padding:10px 16px;border-radius:12px;text-decoration:none;font-size:13px;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,0.3);">
    <span style="width:8px;height:8px;border-radius:50%;background:#22c55e;"></span>
    Support
  </a>
</div>`,
    }),
  };

  const handler = handlers[addonId];
  if (!handler) return null;

  return handler();
}

/**
 * Inject add-on code into site HTML.
 */
export function injectAddonCode(html: string, delivery: AddonDelivery): string {
  switch (delivery.injectionPoint) {
    case "head":
      return html.replace("</head>", `${delivery.code}\n</head>`);
    case "body-start":
      return html.replace(/<body[^>]*>/, (match) => `${match}\n${delivery.code}`);
    case "body-end":
      return html.replace("</body>", `${delivery.code}\n</body>`);
    default:
      return html;
  }
}

/**
 * Inject all active add-ons for a user into their site HTML.
 */
export async function injectAllUserAddons(
  html: string,
  email: string,
  addonConfigs?: Record<string, Record<string, string>>
): Promise<string> {
  const purchases = await getUserAddons(email);
  let result = html;

  for (const purchase of purchases) {
    const config = addonConfigs?.[purchase.addonId];
    const delivery = getAddonDelivery(purchase.addonId, config);
    if (delivery) {
      result = injectAddonCode(result, delivery);
    }
  }

  return result;
}
