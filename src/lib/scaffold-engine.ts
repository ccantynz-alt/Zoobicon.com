/**
 * Scaffold Engine — Instant site generation via pre-built templates + AI patching
 *
 * Classifies user intent from prompt text, returns a pre-built HTML scaffold
 * with data-section/data-field markers, and generates an AI patch prompt for
 * Haiku to customize the scaffold with user-specific content.
 */

// ── Types ──

export interface SiteConfig {
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

// ── Intent Classification ──

const INTENT_KEYWORDS: Record<string, string[]> = {
  saas: ["saas", "software", "app", "platform", "dashboard", "subscription", "api", "tool", "productivity", "crm", "erp"],
  restaurant: ["restaurant", "cafe", "coffee", "bakery", "food", "menu", "dining", "bistro", "pizza", "sushi", "bar", "pub", "catering", "chef", "kitchen"],
  portfolio: ["portfolio", "photographer", "designer", "artist", "creative", "freelance", "personal", "resume", "cv"],
  agency: ["agency", "studio", "consulting", "firm", "services", "digital", "marketing", "advertising", "branding"],
  ecommerce: ["shop", "store", "ecommerce", "e-commerce", "product", "buy", "sell", "retail", "marketplace", "clothing", "fashion", "jewelry"],
  blog: ["blog", "magazine", "news", "journal", "article", "content", "publication", "editorial", "writer"],
  fitness: ["fitness", "gym", "workout", "yoga", "health", "wellness", "training", "coach", "sport", "nutrition", "crossfit", "pilates"],
  startup: ["startup", "launch", "landing", "waitlist", "beta", "coming soon", "pre-launch", "mvp", "venture"],
  realestate: ["real estate", "property", "listing", "home", "apartment", "rental", "realtor", "housing", "mortgage"],
  healthcare: ["healthcare", "medical", "doctor", "clinic", "hospital", "dental", "therapy", "therapist", "mental health", "pharmacy"],
  education: ["education", "school", "course", "learn", "tutorial", "university", "academy", "training", "class", "student"],
  nonprofit: ["nonprofit", "charity", "donate", "foundation", "cause", "volunteer", "ngo", "community", "mission"],
  event: ["event", "conference", "wedding", "party", "concert", "festival", "meetup", "summit", "gala", "ticket"],
  lawyer: ["lawyer", "attorney", "law firm", "legal", "litigation", "counsel", "paralegal", "justice"],
};

export function classifyIntent(prompt: string): string {
  const lower = prompt.toLowerCase();
  let bestMatch = "business";
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += kw.length;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }

  return bestMatch;
}

// ── Config per intent ──

const CONFIGS: Record<string, SiteConfig> = {
  saas: {
    title: "SaaS Platform",
    description: "Modern software platform that helps teams work smarter.",
    font1: "Inter",
    font2: "Inter",
    colors: { primary: "#4f46e5", primaryDark: "#4338ca", bg: "#f8fafc", bgAlt: "#eef2ff", surface: "#ffffff", text: "#1e293b", textMuted: "#64748b", border: "#e2e8f0", accent: "#818cf8" },
  },
  restaurant: {
    title: "Restaurant",
    description: "An unforgettable dining experience with seasonal flavors.",
    font1: "Playfair Display",
    font2: "Lato",
    colors: { primary: "#b45309", primaryDark: "#92400e", bg: "#fffbeb", bgAlt: "#fef3c7", surface: "#ffffff", text: "#451a03", textMuted: "#92400e", border: "#fde68a", accent: "#d97706" },
  },
  portfolio: {
    title: "Portfolio",
    description: "Creative portfolio showcasing design and development work.",
    font1: "Sora",
    font2: "Inter",
    colors: { primary: "#7c3aed", primaryDark: "#6d28d9", bg: "#faf5ff", bgAlt: "#f3e8ff", surface: "#ffffff", text: "#1e1b4b", textMuted: "#6b7280", border: "#e9d5ff", accent: "#a78bfa" },
  },
  agency: {
    title: "Digital Agency",
    description: "We build digital experiences that drive business growth.",
    font1: "Space Grotesk",
    font2: "Inter",
    colors: { primary: "#059669", primaryDark: "#047857", bg: "#ffffff", bgAlt: "#ecfdf5", surface: "#ffffff", text: "#064e3b", textMuted: "#6b7280", border: "#d1fae5", accent: "#34d399" },
  },
  ecommerce: {
    title: "Online Store",
    description: "Shop the latest products with fast shipping and great prices.",
    font1: "DM Sans",
    font2: "DM Sans",
    colors: { primary: "#8b5cf6", primaryDark: "#7c3aed", bg: "#fafaf9", bgAlt: "#f5f5f4", surface: "#ffffff", text: "#1c1917", textMuted: "#78716c", border: "#e7e5e4", accent: "#a78bfa" },
  },
  blog: {
    title: "Blog",
    description: "Thoughts, stories, and ideas worth sharing.",
    font1: "Merriweather",
    font2: "Source Sans Pro",
    colors: { primary: "#2563eb", primaryDark: "#1d4ed8", bg: "#ffffff", bgAlt: "#f8fafc", surface: "#ffffff", text: "#0f172a", textMuted: "#64748b", border: "#e2e8f0", accent: "#3b82f6" },
  },
  fitness: {
    title: "Fitness Studio",
    description: "Transform your body and mind with expert-led training.",
    font1: "Oswald",
    font2: "Inter",
    colors: { primary: "#dc2626", primaryDark: "#b91c1c", bg: "#fff1f2", bgAlt: "#ffe4e6", surface: "#ffffff", text: "#1c1917", textMuted: "#78716c", border: "#fecdd3", accent: "#f87171" },
  },
  startup: {
    title: "Startup",
    description: "The future starts here. Join us on our mission.",
    font1: "Plus Jakarta Sans",
    font2: "Inter",
    colors: { primary: "#0891b2", primaryDark: "#0e7490", bg: "#ecfeff", bgAlt: "#cffafe", surface: "#ffffff", text: "#164e63", textMuted: "#6b7280", border: "#a5f3fc", accent: "#22d3ee" },
  },
  realestate: {
    title: "Real Estate",
    description: "Find your dream home with our expert guidance.",
    font1: "Poppins",
    font2: "Inter",
    colors: { primary: "#0d9488", primaryDark: "#0f766e", bg: "#ffffff", bgAlt: "#f0fdfa", surface: "#ffffff", text: "#134e4a", textMuted: "#6b7280", border: "#ccfbf1", accent: "#14b8a6" },
  },
  healthcare: {
    title: "Healthcare",
    description: "Compassionate care for you and your family.",
    font1: "Nunito",
    font2: "Inter",
    colors: { primary: "#0ea5e9", primaryDark: "#0284c7", bg: "#ffffff", bgAlt: "#f0f9ff", surface: "#ffffff", text: "#0c4a6e", textMuted: "#6b7280", border: "#e0f2fe", accent: "#38bdf8" },
  },
  education: {
    title: "Academy",
    description: "Unlock your potential with world-class learning.",
    font1: "Poppins",
    font2: "Inter",
    colors: { primary: "#f59e0b", primaryDark: "#d97706", bg: "#fffbeb", bgAlt: "#fef3c7", surface: "#ffffff", text: "#78350f", textMuted: "#b45309", border: "#fde68a", accent: "#fbbf24" },
  },
  nonprofit: {
    title: "Foundation",
    description: "Making a difference, one step at a time.",
    font1: "Nunito",
    font2: "Inter",
    colors: { primary: "#16a34a", primaryDark: "#15803d", bg: "#ffffff", bgAlt: "#f0fdf4", surface: "#ffffff", text: "#14532d", textMuted: "#6b7280", border: "#bbf7d0", accent: "#22c55e" },
  },
  event: {
    title: "Event",
    description: "An unforgettable experience awaits.",
    font1: "Clash Display",
    font2: "Inter",
    colors: { primary: "#a855f7", primaryDark: "#9333ea", bg: "#0a0118", bgAlt: "#1a0a2e", surface: "#1a0a2e", text: "#faf5ff", textMuted: "#c084fc", border: "#3b0764", accent: "#c084fc" },
  },
  lawyer: {
    title: "Law Firm",
    description: "Trusted legal counsel for individuals and businesses.",
    font1: "Cormorant Garamond",
    font2: "Inter",
    colors: { primary: "#1e3a5f", primaryDark: "#0f2942", bg: "#ffffff", bgAlt: "#f8fafc", surface: "#ffffff", text: "#0f172a", textMuted: "#64748b", border: "#e2e8f0", accent: "#2563eb" },
  },
  business: {
    title: "Business",
    description: "Professional solutions for modern businesses.",
    font1: "Inter",
    font2: "Inter",
    colors: { primary: "#3b82f6", primaryDark: "#2563eb", bg: "#ffffff", bgAlt: "#f8fafc", surface: "#ffffff", text: "#0f172a", textMuted: "#64748b", border: "#e2e8f0", accent: "#60a5fa" },
  },
};

export function getScaffoldConfig(intent: string): SiteConfig {
  return JSON.parse(JSON.stringify(CONFIGS[intent] || CONFIGS.business));
}

// ── Scaffold HTML bodies ──

function navHtml(brand: string): string {
  return `<nav style="position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);background:color-mix(in srgb, var(--color-bg) 85%, transparent);border-bottom:1px solid var(--color-border);">
  <div class="container" style="display:flex;align-items:center;justify-content:space-between;padding:16px var(--container-padding);max-width:var(--max-width);margin:0 auto;">
    <a href="#" style="font-family:var(--font-heading);font-size:1.5rem;font-weight:800;color:var(--color-primary);text-decoration:none;" data-section="nav" data-field="brand">${brand}</a>
    <div class="nav-links" style="display:flex;gap:24px;align-items:center;">
      <a href="#features" style="color:var(--color-text-muted);text-decoration:none;font-size:0.9rem;">Features</a>
      <a href="#about" style="color:var(--color-text-muted);text-decoration:none;font-size:0.9rem;">About</a>
      <a href="#contact" style="color:var(--color-text-muted);text-decoration:none;font-size:0.9rem;">Contact</a>
      <a href="#contact" class="btn btn-primary btn-sm" data-section="nav" data-field="cta">Get Started</a>
    </div>
    <button class="mobile-menu-btn" style="display:none;background:none;border:none;color:var(--color-text);font-size:1.5rem;cursor:pointer;" aria-label="Menu">☰</button>
  </div>
</nav>`;
}

function heroHtml(headline: string, sub: string, imageId: number = 1): string {
  return `<section class="section" id="hero" style="padding:100px 0 60px;">
  <div class="container" style="max-width:var(--max-width);margin:0 auto;padding:0 var(--container-padding);display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
    <div>
      <div style="display:inline-block;padding:6px 16px;border-radius:99px;background:color-mix(in srgb, var(--color-primary) 12%, transparent);color:var(--color-primary);font-size:0.85rem;font-weight:600;margin-bottom:24px;" data-section="hero" data-field="badge">Trusted by 10,000+ businesses</div>
      <h1 style="font-size:clamp(2.2rem,5vw,3.75rem);font-weight:800;margin-bottom:20px;line-height:1.1;" data-section="hero" data-field="headline">${headline}</h1>
      <p style="font-size:1.15rem;color:var(--color-text-muted);max-width:540px;margin-bottom:32px;line-height:1.7;" data-section="hero" data-field="subheadline">${sub}</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;">
        <a href="#contact" class="btn btn-primary btn-lg" style="color:#fff;" data-section="hero" data-field="cta1">Get Started Free</a>
        <a href="#features" class="btn btn-ghost" data-section="hero" data-field="cta2">See How It Works &rarr;</a>
      </div>
      <div style="display:flex;gap:24px;margin-top:32px;flex-wrap:wrap;">
        <div style="display:flex;align-items:center;gap:8px;color:var(--color-text-muted);font-size:0.9rem;"><span style="color:var(--color-primary);">&#10003;</span> No credit card required</div>
        <div style="display:flex;align-items:center;gap:8px;color:var(--color-text-muted);font-size:0.9rem;"><span style="color:var(--color-primary);">&#10003;</span> Free 14-day trial</div>
        <div style="display:flex;align-items:center;gap:8px;color:var(--color-text-muted);font-size:0.9rem;"><span style="color:var(--color-primary);">&#10003;</span> Cancel anytime</div>
      </div>
    </div>
    <div style="position:relative;">
      <img src="https://picsum.photos/seed/${imageId}/640/480" alt="Hero visual" style="width:100%;border-radius:var(--card-radius);box-shadow:0 20px 60px rgba(0,0,0,0.12);aspect-ratio:4/3;object-fit:cover;" data-section="hero" data-field="image">
      <div style="position:absolute;bottom:-16px;left:-16px;background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--card-radius);padding:16px 20px;box-shadow:0 4px 16px rgba(0,0,0,0.08);display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;border-radius:50%;background:var(--color-primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">&#9733;</div>
        <div><div style="font-weight:700;font-size:0.95rem;" data-section="hero" data-field="social_proof_title">4.9/5 Rating</div><div style="color:var(--color-text-muted);font-size:0.8rem;" data-section="hero" data-field="social_proof_sub">from 2,000+ reviews</div></div>
      </div>
    </div>
  </div>
  <style>@media(max-width:768px){#hero .container{grid-template-columns:1fr !important;}}</style>
</section>`;
}

function featuresHtml(items: { icon: string; title: string; desc: string }[], imageBase: number = 10): string {
  const cards = items.map((f, i) => `
    <div class="card" style="padding:0;border-radius:var(--card-radius);background:var(--color-surface);border:1px solid var(--color-border);overflow:hidden;" data-section="features" data-field="card${i}">
      <img src="https://picsum.photos/seed/${imageBase + i}/400/240" alt="${f.title}" style="width:100%;height:180px;object-fit:cover;" data-section="features" data-field="image${i}">
      <div style="padding:24px;">
        <div style="font-size:1.75rem;margin-bottom:12px;">${f.icon}</div>
        <h3 style="font-size:1.15rem;font-weight:700;margin-bottom:8px;" data-section="features" data-field="title${i}">${f.title}</h3>
        <p style="color:var(--color-text-muted);font-size:0.9rem;line-height:1.6;" data-section="features" data-field="desc${i}">${f.desc}</p>
      </div>
    </div>`).join("\n");

  return `<section class="section" id="features" style="padding:var(--section-padding) 0;">
  <div class="container" style="max-width:var(--max-width);margin:0 auto;padding:0 var(--container-padding);">
    <div style="text-align:center;margin-bottom:48px;">
      <div style="display:inline-block;padding:6px 16px;border-radius:99px;background:color-mix(in srgb, var(--color-primary) 10%, transparent);color:var(--color-primary);font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;" data-section="features" data-field="label">Features</div>
      <h2 style="font-size:2.25rem;font-weight:800;margin-bottom:16px;" data-section="features" data-field="heading">What We Offer</h2>
      <p style="color:var(--color-text-muted);max-width:600px;margin:0 auto;" data-section="features" data-field="subheading">Everything you need to succeed.</p>
    </div>
    <div class="grid-3" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
      ${cards}
    </div>
  </div>
</section>`;
}

function statsHtml(stats: { value: string; label: string }[]): string {
  const items = stats.map((s, i) => `
    <div class="stat-item" style="text-align:center;">
      <div class="stat-number" style="font-size:2.5rem;font-weight:800;color:var(--color-primary);" data-section="stats" data-field="value${i}">${s.value}</div>
      <div style="color:var(--color-text-muted);font-size:0.9rem;margin-top:4px;" data-section="stats" data-field="label${i}">${s.label}</div>
    </div>`).join("\n");

  return `<section class="section section-alt" style="padding:64px 0;background:var(--color-bg-alt);">
  <div class="container" style="max-width:var(--max-width);margin:0 auto;padding:0 var(--container-padding);display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:32px;">
    ${items}
  </div>
</section>`;
}

function aboutHtml(imageId: number = 50): string {
  return `<section class="section" id="about" style="padding:var(--section-padding) 0;">
  <div class="container" style="max-width:var(--max-width);margin:0 auto;padding:0 var(--container-padding);display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center;">
    <div style="position:relative;">
      <img src="https://picsum.photos/seed/${imageId}/600/500" alt="About us" style="width:100%;border-radius:var(--card-radius);object-fit:cover;aspect-ratio:6/5;" data-section="about" data-field="image">
      <div style="position:absolute;top:-12px;right:-12px;background:var(--color-primary);color:#fff;border-radius:var(--card-radius);padding:20px 24px;box-shadow:0 8px 24px rgba(0,0,0,0.12);">
        <div style="font-size:2rem;font-weight:800;line-height:1;" data-section="about" data-field="highlight_number">10+</div>
        <div style="font-size:0.8rem;opacity:0.9;" data-section="about" data-field="highlight_label">Years of Experience</div>
      </div>
    </div>
    <div>
      <div style="display:inline-block;padding:6px 16px;border-radius:99px;background:color-mix(in srgb, var(--color-primary) 10%, transparent);color:var(--color-primary);font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;">About Us</div>
      <h2 style="font-size:2.25rem;font-weight:800;margin-bottom:20px;line-height:1.15;" data-section="about" data-field="heading">Why Choose Us</h2>
      <p style="color:var(--color-text-muted);font-size:1.05rem;line-height:1.7;margin-bottom:24px;" data-section="about" data-field="description">We combine deep industry expertise with cutting-edge technology to deliver results that exceed expectations. Our team is passionate about helping businesses grow and succeed in today's competitive landscape.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div style="display:flex;align-items:start;gap:12px;"><div style="width:32px;height:32px;border-radius:8px;background:color-mix(in srgb, var(--color-primary) 12%, transparent);display:flex;align-items:center;justify-content:center;color:var(--color-primary);flex-shrink:0;font-size:1rem;">&#10003;</div><div><div style="font-weight:600;font-size:0.95rem;" data-section="about" data-field="check0">Expert Team</div><div style="color:var(--color-text-muted);font-size:0.85rem;" data-section="about" data-field="check0_desc">Seasoned professionals</div></div></div>
        <div style="display:flex;align-items:start;gap:12px;"><div style="width:32px;height:32px;border-radius:8px;background:color-mix(in srgb, var(--color-primary) 12%, transparent);display:flex;align-items:center;justify-content:center;color:var(--color-primary);flex-shrink:0;font-size:1rem;">&#10003;</div><div><div style="font-weight:600;font-size:0.95rem;" data-section="about" data-field="check1">Proven Results</div><div style="color:var(--color-text-muted);font-size:0.85rem;" data-section="about" data-field="check1_desc">Measurable outcomes</div></div></div>
        <div style="display:flex;align-items:start;gap:12px;"><div style="width:32px;height:32px;border-radius:8px;background:color-mix(in srgb, var(--color-primary) 12%, transparent);display:flex;align-items:center;justify-content:center;color:var(--color-primary);flex-shrink:0;font-size:1rem;">&#10003;</div><div><div style="font-weight:600;font-size:0.95rem;" data-section="about" data-field="check2">24/7 Support</div><div style="color:var(--color-text-muted);font-size:0.85rem;" data-section="about" data-field="check2_desc">Always here to help</div></div></div>
        <div style="display:flex;align-items:start;gap:12px;"><div style="width:32px;height:32px;border-radius:8px;background:color-mix(in srgb, var(--color-primary) 12%, transparent);display:flex;align-items:center;justify-content:center;color:var(--color-primary);flex-shrink:0;font-size:1rem;">&#10003;</div><div><div style="font-weight:600;font-size:0.95rem;" data-section="about" data-field="check3">Fast Delivery</div><div style="color:var(--color-text-muted);font-size:0.85rem;" data-section="about" data-field="check3_desc">On time, every time</div></div></div>
      </div>
    </div>
  </div>
  <style>@media(max-width:768px){#about .container{grid-template-columns:1fr !important;}}</style>
</section>`;
}

function testimonialsHtml(imageBase: number = 70): string {
  return `<section class="section" style="padding:var(--section-padding) 0;background:var(--color-bg-alt);">
  <div class="container" style="max-width:var(--max-width);margin:0 auto;padding:0 var(--container-padding);">
    <div style="text-align:center;margin-bottom:48px;">
      <div style="display:inline-block;padding:6px 16px;border-radius:99px;background:color-mix(in srgb, var(--color-primary) 10%, transparent);color:var(--color-primary);font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;">Testimonials</div>
      <h2 style="font-size:2rem;font-weight:800;margin-bottom:12px;" data-section="testimonials" data-field="heading">What Our Clients Say</h2>
      <p style="color:var(--color-text-muted);max-width:500px;margin:0 auto;">Real results from real people who trust us with their business.</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;">
      <div class="testimonial-card card" style="padding:32px;border-radius:var(--card-radius);background:var(--color-surface);border:1px solid var(--color-border);">
        <div style="display:flex;gap:4px;margin-bottom:16px;color:#f59e0b;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p style="margin-bottom:20px;color:var(--color-text);line-height:1.7;font-size:0.95rem;" data-section="testimonials" data-field="quote0">"Absolutely transformed how we work. The results exceeded our expectations and the team was incredibly professional throughout the entire process."</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="https://picsum.photos/seed/${imageBase}/48/48" alt="Avatar" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">
          <div>
            <div style="font-weight:700;font-size:0.95rem;" data-section="testimonials" data-field="name0">Alex Johnson</div>
            <div style="color:var(--color-text-muted);font-size:0.8rem;" data-section="testimonials" data-field="role0">CEO, TechCorp</div>
          </div>
        </div>
      </div>
      <div class="testimonial-card card" style="padding:32px;border-radius:var(--card-radius);background:var(--color-surface);border:1px solid var(--color-border);">
        <div style="display:flex;gap:4px;margin-bottom:16px;color:#f59e0b;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p style="margin-bottom:20px;color:var(--color-text);line-height:1.7;font-size:0.95rem;" data-section="testimonials" data-field="quote1">"The results speak for themselves. Our growth has been incredible since we started working together. Can't recommend them enough."</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="https://picsum.photos/seed/${imageBase + 1}/48/48" alt="Avatar" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">
          <div>
            <div style="font-weight:700;font-size:0.95rem;" data-section="testimonials" data-field="name1">Sarah Chen</div>
            <div style="color:var(--color-text-muted);font-size:0.8rem;" data-section="testimonials" data-field="role1">Marketing Director, GrowthCo</div>
          </div>
        </div>
      </div>
      <div class="testimonial-card card" style="padding:32px;border-radius:var(--card-radius);background:var(--color-surface);border:1px solid var(--color-border);">
        <div style="display:flex;gap:4px;margin-bottom:16px;color:#f59e0b;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p style="margin-bottom:20px;color:var(--color-text);line-height:1.7;font-size:0.95rem;" data-section="testimonials" data-field="quote2">"Outstanding service and attention to detail. They truly understand our needs and deliver solutions that make a real difference."</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="https://picsum.photos/seed/${imageBase + 2}/48/48" alt="Avatar" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">
          <div>
            <div style="font-weight:700;font-size:0.95rem;" data-section="testimonials" data-field="name2">Marcus Rivera</div>
            <div style="color:var(--color-text-muted);font-size:0.8rem;" data-section="testimonials" data-field="role2">Founder, StartupXYZ</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function faqHtml(): string {
  return `<section class="section" id="faq" style="padding:var(--section-padding) 0;">
  <div class="container" style="max-width:720px;margin:0 auto;padding:0 var(--container-padding);">
    <div style="text-align:center;margin-bottom:48px;">
      <div style="display:inline-block;padding:6px 16px;border-radius:99px;background:color-mix(in srgb, var(--color-primary) 10%, transparent);color:var(--color-primary);font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;">FAQ</div>
      <h2 style="font-size:2rem;font-weight:800;margin-bottom:12px;" data-section="faq" data-field="heading">Frequently Asked Questions</h2>
      <p style="color:var(--color-text-muted);">Everything you need to know before getting started.</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div class="faq-item" style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--card-radius);overflow:hidden;">
        <div class="faq-question" style="padding:20px 24px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:600;" data-section="faq" data-field="q0">How do I get started?<span class="faq-icon" style="color:var(--color-text-muted);font-size:1.2rem;">+</span></div>
        <div class="faq-answer" style="padding:0 24px;max-height:0;overflow:hidden;transition:max-height 0.3s ease,padding 0.3s ease;"><p style="color:var(--color-text-muted);line-height:1.7;padding-bottom:20px;" data-section="faq" data-field="a0">Getting started is easy! Simply sign up for a free account, and you'll be guided through the setup process step by step. No credit card required.</p></div>
      </div>
      <div class="faq-item" style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--card-radius);overflow:hidden;">
        <div class="faq-question" style="padding:20px 24px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:600;" data-section="faq" data-field="q1">What's included in the free plan?<span class="faq-icon" style="color:var(--color-text-muted);font-size:1.2rem;">+</span></div>
        <div class="faq-answer" style="padding:0 24px;max-height:0;overflow:hidden;transition:max-height 0.3s ease,padding 0.3s ease;"><p style="color:var(--color-text-muted);line-height:1.7;padding-bottom:20px;" data-section="faq" data-field="a1">Our free plan includes all core features with generous usage limits. You can upgrade anytime to unlock premium features and higher limits.</p></div>
      </div>
      <div class="faq-item" style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--card-radius);overflow:hidden;">
        <div class="faq-question" style="padding:20px 24px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:600;" data-section="faq" data-field="q2">Can I cancel at any time?<span class="faq-icon" style="color:var(--color-text-muted);font-size:1.2rem;">+</span></div>
        <div class="faq-answer" style="padding:0 24px;max-height:0;overflow:hidden;transition:max-height 0.3s ease,padding 0.3s ease;"><p style="color:var(--color-text-muted);line-height:1.7;padding-bottom:20px;" data-section="faq" data-field="a2">Yes, absolutely. You can cancel your subscription at any time with no penalties or hidden fees. Your data remains accessible even after cancellation.</p></div>
      </div>
      <div class="faq-item" style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:var(--card-radius);overflow:hidden;">
        <div class="faq-question" style="padding:20px 24px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;font-weight:600;" data-section="faq" data-field="q3">Do you offer customer support?<span class="faq-icon" style="color:var(--color-text-muted);font-size:1.2rem;">+</span></div>
        <div class="faq-answer" style="padding:0 24px;max-height:0;overflow:hidden;transition:max-height 0.3s ease,padding 0.3s ease;"><p style="color:var(--color-text-muted);line-height:1.7;padding-bottom:20px;" data-section="faq" data-field="a3">We provide 24/7 customer support via email and live chat. Pro and Agency plans also include priority phone support and a dedicated account manager.</p></div>
      </div>
    </div>
  </div>
  <style>.faq-answer.open{max-height:200px !important;padding-top:0 !important;}</style>
</section>`;
}

function ctaHtml(): string {
  return `<section class="section" id="contact" style="padding:var(--section-padding) 0;text-align:center;background:var(--color-bg-alt);">
  <div class="container" style="max-width:720px;margin:0 auto;padding:0 var(--container-padding);">
    <h2 style="font-size:clamp(2rem,4vw,2.75rem);font-weight:800;margin-bottom:16px;line-height:1.15;" data-section="cta" data-field="heading">Ready to Get Started?</h2>
    <p style="color:var(--color-text-muted);margin-bottom:32px;font-size:1.1rem;line-height:1.7;" data-section="cta" data-field="subheading">Join thousands of businesses who already trust us. Start your free trial today — no credit card required.</p>
    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
      <a href="#" class="btn btn-primary btn-lg" style="color:#fff;" data-section="cta" data-field="button">Start Free Trial</a>
      <a href="#" class="btn btn-secondary btn-lg" data-section="cta" data-field="button2">Talk to Sales</a>
    </div>
    <p style="color:var(--color-text-muted);font-size:0.85rem;margin-top:20px;">No credit card required &bull; 14-day free trial &bull; Cancel anytime</p>
  </div>
</section>`;
}

function footerHtml(brand: string): string {
  return `<footer style="padding:48px 0;border-top:1px solid var(--color-border);background:var(--color-bg-alt);">
  <div class="container" style="max-width:var(--max-width);margin:0 auto;padding:0 var(--container-padding);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
    <div style="font-weight:700;color:var(--color-text-muted);" data-section="footer" data-field="brand">&copy; 2026 ${brand}. All rights reserved.</div>
    <div style="display:flex;gap:24px;">
      <a href="#" style="color:var(--color-text-muted);text-decoration:none;font-size:0.9rem;">Privacy</a>
      <a href="#" style="color:var(--color-text-muted);text-decoration:none;font-size:0.9rem;">Terms</a>
      <a href="#" style="color:var(--color-text-muted);text-decoration:none;font-size:0.9rem;">Contact</a>
    </div>
  </div>
</footer>`;
}

// ── Intent-specific scaffolds ──

const SCAFFOLDS: Record<string, () => string> = {
  saas: () => [
    navHtml("SaaSPro"),
    heroHtml("Build Better Software, Faster", "The all-in-one platform for modern teams to ship products at scale. Automate workflows, track metrics, and collaborate seamlessly.", 101),
    statsHtml([{ value: "10K+", label: "Active Users" }, { value: "99.9%", label: "Uptime" }, { value: "50M+", label: "API Calls" }, { value: "4.9★", label: "Rating" }]),
    featuresHtml([
      { icon: "⚡", title: "Lightning Fast", desc: "Sub-second response times with our globally distributed infrastructure." },
      { icon: "🔒", title: "Enterprise Security", desc: "SOC 2 compliant with end-to-end encryption and SSO support." },
      { icon: "📊", title: "Advanced Analytics", desc: "Real-time dashboards and insights to drive data-informed decisions." },
      { icon: "🔌", title: "Seamless Integrations", desc: "Connect with 100+ tools your team already uses." },
      { icon: "🤖", title: "AI-Powered", desc: "Smart automation that learns from your workflow patterns." },
      { icon: "🌍", title: "Global Scale", desc: "Deploy to 30+ regions with automatic load balancing." },
    ], 110),
    aboutHtml(120),
    testimonialsHtml(130),
    faqHtml(),
    ctaHtml(),
    footerHtml("SaaSPro"),
  ].join("\n"),

  restaurant: () => [
    navHtml("The Golden Fork"),
    heroHtml("A Culinary Journey Awaits", "Fresh, seasonal ingredients crafted into unforgettable dishes by our award-winning chef. Reservations now open for dinner service.", 201),
    statsHtml([{ value: "15+", label: "Years of Excellence" }, { value: "4.8★", label: "Customer Rating" }, { value: "200+", label: "Menu Items" }, { value: "50K+", label: "Happy Diners" }]),
    featuresHtml([
      { icon: "🍽️", title: "Seasonal Menu", desc: "Our menu changes with the seasons to bring you the freshest flavors." },
      { icon: "🍷", title: "Wine Selection", desc: "Over 200 wines curated by our expert sommelier." },
      { icon: "👨‍🍳", title: "Expert Chefs", desc: "Award-winning culinary team with Michelin-star experience." },
      { icon: "🎉", title: "Private Events", desc: "Host your next celebration in our elegant private dining room." },
      { icon: "🚚", title: "Delivery", desc: "Enjoy our cuisine from the comfort of your home." },
      { icon: "🌿", title: "Farm to Table", desc: "Locally sourced ingredients from partner farms within 50 miles." },
    ], 210),
    aboutHtml(220),
    testimonialsHtml(230),
    faqHtml(),
    ctaHtml(),
    footerHtml("The Golden Fork"),
  ].join("\n"),

  portfolio: () => [
    navHtml("Jane Doe"),
    heroHtml("Creative Designer & Developer", "I craft digital experiences that are beautiful, functional, and memorable. Let's build something amazing together.", 301),
    statsHtml([{ value: "8+", label: "Years Experience" }, { value: "120+", label: "Projects Completed" }, { value: "50+", label: "Happy Clients" }, { value: "15", label: "Awards Won" }]),
    featuresHtml([
      { icon: "🎨", title: "UI/UX Design", desc: "User-centered designs that balance aesthetics with usability." },
      { icon: "💻", title: "Web Development", desc: "Clean, performant code using modern frameworks and best practices." },
      { icon: "📱", title: "Mobile Apps", desc: "Native and cross-platform apps that users love." },
      { icon: "🖼️", title: "Brand Identity", desc: "Complete brand systems from logo to style guide." },
      { icon: "📸", title: "Photography", desc: "Editorial and commercial photography for digital and print." },
      { icon: "🎬", title: "Motion Design", desc: "Animated interactions and video content that captivate." },
    ], 310),
    aboutHtml(320),
    testimonialsHtml(330),
    faqHtml(),
    ctaHtml(),
    footerHtml("Jane Doe"),
  ].join("\n"),

  agency: () => [
    navHtml("NexusDigital"),
    heroHtml("We Build What's Next", "A full-service digital agency that turns ambitious ideas into market-leading products. Strategy, design, and engineering under one roof.", 401),
    statsHtml([{ value: "200+", label: "Projects Delivered" }, { value: "$50M+", label: "Client Revenue Generated" }, { value: "35", label: "Team Members" }, { value: "98%", label: "Client Retention" }]),
    featuresHtml([
      { icon: "🚀", title: "Product Strategy", desc: "Market research, competitive analysis, and go-to-market planning." },
      { icon: "🎨", title: "Design & UX", desc: "Award-winning design team that creates pixel-perfect experiences." },
      { icon: "⚙️", title: "Engineering", desc: "Full-stack development with modern architecture and CI/CD." },
      { icon: "📈", title: "Growth Marketing", desc: "Data-driven campaigns that deliver measurable ROI." },
      { icon: "🔍", title: "SEO & Content", desc: "Organic growth strategies that compound over time." },
      { icon: "📊", title: "Analytics", desc: "Custom dashboards and reporting to track every metric." },
    ], 410),
    aboutHtml(420),
    testimonialsHtml(430),
    faqHtml(),
    ctaHtml(),
    footerHtml("NexusDigital"),
  ].join("\n"),

  ecommerce: () => [
    navHtml("ShopVibe"),
    heroHtml("Discover Your Style", "Shop the latest trends with free shipping on orders over $50. New arrivals weekly from your favorite brands.", 501),
    statsHtml([{ value: "10K+", label: "Products" }, { value: "50K+", label: "Happy Customers" }, { value: "4.9★", label: "Average Rating" }, { value: "24h", label: "Fast Delivery" }]),
    featuresHtml([
      { icon: "👗", title: "New Arrivals", desc: "Fresh styles added every week from top brands and designers." },
      { icon: "🏷️", title: "Best Deals", desc: "Up to 70% off on seasonal collections and flash sales." },
      { icon: "🚚", title: "Free Shipping", desc: "Complimentary shipping on all orders over $50." },
      { icon: "↩️", title: "Easy Returns", desc: "30-day hassle-free returns with prepaid shipping labels." },
      { icon: "💳", title: "Secure Checkout", desc: "Multiple payment options with bank-level encryption." },
      { icon: "⭐", title: "Rewards Program", desc: "Earn points on every purchase and unlock exclusive perks." },
    ], 510),
    aboutHtml(520),
    testimonialsHtml(530),
    faqHtml(),
    ctaHtml(),
    footerHtml("ShopVibe"),
  ].join("\n"),

  blog: () => [
    navHtml("The Daily Read"),
    heroHtml("Stories That Matter", "Thoughtful writing on technology, culture, and the human experience. Subscribe to join 25,000+ readers.", 601),
    statsHtml([{ value: "500+", label: "Articles" }, { value: "100K+", label: "Monthly Readers" }, { value: "25K", label: "Subscribers" }, { value: "50+", label: "Contributors" }]),
    featuresHtml([
      { icon: "📝", title: "In-Depth Features", desc: "Long-form journalism and investigative pieces." },
      { icon: "🎙️", title: "Podcast", desc: "Weekly conversations with industry leaders and thinkers." },
      { icon: "📧", title: "Newsletter", desc: "Curated weekly digest delivered to your inbox." },
      { icon: "💡", title: "Opinion", desc: "Bold perspectives on the issues that matter." },
      { icon: "🔬", title: "Research", desc: "Data-driven analysis and original research." },
      { icon: "🌍", title: "Global", desc: "Correspondents in 20+ countries." },
    ], 610),
    aboutHtml(620),
    testimonialsHtml(630),
    faqHtml(),
    ctaHtml(),
    footerHtml("The Daily Read"),
  ].join("\n"),

  fitness: () => [
    navHtml("IronPulse"),
    heroHtml("Transform Your Body & Mind", "Expert-led training programs designed to help you reach your peak potential. Join 5,000+ members today.", 701),
    statsHtml([{ value: "5K+", label: "Members" }, { value: "50+", label: "Classes/Week" }, { value: "20", label: "Expert Trainers" }, { value: "98%", label: "Goal Achievement" }]),
    featuresHtml([
      { icon: "💪", title: "Personal Training", desc: "One-on-one sessions tailored to your goals and fitness level." },
      { icon: "🧘", title: "Yoga & Mindfulness", desc: "Classes for all levels to improve flexibility and mental clarity." },
      { icon: "🏋️", title: "Group Classes", desc: "High-energy group workouts including HIIT, cycling, and boxing." },
      { icon: "🥗", title: "Nutrition Plans", desc: "Custom meal plans designed by certified nutritionists." },
      { icon: "📱", title: "Mobile App", desc: "Track workouts, book classes, and monitor progress on the go." },
      { icon: "🏆", title: "Challenges", desc: "Monthly fitness challenges with prizes and community support." },
    ], 710),
    aboutHtml(720),
    testimonialsHtml(730),
    faqHtml(),
    ctaHtml(),
    footerHtml("IronPulse"),
  ].join("\n"),

  startup: () => [
    navHtml("LaunchPad"),
    heroHtml("The Future Starts Here", "We're building the next generation of tools for the modern workforce. Join 10,000+ teams on the waitlist.", 801),
    statsHtml([{ value: "$5M", label: "Seed Funding" }, { value: "10K+", label: "Beta Users" }, { value: "3x", label: "Growth MoM" }, { value: "15", label: "Team Members" }]),
    featuresHtml([
      { icon: "🚀", title: "Early Access", desc: "Be among the first to experience our revolutionary platform." },
      { icon: "🔮", title: "AI-Native", desc: "Built from the ground up with artificial intelligence at the core." },
      { icon: "⚡", title: "Blazing Fast", desc: "Optimized for speed with sub-100ms response times globally." },
      { icon: "🔐", title: "Privacy First", desc: "Your data stays yours. Zero-knowledge architecture by default." },
      { icon: "🌐", title: "Open Platform", desc: "Extensible API and plugin ecosystem for unlimited customization." },
      { icon: "💬", title: "Community", desc: "Join thousands of builders shaping the future together." },
    ], 810),
    aboutHtml(820),
    testimonialsHtml(830),
    faqHtml(),
    ctaHtml(),
    footerHtml("LaunchPad"),
  ].join("\n"),
};

export function getScaffold(intent: string): string {
  const builder = SCAFFOLDS[intent] || SCAFFOLDS.saas;
  return builder();
}

// ── Patch prompt generator ──

export function generatePatchPrompt(intent: string, config: SiteConfig): string {
  return `You are a website content customizer. Given a user's description of their business or project, generate a JSON object to customize a ${intent} website scaffold.

Return ONLY valid JSON (no markdown, no code blocks, no explanation) with this structure:
{
  "title": "Page title for the browser tab",
  "description": "Meta description for SEO (under 160 chars)",
  "colors": {
    "primary": "#hex color matching their brand (optional)",
    "accent": "#hex accent color (optional)"
  },
  "sections": {
    "nav": { "brand": "Their Brand Name" },
    "hero": {
      "badge": "Short trust badge (e.g. 'Trusted by 500+ companies')",
      "headline": "Compelling headline for their specific business",
      "subheadline": "2-3 sentence value proposition that explains what they do and why it matters",
      "cta1": "Primary CTA text",
      "cta2": "Secondary CTA text",
      "social_proof_title": "Social proof stat (e.g. '4.9/5 Rating')",
      "social_proof_sub": "Supporting detail (e.g. 'from 2,000+ reviews')"
    },
    "features": {
      "label": "Section label (e.g. 'Features', 'Services', 'Menu')",
      "heading": "Section heading",
      "subheading": "Section subheading",
      "title0": "Feature 1 title", "desc0": "Feature 1 description (1-2 sentences)",
      "title1": "Feature 2 title", "desc1": "Feature 2 description",
      "title2": "Feature 3 title", "desc2": "Feature 3 description",
      "title3": "Feature 4 title", "desc3": "Feature 4 description",
      "title4": "Feature 5 title", "desc4": "Feature 5 description",
      "title5": "Feature 6 title", "desc5": "Feature 6 description"
    },
    "stats": {
      "value0": "Stat 1 number", "label0": "Stat 1 label",
      "value1": "Stat 2 number", "label1": "Stat 2 label",
      "value2": "Stat 3 number", "label2": "Stat 3 label",
      "value3": "Stat 4 number", "label3": "Stat 4 label"
    },
    "about": {
      "heading": "About section heading",
      "description": "2-3 sentences about the business, mission, or approach",
      "highlight_number": "Key stat (e.g. '15+')",
      "highlight_label": "Stat label (e.g. 'Years of Experience')",
      "check0": "Benefit 1 title", "check0_desc": "Short description",
      "check1": "Benefit 2 title", "check1_desc": "Short description",
      "check2": "Benefit 3 title", "check2_desc": "Short description",
      "check3": "Benefit 4 title", "check3_desc": "Short description"
    },
    "testimonials": {
      "heading": "Section heading",
      "quote0": "First testimonial (2-3 sentences, specific)", "name0": "Full name", "role0": "Title, Company",
      "quote1": "Second testimonial (2-3 sentences, specific)", "name1": "Full name", "role1": "Title, Company",
      "quote2": "Third testimonial (2-3 sentences, specific)", "name2": "Full name", "role2": "Title, Company"
    },
    "faq": {
      "heading": "FAQ section heading",
      "q0": "Question 1", "a0": "Answer 1 (2-3 sentences)",
      "q1": "Question 2", "a1": "Answer 2 (2-3 sentences)",
      "q2": "Question 3", "a2": "Answer 3 (2-3 sentences)",
      "q3": "Question 4", "a3": "Answer 4 (2-3 sentences)"
    },
    "cta": {
      "heading": "Final call to action heading",
      "subheading": "Supporting urgency text (1-2 sentences)",
      "button": "Primary CTA button text",
      "button2": "Secondary CTA button text"
    },
    "footer": { "brand": "© 2026 Brand Name. All rights reserved." }
  }
}

Current scaffold defaults:
- Title: "${config.title}"
- Colors: primary=${config.colors.primary}, bg=${config.colors.bg}
- Font: ${config.font1} / ${config.font2}

Rules:
- Make ALL content specific to the user's actual business — no generic placeholder text
- Write compelling, benefit-driven copy (not feature lists)
- Keep headlines under 10 words, punchy and memorable
- Testimonials should feel real, specific to the industry, with realistic names
- Stats should be plausible for the industry
- FAQ answers should be helpful and specific to their business type
- About section should tell their unique story
- Only include "colors" if the user mentions specific brand colors
- Return ONLY the JSON object — no markdown fences, no explanation`;
}
