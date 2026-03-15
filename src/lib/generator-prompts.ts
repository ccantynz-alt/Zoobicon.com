/**
 * Generator prompt definitions — maps generator type IDs to starter prompts,
 * display names, and SYSTEM PROMPT SUPPLEMENTS for the builder's generator
 * routing system.
 *
 * Generator IDs match the last segment of each generator's endpoint path
 * from src/app/generators/page.tsx (e.g., /api/generate/landing → "landing").
 *
 * System prompt supplements are appended to the base STANDARD/PREMIUM system
 * prompt when a generator type is active, giving the AI industry-specific
 * instructions for structure, sections, visual style, and content.
 */

export interface GeneratorDef {
  name: string;
  prompt: string;
}

const GENERATOR_PROMPTS: Record<string, GeneratorDef> = {
  // ── Websites ──
  landing: {
    name: "Landing Page",
    prompt:
      "Create a modern, high-converting landing page for [describe your product or service]. Include a compelling hero section with headline and CTA, features grid with icons, social proof/testimonials, pricing table with 3 tiers, FAQ accordion, and a final call-to-action section.",
  },
  portfolio: {
    name: "Portfolio & Case Studies",
    prompt:
      "Create a professional portfolio website for [describe yourself or your work]. Include a filterable project gallery with hover effects, detailed case study layout, about/bio section, services offered, client logos, and a contact form.",
  },
  blog: {
    name: "Blog & Magazine",
    prompt:
      "Create a clean blog website for [describe your topic or niche]. Include a featured/hero post, article grid with thumbnails and excerpts, categories sidebar, author bio section, newsletter signup form, and dark mode toggle.",
  },
  directory: {
    name: "Business Directory",
    prompt:
      "Create a business directory website for [describe the industry or location]. Include search with filters (category, rating, location), listing cards with ratings and reviews, detail view with map and hours, and a submit-listing form.",
  },
  event: {
    name: "Event & Conference",
    prompt:
      "Create a conference website for [describe your event]. Include a countdown timer to the event date, speaker grid with bios and photos, multi-track schedule/agenda, ticket tier pricing, venue info with map, and sponsor logos.",
  },
  restaurant: {
    name: "Restaurant",
    prompt:
      "Create an elegant fine-dining restaurant website. HERO: Full-viewport hero image (.hero-image) of a beautifully plated gourmet dish (use seed/gourmet-food/1400/800) with warm overlay text (.overlay-text) and serif typography. MENU: Interactive menu organized by categories (Starters, Mains, Desserts, Wine) with dish names, descriptions, and prices. GALLERY: Photo gallery (.image-gallery) showing food, interior ambiance, and chef at work (use seed/restaurant-interior, seed/chef-cooking, seed/fine-dining, seed/wine-cellar). ABOUT: Chef profile section with story and philosophy. RESERVATION: Elegant booking form with date, time, party size, and special occasions. HOURS: Opening times with address and Google Maps placeholder. TESTIMONIALS: Dining reviews with specific dish mentions and ratings. Warm earth tones (#78350f amber, #fef3c7 cream, #1c1917 dark), Playfair Display headings, full-bleed food photography throughout. Must feel intimate, luxurious, and appetizing.",
  },
  realestate: {
    name: "Real Estate",
    prompt:
      "Create a premium luxury real estate website. HERO: Full-viewport hero carousel (.hero-carousel) with 3-5 stunning property photos using picsum seed/luxury-house, seed/modern-villa, seed/penthouse-view, seed/pool-villa, seed/estate-garden. White overlay headline text. LISTINGS: Property grid (.property-grid) with 6 property cards (.property-card) showing price, beds/baths/sqft (.feature-badge), and status badges (.status-for-sale). AGENTS: 3 agent profiles with photos, contact info, and bios. NEIGHBORHOODS: Full-width neighborhood showcase with descriptions and images. STATS: Properties sold, years experience, average sale price, client satisfaction. Navy (#1a365d) and gold (#c9a96e) palette, Playfair Display serif headings, full-bleed imagery throughout. Cinematic, aspirational, visually stunning.",
  },
  marketplace: {
    name: "Marketplace",
    prompt:
      "Create a two-sided marketplace for [describe the marketplace]. Include product/service listings with search and filters, seller profiles with ratings, category navigation, featured listings section, and a sign-up flow for buyers and sellers.",
  },

  // ── Business Applications ──
  saas: {
    name: "SaaS Dashboard",
    prompt:
      "Create a SaaS dashboard application for [describe your SaaS product]. Include a sidebar navigation, KPI metric cards, data table with sorting and pagination, analytics charts area, user settings page, and team management section.",
  },
  booking: {
    name: "Booking System",
    prompt:
      "Create an appointment booking system for [describe the business]. Include a calendar view with available time slots, service selection with descriptions and pricing, staff/provider selection, booking confirmation with details, and a manage-bookings view.",
  },
  admin: {
    name: "Admin Panel / CMS",
    prompt:
      "Create an admin panel / content management system for [describe what it manages]. Include a WYSIWYG content editor, media library with upload, navigation/menu editor, user role management, and a settings/configuration page.",
  },
  hrm: {
    name: "HR Management",
    prompt:
      "Create an HR management dashboard for [company name or type]. Include an employee directory with search, leave request and approval workflow, attendance tracker, organizational chart, and a performance review section.",
  },
  "project-mgmt": {
    name: "Project Management",
    prompt:
      "Create a project management tool for [describe your team or use case]. Include a Kanban board with drag-and-drop columns, task list with priorities and assignees, timeline/Gantt view, team workload overview, and time tracking.",
  },
  lms: {
    name: "Learning Platform (LMS)",
    prompt:
      "Create a learning management system for [describe the subject or audience]. Include a course catalog with categories, lesson player with progress bar, quiz/assessment interface, student dashboard with certificates, and instructor view.",
  },
  inventory: {
    name: "Inventory Management",
    prompt:
      "Create an inventory management system for [describe the business]. Include stock level dashboard with low-stock alerts, product catalog with SKUs, order management table, supplier directory, and analytics/reports section.",
  },
  dashboard: {
    name: "Data Dashboard",
    prompt:
      "Create an analytics dashboard for [describe what data to visualize]. Include KPI summary cards with trends, line/bar/pie charts using SVG, data table with filtering and export, date range picker, and a comparison view.",
  },

  // ── Enhancement Agents ──
  animations: {
    name: "Animation Agent",
    prompt:
      "Take my existing website and add smooth animations: scroll-triggered reveals on sections, parallax backgrounds, animated number counters, text fade-in effects, hover micro-interactions on buttons and cards, and a loading animation.",
  },
  "seo-markup": {
    name: "SEO Markup Agent",
    prompt:
      "Enhance my website with SEO best practices: add Open Graph and Twitter Card meta tags, JSON-LD structured data schema, fix heading hierarchy, add descriptive alt text to all images, optimize meta descriptions, and add canonical URLs.",
  },
  "dark-mode": {
    name: "Dark Mode Agent",
    prompt:
      "Add a complete dark mode system to my website: CSS custom properties for theming, toggle switch in the header, system preference detection, localStorage persistence, smooth color transitions, and proper contrast ratios.",
  },
  "forms-backend": {
    name: "Forms Backend Agent",
    prompt:
      "Make all forms on my website functional: add client-side validation with error messages, form submission handling with loading states, spam protection (honeypot), success/error notifications, and email-formatted submission templates.",
  },
  integrations: {
    name: "Integrations Agent",
    prompt:
      "Add third-party integrations to my website: Google Analytics 4 tracking, Facebook Pixel, Calendly booking widget, Google Maps embed, WhatsApp chat button, cookie consent banner, and social sharing buttons.",
  },

  // ── Marketing & Content ──
  "email-sequence": {
    name: "Email Sequence",
    prompt:
      "Create a multi-email marketing campaign for [describe your product/service and goal]. Include 5 HTML email templates (welcome, value prop, social proof, urgency, final CTA) with responsive design, send timing recommendations, and subject line A/B variants.",
  },
  "pitch-deck": {
    name: "Pitch Deck",
    prompt:
      "Create an interactive pitch deck for [describe your startup or project]. Include slides for: problem, solution, market size, product demo, business model, traction/metrics with SVG charts, team, and ask/funding. Add keyboard navigation.",
  },
  copy: {
    name: "Copywriter Agent",
    prompt:
      "Write professional marketing copy for [describe your product/service]. Include A/B headline alternatives, benefit-focused feature descriptions, compelling CTAs, customer-voice testimonials, and SEO-optimized meta title and description.",
  },
  "form-builder": {
    name: "Form Builder",
    prompt:
      "Create a multi-step form for [describe the purpose, e.g., onboarding, survey, application]. Include conditional logic between steps, real-time field validation, progress indicator, auto-save functionality, and a submissions admin view.",
  },

  // ── Developer Tools ──
  "api-gen": {
    name: "REST API Generator",
    prompt:
      "Generate a complete REST API for [describe the resource/domain]. Include database schema design, CRUD endpoint handlers with validation, authentication middleware, rate limiting, error handling, and interactive API documentation page.",
  },
  "chrome-ext": {
    name: "Chrome Extension",
    prompt:
      "Create a Chrome extension for [describe what it does]. Include Manifest V3 configuration, popup UI with clean design, content script for page interaction, background service worker, options/settings page, and storage for user preferences.",
  },
  "component-lib": {
    name: "Component Library",
    prompt:
      "Create a UI component library for [describe the design system or brand]. Include buttons, inputs, cards, modals, tables, navigation, and alerts — each with all states (default, hover, active, disabled, loading), dark mode variants, and usage code snippets.",
  },
  pwa: {
    name: "Progressive Web App",
    prompt:
      "Create an installable Progressive Web App for [describe the application]. Include a service worker with offline caching, web app manifest, install prompt UI, responsive mobile-first design, push notification setup, and app-like navigation.",
  },

  // ── Design Systems ──
  "brand-kit": {
    name: "Brand Kit",
    prompt:
      "Create a complete brand kit and design system for [describe the brand]. Include color palette with usage guidelines, typography scale, spacing system, core UI components styled to the brand, brand voice and tone guidelines, and a downloadable style guide page.",
  },
  "style-guide": {
    name: "Style Guide Extractor",
    prompt:
      "Create a comprehensive style guide that documents: color palette with hex values and usage, typography with font families and scale, spacing and layout system, component patterns (buttons, cards, forms), and iconography guidelines.",
  },
  report: {
    name: "Business Report",
    prompt:
      "Create a professional business report for [describe the report topic]. Include a cover page, executive summary, data sections with SVG charts and tables, key findings with callout boxes, recommendations, and a table of contents with page links.",
  },
};

/**
 * Get generator definition by ID (the last segment of the endpoint path).
 * Falls back to a generic prompt if the ID isn't specifically defined.
 */
export function getGeneratorDef(generatorId: string): GeneratorDef {
  if (GENERATOR_PROMPTS[generatorId]) {
    return GENERATOR_PROMPTS[generatorId];
  }

  // Fallback: convert kebab-case ID to title case for display name
  const name = generatorId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return {
    name,
    prompt: `Create a ${name.toLowerCase()} website for [describe your business or project]. Include all essential sections, modern responsive design, and professional styling.`,
  };
}

/**
 * Convert a generator endpoint path to its ID.
 * e.g., "/api/generate/landing" → "landing"
 */
export function endpointToGeneratorId(endpoint: string): string {
  const parts = endpoint.split("/");
  return parts[parts.length - 1];
}

/**
 * Generator-specific system prompt supplements.
 * Appended to the base system prompt when a generator type is active.
 * These give the AI industry-specific instructions for structure,
 * sections, visual style, image seeds, and content patterns.
 */
const GENERATOR_SYSTEM_SUPPLEMENTS: Record<string, string> = {
  landing: `
## GENERATOR: HIGH-CONVERTING LANDING PAGE
You are building a landing page optimized for conversions. Follow this structure EXACTLY:

SECTIONS (in order):
1. Hero — ONE clear value proposition headline (max 12 words), subheading explaining the benefit, primary CTA button + secondary CTA, hero image or .hero-aurora background
2. Social proof bar — "Trusted by 500+ companies" with 5-6 muted company name placeholders
3. Problem → Solution — 3-column grid showing pain points, then your solution
4. Features — .grid-3 > .card with SVG icons. Lead with BENEFITS not features. "Save 10 hours/week" not "Has automation"
5. How it works — 3 numbered steps with icons
6. Social proof — .testimonial-card with specific metrics ("Increased revenue by 47%")
7. Pricing — 3 tiers in cards, middle tier highlighted with "Most Popular" .badge
8. FAQ — .faq-item accordion, 5 objection-handling questions
9. Final CTA — urgency-driven, repeat the main CTA
10. Footer

CONVERSION RULES:
- Every section ends with a CTA or leads to the next section
- Use specific numbers everywhere (not "many customers" but "2,847 customers")
- Above-fold CTA must be visible without scrolling
- Use contrasting CTA button colors that pop against the background
- Add friction reducers near CTAs: "No credit card required", "Free 14-day trial", "Cancel anytime"

IMAGE SEEDS: seed/saas-dashboard, seed/team-meeting, seed/laptop-workspace, seed/happy-customer`,

  saas: `
## GENERATOR: SAAS DASHBOARD APPLICATION
You are building a SaaS dashboard interface, NOT a marketing page. This is an APPLICATION UI.

LAYOUT:
- Fixed left sidebar (240px, dark bg) with: logo, nav links with icons, user avatar at bottom
- Top bar with search input, notifications bell, user dropdown
- Main content area with padding

SECTIONS (in main area):
1. Welcome header — "Good morning, Sarah" with today's date
2. KPI cards — 4 cards in a row: revenue, users, conversion rate, active sessions. Each with value, trend arrow (green up / red down), and sparkline
3. Chart area — Large area chart showing revenue/usage over time (use SVG path for a realistic chart line)
4. Data table — Sortable columns (Name, Status badge, Date, Amount), 8-10 rows, pagination controls
5. Activity feed — Recent events sidebar or section
6. Quick actions — "Create new...", "Export data", "Invite team member"

STYLE:
- Clean, minimal, lots of whitespace
- Sidebar: #1e293b or similar dark slate
- Main bg: #f8fafc light gray
- Cards: white with subtle shadow
- Use .badge for status indicators (green=active, yellow=pending, red=inactive)
- Font: Inter or system sans-serif
- NO hero sections, NO testimonials — this is an app, not a landing page

IMAGE SEEDS: seed/analytics-chart, seed/dashboard-ui`,

  portfolio: `
## GENERATOR: CREATIVE PORTFOLIO
You are building a designer/developer/creative portfolio. Visual impact is EVERYTHING.

SECTIONS:
1. Hero — Full-screen with name, title, and a bold statement. Dark or dramatic bg. Minimal text, maximum impact.
2. Featured work — 2-3 large project showcases with full-width images (.image-gallery), project title, brief description, and "View Project" link
3. Project grid — .grid-3 with project cards, hover overlay with title + category
4. About — Split layout: photo on left, bio + skills on right. List 5-8 skills with progress bars or tags
5. Services — What you offer, with pricing hints
6. Testimonials — 2-3 client quotes
7. Contact — Clean form + email + social links
8. Footer — Minimal

STYLE:
- Bold, expressive typography — large headings (clamp(2.5rem, 5vw, 5rem))
- Dark theme preferred (#0a0a0a bg, white text)
- Project images should be the hero — make them LARGE
- Hover effects on project cards (scale, overlay, color shift)
- Smooth scroll between sections
- Consider a horizontal scroll section for featured work

IMAGE SEEDS: seed/design-project, seed/creative-workspace, seed/portfolio-mockup, seed/brand-design, seed/ui-design, seed/photography-studio`,

  restaurant: `
## GENERATOR: RESTAURANT / DINING
You are building an elegant restaurant website. It must feel APPETIZING and INTIMATE.

SECTIONS:
1. Hero — Full-viewport .hero-image with gorgeous food/interior photo and .overlay-text. Serif heading, reservation CTA
2. About — Chef's story, restaurant philosophy, ambiance photo
3. Menu — Organized by category (Starters, Mains, Desserts, Wine). Each item: name in serif, description in body text, price right-aligned. Use subtle dividers between items
4. Gallery — .image-gallery with 6-8 photos of food, interior, bar, chef at work
5. Reservations — Elegant form: date picker, time, party size, special occasions dropdown, phone number
6. Hours & Location — Opening times table, address, embedded map placeholder
7. Testimonials — Dining reviews mentioning specific dishes
8. Footer — Hours, address, phone, social links

STYLE:
- Warm earth tones: #78350f (amber), #fef3c7 (cream), #1c1917 (dark charcoal)
- Serif headings (Playfair Display or Cormorant Gainsborough)
- Full-bleed food photography throughout
- Generous whitespace and elegant spacing
- Subtle gold accents for prices and dividers
- Must feel intimate, luxurious, and appetizing
- NO tech-startup aesthetic, NO gradient blobs

IMAGE SEEDS: seed/gourmet-food/1400/800, seed/restaurant-interior/1400/800, seed/chef-cooking/800/600, seed/fine-dining/800/600, seed/wine-cellar/800/600, seed/dessert-plating/800/600`,

  realestate: `
## GENERATOR: LUXURY REAL ESTATE
You are building a premium real estate website. ASPIRATIONAL and CINEMATIC.

SECTIONS:
1. Hero — .hero-carousel or .hero-image with full-viewport luxury property photo + .overlay-text. Navy+gold palette
2. Featured listings — .property-grid with 6 .property-card items. Each card: image, .property-card-price ($1.2M+), .property-card-meta (beds/baths/sqft with .feature-badge), .status-badge (.status-for-sale)
3. About the agency — split layout with team photo, years in business, areas served
4. Agent profiles — 3 agents with photos, names, titles, phone/email, and brief bio
5. Neighborhoods — 3-4 areas with full-width images, area name, description, price range
6. Market stats — .stat-item: properties sold (500+), avg sale price ($2.4M), years experience (25+), client satisfaction (98%)
7. Testimonials — Clients citing specific results ("Sold our home 15% above asking")
8. Contact — Elegant form with property interest dropdown
9. Footer

STYLE:
- Navy (#1a365d) + Gold (#c9a96e) palette with white/cream accents
- Playfair Display for headings, Inter for body
- Full-bleed property imagery — NO sparse white pages
- Properties should look aspirational — use large, cinematic images
- .status-for-sale (green), .status-sold (red), .status-open-house (amber) badges
- Subtle gold borders and dividers

IMAGE SEEDS: seed/luxury-house/1400/800, seed/modern-villa/1200/800, seed/mansion-interior/800/600, seed/penthouse-view/800/600, seed/pool-villa/1200/800, seed/estate-garden/800/600, seed/luxury-kitchen/800/600`,

  blog: `
## GENERATOR: BLOG / MAGAZINE
You are building a content-focused blog or online magazine. READABILITY is the priority.

SECTIONS:
1. Header — Clean nav with logo, category links, search icon, dark mode toggle
2. Featured post — Full-width hero with large image, category badge, headline, excerpt, author + date
3. Article grid — .grid-3 with post cards: thumbnail (16:9), category .badge, title, excerpt (2 lines), author avatar + name + date
4. Sidebar (on desktop) — Categories list, newsletter signup form, popular posts (small thumbnails + titles), tags cloud
5. Newsletter CTA — Full-width section: "Get the best stories delivered weekly" with email input + subscribe button
6. Footer — About the publication, categories, social links, legal

CONTENT STYLE:
- Generate 6-8 realistic article titles and excerpts for the topic
- Each article needs a different author name
- Categories should feel real (e.g., for a tech blog: "AI", "Startups", "Product", "Engineering", "Design")
- Use realistic dates within the last 2 months

VISUAL STYLE:
- Maximum readability: 18px body text, 1.8 line-height
- Generous whitespace between articles
- Light theme default (#fafafa bg)
- Clean serif or sans-serif (Georgia or Inter)
- Accent color for links and category badges
- Image aspect ratio: 16:9 for thumbnails, 21:9 for featured
- Subtle hover lift on article cards

IMAGE SEEDS: seed/blog-writing, seed/tech-conference, seed/startup-office, seed/code-editor, seed/design-thinking`,

  event: `
## GENERATOR: EVENT / CONFERENCE
You are building a conference or event website. It must create EXCITEMENT and drive ticket sales.

SECTIONS:
1. Hero — Bold, energetic. Event name, date, location, countdown timer (JS), primary "Get Tickets" CTA
2. About — What the event is, who it's for, what attendees will gain. 3-4 key value propositions
3. Speakers — .grid-3 with speaker cards: circular photo, name, title, company, talk topic. Use 6-8 speakers
4. Schedule — Multi-track agenda. Day tabs, time slots, session titles, speaker names, room/track badges
5. Ticket pricing — 3 tiers (Early Bird, Standard, VIP) with features comparison, "Limited" badges on early bird
6. Venue — Location name, address, photo of venue, transport info, nearby hotels
7. Sponsors — Logo grid in tiers (Gold, Silver, Bronze)
8. FAQ — 5 questions about logistics, refunds, dress code, etc.
9. Footer — Contact, social, legal

STYLE:
- Energetic, modern — dark background with vibrant accent color
- Bold sans-serif headings, large text
- Countdown timer in hero (JS: days, hours, minutes, seconds)
- Schedule should be scannable — use color-coded track badges
- Speaker photos should be circular with hover effect

IMAGE SEEDS: seed/conference-stage, seed/tech-event, seed/networking-crowd, seed/keynote-speaker`,

  ecommerce: `
## GENERATOR: E-COMMERCE STOREFRONT
You are building an online store. It must drive PURCHASES with trust and clarity.

SECTIONS:
1. Header — Logo, search bar, category nav, cart icon with count badge, account icon
2. Hero — Promotional banner with featured product/collection, "Shop Now" CTA
3. Categories — Horizontal scroll or grid of category cards with images
4. Product grid — .grid-3 or .grid-4 with product cards: image, name, price (with strikethrough original if on sale), rating stars, "Add to Cart" button, "New" or "Sale" .badge
5. Featured product — Full-width spotlight: large image, description, reviews summary, add to cart
6. Trust signals — Free shipping, 30-day returns, secure payment icons, customer count
7. Reviews — Customer reviews with star ratings, photos, verified purchase badge
8. Newsletter — "Get 10% off your first order" email signup
9. Footer — Shop categories, customer service links, payment method icons, social

PRODUCT CARDS MUST INCLUDE:
- Product image (seed/product-lifestyle)
- Product name
- Price (e.g., $49.99) with optional sale price
- Star rating (4-5 stars)
- "Add to Cart" button

STYLE:
- Clean, bright, trustworthy
- White background with subtle warm tones
- Clear typography hierarchy for prices (large, bold)
- Hover zoom on product images
- Trust-building everywhere (secure checkout badges, return policy)
- Mobile-first grid that stacks well

IMAGE SEEDS: seed/product-lifestyle, seed/fashion-store, seed/minimal-product, seed/shopping-bag, seed/gift-box`,

  dashboard: `
## GENERATOR: DATA DASHBOARD / ANALYTICS
You are building a data analytics dashboard. CLARITY of data is everything.

LAYOUT:
- Top bar with logo, date range picker, search, notification bell, user avatar
- Optional left sidebar with nav (can be collapsible)
- Main grid content area

SECTIONS:
1. KPI row — 4-5 metric cards: title, large number, trend percentage (green ↑ / red ↓), sparkline or mini chart
2. Main chart — Large area or line chart (SVG) showing primary metric over time with axis labels
3. Breakdown charts — 2 smaller charts side by side: bar chart + donut/pie chart
4. Data table — Full-width sortable table with: name, metric columns, status badges, action buttons. 10+ rows, pagination
5. Activity/alerts — Recent events feed or alerts panel
6. Quick actions — Export CSV, Share Report, Schedule Email buttons

CHART GUIDELINES:
- Use SVG for all charts — draw realistic paths, bars, and slices
- Include axis labels, gridlines, and legends
- Use distinct colors for data series (blue, green, amber, purple)
- Charts should look REALISTIC with plausible data

STYLE:
- Light theme: #f1f5f9 bg, white cards, subtle borders
- Clean sans-serif font (Inter)
- Lots of whitespace between cards
- Subtle shadows on cards, no heavy borders
- Color-code status: green=good, amber=warning, red=critical
- This is an APP, not a marketing site — no hero, no testimonials

IMAGE SEEDS: seed/analytics-data, seed/chart-visualization`,

  booking: `
## GENERATOR: BOOKING / APPOINTMENT SYSTEM
You are building an appointment booking interface. EASE OF USE is critical.

SECTIONS:
1. Header — Business name, nav (Services, Book Now, About, Contact)
2. Hero — Business description, "Book an Appointment" primary CTA
3. Services — .grid-3 with service cards: name, duration, price, "Book This" button. Examples: "Consultation (30 min) — $75", "Full Session (60 min) — $120"
4. Booking widget — Step-by-step flow:
   - Step 1: Select service (radio buttons or cards)
   - Step 2: Choose date (calendar grid with available dates highlighted)
   - Step 3: Pick time slot (grid of available times like "9:00 AM", "10:30 AM")
   - Step 4: Your details (name, email, phone, notes textarea)
   - Step 5: Confirmation summary
5. Staff/providers — Cards with photo, name, specialty, availability indicator
6. Testimonials — Client reviews
7. FAQ — Cancellation policy, what to bring, etc.
8. Footer — Business hours, location, phone

CALENDAR STYLE:
- 7-column grid (Mon-Sun)
- Available dates: white bg, clickable
- Unavailable: gray, not clickable
- Selected: brand color bg, white text
- Time slots: pill-shaped buttons in a flex grid

STYLE:
- Clean, calming, professional
- Soft palette: light backgrounds, one calming accent color
- Clear step indicator (1 → 2 → 3 → 4) with progress bar
- Large, tappable buttons for mobile

IMAGE SEEDS: seed/spa-wellness, seed/consultation-office, seed/salon-interior`,
};

/**
 * Get generator-specific system prompt supplement.
 * Returns empty string if no supplement exists for the generator type.
 */
export function getGeneratorSystemSupplement(generatorId: string): string {
  return GENERATOR_SYSTEM_SUPPLEMENTS[generatorId] || "";
}
