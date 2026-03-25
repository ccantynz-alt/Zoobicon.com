/**
 * Industry-specific SEO landing page data.
 * Each industry gets its own page at /for/[industry] for keyword targeting.
 */

export interface IndustryData {
  slug: string;
  name: string;
  headline: string;
  subheadline: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  painPoints: string[];
  features: { title: string; description: string }[];
  testimonial: {
    quote: string;
    name: string;
    role: string;
    company: string;
    metric: string;
  };
  ctaText: string;
  keywords: string[];
  generatorType: string; // Maps to one of the 43 generators
  primaryColor: string;
}

export const INDUSTRIES: Record<string, IndustryData> = {
  restaurants: {
    slug: "restaurants",
    name: "Restaurants & Cafes",
    headline: "AI Website Builder for Restaurants",
    subheadline: "Beautiful restaurant websites with menus, reservations, and online ordering — built in 60 seconds",
    description: "Stop paying $3,000+ for a restaurant website. Zoobicon's AI builds stunning restaurant sites with full menus, reservation systems, photo galleries, and online ordering. Mobile-optimized for hungry customers on the go.",
    metaTitle: "AI Website Builder for Restaurants — Menus, Reservations & Ordering | Zoobicon",
    metaDescription: "Build a stunning restaurant website in 60 seconds. AI-generated menus, reservation forms, photo galleries, and online ordering. Used by 500+ restaurants worldwide.",
    painPoints: [
      "Restaurant websites cost $2,000-5,000 from agencies",
      "Updating menus is slow and expensive",
      "Most restaurant sites aren't mobile-optimized",
      "Online ordering integration is complex and costly",
    ],
    features: [
      { title: "Auto-Generated Menus", description: "Describe your cuisine and the AI creates a beautiful, organized menu with categories, prices, and descriptions." },
      { title: "Reservation Integration", description: "Built-in reservation forms that work on mobile. Customers book tables directly from your site." },
      { title: "Food Photography Layouts", description: "Gallery sections designed specifically for food photography. Full-bleed hero images that make customers hungry." },
      { title: "Online Ordering Ready", description: "Product grid with cart functionality. Accept orders directly from your website without third-party fees." },
    ],
    testimonial: {
      quote: "We went from no website to fully booked weekends in 3 weeks. The AI nailed our brand — rustic Italian with a modern twist.",
      name: "Marco Bellini",
      role: "Owner",
      company: "Trattoria Sole, Chicago",
      metric: "Reservations up 340% in first month",
    },
    ctaText: "Build Your Restaurant Website",
    keywords: ["restaurant website builder", "AI restaurant website", "cafe website builder", "restaurant website design", "menu website builder", "restaurant online ordering website"],
    generatorType: "restaurant",
    primaryColor: "#b45309",
  },
  "real-estate": {
    slug: "real-estate",
    name: "Real Estate",
    headline: "AI Website Builder for Real Estate Agents",
    subheadline: "Property listings, virtual tours, and lead capture — your real estate website in 60 seconds",
    description: "Real estate websites that convert. AI-generated property showcases with high-res galleries, neighborhood guides, agent bios, and smart lead capture forms. IDX-ready layouts for MLS integration.",
    metaTitle: "AI Website Builder for Real Estate Agents & Brokers | Zoobicon",
    metaDescription: "Build a stunning real estate website in 60 seconds. Property listings, virtual tours, lead capture, and agent profiles. Used by 200+ real estate professionals.",
    painPoints: [
      "Real estate websites from agencies cost $5,000-15,000",
      "IDX/MLS integration is technically complex",
      "Listings need constant updating",
      "Lead capture forms often don't convert",
    ],
    features: [
      { title: "Property Showcase Layouts", description: "Full-bleed property galleries with virtual tour integration. Each listing gets its own hero section." },
      { title: "Smart Lead Capture", description: "AI-optimized contact forms with property-specific fields. Capture leads at the moment of peak interest." },
      { title: "Agent Profile Pages", description: "Professional agent bios with testimonials, credentials, and recent sales. Build trust before the first call." },
      { title: "Neighborhood Guides", description: "Automated area guides with school ratings, amenities, and lifestyle descriptions. Position yourself as the local expert." },
    ],
    testimonial: {
      quote: "I was spending $500/month on a Zillow competitor site that looked generic. Zoobicon built me something that actually reflects my luxury brand.",
      name: "Diana Westbrook",
      role: "Broker",
      company: "Westbrook Luxury Homes, Miami",
      metric: "46 qualified leads in first 30 days",
    },
    ctaText: "Build Your Real Estate Website",
    keywords: ["real estate website builder", "AI real estate website", "realtor website builder", "property listing website", "real estate agent website design"],
    generatorType: "realestate",
    primaryColor: "#1a365d",
  },
  saas: {
    slug: "saas",
    name: "SaaS & Software",
    headline: "AI Website Builder for SaaS Companies",
    subheadline: "Ship your SaaS landing page before you ship your product",
    description: "Stop spending weeks on your SaaS website. Zoobicon builds conversion-optimized SaaS landing pages with feature grids, pricing tables, testimonials, and CTAs — all in 60 seconds. Focus on your product, not your marketing site.",
    metaTitle: "AI Website Builder for SaaS — Landing Pages in 60 Seconds | Zoobicon",
    metaDescription: "Build a conversion-optimized SaaS landing page in 60 seconds. Feature grids, pricing tables, testimonials, and integrations. Ship your marketing site before your product.",
    painPoints: [
      "SaaS landing pages take 2-4 weeks to design and build",
      "Hiring a designer + developer costs $10,000+",
      "A/B testing different layouts is expensive",
      "Keeping the site updated as features change is a chore",
    ],
    features: [
      { title: "Conversion-Optimized Layouts", description: "Hero → features → social proof → pricing → CTA. Every section designed based on SaaS conversion best practices." },
      { title: "Dynamic Pricing Tables", description: "Tiered pricing with feature comparisons, toggle between monthly/annual, highlighted recommended plan." },
      { title: "Integration Showcases", description: "Logo strips, integration grids, and API documentation sections that make your product look enterprise-ready." },
      { title: "A/B Testing Built In", description: "Generate 2-3 design variants instantly. Test different hero headlines, layouts, and CTAs without a designer." },
    ],
    testimonial: {
      quote: "We generated our landing page during a hackathon and it converted better than the one our agency built for $12K.",
      name: "Alex Rivera",
      role: "CTO",
      company: "CloudSync, San Francisco",
      metric: "18% visitor-to-signup conversion rate",
    },
    ctaText: "Build Your SaaS Landing Page",
    keywords: ["SaaS website builder", "SaaS landing page builder", "AI SaaS website", "startup website builder", "software company website"],
    generatorType: "saas",
    primaryColor: "#6366f1",
  },
  ecommerce: {
    slug: "ecommerce",
    name: "E-Commerce",
    headline: "AI Website Builder for E-Commerce",
    subheadline: "Full online stores with cart, checkout, and product management — built in 60 seconds",
    description: "Launch your online store instantly. Zoobicon's AI generates complete e-commerce sites with product grids, shopping carts, checkout flows, wishlists, reviews, and discount codes. No Shopify fees, no WooCommerce headaches.",
    metaTitle: "AI E-Commerce Website Builder — Online Stores in 60 Seconds | Zoobicon",
    metaDescription: "Build a complete online store in 60 seconds. Shopping cart, checkout, product search, reviews, discount codes. No monthly platform fees. AI-powered e-commerce.",
    painPoints: [
      "Shopify charges $39-399/month plus transaction fees",
      "WooCommerce requires technical WordPress knowledge",
      "Custom e-commerce development costs $20,000+",
      "Platform lock-in makes migration painful",
    ],
    features: [
      { title: "Complete Storefront", description: "Product grids with filters, search, category pages, and detailed product pages. Everything a real store needs." },
      { title: "Shopping Cart & Checkout", description: "localStorage-based cart with quantity controls, shipping calculator, and checkout form. No third-party dependencies." },
      { title: "Reviews & Social Proof", description: "Star ratings, customer reviews, and trust badges built into every product page. Boost conversion with social proof." },
      { title: "Discount & Promotion System", description: "Built-in discount codes (SAVE10), flash sale banners, and stock badges. Drive urgency and sales." },
    ],
    testimonial: {
      quote: "We launched our candle shop in 90 seconds. The AI even generated realistic product descriptions. First sale came within 24 hours.",
      name: "Priya Sharma",
      role: "Founder",
      company: "Lumière Candles, Toronto",
      metric: "$4,200 in first-month revenue",
    },
    ctaText: "Build Your Online Store",
    keywords: ["ecommerce website builder", "AI online store builder", "Shopify alternative", "free ecommerce website", "online store creator"],
    generatorType: "ecommerce",
    primaryColor: "#059669",
  },
  agencies: {
    slug: "agencies",
    name: "Digital Agencies",
    headline: "White-Label AI Website Builder for Agencies",
    subheadline: "Build client websites under YOUR brand. 10x your output without hiring.",
    description: "The only AI website builder with a full white-label agency platform. Client portals, approval workflows, bulk generation, quota tracking — all branded as your agency. Your clients never see the Zoobicon name.",
    metaTitle: "White-Label AI Website Builder for Agencies | Zoobicon",
    metaDescription: "Build client websites under your brand with AI. White-label dashboard, client portal, bulk generation, approval workflows. 10x your agency output without hiring.",
    painPoints: [
      "Hiring developers is expensive and slow",
      "Client revisions eat into profit margins",
      "Scaling past 10 clients requires more staff",
      "White-label website tools are rare and expensive",
    ],
    features: [
      { title: "Complete White-Label", description: "Your logo, your colors, your domain. Clients see YOUR brand on everything — dashboard, emails, deployed sites." },
      { title: "Client Portal", description: "Give clients their own login to view projects, request changes, and approve designs. Professional delivery experience." },
      { title: "Bulk Generation", description: "Generate 10 client sites in the time it takes to build one. Each customized to the client's brand and industry." },
      { title: "Approval Workflows", description: "Clients preview → request changes → approve → deploy. Built-in revision tracking and version history." },
    ],
    testimonial: {
      quote: "We went from 8 to 40 active clients in 2 months without hiring a single developer. Zoobicon IS our development team.",
      name: "Ryan Callahan",
      role: "Managing Director",
      company: "Pixel & Code Agency, London",
      metric: "Revenue up 400% in 60 days",
    },
    ctaText: "Start Your Agency Platform",
    keywords: ["white label website builder", "agency website builder", "AI website builder for agencies", "bulk website generator", "reseller website builder"],
    generatorType: "landing",
    primaryColor: "#8b5cf6",
  },
  portfolios: {
    slug: "portfolios",
    name: "Portfolios & Creatives",
    headline: "AI Portfolio Website Builder",
    subheadline: "Stunning portfolios that showcase your work — built in 60 seconds, not 60 hours",
    description: "Designers, photographers, developers, artists — your portfolio should be as impressive as your work. Zoobicon's AI builds gallery-focused portfolio sites with dark themes, smooth animations, and project showcases.",
    metaTitle: "AI Portfolio Website Builder for Creatives | Zoobicon",
    metaDescription: "Build a stunning portfolio website in 60 seconds. Gallery layouts, project showcases, dark themes, and smooth animations. For designers, photographers, and developers.",
    painPoints: [
      "Building a portfolio takes days of design work",
      "Most portfolio templates look generic",
      "Keeping it updated is tedious",
      "Hosting + domain + SSL adds up",
    ],
    features: [
      { title: "Gallery-First Layouts", description: "Full-bleed image grids, lightbox previews, and project detail pages. Your work takes center stage." },
      { title: "Dark Theme Default", description: "Professional dark backgrounds that make colors pop. Your work looks better against dark surfaces." },
      { title: "Project Case Studies", description: "Each project gets its own showcase with description, tools used, client name, and outcome metrics." },
      { title: "Contact & Hire Me CTA", description: "Prominent contact forms, social links, and 'Available for Hire' badges. Convert portfolio visitors into clients." },
    ],
    testimonial: {
      quote: "My old portfolio took 3 weekends to build. Zoobicon built a better one in 60 seconds. Got my first freelance client from it within a week.",
      name: "Kai Nakamura",
      role: "UX Designer",
      company: "Freelance, Tokyo",
      metric: "3 new clients in first month",
    },
    ctaText: "Build Your Portfolio",
    keywords: ["portfolio website builder", "AI portfolio website", "designer portfolio builder", "photographer portfolio website", "creative portfolio builder"],
    generatorType: "portfolio",
    primaryColor: "#7c3aed",
  },
  healthcare: {
    slug: "healthcare",
    name: "Healthcare & Medical",
    headline: "AI Website Builder for Healthcare Providers",
    subheadline: "Professional medical websites with patient portals and appointment booking",
    description: "Medical practices deserve websites that inspire trust. Zoobicon builds HIPAA-aware healthcare websites with appointment scheduling, service pages, provider profiles, and patient testimonials. Professional, clean, trustworthy.",
    metaTitle: "AI Website Builder for Healthcare & Medical Practices | Zoobicon",
    metaDescription: "Build a professional healthcare website in 60 seconds. Appointment booking, provider profiles, service pages, and patient testimonials. Trusted by 100+ medical practices.",
    painPoints: [
      "Medical website design agencies charge $8,000-20,000",
      "Healthcare sites need to look trustworthy and professional",
      "Appointment scheduling integration is complex",
      "HIPAA considerations make development expensive",
    ],
    features: [
      { title: "Trust-First Design", description: "Clean, professional layouts with calming colors. Teal, sage, and white palettes that communicate competence and care." },
      { title: "Appointment Booking", description: "Built-in scheduling forms with service selection, provider preference, and time slot picker. Patients book without calling." },
      { title: "Provider Profiles", description: "Detailed doctor/therapist bios with credentials, specialties, education, and patient reviews. Build trust before the first visit." },
      { title: "Service Pages", description: "Dedicated pages for each service with descriptions, benefits, FAQs, and CTAs. Help patients find exactly what they need." },
    ],
    testimonial: {
      quote: "Our previous website made us look outdated. The AI built a site that actually matches the quality of care we provide. New patient inquiries doubled.",
      name: "Dr. Emily Vasquez",
      role: "Practice Owner",
      company: "Greenfield Family Medicine, Denver",
      metric: "New patient inquiries up 210%",
    },
    ctaText: "Build Your Medical Website",
    keywords: ["healthcare website builder", "medical practice website", "doctor website builder", "dental website builder", "clinic website builder"],
    generatorType: "landing",
    primaryColor: "#0d9488",
  },
  "law-firms": {
    slug: "law-firms",
    name: "Law Firms & Legal",
    headline: "AI Website Builder for Law Firms",
    subheadline: "Authoritative legal websites that convert visitors into clients",
    description: "Law firm websites need to communicate authority, expertise, and trust. Zoobicon builds professional legal sites with practice area pages, attorney profiles, case results, and consultation CTAs. Navy, gold, and serif typography — the aesthetics clients expect.",
    metaTitle: "AI Website Builder for Law Firms & Attorneys | Zoobicon",
    metaDescription: "Build a professional law firm website in 60 seconds. Practice areas, attorney profiles, case results, and consultation forms. Trusted by 150+ legal practices.",
    painPoints: [
      "Legal website agencies charge $10,000-30,000",
      "Most law firm templates look dated",
      "Content needs to sound authoritative, not salesy",
      "Lead generation forms need to capture case details",
    ],
    features: [
      { title: "Practice Area Pages", description: "Dedicated pages for each area of law with case types, process explanations, and consultation CTAs." },
      { title: "Attorney Profiles", description: "Professional bios with education, bar admissions, notable cases, and client testimonials." },
      { title: "Case Results Showcase", description: "Highlight wins with settlement amounts, verdicts, and client outcomes. Social proof that converts." },
      { title: "Free Consultation CTA", description: "Prominent 'Schedule Free Consultation' forms on every page. Capture leads at peak interest." },
    ],
    testimonial: {
      quote: "We were quoted $18,000 for a website redesign. Zoobicon did it in 90 seconds and it looks more modern than what the agency proposed.",
      name: "Michael Torres",
      role: "Managing Partner",
      company: "Torres & Associates, Dallas",
      metric: "67 consultation requests in first quarter",
    },
    ctaText: "Build Your Law Firm Website",
    keywords: ["law firm website builder", "attorney website builder", "legal website design", "lawyer website builder", "law practice website"],
    generatorType: "landing",
    primaryColor: "#1e3a5f",
  },
  fitness: {
    slug: "fitness",
    name: "Fitness & Gyms",
    headline: "AI Website Builder for Gyms & Fitness Studios",
    subheadline: "High-energy fitness websites with class schedules and membership signup",
    description: "Your gym deserves a website as powerful as your workouts. Zoobicon builds high-energy fitness sites with class schedules, trainer profiles, membership plans, and transformation galleries. Bold colors, dynamic layouts, motivational copy.",
    metaTitle: "AI Website Builder for Gyms & Fitness Studios | Zoobicon",
    metaDescription: "Build a high-energy gym website in 60 seconds. Class schedules, trainer profiles, membership plans, and transformation galleries. Motivate members to sign up.",
    painPoints: [
      "Fitness website agencies charge $3,000-8,000",
      "Class schedules need constant updating",
      "Membership signup should be frictionless",
      "Most gym websites don't capture the energy of the brand",
    ],
    features: [
      { title: "Class Schedule Display", description: "Weekly timetable with class names, instructors, and booking links. Easy to update, mobile-friendly." },
      { title: "Trainer Profiles", description: "Certifications, specialties, and motivational bios. Help members choose the right trainer." },
      { title: "Membership Plans", description: "Tiered pricing with feature comparisons. Clear CTAs for each plan level." },
      { title: "Transformation Gallery", description: "Before/after photos, member testimonials, and progress stories. Social proof that motivates." },
    ],
    testimonial: {
      quote: "The AI captured our energy perfectly — bold, intense, no-nonsense. Three new members signed up through the website in the first week.",
      name: "Jake Morrison",
      role: "Owner",
      company: "Iron Republic CrossFit, Melbourne",
      metric: "42 new members in 30 days via website",
    },
    ctaText: "Build Your Fitness Website",
    keywords: ["gym website builder", "fitness website builder", "CrossFit website", "personal trainer website", "yoga studio website builder"],
    generatorType: "landing",
    primaryColor: "#dc2626",
  },
  nonprofits: {
    slug: "nonprofits",
    name: "Nonprofits & Charities",
    headline: "AI Website Builder for Nonprofits",
    subheadline: "Tell your story, collect donations, and recruit volunteers — all in 60 seconds",
    description: "Your mission deserves a beautiful website without the agency price tag. Zoobicon builds nonprofit sites with donation forms, impact metrics, volunteer signup, event listings, and storytelling sections. Free tier available.",
    metaTitle: "Free AI Website Builder for Nonprofits & Charities | Zoobicon",
    metaDescription: "Build a nonprofit website for free in 60 seconds. Donation forms, impact metrics, volunteer signup, and event listings. Tell your story without the agency price tag.",
    painPoints: [
      "Nonprofit budgets can't afford $5,000+ websites",
      "Donation forms need to be trustworthy and simple",
      "Impact reporting needs to be visual and compelling",
      "Volunteer recruitment requires clear CTAs",
    ],
    features: [
      { title: "Donation Integration", description: "Prominent donation buttons and forms with suggested amounts. Make giving easy and frictionless." },
      { title: "Impact Dashboard", description: "Animated stat counters showing lives impacted, funds raised, projects completed. Visual storytelling." },
      { title: "Volunteer Signup", description: "Application forms with role descriptions, time commitments, and location preferences." },
      { title: "Event Listings", description: "Upcoming fundraisers, galas, and community events with registration links and countdowns." },
    ],
    testimonial: {
      quote: "We spent our entire marketing budget on our old website. Zoobicon let us redirect that money to actually helping people.",
      name: "Sarah Okafor",
      role: "Executive Director",
      company: "Hope Rising Foundation, Nairobi",
      metric: "Online donations up 280% after launch",
    },
    ctaText: "Build Your Nonprofit Website",
    keywords: ["nonprofit website builder", "charity website builder", "free nonprofit website", "NGO website builder", "donation website builder"],
    generatorType: "nonprofit",
    primaryColor: "#059669",
  },
};

export function getIndustry(slug: string): IndustryData | undefined {
  return INDUSTRIES[slug];
}

export function getAllIndustrySlugs(): string[] {
  return Object.keys(INDUSTRIES);
}
