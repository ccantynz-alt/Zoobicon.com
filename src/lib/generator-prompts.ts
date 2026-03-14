/**
 * Generator prompt definitions — maps generator type IDs to starter prompts
 * and display names for the builder's generator routing system.
 *
 * Generator IDs match the last segment of each generator's endpoint path
 * from src/app/generators/page.tsx (e.g., /api/generate/landing → "landing").
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
      "Create an elegant restaurant website for [restaurant name]. Include a hero with ambiance photo, interactive menu organized by categories with prices, photo gallery, online reservation form with date/time picker, hours and location, and customer reviews.",
  },
  realestate: {
    name: "Real Estate",
    prompt:
      "Create a real estate listing website for [describe your market]. Include property search with filters (price, beds, location), property cards with photos and key details, mortgage calculator, agent profiles, and a contact/inquiry form.",
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
