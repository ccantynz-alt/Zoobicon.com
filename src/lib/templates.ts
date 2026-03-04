export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  prompt: string;
  thumbnail: string; // CSS gradient as placeholder
  tags: string[];
}

export const TEMPLATES: Template[] = [
  {
    id: "saas-landing",
    name: "SaaS Landing Page",
    category: "Business",
    description: "Modern SaaS product page with hero, features, pricing, and CTA sections.",
    prompt: "A modern SaaS landing page with a bold hero section featuring a gradient background, feature cards with icons, a pricing table with 3 tiers, testimonials section, and a strong call-to-action footer. Use a professional color scheme with blues and purples.",
    thumbnail: "from-blue-600 to-purple-600",
    tags: ["SaaS", "Startup", "Landing"],
  },
  {
    id: "portfolio-creative",
    name: "Creative Portfolio",
    category: "Portfolio",
    description: "Stunning portfolio with masonry gallery, about section, and contact form.",
    prompt: "A creative portfolio website with a full-screen hero with the photographer's name in massive typography, a masonry-style image gallery grid, an about section with a split layout, a services section, and a contact form. Dark theme with accent colors.",
    thumbnail: "from-rose-600 to-orange-500",
    tags: ["Portfolio", "Creative", "Gallery"],
  },
  {
    id: "ecommerce-store",
    name: "E-Commerce Store",
    category: "E-Commerce",
    description: "Product showcase with grid layout, cart UI, and promotional banners.",
    prompt: "An e-commerce storefront with a hero banner slider area, product grid with cards showing images, prices and add-to-cart buttons, category navigation, a featured products section, and a newsletter signup footer. Clean modern design with a white and green color scheme.",
    thumbnail: "from-emerald-600 to-teal-500",
    tags: ["Shop", "Products", "Store"],
  },
  {
    id: "restaurant-menu",
    name: "Restaurant & Menu",
    category: "Food & Drink",
    description: "Elegant restaurant site with menu, gallery, and reservation section.",
    prompt: "An elegant restaurant website with a hero section showing a background image placeholder, a menu section organized by categories (starters, mains, desserts) with prices, a photo gallery, about the chef section, opening hours, and a reservation form. Warm earth tones with gold accents.",
    thumbnail: "from-amber-700 to-red-800",
    tags: ["Restaurant", "Menu", "Food"],
  },
  {
    id: "agency-dark",
    name: "Digital Agency",
    category: "Business",
    description: "Bold agency site with case studies, team section, and services grid.",
    prompt: "A bold digital agency website with a dark background, oversized typography hero, a services grid with hover effects, case study cards, team member profiles, client logos, and a contact section. Use a dark theme with neon green accents.",
    thumbnail: "from-gray-900 to-green-900",
    tags: ["Agency", "Dark", "Corporate"],
  },
  {
    id: "blog-minimal",
    name: "Minimal Blog",
    category: "Blog",
    description: "Clean blog layout with featured post, article grid, and sidebar.",
    prompt: "A minimalist blog with a clean header and navigation, a featured post hero with large typography, an article grid with cards showing titles, excerpts, dates, and read time, a sidebar with categories and popular posts, and a simple footer. Use a warm off-white background with serif fonts.",
    thumbnail: "from-stone-400 to-stone-600",
    tags: ["Blog", "Minimal", "Content"],
  },
  {
    id: "fitness-gym",
    name: "Fitness & Gym",
    category: "Health",
    description: "High-energy gym site with class schedule, trainers, and membership plans.",
    prompt: "A high-energy fitness gym website with a powerful hero section with bold text, class schedule in a timetable format, trainer profile cards, membership pricing plans, a photo gallery, and a free trial sign-up form. Use dark backgrounds with red and orange accents. Bold, aggressive typography.",
    thumbnail: "from-red-700 to-orange-600",
    tags: ["Fitness", "Gym", "Health"],
  },
  {
    id: "tech-startup",
    name: "AI/Tech Startup",
    category: "Technology",
    description: "Futuristic tech page with animated elements, feature grid, and demo CTA.",
    prompt: "A futuristic AI tech startup landing page with a hero section featuring animated gradient backgrounds, floating UI elements, a feature comparison grid, integration logos, a live demo CTA section, and an enterprise contact form. Dark theme with electric blue and purple gradients. Ultra-modern design.",
    thumbnail: "from-indigo-600 to-cyan-500",
    tags: ["Tech", "AI", "Startup"],
  },
  {
    id: "event-conference",
    name: "Event & Conference",
    category: "Events",
    description: "Conference page with speaker lineup, schedule, and ticket registration.",
    prompt: "A tech conference landing page with a countdown timer hero, speaker lineup cards with photos and bios, a multi-track schedule/agenda, sponsor logos, venue information, and a ticket purchase section with different tiers. Modern and professional with a blue color scheme.",
    thumbnail: "from-violet-600 to-blue-600",
    tags: ["Event", "Conference", "Tickets"],
  },
  {
    id: "real-estate",
    name: "Real Estate Listings",
    category: "Real Estate",
    description: "Property listing site with search, featured homes, and agent profiles.",
    prompt: "A real estate listing website with a hero search bar, featured property cards with images and details (beds, baths, sqft, price), a property type filter, agent profile section, neighborhood highlights, and a contact form. Clean, trustworthy design with navy and gold colors.",
    thumbnail: "from-blue-900 to-yellow-700",
    tags: ["Real Estate", "Listings", "Property"],
  },
  {
    id: "music-artist",
    name: "Music Artist",
    category: "Entertainment",
    description: "Artist page with album showcase, tour dates, and merch store.",
    prompt: "A music artist/band website with a full-screen hero with artist name, a latest album showcase section, a tour dates list with venue and ticket links, a music player UI element, a merch store section, and social media links. Dark and moody with neon accent colors.",
    thumbnail: "from-purple-900 to-pink-600",
    tags: ["Music", "Artist", "Entertainment"],
  },
  {
    id: "nonprofit-charity",
    name: "Nonprofit & Charity",
    category: "Nonprofit",
    description: "Charity site with impact stats, donation section, and volunteer signup.",
    prompt: "A nonprofit charity website with an emotional hero section, impact statistics with large numbers, a programs/initiatives section, a donation form with suggested amounts, volunteer sign-up, latest news/blog section, and partner logos. Warm, hopeful colors with greens and earth tones.",
    thumbnail: "from-green-700 to-emerald-500",
    tags: ["Nonprofit", "Charity", "Donation"],
  },
];

export const TEMPLATE_CATEGORIES = [
  "All",
  "Business",
  "Portfolio",
  "E-Commerce",
  "Blog",
  "Technology",
  "Food & Drink",
  "Health",
  "Events",
  "Real Estate",
  "Entertainment",
  "Nonprofit",
];
