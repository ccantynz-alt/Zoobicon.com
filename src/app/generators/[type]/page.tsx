"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  Palette,
  PenTool,
  FolderSearch,
  CalendarDays,
  UtensilsCrossed,
  Building2,
  Store,
  Cloud,
  CalendarCheck,
  Shield,
  Users,
  KanbanSquare,
  GraduationCap,
  Package,
  BarChart3,
  Sparkles,
  Search,
  Moon,
  FileCode,
  Plug,
  Mail,
  Presentation,
  Type,
  ListChecks,
  Server,
  Globe2,
  Layers,
  Smartphone,
  Brush,
  BookOpen,
  FileBarChart,
  ShoppingCart,
  ArrowLeft,
  ChevronRight,
  Zap,
  Globe,
  Check,
} from "lucide-react";

type FieldType = "text" | "textarea" | "select";

interface GeneratorField {
  id: string;
  label: string;
  placeholder: string;
  type: FieldType;
  options?: string[];
}

interface GeneratorInfo {
  name: string;
  description: string;
  icon: string;
  category: string;
  color: string;
  fields: GeneratorField[];
  outputFeatures: string[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Palette,
  PenTool,
  FolderSearch,
  CalendarDays,
  UtensilsCrossed,
  Building2,
  Store,
  Cloud,
  CalendarCheck,
  Shield,
  Users,
  KanbanSquare,
  GraduationCap,
  Package,
  BarChart3,
  Sparkles,
  Search,
  Moon,
  FileCode,
  Plug,
  Mail,
  Presentation,
  Type,
  ListChecks,
  Server,
  Globe2,
  Layers,
  Smartphone,
  Brush,
  BookOpen,
  FileBarChart,
  ShoppingCart,
};

const GENERATOR_META: Record<string, GeneratorInfo> = {
  landing: {
    name: "Landing Page",
    description:
      "Generate high-converting landing pages with compelling headlines, feature sections, social proof, and clear CTAs optimized for conversions.",
    icon: "Rocket",
    category: "Website",
    color: "from-blue-600 to-indigo-600",
    fields: [
      {
        id: "businessName",
        label: "Business Name",
        placeholder: "e.g. Acme Software",
        type: "text",
      },
      {
        id: "industry",
        label: "Industry",
        placeholder: "e.g. SaaS, Fintech, Healthcare",
        type: "text",
      },
      {
        id: "targetAudience",
        label: "Target Audience",
        placeholder: "Describe your ideal customer — demographics, pain points, goals...",
        type: "textarea",
      },
      {
        id: "keyFeatures",
        label: "Key Features / Benefits",
        placeholder: "List the main features or benefits to highlight (one per line)",
        type: "textarea",
      },
      {
        id: "tone",
        label: "Tone",
        placeholder: "Select tone",
        type: "select",
        options: [
          "Professional",
          "Friendly",
          "Bold & Edgy",
          "Minimalist",
          "Playful",
        ],
      },
    ],
    outputFeatures: [
      "Hero section with headline, subheadline, and primary CTA",
      "Feature grid with icons and descriptions",
      "Social proof section with testimonials",
      "Pricing comparison table",
      "FAQ accordion section",
      "Footer with navigation and newsletter signup",
    ],
  },
  portfolio: {
    name: "Portfolio",
    description:
      "Create stunning portfolio websites to showcase your work, projects, and skills with beautiful galleries and case study layouts.",
    icon: "Palette",
    category: "Website",
    color: "from-purple-600 to-blue-700",
    fields: [
      {
        id: "creatorName",
        label: "Your Name / Studio Name",
        placeholder: "e.g. Jane Smith Design",
        type: "text",
      },
      {
        id: "profession",
        label: "Profession / Specialty",
        placeholder: "e.g. UI/UX Designer, Photographer, Architect",
        type: "text",
      },
      {
        id: "projectDescriptions",
        label: "Featured Projects",
        placeholder:
          "Describe 3-5 projects to showcase (name, type, brief description — one per line)",
        type: "textarea",
      },
      {
        id: "style",
        label: "Visual Style",
        placeholder: "Select style",
        type: "select",
        options: [
          "Minimal & Clean",
          "Bold & Artistic",
          "Dark & Dramatic",
          "Colorful & Playful",
          "Corporate & Polished",
        ],
      },
      {
        id: "bio",
        label: "About / Bio",
        placeholder: "A brief bio or artist statement...",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Hero section with name, title, and intro animation",
      "Project gallery with hover effects and lightbox",
      "Case study layout with process breakdown",
      "Skills and tools section",
      "About section with bio and photo",
      "Contact form with social links",
    ],
  },
  blog: {
    name: "Blog",
    description:
      "Generate clean, readable blog layouts with article pages, category navigation, author profiles, and search functionality.",
    icon: "PenTool",
    category: "Website",
    color: "from-emerald-600 to-teal-600",
    fields: [
      {
        id: "blogName",
        label: "Blog Name",
        placeholder: "e.g. The Tech Insider",
        type: "text",
      },
      {
        id: "niche",
        label: "Blog Niche / Topic",
        placeholder: "e.g. Technology, Travel, Food, Personal Finance",
        type: "text",
      },
      {
        id: "categories",
        label: "Categories",
        placeholder: "List your blog categories (one per line)",
        type: "textarea",
      },
      {
        id: "layout",
        label: "Layout Style",
        placeholder: "Select layout",
        type: "select",
        options: [
          "Magazine Grid",
          "Classic Single Column",
          "Masonry Cards",
          "Newspaper Style",
          "Minimalist",
        ],
      },
      {
        id: "sampleTopics",
        label: "Sample Article Topics",
        placeholder: "List 3-5 sample article titles for placeholder content",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Homepage with featured and recent articles grid",
      "Article page with reading time and author info",
      "Category sidebar with tag cloud",
      "Search bar with instant filtering",
      "Newsletter subscription form",
      "Author profile cards with social links",
    ],
  },
  directory: {
    name: "Directory",
    description:
      "Build searchable directory listings with filters, categories, map integration, and detailed profile pages for businesses or resources.",
    icon: "FolderSearch",
    category: "Website",
    color: "from-amber-600 to-orange-600",
    fields: [
      {
        id: "directoryName",
        label: "Directory Name",
        placeholder: "e.g. Local Eats Directory",
        type: "text",
      },
      {
        id: "listingType",
        label: "What Are You Listing?",
        placeholder: "e.g. Restaurants, Freelancers, Software Tools, Clinics",
        type: "text",
      },
      {
        id: "categories",
        label: "Listing Categories",
        placeholder: "List all categories/filters visitors can browse by (one per line)",
        type: "textarea",
      },
      {
        id: "location",
        label: "Geographic Focus",
        placeholder: "e.g. New York City, Global, United States",
        type: "text",
      },
      {
        id: "listingFields",
        label: "Listing Detail Fields",
        placeholder: "What info does each listing show? e.g. Name, Address, Rating, Phone, Hours",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Search bar with autocomplete suggestions",
      "Category filter sidebar with checkbox groups",
      "Listing cards with ratings and key info",
      "Detailed listing profile page",
      "Map integration placeholder",
      "Submit a listing form",
    ],
  },
  event: {
    name: "Event",
    description:
      "Create beautiful event pages with schedules, speaker profiles, ticket sections, countdown timers, and venue information.",
    icon: "CalendarDays",
    category: "Website",
    color: "from-rose-600 to-red-600",
    fields: [
      {
        id: "eventName",
        label: "Event Name",
        placeholder: "e.g. TechConf 2026",
        type: "text",
      },
      {
        id: "eventType",
        label: "Event Type",
        placeholder: "Select type",
        type: "select",
        options: [
          "Conference",
          "Workshop",
          "Meetup",
          "Concert",
          "Gala",
          "Webinar",
          "Hackathon",
          "Festival",
        ],
      },
      {
        id: "dateLocation",
        label: "Date & Location",
        placeholder: "e.g. March 20-22, 2026 — San Francisco Convention Center",
        type: "text",
      },
      {
        id: "speakers",
        label: "Speakers / Performers",
        placeholder: "List speakers with name and topic (one per line)",
        type: "textarea",
      },
      {
        id: "schedule",
        label: "Schedule Highlights",
        placeholder: "List key sessions or schedule items (one per line)",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Hero with event name, date, and countdown timer",
      "Speaker grid with bio cards and photos",
      "Schedule timeline with tracks and rooms",
      "Ticket tiers with pricing table",
      "Venue section with map and directions",
      "Sponsor logo strip with tiers",
    ],
  },
  restaurant: {
    name: "Restaurant",
    description:
      "Generate appetizing restaurant websites with menus, reservations, photo galleries, reviews, and online ordering sections.",
    icon: "UtensilsCrossed",
    category: "Website",
    color: "from-orange-600 to-red-600",
    fields: [
      {
        id: "restaurantName",
        label: "Restaurant Name",
        placeholder: "e.g. The Golden Spoon",
        type: "text",
      },
      {
        id: "cuisineType",
        label: "Cuisine Type",
        placeholder: "Select cuisine",
        type: "select",
        options: [
          "Italian",
          "Japanese",
          "Mexican",
          "French",
          "American",
          "Indian",
          "Thai",
          "Mediterranean",
          "Chinese",
          "Korean",
        ],
      },
      {
        id: "menuHighlights",
        label: "Menu Highlights",
        placeholder: "List signature dishes with prices (one per line, e.g. Truffle Risotto — $28)",
        type: "textarea",
      },
      {
        id: "atmosphere",
        label: "Atmosphere",
        placeholder: "Select atmosphere",
        type: "select",
        options: [
          "Fine Dining",
          "Casual",
          "Fast Casual",
          "Caf\u00e9",
          "Bar & Grill",
          "Rooftop",
          "Family Style",
        ],
      },
      {
        id: "location",
        label: "Location & Hours",
        placeholder: "e.g. 123 Main St, Brooklyn — Open Tue-Sun 5pm-11pm",
        type: "text",
      },
    ],
    outputFeatures: [
      "Hero with ambiance photo and tagline",
      "Interactive menu with categories and prices",
      "Reservation form with date/time/party size",
      "Photo gallery with lightbox",
      "Customer reviews section",
      "Location map with hours and contact info",
    ],
  },
  realestate: {
    name: "Real Estate",
    description:
      "Build professional real estate websites with property listings, search filters, virtual tour integration, and agent profiles.",
    icon: "Building2",
    category: "Website",
    color: "from-slate-600 to-zinc-700",
    fields: [
      {
        id: "agencyName",
        label: "Agency / Agent Name",
        placeholder: "e.g. Prestige Realty Group",
        type: "text",
      },
      {
        id: "location",
        label: "Market / Location",
        placeholder: "e.g. Miami, FL",
        type: "text",
      },
      {
        id: "propertyTypes",
        label: "Property Types",
        placeholder: "Select type",
        type: "select",
        options: ["Residential", "Commercial", "Luxury", "Mixed", "Vacation Rentals", "Industrial"],
      },
      {
        id: "specialties",
        label: "Specialties & Services",
        placeholder: "Describe what sets you apart — luxury homes, first-time buyers, investment properties...",
        type: "textarea",
      },
      {
        id: "featuredListings",
        label: "Featured Listings",
        placeholder: "Describe 3-5 properties (address, beds/baths, price — one per line)",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Hero with property search bar and filters",
      "Featured listings grid with image carousels",
      "Property detail cards with specs and pricing",
      "Agent profile with credentials and contact",
      "Neighborhood guide section",
      "Mortgage calculator widget",
    ],
  },
  marketplace: {
    name: "Marketplace",
    description:
      "Create two-sided marketplace platforms with product listings, seller profiles, search and filtering, and transaction flows.",
    icon: "Store",
    category: "Website",
    color: "from-cyan-600 to-blue-600",
    fields: [
      {
        id: "marketplaceName",
        label: "Marketplace Name",
        placeholder: "e.g. CraftHub",
        type: "text",
      },
      {
        id: "marketplaceType",
        label: "What Is Being Sold?",
        placeholder: "e.g. Handmade crafts, Digital templates, Used electronics, Freelance services",
        type: "text",
      },
      {
        id: "categories",
        label: "Product Categories",
        placeholder: "List all categories (one per line)",
        type: "textarea",
      },
      {
        id: "features",
        label: "Key Features",
        placeholder: "Select features",
        type: "select",
        options: [
          "Reviews + Ratings",
          "Seller Profiles + Reviews",
          "Auction Style",
          "Fixed Price Only",
          "Subscription Listings",
        ],
      },
      {
        id: "sampleListings",
        label: "Sample Listings",
        placeholder: "Describe 3-5 sample products/services with prices (one per line)",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Homepage with featured and trending listings",
      "Category navigation with filters and sorting",
      "Product detail page with image gallery",
      "Seller profile with ratings and reviews",
      "Shopping cart and checkout flow",
      "Search with autocomplete and category filters",
    ],
  },
  saas: {
    name: "SaaS Product",
    description:
      "Generate polished SaaS marketing sites with feature showcases, pricing tables, integration logos, and conversion-optimized layouts.",
    icon: "Cloud",
    category: "Website",
    color: "from-violet-600 to-purple-600",
    fields: [
      {
        id: "productName",
        label: "Product Name",
        placeholder: "e.g. FlowSync",
        type: "text",
      },
      {
        id: "problemSolved",
        label: "Problem It Solves",
        placeholder: "Describe the main problem your SaaS solves and who it helps...",
        type: "textarea",
      },
      {
        id: "keyFeatures",
        label: "Key Features",
        placeholder: "List core features (one per line)",
        type: "textarea",
      },
      {
        id: "pricingTiers",
        label: "Pricing Model",
        placeholder: "Select model",
        type: "select",
        options: [
          "Free + Pro",
          "Free + Pro + Enterprise",
          "Single Tier",
          "Usage Based",
          "Per Seat",
          "Freemium + Add-ons",
        ],
      },
      {
        id: "integrations",
        label: "Integrations",
        placeholder: "List tools/platforms you integrate with (e.g. Hash, Zapier, Salesforce)",
        type: "text",
      },
    ],
    outputFeatures: [
      "Hero with product screenshot and CTA",
      "Feature showcase with icon grid",
      "Integration logo strip",
      "Pricing table with tier comparison",
      "Testimonial carousel from customers",
      "FAQ section and CTA footer",
    ],
  },
  booking: {
    name: "Booking & Scheduling",
    description:
      "Build booking and appointment scheduling pages with calendars, service menus, staff profiles, and confirmation flows.",
    icon: "CalendarCheck",
    category: "App",
    color: "from-green-600 to-emerald-600",
    fields: [
      {
        id: "businessName",
        label: "Business Name",
        placeholder: "e.g. Serenity Spa",
        type: "text",
      },
      {
        id: "businessType",
        label: "Business Type",
        placeholder: "Select type",
        type: "select",
        options: [
          "Salon & Spa",
          "Medical Practice",
          "Fitness Studio",
          "Consulting",
          "Tutoring",
          "Photography",
          "Cleaning Service",
          "Auto Service",
        ],
      },
      {
        id: "services",
        label: "Services Offered",
        placeholder: "List services with duration and price (e.g. Deep Tissue Massage — 60min — $90)",
        type: "textarea",
      },
      {
        id: "staff",
        label: "Staff / Providers",
        placeholder: "List staff members with specialties (one per line)",
        type: "textarea",
      },
      {
        id: "availability",
        label: "Availability",
        placeholder: "e.g. Mon-Fri 9am-6pm, Sat 10am-4pm",
        type: "text",
      },
    ],
    outputFeatures: [
      "Service menu with categories and pricing",
      "Calendar date/time picker for appointments",
      "Staff selection with profiles and specialties",
      "Booking confirmation with email notification placeholder",
      "Customer info form",
      "Cancellation and rescheduling interface",
    ],
  },
  admin: {
    name: "Admin Dashboard",
    description:
      "Generate full-featured admin dashboards with data tables, charts, user management, settings panels, and CRUD interfaces.",
    icon: "Shield",
    category: "App",
    color: "from-gray-700 to-gray-900",
    fields: [
      {
        id: "appName",
        label: "Application Name",
        placeholder: "e.g. OrderFlow Admin",
        type: "text",
      },
      {
        id: "dataEntities",
        label: "Data Entities to Manage",
        placeholder: "List entities (e.g. Users, Orders, Products, Invoices — one per line)",
        type: "textarea",
      },
      {
        id: "charts",
        label: "Dashboard Metrics",
        placeholder: "What metrics/charts to show? (e.g. Revenue this month, Active users, Orders by status)",
        type: "textarea",
      },
      {
        id: "roles",
        label: "User Roles",
        placeholder: "Select roles",
        type: "select",
        options: [
          "Admin Only",
          "Admin + Editor",
          "Admin + Editor + Viewer",
          "Super Admin + Admin + User",
          "Custom Roles",
        ],
      },
      {
        id: "features",
        label: "Extra Features",
        placeholder: "e.g. Dark mode toggle, Export to CSV, Audit log, Notifications",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Sidebar navigation with collapsible menu",
      "Dashboard overview with stat cards and charts",
      "Data tables with search, sort, and pagination",
      "CRUD forms for each entity (create/edit modals)",
      "User management with role assignment",
      "Settings page with profile and preferences",
    ],
  },
  hrm: {
    name: "HR Management",
    description:
      "Create human resources management interfaces with employee directories, leave management, payroll views, and org charts.",
    icon: "Users",
    category: "App",
    color: "from-sky-600 to-blue-700",
    fields: [
      {
        id: "companyName",
        label: "Company Name",
        placeholder: "e.g. TechStart Inc.",
        type: "text",
      },
      {
        id: "companySize",
        label: "Company Size",
        placeholder: "Select size",
        type: "select",
        options: [
          "1-10 employees",
          "11-50 employees",
          "51-200 employees",
          "201-500 employees",
          "500+ employees",
        ],
      },
      {
        id: "departments",
        label: "Departments",
        placeholder: "List departments (e.g. Engineering, Marketing, Sales, HR — one per line)",
        type: "textarea",
      },
      {
        id: "modules",
        label: "HR Modules Needed",
        placeholder:
          "e.g. Employee directory, Leave management, Payroll, Performance reviews, Onboarding",
        type: "textarea",
      },
      {
        id: "features",
        label: "Special Features",
        placeholder: "e.g. Org chart, Time tracking, Benefits enrollment, Job postings",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Employee directory with search and filters",
      "Leave request and approval workflow",
      "Org chart with department hierarchy",
      "Payroll summary dashboard",
      "Performance review forms",
      "Onboarding checklist for new hires",
    ],
  },
  "project-mgmt": {
    name: "Project Management",
    description:
      "Build project management interfaces with kanban boards, task lists, timelines, team assignment, and progress tracking.",
    icon: "KanbanSquare",
    category: "App",
    color: "from-indigo-600 to-blue-600",
    fields: [
      {
        id: "toolName",
        label: "Tool Name",
        placeholder: "e.g. TaskBoard Pro",
        type: "text",
      },
      {
        id: "methodology",
        label: "Methodology",
        placeholder: "Select methodology",
        type: "select",
        options: ["Kanban", "Scrum", "Waterfall", "Hybrid", "Custom Workflow"],
      },
      {
        id: "projectTypes",
        label: "Project Types",
        placeholder: "What kinds of projects will be managed? (e.g. Software development, Marketing campaigns)",
        type: "textarea",
      },
      {
        id: "views",
        label: "Views Needed",
        placeholder: "e.g. Board view, List view, Timeline/Gantt, Calendar",
        type: "textarea",
      },
      {
        id: "teamSize",
        label: "Typical Team Size",
        placeholder: "Select size",
        type: "select",
        options: [
          "Solo / 1-3",
          "Small team (4-10)",
          "BookOpen team (11-25)",
          "Large team (25+)",
        ],
      },
    ],
    outputFeatures: [
      "Kanban board with drag-and-drop columns",
      "Task detail modal with assignees and due dates",
      "Project overview with progress bars",
      "Team member list with workload indicators",
      "Timeline/Gantt chart view",
      "Activity feed with recent updates",
    ],
  },
  lms: {
    name: "Learning Management",
    description:
      "Generate learning management system interfaces with course catalogs, lesson players, progress tracking, and certification.",
    icon: "GraduationCap",
    category: "App",
    color: "from-yellow-600 to-amber-600",
    fields: [
      {
        id: "platformName",
        label: "Platform Name",
        placeholder: "e.g. LearnHub Academy",
        type: "text",
      },
      {
        id: "contentType",
        label: "Content Type",
        placeholder: "Select type",
        type: "select",
        options: [
          "Video Courses",
          "Text + Quizzes",
          "Interactive Workshops",
          "Mixed Media",
          "Cohort-Based",
        ],
      },
      {
        id: "subjects",
        label: "Subjects / Courses",
        placeholder: "List courses or subject areas (one per line)",
        type: "textarea",
      },
      {
        id: "features",
        label: "Key Features",
        placeholder: "e.g. Certificates, Quizzes, Discussion forums, Progress tracking, Assignments",
        type: "textarea",
      },
      {
        id: "audience",
        label: "Target Learners",
        placeholder: "e.g. Corporate employees, K-12 students, Self-learners, Developers",
        type: "text",
      },
    ],
    outputFeatures: [
      "Course catalog with category filters",
      "Course detail page with curriculum outline",
      "Video/lesson player with progress bar",
      "Quiz interface with scoring",
      "Student dashboard with enrolled courses",
      "Certificate of completion generator",
    ],
  },
  inventory: {
    name: "Inventory Management",
    description:
      "Create inventory management dashboards with stock tracking, low-stock alerts, supplier management, and order fulfillment views.",
    icon: "Package",
    category: "App",
    color: "from-lime-600 to-green-600",
    fields: [
      {
        id: "businessName",
        label: "Business Name",
        placeholder: "e.g. QuickStock Warehouse",
        type: "text",
      },
      {
        id: "inventoryType",
        label: "Inventory Type",
        placeholder: "Select type",
        type: "select",
        options: [
          "Retail Products",
          "Raw Materials",
          "Food & Perishables",
          "Electronics",
          "Warehouse / Wholesale",
          "Mixed",
        ],
      },
      {
        id: "categories",
        label: "Product Categories",
        placeholder: "List categories (one per line)",
        type: "textarea",
      },
      {
        id: "trackingFields",
        label: "Tracking Fields",
        placeholder: "e.g. SKU, Quantity, Location, Supplier, Reorder Point, Cost, Sale Price",
        type: "textarea",
      },
      {
        id: "workflows",
        label: "Key Workflows",
        placeholder: "e.g. Receiving shipments, Stock transfers, Order picking, Returns processing",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Dashboard with stock level overview and alerts",
      "Product table with search, filters, and bulk actions",
      "Add/edit product form with SKU generation",
      "Low-stock alert cards with reorder buttons",
      "Supplier directory with contact info",
      "Stock movement history log",
    ],
  },
  dashboard: {
    name: "Analytics Dashboard",
    description:
      "Build data-rich analytics dashboards with charts, KPI cards, date range filters, and real-time metric displays.",
    icon: "BarChart3",
    category: "App",
    color: "from-teal-600 to-cyan-600",
    fields: [
      {
        id: "dashboardName",
        label: "Dashboard Name",
        placeholder: "e.g. Sales Analytics Hub",
        type: "text",
      },
      {
        id: "domain",
        label: "Domain / Industry",
        placeholder: "Select domain",
        type: "select",
        options: [
          "E-commerce / Sales",
          "Marketing / Ads",
          "Finance / Accounting",
          "Healthcare",
          "Logistics / Supply Chain",
          "SaaS Metrics",
          "Social Media",
        ],
      },
      {
        id: "kpis",
        label: "Key Metrics / KPIs",
        placeholder: "List the metrics to display (e.g. Revenue, MRR, Churn Rate, DAU — one per line)",
        type: "textarea",
      },
      {
        id: "chartTypes",
        label: "Chart Types Needed",
        placeholder: "e.g. Line charts, Bar charts, Pie charts, Heatmaps, Funnels",
        type: "textarea",
      },
      {
        id: "dateRange",
        label: "Default Time Range",
        placeholder: "Select range",
        type: "select",
        options: [
          "Last 7 days",
          "Last 30 days",
          "Last 90 days",
          "Year to date",
          "Custom range",
        ],
      },
    ],
    outputFeatures: [
      "KPI stat cards with trend indicators",
      "Line and bar charts with tooltips",
      "Date range picker with presets",
      "Data table with export functionality",
      "Comparison metrics (vs previous period)",
      "Responsive grid layout with widget cards",
    ],
  },
  animations: {
    name: "Animations & Effects",
    description:
      "Enhance any website with scroll animations, parallax effects, micro-interactions, loading transitions, and dynamic visual effects.",
    icon: "Sparkles",
    category: "Enhancement",
    color: "from-fuchsia-600 to-blue-700",
    fields: [
      {
        id: "websiteType",
        label: "Website Type",
        placeholder: "e.g. Landing page, Portfolio, E-commerce",
        type: "text",
      },
      {
        id: "animationStyle",
        label: "Animation Style",
        placeholder: "Select style",
        type: "select",
        options: [
          "Subtle & Elegant",
          "Bold & Dramatic",
          "Playful & Bouncy",
          "Futuristic / Cyberpunk",
          "Minimal & Smooth",
        ],
      },
      {
        id: "effects",
        label: "Desired Effects",
        placeholder:
          "List effects (e.g. Scroll reveal, Parallax, Hover glow, Particle background — one per line)",
        type: "textarea",
      },
      {
        id: "heroEffect",
        label: "Hero Section Effect",
        placeholder: "Select hero effect",
        type: "select",
        options: [
          "Aurora / Gradient Mesh",
          "Particle Field",
          "3D Floating Elements",
          "Typewriter Text",
          "Morphing Shapes",
          "Video Background",
        ],
      },
      {
        id: "performance",
        label: "Performance Priority",
        placeholder: "Select priority",
        type: "select",
        options: [
          "Smooth 60fps (fewer effects)",
          "Balanced",
          "Maximum visual impact",
        ],
      },
    ],
    outputFeatures: [
      "Scroll-triggered section reveals (fade, slide, scale)",
      "Parallax background layers",
      "Hover micro-interactions on cards and buttons",
      "Animated hero section with chosen effect",
      "Page transition animations",
      "Loading skeleton / spinner animations",
    ],
  },
  "seo-markup": {
    name: "SEO & Markup",
    description:
      "Generate SEO-optimized pages with proper meta tags, schema.org JSON-LD markup, Open Graph tags, and semantic HTML structure.",
    icon: "Search",
    category: "Enhancement",
    color: "from-green-600 to-lime-600",
    fields: [
      {
        id: "businessName",
        label: "Business / Site Name",
        placeholder: "e.g. GreenLeaf Organics",
        type: "text",
      },
      {
        id: "pageType",
        label: "Page Type",
        placeholder: "Select type",
        type: "select",
        options: [
          "Local Business",
          "Product Page",
          "Article / Blog Post",
          "Service Page",
          "FAQ Page",
          "Event Page",
          "Recipe Page",
        ],
      },
      {
        id: "targetKeywords",
        label: "Target Keywords",
        placeholder: "List primary and secondary keywords (one per line)",
        type: "textarea",
      },
      {
        id: "businessInfo",
        label: "Business Information",
        placeholder: "Address, phone, hours, service area — for structured data markup",
        type: "textarea",
      },
      {
        id: "competitors",
        label: "Competitor URLs (optional)",
        placeholder: "List competitor websites to outrank (one per line)",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Complete meta tags (title, description, viewport, robots)",
      "Open Graph tags for social sharing",
      "JSON-LD structured data for chosen page type",
      "Semantic HTML with proper heading hierarchy",
      "Internal linking structure suggestions",
      "Sitemap-ready URL structure",
    ],
  },
  "dark-mode": {
    name: "Dark Mode",
    description:
      "Generate websites with full dark mode support including theme toggles, smooth color transitions, and accessible contrast ratios.",
    icon: "Moon",
    category: "Enhancement",
    color: "from-gray-800 to-slate-900",
    fields: [
      {
        id: "websiteType",
        label: "Website Type",
        placeholder: "e.g. SaaS dashboard, Blog, Portfolio",
        type: "text",
      },
      {
        id: "lightPalette",
        label: "Light Mode Colors",
        placeholder: "Describe light mode palette (e.g. White background, blue accents, gray text)",
        type: "textarea",
      },
      {
        id: "darkPalette",
        label: "Dark Mode Colors",
        placeholder: "Describe dark mode palette (e.g. Near-black background, cyan accents, light gray text)",
        type: "textarea",
      },
      {
        id: "defaultMode",
        label: "Default Mode",
        placeholder: "Select default",
        type: "select",
        options: [
          "Light (toggle to dark)",
          "Dark (toggle to light)",
          "System preference",
        ],
      },
      {
        id: "toggleStyle",
        label: "Toggle Style",
        placeholder: "Select toggle style",
        type: "select",
        options: [
          "Sun/Moon icon toggle",
          "Slider switch",
          "Dropdown menu option",
          "Floating button",
        ],
      },
    ],
    outputFeatures: [
      "Complete light and dark color schemes",
      "Smooth CSS transition between modes",
      "Theme toggle component in header",
      "localStorage persistence for user preference",
      "System preference detection (prefers-color-scheme)",
      "WCAG AA contrast ratios in both modes",
    ],
  },
  "forms-backend": {
    name: "Forms & Backend",
    description:
      "Generate complex forms with validation, multi-step flows, file uploads, and backend processing logic with success/error states.",
    icon: "FileCode",
    category: "Enhancement",
    color: "from-blue-700 to-indigo-700",
    fields: [
      {
        id: "formPurpose",
        label: "Form Purpose",
        placeholder: "e.g. Job application, Customer survey, Event registration",
        type: "text",
      },
      {
        id: "formType",
        label: "Form Type",
        placeholder: "Select type",
        type: "select",
        options: [
          "Single Page",
          "Multi-Step Wizard",
          "Conversational (one question at a time)",
          "Side-by-Side (form + preview)",
        ],
      },
      {
        id: "fields",
        label: "Form Fields",
        placeholder:
          "List all fields with types (e.g. Full Name (text), Email (email), Resume (file upload) — one per line)",
        type: "textarea",
      },
      {
        id: "validation",
        label: "Validation Rules",
        placeholder: "e.g. Email format, Phone number format, Required fields, File size limits",
        type: "textarea",
      },
      {
        id: "submission",
        label: "On Submit Action",
        placeholder: "Select action",
        type: "select",
        options: [
          "Show success message",
          "Redirect to thank you page",
          "Send email notification",
          "Save to database",
          "Trigger webhook",
        ],
      },
    ],
    outputFeatures: [
      "Responsive form layout with clear labels",
      "Client-side validation with error messages",
      "File upload with drag-and-drop and preview",
      "Multi-step progress indicator (if wizard)",
      "Success/error state displays",
      "Accessible form with ARIA labels and keyboard nav",
    ],
  },
  integrations: {
    name: "Integrations Hub",
    description:
      "Create integration showcase pages with API documentation, webhook configuration, connection flows, and partner listings.",
    icon: "Plug",
    category: "Enhancement",
    color: "from-indigo-600 to-violet-600",
    fields: [
      {
        id: "productName",
        label: "Product Name",
        placeholder: "e.g. DataSync Platform",
        type: "text",
      },
      {
        id: "integrationTypes",
        label: "Integration Categories",
        placeholder: "List categories (e.g. CRM, Payment, Analytics, Communication — one per line)",
        type: "textarea",
      },
      {
        id: "featuredIntegrations",
        label: "Featured Integrations",
        placeholder: "List top integrations (e.g. Salesforce, Hash, Stripe, HubSpot — one per line)",
        type: "textarea",
      },
      {
        id: "apiStyle",
        label: "API Style",
        placeholder: "Select style",
        type: "select",
        options: ["REST API", "GraphQL", "Webhooks", "SDK / Libraries", "No-Code / Zapier"],
      },
      {
        id: "documentation",
        label: "Documentation Needs",
        placeholder: "e.g. Quick start guide, Code examples, Authentication docs, Rate limits",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Integration marketplace grid with logos",
      "Category filter tabs",
      "Integration detail page with setup instructions",
      "API documentation section with code examples",
      "Webhook configuration UI",
      "Connection status dashboard",
    ],
  },
  "email-sequence": {
    name: "Email Sequence",
    description:
      "Generate email marketing templates with sequences, A/B variants, responsive layouts, and campaign preview functionality.",
    icon: "Mail",
    category: "Marketing",
    color: "from-cyan-600 to-rose-600",
    fields: [
      {
        id: "businessName",
        label: "Business Name",
        placeholder: "e.g. FreshFit Meals",
        type: "text",
      },
      {
        id: "campaignGoal",
        label: "Campaign Goal",
        placeholder: "Select goal",
        type: "select",
        options: [
          "Welcome / Onboarding",
          "Product Launch",
          "Abandoned Cart Recovery",
          "Re-engagement",
          "Newsletter",
          "Event Promotion",
          "Upsell / Cross-sell",
        ],
      },
      {
        id: "emailCount",
        label: "Number of Emails in Sequence",
        placeholder: "Select count",
        type: "select",
        options: ["1 (Single email)", "3 (Short sequence)", "5 (Standard sequence)", "7 (Full nurture)"],
      },
      {
        id: "brandVoice",
        label: "Brand Voice",
        placeholder: "Describe your brand's tone and style — professional, casual, witty, empathetic...",
        type: "textarea",
      },
      {
        id: "keyMessages",
        label: "Key Messages / Offers",
        placeholder: "What are the main messages or offers across the sequence? (one per line)",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Responsive email templates (mobile + desktop)",
      "Subject lines with A/B variants",
      "Pre-header text for each email",
      "CTA buttons with tracking placeholder links",
      "Sequence timeline showing send schedule",
      "Unsubscribe footer and compliance elements",
    ],
  },
  "pitch-deck": {
    name: "Pitch Deck",
    description:
      "Create investor-ready pitch deck pages with slides for problem, solution, market size, traction, team, and financials.",
    icon: "Presentation",
    category: "Marketing",
    color: "from-amber-600 to-yellow-600",
    fields: [
      {
        id: "companyName",
        label: "Company Name",
        placeholder: "e.g. NovaPay",
        type: "text",
      },
      {
        id: "stage",
        label: "Funding Stage",
        placeholder: "Select stage",
        type: "select",
        options: [
          "Pre-Seed",
          "Seed",
          "Series A",
          "Series B",
          "Growth / Series C+",
        ],
      },
      {
        id: "problem",
        label: "Problem Statement",
        placeholder: "Describe the problem your company solves in 2-3 sentences...",
        type: "textarea",
      },
      {
        id: "solution",
        label: "Solution & Product",
        placeholder: "Describe your solution, how it works, and key differentiators...",
        type: "textarea",
      },
      {
        id: "traction",
        label: "Traction & Metrics",
        placeholder: "e.g. 10K users, $500K ARR, 20% MoM growth, 3 enterprise clients",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Title slide with company name and tagline",
      "Problem slide with pain point visualization",
      "Solution slide with product screenshots",
      "Market size slide with TAM/SAM/SOM",
      "Traction slide with growth charts",
      "Team slide with founder bios and ask amount",
    ],
  },
  copy: {
    name: "Copywriting",
    description:
      "Generate persuasive marketing copy for websites, ads, social media, product descriptions, and brand messaging frameworks.",
    icon: "Type",
    category: "Marketing",
    color: "from-red-600 to-blue-700",
    fields: [
      {
        id: "businessName",
        label: "Business / Brand Name",
        placeholder: "e.g. EcoClean Solutions",
        type: "text",
      },
      {
        id: "copyType",
        label: "Copy Type",
        placeholder: "Select type",
        type: "select",
        options: [
          "Website Copy (full page)",
          "Ad Copy (Google/ThumbsUp)",
          "Product Descriptions",
          "Brand Messaging Framework",
          "Social Media Posts",
          "Sales Page / Long Form",
        ],
      },
      {
        id: "targetAudience",
        label: "Target Audience",
        placeholder: "Who are you writing for? Demographics, psychographics, pain points...",
        type: "textarea",
      },
      {
        id: "uniqueValue",
        label: "Unique Value Proposition",
        placeholder: "What makes your product/service different from competitors?",
        type: "textarea",
      },
      {
        id: "tone",
        label: "Tone of Voice",
        placeholder: "Select tone",
        type: "select",
        options: [
          "Professional & Authoritative",
          "Friendly & Conversational",
          "Bold & Provocative",
          "Warm & Empathetic",
          "Witty & Clever",
          "Luxury & Aspirational",
        ],
      },
    ],
    outputFeatures: [
      "Headline variations (5-10 options)",
      "Subheadlines and body copy",
      "CTA button text variations",
      "Feature/benefit descriptions",
      "Social proof copy (testimonial templates)",
      "Meta description and ad copy variants",
    ],
  },
  "form-builder": {
    name: "Form Builder",
    description:
      "Create drag-and-drop form builders with field types, conditional logic, calculation fields, and submission management.",
    icon: "ListChecks",
    category: "Tool",
    color: "from-cyan-600 to-teal-600",
    fields: [
      {
        id: "formName",
        label: "Form Name / Purpose",
        placeholder: "e.g. Customer Feedback Survey",
        type: "text",
      },
      {
        id: "fieldTypes",
        label: "Required Field Types",
        placeholder:
          "List field types needed (e.g. Text, Email, Phone, Dropdown, Checkbox, Rating, File Upload — one per line)",
        type: "textarea",
      },
      {
        id: "logic",
        label: "Conditional Logic",
        placeholder: "Describe any conditional rules (e.g. Show field X if field Y = 'Yes')",
        type: "textarea",
      },
      {
        id: "style",
        label: "Form Style",
        placeholder: "Select style",
        type: "select",
        options: [
          "Clean & Minimal",
          "Card-Based Sections",
          "Conversational (typeform style)",
          "Classic with sidebar",
        ],
      },
      {
        id: "submissionHandling",
        label: "Submission Handling",
        placeholder: "Select handling",
        type: "select",
        options: [
          "Email notification",
          "Save to dashboard table",
          "Export to CSV",
          "Webhook to external service",
          "All of the above",
        ],
      },
    ],
    outputFeatures: [
      "Visual form builder with field drag-and-drop",
      "Field configuration panel (label, required, placeholder)",
      "Conditional logic editor",
      "Form preview in real-time",
      "Submission table with search and export",
      "Embed code generator for external sites",
    ],
  },
  "api-gen": {
    name: "API Generator",
    description:
      "Generate RESTful API endpoint documentation with schemas, authentication, request/response examples, and interactive testing UI.",
    icon: "Server",
    category: "Tool",
    color: "from-emerald-700 to-green-700",
    fields: [
      {
        id: "apiName",
        label: "API Name",
        placeholder: "e.g. PaymentGateway API",
        type: "text",
      },
      {
        id: "resources",
        label: "API Resources / Entities",
        placeholder: "List resources (e.g. Users, Products, Orders, Payments — one per line)",
        type: "textarea",
      },
      {
        id: "authMethod",
        label: "Authentication Method",
        placeholder: "Select method",
        type: "select",
        options: [
          "API Key (header)",
          "Bearer Token (JWT)",
          "OAuth 2.0",
          "Basic Auth",
          "No Auth (public)",
        ],
      },
      {
        id: "endpoints",
        label: "Key Endpoints",
        placeholder:
          "Describe main endpoints (e.g. GET /users - list all, POST /orders - create order — one per line)",
        type: "textarea",
      },
      {
        id: "responseFormat",
        label: "Response Format",
        placeholder: "Select format",
        type: "select",
        options: [
          "JSON (REST)",
          "GraphQL",
          "JSON:API spec",
          "HAL+JSON",
        ],
      },
    ],
    outputFeatures: [
      "API reference with endpoint listing",
      "Request/response examples with syntax highlighting",
      "Authentication setup guide",
      "Schema definitions for each resource",
      "Interactive API tester (try it out)",
      "Error code reference table",
    ],
  },
  "chrome-ext": {
    name: "Globe2 Extension",
    description:
      "Generate Globe2 extension popup UIs, options pages, and content scripts with proper manifest.json configuration.",
    icon: "Globe2",
    category: "Tool",
    color: "from-yellow-500 to-green-500",
    fields: [
      {
        id: "extensionName",
        label: "Extension Name",
        placeholder: "e.g. QuickNotes",
        type: "text",
      },
      {
        id: "extensionType",
        label: "Extension Type",
        placeholder: "Select type",
        type: "select",
        options: [
          "Popup (toolbar icon)",
          "Side Panel",
          "Content Script (page modifier)",
          "New Tab Override",
          "DevTools Panel",
        ],
      },
      {
        id: "features",
        label: "Core Features",
        placeholder: "List main features (e.g. Save notes, Screenshot capture, Dark mode toggle — one per line)",
        type: "textarea",
      },
      {
        id: "permissions",
        label: "Required Permissions",
        placeholder: "e.g. Active tab, Storage, Clipboard, Notifications, Tabs",
        type: "textarea",
      },
      {
        id: "uiStyle",
        label: "UI Style",
        placeholder: "Select style",
        type: "select",
        options: [
          "Material Design",
          "Minimal / Clean",
          "Dark Theme",
          "Colorful / Branded",
        ],
      },
    ],
    outputFeatures: [
      "Popup HTML with responsive layout",
      "Options/settings page",
      "manifest.json with proper permissions",
      "Background service worker template",
      "Content script injection template",
      "Globe2 storage API integration for settings",
    ],
  },
  "component-lib": {
    name: "Component Library",
    description:
      "Generate reusable UI component libraries with buttons, cards, modals, forms, tables, and navigation — documented with usage examples.",
    icon: "Layers",
    category: "Tool",
    color: "from-purple-700 to-indigo-700",
    fields: [
      {
        id: "libraryName",
        label: "Library Name",
        placeholder: "e.g. NexusUI",
        type: "text",
      },
      {
        id: "designSystem",
        label: "Design System Base",
        placeholder: "Select base",
        type: "select",
        options: [
          "Custom / From Scratch",
          "Material Design Inspired",
          "Apple HIG Inspired",
          "Tailwind / Utility-First",
          "Bootstrap-Like",
        ],
      },
      {
        id: "components",
        label: "Components Needed",
        placeholder:
          "List components (e.g. Button, Card, Modal, Table, Dropdown, Tabs, Toast, Avatar — one per line)",
        type: "textarea",
      },
      {
        id: "theme",
        label: "Color Theme",
        placeholder: "Describe primary/secondary colors and overall feel (e.g. Blue primary, warm neutrals, modern)",
        type: "textarea",
      },
      {
        id: "features",
        label: "Library Features",
        placeholder: "e.g. Dark mode support, Responsive, Accessibility, Animation variants",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Component gallery with live previews",
      "Variant showcase (sizes, colors, states)",
      "Code snippets with copy button",
      "Props/API documentation for each component",
      "Dark mode toggle for all previews",
      "Responsive behavior demonstrations",
    ],
  },
  pwa: {
    name: "Progressive Web App",
    description:
      "Generate PWA-ready websites with service workers, app manifests, offline support, install prompts, and push notification setup.",
    icon: "Smartphone",
    category: "Tool",
    color: "from-blue-600 to-cyan-600",
    fields: [
      {
        id: "appName",
        label: "App Name",
        placeholder: "e.g. FitTrack",
        type: "text",
      },
      {
        id: "appType",
        label: "App Type",
        placeholder: "Select type",
        type: "select",
        options: [
          "Content / News Reader",
          "Productivity Tool",
          "E-commerce / Shopping",
          "Social / Community",
          "Utility / Calculator",
          "Fitness / Health",
        ],
      },
      {
        id: "offlineFeatures",
        label: "Offline Features",
        placeholder: "What should work offline? (e.g. Read cached articles, View saved data, Basic calculations)",
        type: "textarea",
      },
      {
        id: "cacheStrategy",
        label: "Cache Strategy",
        placeholder: "Select strategy",
        type: "select",
        options: [
          "Cache First (offline-first)",
          "Network First (fresh data priority)",
          "Stale While Revalidate",
          "Cache Only (fully offline)",
        ],
      },
      {
        id: "features",
        label: "PWA Features",
        placeholder: "e.g. Push notifications, Background sync, Share target, App shortcuts",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Web app manifest with icons and theme",
      "Service worker with chosen cache strategy",
      "Offline fallback page",
      "Install prompt banner/button",
      "Push notification setup template",
      "App shell architecture for instant loading",
    ],
  },
  "brand-kit": {
    name: "Brand Kit",
    description:
      "Generate complete brand identity kits with logos, color palettes, typography systems, iconography, and brand usage guidelines.",
    icon: "Brush",
    category: "Marketing",
    color: "from-rose-600 to-orange-600",
    fields: [
      {
        id: "brandName",
        label: "Brand Name",
        placeholder: "e.g. Luminary Studios",
        type: "text",
      },
      {
        id: "industry",
        label: "Industry",
        placeholder: "e.g. Creative Agency, Health Tech, Sustainable Fashion",
        type: "text",
      },
      {
        id: "brandPersonality",
        label: "Brand Personality",
        placeholder: "Describe the personality in 3-5 adjectives (e.g. Bold, Innovative, Trustworthy, Playful)",
        type: "textarea",
      },
      {
        id: "colorPreferences",
        label: "Color Preferences",
        placeholder: "Select preference",
        type: "select",
        options: [
          "Warm (reds, oranges, yellows)",
          "Cool (blues, greens, purples)",
          "Neutral (grays, blacks, whites)",
          "Vibrant (bright, saturated)",
          "Pastel (soft, muted)",
          "Monochrome (single color family)",
        ],
      },
      {
        id: "competitors",
        label: "Key Competitors",
        placeholder: "List competitors to differentiate from (one per line)",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Primary and secondary color palette with hex codes",
      "Typography system (headings, body, accent fonts)",
      "Logo concepts with variations (full, icon, monochrome)",
      "Brand voice and tone guidelines",
      "Do's and Don'ts usage examples",
      "Social media profile templates",
    ],
  },
  "style-guide": {
    name: "Style Guide",
    description:
      "Create living style guides with design tokens, component patterns, spacing scales, and interactive documentation pages.",
    icon: "BookOpen",
    category: "Marketing",
    color: "from-teal-600 to-emerald-600",
    fields: [
      {
        id: "projectName",
        label: "Project / Brand Name",
        placeholder: "e.g. Nexus Design System",
        type: "text",
      },
      {
        id: "platform",
        label: "Target Platform",
        placeholder: "Select platform",
        type: "select",
        options: [
          "Web Application",
          "Mobile App (iOS/Android)",
          "Cross-Platform",
          "Marketing Website",
          "Internal Tools",
        ],
      },
      {
        id: "existingColors",
        label: "Existing Brand Colors",
        placeholder: "List existing colors with hex codes if available (e.g. Primary Blue: #2563EB)",
        type: "textarea",
      },
      {
        id: "sections",
        label: "Style Guide Sections",
        placeholder:
          "What sections to include? (e.g. Colors, Typography, Spacing, Icons, Components, Patterns — one per line)",
        type: "textarea",
      },
      {
        id: "framework",
        label: "CSS Framework",
        placeholder: "Select framework",
        type: "select",
        options: [
          "Custom CSS / CSS Variables",
          "Tailwind CSS",
          "Bootstrap",
          "Material Design",
          "Framework Agnostic",
        ],
      },
    ],
    outputFeatures: [
      "Color palette with swatches, names, and usage context",
      "Typography scale with live examples",
      "Spacing and sizing scale visualization",
      "Component pattern library with variants",
      "Icon set showcase with search",
      "Accessibility guidelines and contrast checker",
    ],
  },
  report: {
    name: "Report",
    description:
      "Generate professional report pages with data visualizations, executive summaries, charts, comparison tables, and downloadable sections.",
    icon: "FileBarChart",
    category: "Tool",
    color: "from-slate-600 to-gray-700",
    fields: [
      {
        id: "reportTitle",
        label: "Report Title",
        placeholder: "e.g. Q1 2026 Sales Performance Report",
        type: "text",
      },
      {
        id: "reportType",
        label: "Report Type",
        placeholder: "Select type",
        type: "select",
        options: [
          "Financial / Quarterly",
          "Marketing Analytics",
          "Project Status",
          "Research / White Paper",
          "Annual Review",
          "Competitive Analysis",
        ],
      },
      {
        id: "sections",
        label: "Report Sections",
        placeholder:
          "List sections to include (e.g. Executive Summary, KPI Overview, Revenue Breakdown, Recommendations — one per line)",
        type: "textarea",
      },
      {
        id: "dataPoints",
        label: "Key Data Points",
        placeholder: "List key metrics and numbers to feature (e.g. Revenue: $2.1M, Growth: 23%, Customers: 5,400)",
        type: "textarea",
      },
      {
        id: "visualizations",
        label: "Chart Types Needed",
        placeholder: "Select chart types",
        type: "select",
        options: [
          "Bar + Line Charts",
          "Pie + Donut Charts",
          "Tables + Heatmaps",
          "Mixed (all types)",
          "Minimal (tables only)",
        ],
      },
    ],
    outputFeatures: [
      "Executive summary with key findings",
      "KPI cards with trend indicators",
      "Data visualization charts (bar, line, pie)",
      "Comparison tables with highlighting",
      "Recommendations section with action items",
      "Print-friendly layout with page breaks",
    ],
  },
  ecommerce: {
    name: "E-Commerce Store",
    description:
      "Generate complete e-commerce storefronts with product grids, shopping cart, checkout flow, customer reviews, wishlists, and discount codes.",
    icon: "ShoppingCart",
    category: "Website",
    color: "from-emerald-600 to-green-600",
    fields: [
      {
        id: "storeName",
        label: "Store Name",
        placeholder: "e.g. Urban Threads, GlowUp Skincare",
        type: "text",
      },
      {
        id: "products",
        label: "Products / Categories",
        placeholder: "Describe your products or categories (e.g. T-shirts, Hoodies, Accessories)",
        type: "textarea",
      },
      {
        id: "priceRange",
        label: "Price Range",
        placeholder: "e.g. $15 - $120",
        type: "text",
      },
      {
        id: "brandStyle",
        label: "Brand Style",
        placeholder: "Select style",
        type: "select" as FieldType,
        options: [
          "Modern & Minimal",
          "Bold & Vibrant",
          "Luxury & Premium",
          "Playful & Fun",
          "Organic & Natural",
        ],
      },
      {
        id: "features",
        label: "Special Features",
        placeholder: "e.g. Discount codes, wishlist, size guide, reviews, loyalty points",
        type: "textarea",
      },
    ],
    outputFeatures: [
      "Product grid with images, prices, and add-to-cart",
      "Shopping cart with quantity controls",
      "Checkout flow with shipping & payment forms",
      "Customer reviews with star ratings",
      "Wishlist functionality",
      "Discount code input (SAVE10 built-in)",
      "Category navigation and search/filters",
      "Stock badges and sale indicators",
    ],
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  Website: "bg-blue-100 text-blue-700",
  App: "bg-green-100 text-green-700",
  Enhancement: "bg-purple-100 text-purple-700",
  Marketing: "bg-cyan-100 text-cyan-700",
  Tool: "bg-amber-100 text-amber-700",
};

function getRelatedGenerators(
  currentType: string,
  category: string
): { type: string; info: GeneratorInfo }[] {
  return Object.entries(GENERATOR_META)
    .filter(([type, info]) => type !== currentType && info.category === category)
    .slice(0, 3)
    .map(([type, info]) => ({ type, info }));
}

export default function GeneratorTypePage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as string;
  const generator = GENERATOR_META[type];

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [quickMode, setQuickMode] = useState<"idle" | "generating" | "preview" | "deploying" | "deployed">("idle");
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [deployedUrl, setDeployedUrl] = useState("");
  const [genError, setGenError] = useState("");

  useEffect(() => {
    try {
      const user = localStorage.getItem("zoobicon_user");
      setIsLoggedIn(!!user);
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  if (!generator) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-6xl font-bold mb-4">404</h1>
            <p className="text-xl text-gray-400 mb-8">
              Generator type &ldquo;{type}&rdquo; not found.
            </p>
            <Link
              href="/generators"
              className="inline-flex items-center gap-2 bg-white text-gray-950 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to All Generators
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const IconComponent = ICON_MAP[generator.icon];
  const relatedGenerators = getRelatedGenerators(type, generator.category);

  function handleFieldChange(fieldId: string, value: string) {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }

  function buildPrompt(): string {
    const parts: string[] = [`Generate a ${generator.name} website`];
    generator.fields.forEach((field) => {
      const value = formData[field.id];
      if (value && value.trim()) {
        parts.push(`${field.label}: ${value.trim()}`);
      }
    });
    return parts.join(". ");
  }

  function handleGenerate() {
    const prompt = buildPrompt();
    const encoded = encodeURIComponent(prompt);
    router.push(`/builder?generator=${type}&prompt=${encoded}`);
  }

  async function handleQuickGenerate() {
    setQuickMode("generating");
    setGenError("");
    setGeneratedHtml("");
    const prompt = buildPrompt();

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tier: "standard", generator: type }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Generation failed (${res.status})`);
      }

      const data = await res.json();
      const html = data.html || data.code || "";

      if (!html || html.length < 100) {
        throw new Error("Generation returned empty content. Please try again.");
      }

      setGeneratedHtml(html);
      setQuickMode("preview");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed");
      setQuickMode("idle");
    }
  }

  async function handleQuickDeploy() {
    if (!generatedHtml) return;
    setQuickMode("deploying");

    try {
      const siteName = formData[generator.fields[0]?.id] || `${generator.name} Site`;
      const res = await fetch("/api/hosting/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: siteName,
          code: generatedHtml,
        }),
      });

      if (!res.ok) throw new Error("Deploy failed");

      const data = await res.json();
      setDeployedUrl(data.url || data.siteUrl || "");
      setQuickMode("deployed");
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Deploy failed");
      setQuickMode("preview");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Zoobicon
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/generators"
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Generators
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Pricing
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="text-sm bg-white text-gray-950 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/signup"
                className="text-sm bg-white text-gray-950 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`pt-32 pb-16 bg-gradient-to-br ${generator.color} relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-gray-900/40" />
        <div className="relative max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              href="/generators"
              className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              All Generators
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-start gap-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              {IconComponent && <IconComponent className="w-8 h-8 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    CATEGORY_COLORS[generator.category] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {generator.category}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {generator.name} Generator
              </h1>
              <p className="text-lg text-white/80 max-w-2xl">
                {generator.description}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <h2 className="text-2xl font-bold mb-2">Configure Your {generator.name}</h2>
            <p className="text-gray-400 mb-8">
              Fill in the details below to generate a customized{" "}
              {generator.name.toLowerCase()} tailored to your needs.
            </p>

            <div className="space-y-6">
              {generator.fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.08 }}
                >
                  <label
                    htmlFor={field.id}
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    {field.label}
                  </label>
                  {field.type === "text" && (
                    <input
                      id={field.id}
                      type="text"
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  )}
                  {field.type === "textarea" && (
                    <textarea
                      id={field.id}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      rows={4}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    />
                  )}
                  {field.type === "select" && field.options && (
                    <select
                      id={field.id}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
                    >
                      <option value="" className="text-gray-500">
                        {field.placeholder}
                      </option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt} className="text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="mt-10 space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleQuickGenerate}
                  disabled={quickMode === "generating"}
                  className={`inline-flex items-center justify-center gap-2 bg-gradient-to-r ${generator.color} text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-blue-500/20 disabled:opacity-60`}
                >
                  {quickMode === "generating" ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      One-Click Generate
                    </>
                  )}
                </button>
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center justify-center gap-2 bg-gray-800 text-gray-300 px-6 py-4 rounded-xl font-medium hover:bg-gray-700 transition"
                >
                  Open in Builder
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {genError && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-xl px-4 py-3 text-sm text-red-300">
                  {genError}
                </div>
              )}

              {/* Quick preview + deploy panel */}
              {quickMode !== "idle" && quickMode !== "generating" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden"
                >
                  {/* Preview toolbar */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50 bg-gray-900/50">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/70" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                        <div className="w-3 h-3 rounded-full bg-green-500/70" />
                      </div>
                      <span className="text-xs text-gray-400">
                        {quickMode === "deployed" && deployedUrl
                          ? deployedUrl
                          : "Preview"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {quickMode === "preview" && (
                        <>
                          <button
                            onClick={handleQuickDeploy}
                            className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                          >
                            <Rocket className="w-3.5 h-3.5" />
                            Deploy Live
                          </button>
                          <button
                            onClick={() => {
                              const encoded = encodeURIComponent(buildPrompt());
                              router.push(`/builder?generator=${type}&prompt=${encoded}`);
                            }}
                            className="inline-flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium px-3 py-1.5 rounded-lg transition"
                          >
                            Edit in Builder
                          </button>
                        </>
                      )}
                      {quickMode === "deploying" && (
                        <div className="flex items-center gap-2 text-xs text-yellow-400">
                          <div className="w-3.5 h-3.5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                          Deploying...
                        </div>
                      )}
                      {quickMode === "deployed" && deployedUrl && (
                        <a
                          href={deployedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Visit Site
                        </a>
                      )}
                    </div>
                  </div>

                  {/* iframe preview */}
                  <div className="bg-white" style={{ height: 500 }}>
                    <iframe
                      srcDoc={generatedHtml}
                      className="w-full h-full border-0"
                      title="Generated preview"
                      sandbox="allow-scripts"
                    />
                  </div>

                  {/* Deployed success banner */}
                  {quickMode === "deployed" && deployedUrl && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-green-900/30 border-t border-green-700/30">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-green-300">
                        Deployed to{" "}
                        <a
                          href={deployedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium"
                        >
                          {deployedUrl}
                        </a>
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Sidebar: Output Features */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-400" />
                What You Get
              </h3>
              <ul className="space-y-3">
                {generator.outputFeatures.map((feature, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-gray-800">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Sparkles className="w-4 h-4" />
                  <span>Powered by Claude Opus</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Generation takes ~30 seconds. Output is a complete, standalone
                  HTML file ready to deploy.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Generators */}
        {relatedGenerators.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-24"
          >
            <h2 className="text-2xl font-bold mb-2">
              More {generator.category} Generators
            </h2>
            <p className="text-gray-400 mb-8">
              Explore other generators in the {generator.category} category.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedGenerators.map(({ type: relType, info }) => {
                const RelIcon = ICON_MAP[info.icon];
                return (
                  <Link
                    key={relType}
                    href={`/generators/${relType}`}
                    className="group bg-gray-900 rounded-2xl border border-gray-800 p-6 hover:border-gray-600 transition"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center mb-4`}
                    >
                      {RelIcon && (
                        <RelIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition">
                      {info.name}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {info.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm text-gray-500 group-hover:text-blue-400 transition">
                      Try it
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 mt-16">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Zoobicon. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-gray-500 hover:text-gray-300 transition"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-500 hover:text-gray-300 transition"
            >
              Terms
            </Link>
            <Link
              href="/support"
              className="text-sm text-gray-500 hover:text-gray-300 transition"
            >
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
