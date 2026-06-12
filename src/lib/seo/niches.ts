/**
 * Niche catalog for /ai-website-builder-for/[niche] programmatic SEO.
 *
 * Each entry produces one indexable page targeting:
 *   - "AI website builder for {niche}"
 *   - "{niche} website builder"
 *   - "best AI builder for {niche}"
 *
 * Goal: own the long tail. The competitor comparisons (catalog at
 * src/lib/seo/competitors.ts) target high-intent "{Competitor}
 * alternative" queries. This catalog targets "{job-to-be-done}"
 * queries which are slightly lower intent but much higher in volume.
 *
 * Honesty rule (same as competitors): every claim must hold up. If we
 * say "online ordering integration" that has to be true at click-time.
 *
 * Pages share a single dynamic route + a shared layout, so adding a
 * niche is one new entry here.
 */

export interface Niche {
  slug: string;
  /** Display name — appears in title, H1, og:title */
  name: string;
  /** Short tagline for hero subhead */
  tagline: string;
  /** Single sentence the visitor will read in the meta description */
  metaPitch: string;
  /** What kind of business this niche serves */
  audience: string;
  /** Generation prompt prefilled into the builder when CTA clicked */
  prefilledPrompt: string;
  /** Typical page/section structure the builder generates for this niche */
  sections: string[];
  /** Features users in this niche care most about */
  mustHaves: string[];
  /** Optional category grouping (used to organize the index page) */
  category:
    | "food-and-drink"
    | "creative"
    | "tech"
    | "professional-services"
    | "wellness"
    | "education-and-nonprofit"
    | "lifestyle"
    | "personal";
  /** FAQ entries — both for users AND for FAQPage JSON-LD */
  faqs: Array<{ q: string; a: string }>;
  /** Competitor comparisons most relevant to this niche (slug refs) */
  relatedCompetitors?: string[];
}

// ────────────────────────────────────────────────────────────────────
// Catalog — 28 niches. Add new ones at the bottom, build picks them
// up automatically via generateStaticParams.
// ────────────────────────────────────────────────────────────────────

const niches: Niche[] = [
  {
    slug: "restaurants",
    name: "Restaurants",
    tagline: "A site that makes people hungry and books the table.",
    metaPitch:
      "AI website builder for restaurants. Describe your menu and vibe — get a polished restaurant site with menu, reservations, and Google Maps in 60 seconds.",
    audience: "Owners and managers of independent restaurants, bistros, and trattorias",
    prefilledPrompt:
      "A modern restaurant website for [your name] with a hero photo, menu by course, our story, opening hours, address with map, reservations form, and Instagram feed.",
    sections: [
      "Hero with photography placeholder + tonight's special",
      "Menu by course (starters, mains, sides, desserts) with allergen tags",
      "Reservations form wired to email or OpenTable",
      "Our story / chef bio",
      "Opening hours + Google Maps embed",
      "Press quotes / testimonials",
      "Instagram feed",
      "Newsletter signup",
    ],
    mustHaves: [
      "Mobile-first — most reservations come from phones",
      "Menu loads in under a second — diners give up if it doesn't",
      "Photography-led layout — food is the product",
      "Schema.org Restaurant + Menu structured data so you appear in Google Maps cards",
    ],
    category: "food-and-drink",
    faqs: [
      {
        q: "Can Zoobicon build a restaurant menu that updates without a developer?",
        a: "Yes — the generated React site exposes the menu as a typed data structure. Edit one TSX file (or paste your printed menu and let the builder regenerate) and the site updates. Vapron hosting redeploys automatically.",
      },
      {
        q: "Do you integrate with OpenTable or Resy?",
        a: "The generated reservations form is a standard HTML form; point it at OpenTable's reservation widget URL or your Resy embed and it works. We don't yet have a one-click OpenTable plug, but the integration takes one paste.",
      },
      {
        q: "Will my restaurant site rank on Google Maps?",
        a: "Yes — the generated site ships with Restaurant + Menu + LocalBusiness JSON-LD by default, which is the same structured data Google uses to power local-pack and Maps listings.",
      },
    ],
    relatedCompetitors: ["wix", "squarespace"],
  },
  {
    slug: "cafes-and-coffee-shops",
    name: "Cafés & Coffee Shops",
    tagline: "A site that smells like fresh espresso.",
    metaPitch:
      "AI website builder for cafés and coffee shops. Hero photo, drinks menu, opening hours, address — your café online in 60 seconds.",
    audience: "Independent café and coffee-shop owners",
    prefilledPrompt:
      "A warm café website for [your café] with a hero photo of the bar, a coffee + pastry menu, our story, opening hours, address with map, and an Instagram feed.",
    sections: [
      "Photography-led hero",
      "Drinks menu (espresso, brew bar, milk drinks, seasonal)",
      "Food / pastry menu",
      "Roaster + bean origin notes",
      "Opening hours + address with Google Maps",
      "Loyalty / subscription signup",
      "Instagram feed",
    ],
    mustHaves: [
      "Lightning-fast on phones — the morning rush is a mobile audience",
      "Address + hours visible above the fold",
      "Photography that does the selling, not paragraphs of copy",
    ],
    category: "food-and-drink",
    faqs: [
      {
        q: "Can I sell coffee subscriptions through the site?",
        a: "Yes — the generated site ships with a Stripe-ready newsletter / subscription block. Wire your Stripe Connect account through Vapron's billing layer and recurring subscriptions are live.",
      },
      {
        q: "Will the menu update for seasonal specials without a developer?",
        a: "Yes — the menu lives in a typed data file. Edit, redeploy, done. Vapron handles the hosting redeploy automatically.",
      },
    ],
    relatedCompetitors: ["wix", "squarespace", "carrd"],
  },
  {
    slug: "bars-and-pubs",
    name: "Bars & Pubs",
    tagline: "Drinks, hours, and a vibe that makes people show up.",
    metaPitch:
      "AI website builder for bars and pubs. Drinks menu, events calendar, photos, opening hours — your venue online in 60 seconds.",
    audience: "Bar, pub, and cocktail-lounge owners",
    prefilledPrompt:
      "A bar website for [your venue] with a hero photo, drinks menu (cocktails, beer, wine), upcoming events / live music, opening hours, address with map, and gallery.",
    sections: [
      "Mood-first hero",
      "Drinks menu by category",
      "Upcoming events / gigs calendar",
      "Booking enquiry for private hire",
      "Photo gallery",
      "Opening hours + map",
    ],
    mustHaves: [
      "Atmosphere — the photography sells the site",
      "Mobile-fast — people decide on the walk",
      "Easy events surface — repeat customers check what's on",
    ],
    category: "food-and-drink",
    faqs: [
      {
        q: "Can the events calendar repeat for weekly trivia or live music?",
        a: "Yes — the generated calendar accepts recurring entries. Drop a JSON list of recurring events in and the site renders them automatically.",
      },
    ],
    relatedCompetitors: ["wix", "squarespace"],
  },
  {
    slug: "photographers",
    name: "Photographers",
    tagline: "A portfolio that lets the work speak.",
    metaPitch:
      "AI website builder for photographers. Image-first portfolio with galleries, services, booking form, and Instagram — your photography site in 60 seconds.",
    audience: "Wedding, portrait, family, and commercial photographers",
    prefilledPrompt:
      "A photography portfolio for [your name] with full-bleed galleries by category (weddings, portraits, commercial), about page, services + pricing, contact form, and Instagram feed.",
    sections: [
      "Full-bleed hero image",
      "Portfolio galleries by category",
      "About / artist statement",
      "Services + starting prices",
      "Booking enquiry form",
      "Press / publications",
      "Instagram feed",
      "Contact",
    ],
    mustHaves: [
      "Image-led layout — your photography IS the product",
      "Fast image loading via blurred placeholders and lazy hydration",
      "Lightbox gallery for each category",
    ],
    category: "creative",
    faqs: [
      {
        q: "How do my photos get into the generated site?",
        a: "The builder generates placeholder image slots. After the build, drop your images in the assets folder; the Vapron deploy step picks them up automatically. Future release: paste a folder URL and the builder pulls images in.",
      },
      {
        q: "Does the site work for both wedding and commercial work?",
        a: "Yes — multiple gallery categories are supported. Each category gets its own grid + lightbox so you can present wedding work and commercial work without confusing the visitor.",
      },
    ],
    relatedCompetitors: ["squarespace", "carrd", "framer"],
  },
  {
    slug: "videographers",
    name: "Videographers",
    tagline: "A reel-first site that closes shoots.",
    metaPitch:
      "AI website builder for videographers. Showreel-first portfolio with case studies, services, and contact form — your videography site in 60 seconds.",
    audience: "Wedding, commercial, and brand-film videographers",
    prefilledPrompt:
      "A videography portfolio for [your name] with a hero showreel, case studies by category, services + day rate, about, contact form, and Vimeo embeds.",
    sections: [
      "Full-width showreel hero",
      "Case studies by genre",
      "Services + day rate",
      "Booking enquiry",
      "Press / awards",
      "Contact",
    ],
    mustHaves: [
      "Showreel autoplay on mobile (muted, loop)",
      "Fast Vimeo / YouTube embeds with lazy load",
      "Case studies that tell process, not just outcomes",
    ],
    category: "creative",
    faqs: [
      {
        q: "Can I embed Vimeo videos as case studies?",
        a: "Yes — paste a Vimeo URL in the case-study data file and the generated site embeds it with lazy-loading and a poster image. Same works for YouTube.",
      },
    ],
    relatedCompetitors: ["squarespace", "framer"],
  },
  {
    slug: "graphic-designers",
    name: "Graphic Designers",
    tagline: "A portfolio that books real work.",
    metaPitch:
      "AI website builder for graphic designers. Project-led portfolio, case studies, services list, and contact form — your design site in 60 seconds.",
    audience: "Independent graphic and brand designers",
    prefilledPrompt:
      "A design portfolio for [your name] with project case studies (cover image, problem, process, outcome), about, services, and contact form.",
    sections: [
      "Cinematic hero",
      "Project case studies",
      "About + studio philosophy",
      "Services list",
      "Selected clients logos",
      "Contact",
    ],
    mustHaves: [
      "Case-study depth — the work has to be readable, not just thumbnails",
      "Typography pairing that respects design conventions",
      "Print-quality image rendering",
    ],
    category: "creative",
    faqs: [
      {
        q: "Can I export the site to a static HTML I can host elsewhere?",
        a: "Yes — Zoobicon outputs a real React + Tailwind codebase. Run `next build && next export` or just deploy to any host. Vapron is the default but not the lock-in.",
      },
    ],
    relatedCompetitors: ["framer", "webflow", "squarespace"],
  },
  {
    slug: "saas-startups",
    name: "SaaS Startups",
    tagline: "A landing page that converts the right traffic.",
    metaPitch:
      "AI website builder for SaaS startups. Hero, features, pricing, social proof, FAQ — your SaaS landing page in 60 seconds, with Stripe checkout wired.",
    audience: "Indie SaaS founders, early-stage startups, B2B product teams",
    prefilledPrompt:
      "A SaaS landing page for [your product] with hero + headline + sub-headline, features grid, how it works, pricing (3 tiers), testimonials, FAQ, and CTA. Brand colors: [your colors].",
    sections: [
      "Hero with headline + sub-headline + dual CTA",
      "Feature grid (6 features)",
      "How it works (3 steps)",
      "Social proof / customer logos",
      "Pricing (3 tiers)",
      "Testimonials",
      "FAQ",
      "Final CTA",
    ],
    mustHaves: [
      "Above-the-fold conversion — headline + CTA visible without scrolling",
      "Pricing block that's easy to scan in 3 seconds",
      "FAQ for SEO + objections",
      "Stripe checkout wired (via Vapron billing) — not a marketing form",
    ],
    category: "tech",
    faqs: [
      {
        q: "Can I wire up Stripe checkout from the pricing block?",
        a: "Yes — the generated pricing block emits standard data-driven CTAs. Connect Stripe through Vapron's billing layer and the buttons go from marketing CTAs to real checkout sessions.",
      },
      {
        q: "Does the site support feature flags or A/B tests?",
        a: "The output is a clean React codebase — drop in your favorite feature-flag library (PostHog, Statsig, GrowthBook). Vapron handles the build redeploy.",
      },
      {
        q: "Will it rank for my SaaS keywords?",
        a: "The generated site ships with SoftwareApplication + Product JSON-LD, semantic HTML, mobile-first responsive grid, and sub-second LCP. Those are the SEO fundamentals; long-tail content is yours to add.",
      },
    ],
    relatedCompetitors: ["lovable", "v0", "framer", "webflow"],
  },
  {
    slug: "ai-startups",
    name: "AI Startups",
    tagline: "A site that doesn't look like every other AI site.",
    metaPitch:
      "AI website builder for AI startups. Distinctive hero, demo embed, model card, pricing, FAQ — built by AI agents, ships in 60 seconds.",
    audience: "AI product teams, model providers, AI agent companies",
    prefilledPrompt:
      "An AI product landing page for [your product] with a distinctive hero (not a generic gradient), live demo embed area, model capabilities, use cases, pricing per token / per month, FAQ, and waitlist signup.",
    sections: [
      "Distinctive hero — not the default gradient + glow",
      "Live demo / interactive embed",
      "Model capabilities (table or grid)",
      "Use cases",
      "Pricing (per token + per month options)",
      "Trust block (safety, evals, model card link)",
      "FAQ",
      "Waitlist / signup",
    ],
    mustHaves: [
      "Visually distinct from the generic AI-startup-template look",
      "Demo block that shows the product working, not a fake screenshot",
      "Pricing transparency — per-token vs flat is critical for AI buyers",
    ],
    category: "tech",
    faqs: [
      {
        q: "Will my AI startup site stand out from the gradient-and-glow template?",
        a: "Six visible agents collaborate during the build, and the brand designer picks a non-generic palette per prompt. If the first generation feels too templated, the diff editor lets you change palette in 2 seconds without regenerating.",
      },
    ],
    relatedCompetitors: ["lovable", "v0", "emergent"],
  },
  {
    slug: "ecommerce-stores",
    name: "Ecommerce Stores",
    tagline: "A storefront that sells without a Shopify subscription.",
    metaPitch:
      "AI website builder for ecommerce stores. Product grid, cart, Stripe checkout, FAQ — your store online in 60 seconds without a Shopify monthly fee.",
    audience: "Independent ecommerce sellers, dropshippers, makers, DTC brands",
    prefilledPrompt:
      "An ecommerce store for [your brand] with a hero, featured products grid, full catalog, product detail pages, cart, Stripe checkout, about, and contact.",
    sections: [
      "Hero with featured product",
      "Featured products grid",
      "Full catalog",
      "Product detail page (gallery, variants, add-to-cart)",
      "Cart drawer",
      "Stripe checkout",
      "About / brand story",
      "Contact",
    ],
    mustHaves: [
      "Stripe checkout wired (via Vapron billing) — no Shopify tax",
      "Product variants (size, color)",
      "Mobile-optimized cart drawer",
      "Product JSON-LD for Google Shopping eligibility",
    ],
    category: "lifestyle",
    faqs: [
      {
        q: "Do I need Shopify if I use Zoobicon?",
        a: "No. The generated ecommerce site has Stripe checkout wired through Vapron's billing layer. You skip Shopify's monthly fee and per-transaction cut.",
      },
      {
        q: "Can I do product variants like size and color?",
        a: "Yes — the generated product detail page supports variants via a typed data structure. Edit the product file, push, and Vapron redeploys.",
      },
    ],
    relatedCompetitors: ["wix", "squarespace", "framer"],
  },
  {
    slug: "real-estate-agents",
    name: "Real Estate Agents",
    tagline: "A site that lists, captures leads, and books showings.",
    metaPitch:
      "AI website builder for real estate agents. Listings grid, featured property pages, lead capture, and contact form — your agent site in 60 seconds.",
    audience: "Independent real estate agents, small brokerages",
    prefilledPrompt:
      "A real estate agent site for [your name] with listings grid, featured property detail pages (gallery + map + specs + agent contact), about, testimonials, blog, and contact form.",
    sections: [
      "Hero with current featured listing",
      "Listings grid (sortable by price, beds, location)",
      "Property detail page (gallery, map, specs, mortgage calculator, agent contact)",
      "Agent bio + testimonials",
      "Recent sales",
      "Blog / market reports",
      "Lead capture form",
    ],
    mustHaves: [
      "Property JSON-LD + RealEstateAgent JSON-LD for Google rich results",
      "Mobile-first — buyers browse on phones",
      "Fast image galleries with proper lazy loading",
    ],
    category: "professional-services",
    faqs: [
      {
        q: "Can I sync MLS listings into the site?",
        a: "Not natively today — MLS integrations are jurisdiction-specific. The generated site exposes listings as a typed data structure; an MLS-to-JSON sync script is straightforward to add later.",
      },
    ],
    relatedCompetitors: ["wix", "squarespace"],
  },
  {
    slug: "lawyers",
    name: "Lawyers & Law Firms",
    tagline: "A firm website that wins trust before the first call.",
    metaPitch:
      "AI website builder for law firms. Practice areas, attorney bios, case results, contact form, and FAQ — your law firm site in 60 seconds.",
    audience: "Solo lawyers, boutique firms, mid-size practice groups",
    prefilledPrompt:
      "A law firm website for [firm name] with hero, practice areas grid, attorney bios, case results / wins, client testimonials, FAQ, and contact form.",
    sections: [
      "Hero with firm positioning statement",
      "Practice areas grid",
      "Attorney bios",
      "Case results / notable wins",
      "Client testimonials",
      "FAQ (jurisdiction-specific)",
      "Contact form + office address with map",
    ],
    mustHaves: [
      "LegalService JSON-LD for local SERP",
      "Disclaimer / advertising-compliance copy in footer (we ship a placeholder; review for your jurisdiction)",
      "Phone-prominent — most leads call before they email",
    ],
    category: "professional-services",
    faqs: [
      {
        q: "Does the generated site include the advertising-compliance disclaimer my bar association requires?",
        a: "We ship a placeholder disclaimer that you should review against your specific bar association's rules. Each jurisdiction has unique requirements — treat the placeholder as a starting point, not legal advice.",
      },
    ],
    relatedCompetitors: ["wix", "squarespace"],
  },
  {
    slug: "accountants",
    name: "Accountants & Bookkeepers",
    tagline: "A firm site that converts referrals into bookings.",
    metaPitch:
      "AI website builder for accountants. Services, team, pricing, contact, and booking form — your accounting firm site in 60 seconds.",
    audience: "Independent accountants, bookkeeping firms, CPA practices",
    prefilledPrompt:
      "An accounting firm website for [firm name] with hero, services (tax prep, bookkeeping, advisory), team bios, pricing tiers, FAQ, and contact / booking form.",
    sections: [
      "Hero with firm positioning",
      "Services list",
      "Team bios + credentials",
      "Pricing tiers (where appropriate)",
      "Process / what to expect",
      "FAQ",
      "Contact + booking form",
    ],
    mustHaves: [
      "AccountingService JSON-LD",
      "Trust badges (qualifications, professional body memberships)",
      "Mobile-first contact form",
    ],
    category: "professional-services",
    faqs: [
      {
        q: "Can I add a client portal for document upload?",
        a: "Not natively — that's a regulated workflow with specific compliance requirements. The generated marketing site can link out to a dedicated portal like SmartVault, Karbon, or your accounting-software client portal.",
      },
    ],
    relatedCompetitors: ["wix", "squarespace"],
  },
  {
    slug: "consultants",
    name: "Consultants",
    tagline: "A site that positions you as the obvious hire.",
    metaPitch:
      "AI website builder for consultants. Hero, services, case studies, testimonials, contact — your consultancy site in 60 seconds.",
    audience: "Independent consultants, boutique consultancies, fractional execs",
    prefilledPrompt:
      "A consulting site for [your name / firm] with hero positioning statement, services / offerings, case studies, client logos, about, and contact form.",
    sections: [
      "Sharp positioning hero",
      "Services / offerings",
      "Case studies (problem → process → outcome)",
      "Client logos",
      "About / bio",
      "Testimonials",
      "Contact form",
    ],
    mustHaves: [
      "Positioning statement that filters good-fit leads in 5 seconds",
      "Case studies with specific outcomes",
      "Calendly / Cal.com embed for booking",
    ],
    category: "professional-services",
    faqs: [
      {
        q: "Can I embed my Cal.com or Calendly booking widget?",
        a: "Yes — paste the embed code into the generated site's contact section. Vapron redeploys automatically.",
      },
    ],
    relatedCompetitors: ["framer", "carrd", "squarespace"],
  },
  {
    slug: "coaches",
    name: "Coaches",
    tagline: "A site that fills your calendar.",
    metaPitch:
      "AI website builder for coaches. Hero, programs, testimonials, booking form — your coaching site in 60 seconds.",
    audience: "Life coaches, business coaches, executive coaches",
    prefilledPrompt:
      "A coaching site for [your name] with hero, programs / packages, testimonials, about / story, free resource / lead magnet, FAQ, and booking form.",
    sections: [
      "Hero with personal positioning + photo",
      "Programs / packages",
      "Testimonials with before/after outcomes",
      "Lead magnet / free resource",
      "About / your story",
      "FAQ",
      "Booking form",
    ],
    mustHaves: [
      "Personal photography front and center — coaching is a relationship purchase",
      "Outcomes-first testimonials",
      "Lead magnet captures email for nurturing",
    ],
    category: "professional-services",
    faqs: [
      {
        q: "Can I sell coaching packages with Stripe?",
        a: "Yes — wire Stripe through Vapron's billing layer and the package CTAs become real checkout sessions.",
      },
    ],
    relatedCompetitors: ["carrd", "squarespace", "framer"],
  },
  {
    slug: "fitness-trainers",
    name: "Personal Trainers & Gyms",
    tagline: "A site that books sessions and signs up members.",
    metaPitch:
      "AI website builder for personal trainers and gyms. Programs, schedule, trainer bios, sign-up form — your fitness site in 60 seconds.",
    audience: "Personal trainers, small gyms, CrossFit boxes, yoga studios",
    prefilledPrompt:
      "A personal trainer / gym site for [your name / facility] with hero, programs, schedule / class times, trainer bios, testimonials, pricing, and signup form.",
    sections: [
      "Action-photo hero",
      "Programs / training types",
      "Class schedule",
      "Trainer bios",
      "Testimonials with transformation outcomes",
      "Pricing / membership tiers",
      "Sign-up form",
    ],
    mustHaves: [
      "ExerciseGym + LocalBusiness JSON-LD for local search",
      "Phone-prominent — many leads call first",
      "Class schedule above the fold",
    ],
    category: "wellness",
    faqs: [
      {
        q: "Can the class schedule auto-update weekly?",
        a: "Yes — the generated schedule reads from a typed data file. Edit your timetable, redeploy, done. Vapron handles the redeploy.",
      },
    ],
    relatedCompetitors: ["wix", "squarespace"],
  },
  {
    slug: "yoga-studios",
    name: "Yoga & Pilates Studios",
    tagline: "A site that fills the next class.",
    metaPitch:
      "AI website builder for yoga and pilates studios. Class schedule, instructor bios, pricing, sign-up form — your studio site in 60 seconds.",
    audience: "Yoga, pilates, and movement studio owners",
    prefilledPrompt:
      "A yoga studio site for [studio name] with calming hero, weekly class schedule, instructor bios, class types, intro offer, sign-up form, and address with map.",
    sections: [
      "Calming hero with mood imagery",
      "Class types (vinyasa, yin, hot, etc.)",
      "Weekly schedule",
      "Instructor bios",
      "Intro offer for new students",
      "Membership pricing",
      "Sign-up form",
      "Address + parking info",
    ],
    mustHaves: [
      "Mood-driven aesthetic — yoga is a vibe purchase",
      "Mobile schedule that's easy to scan",
      "Intro offer surfaced above the fold",
    ],
    category: "wellness",
    faqs: [
      {
        q: "Can I integrate with Mindbody or Acuity for class bookings?",
        a: "Yes — paste your Mindbody widget or Acuity embed into the generated site's schedule section. We don't yet ship a one-click integration, but the embed takes one paste.",
      },
    ],
    relatedCompetitors: ["squarespace", "wix"],
  },
  {
    slug: "dentists",
    name: "Dentists",
    tagline: "A practice site that books new patients.",
    metaPitch:
      "AI website builder for dentists. Services, team bios, new-patient form, contact — your dental practice site in 60 seconds.",
    audience: "Dental practices and clinics",
    prefilledPrompt:
      "A dental practice website for [practice name] with hero, services, dentist bios, new-patient form, testimonials, FAQ, and contact with map.",
    sections: [
      "Welcoming hero with team photo",
      "Services (general, cosmetic, emergency)",
      "Dentist bios + credentials",
      "New-patient intake form",
      "Insurance accepted",
      "Office tour photos",
      "Testimonials",
      "Contact + map",
    ],
    mustHaves: [
      "Dentist + LocalBusiness JSON-LD",
      "Phone-prominent — dental emergencies call",
      "Insurance / payment plan info visible",
    ],
    category: "wellness",
    faqs: [
      {
        q: "Does the new-patient form handle HIPAA-sensitive data?",
        a: "The generated form is a standard contact form. For HIPAA-compliant intake, route the form to a HIPAA-compliant endpoint (e.g. Jotform Health, or your practice-management software's intake URL).",
      },
    ],
    relatedCompetitors: ["wix", "squarespace"],
  },
  {
    slug: "chiropractors",
    name: "Chiropractors",
    tagline: "A practice site that books adjustments.",
    metaPitch:
      "AI website builder for chiropractors. Services, doctor bios, new-patient form, testimonials — your chiropractic site in 60 seconds.",
    audience: "Chiropractic clinics, sports rehab practices",
    prefilledPrompt:
      "A chiropractic practice site for [practice name] with hero, services (adjustments, rehab, massage), doctor bios, new-patient form, testimonials, and contact with map.",
    sections: [
      "Welcoming hero",
      "Services list",
      "Doctor bios + credentials",
      "New-patient intake form",
      "Conditions treated",
      "Testimonials",
      "Contact + map",
    ],
    mustHaves: [
      "MedicalBusiness + LocalBusiness JSON-LD",
      "Insurance accepted prominently displayed",
      "Phone-prominent",
    ],
    category: "wellness",
    faqs: [
      {
        q: "Can the site list specific conditions like sciatica or sports injuries?",
        a: "Yes — the generated services + conditions blocks are typed data. Add or edit conditions and the site updates on the next deploy.",
      },
    ],
    relatedCompetitors: ["wix", "squarespace"],
  },
  {
    slug: "therapists",
    name: "Therapists & Counselors",
    tagline: "A site that holds space and books sessions.",
    metaPitch:
      "AI website builder for therapists and counselors. About, specialties, fees, contact form — your therapy site in 60 seconds.",
    audience: "Solo therapists, counselors, and small practice groups",
    prefilledPrompt:
      "A therapy practice site for [your name] with calm hero, your approach, specialties, fees, FAQ, and contact form (with crisis-line notice).",
    sections: [
      "Calm hero with your photo",
      "Your approach / philosophy",
      "Specialties (anxiety, trauma, couples, etc.)",
      "Fees + insurance",
      "FAQ",
      "Contact form with crisis-line notice",
    ],
    mustHaves: [
      "Calm, professional aesthetic — no overly bright colors",
      "Crisis-line notice prominently displayed",
      "Clear fee disclosure",
    ],
    category: "wellness",
    faqs: [
      {
        q: "Does the contact form support HIPAA-compliant intake?",
        a: "The generated form is a standard contact form. For HIPAA-grade intake, route to a HIPAA-compliant service like SimplePractice or TheraNest's intake URL.",
      },
    ],
    relatedCompetitors: ["squarespace", "carrd"],
  },
  {
    slug: "nonprofits",
    name: "Nonprofits",
    tagline: "A site that tells the story and takes the donation.",
    metaPitch:
      "AI website builder for nonprofits. Mission, impact stories, donation form, volunteer signup — your nonprofit site in 60 seconds.",
    audience: "501(c)(3) nonprofits, charities, foundations",
    prefilledPrompt:
      "A nonprofit website for [org name] with hero (mission statement + photo), impact stats, programs, donation form, volunteer signup, board bios, financials transparency, and contact.",
    sections: [
      "Mission hero",
      "Impact statistics",
      "Programs / what we do",
      "Donation form (one-time + recurring)",
      "Volunteer signup",
      "Board / staff bios",
      "Financials / 990 transparency",
      "Newsletter signup",
    ],
    mustHaves: [
      "NGO JSON-LD",
      "Donation form above the fold on key landing pages",
      "Impact stats that are credible (sources where possible)",
    ],
    category: "education-and-nonprofit",
    faqs: [
      {
        q: "Can I accept tax-deductible donations through the site?",
        a: "Yes — wire Stripe (or your nonprofit-friendly processor like Donorbox or Givebutter) through Vapron's billing layer. The donate buttons become real checkout sessions.",
      },
    ],
    relatedCompetitors: ["wix", "squarespace"],
  },
  {
    slug: "churches",
    name: "Churches",
    tagline: "A site that welcomes visitors and serves the community.",
    metaPitch:
      "AI website builder for churches. Service times, sermons, ministries, give, contact — your church site in 60 seconds.",
    audience: "Local churches, congregations, parishes",
    prefilledPrompt:
      "A church website for [church name] with welcoming hero, service times, sermons (audio/video), ministries, give page, what to expect for visitors, and contact with map.",
    sections: [
      "Welcoming hero",
      "Service times prominent",
      "What to expect (for visitors)",
      "Sermons (audio / video archive)",
      "Ministries / small groups",
      "Give page",
      "Events calendar",
      "Contact + map",
    ],
    mustHaves: [
      "Church JSON-LD",
      "Service times above the fold",
      "Visitor-friendly tone — first-timers are the audience",
    ],
    category: "education-and-nonprofit",
    faqs: [
      {
        q: "Can the site host sermon audio/video?",
        a: "Yes — embed your podcast or YouTube feed. The generated sermon block pulls from a typed data structure, so each new sermon takes one entry to add.",
      },
    ],
    relatedCompetitors: ["wix", "squarespace"],
  },
  {
    slug: "musicians",
    name: "Musicians & Bands",
    tagline: "A site that books gigs and sells the album.",
    metaPitch:
      "AI website builder for musicians. Tour dates, music player, merch, bio, contact — your band site in 60 seconds.",
    audience: "Independent musicians, bands, DJs",
    prefilledPrompt:
      "A musician website for [artist / band name] with hero, tour dates, music player (Spotify or SoundCloud embed), latest release, merch links, bio, photos, and contact.",
    sections: [
      "Action-photo hero",
      "Tour dates with ticket links",
      "Music embed (Spotify / SoundCloud / Bandcamp)",
      "Latest release",
      "Merch links",
      "Bio",
      "Photos / press kit",
      "Booking enquiry",
    ],
    mustHaves: [
      "MusicGroup / MusicEvent JSON-LD",
      "Streaming embeds (Spotify, Apple Music, SoundCloud)",
      "Tour dates auto-sort upcoming first",
    ],
    category: "creative",
    faqs: [
      {
        q: "Can I sell merch from the site?",
        a: "Yes — link to your Bandcamp store, Shopify store, or wire Stripe through Vapron for direct sales.",
      },
    ],
    relatedCompetitors: ["squarespace", "carrd", "framer"],
  },
  {
    slug: "podcasters",
    name: "Podcasters",
    tagline: "A site that grows the audience between episodes.",
    metaPitch:
      "AI website builder for podcasters. Episode list, show notes, subscribe links, newsletter — your podcast site in 60 seconds.",
    audience: "Solo podcasters, interview podcasts, narrative shows",
    prefilledPrompt:
      "A podcast website for [show name] with hero, latest episode, episode archive, show notes, subscribe links (Apple, Spotify, Overcast), about hosts, sponsors, and newsletter signup.",
    sections: [
      "Hero with latest episode",
      "Episode archive (sortable)",
      "Show notes per episode",
      "Subscribe links",
      "About the show / hosts",
      "Sponsors",
      "Newsletter signup",
    ],
    mustHaves: [
      "PodcastSeries + PodcastEpisode JSON-LD",
      "RSS feed link",
      "Show-notes template that's SEO-friendly",
    ],
    category: "creative",
    faqs: [
      {
        q: "Can the site pull episodes from my RSS feed automatically?",
        a: "Not natively yet — episodes live in a typed data file. You add one entry per episode (paste the title + audio URL + show notes). RSS auto-sync is on the roadmap.",
      },
    ],
    relatedCompetitors: ["carrd", "squarespace"],
  },
  {
    slug: "authors",
    name: "Authors & Writers",
    tagline: "A site that sells the book and builds the list.",
    metaPitch:
      "AI website builder for authors. Books, bio, reviews, mailing list — your author site in 60 seconds.",
    audience: "Indie authors, traditionally published authors, journalists, columnists",
    prefilledPrompt:
      "An author website for [your name] with hero, books grid (cover + buy links), about, press / reviews, blog, and mailing list signup.",
    sections: [
      "Hero with featured book",
      "Books grid (cover, buy links, summary)",
      "About / bio",
      "Press / reviews",
      "Blog / essays",
      "Events / appearances",
      "Mailing list signup",
    ],
    mustHaves: [
      "Person + Book JSON-LD",
      "Buy links per book (Amazon, indie bookstores, audiobook)",
      "Mailing list signup as the primary CTA",
    ],
    category: "creative",
    faqs: [
      {
        q: "Can I integrate with Mailchimp or ConvertKit?",
        a: "Yes — paste your signup form embed into the generated newsletter section. We don't yet ship one-click integrations, but the embed takes one paste.",
      },
    ],
    relatedCompetitors: ["carrd", "squarespace"],
  },
  {
    slug: "hotels-and-bnbs",
    name: "Hotels & B&Bs",
    tagline: "A site that converts browsers into bookings.",
    metaPitch:
      "AI website builder for hotels and B&Bs. Rooms, gallery, booking widget, location — your hotel site in 60 seconds.",
    audience: "Boutique hotels, B&Bs, guesthouses, short-term rentals",
    prefilledPrompt:
      "A hotel / B&B website for [property name] with hero photography, rooms (with photos + amenities + rates), gallery, amenities, location with map, booking widget, and reviews.",
    sections: [
      "Photography-led hero",
      "Rooms grid (photos, amenities, rates)",
      "Gallery",
      "Amenities",
      "Location + things to do",
      "Booking widget (or external link)",
      "Reviews",
    ],
    mustHaves: [
      "LodgingBusiness + Hotel JSON-LD",
      "Photography front and center",
      "Booking widget above the fold (or clear CTA)",
    ],
    category: "lifestyle",
    faqs: [
      {
        q: "Can I embed Booking.com or my Cloudbeds booking widget?",
        a: "Yes — paste the widget code into the generated booking section. Vapron redeploys automatically.",
      },
    ],
    relatedCompetitors: ["squarespace", "wix"],
  },
  {
    slug: "personal-portfolios",
    name: "Personal Portfolios",
    tagline: "A site that's actually you, not a template.",
    metaPitch:
      "AI website builder for personal portfolios. Hero, work, about, contact — your portfolio in 60 seconds, built to feel like you not a template.",
    audience: "Designers, developers, marketers, creatives building a personal site",
    prefilledPrompt:
      "A personal portfolio for [your name] with a distinctive hero, work / projects grid, about, services or what I do, social links, and contact form.",
    sections: [
      "Distinctive hero (not the default gradient)",
      "Work / projects",
      "About",
      "Services or what I do",
      "Now / current focus",
      "Social links",
      "Contact",
    ],
    mustHaves: [
      "Personality in the copy — not generic 'I'm a passionate creative'",
      "Person JSON-LD with sameAs to social profiles",
      "Fast — portfolio visitors bounce in seconds",
    ],
    category: "personal",
    faqs: [
      {
        q: "Will my portfolio look the same as everyone else's?",
        a: "Six visible agents collaborate on each build, and the brand designer picks a non-default palette per prompt. The 121-component registry is wide enough that the same layout is unlikely. If it feels too templated, the diff editor lets you change palette + section order in seconds.",
      },
    ],
    relatedCompetitors: ["carrd", "framer", "squarespace"],
  },
  {
    slug: "freelancers",
    name: "Freelancers",
    tagline: "A site that books real client work.",
    metaPitch:
      "AI website builder for freelancers. Services, portfolio, testimonials, contact — your freelance site in 60 seconds.",
    audience: "Freelance designers, developers, writers, marketers, consultants",
    prefilledPrompt:
      "A freelancer website for [your name] with hero positioning statement, services I offer, portfolio / past work, client testimonials, about / process, and contact form.",
    sections: [
      "Positioning hero",
      "Services I offer",
      "Portfolio / past work",
      "Client testimonials",
      "About / process",
      "Pricing / starting from",
      "Contact form",
    ],
    mustHaves: [
      "Positioning statement that filters good-fit clients in 5 seconds",
      "Testimonials with specific outcomes",
      "Clear pricing or starting-from price",
    ],
    category: "personal",
    faqs: [
      {
        q: "Should I list my prices on the site?",
        a: "If your work is productized, yes — it filters out clients who can't afford you. If your work is bespoke, list a 'starts from' minimum. The generated pricing block supports both patterns.",
      },
    ],
    relatedCompetitors: ["carrd", "framer", "squarespace"],
  },
  {
    slug: "waitlists-and-landing-pages",
    name: "Waitlists & Pre-Launch",
    tagline: "A landing page that captures emails before you ship.",
    metaPitch:
      "AI website builder for waitlists and pre-launch landing pages. Hero, value prop, email capture, social proof — your waitlist live in 60 seconds.",
    audience: "Founders pre-launch, SaaS waitlists, product-led startups, indie hackers",
    prefilledPrompt:
      "A pre-launch waitlist landing page for [your product] with bold hero (problem + solution), email capture, what to expect, social proof (logos or testimonials), and FAQ.",
    sections: [
      "Bold hero with problem + solution",
      "Email capture (single field)",
      "What to expect / coming soon",
      "Social proof (logos or testimonials)",
      "Founders / team",
      "FAQ",
    ],
    mustHaves: [
      "Email capture above the fold",
      "Single primary CTA — no decision paralysis",
      "Loads in under a second",
    ],
    category: "tech",
    faqs: [
      {
        q: "Where do the emails go?",
        a: "The generated email-capture form posts to a typed endpoint. Point it at ConvertKit, Mailchimp, Beehiiv, or your own database — one configuration line.",
      },
    ],
    relatedCompetitors: ["carrd", "framer"],
  },
];

export const NICHES: Niche[] = niches;

export function getNiche(slug: string): Niche | undefined {
  return NICHES.find((n) => n.slug === slug);
}

export const NICHE_CATEGORIES: Array<{ id: Niche["category"]; label: string }> = [
  { id: "food-and-drink", label: "Food & Drink" },
  { id: "creative", label: "Creative" },
  { id: "tech", label: "Tech & Startups" },
  { id: "professional-services", label: "Professional Services" },
  { id: "wellness", label: "Wellness & Health" },
  { id: "education-and-nonprofit", label: "Education & Nonprofit" },
  { id: "lifestyle", label: "Lifestyle & Hospitality" },
  { id: "personal", label: "Personal & Freelance" },
];
