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

  // ── Mobile & Apps ──
  "mobile-app": {
    name: "Mobile App UI",
    prompt:
      "Create a mobile app interface for [describe your app]. Include a native-feeling bottom tab navigation, home screen with cards, detail view, profile page with settings, and onboarding flow with 3-4 swipeable intro screens.",
  },
  "react-native": {
    name: "React Native/Expo App",
    prompt:
      "Create a React Native mobile app with Expo for [describe your app]. Include tab navigation, multiple screens with real content, state management with React Context, and a polished native UI design.",
  },
  mobile: {
    name: "React Native/Expo App",
    prompt:
      "Create a React Native mobile app with Expo for [describe your app]. Include tab navigation, multiple screens with real content, state management with React Context, and a polished native UI design.",
  },
  "chatbot-ui": {
    name: "Chatbot Interface",
    prompt:
      "Create a conversational AI chatbot interface for [describe the use case]. Include a chat window with message bubbles, typing indicator, quick-reply buttons, file attachment support, conversation history sidebar, and a settings panel for customizing bot behavior.",
  },

  // ── Content & Media ──
  "newsletter": {
    name: "Newsletter Template",
    prompt:
      "Create a professional newsletter email template for [describe your brand or topic]. Include a header with logo, featured article with hero image, 3-4 secondary story cards, curated links section, social proof quote, and footer with unsubscribe link. Table-based layout for email client compatibility.",
  },
  "social-media": {
    name: "Social Media Pack",
    prompt:
      "Create a social media content pack for [describe your brand]. Include 6 post templates: quote card, product announcement, behind-the-scenes, testimonial highlight, statistics infographic, and event promotion. Each template should be designed for Instagram (1:1), with variations shown for Twitter and LinkedIn.",
  },
  "documentation": {
    name: "Product Documentation",
    prompt:
      "Create a developer documentation site for [describe your product or API]. Include a sidebar navigation with nested sections, getting-started guide, API reference with method badges and code examples, configuration reference table, troubleshooting FAQ, and changelog page.",
  },
  "case-study": {
    name: "Case Study / Whitepaper",
    prompt:
      "Create a long-form case study for [describe the project or client]. Include an executive summary, challenge description with pain points, solution walkthrough with screenshots, implementation timeline, results with specific metrics and charts, testimonial quotes, and a CTA to contact sales.",
  },

  // ── Specialized ──
  "podcast": {
    name: "Podcast Website",
    prompt:
      "Create a podcast website for [describe your show]. Include a hero with latest episode player (play/pause button, progress bar, timestamps), episode archive grid with thumbnails, guest profiles, show notes with timestamps, subscription buttons (Apple, Spotify, RSS), and a newsletter signup.",
  },
  "nonprofit": {
    name: "Nonprofit & Charity",
    prompt:
      "Create a nonprofit website for [describe the organization]. Include an emotional hero with impact statistics, mission statement, programs overview with cards, impact metrics with animated counters, donation form with suggested amounts ($25/$50/$100/custom), volunteer signup, event calendar, and team/board member grid.",
  },
  "fitness": {
    name: "Fitness & Wellness",
    prompt:
      "Create a fitness studio website for [describe the business]. Include a dynamic hero with class schedule preview, class types grid with difficulty levels, trainer profiles with certifications, membership pricing tiers, before/after transformation gallery, client testimonials, trial class booking form, and location with hours.",
  },
  "wedding": {
    name: "Wedding & Events",
    prompt:
      "Create an elegant wedding website for [names]. Include a romantic hero with countdown to the date, our story timeline, wedding party profiles with photos, venue details with map, RSVP form with meal choice and dietary options, gift registry links, photo gallery, and travel/accommodation info for guests.",
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
  ecommerce: {
    name: "E-Commerce Store",
    prompt:
      "Create a complete e-commerce storefront for [describe your products/business]. Include a hero with featured products, product grid with images/prices/add-to-cart, category navigation, shopping cart UI, customer reviews, and a checkout flow. Responsive with mobile-optimized product browsing.",
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

  directory: `
## GENERATOR: BUSINESS DIRECTORY / LISTINGS
You are building a business directory. DISCOVERABILITY and TRUST are key.

SECTIONS:
1. Hero — Search bar front and center. "Find the best [businesses] near you" with location + category inputs
2. Category grid — 8-12 category cards with icons (Restaurants, Hotels, Shopping, Services, etc.)
3. Featured listings — 6 listing cards: business photo, name, star rating (1-5), review count, category badge, address, "View" button
4. Map section — Placeholder for map showing listing pins
5. How it works — 3 steps: Search → Compare → Connect
6. Stats — "12,000+ businesses", "50,000+ reviews", "200+ cities"
7. Submit your business — CTA for business owners to add their listing
8. Footer

LISTING CARD MUST INCLUDE:
- Business photo (seed/business-storefront)
- Business name
- Star rating with filled/empty stars
- Review count ("128 reviews")
- Category .badge
- Address with location pin icon
- Open/Closed status indicator

STYLE:
- Clean, utilitarian — Google Maps-like reliability feel
- White cards on light gray background
- Blue accent for CTAs and links
- Search bar should be prominent and inviting
- Mobile-friendly: cards stack to single column

IMAGE SEEDS: seed/business-storefront, seed/cafe-exterior, seed/shop-front, seed/office-building`,

  marketplace: `
## GENERATOR: TWO-SIDED MARKETPLACE
You are building a marketplace connecting buyers and sellers. TRUST and EASE OF USE are critical.

SECTIONS:
1. Hero — Value proposition for both sides. "Buy & Sell [category]" with search bar
2. Category navigation — Horizontal scroll of categories with icons
3. Featured listings — .grid-3 product/service cards: image, title, price, seller name + avatar, rating, "View" button
4. How it works — Split into "For Buyers" (3 steps) and "For Sellers" (3 steps)
5. Top sellers — Seller profile cards with avatar, name, rating, items sold count
6. Trust & safety — Secure payments, buyer protection, verified sellers badges
7. Stats — Items listed, happy customers, transactions completed
8. Dual CTA — "Start Buying" + "Start Selling" side by side
9. Footer

STYLE:
- Friendly, approachable — Etsy/Airbnb feel
- Warm whites and soft grays with one accent color
- Rounded corners (12-16px) on all cards
- Clear price display on product cards
- Seller badges for verified/top-rated

IMAGE SEEDS: seed/marketplace-items, seed/handmade-products, seed/vintage-goods, seed/artisan-craft`,

  admin: `
## GENERATOR: ADMIN PANEL / CMS
You are building an admin dashboard for content management. EFFICIENCY and ORGANIZATION matter.

LAYOUT:
- Fixed left sidebar (260px, dark) with: logo, main nav (Dashboard, Content, Media, Users, Settings), collapse button
- Top bar with breadcrumbs, search, notifications, user avatar dropdown
- Main content area with white background

SECTIONS (in main area):
1. Dashboard overview — 4 KPI cards (total posts, total users, page views this month, comments pending)
2. Recent content — Table with columns: Title, Author, Status (.badge: Published/Draft/Review), Date, Actions (Edit/Delete)
3. Quick actions — "New Post", "Upload Media", "Add User" buttons
4. Content editor view — Rich text editor placeholder with formatting toolbar, title input, category/tag selectors, publish/save draft buttons
5. Media library — Grid of image thumbnails with upload dropzone
6. User management — User list with role .badges (Admin, Editor, Author, Viewer)

STYLE:
- Clean, professional, productivity-focused
- Sidebar: #1e293b dark slate, white text, blue highlight on active nav item
- Content area: white with #f8fafc gray background
- Tables: alternating row colors, hover highlight
- Use .badge for all status indicators
- NO decorative elements — pure utility

IMAGE SEEDS: seed/admin-dashboard, seed/cms-interface`,

  hrm: `
## GENERATOR: HR MANAGEMENT DASHBOARD
You are building an HR management application. CLARITY and WORKFLOW support are key.

LAYOUT:
- Left sidebar with: company logo, nav (Dashboard, Employees, Leave, Attendance, Payroll, Performance, Settings)
- Top bar with search, notifications, user profile
- Main grid area

SECTIONS:
1. Dashboard — 5 KPI cards: total employees, open positions, on leave today, upcoming birthdays, pending approvals
2. Employee directory — Searchable table: photo, name, department .badge, role, email, status (Active/On Leave/Remote)
3. Leave management — Calendar view showing leave requests, approval/reject buttons, leave balance summary
4. Attendance tracker — Today's attendance grid with check-in/check-out times, on-time/late badges
5. Org chart — Hierarchical view with department heads and team members
6. Quick actions — "Add Employee", "Post Job", "Run Payroll"

STYLE:
- Professional, clean, enterprise feel
- Soft blue palette (#3b82f6 primary) with white cards
- Department badges in distinct colors
- Status indicators: green=active, amber=on-leave, blue=remote
- Employee photos: circular, 40px in tables, 80px in profiles

IMAGE SEEDS: seed/office-team, seed/corporate-office`,

  "project-mgmt": `
## GENERATOR: PROJECT MANAGEMENT TOOL
You are building a project management application. TASK VISIBILITY and WORKFLOW are everything.

LAYOUT:
- Left sidebar: logo, project list, "Create Project" button, team members avatars at bottom
- Top bar: project name, view switcher (Board/List/Timeline), filter/sort, search
- Main area

SECTIONS:
1. Kanban board — 4 columns: To Do, In Progress, Review, Done. Each column has task cards.
   TASK CARD: title, assignee avatar (24px circle), priority badge (🔴 High, 🟡 Medium, 🟢 Low), due date, subtask count (3/5)
2. Task list view — Table: checkbox, task name, assignee, priority, due date, status, tags
3. Timeline view — Gantt-style bars showing task durations on a weekly grid
4. Team workload — Each member's name + avatar, assigned task count, capacity bar (green/yellow/red)
5. Project stats — Cards: total tasks, completion percentage (circular progress), overdue tasks, team velocity

STYLE:
- Modern, Notion/Linear-inspired
- Clean white/gray background, minimal borders
- Drag handle (⋮⋮) on each Kanban card
- Column counts in header: "In Progress (5)"
- Priority colors used consistently throughout
- Smooth card shadows on hover

IMAGE SEEDS: seed/kanban-board, seed/project-timeline`,

  lms: `
## GENERATOR: LEARNING MANAGEMENT SYSTEM (LMS)
You are building an e-learning platform. PROGRESS TRACKING and ENGAGEMENT are key.

SECTIONS:
1. Header — Logo, nav (Courses, My Learning, Certificates, Community), search bar, user avatar
2. Hero — "Learn [topic] from experts" with featured course image and "Start Learning" CTA
3. Course catalog — .grid-3 course cards: thumbnail, category .badge, title, instructor name + avatar, rating stars, student count, price, "Enroll" button
4. Categories — Horizontal scroll: Development, Design, Marketing, Business, Data Science, etc.
5. Featured course — Full-width spotlight: large preview image, course description, curriculum outline (expandable modules), instructor bio, reviews
6. Learning path — Step-by-step visual: 5 courses in sequence with progress indicators
7. Student stats — Courses completed, hours learned, certificates earned, current streak
8. Instructor section — 3 instructor cards with expertise, courses, student count, rating

COURSE CARD MUST INCLUDE:
- Thumbnail image (16:9 aspect ratio)
- Category badge (e.g., "Web Development")
- Course title
- Instructor: small avatar + name
- Rating: stars + number (e.g., ⭐ 4.8)
- Students enrolled: "12,456 students"
- Price or "Free" badge

STYLE:
- Friendly, educational, Udemy/Coursera-inspired
- White background with blue (#3b82f6) accent
- Progress bars in green
- Course cards with subtle shadow and hover lift

IMAGE SEEDS: seed/online-learning, seed/coding-tutorial, seed/classroom, seed/laptop-study`,

  inventory: `
## GENERATOR: INVENTORY MANAGEMENT SYSTEM
You are building a warehouse/inventory management dashboard. DATA ACCURACY and ALERTS matter.

LAYOUT:
- Left sidebar: logo, nav (Dashboard, Products, Orders, Suppliers, Reports, Settings)
- Top bar: search products, scan barcode button, notifications, user

SECTIONS:
1. Dashboard — 5 KPI cards: total SKUs, total stock value, low stock alerts (red count), pending orders, items shipped today
2. Stock levels — Horizontal bar chart showing stock levels by category with color coding (green=healthy, yellow=low, red=critical)
3. Product table — Columns: image thumb, SKU, product name, category, quantity, reorder point, unit cost, status (.badge: In Stock/Low/Out of Stock)
4. Low stock alerts — Red-highlighted cards for items below reorder point with "Reorder Now" button
5. Recent orders — Table: order ID, supplier, items, status (Processing/Shipped/Delivered), date, total
6. Supplier directory — Cards: supplier name, categories supplied, lead time, rating, contact
7. Quick actions — "Add Product", "Create PO", "Run Report"

STYLE:
- Utilitarian, data-dense, warehouse-management feel
- Status colors: green=#10b981, yellow=#f59e0b, red=#ef4444
- Tables with dense rows, minimal padding
- Stock level bars should be visually prominent
- Use monospace for SKUs and quantities

IMAGE SEEDS: seed/warehouse, seed/inventory-shelves`,

  animations: `
## GENERATOR: ANIMATION ENHANCEMENT AGENT
You are ADDING ANIMATIONS to existing HTML. Do NOT create a new site. You are an enhancement agent.

WHAT TO ADD:
1. Scroll-triggered reveals — Add .fade-in, .fade-in-left, .fade-in-right, .scale-in classes to sections and cards
2. Parallax backgrounds — Add CSS parallax effect to hero sections (background-attachment: fixed with subtle translateY on scroll)
3. Number counters — Animate .stat-number elements: count from 0 to target value on scroll into view
4. Text animations — Stagger heading words with .hero-reveal, add .hero-typed effect to key phrases
5. Hover micro-interactions — Scale(1.02) on cards, button glow effects, image zoom in containers
6. Loading animation — Add a brief page-load fade-in (opacity 0→1 on body after 200ms)
7. Smooth scroll — Add scroll-behavior: smooth to html

RULES:
- Use CSS animations where possible, JS only for counters and complex sequences
- Keep animations subtle (200-600ms duration, ease-out timing)
- Don't animate everything — focus on first-impression elements and CTAs
- Ensure animations don't interfere with usability
- Add will-change hints for animated elements
- Use IntersectionObserver for scroll triggers (with the failsafe already in component library)`,

  "seo-markup": `
## GENERATOR: SEO MARKUP ENHANCEMENT AGENT
You are ADDING SEO best practices to existing HTML. Do NOT create a new site.

WHAT TO ADD:
1. Meta tags — title (50-60 chars), description (150-160 chars), viewport, charset, robots
2. Open Graph — og:title, og:description, og:image, og:url, og:type, og:site_name
3. Twitter Card — twitter:card (summary_large_image), twitter:title, twitter:description, twitter:image
4. JSON-LD structured data — Organization, WebPage, BreadcrumbList, FAQ (if FAQ section exists), Product (if pricing exists)
5. Heading hierarchy — Ensure single H1, proper H2-H6 nesting, no heading gaps
6. Image optimization — Add descriptive alt text to ALL images, add width/height attributes, add loading="lazy" to below-fold images
7. Canonical URL — Add rel="canonical" link tag
8. Language — Add lang attribute to html tag

RULES:
- Meta title should include primary keyword + brand
- Meta description should be compelling and include a CTA
- JSON-LD must be valid — test-ready format
- Don't change visible content, only add invisible SEO elements
- Alt text should be descriptive, not stuffing keywords`,

  "dark-mode": `
## GENERATOR: DARK MODE ENHANCEMENT AGENT
You are ADDING a dark mode system to existing HTML. Do NOT create a new site.

WHAT TO ADD:
1. CSS custom properties — Define --bg, --text, --card-bg, --border, --muted, --primary, --primary-hover for light and dark
2. Toggle switch — A moon/sun toggle button in the header/nav area. Attractive, animated toggle
3. System preference detection — @media (prefers-color-scheme: dark) as initial default
4. localStorage persistence — Save user preference, restore on page load (before paint to prevent flash)
5. Smooth transitions — transition: background-color 0.3s, color 0.3s on major elements
6. Proper contrast — All text meets WCAG AA contrast ratios in both modes (4.5:1 for body text)

COLOR MAPPING:
- Light bg (#ffffff) → Dark bg (#0f172a or #0f2148)
- Light text (#111827) → Dark text (#e2e8f0)
- Light cards (white) → Dark cards (#1e293b)
- Light borders (#e5e7eb) → Dark borders (rgba(255,255,255,0.1))
- Keep primary color the same but adjust brightness if needed for dark bg

RULES:
- Apply [data-theme="dark"] to the <html> element
- NEVER use pure black (#000) for dark mode background — use dark navy or dark slate
- Images should not be inverted
- Toggle must be accessible (keyboard, aria-label)
- Prevent flash of wrong theme on page load (apply theme in <script> in <head>)`,

  "forms-backend": `
## GENERATOR: FORMS BACKEND ENHANCEMENT AGENT
You are MAKING FORMS FUNCTIONAL in existing HTML. Do NOT create a new site.

WHAT TO ADD:
1. Client-side validation — Required fields, email format, min/max length, phone format. Show inline errors below fields (red text, fade in)
2. Form submission handler — JavaScript fetch() to POST form data as JSON. Show loading spinner during submission
3. Success state — Replace form with success message + checkmark animation on successful submission
4. Error state — Show error banner above form if submission fails, with retry option
5. Spam protection — Add honeypot hidden field, check submission time (reject if < 2 seconds)
6. Input formatting — Auto-format phone numbers, trim whitespace, capitalize names

VALIDATION RULES:
- Show errors on blur (not on type)
- Red border on invalid fields, green on valid
- Error message format: "Please enter a valid email address"
- Disable submit button until all required fields valid
- Show password strength meter if password field exists

STYLE:
- Error text: #ef4444, 0.75rem, below the field
- Valid indicator: green checkmark icon inside input
- Loading: replace button text with spinner + "Sending..."
- Success: green checkmark circle + "Thank you!" + confirmation message`,

  integrations: `
## GENERATOR: THIRD-PARTY INTEGRATIONS AGENT
You are ADDING INTEGRATIONS to existing HTML. Do NOT create a new site.

WHAT TO ADD:
1. Google Analytics 4 — gtag.js snippet with configurable measurement ID
2. Facebook Pixel — Base pixel code with PageView event
3. Cookie consent banner — GDPR-compliant bottom banner: "We use cookies to improve your experience" with Accept/Decline/Settings buttons. Store preference in localStorage
4. WhatsApp chat button — Fixed bottom-right floating button linking to wa.me with pre-filled message
5. Google Maps embed — Replace map placeholders with iframe embed (configurable coordinates)
6. Social sharing buttons — Fixed left sidebar or inline: Twitter, Facebook, LinkedIn, Email sharing with current page URL
7. Calendly widget — "Book a Call" button that opens Calendly inline widget

RULES:
- All analytics scripts should be blocked until cookie consent is given
- Cookie banner must have: accept all, reject non-essential, customize choices
- WhatsApp button: green (#25d366), circular, with chat icon, fixed position
- Social share buttons use proper share URLs (no fake links)
- All integration code uses placeholder IDs that users can replace (e.g., "GA_MEASUREMENT_ID")`,

  "email-sequence": `
## GENERATOR: EMAIL MARKETING SEQUENCE
You are building a series of HTML email templates, NOT a website. EMAIL-SPECIFIC RULES APPLY.

OUTPUT FORMAT:
Generate 5 connected email templates. Each email is a complete HTML document using TABLE-BASED LAYOUT (for email client compatibility).

EMAIL SEQUENCE:
1. Welcome Email — Warm intro, what to expect, one CTA button
2. Value Proposition — Key benefit deep-dive, customer success metric, CTA
3. Social Proof — 2 customer testimonials, logos, "Join 2,000+ customers"
4. Urgency — Limited time offer or trial ending, countdown urgency, strong CTA
5. Final CTA — Last chance, summary of value, risk reversal ("money-back guarantee"), final button

EMAIL RULES:
- MAX width: 600px, centered table layout
- Use INLINE STYLES only (no <style> block for maximum compatibility)
- Use tables for layout, NOT flexbox or grid
- Use web-safe fonts: Arial, Helvetica, Georgia
- ALL images must have alt text
- CTA button: table-based, minimum 44px height, 160px width, rounded corners via border-radius
- Preheader text (hidden) for preview text in inbox
- Background color on body AND table
- Each email includes unsubscribe link at bottom

STYLE:
- Professional, branded, consistent across all 5
- Header: logo placeholder + nav links
- Footer: company address, unsubscribe, social icons
- CTA buttons: bold, contrasting color, centered

SUBJECT LINES (include 2 A/B variants per email):
- Email 1: "Welcome to [Brand]!" / "You're in! Here's what's next"
- Email 2: "Here's why 2,000+ teams trust us" / "The #1 way to [benefit]"
- Email 3: "See what others are saying" / "[Customer] grew 147% — here's how"
- Email 4: "Your trial ends in 3 days" / "Don't miss out on [benefit]"
- Email 5: "Last chance: [offer]" / "Final reminder before your trial expires"`,

  "pitch-deck": `
## GENERATOR: INTERACTIVE PITCH DECK
You are building a browser-based pitch deck with keyboard navigation. NOT a regular website.

SLIDES (each slide is a <section> with min-height: 100vh):
1. Title — Company name, tagline, logo placeholder, founder name + contact
2. Problem — 3 pain points with impact metrics ("Teams waste 15 hrs/week on [X]")
3. Solution — Your product description with screenshot mockup placeholder, key differentiator
4. Market — TAM/SAM/SOM with large numbers, market growth rate, target segment
5. Product — Feature walkthrough with 3-4 screenshots/mockups, key user flows
6. Business Model — Revenue streams, pricing tiers, unit economics (LTV, CAC, LTV:CAC ratio)
7. Traction — SVG chart showing growth (MRR, users, revenue), key milestones timeline
8. Team — 3-4 team members with photos, names, roles, relevant experience highlights
9. Competition — 2x2 matrix positioning chart (us vs competitors on 2 axes)
10. Ask — Funding amount, use of funds (pie chart), key milestones post-funding

NAVIGATION:
- Keyboard: Arrow keys or Space to advance, Escape for overview
- Slide counter: "4 / 10" in bottom-right corner
- Progress bar at very top of viewport
- Smooth scroll-snap between slides

STYLE:
- Dark theme (#0a0a1a bg, white text) — pitch-deck aesthetic
- Bold, large typography for key numbers
- One accent color throughout (electric blue #3b82f6)
- SVG charts for all data visualization
- Minimal text per slide — this is a PRESENTATION, not a document

IMAGE SEEDS: seed/startup-team, seed/product-mockup, seed/office-space`,

  copy: `
## GENERATOR: COPYWRITER ENHANCEMENT AGENT
You are REWRITING COPY on existing HTML for maximum conversion. Do NOT change layout or design.

WHAT TO IMPROVE:
1. Headlines — Rewrite to be benefit-focused, specific, and compelling. Use numbers ("Save 10 hrs/week") not vague claims ("Save time")
2. Subheadings — Each subheading should convey a complete benefit. Readers who only scan should understand the full value proposition
3. CTAs — Every button should use action verbs: "Start Free Trial" not "Submit". Add friction reducers nearby: "No credit card required"
4. Feature descriptions — Lead with BENEFIT, then explain the feature. "Cut report time by 60%" → "Our automated reporting pulls data from all sources..."
5. Testimonials — Make them specific with metrics: "Increased revenue by 47% in 3 months" not "Great product!"
6. Meta tags — SEO-optimized title (50-60 chars) and description (150-160 chars)

COPYWRITING RULES:
- Write at 8th grade reading level (Hemingway standard)
- Use "you" and "your" — not "we" and "our"
- Every section answers: "What's in it for me?"
- Include specific numbers everywhere
- Remove filler words: just, really, very, actually, basically
- A/B headline variants: provide 2 options for the main headline`,

  "form-builder": `
## GENERATOR: MULTI-STEP FORM BUILDER
You are building a multi-step form application. COMPLETION RATE is the metric.

FORM STRUCTURE:
- Step indicator at top (1 → 2 → 3 → 4 → 5) with labels, current step highlighted, completed steps with checkmarks
- Progress bar below step indicator (width matches percentage complete)
- One step visible at a time, smooth transition between steps
- Back and Next buttons at bottom of each step
- Final step has "Submit" button

FORM FEATURES:
1. Conditional logic — Show/hide fields based on previous answers (e.g., "Other" text field appears when "Other" is selected)
2. Real-time validation — Validate on blur, show green check for valid, red error for invalid
3. Auto-save — Save form state to localStorage on every change, restore on page load
4. File upload — Drag-and-drop zone with preview thumbnails
5. Summary step — Review all answers before submission

STYLE:
- Clean, focused — one question group per step to reduce cognitive load
- Large input fields (min 44px height) for touch targets
- Clear field labels above inputs
- Helper text below complex fields in gray
- Progress: blue (#3b82f6) fill on gray (#e5e7eb) track
- Step indicator: circles connected by lines, active=blue, complete=green+check, upcoming=gray`,

  "api-gen": `
## GENERATOR: REST API DOCUMENTATION & CODE
You are generating a complete REST API with documentation page. This is a TECHNICAL product.

OUTPUT SECTIONS:
1. API Reference page — Interactive documentation with endpoint list, request/response examples
2. Database schema — SQL CREATE TABLE statements with relationships
3. Endpoint handlers — JavaScript/TypeScript code for each CRUD endpoint

API DOCUMENTATION PAGE SECTIONS:
1. Header — API name, version, base URL, authentication method (Bearer token)
2. Getting Started — Quick start guide with curl examples
3. Authentication — How to get/use API keys, token format
4. Endpoints — For each endpoint:
   - Method badge (GET=green, POST=blue, PUT=yellow, DELETE=red)
   - Path with parameter placeholders
   - Description
   - Request body schema (JSON, with required/optional markers)
   - Response example (JSON, syntax-highlighted with <code>)
   - Error codes table (400, 401, 403, 404, 500)
5. Rate limiting — Limits per tier, rate limit headers explanation
6. SDKs — Code examples in JavaScript, Python, curl

STYLE:
- Dark sidebar with endpoint navigation, light content area (Stripe docs-inspired)
- Code blocks with syntax highlighting (dark bg, monospace)
- Method badges in distinct colors
- Collapsible sections for request/response bodies
- Copy button on code examples`,

  "chrome-ext": `
## GENERATOR: CHROME EXTENSION
You are generating a Chrome extension. Output is a MANIFEST + POPUP UI + CONTENT SCRIPT.

STRUCTURE:
Generate a complete extension with these components described in the output:

1. manifest.json — Manifest V3 with proper permissions, icons, popup action, content_scripts
2. popup.html — Clean popup UI (400px max width) with:
   - Extension name and version
   - Toggle switches for features
   - Quick action buttons
   - Stats/counters display
   - Settings link
3. popup.js — Event handlers for popup interactions, chrome.storage usage
4. content.js — Content script that interacts with web pages
5. background.js — Service worker for background tasks, alarms, messaging
6. options.html — Settings page with form inputs for customization

POPUP STYLE:
- Clean, compact — popup should be usable at 350x500px
- Use system font stack
- Rounded corners on all elements
- Toggle switches instead of checkboxes
- Subtle animations on state changes
- Dark mode support based on system preference`,

  "component-lib": `
## GENERATOR: UI COMPONENT LIBRARY
You are building a comprehensive component library documentation page. This is a DESIGN SYSTEM reference.

SECTIONS:
1. Header — Library name, version, "Get Started" and "GitHub" buttons
2. Overview — Design principles (3-4), color palette with hex values, typography scale
3. For EACH component category, show: component name, description, live preview, ALL states, code snippet

COMPONENTS TO INCLUDE:
- Buttons: primary, secondary, ghost, destructive, loading, disabled, icon button. Sizes: sm, md, lg
- Inputs: text, email, password (with toggle), textarea, select dropdown. States: default, focus, error, disabled
- Cards: default, with image, flat/no-shadow, interactive (hover)
- Badges: primary, success, warning, error, outline variant
- Modals: default, confirmation dialog, form modal
- Tables: basic, striped, sortable header, pagination
- Navigation: navbar, sidebar, tabs, breadcrumbs
- Alerts: info, success, warning, error, dismissible
- Tooltips: top, bottom, left, right
- Progress: bar, circular, with label

STYLE:
- Component previews on white card backgrounds
- Code snippets in dark code blocks with copy button
- Each component has a light gray container with padding
- Use a consistent primary color across all components`,

  pwa: `
## GENERATOR: PROGRESSIVE WEB APP
You are building an installable PWA. It must feel like a NATIVE APP.

OUTPUT INCLUDES:
1. Main HTML — App shell with bottom navigation (like a mobile app)
2. manifest.json — name, short_name, description, start_url, display: standalone, theme_color, background_color, icons
3. Service worker — Caching strategies: cache-first for static assets, network-first for API calls
4. Install prompt — Custom "Add to Home Screen" banner with dismiss

APP SHELL LAYOUT:
- Status bar area at top (time placeholder)
- App header with title and action icons
- Main scrollable content area
- Bottom tab navigation: Home, Search, Add, Notifications, Profile (with active indicator)

FEATURES:
1. Offline indicator — Banner when offline: "You're offline. Some features may be unavailable"
2. Pull-to-refresh — Custom pull-down animation at top
3. Splash screen — Centered logo + app name on theme color background
4. Loading skeleton — Gray placeholder boxes while content loads
5. Touch interactions — Ripple effect on taps, swipe to dismiss

STYLE:
- iOS/Android-native feel — no website aesthetic
- Bottom nav: fixed, 56px height, with icon + label
- Content padding: 16px sides
- Cards with 12px border-radius
- System font stack for native feel`,

  "brand-kit": `
## GENERATOR: BRAND KIT & DESIGN SYSTEM
You are creating a comprehensive brand identity document as a web page.

SECTIONS:
1. Cover — Brand name in primary typography, tagline, brand mark/logo placeholder
2. Brand story — Mission, vision, values (3-4 core values with descriptions)
3. Logo usage — Logo placement examples, minimum clear space, what NOT to do
4. Color palette — Primary, secondary, accent, neutral, semantic (success/warning/error) colors with:
   - Large swatch + hex + RGB + HSL values
   - Usage guidelines ("Use primary for CTAs and headers")
   - Contrast ratios against white/black
5. Typography — Heading font, body font, monospace font with:
   - Full alphabet preview
   - Scale: H1-H6 sizes with line heights
   - Weight options with previews
6. Spacing — 4px base grid, spacing scale (4, 8, 12, 16, 24, 32, 48, 64, 96px)
7. Components — Button styles, card styles, form inputs styled to brand
8. Brand voice — Tone descriptions (professional, friendly, technical), do/don't examples
9. Photography style — Image treatment guidelines, example mood board
10. Icons — Icon style (outlined/filled), size standards, usage rules

STYLE:
- Clean, editorial layout — lots of whitespace
- The page itself should exemplify the brand system it describes
- Use the brand fonts and colors throughout the document
- Large swatches, readable code values, clear examples`,

  "style-guide": `
## GENERATOR: STYLE GUIDE EXTRACTOR
You are creating a visual style guide that documents a design system.

SECTIONS:
1. Colors — All colors used: primary, secondary, accent, text, background, border. Each with:
   - Large color swatch (80px circle or square)
   - Color name, hex value, usage description
   - Light/dark variants
2. Typography — Font families, sizes, weights, line heights:
   - Live examples of each heading level
   - Body text samples at different sizes
   - Font pairing rationale
3. Spacing — Visual spacing scale showing each step
4. Borders — Border widths, styles, radius values with examples
5. Shadows — Shadow scale from subtle to dramatic with examples
6. Components — Each component with all its visual states documented
7. Grid & Layout — Column system, breakpoints, container widths
8. Iconography — Icon sizes, stroke widths, grid alignment

STYLE:
- Documentation-style: clean, organized, scannable
- Group related items together
- Show do/don't comparisons where applicable
- Code values next to every visual example`,

  "mobile-app": `
## GENERATOR: MOBILE APP UI
You are building a mobile-first app interface. It must feel like a NATIVE app, not a website.

LAYOUT:
- Fixed status bar at top (battery, time, signal)
- App header with title and action icons
- Scrollable main content
- Fixed bottom tab navigation: 4-5 tabs with icons + labels, active state indicator

SCREENS (show as separate sections, each min-height: 100vh):
1. Onboarding — 3 swipeable cards with illustration, headline, description, dot indicator, Skip/Next buttons
2. Home — Greeting ("Good morning, [name]"), search bar, horizontal card carousel, vertical list
3. Detail view — Full-width image, title, description, action buttons, related items
4. Profile — Avatar, name, stats row, settings list with toggles, sign out
5. Empty state — Friendly illustration placeholder, descriptive text, CTA button

STYLE:
- iOS/Android native feel — system font stack
- Bottom nav: 56px height, icons 24px, active tab with color + label
- Cards: 12px border-radius, subtle shadow, 16px padding
- Touch targets: minimum 44px height
- Safe area padding for notched devices
- Haptic-feeling button states (scale on press)

IMAGE SEEDS: seed/app-interface, seed/mobile-ui, seed/onboarding-illustration`,

  "react-native": `
## GENERATOR: REACT NATIVE / EXPO APP
You are building a MULTI-FILE React Native/Expo mobile application. Output ONLY valid JSON — no markdown, no code fences.

OUTPUT FORMAT:
{
  "projectName": "my-app",
  "description": "Brief description",
  "files": [
    { "path": "App.tsx", "content": "..." },
    { "path": "screens/HomeScreen.tsx", "content": "..." }
  ]
}

REQUIRED FILES (MINIMUM):
1. App.tsx — Root with NavigationContainer
2. app.json — Expo config (name, slug, version, icon, splash, platforms)
3. package.json — All dependencies (expo, react-native, @react-navigation/*, @expo/vector-icons, etc.)
4. navigation/index.tsx — Tab + stack navigator configuration with typed params
5. constants/Colors.ts — Full color palette (primary, secondary, background, text, border, success, error, warning)
6. screens/HomeScreen.tsx — Main screen with real content
7. screens/ — At least 2 more screens (Detail, Profile, Settings, Search, etc.)

CODE STANDARDS:
- TypeScript (.tsx) with proper type annotations throughout
- Functional components ONLY — no class components
- StyleSheet.create() for ALL styles — never inline objects
- React Navigation v6+ with typed navigation props (NativeStackScreenProps, BottomTabScreenProps)
- @expo/vector-icons (Ionicons preferred) for all icons
- SafeAreaView wrapper on every screen
- Platform.select() for iOS/Android style differences
- Real content specific to the app purpose — no placeholder text
- Images via https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT

NAVIGATION:
- BottomTabNavigator as root with 3-5 tabs
- NativeStackNavigator nested inside tabs for drill-down
- Typed RootTabParamList and per-tab stack param lists
- Custom tab bar styling (colors, icons, labels)
- Consistent header styles across stacks

DESIGN:
- 4px spacing grid (4, 8, 12, 16, 24, 32, 48)
- Card radius: 12px, button radius: 8px, pill radius: 9999
- Shadows via Platform.select (iOS shadow* vs Android elevation)
- Touch targets minimum 44x44
- FlatList for scrollable lists with keyExtractor
- Pull-to-refresh (RefreshControl) on list screens
- Loading states (ActivityIndicator), empty states, error states
- Consistent typography scale in constants file`,

  mobile: `
## GENERATOR: REACT NATIVE / EXPO APP
You are building a MULTI-FILE React Native/Expo mobile application. Output ONLY valid JSON — no markdown, no code fences.

OUTPUT FORMAT:
{
  "projectName": "my-app",
  "description": "Brief description",
  "files": [
    { "path": "App.tsx", "content": "..." },
    { "path": "screens/HomeScreen.tsx", "content": "..." }
  ]
}

REQUIRED FILES (MINIMUM):
1. App.tsx — Root with NavigationContainer
2. app.json — Expo config (name, slug, version, icon, splash, platforms)
3. package.json — All dependencies (expo, react-native, @react-navigation/*, @expo/vector-icons, etc.)
4. navigation/index.tsx — Tab + stack navigator configuration with typed params
5. constants/Colors.ts — Full color palette (primary, secondary, background, text, border, success, error, warning)
6. screens/HomeScreen.tsx — Main screen with real content
7. screens/ — At least 2 more screens (Detail, Profile, Settings, Search, etc.)

CODE STANDARDS:
- TypeScript (.tsx) with proper type annotations throughout
- Functional components ONLY — no class components
- StyleSheet.create() for ALL styles — never inline objects
- React Navigation v6+ with typed navigation props (NativeStackScreenProps, BottomTabScreenProps)
- @expo/vector-icons (Ionicons preferred) for all icons
- SafeAreaView wrapper on every screen
- Platform.select() for iOS/Android style differences
- Real content specific to the app purpose — no placeholder text
- Images via https://picsum.photos/seed/KEYWORD/WIDTH/HEIGHT

NAVIGATION:
- BottomTabNavigator as root with 3-5 tabs
- NativeStackNavigator nested inside tabs for drill-down
- Typed RootTabParamList and per-tab stack param lists
- Custom tab bar styling (colors, icons, labels)
- Consistent header styles across stacks

DESIGN:
- 4px spacing grid (4, 8, 12, 16, 24, 32, 48)
- Card radius: 12px, button radius: 8px, pill radius: 9999
- Shadows via Platform.select (iOS shadow* vs Android elevation)
- Touch targets minimum 44x44
- FlatList for scrollable lists with keyExtractor
- Pull-to-refresh (RefreshControl) on list screens
- Loading states (ActivityIndicator), empty states, error states
- Consistent typography scale in constants file`,

  "chatbot-ui": `
## GENERATOR: CHATBOT INTERFACE
You are building a conversational AI chatbot. NATURAL CONVERSATION FLOW is everything.

LAYOUT:
- Full-height chat container (100vh minus header)
- Header: bot name, avatar, online status indicator, settings gear icon
- Messages area: scrollable, auto-scroll to bottom
- Input area: text input, send button, attachment icon, mic icon

MESSAGE TYPES:
1. Bot messages — Left-aligned, colored bubble, bot avatar, timestamp
2. User messages — Right-aligned, darker bubble, no avatar
3. Typing indicator — Three animated dots in bot bubble
4. Quick replies — Horizontal scroll of pill-shaped option buttons below bot message
5. Cards — Bot sends rich cards: image, title, description, action buttons
6. System messages — Centered, small gray text ("Chat started", "Agent joined")

FEATURES:
1. Conversation sidebar — List of previous chats with preview text and timestamp
2. Welcome screen — Before first message: greeting, suggested prompts as cards
3. File sharing — Drag-drop area, file preview with progress bar
4. Settings panel — Bot personality toggle, dark mode, notification preferences

STYLE:
- Clean, modern messaging app feel (iMessage/WhatsApp inspired)
- Bot bubbles: soft accent color with slightly rounded corners
- User bubbles: brand color, white text
- Typing indicator: subtle bounce animation
- Smooth send animation on messages

IMAGE SEEDS: seed/chatbot-interface, seed/ai-assistant`,

  newsletter: `
## GENERATOR: NEWSLETTER EMAIL TEMPLATE
You are building an HTML email template. TABLE-BASED LAYOUT required for email client compatibility.

EMAIL RULES:
- MAX width: 600px, centered with table layout
- Use INLINE STYLES only (no <style> blocks for max compatibility)
- Tables for layout, NOT flexbox or grid
- Web-safe fonts: Arial, Helvetica, Georgia
- All images must have alt text and width/height attributes

SECTIONS:
1. Header — Logo centered, navigation links (plain text)
2. Hero — Featured article: large image, headline, 2-line excerpt, "Read More" button
3. Content grid — 2-column table: 3-4 secondary stories with thumbnail, title, excerpt
4. Curated links — "What We're Reading" section with 5 annotated links
5. Quote/highlight — Pull quote from a customer or team member, styled box
6. CTA — Primary action with large button (table-based, min 44px height)
7. Footer — Company address (required for CAN-SPAM), unsubscribe link, social icons, copyright

STYLE:
- Professional and readable
- 16px body text, 1.5 line height
- CTA buttons: bold contrasting color, 40px+ height, 160px+ width
- Consistent padding: 20px on all sides
- Preheader text (hidden) for inbox preview

IMAGE SEEDS: seed/newsletter-header, seed/article-thumbnail`,

  "social-media": `
## GENERATOR: SOCIAL MEDIA CONTENT PACK
You are creating a set of social media post templates. Each is a self-contained visual card.

OUTPUT: 6 distinct post templates, each shown as a card in a .grid-2 layout.

TEMPLATES:
1. Quote Card — Background gradient/pattern, large quote text (centered), attribution, brand logo
2. Product Announcement — Product image, "NEW" badge, product name, key feature, price, "Shop Now"
3. Behind-the-Scenes — Photo placeholder, casual caption overlay, brand watermark
4. Testimonial — Customer photo circle, 5-star rating, quote, customer name + company
5. Statistics Infographic — Large number, descriptive label, comparison/context, source citation
6. Event Promotion — Event image, date badge, event name, location, "Register Now" CTA

EACH TEMPLATE SHOWS:
- Instagram version (1080x1080, 1:1 aspect ratio)
- Suggested caption text below the visual
- Suggested hashtags (5-8 relevant ones)

STYLE:
- Bold, scroll-stopping visuals
- Large text (readable on mobile)
- Brand colors throughout
- Instagram aesthetic: clean, professional, consistent

IMAGE SEEDS: seed/social-media-post, seed/product-flat-lay, seed/team-photo`,

  documentation: `
## GENERATOR: PRODUCT DOCUMENTATION SITE
You are building technical documentation. FINDABILITY and CLARITY are critical.

LAYOUT:
- Left sidebar (260px, collapsible): nested navigation with expandable sections, search at top
- Top bar: product name, version badge, "GitHub" link, dark mode toggle
- Main content area (max 768px, centered): the documentation

SECTIONS:
1. Getting Started — Install command (code block with copy button), quick example, "Next Steps" links
2. Configuration — Options table: option name, type, default, description. Code example
3. API Reference — For each method/endpoint:
   - Method badge (green GET, blue POST, yellow PUT, red DELETE)
   - Path with parameters highlighted
   - Description
   - Parameters table
   - Request/response JSON examples in dark code blocks
   - Copy button on all code blocks
4. Guides — Step-by-step tutorial with numbered steps, code snippets, expected output
5. Troubleshooting — Collapsible FAQ items, common errors with solutions
6. Changelog — Version entries with date, change type badges (Added, Changed, Fixed, Removed)

STYLE:
- Stripe Docs / Next.js Docs inspired
- Sidebar: #f8fafc background, hover highlight, active item with left blue border
- Code blocks: #1e293b background, syntax highlighting colors, copy button top-right
- Tables: clean borders, monospace for code values
- Heading anchors on hover (link icon)

IMAGE SEEDS: seed/api-docs, seed/code-editor`,

  "case-study": `
## GENERATOR: CASE STUDY / WHITEPAPER
You are building a long-form case study page. CREDIBILITY and STORYTELLING matter.

SECTIONS:
1. Hero — Client logo, case study title, industry badge, "Download PDF" button
2. Key metrics — 3-4 large stat cards: "47% increase in revenue", "3x faster delivery"
3. Challenge — Client background, pain points (bulleted), previous solution limitations
4. Solution — How your product addressed each pain point, architecture/approach diagram placeholder
5. Implementation — Timeline with phases: Discovery → Design → Build → Launch. Duration for each
6. Results — Before/after comparison table, SVG charts showing improvement trends
7. Testimonial — Large pull quote from client stakeholder with photo, name, title, company
8. Tech stack — Used technologies as logo badges
9. CTA — "Get Similar Results" form with name, email, company, "Request Demo" button

STYLE:
- Editorial, professional — magazine article feel
- Max-width: 900px, centered
- Large typography for metrics (48px+, bold)
- Pull quotes: large italic text, left border accent
- Stats: animated counter effect on scroll
- Charts: blue/green palette, clear labels

IMAGE SEEDS: seed/business-growth, seed/team-meeting, seed/data-chart`,

  podcast: `
## GENERATOR: PODCAST WEBSITE
You are building a podcast website. LISTENING EXPERIENCE and DISCOVERABILITY are key.

SECTIONS:
1. Hero — Show artwork (large, 300px+), podcast name, tagline, listen-on badges (Apple, Spotify, Google), play latest episode button
2. Latest episode — Full-width player: episode artwork, title, play/pause button, progress bar, time stamps, playback speed, volume, download
3. Episode grid — .grid-2 cards: episode number, artwork thumbnail, title, date, duration badge, play button overlay, brief description
4. Guest spotlight — Featured guest: photo, name, bio, social links, their episode card
5. About — Host photo, host bio, show description, what listeners will learn
6. Subscribe — All platform links with icons: Apple Podcasts, Spotify, YouTube, RSS feed
7. Newsletter — "Get episode summaries in your inbox" email signup
8. Reviews — Listener reviews from Apple Podcasts with star ratings

PLAYER REQUIREMENTS:
- Play/pause button (large, circular, brand-colored)
- Seek bar: clickable progress bar with current time / total time
- Playback speed: 0.5x, 1x, 1.5x, 2x toggle
- Episode title and artwork visible during playback

STYLE:
- Dark theme (#0f172a) — podcast/audio vibe
- Bold accent color for play buttons and active states
- Rounded corners on all cards (16px)
- Album artwork with subtle shadow
- Waveform SVG decoration in hero

IMAGE SEEDS: seed/podcast-microphone, seed/recording-studio, seed/headphones`,

  nonprofit: `
## GENERATOR: NONPROFIT & CHARITY WEBSITE
You are building a nonprofit website. EMOTIONAL CONNECTION and TRUST are critical for donations.

SECTIONS:
1. Hero — Impactful full-width image, emotional headline, impact statistic ("15,000 lives changed"), "Donate Now" CTA (prominent, warm color)
2. Mission — Mission statement, 3 core values with icons, brief org history
3. Impact stats — 4 animated counters: lives impacted, funds raised, volunteers, projects completed
4. Programs — .grid-3 cards: program image, name, description, people served, "Learn More"
5. Stories — 2-3 beneficiary stories: photo, name, quote, their journey
6. Donation section — Suggested amounts ($25, $50, $100, $250), custom amount input, monthly/one-time toggle, "Donate" button with trust badges (SSL, tax-deductible)
7. Volunteer — Sign up form: name, email, interests checkboxes, availability
8. Events — Upcoming fundraiser cards with date, location, "Register" button
9. Partners/Sponsors — Logo grid of supporting organizations
10. Footer — Charity registration number, address, social links

STYLE:
- Warm, hopeful — earthy tones (warm amber, forest green) OR clean blue/white
- Authentic photography (not stock-looking)
- Donation section must be prominent and trustworthy
- Progress bars for fundraising goals
- Impact numbers should be large and bold

IMAGE SEEDS: seed/community-service, seed/helping-hands, seed/children-education, seed/volunteer-team`,

  fitness: `
## GENERATOR: FITNESS & WELLNESS WEBSITE
You are building a fitness studio website. ENERGY and MOTIVATION drive sign-ups.

SECTIONS:
1. Hero — Dynamic action shot, bold headline ("Transform Your Body"), class schedule preview strip, "Start Free Trial" CTA
2. Classes — .grid-3 cards: class type (Yoga, HIIT, Strength, Cycling, Boxing, Pilates), difficulty badge (Beginner/Intermediate/Advanced), duration, calories burned, schedule, instructor name
3. Schedule — Weekly timetable: days as columns, time slots as rows, color-coded by class type
4. Trainers — Cards: trainer photo, name, specialty, certifications, years experience, "Book Session" button
5. Membership — 3 tiers: Basic ($29/mo), Premium ($59/mo), Elite ($99/mo) with features comparison, "Most Popular" badge on middle tier
6. Transformations — Before/after image pairs with name, timeline, testimonial quote
7. Amenities — Icons + labels: locker rooms, sauna, juice bar, parking, towel service
8. Trial CTA — Large section: "Your First Class Is Free" with booking form (name, email, preferred class, date)
9. Location — Map, hours, contact info

STYLE:
- High-energy, dark background with vibrant accent (electric blue, neon green, or hot orange)
- Bold, uppercase headings
- Dynamic diagonal lines or geometric shapes as design elements
- Trainer photos: high contrast, dramatic lighting
- CTAs: large, bold, impossible to miss

IMAGE SEEDS: seed/gym-interior, seed/fitness-class, seed/yoga-studio, seed/personal-training`,

  wedding: `
## GENERATOR: WEDDING & EVENTS WEBSITE
You are building a wedding website. ELEGANCE and PERSONAL TOUCH are everything.

SECTIONS:
1. Hero — Full-viewport romantic photo, couple's names in elegant script font, wedding date, "RSVP" button
2. Countdown — Days, hours, minutes to wedding date (JS animated)
3. Our Story — Timeline of relationship milestones: how we met, first date, engagement, with dates and sweet details
4. Wedding Party — Bridesmaids and groomsmen cards: photo (circular), name, role, fun fact
5. Details — Ceremony info (time, venue, address), Reception info (time, venue, address), dress code note
6. RSVP Form — Name, email, attending (yes/no), number of guests, meal choice (chicken/fish/vegetarian), dietary restrictions, song request
7. Registry — Links to registry sites with store logos (Amazon, Crate & Barrel, Zola)
8. Gallery — Photo grid of engagement photos with lightbox
9. Travel — Hotel blocks with rates and booking links, airport info, local transportation
10. FAQ — Common questions: parking, kids, plus-ones, gifts

STYLE:
- Romantic and elegant — sage green, dusty rose, cream, gold accents
- Script/serif font pairing (Playfair Display + Lora or similar)
- Watercolor floral decorative elements (CSS gradients/patterns to simulate)
- Lots of whitespace, airy feeling
- Subtle animations (fade-in on scroll)
- Mobile-first (guests will check on phones)

IMAGE SEEDS: seed/wedding-couple, seed/flower-arrangement, seed/wedding-venue, seed/engagement-ring`,

  report: `
## GENERATOR: PROFESSIONAL BUSINESS REPORT
You are creating a printable business report as a web page. This is a DOCUMENT, not a website.

SECTIONS:
1. Cover page — Report title, subtitle, date, company name, confidentiality notice
2. Table of contents — Linked section headings with page-like numbers
3. Executive summary — 3-4 paragraph overview of key findings and recommendations
4. Data sections — Each section includes:
   - Section heading with number (1.0, 1.1, 2.0, etc.)
   - Body text with findings
   - SVG charts (bar, line, pie) with labeled axes and legends
   - Data tables with clear headers and number formatting
   - Callout boxes for key statistics
5. Key findings — Numbered list with importance indicators
6. Recommendations — Action items with priority levels and estimated impact
7. Appendix — Methodology notes, data sources, glossary

STYLE:
- Professional, printable — think McKinsey or Deloitte report
- Max-width: 800px, centered, generous margins
- Serif font for body (Georgia), sans-serif for headings
- Muted color palette: navy, dark gray, one accent
- Charts use consistent color coding
- Tables: clean lines, right-aligned numbers, alternating row shading
- Page-break-before on major sections (for print)
- @media print styles included`,
};

/**
 * Get generator-specific system prompt supplement.
 * Returns empty string if no supplement exists for the generator type.
 */
export function getGeneratorSystemSupplement(generatorId: string): string {
  return GENERATOR_SYSTEM_SUPPLEMENTS[generatorId] || "";
}
