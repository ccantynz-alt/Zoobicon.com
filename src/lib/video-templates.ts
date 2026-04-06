// ---------------------------------------------------------------------------
// Video Template Library
//
// Pre-built video templates for quick starts. Each template provides a
// complete storyboard structure, script outline, and visual direction
// that users can customize before generating.
// ---------------------------------------------------------------------------

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: VideoTemplateCategory;
  projectType: string;
  platform: string;
  duration: number;
  style: string;
  music: string;
  thumbnail: string;              // Gradient CSS for preview
  script: string;                 // Template script with {{placeholders}}
  sceneOutline: {
    sceneNumber: number;
    duration: string;
    description: string;
    textOverlay: string;
    transition: string;
  }[];
  tags: string[];
}

export type VideoTemplateCategory =
  | "marketing"
  | "social-media"
  | "e-commerce"
  | "education"
  | "startup"
  | "agency"
  | "personal-brand"
  | "real-estate";

export const VIDEO_TEMPLATE_CATEGORIES: { id: VideoTemplateCategory; label: string; description: string }[] = [
  { id: "marketing", label: "Marketing", description: "Ads, promos, and campaigns" },
  { id: "social-media", label: "Social Media", description: "TikTok, Reels, and Shorts" },
  { id: "e-commerce", label: "E-Commerce", description: "Product showcases and demos" },
  { id: "education", label: "Education", description: "Tutorials and explainers" },
  { id: "startup", label: "Startup", description: "Pitch decks and launches" },
  { id: "agency", label: "Agency", description: "Client work and case studies" },
  { id: "personal-brand", label: "Personal Brand", description: "Creator and influencer content" },
  { id: "real-estate", label: "Real Estate", description: "Property tours and listings" },
];

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  // --- Marketing ---
  {
    id: "product-launch-hype",
    name: "Product Launch Hype",
    description: "Build excitement for a new product launch with fast cuts and bold visuals",
    category: "marketing",
    projectType: "social-ad",
    platform: "tiktok",
    duration: 30,
    style: "bold-dynamic",
    music: "upbeat",
    thumbnail: "from-red-600 to-orange-500",
    script: "Something big is coming. {{product_name}} is about to change {{industry}} forever. [PAUSE] Here's what makes it different... (VISUAL CUE: rapid feature montage) {{key_feature_1}}. {{key_feature_2}}. {{key_feature_3}}. Available {{launch_date}}. Get early access now.",
    sceneOutline: [
      { sceneNumber: 1, duration: "3s", description: "Dark screen with pulsing light, text builds letter by letter", textOverlay: "Something big is coming.", transition: "cut" },
      { sceneNumber: 2, duration: "4s", description: "Product reveal with dramatic zoom", textOverlay: "{{product_name}}", transition: "whip pan" },
      { sceneNumber: 3, duration: "6s", description: "Feature 1 showcase with motion graphics", textOverlay: "{{key_feature_1}}", transition: "slide left" },
      { sceneNumber: 4, duration: "6s", description: "Feature 2 showcase", textOverlay: "{{key_feature_2}}", transition: "slide left" },
      { sceneNumber: 5, duration: "6s", description: "Feature 3 showcase", textOverlay: "{{key_feature_3}}", transition: "zoom in" },
      { sceneNumber: 6, duration: "5s", description: "CTA screen with countdown element", textOverlay: "Get Early Access", transition: "dissolve" },
    ],
    tags: ["launch", "product", "hype", "announcement"],
  },
  {
    id: "before-after-transformation",
    name: "Before/After Transformation",
    description: "Show the transformation your product or service delivers",
    category: "marketing",
    projectType: "testimonial",
    platform: "instagram-reels",
    duration: 30,
    style: "modern-minimalist",
    music: "dramatic",
    thumbnail: "from-gray-600 to-purple-600",
    script: "This is what {{problem_area}} looked like before. [PAUSE] And this is what happened after {{product_name}}. (VISUAL CUE: split screen transformation) {{specific_result}} in just {{timeframe}}. Ready for your transformation?",
    sceneOutline: [
      { sceneNumber: 1, duration: "4s", description: "\"Before\" state — problem visualization", textOverlay: "Before", transition: "cut" },
      { sceneNumber: 2, duration: "3s", description: "Dramatic pause, screen wipe beginning", textOverlay: "", transition: "wipe" },
      { sceneNumber: 3, duration: "8s", description: "\"After\" state — transformation reveal", textOverlay: "After {{product_name}}", transition: "dissolve" },
      { sceneNumber: 4, duration: "7s", description: "Results and metrics showcase", textOverlay: "{{specific_result}}", transition: "slide up" },
      { sceneNumber: 5, duration: "4s", description: "Testimonial quote overlay", textOverlay: "\"Life-changing\"", transition: "fade" },
      { sceneNumber: 6, duration: "4s", description: "CTA with action button", textOverlay: "Start Your Transformation", transition: "zoom in" },
    ],
    tags: ["before-after", "transformation", "results", "testimonial"],
  },

  // --- Social Media ---
  {
    id: "tiktok-hook-listicle",
    name: "TikTok Hook Listicle",
    description: "\"3 things you didn't know about...\" viral format",
    category: "social-media",
    projectType: "social-ad",
    platform: "tiktok",
    duration: 15,
    style: "fun-playful",
    music: "upbeat",
    thumbnail: "from-cyan-500 to-violet-600",
    script: "3 things nobody tells you about {{topic}}. Number 1: {{fact_1}}. Number 2: {{fact_2}}. Number 3: {{fact_3}}. Follow for more {{topic}} tips.",
    sceneOutline: [
      { sceneNumber: 1, duration: "2s", description: "Hook text with animated count \"3\"", textOverlay: "3 things nobody tells you...", transition: "cut" },
      { sceneNumber: 2, duration: "4s", description: "Fact 1 with icon animation", textOverlay: "1. {{fact_1}}", transition: "slide up" },
      { sceneNumber: 3, duration: "4s", description: "Fact 2 with icon animation", textOverlay: "2. {{fact_2}}", transition: "slide up" },
      { sceneNumber: 4, duration: "3s", description: "Fact 3 — the big reveal", textOverlay: "3. {{fact_3}}", transition: "zoom in" },
      { sceneNumber: 5, duration: "2s", description: "Follow CTA with profile reference", textOverlay: "Follow for more!", transition: "fade" },
    ],
    tags: ["tiktok", "listicle", "viral", "hook", "tips"],
  },
  {
    id: "trending-react-video",
    name: "React / Response Video",
    description: "Trending reaction-style video with commentary overlay",
    category: "social-media",
    projectType: "social-ad",
    platform: "tiktok",
    duration: 15,
    style: "bold-dynamic",
    music: "dramatic",
    thumbnail: "from-yellow-500 to-red-500",
    script: "Wait... did {{subject}} really just {{action}}? Let me explain why this changes everything. [PAUSE] Here's what most people miss... {{insight}}. This is huge.",
    sceneOutline: [
      { sceneNumber: 1, duration: "2s", description: "Shock reaction frame, zoomed face/element", textOverlay: "Wait...", transition: "cut" },
      { sceneNumber: 2, duration: "4s", description: "Context clip or image with commentary", textOverlay: "{{subject}} just {{action}}", transition: "cut" },
      { sceneNumber: 3, duration: "5s", description: "Explanation with visual aids", textOverlay: "Here's why it matters", transition: "slide left" },
      { sceneNumber: 4, duration: "4s", description: "Key insight reveal", textOverlay: "{{insight}}", transition: "zoom in" },
    ],
    tags: ["reaction", "trending", "commentary", "viral"],
  },

  // --- E-Commerce ---
  {
    id: "product-showcase-360",
    name: "Product Showcase 360",
    description: "Cinematic product showcase with rotating views and detail shots",
    category: "e-commerce",
    projectType: "product-demo",
    platform: "instagram-reels",
    duration: 30,
    style: "elegant-luxury",
    music: "chill",
    thumbnail: "from-amber-500 to-yellow-600",
    script: "Introducing {{product_name}}. (VISUAL CUE: product rotation) Crafted with {{material}} for {{benefit_1}}. {{feature_1}} meets {{feature_2}}. Starting at ${{price}}. Link in bio.",
    sceneOutline: [
      { sceneNumber: 1, duration: "4s", description: "Product on pedestal, slow push in", textOverlay: "{{product_name}}", transition: "dissolve" },
      { sceneNumber: 2, duration: "5s", description: "360-degree rotation, detail textures visible", textOverlay: "", transition: "dissolve" },
      { sceneNumber: 3, duration: "5s", description: "Close-up detail shot 1", textOverlay: "{{feature_1}}", transition: "cut" },
      { sceneNumber: 4, duration: "5s", description: "Close-up detail shot 2", textOverlay: "{{feature_2}}", transition: "cut" },
      { sceneNumber: 5, duration: "5s", description: "Product in use / lifestyle context", textOverlay: "{{benefit_1}}", transition: "dissolve" },
      { sceneNumber: 6, duration: "6s", description: "Price reveal and CTA", textOverlay: "Starting at ${{price}}", transition: "fade" },
    ],
    tags: ["product", "showcase", "ecommerce", "luxury", "detail"],
  },

  // --- Education ---
  {
    id: "quick-tutorial-steps",
    name: "Quick Tutorial (3 Steps)",
    description: "Fast-paced how-to video with numbered steps",
    category: "education",
    projectType: "tutorial",
    platform: "youtube",
    duration: 60,
    style: "modern-minimalist",
    music: "chill",
    thumbnail: "from-blue-500 to-cyan-500",
    script: "Here's how to {{goal}} in 3 simple steps. Step 1: {{step_1_title}}. {{step_1_detail}}. Step 2: {{step_2_title}}. {{step_2_detail}}. Step 3: {{step_3_title}}. {{step_3_detail}}. And that's it! You've just learned how to {{goal}}.",
    sceneOutline: [
      { sceneNumber: 1, duration: "5s", description: "Title card with topic and \"3 Steps\" badge", textOverlay: "How to {{goal}}", transition: "fade" },
      { sceneNumber: 2, duration: "5s", description: "\"Step 1\" number animation", textOverlay: "Step 1", transition: "slide left" },
      { sceneNumber: 3, duration: "10s", description: "Step 1 demonstration with screen recording or illustration", textOverlay: "{{step_1_title}}", transition: "cut" },
      { sceneNumber: 4, duration: "5s", description: "\"Step 2\" number animation", textOverlay: "Step 2", transition: "slide left" },
      { sceneNumber: 5, duration: "10s", description: "Step 2 demonstration", textOverlay: "{{step_2_title}}", transition: "cut" },
      { sceneNumber: 6, duration: "5s", description: "\"Step 3\" number animation", textOverlay: "Step 3", transition: "slide left" },
      { sceneNumber: 7, duration: "10s", description: "Step 3 demonstration", textOverlay: "{{step_3_title}}", transition: "cut" },
      { sceneNumber: 8, duration: "5s", description: "Recap with all 3 steps listed", textOverlay: "Done!", transition: "zoom out" },
      { sceneNumber: 9, duration: "5s", description: "Subscribe CTA", textOverlay: "Subscribe for more tutorials", transition: "fade" },
    ],
    tags: ["tutorial", "how-to", "steps", "educational"],
  },

  // --- Startup ---
  {
    id: "startup-pitch-60",
    name: "60-Second Startup Pitch",
    description: "Investor-ready pitch deck video with problem-solution-traction flow",
    category: "startup",
    projectType: "brand-story",
    platform: "linkedin",
    duration: 60,
    style: "corporate-professional",
    music: "corporate",
    thumbnail: "from-indigo-600 to-blue-500",
    script: "{{industry}} has a ${{market_size}} problem. {{problem_statement}}. That's why we built {{company_name}}. (VISUAL CUE: product demo) {{solution_description}}. Our traction: {{traction_metric_1}}. {{traction_metric_2}}. The team: {{team_credentials}}. We're raising {{raise_amount}} to {{use_of_funds}}. Let's talk.",
    sceneOutline: [
      { sceneNumber: 1, duration: "5s", description: "Market size stat with dramatic number", textOverlay: "${{market_size}} Problem", transition: "fade" },
      { sceneNumber: 2, duration: "8s", description: "Problem visualization — pain points", textOverlay: "The Problem", transition: "slide left" },
      { sceneNumber: 3, duration: "10s", description: "Solution demo — product in action", textOverlay: "{{company_name}}", transition: "dissolve" },
      { sceneNumber: 4, duration: "8s", description: "Traction metrics with animated counters", textOverlay: "Traction", transition: "slide up" },
      { sceneNumber: 5, duration: "8s", description: "Team photos and credentials", textOverlay: "The Team", transition: "dissolve" },
      { sceneNumber: 6, duration: "8s", description: "Business model / revenue", textOverlay: "Business Model", transition: "slide left" },
      { sceneNumber: 7, duration: "8s", description: "Ask — raise amount and use of funds", textOverlay: "The Ask: {{raise_amount}}", transition: "fade" },
      { sceneNumber: 8, duration: "5s", description: "Contact info and CTA", textOverlay: "Let's Talk", transition: "zoom in" },
    ],
    tags: ["startup", "pitch", "investor", "fundraising"],
  },

  // --- Agency ---
  {
    id: "agency-case-study",
    name: "Agency Case Study",
    description: "Client success story with before/after metrics",
    category: "agency",
    projectType: "testimonial",
    platform: "linkedin",
    duration: 60,
    style: "corporate-professional",
    music: "corporate",
    thumbnail: "from-emerald-600 to-teal-500",
    script: "How we helped {{client_name}} achieve {{headline_result}}. The challenge: {{challenge}}. Our approach: {{approach}}. The results: {{result_1}}. {{result_2}}. {{result_3}}. Ready for results like these? Let's talk.",
    sceneOutline: [
      { sceneNumber: 1, duration: "5s", description: "Client logo with headline result stat", textOverlay: "{{headline_result}}", transition: "fade" },
      { sceneNumber: 2, duration: "10s", description: "Challenge description with visuals", textOverlay: "The Challenge", transition: "slide left" },
      { sceneNumber: 3, duration: "10s", description: "Strategy and approach overview", textOverlay: "Our Approach", transition: "dissolve" },
      { sceneNumber: 4, duration: "10s", description: "Implementation highlights", textOverlay: "The Process", transition: "slide left" },
      { sceneNumber: 5, duration: "10s", description: "Results with animated metric counters", textOverlay: "The Results", transition: "zoom in" },
      { sceneNumber: 6, duration: "8s", description: "Client testimonial quote", textOverlay: "\"{{testimonial_quote}}\"", transition: "dissolve" },
      { sceneNumber: 7, duration: "7s", description: "Agency CTA with contact info", textOverlay: "Your turn. Let's talk.", transition: "fade" },
    ],
    tags: ["agency", "case-study", "client", "results"],
  },

  // --- Personal Brand ---
  {
    id: "day-in-the-life",
    name: "Day in the Life",
    description: "\"A day in my life as a...\" trending content format",
    category: "personal-brand",
    projectType: "brand-story",
    platform: "tiktok",
    duration: 60,
    style: "cinematic",
    music: "chill",
    thumbnail: "from-rose-500 to-blue-700",
    script: "A day in my life as a {{role}}. {{morning_routine}}. {{work_highlight_1}}. {{work_highlight_2}}. {{afternoon_activity}}. {{evening_routine}}. And that's a wrap. Follow for more behind the scenes.",
    sceneOutline: [
      { sceneNumber: 1, duration: "5s", description: "Alarm clock / morning light, time stamp \"6:00 AM\"", textOverlay: "A day in my life as a {{role}}", transition: "fade" },
      { sceneNumber: 2, duration: "8s", description: "Morning routine montage", textOverlay: "Morning Routine", transition: "dissolve" },
      { sceneNumber: 3, duration: "12s", description: "Work environment, first highlight", textOverlay: "", transition: "cut" },
      { sceneNumber: 4, duration: "12s", description: "Second work highlight / meeting / creation", textOverlay: "", transition: "cut" },
      { sceneNumber: 5, duration: "10s", description: "Afternoon break / unique activity", textOverlay: "", transition: "dissolve" },
      { sceneNumber: 6, duration: "8s", description: "Evening wind-down", textOverlay: "", transition: "dissolve" },
      { sceneNumber: 7, duration: "5s", description: "Follow CTA with personality", textOverlay: "Follow for more BTS", transition: "fade" },
    ],
    tags: ["day-in-life", "vlog", "behind-scenes", "personal", "creator"],
  },

  // --- Real Estate ---
  {
    id: "property-tour-luxury",
    name: "Luxury Property Tour",
    description: "Cinematic property walkthrough with key features highlighted",
    category: "real-estate",
    projectType: "product-demo",
    platform: "youtube",
    duration: 90,
    style: "cinematic",
    music: "dramatic",
    thumbnail: "from-stone-500 to-amber-600",
    script: "Welcome to {{address}}. This stunning {{property_type}} offers {{sqft}} square feet of luxury living. (VISUAL CUE: drone exterior) {{exterior_feature}}. Step inside to discover {{interior_highlight_1}}. The kitchen features {{kitchen_feature}}. {{bedroom_count}} bedrooms, {{bathroom_count}} bathrooms. The primary suite: {{primary_suite_feature}}. Outdoor living: {{outdoor_feature}}. Listed at ${{price}}. Schedule your private showing today.",
    sceneOutline: [
      { sceneNumber: 1, duration: "8s", description: "Aerial drone shot approaching property", textOverlay: "{{address}}", transition: "dissolve" },
      { sceneNumber: 2, duration: "10s", description: "Exterior front view, slow tracking shot", textOverlay: "{{sqft}} sq ft", transition: "dissolve" },
      { sceneNumber: 3, duration: "10s", description: "Grand entrance / foyer reveal", textOverlay: "", transition: "dissolve" },
      { sceneNumber: 4, duration: "10s", description: "Living room / great room", textOverlay: "{{interior_highlight_1}}", transition: "pan" },
      { sceneNumber: 5, duration: "10s", description: "Kitchen showcase", textOverlay: "Gourmet Kitchen", transition: "dissolve" },
      { sceneNumber: 6, duration: "10s", description: "Primary suite walkthrough", textOverlay: "Primary Suite", transition: "dissolve" },
      { sceneNumber: 7, duration: "8s", description: "Additional bedrooms montage", textOverlay: "{{bedroom_count}} Bedrooms", transition: "cut" },
      { sceneNumber: 8, duration: "10s", description: "Outdoor space / pool / patio", textOverlay: "Outdoor Living", transition: "dissolve" },
      { sceneNumber: 9, duration: "8s", description: "Neighborhood / aerial pullback", textOverlay: "", transition: "dissolve" },
      { sceneNumber: 10, duration: "6s", description: "Price card and contact info", textOverlay: "Listed at ${{price}}", transition: "fade" },
    ],
    tags: ["real-estate", "property", "luxury", "tour", "listing"],
  },

  // --- E-Commerce ---
  {
    id: "flash-sale-countdown",
    name: "Flash Sale Countdown",
    description: "Urgent flash sale promo with countdown timer and product highlights",
    category: "e-commerce",
    projectType: "social-ad",
    platform: "instagram-reels",
    duration: 15,
    style: "bold-dynamic",
    music: "upbeat",
    thumbnail: "from-red-500 to-blue-600",
    script: "FLASH SALE! {{discount}}% OFF everything! {{product_1}}. {{product_2}}. {{product_3}}. Only {{time_limit}} hours left. Shop now before it's gone!",
    sceneOutline: [
      { sceneNumber: 1, duration: "2s", description: "\"FLASH SALE\" text explosion with alarm animation", textOverlay: "FLASH SALE", transition: "cut" },
      { sceneNumber: 2, duration: "3s", description: "Product 1 with price slash animation", textOverlay: "{{discount}}% OFF", transition: "whip pan" },
      { sceneNumber: 3, duration: "3s", description: "Product 2 with price slash", textOverlay: "{{product_2}}", transition: "whip pan" },
      { sceneNumber: 4, duration: "3s", description: "Product 3 with price slash", textOverlay: "{{product_3}}", transition: "whip pan" },
      { sceneNumber: 5, duration: "4s", description: "Countdown timer + \"Shop Now\" CTA", textOverlay: "{{time_limit}} Hours Left!", transition: "zoom in" },
    ],
    tags: ["sale", "flash-sale", "discount", "urgent", "ecommerce"],
  },

  // --- Education ---
  {
    id: "myth-vs-fact",
    name: "Myth vs. Fact",
    description: "Debunk common myths with satisfying reveals",
    category: "education",
    projectType: "explainer",
    platform: "tiktok",
    duration: 30,
    style: "fun-playful",
    music: "upbeat",
    thumbnail: "from-green-500 to-emerald-500",
    script: "Myth vs. Fact about {{topic}}. Myth: {{myth_1}}. FACT: {{fact_1}}. Myth: {{myth_2}}. FACT: {{fact_2}}. Myth: {{myth_3}}. FACT: {{fact_3}}. Now you know! Share this with someone who needs to hear it.",
    sceneOutline: [
      { sceneNumber: 1, duration: "3s", description: "\"MYTH vs FACT\" title card, split screen red/green", textOverlay: "Myth vs. Fact", transition: "cut" },
      { sceneNumber: 2, duration: "3s", description: "Myth 1 on red background with X icon", textOverlay: "MYTH: {{myth_1}}", transition: "slide left" },
      { sceneNumber: 3, duration: "4s", description: "Fact 1 on green background with check icon", textOverlay: "FACT: {{fact_1}}", transition: "slide left" },
      { sceneNumber: 4, duration: "3s", description: "Myth 2 on red background", textOverlay: "MYTH: {{myth_2}}", transition: "slide left" },
      { sceneNumber: 5, duration: "4s", description: "Fact 2 on green background", textOverlay: "FACT: {{fact_2}}", transition: "slide left" },
      { sceneNumber: 6, duration: "3s", description: "Myth 3 on red background", textOverlay: "MYTH: {{myth_3}}", transition: "slide left" },
      { sceneNumber: 7, duration: "4s", description: "Fact 3 on green background", textOverlay: "FACT: {{fact_3}}", transition: "slide left" },
      { sceneNumber: 8, duration: "6s", description: "\"Now you know!\" + share CTA", textOverlay: "Share this!", transition: "zoom in" },
    ],
    tags: ["myth", "fact", "debunk", "educational", "viral"],
  },
];

/**
 * Get templates by category.
 */
export function getTemplatesByCategory(category: VideoTemplateCategory): VideoTemplate[] {
  return VIDEO_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get template by ID.
 */
export function getTemplateById(id: string): VideoTemplate | undefined {
  return VIDEO_TEMPLATES.find((t) => t.id === id);
}

/**
 * Search templates by query (matches name, description, tags).
 */
export function searchTemplates(query: string): VideoTemplate[] {
  const q = query.toLowerCase();
  return VIDEO_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.includes(q))
  );
}
