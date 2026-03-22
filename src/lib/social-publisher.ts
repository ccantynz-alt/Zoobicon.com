// Cross-Platform Social Publisher — localStorage-backed with mock data
// Different from social-publish.ts which handles share URLs for deployed sites

export interface SocialPost {
  id: string;
  content: string;
  platforms: string[];
  platformVersions: Record<string, string>;
  mediaUrls?: string[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledAt?: string;
  publishedAt?: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  };
}

export interface ConnectedAccount {
  platform: string;
  username: string;
  followers: number;
  connected: boolean;
}

export interface ContentIdea {
  topic: string;
  hook: string;
  platforms: string[];
}

const STORAGE_KEY = "zoobicon_publisher_posts";

// ---------- Mock data ----------

const MOCK_POSTS: SocialPost[] = [
  {
    id: "p1",
    content: "Just launched our new AI-powered website builder. Build a professional site in 90 seconds from a single prompt. No coding required.",
    platforms: ["twitter", "linkedin"],
    platformVersions: {
      twitter: "Just launched our new AI-powered website builder. Build a professional site in 90 seconds from a single prompt. No coding required. #AI #WebDev #NoCode",
      linkedin: "Excited to announce our AI-powered website builder.\n\nWhat used to take weeks now takes 90 seconds. Describe what you want, and our 7-agent AI pipeline handles everything: strategy, design, copywriting, development, SEO, and deployment.\n\nThe future of web development is here.\n\n#AI #WebDevelopment #Innovation",
    },
    status: "published",
    publishedAt: "2026-03-22T09:15:00Z",
    engagement: { likes: 342, comments: 47, shares: 89, impressions: 12400 },
  },
  {
    id: "p2",
    content: "5 reasons why AI website builders are replacing traditional web development in 2026. Thread below.",
    platforms: ["twitter", "linkedin", "facebook"],
    platformVersions: {
      twitter: "5 reasons why AI website builders are replacing traditional web development in 2026. Thread below. (1/6)",
      linkedin: "The web development industry is undergoing a fundamental shift. Here are 5 reasons AI website builders are becoming the new standard:\n\n1. Speed: 90 seconds vs 2 weeks\n2. Cost: $49/mo vs $5,000+ per project\n3. Quality: Opus-level AI produces agency-quality output\n4. Iteration: Change anything with a single prompt\n5. Scale: Build 50 sites a month, not 2\n\nWhat's your take? Is AI replacing developers or empowering them?",
      facebook: "5 reasons why AI website builders are taking over in 2026. Speed, cost, quality, iteration, and scale. What do you think?",
    },
    status: "published",
    publishedAt: "2026-03-21T14:30:00Z",
    engagement: { likes: 891, comments: 123, shares: 234, impressions: 34200 },
  },
  {
    id: "p3",
    content: "Behind the scenes: How our 7-agent AI pipeline builds a complete website. Strategist, Brand Designer, Copywriter, Architect, Developer, SEO Agent, Animation Agent.",
    platforms: ["twitter", "instagram", "tiktok"],
    platformVersions: {
      twitter: "Behind the scenes: How our 7-agent AI pipeline builds a complete website.\n\nStrategist -> Brand Designer -> Copywriter -> Architect -> Developer -> SEO Agent -> Animation Agent\n\nAll in 95 seconds. #BuildWithAI",
      instagram: "Behind the scenes of our AI website builder.\n\n7 specialized AI agents work together to build your site:\n\n1. Strategist - analyzes your brief\n2. Brand Designer - creates visual identity\n3. Copywriter - writes compelling copy\n4. Architect - plans the structure\n5. Developer - builds the code\n6. SEO Agent - optimizes for search\n7. Animation Agent - adds interactions\n\nAll in under 2 minutes.\n\n#ai #webdesign #nocode #automation #zoobicon #webdevelopment #tech #startup #saas #builtwithAI #coding #developer #design #ux #ui #frontend",
      tiktok: "POV: You watch 7 AI agents build a website in 90 seconds #ai #webdesign #coding #nocode #builtwithAI",
    },
    status: "published",
    publishedAt: "2026-03-20T16:45:00Z",
    engagement: { likes: 2103, comments: 312, shares: 567, impressions: 89300 },
  },
  {
    id: "p4",
    content: "New feature: Multi-page site generation. Describe your business, get a complete 6-page website with consistent design across all pages.",
    platforms: ["twitter", "linkedin"],
    platformVersions: {
      twitter: "NEW: Multi-page site generation is live.\n\nDescribe your business -> get a complete 6-page website with:\n- Consistent design system\n- Shared navigation\n- SEO-optimized pages\n- Mobile responsive\n\nAll generated in one go. #AI #WebDev",
      linkedin: "We just shipped multi-page site generation.\n\nOne prompt. Six pages. Consistent design system across every page.\n\nOur AI generates the entire site architecture, designs a shared visual language, writes unique copy for each page, and deploys everything to a live URL.\n\nThis is what 7 specialized AI agents working in parallel can achieve.\n\nTry it free at zoobicon.com/builder",
    },
    status: "published",
    publishedAt: "2026-03-19T11:00:00Z",
    engagement: { likes: 456, comments: 67, shares: 134, impressions: 18900 },
  },
  {
    id: "p5",
    content: "Customer spotlight: A yoga instructor built her entire website in 2 minutes. Online booking, class schedule, instructor bios, testimonials. All from one prompt.",
    platforms: ["instagram", "facebook", "linkedin"],
    platformVersions: {
      instagram: "Customer spotlight: A yoga instructor built her ENTIRE website in 2 minutes.\n\nOnline booking. Class schedule. Instructor bios. Testimonials. Mobile responsive. SEO optimized.\n\nAll from one prompt.\n\nThis is the power of AI-driven web design.\n\n#yoga #smallbusiness #websitedesign #ai #nocode #zoobicon #entrepreneur #yogastudio #webdesign #business",
      facebook: "Love this story: A yoga instructor used our AI builder to create her entire website in just 2 minutes. Online booking, class schedule, instructor bios, testimonials - all from a single prompt. Small businesses deserve great websites too.",
      linkedin: "Customer Success Story: A yoga instructor with zero technical experience created a complete, professional website in 2 minutes.\n\nThe site includes:\n- Online class booking system\n- Instructor profiles\n- Class schedule with filtering\n- Student testimonials\n- Mobile-responsive design\n- SEO optimization\n\nAll from a single text prompt. AI is democratizing web development, and the results speak for themselves.",
    },
    status: "published",
    publishedAt: "2026-03-18T13:20:00Z",
    engagement: { likes: 734, comments: 89, shares: 201, impressions: 27600 },
  },
  {
    id: "p6",
    content: "AI vs. Traditional Web Dev: We built the same site both ways. AI: 95 seconds, $0. Traditional: 3 weeks, $4,500. Results comparison inside.",
    platforms: ["twitter", "reddit"],
    platformVersions: {
      twitter: "AI vs. Traditional Web Dev:\n\nSame site. Same requirements.\n\nAI: 95 seconds, $0\nTraditional: 3 weeks, $4,500\n\nBoth produced professional, responsive, SEO-optimized sites.\n\nThe difference? One was instant.\n\n#AI #WebDev",
      reddit: "[Comparison] We built the exact same website using AI (95 seconds) vs traditional development (3 weeks). Here are the results and honest comparison of quality, performance, and maintainability.",
    },
    status: "published",
    publishedAt: "2026-03-17T10:00:00Z",
    engagement: { likes: 1567, comments: 234, shares: 445, impressions: 56700 },
  },
  {
    id: "p7",
    content: "Pro tip: Use our 43 specialized generators for industry-specific sites. Restaurant, law firm, portfolio, SaaS landing page - each has custom AI prompts tuned for that industry.",
    platforms: ["twitter", "linkedin", "instagram"],
    platformVersions: {
      twitter: "Pro tip: We have 43 specialized generators.\n\nRestaurant? Law firm? Portfolio? SaaS landing page?\n\nEach one has custom AI prompts tuned for that specific industry.\n\nStop using generic builders. Use one that understands your business.",
      linkedin: "Did you know we offer 43 specialized website generators?\n\nEach generator is pre-tuned with industry-specific AI prompts, design patterns, and content structures.\n\nFrom restaurants to law firms, from SaaS landing pages to e-commerce stores - every industry gets purpose-built AI generation.\n\nGeneric builders give generic results. Specialized AI gives professional results.",
      instagram: "43 specialized AI generators for every industry.\n\nRestaurant. Law firm. Portfolio. SaaS. E-commerce. Blog. Real estate. Agency. Nonprofit. Education.\n\nEach one tuned with industry-specific AI prompts.\n\nGeneric builders give generic results.\nSpecialized AI gives professional results.\n\n#ai #webdesign #nocode #saas #startup #entrepreneur #smallbusiness #webdevelopment #zoobicon #tech",
    },
    status: "published",
    publishedAt: "2026-03-16T15:30:00Z",
    engagement: { likes: 289, comments: 45, shares: 78, impressions: 11200 },
  },
  {
    id: "p8",
    content: "Shipping fast this week: Visual editor improvements, section library with 50+ pre-built blocks, and one-click WordPress export.",
    platforms: ["twitter"],
    platformVersions: {
      twitter: "Shipping fast this week:\n\n- Visual editor improvements (click-to-select, property editor)\n- Section library with 50+ pre-built blocks\n- One-click WordPress export\n\nBuilding in public. #buildinpublic #AI #WebDev",
    },
    status: "published",
    publishedAt: "2026-03-15T09:00:00Z",
    engagement: { likes: 198, comments: 34, shares: 56, impressions: 8900 },
  },
  {
    id: "p9",
    content: "The agency plan is here. White-label AI website building for your clients. Custom branding, client portal, bulk generation, approval workflows.",
    platforms: ["linkedin", "twitter", "facebook"],
    platformVersions: {
      linkedin: "Announcing our Agency Plan.\n\nWhite-label AI website building for agencies and freelancers:\n\n- Custom branding on every site\n- Client portal with approval workflows\n- Bulk generation (50 sites/month)\n- Quota tracking and usage analytics\n- API access for programmatic generation\n\nReplace 6 subscriptions with one platform. $99/month.\n\nBuilt for agencies that want to scale without scaling headcount.",
      twitter: "The Agency Plan is live.\n\nWhite-label AI website building:\n- Custom branding\n- Client portal\n- Bulk generation\n- Approval workflows\n- API access\n\n$99/mo. Replace $500+ in tools.\n\n#agency #webdev #AI",
      facebook: "Big launch: Our Agency Plan lets freelancers and agencies build client websites with AI. White-label branding, client portals, bulk generation. Everything you need to scale your web design business.",
    },
    status: "published",
    publishedAt: "2026-03-14T12:00:00Z",
    engagement: { likes: 567, comments: 89, shares: 167, impressions: 23400 },
  },
  {
    id: "p10",
    content: "Full-stack app generation is now live. Describe your app, get a complete database schema, API routes, and CRUD frontend. No backend experience needed.",
    platforms: ["twitter", "reddit", "linkedin"],
    platformVersions: {
      twitter: "Full-stack app generation is NOW LIVE.\n\nDescribe your app ->\n- Database schema (Postgres)\n- RESTful API routes\n- CRUD frontend with forms, tables, modals\n\nAll generated. All working. Deploy instantly.\n\n#fullstack #AI #WebDev",
      reddit: "[Launch] Full-stack app generation: Describe your app, get a complete database schema, API routes, and CRUD frontend. From prompt to deployed full-stack app in under 2 minutes.",
      linkedin: "We just shipped full-stack app generation.\n\nDescribe your application in plain English. Our AI generates:\n\n- PostgreSQL database schema\n- RESTful API endpoints (Next.js handlers)\n- Complete frontend with CRUD operations\n- Forms, tables, modals, search, filtering\n\nFrom a single prompt to a deployed, working application. No backend experience required.\n\nThis changes who can build software.",
    },
    status: "published",
    publishedAt: "2026-03-13T10:30:00Z",
    engagement: { likes: 1234, comments: 189, shares: 345, impressions: 45600 },
  },
  {
    id: "p11",
    content: "Weekend project: Built an e-commerce store with AI. Shopping cart, checkout, product search, reviews, discount codes. All working. All from one prompt.",
    platforms: ["twitter", "tiktok"],
    platformVersions: {
      twitter: "Weekend project:\n\nBuilt a complete e-commerce store with AI.\n\n- Shopping cart\n- Checkout flow\n- Product search & filters\n- Customer reviews\n- Discount codes\n- Stock tracking\n\nAll from one prompt. All working.\n\n#ecommerce #AI #buildinpublic",
      tiktok: "Built an entire e-commerce store with AI in under 2 minutes. Cart, checkout, reviews, everything. #ecommerce #ai #coding #nocode #builtwithAI",
    },
    status: "published",
    publishedAt: "2026-03-12T17:00:00Z",
    engagement: { likes: 876, comments: 134, shares: 223, impressions: 34500 },
  },
  {
    id: "p12",
    content: "Scheduled: Tomorrow's launch announcement for our marketplace with 20+ add-ons.",
    platforms: ["twitter", "linkedin"],
    platformVersions: {
      twitter: "Tomorrow: Launching our Marketplace with 20+ add-ons for AI-generated sites. Templates, AI agents, integrations, analytics tools. Stay tuned.",
      linkedin: "Excited to announce that tomorrow we're launching the Zoobicon Marketplace - a curated collection of 20+ add-ons to enhance your AI-generated websites. From premium templates to advanced AI agents, analytics tools to e-commerce integrations.",
    },
    status: "scheduled",
    scheduledAt: "2026-03-23T09:00:00Z",
    engagement: { likes: 0, comments: 0, shares: 0, impressions: 0 },
  },
];

const MOCK_ACCOUNTS: ConnectedAccount[] = [
  { platform: "twitter", username: "", followers: 0, connected: false },
  { platform: "linkedin", username: "", followers: 0, connected: false },
  { platform: "instagram", username: "", followers: 0, connected: false },
  { platform: "tiktok", username: "", followers: 0, connected: false },
  { platform: "facebook", username: "", followers: 0, connected: false },
  { platform: "reddit", username: "", followers: 0, connected: false },
];

const CONTENT_IDEAS: ContentIdea[] = [
  {
    topic: "Before/After website transformations",
    hook: "Show a client's old website vs. the AI-generated replacement. Visual proof converts better than any copy.",
    platforms: ["instagram", "tiktok", "twitter"],
  },
  {
    topic: "Speed challenge: Build a complete website live",
    hook: "Record yourself building a website in real-time. The 90-second timer creates urgency and disbelief.",
    platforms: ["tiktok", "instagram", "twitter"],
  },
  {
    topic: "Industry-specific AI generation tips",
    hook: "Share the exact prompts that generate the best results for restaurants, law firms, or e-commerce stores.",
    platforms: ["twitter", "linkedin", "reddit"],
  },
  {
    topic: "The economics of AI web development",
    hook: "Break down the cost comparison: $49/month for unlimited AI builds vs. $5,000+ per traditional project.",
    platforms: ["linkedin", "twitter", "facebook"],
  },
  {
    topic: "Behind the scenes: Multi-agent AI architecture",
    hook: "Explain how 7 specialized AI agents collaborate to build a website. Technical content performs well on dev communities.",
    platforms: ["twitter", "reddit", "linkedin"],
  },
];

// ---------- Public API ----------

export function getPosts(): SocialPost[] {
  if (typeof window === "undefined") return MOCK_POSTS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as SocialPost[];
  } catch {
    // fall through
  }
  // Seed with mock data
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_POSTS));
  return MOCK_POSTS;
}

export function createPost(post: Partial<SocialPost>): SocialPost {
  const posts = getPosts();
  const newPost: SocialPost = {
    id: `p${Date.now()}`,
    content: post.content || "",
    platforms: post.platforms || [],
    platformVersions: post.platformVersions || {},
    mediaUrls: post.mediaUrls || [],
    status: post.status || "draft",
    scheduledAt: post.scheduledAt,
    publishedAt: post.status === "published" ? new Date().toISOString() : undefined,
    engagement: { likes: 0, comments: 0, shares: 0, impressions: 0 },
  };
  posts.unshift(newPost);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }
  return newPost;
}

export function schedulePost(postId: string, scheduledAt: string): void {
  const posts = getPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.status = "scheduled";
    post.scheduledAt = scheduledAt;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    }
  }
}

export function getConnectedAccounts(): ConnectedAccount[] {
  return MOCK_ACCOUNTS;
}

export function getContentIdeas(industry?: string): ContentIdea[] {
  // In a real implementation, this would call an AI model
  void industry;
  return CONTENT_IDEAS;
}

export function reformatForPlatform(content: string, platform: string): string {
  switch (platform) {
    case "twitter":
      // Shorten, add hashtags
      return content.length > 250
        ? content.slice(0, 250).trim() + "... #AI #WebDev"
        : content + " #AI #WebDev";
    case "linkedin":
      // Professional, add line breaks for readability
      return (
        content
          .split(". ")
          .join(".\n\n") + "\n\n#AI #WebDevelopment #Innovation #Technology"
      );
    case "instagram":
      // Add emojis and 30 hashtags
      return (
        content +
        "\n\n#ai #webdesign #nocode #automation #zoobicon #webdevelopment #tech #startup #saas #builtwithAI #coding #developer #design #ux #ui #frontend #backend #fullstack #javascript #react #nextjs #typescript #css #html #creativity #digitalmarketing #business #entrepreneur #smallbusiness #innovation"
      );
    case "tiktok":
      // Very short, hook-first
      return content.length > 150
        ? content.slice(0, 150).trim() + " #ai #coding #webdesign #nocode"
        : content + " #ai #coding #webdesign #nocode";
    case "facebook":
      // Conversational
      return content;
    case "reddit":
      // Informational, no emojis
      return `[Discussion] ${content}`;
    default:
      return content;
  }
}

export function getPublisherStats(): {
  published: number;
  reach: number;
  engagement: number;
  platforms: number;
} {
  const posts = getPosts();
  const published = posts.filter((p) => p.status === "published");
  const totalReach = published.reduce((sum, p) => sum + p.engagement.impressions, 0);
  const totalEngagement = published.reduce(
    (sum, p) => sum + p.engagement.likes + p.engagement.comments + p.engagement.shares,
    0
  );
  const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
  const connectedPlatforms = MOCK_ACCOUNTS.filter((a) => a.connected).length;

  return {
    published: published.length,
    reach: totalReach,
    engagement: Math.round(engagementRate * 10) / 10,
    platforms: connectedPlatforms,
  };
}

export function generateHashtags(content: string): string[] {
  // Simulated AI hashtag generation based on content keywords
  const keywords = content.toLowerCase();
  const hashtags: string[] = ["#AI", "#WebDev"];

  if (keywords.includes("website") || keywords.includes("site"))
    hashtags.push("#WebDesign", "#NoCode");
  if (keywords.includes("business") || keywords.includes("client"))
    hashtags.push("#SmallBusiness", "#Entrepreneur");
  if (keywords.includes("ecommerce") || keywords.includes("store"))
    hashtags.push("#Ecommerce", "#OnlineStore");
  if (keywords.includes("agency") || keywords.includes("freelance"))
    hashtags.push("#Agency", "#Freelance");
  if (keywords.includes("seo") || keywords.includes("search"))
    hashtags.push("#SEO", "#DigitalMarketing");
  if (keywords.includes("design") || keywords.includes("visual"))
    hashtags.push("#Design", "#UX");
  if (keywords.includes("fast") || keywords.includes("speed") || keywords.includes("second"))
    hashtags.push("#Speed", "#Automation");
  if (keywords.includes("launch") || keywords.includes("ship"))
    hashtags.push("#BuildInPublic", "#ShipIt");

  hashtags.push("#Zoobicon", "#BuildWithAI", "#Tech", "#Innovation");
  return [...new Set(hashtags)].slice(0, 15);
}

export function makeViral(content: string): string {
  const hooks = [
    "This is going to change everything.",
    "Stop scrolling. You need to see this.",
    "I can't believe this actually works.",
    "This took me 90 seconds. It used to take 3 weeks.",
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];
  const cta = "\n\nBookmark this. You'll thank me later.";
  return `${hook}\n\n${content}${cta}`;
}

export function professionalize(content: string): string {
  // Transform casual content into LinkedIn-ready professional tone
  let result = content
    .replace(/!/g, ".")
    .replace(/lol|lmao|haha/gi, "")
    .replace(/gonna/gi, "going to")
    .replace(/wanna/gi, "want to")
    .replace(/can't/gi, "cannot")
    .replace(/don't/gi, "do not")
    .replace(/won't/gi, "will not")
    .trim();

  if (!result.startsWith("I ") && !result.startsWith("We ") && !result.startsWith("The ")) {
    result = "I wanted to share something important.\n\n" + result;
  }

  result += "\n\nI'd love to hear your thoughts on this. What's been your experience?";
  return result;
}
