/**
 * Business Starter Kits — One-click business setup
 *
 * User picks their business type → gets website, booking, invoicing,
 * email marketing, and social media all configured and ready to go.
 */

export interface KitService {
  name: string;
  type: "website" | "booking" | "invoicing" | "email-marketing" | "store" | "blog" | "brand-kit" | "content-calendar" | "social";
  description: string;
  autoConfig: Record<string, unknown>;
}

export interface BusinessKit {
  id: string;
  name: string;
  description: string;
  icon: string;
  tagline: string;
  services: KitService[];
  websitePrompt: string;
  brandDefaults: {
    font1: string;
    font2: string;
    colors: { primary: string; bg: string; accent: string };
    tone: string;
  };
}

export const BUSINESS_KITS: BusinessKit[] = [
  {
    id: "photographer",
    name: "Photographer",
    description: "Portfolio, booking, and invoicing for photographers",
    icon: "Camera",
    tagline: "Showcase your work. Book clients. Get paid.",
    services: [
      { name: "Portfolio Website", type: "website", description: "Stunning gallery-style portfolio with project categories", autoConfig: { style: "minimal", sections: ["hero", "gallery", "about", "contact"] } },
      { name: "Session Booking", type: "booking", description: "Mini sessions, weddings, and event bookings with deposit collection", autoConfig: { sessionTypes: ["Mini Session", "Portrait", "Wedding", "Event"], duration: [30, 60, 120, 480] } },
      { name: "Invoice Templates", type: "invoicing", description: "Pre-built invoices for wedding packages, prints, and licensing", autoConfig: { templates: ["Wedding Package", "Portrait Session", "Print Order", "Digital License"] } },
      { name: "Brand Kit", type: "brand-kit", description: "Moody or clean aesthetic with signature fonts", autoConfig: { style: "moody" } },
      { name: "Social Templates", type: "content-calendar", description: "Instagram-ready post templates for portfolio pieces", autoConfig: { platforms: ["instagram", "tiktok"], postTypes: ["portfolio", "behind-the-scenes", "testimonial"] } },
    ],
    websitePrompt: "A stunning photography portfolio website with a full-bleed hero image, masonry gallery grid showing different categories (weddings, portraits, events, landscapes), an about section with photographer bio, pricing packages, and a contact/booking form. Clean, minimal design that lets the images speak.",
    brandDefaults: { font1: "Playfair Display", font2: "Inter", colors: { primary: "#0f2148", bg: "#ffffff", accent: "#b8860b" }, tone: "elegant" },
  },
  {
    id: "restaurant",
    name: "Restaurant Owner",
    description: "Menu site, reservations, and marketing for restaurants",
    icon: "UtensilsCrossed",
    tagline: "Serve your menu online. Fill every table.",
    services: [
      { name: "Menu Website", type: "website", description: "Beautiful menu display with categories, prices, and food photography", autoConfig: { sections: ["hero", "menu", "about", "gallery", "reservations", "location"] } },
      { name: "Reservation System", type: "booking", description: "Table reservations with party size, time slots, and special requests", autoConfig: { sessionTypes: ["Dinner", "Lunch", "Brunch", "Private Event"], maxPartySize: 20 } },
      { name: "Email Marketing", type: "email-marketing", description: "Weekly specials, seasonal menus, and event announcements", autoConfig: { templates: ["Weekly Special", "New Menu", "Holiday Event", "Private Dining"] } },
      { name: "Review Responses", type: "social", description: "AI-drafted responses to Google and Yelp reviews", autoConfig: { platforms: ["google", "yelp"] } },
      { name: "Social Posts", type: "content-calendar", description: "Food photography posts, behind-the-kitchen content", autoConfig: { platforms: ["instagram", "facebook", "tiktok"], postTypes: ["dish-feature", "behind-scenes", "special-event"] } },
    ],
    websitePrompt: "A warm, inviting restaurant website with a hero showing the restaurant ambiance, a full menu section organized by category (appetizers, mains, desserts, drinks) with prices, an about section with the chef's story, a photo gallery of dishes and the space, online reservation form, and location map with hours. Warm colors, elegant typography.",
    brandDefaults: { font1: "Playfair Display", font2: "Lato", colors: { primary: "#c4611a", bg: "#fffaf5", accent: "#2d1810" }, tone: "warm" },
  },
  {
    id: "developer",
    name: "Freelance Developer",
    description: "Portfolio, invoicing, and blog for developers",
    icon: "Code",
    tagline: "Ship your portfolio. Land more clients.",
    services: [
      { name: "Developer Portfolio", type: "website", description: "Clean portfolio with project showcases, tech stack, and GitHub integration", autoConfig: { sections: ["hero", "projects", "skills", "experience", "blog", "contact"] } },
      { name: "Invoice System", type: "invoicing", description: "Project-based invoices with hourly and fixed-rate templates", autoConfig: { templates: ["Hourly Project", "Fixed Price", "Retainer", "Maintenance"] } },
      { name: "Proposal Templates", type: "invoicing", description: "Project proposals with scope, timeline, and pricing", autoConfig: { templates: ["Web App", "Mobile App", "API Development", "Consulting"] } },
      { name: "Tech Blog", type: "blog", description: "SEO-optimized technical blog for thought leadership", autoConfig: { categories: ["tutorials", "case-studies", "tools", "opinions"] } },
      { name: "Content Calendar", type: "content-calendar", description: "Twitter/LinkedIn technical content schedule", autoConfig: { platforms: ["twitter", "linkedin"], postTypes: ["tutorial", "tip", "case-study", "open-source"] } },
    ],
    websitePrompt: "A modern developer portfolio with a minimal hero showing name, role, and a brief tagline. Project grid with cards showing screenshots, tech stack badges, and links. Skills section with technology icons organized by category. Work experience timeline. Blog section with latest posts. Contact form with availability status. Dark or light theme, clean typography.",
    brandDefaults: { font1: "Inter", font2: "Inter", colors: { primary: "#2563eb", bg: "#ffffff", accent: "#7c3aed" }, tone: "professional" },
  },
  {
    id: "fitness",
    name: "Fitness Trainer",
    description: "Class schedule, booking, and content for trainers",
    icon: "Dumbbell",
    tagline: "Fill your classes. Grow your brand.",
    services: [
      { name: "Fitness Website", type: "website", description: "High-energy site with class schedule, trainer bio, and testimonials", autoConfig: { sections: ["hero", "classes", "schedule", "about", "transformations", "pricing", "contact"] } },
      { name: "Class Booking", type: "booking", description: "Book group classes, 1:1 sessions, and consultations", autoConfig: { sessionTypes: ["Group Class", "1:1 Training", "Nutrition Consult", "Online Coaching"], duration: [45, 60, 30, 60] } },
      { name: "Email Marketing", type: "email-marketing", description: "Workout tips, nutrition advice, and class promotions", autoConfig: { templates: ["Weekly Workout", "Nutrition Tips", "New Class Launch", "Challenge Invite"] } },
      { name: "Digital Products", type: "store", description: "Sell workout plans, meal guides, and training programs", autoConfig: { productTypes: ["Workout Plan", "Meal Guide", "8-Week Program", "Video Series"] } },
      { name: "Social Content", type: "content-calendar", description: "Workout clips, transformation posts, motivational content", autoConfig: { platforms: ["instagram", "tiktok", "youtube"], postTypes: ["workout-demo", "transformation", "nutrition-tip", "motivation"] } },
    ],
    websitePrompt: "A high-energy fitness trainer website with a bold hero showing the trainer in action, class schedule grid with types and times, trainer bio with certifications and philosophy, before/after transformations gallery, pricing for different training packages, and a booking/contact form. Bold colors, strong typography, energetic feel.",
    brandDefaults: { font1: "Inter", font2: "Inter", colors: { primary: "#dc2626", bg: "#ffffff", accent: "#f59e0b" }, tone: "energetic" },
  },
  {
    id: "real-estate",
    name: "Real Estate Agent",
    description: "Listings, booking, and marketing for agents",
    icon: "Home",
    tagline: "Showcase properties. Close more deals.",
    services: [
      { name: "Listings Website", type: "website", description: "Property listings with photos, details, and virtual tour links", autoConfig: { sections: ["hero", "featured-listings", "search", "about", "testimonials", "market-report", "contact"] } },
      { name: "Viewing Scheduler", type: "booking", description: "Schedule property viewings and open houses", autoConfig: { sessionTypes: ["Property Viewing", "Open House", "Buyer Consultation", "Listing Appointment"], duration: [30, 120, 45, 60] } },
      { name: "Email Campaigns", type: "email-marketing", description: "New listing alerts, market updates, and neighborhood guides", autoConfig: { templates: ["New Listing", "Market Report", "Neighborhood Guide", "Just Sold"] } },
      { name: "Brand Kit", type: "brand-kit", description: "Professional branding with headshot and market positioning", autoConfig: { style: "professional" } },
      { name: "Social Posts", type: "content-calendar", description: "Property showcases, market tips, and sold announcements", autoConfig: { platforms: ["instagram", "facebook", "linkedin"], postTypes: ["new-listing", "just-sold", "market-tip", "neighborhood-spotlight"] } },
    ],
    websitePrompt: "A professional real estate agent website with a hero showing the agent's photo and headline stats (homes sold, years experience), featured property listings grid with photos, price, beds/baths/sqft, property search/filter section, about the agent with credentials and approach, client testimonials, local market report section, and contact form. Clean, trustworthy design.",
    brandDefaults: { font1: "Inter", font2: "Inter", colors: { primary: "#1e3a5f", bg: "#ffffff", accent: "#b8860b" }, tone: "trustworthy" },
  },
  {
    id: "wedding-planner",
    name: "Wedding Planner",
    description: "Portfolio, booking, and proposals for planners",
    icon: "Heart",
    tagline: "Showcase your weddings. Book your calendar.",
    services: [
      { name: "Portfolio Website", type: "website", description: "Elegant portfolio with wedding galleries, packages, and love stories", autoConfig: { sections: ["hero", "portfolio", "services", "packages", "about", "testimonials", "contact"] } },
      { name: "Consultation Booking", type: "booking", description: "Book discovery calls and venue walkthroughs", autoConfig: { sessionTypes: ["Discovery Call", "Venue Walkthrough", "Design Meeting", "Day-Of Coordination"], duration: [30, 90, 60, 480] } },
      { name: "Proposal System", type: "invoicing", description: "Wedding proposals with package breakdowns and payment schedules", autoConfig: { templates: ["Full Planning", "Partial Planning", "Day-Of Coordination", "Destination Wedding"] } },
      { name: "Brand Kit", type: "brand-kit", description: "Elegant branding with romantic typography and soft palette", autoConfig: { style: "elegant" } },
      { name: "Content Calendar", type: "content-calendar", description: "Wedding tips, vendor spotlights, and real wedding features", autoConfig: { platforms: ["instagram", "pinterest", "tiktok"], postTypes: ["real-wedding", "planning-tip", "vendor-spotlight", "behind-scenes"] } },
    ],
    websitePrompt: "An elegant wedding planner website with a romantic hero image, portfolio gallery of past weddings organized by style, services offered with detailed descriptions, pricing packages with what's included, about the planner with philosophy and approach, client testimonials with wedding photos, and an inquiry form. Soft, elegant design with refined typography.",
    brandDefaults: { font1: "Playfair Display", font2: "Lato", colors: { primary: "#8b7355", bg: "#fffdf8", accent: "#d4a373" }, tone: "romantic" },
  },
  {
    id: "ecommerce",
    name: "E-commerce Seller",
    description: "Online store, marketing, and content for sellers",
    icon: "ShoppingBag",
    tagline: "Open your store. Start selling today.",
    services: [
      { name: "Online Store", type: "website", description: "Product catalog with cart, checkout, and order tracking", autoConfig: { sections: ["hero", "featured-products", "categories", "bestsellers", "reviews", "newsletter", "footer"] } },
      { name: "Email Marketing", type: "email-marketing", description: "Welcome series, abandoned cart, and promotional campaigns", autoConfig: { templates: ["Welcome Series", "Abandoned Cart", "Flash Sale", "New Arrival", "Review Request"] } },
      { name: "Product Posts", type: "content-calendar", description: "Product showcases, unboxings, and customer photos", autoConfig: { platforms: ["instagram", "tiktok", "facebook", "pinterest"], postTypes: ["product-showcase", "customer-photo", "unboxing", "sale-announcement"] } },
      { name: "Blog Engine", type: "blog", description: "Product guides, styling tips, and brand stories", autoConfig: { categories: ["guides", "styling", "brand-story", "behind-scenes"] } },
      { name: "Brand Kit", type: "brand-kit", description: "Consistent visual identity across store and social", autoConfig: { style: "modern" } },
    ],
    websitePrompt: "A modern e-commerce store with a bold hero featuring a featured product or collection, product grid with images, prices, add-to-cart buttons, category navigation, bestsellers section, customer reviews with star ratings, newsletter signup for exclusive deals, and a clean footer with shipping/returns info. Clean, conversion-optimized design.",
    brandDefaults: { font1: "Inter", font2: "Inter", colors: { primary: "#111827", bg: "#ffffff", accent: "#7c3aed" }, tone: "modern" },
  },
  {
    id: "consultant",
    name: "Consultant / Coach",
    description: "Professional site, booking, and proposals for consultants",
    icon: "Briefcase",
    tagline: "Establish authority. Book discovery calls.",
    services: [
      { name: "Professional Website", type: "website", description: "Authority-building site with services, case studies, and thought leadership", autoConfig: { sections: ["hero", "services", "methodology", "case-studies", "testimonials", "about", "booking"] } },
      { name: "Discovery Calls", type: "booking", description: "Book strategy sessions, coaching calls, and workshops", autoConfig: { sessionTypes: ["Discovery Call", "Strategy Session", "Coaching Call", "Workshop"], duration: [30, 60, 60, 180] } },
      { name: "Proposals & Invoicing", type: "invoicing", description: "Professional proposals with scope and pricing tiers", autoConfig: { templates: ["Consulting Engagement", "Workshop Facilitation", "Executive Coaching", "Advisory Retainer"] } },
      { name: "Email Nurture", type: "email-marketing", description: "Thought leadership email course and newsletter", autoConfig: { templates: ["5-Day Email Course", "Weekly Insights", "Case Study", "Workshop Invite"] } },
      { name: "LinkedIn Content", type: "content-calendar", description: "Professional posts establishing expertise", autoConfig: { platforms: ["linkedin", "twitter"], postTypes: ["insight", "case-study", "framework", "book-recommendation"] } },
    ],
    websitePrompt: "A professional consultant/coach website with a confident hero showing the consultant and their expertise area, services overview with engagement types and pricing, methodology section explaining the approach, case studies with measurable results, client testimonials from executives, about section with credentials and philosophy, and a booking form for discovery calls. Clean, authoritative design.",
    brandDefaults: { font1: "Inter", font2: "Inter", colors: { primary: "#1e3a5f", bg: "#ffffff", accent: "#0d9488" }, tone: "authoritative" },
  },
  {
    id: "nonprofit",
    name: "Nonprofit / Charity",
    description: "Cause website, fundraising, and donor management",
    icon: "HandHeart",
    tagline: "Tell your story. Rally your supporters.",
    services: [
      { name: "Cause Website", type: "website", description: "Mission-driven site with impact stories, donation CTA, and volunteer signup", autoConfig: { sections: ["hero", "mission", "impact", "programs", "stories", "donate", "volunteer", "contact"] } },
      { name: "Donor Emails", type: "email-marketing", description: "Impact updates, fundraising campaigns, and gratitude emails", autoConfig: { templates: ["Monthly Impact Update", "Year-End Campaign", "Thank You", "Volunteer Spotlight"] } },
      { name: "Merch Store", type: "store", description: "Branded merchandise to support the cause", autoConfig: { productTypes: ["T-Shirt", "Tote Bag", "Sticker Pack", "Wristband"] } },
      { name: "Social Campaigns", type: "content-calendar", description: "Impact stories, volunteer spotlights, and awareness campaigns", autoConfig: { platforms: ["instagram", "facebook", "twitter", "linkedin"], postTypes: ["impact-story", "volunteer-spotlight", "awareness", "fundraising"] } },
      { name: "Blog / Stories", type: "blog", description: "Impact stories, field reports, and community updates", autoConfig: { categories: ["impact-stories", "field-reports", "community", "announcements"] } },
    ],
    websitePrompt: "A heartfelt nonprofit website with an emotional hero showing the cause in action, mission statement section, impact metrics with animated counters, programs overview, beneficiary stories with photos, prominent donate button and form, volunteer signup section, and contact info. Warm, trustworthy design that inspires action.",
    brandDefaults: { font1: "Inter", font2: "Inter", colors: { primary: "#0d9488", bg: "#f8fffe", accent: "#f59e0b" }, tone: "compassionate" },
  },
  {
    id: "agency",
    name: "Agency Owner",
    description: "Portfolio, client portal, and operations for agencies",
    icon: "Building2",
    tagline: "Win clients. Deliver results. Scale up.",
    services: [
      { name: "Agency Portfolio", type: "website", description: "Case studies, services, and team showcase", autoConfig: { sections: ["hero", "services", "case-studies", "process", "team", "clients", "contact"] } },
      { name: "Client Portal", type: "invoicing", description: "Project status, deliverable approvals, and file sharing", autoConfig: { templates: ["Monthly Retainer", "Project Milestone", "Rush Fee", "Scope Change"] } },
      { name: "Invoice System", type: "invoicing", description: "Retainer invoices, project billing, and expense tracking", autoConfig: { templates: ["Monthly Retainer", "Project Invoice", "Milestone Payment", "Expense Report"] } },
      { name: "Email Marketing", type: "email-marketing", description: "Case study emails, industry insights, and lead nurture", autoConfig: { templates: ["Case Study", "Industry Report", "Service Launch", "Client Win"] } },
      { name: "Blog & Thought Leadership", type: "blog", description: "Agency insights, case studies, and industry analysis", autoConfig: { categories: ["case-studies", "industry-insights", "process", "culture"] } },
      { name: "Brand Kit", type: "brand-kit", description: "Agency visual identity across all touchpoints", autoConfig: { style: "bold" } },
    ],
    websitePrompt: "A bold digital agency website with a striking hero headline and showreel/case study preview, services grid with detailed descriptions, case studies with before/after metrics, process section showing the agency methodology, team grid with photos and roles, client logo strip, and a contact form for new business inquiries. Bold, confident design that commands attention.",
    brandDefaults: { font1: "Inter", font2: "Inter", colors: { primary: "#7c3aed", bg: "#ffffff", accent: "#ec4899" }, tone: "bold" },
  },
];

export function getBusinessKit(id: string): BusinessKit | undefined {
  return BUSINESS_KITS.find((kit) => kit.id === id);
}

export function getKitsByCategory(): Record<string, BusinessKit[]> {
  return {
    "Creative & Media": BUSINESS_KITS.filter((k) => ["photographer", "wedding-planner"].includes(k.id)),
    "Professional Services": BUSINESS_KITS.filter((k) => ["developer", "consultant", "agency"].includes(k.id)),
    "Local Business": BUSINESS_KITS.filter((k) => ["restaurant", "fitness", "real-estate"].includes(k.id)),
    "Online Business": BUSINESS_KITS.filter((k) => ["ecommerce", "nonprofit"].includes(k.id)),
  };
}
