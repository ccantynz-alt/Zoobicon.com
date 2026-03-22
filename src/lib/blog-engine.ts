/* ─── Blog Engine — localStorage MVP with rich mock data ─── */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  body: string;
  metaDescription: string;
  tags: string[];
  status: "published" | "draft" | "scheduled";
  publishedAt?: string;
  scheduledAt?: string;
  views: number;
  seoScore: number;
  featuredImage?: string;
  tone?: string;
  createdAt: string;
}

export interface KeywordRank {
  keyword: string;
  position: number;
  change: number;
  url: string;
}

export interface BlogStats {
  totalPosts: number;
  totalViews: number;
  avgSeoScore: number;
  impressions: number;
}

export interface SocialPosts {
  twitter: string;
  linkedin: string;
  instagram: string;
}

const STORAGE_KEY = "zoobicon_blog_posts";

/* ─── mock posts ─── */
const MOCK_POSTS: BlogPost[] = [
  {
    id: "bp-001",
    title: "How AI Is Revolutionizing Web Design in 2026",
    slug: "ai-revolutionizing-web-design-2026",
    body: `<h2>The New Era of Web Design</h2>
<p>Artificial intelligence has fundamentally changed how websites are built. What once took weeks of design iterations, coding, and testing can now be accomplished in under two minutes. The implications for businesses, freelancers, and agencies are profound.</p>

<h3>From Prompt to Production</h3>
<p>Modern AI website builders use <strong>multi-agent pipelines</strong> where specialized AI models collaborate on different aspects of the build process:</p>
<ul>
<li><strong>Strategy agents</strong> analyze the business brief and define positioning</li>
<li><strong>Design agents</strong> create cohesive visual systems with typography and color palettes</li>
<li><strong>Content agents</strong> write compelling copy tailored to the target audience</li>
<li><strong>Developer agents</strong> produce clean, production-ready code</li>
</ul>

<h3>What This Means for Your Business</h3>
<p>The barrier to having a professional web presence has effectively been eliminated. Small businesses that previously couldn't afford custom websites now have access to the same quality output as enterprise companies.</p>

<p>The key advantage isn't just speed — it's <strong>iteration velocity</strong>. You can generate, test, and refine multiple versions of your site in the time it used to take to get a single mockup approved.</p>

<h3>Looking Ahead</h3>
<p>By the end of 2026, we expect AI-generated websites to account for over 30% of new sites launched. The technology is only getting faster and more capable.</p>`,
    metaDescription: "Discover how AI website builders are transforming web design in 2026 with multi-agent pipelines, instant generation, and production-ready output.",
    tags: ["AI", "Web Design", "Technology", "2026 Trends"],
    status: "published",
    publishedAt: "2026-03-15T10:00:00Z",
    views: 2847,
    seoScore: 92,
    featuredImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
    tone: "Professional",
    createdAt: "2026-03-14T08:30:00Z",
  },
  {
    id: "bp-002",
    title: "10 Website Design Trends That Will Dominate 2026",
    slug: "website-design-trends-2026",
    body: `<h2>What's Shaping the Web This Year</h2>
<p>Every year brings new design philosophies, and 2026 is no exception. Here are the ten trends that are defining the best websites being built right now.</p>

<h3>1. Cinematic Scroll Experiences</h3>
<p>Scroll-triggered animations have matured from gimmick to standard. Sites now tell stories as users scroll, with parallax layers, pinned sections, and reveal animations creating an immersive narrative.</p>

<h3>2. AI-Personalized Layouts</h3>
<p>Websites that adapt their layout and content based on visitor behavior, time of day, and referral source. Not just A/B testing — <strong>real-time personalization</strong>.</p>

<h3>3. Warm Minimalism</h3>
<p>The cold, clinical minimalism of previous years is being replaced by warmer color palettes, organic shapes, and textured backgrounds that feel approachable.</p>

<h3>4. Micro-Interaction Everything</h3>
<p>Every hover, click, and scroll triggers subtle feedback. Buttons breathe, cards tilt with parallax, and icons animate on interaction.</p>

<h3>5. Variable Font Artistry</h3>
<p>Variable fonts enable weight and width animations that create dynamic, attention-grabbing headlines.</p>

<h3>6. Glassmorphism 2.0</h3>
<p>Frosted glass effects with better performance and accessibility.</p>

<h3>7. Dark Mode by Default</h3>
<p>Dark themes are now the starting point, not an afterthought.</p>

<h3>8. 3D Without the Load Time</h3>
<p>Spline and Three.js optimizations make 3D elements viable for production sites.</p>

<h3>9. Voice-First Navigation</h3>
<p>Voice commands as a primary navigation method, especially on mobile.</p>

<h3>10. Sustainable Web Design</h3>
<p>Smaller payloads, green hosting, and carbon-aware designs are becoming selling points.</p>`,
    metaDescription: "Explore the 10 biggest website design trends for 2026, from cinematic scroll experiences to AI personalization and sustainable web design.",
    tags: ["Design Trends", "Web Design", "UX", "2026"],
    status: "published",
    publishedAt: "2026-03-12T14:00:00Z",
    views: 4123,
    seoScore: 88,
    featuredImage: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80",
    tone: "Casual",
    createdAt: "2026-03-11T16:00:00Z",
  },
  {
    id: "bp-003",
    title: "SEO in the Age of AI: What Still Matters",
    slug: "seo-age-of-ai",
    body: `<h2>SEO Isn't Dead — It's Evolved</h2>
<p>With AI-generated content flooding the web, search engines have adapted their algorithms dramatically. Here's what still moves the needle for rankings in 2026.</p>

<h3>Content Quality Over Quantity</h3>
<p>Google's helpful content system has become sophisticated enough to distinguish between <strong>genuinely useful content</strong> and AI-generated filler. The key differentiator? Original insights, real data, and authentic expertise.</p>

<h3>Technical SEO Is Non-Negotiable</h3>
<p>Core Web Vitals, schema markup, and proper HTML semantics remain critical ranking factors. AI builders that produce clean, semantic HTML have an advantage.</p>

<h3>Internal Linking Strategy</h3>
<p>Building topical authority through strategic internal linking is more important than ever. Every blog post should link to 3-5 related posts on your site.</p>

<h3>The New Ranking Factors</h3>
<ul>
<li><strong>E-E-A-T signals</strong> — Experience, Expertise, Authoritativeness, Trustworthiness</li>
<li><strong>Engagement metrics</strong> — Time on page, scroll depth, return visits</li>
<li><strong>Freshness</strong> — Regular updates signal an active, maintained site</li>
<li><strong>Multi-format content</strong> — Posts with video, images, and interactive elements rank higher</li>
</ul>`,
    metaDescription: "Learn what SEO strategies still work in 2026 as AI transforms content creation. Focus on quality, technical SEO, and authentic expertise.",
    tags: ["SEO", "AI", "Content Strategy", "Google"],
    status: "published",
    publishedAt: "2026-03-08T09:00:00Z",
    views: 1956,
    seoScore: 95,
    featuredImage: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&q=80",
    tone: "Professional",
    createdAt: "2026-03-07T11:00:00Z",
  },
  {
    id: "bp-004",
    title: "Why Every Small Business Needs a Website in 2026",
    slug: "small-business-website-2026",
    body: `<h2>The Digital Storefront Is No Longer Optional</h2>
<p>In 2026, not having a website is like not having a phone number in the 1990s. Yet 27% of small businesses still operate without one. Here's why that needs to change — and why it's never been easier.</p>

<h3>The Cost Argument Is Gone</h3>
<p>AI website builders have eliminated the cost barrier. A professional, mobile-responsive website can be generated in minutes for less than the cost of a single print ad.</p>

<h3>Your Customers Expect It</h3>
<p>81% of consumers research businesses online before making a purchase decision. Without a website, you're invisible to the majority of potential customers.</p>

<h3>Local SEO Requires It</h3>
<p>Google Maps and local search results heavily favor businesses with websites. A Google Business Profile linked to a quality website ranks significantly higher.</p>`,
    metaDescription: "27% of small businesses still don't have a website. Learn why a professional web presence is essential in 2026 and how AI makes it affordable.",
    tags: ["Small Business", "Websites", "Local SEO", "Marketing"],
    status: "published",
    publishedAt: "2026-03-05T11:30:00Z",
    views: 3412,
    seoScore: 84,
    tone: "Persuasive",
    createdAt: "2026-03-04T09:00:00Z",
  },
  {
    id: "bp-005",
    title: "The Complete Guide to E-Commerce Website Features",
    slug: "ecommerce-website-features-guide",
    body: `<h2>Building an Online Store That Converts</h2>
<p>A beautiful product page isn't enough. Modern e-commerce sites need a specific set of features to compete. Here's your complete checklist.</p>

<h3>Essential Features</h3>
<ul>
<li><strong>Product search with filters</strong> — Category, price range, ratings, availability</li>
<li><strong>Shopping cart persistence</strong> — Cart survives browser close (localStorage minimum)</li>
<li><strong>Guest checkout</strong> — 23% of users abandon carts when forced to create an account</li>
<li><strong>Mobile-first design</strong> — 72% of e-commerce traffic is mobile</li>
<li><strong>Multiple payment methods</strong> — Cards, Apple Pay, Google Pay, Buy Now Pay Later</li>
</ul>

<h3>Conversion Boosters</h3>
<ul>
<li><strong>Urgency indicators</strong> — "Only 3 left" stock badges</li>
<li><strong>Social proof</strong> — Star ratings, review counts, "X people bought this today"</li>
<li><strong>Discount codes</strong> — First-purchase incentives</li>
<li><strong>Wishlist</strong> — Save for later functionality</li>
</ul>`,
    metaDescription: "The complete checklist of e-commerce website features you need in 2026, from search filters and cart persistence to conversion-boosting urgency indicators.",
    tags: ["E-Commerce", "Web Development", "Conversion", "Online Store"],
    status: "published",
    publishedAt: "2026-03-01T08:00:00Z",
    views: 2190,
    seoScore: 79,
    tone: "Technical",
    createdAt: "2026-02-28T14:00:00Z",
  },
  {
    id: "bp-006",
    title: "How to Write Website Copy That Converts",
    slug: "website-copy-that-converts",
    body: `<h2>Words That Sell</h2>
<p>The difference between a website that converts at 1% and one that converts at 5% often comes down to copy. Here's how to write words that turn visitors into customers.</p>

<h3>Lead with Benefits, Not Features</h3>
<p>Don't say "Our platform uses AI." Say "Build your website in 90 seconds." Features tell, benefits sell.</p>

<h3>The Hero Formula</h3>
<p>Your hero section has 3 seconds to hook a visitor. Use this formula:</p>
<ol>
<li><strong>Headline:</strong> Clear value proposition (what they get)</li>
<li><strong>Subheading:</strong> How it works (the mechanism)</li>
<li><strong>CTA:</strong> Low-friction next step ("Try free" beats "Sign up")</li>
</ol>`,
    metaDescription: "Learn the proven copywriting formulas for websites that convert. From hero sections to CTAs, write copy that turns visitors into customers.",
    tags: ["Copywriting", "Conversion", "Marketing", "UX Writing"],
    status: "draft",
    views: 0,
    seoScore: 73,
    tone: "Casual",
    createdAt: "2026-03-19T10:00:00Z",
  },
  {
    id: "bp-007",
    title: "Agency Pricing Guide: How to Price Web Design Services in 2026",
    slug: "agency-pricing-guide-2026",
    body: `<h2>Pricing in the AI Era</h2>
<p>AI has disrupted web design pricing. Here's how forward-thinking agencies are adapting their pricing models to stay profitable while delivering more value.</p>

<h3>The Old Model Is Dead</h3>
<p>Charging $5,000-15,000 for a basic website is no longer viable when clients know AI can generate one in minutes. But that doesn't mean agency revenue has to drop.</p>

<h3>The New Pricing Stack</h3>
<ul>
<li><strong>Strategy & Brand Package:</strong> $2,000-5,000 (AI can't replace strategic thinking)</li>
<li><strong>AI-Accelerated Build:</strong> $500-2,000 (use AI tools, charge for expertise)</li>
<li><strong>Monthly Retainer:</strong> $500-2,000/mo (SEO, content, maintenance)</li>
<li><strong>Performance Bonuses:</strong> 10-20% of revenue increase attributed to the site</li>
</ul>`,
    metaDescription: "How web design agencies should price their services in 2026. Move from project-based to value-based pricing with AI-accelerated delivery.",
    tags: ["Agency", "Pricing", "Business", "Web Design"],
    status: "scheduled",
    publishedAt: undefined,
    scheduledAt: "2026-03-25T10:00:00Z",
    views: 0,
    seoScore: 86,
    tone: "Professional",
    createdAt: "2026-03-20T15:00:00Z",
  },
  {
    id: "bp-008",
    title: "The Technical Guide to Website Performance Optimization",
    slug: "website-performance-optimization",
    body: `<h2>Speed Is the Ultimate Feature</h2>
<p>Every 100ms of load time costs 1% in conversions. Here's your technical playbook for building sites that load in under one second.</p>

<h3>The Performance Stack</h3>
<ul>
<li><strong>Core Web Vitals:</strong> LCP < 2.5s, FID < 100ms, CLS < 0.1</li>
<li><strong>Image optimization:</strong> WebP/AVIF with responsive srcset</li>
<li><strong>Font loading:</strong> font-display: swap + subsetting</li>
<li><strong>CSS:</strong> Critical CSS inlined, rest deferred</li>
<li><strong>JavaScript:</strong> Tree-shaken, code-split, deferred</li>
</ul>

<h3>Testing Your Performance</h3>
<p>Use Lighthouse, WebPageTest, and Chrome DevTools Performance tab. Aim for a Lighthouse score above 90 on mobile.</p>`,
    metaDescription: "Technical guide to website performance optimization: Core Web Vitals, image optimization, font loading, CSS strategies, and JavaScript best practices.",
    tags: ["Performance", "Web Development", "Core Web Vitals", "Technical"],
    status: "draft",
    views: 0,
    seoScore: 81,
    tone: "Technical",
    createdAt: "2026-03-21T13:00:00Z",
  },
];

const MOCK_KEYWORDS: KeywordRank[] = [
  { keyword: "AI website builder", position: 4, change: 2, url: "/blog/ai-revolutionizing-web-design-2026" },
  { keyword: "website design trends 2026", position: 7, change: -1, url: "/blog/website-design-trends-2026" },
  { keyword: "SEO AI content", position: 12, change: 5, url: "/blog/seo-age-of-ai" },
  { keyword: "small business website", position: 18, change: 3, url: "/blog/small-business-website-2026" },
  { keyword: "ecommerce features checklist", position: 9, change: 0, url: "/blog/ecommerce-website-features-guide" },
  { keyword: "web design agency pricing", position: 15, change: -2, url: "/blog/agency-pricing-guide-2026" },
];

/* ─── helpers ─── */

function loadPosts(): BlogPost[] {
  if (typeof window === "undefined") return MOCK_POSTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_POSTS));
      return MOCK_POSTS;
    }
    return JSON.parse(raw) as BlogPost[];
  } catch {
    return MOCK_POSTS;
  }
}

function savePosts(posts: BlogPost[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function calculateSEOScore(post: BlogPost): number {
  let score = 40; // base
  if (post.title.length >= 30 && post.title.length <= 65) score += 10;
  if (post.metaDescription.length >= 120 && post.metaDescription.length <= 160) score += 10;
  if (post.tags.length >= 3) score += 5;
  if (post.body.length > 1000) score += 10;
  if (post.body.includes("<h2>") || post.body.includes("<h3>")) score += 10;
  if (post.body.includes("<strong>")) score += 5;
  if (post.body.includes("<ul>") || post.body.includes("<ol>")) score += 5;
  if (post.featuredImage) score += 5;
  return Math.min(score, 100);
}

export function getPosts(): BlogPost[] {
  return loadPosts();
}

export function createPost(
  post: Omit<BlogPost, "id" | "slug" | "views" | "seoScore">
): BlogPost {
  const posts = loadPosts();
  const newPost: BlogPost = {
    ...post,
    id: `bp-${Date.now()}`,
    slug: generateSlug(post.title),
    views: 0,
    seoScore: 0,
  };
  newPost.seoScore = calculateSEOScore(newPost);
  posts.unshift(newPost);
  savePosts(posts);
  return newPost;
}

export function updatePost(id: string, updates: Partial<BlogPost>): BlogPost | null {
  const posts = loadPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  posts[idx] = { ...posts[idx], ...updates };
  if (updates.title) posts[idx].slug = generateSlug(updates.title);
  posts[idx].seoScore = calculateSEOScore(posts[idx]);
  savePosts(posts);
  return posts[idx];
}

export function deletePost(id: string): void {
  const posts = loadPosts().filter((p) => p.id !== id);
  savePosts(posts);
}

export function getBlogStats(): BlogStats {
  const posts = loadPosts();
  const totalPosts = posts.length;
  const totalViews = posts.reduce((s, p) => s + p.views, 0);
  const scored = posts.filter((p) => p.seoScore > 0);
  const avgSeoScore = scored.length
    ? Math.round(scored.reduce((s, p) => s + p.seoScore, 0) / scored.length)
    : 0;
  const impressions = Math.round(totalViews * 4.2); // rough estimate
  return { totalPosts, totalViews, avgSeoScore, impressions };
}

export function getKeywordRankings(): KeywordRank[] {
  return MOCK_KEYWORDS;
}

export function getSocialPosts(post: BlogPost): SocialPosts {
  const shortTitle = post.title.length > 60 ? post.title.slice(0, 57) + "..." : post.title;
  const tags = post.tags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" ");

  return {
    twitter: `${shortTitle}\n\n${post.metaDescription.slice(0, 180)}\n\n${tags}\n\nRead more: zoobicon.com/blog/${post.slug}`,
    linkedin: `I just published: "${post.title}"\n\n${post.metaDescription}\n\nKey takeaways:\n${post.body
      .match(/<h3>([^<]+)<\/h3>/g)
      ?.slice(0, 3)
      .map((h) => `- ${h.replace(/<\/?h3>/g, "")}`)
      .join("\n") || "- Read the full article for insights"}\n\nRead the full post: zoobicon.com/blog/${post.slug}\n\n${tags}`,
    instagram: `${post.title}\n\n${post.metaDescription}\n\n.\n.\n.\n${tags} #blogging #contentmarketing #digitalmarketing`,
  };
}

export function getCalendarData(): { date: string; title: string; status: BlogPost["status"] }[] {
  const posts = loadPosts();
  return posts
    .filter((p) => p.publishedAt || p.scheduledAt)
    .map((p) => ({
      date: (p.publishedAt || p.scheduledAt || p.createdAt).split("T")[0],
      title: p.title,
      status: p.status,
    }));
}
