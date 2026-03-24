/**
 * Scaffold Matcher — Instant intent classification and template matching
 *
 * Matches user prompts to the best template from templates.ts using keyword
 * scoring. No LLM calls — pure string matching for sub-millisecond response.
 *
 * Used by /api/generate/scaffold to serve a pre-matched template in <1s
 * before the full AI generation pipeline kicks in.
 */

import { TEMPLATES, type Template } from "./templates";
import { getScaffoldConfig, getScaffold } from "./scaffold-engine";
import { injectComponentLibrary } from "./component-library";

// ── Types ──

export interface IntentResult {
  templateId: string;
  category: string;
  confidence: number;
}

export interface ScaffoldResult {
  html: string;
  templateName: string;
  confidence: number;
}

// ── Category Keywords ──
// Maps template categories to weighted keywords. Each keyword has an implicit
// weight equal to its string length (longer = more specific = higher weight).
// Extend this map to improve matching accuracy.

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Business: [
    "business", "company", "corporate", "enterprise", "firm",
    "agency", "consulting", "professional", "services", "solutions",
    "accounting", "tax", "insurance", "cleaning", "plumbing", "hvac",
    "moving", "car wash", "detailing", "coworking", "office space",
    "logistics", "shipping", "freight", "recruitment", "staffing",
    "marketing agency", "digital marketing", "seo agency",
    "salon", "spa", "beauty", "interior design", "pet grooming",
    "photography studio",
  ],
  Technology: [
    "saas", "software", "app", "platform", "dashboard", "api",
    "tech", "startup", "ai", "artificial intelligence", "machine learning",
    "developer", "devtools", "cli", "sdk", "open source",
    "crm", "project management", "kanban", "email marketing",
    "analytics", "data", "cloud", "cybersecurity", "security",
    "fintech", "social media tool", "pitch", "launch", "waitlist",
    "beta", "pre-launch", "mvp",
  ],
  "E-Commerce": [
    "shop", "store", "ecommerce", "e-commerce", "product", "buy", "sell",
    "retail", "marketplace", "clothing", "fashion", "boutique",
    "electronics", "gadgets", "handmade", "artisan", "craft",
    "grocery", "delivery", "subscription box", "jewelry",
    "home decor", "furniture",
  ],
  "Food & Drink": [
    "restaurant", "cafe", "coffee", "bakery", "food", "menu",
    "dining", "bistro", "pizza", "sushi", "bar", "pub",
    "catering", "chef", "kitchen", "brewery", "taproom", "beer",
    "cocktail", "lounge", "food truck", "street food",
    "hotel", "resort", "hospitality",
  ],
  Health: [
    "health", "healthcare", "medical", "doctor", "clinic", "hospital",
    "dental", "dentist", "therapy", "therapist", "mental health",
    "counseling", "psychology", "psychiatry", "pharmacy",
    "fitness", "gym", "workout", "yoga", "wellness", "training",
    "coach", "sport", "nutrition", "crossfit", "pilates",
    "veterinary", "vet", "animal clinic", "physical therapy",
  ],
  Portfolio: [
    "portfolio", "photographer", "photography", "designer", "artist",
    "creative", "freelance", "freelancer", "personal site", "resume", "cv",
    "illustrator", "ux designer", "architect portfolio", "design agency",
    "case study", "gallery",
  ],
  Blog: [
    "blog", "magazine", "news", "journal", "article", "content",
    "publication", "editorial", "writer", "author", "columnist",
    "travel blog", "tech blog", "lifestyle blog", "personal brand",
    "influencer", "content creator", "media portal",
  ],
  Events: [
    "event", "conference", "wedding", "party", "concert", "festival",
    "meetup", "summit", "gala", "ticket", "hackathon", "sports league",
    "workshop", "masterclass", "seminar", "webinar",
  ],
  "Real Estate": [
    "real estate", "property", "listing", "home", "apartment", "rental",
    "realtor", "housing", "mortgage", "commercial real estate",
    "property management", "landlord", "agent",
  ],
  Entertainment: [
    "music", "artist", "band", "album", "entertainment",
    "podcast", "show", "film", "video", "production",
    "gaming", "esports", "comedy", "live shows", "streaming",
  ],
  Nonprofit: [
    "nonprofit", "charity", "donate", "donation", "foundation",
    "cause", "volunteer", "ngo", "community", "mission",
    "church", "religious", "animal shelter", "rescue",
    "environmental", "conservation", "sustainability",
  ],
  Professional: [
    "lawyer", "attorney", "law firm", "legal", "litigation",
    "accountant", "cpa", "financial advisor", "wealth management",
    "architecture firm", "engineering firm", "consulting",
    "interior design studio",
  ],
  Education: [
    "education", "school", "course", "learn", "tutorial",
    "university", "academy", "training", "class", "student",
    "tutoring", "daycare", "preschool", "childcare",
    "language school", "online course", "bootcamp", "e-learning",
  ],
};

// ── Template-Level Keywords ──
// Additional high-specificity keywords that map directly to individual template IDs.
// These override category-level matching when a very specific term is found.

const TEMPLATE_SPECIFIC_KEYWORDS: Record<string, string[]> = {
  "restaurant-menu": ["restaurant", "dining", "reservation", "menu"],
  "coffee-shop": ["coffee shop", "cafe", "espresso", "latte", "barista"],
  "bakery-shop": ["bakery", "pastry", "bread", "cakes", "cupcake"],
  "bar-cocktail-lounge": ["bar", "cocktail", "lounge", "nightclub", "nightlife", "pub"],
  "hotel-resort": ["hotel", "resort", "hospitality", "accommodation", "inn", "motel"],
  "food-truck": ["food truck", "street food", "mobile food"],
  "brewery-taproom": ["brewery", "taproom", "craft beer", "microbrewery"],
  "catering-service": ["catering", "event catering", "banquet"],
  "fitness-gym": ["gym", "fitness center", "crossfit", "bodybuilding", "weight training"],
  "yoga-wellness": ["yoga", "meditation", "mindfulness", "wellness studio", "pilates"],
  "dental-clinic": ["dental", "dentist", "orthodontist", "teeth", "oral health"],
  "mental-health": ["mental health", "therapy", "counseling", "psychologist", "psychiatrist"],
  "physical-therapy": ["physical therapy", "physiotherapy", "rehab", "rehabilitation"],
  "nutrition-coach": ["nutrition", "dietitian", "nutritionist", "meal plan", "diet"],
  "veterinary-clinic": ["veterinary", "vet", "animal hospital", "pet clinic"],
  "medical-practice": ["medical practice", "family medicine", "primary care", "physician"],
  "fitness-tracker": ["fitness tracker", "health app", "workout app"],
  "law-firm": ["lawyer", "attorney", "law firm", "legal services", "litigation"],
  "accounting-firm": ["accounting", "tax", "bookkeeping", "payroll"],
  "accountant-cpa": ["cpa", "certified accountant", "tax preparation"],
  "financial-advisor": ["financial advisor", "wealth management", "investment", "retirement planning"],
  "insurance-agency": ["insurance", "coverage", "policy", "claims"],
  "consulting-firm": ["consulting", "management consulting", "strategy consulting"],
  "construction-company": ["construction", "contractor", "builder", "renovation", "remodeling"],
  "cleaning-service": ["cleaning", "maid service", "janitorial", "housekeeping"],
  "plumber-hvac": ["plumbing", "plumber", "hvac", "heating", "air conditioning"],
  "moving-company": ["moving company", "relocation", "movers", "packing"],
  "car-wash": ["car wash", "auto detailing", "car detailing"],
  "automotive-dealer": ["car dealer", "auto dealer", "dealership", "vehicles", "cars for sale"],
  "coworking-space": ["coworking", "shared office", "workspace", "hot desk"],
  "pet-grooming": ["pet grooming", "dog grooming", "pet salon"],
  "salon-spa": ["hair salon", "spa", "beauty salon", "nail salon", "massage"],
  "interior-designer": ["interior design", "home staging", "interior decorator"],
  "photography-studio": ["photography studio", "portrait photographer", "photo studio"],
  "saas-landing": ["saas", "software as a service", "cloud software"],
  "saas-dashboard": ["analytics dashboard", "data analytics", "business intelligence"],
  "saas-crm": ["crm", "customer relationship", "sales pipeline", "lead management"],
  "saas-project": ["project management", "task management", "kanban board", "team collaboration"],
  "saas-email-tool": ["email marketing", "newsletter", "email campaign", "mailing list"],
  "ai-tool-landing": ["ai tool", "artificial intelligence", "machine learning", "nlp", "chatbot"],
  "devtools-landing": ["developer tools", "devtools", "cli tool", "sdk", "open source"],
  "tech-startup": ["tech startup", "technology company", "innovation"],
  "startup-pitch": ["pitch page", "startup launch", "product launch", "waitlist page", "coming soon"],
  "cybersecurity-firm": ["cybersecurity", "security firm", "infosec", "penetration testing", "cyber"],
  "api-developer-platform": ["api platform", "developer platform", "api marketplace"],
  "finance-dashboard": ["personal finance", "budget tracker", "expense tracker"],
  "social-media-dashboard": ["social media dashboard", "social analytics", "social media management"],
  "ecommerce-store": ["online store", "e-commerce", "ecommerce", "shop"],
  "fashion-store": ["fashion", "boutique", "clothing store", "apparel", "designer"],
  "electronics-store": ["electronics", "gadgets", "tech store", "computer store"],
  "handmade-marketplace": ["handmade", "artisan", "crafts", "etsy-like", "handcrafted"],
  "grocery-delivery": ["grocery", "grocery delivery", "supermarket", "fresh produce"],
  "subscription-box": ["subscription box", "monthly box", "curated box"],
  "jewelry-store": ["jewelry", "jewellery", "diamonds", "rings", "necklace"],
  "home-decor-store": ["home decor", "furniture", "home goods", "interior shop"],
  "portfolio-creative": ["creative portfolio", "design portfolio"],
  "photographer-portfolio": ["photographer portfolio", "photo gallery"],
  "design-agency": ["design agency", "creative agency"],
  "freelancer-portfolio": ["freelancer", "developer portfolio", "personal website"],
  "architect-portfolio": ["architecture portfolio", "architect"],
  "ux-designer-portfolio": ["ux design", "ui design", "ux portfolio", "product design"],
  "illustrator-artist": ["illustrator", "artist portfolio", "illustration", "digital art"],
  "blog-minimal": ["blog", "personal blog"],
  "travel-blog": ["travel blog", "travel journal", "adventure blog"],
  "personal-brand": ["personal brand", "influencer", "content creator"],
  "tech-blog": ["tech blog", "developer blog", "coding blog", "programming blog"],
  "lifestyle-blog": ["lifestyle blog", "wellness blog", "recipe blog"],
  "podcast-network": ["news portal", "media site", "news website"],
  "event-conference": ["conference", "summit", "tech event"],
  "wedding-planner": ["wedding", "wedding planner", "bridal"],
  "music-festival": ["music festival", "concert", "live music"],
  "workshop-course": ["workshop", "masterclass", "seminar"],
  "sports-league": ["sports league", "basketball", "football league", "tournament"],
  "hackathon": ["hackathon", "coding competition", "hack event"],
  "comedy-show": ["comedy", "stand-up", "comedy club", "live show"],
  "real-estate": ["luxury real estate", "luxury homes", "high-end property"],
  "commercial-real-estate": ["commercial real estate", "office space", "warehouse", "industrial"],
  "property-management": ["property management", "rental management", "landlord"],
  "real-estate-agent": ["real estate agent", "realtor", "property agent"],
  "music-artist": ["music artist", "band website", "musician", "rapper", "singer"],
  "podcast-show": ["podcast", "podcast show", "audio show"],
  "film-production": ["film production", "video production", "filmmaking", "movie"],
  "gaming-esports": ["gaming", "esports", "game team", "twitch"],
  "nonprofit-charity": ["charity", "donate", "fundraising"],
  "animal-shelter": ["animal shelter", "pet adoption", "animal rescue"],
  "community-foundation": ["community foundation", "grants", "community development"],
  "church-religious": ["church", "religious", "worship", "ministry", "parish"],
  "environmental-ngo": ["environmental", "conservation", "climate", "sustainability", "green"],
  "language-school": ["language school", "english school", "language courses"],
  "tutoring-service": ["tutoring", "tutor", "academic help", "sat prep", "test prep"],
  "daycare-preschool": ["daycare", "preschool", "childcare", "nursery"],
  "online-course": ["online course", "e-learning", "bootcamp", "course platform"],
  "university-department": ["university", "college", "department", "academic"],
  "travel-agency": ["travel agency", "travel packages", "vacation", "tour"],
  "marketing-agency": ["marketing agency", "digital marketing", "seo agency", "ad agency"],
  "recruitment-agency": ["recruitment", "staffing", "hiring", "job board", "headhunter"],
  "logistics-shipping": ["logistics", "shipping", "freight", "supply chain", "trucking"],
};

// ── Intent-to-scaffold-engine mapping ──
// Maps template categories to the scaffold-engine intent keys for HTML generation.

const CATEGORY_TO_SCAFFOLD_INTENT: Record<string, string> = {
  "Business": "business",
  "Technology": "saas",
  "E-Commerce": "ecommerce",
  "Food & Drink": "restaurant",
  "Health": "fitness",
  "Portfolio": "portfolio",
  "Blog": "blog",
  "Events": "event",
  "Real Estate": "realestate",
  "Entertainment": "startup",
  "Nonprofit": "nonprofit",
  "Professional": "lawyer",
  "Education": "education",
};

// ── Scoring Functions ──

/**
 * Score a prompt against a list of keywords.
 * Longer keyword matches score higher (more specific = more relevant).
 * Multi-word keywords that match as a phrase get a bonus.
 */
function scoreKeywords(promptLower: string, keywords: string[]): number {
  let score = 0;
  for (const kw of keywords) {
    if (promptLower.includes(kw)) {
      // Base score is keyword length (specificity)
      score += kw.length;
      // Bonus for multi-word matches (phrases are more specific)
      if (kw.includes(" ")) {
        score += kw.length * 0.5;
      }
    }
  }
  return score;
}

/**
 * Classify user intent by matching prompt against template categories and
 * individual template keywords. Returns the best matching template ID,
 * its category, and a confidence score (0-1).
 *
 * Uses a two-pass approach:
 * 1. Score each template by its specific keywords (high precision)
 * 2. Score each category by its keywords (broad coverage)
 * 3. Pick the best template within the winning category, or the
 *    directly-matched template if its score is higher
 *
 * Confidence is normalized: 0 = no match, 1 = very strong match.
 * Returns null-equivalent (confidence < 0.3) for vague/unrelated prompts.
 */
export function classifyIntent(prompt: string): IntentResult {
  const promptLower = prompt.toLowerCase().trim();

  // Pass 1: Score individual templates by specific keywords
  let bestTemplateId = "";
  let bestTemplateScore = 0;
  let bestTemplateCategory = "";

  for (const [templateId, keywords] of Object.entries(TEMPLATE_SPECIFIC_KEYWORDS)) {
    const score = scoreKeywords(promptLower, keywords);
    if (score > bestTemplateScore) {
      bestTemplateScore = score;
      bestTemplateId = templateId;
      // Look up category from TEMPLATES
      const template = TEMPLATES.find((t) => t.id === templateId);
      bestTemplateCategory = template?.category || "Business";
    }
  }

  // Pass 2: Score categories
  let bestCategoryScore = 0;
  let bestCategory = "Business";

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = scoreKeywords(promptLower, keywords);
    if (score > bestCategoryScore) {
      bestCategoryScore = score;
      bestCategory = category;
    }
  }

  // Pass 3: Also score templates by matching prompt words against template
  // name, tags, and description for additional signal
  let bestMetaTemplateId = "";
  let bestMetaScore = 0;

  for (const template of TEMPLATES) {
    let metaScore = 0;
    const nameLower = template.name.toLowerCase();
    const descLower = template.description.toLowerCase();

    // Check if prompt words appear in template name
    const promptWords = promptLower.split(/\s+/).filter((w) => w.length > 2);
    for (const word of promptWords) {
      if (nameLower.includes(word)) metaScore += word.length * 2;
      if (descLower.includes(word)) metaScore += word.length * 0.5;
    }

    // Check if template tags appear in prompt
    for (const tag of template.tags) {
      if (promptLower.includes(tag.toLowerCase())) {
        metaScore += tag.length * 1.5;
      }
    }

    if (metaScore > bestMetaScore) {
      bestMetaScore = metaScore;
      bestMetaTemplateId = template.id;
    }
  }

  // Decision: Pick the best result across all three passes
  // Template-specific keywords are most reliable, so weight them highest
  const templateSpecificWeight = bestTemplateScore * 2;
  const metaWeight = bestMetaScore;

  let finalTemplateId: string;
  let finalCategory: string;
  let rawScore: number;

  if (templateSpecificWeight >= metaWeight && bestTemplateScore > 0) {
    // Template-specific keywords won
    finalTemplateId = bestTemplateId;
    finalCategory = bestTemplateCategory;
    rawScore = bestTemplateScore;
  } else if (bestMetaScore > 0) {
    // Metadata matching won
    finalTemplateId = bestMetaTemplateId;
    const tmpl = TEMPLATES.find((t) => t.id === bestMetaTemplateId);
    finalCategory = tmpl?.category || bestCategory;
    rawScore = bestMetaScore / 1.5; // Normalize since meta scores can be inflated
  } else {
    // Fall back to category match — pick the first template in that category
    const categoryTemplate = TEMPLATES.find((t) => t.category === bestCategory);
    finalTemplateId = categoryTemplate?.id || "saas-landing";
    finalCategory = bestCategory;
    rawScore = bestCategoryScore;
  }

  // Normalize confidence to 0-1 range
  // A score of 15+ (e.g., matching "restaurant" + "menu") is high confidence
  // A score of 5-15 is medium, below 5 is low
  const confidence = Math.min(1, rawScore / 20);

  return {
    templateId: finalTemplateId,
    category: finalCategory,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Get an instant scaffold HTML page for the given prompt.
 * Returns the matched template's scaffold HTML (with component library injected),
 * or null if confidence is below 0.3.
 *
 * The HTML is a complete, styled page using the scaffold-engine's pre-built
 * section templates. It serves as an instant preview while the full AI
 * generation runs in the background.
 */
export function getInstantScaffold(prompt: string): ScaffoldResult | null {
  const intent = classifyIntent(prompt);

  if (intent.confidence < 0.3) {
    return null;
  }

  // Map the template's category to a scaffold-engine intent
  const scaffoldIntent = CATEGORY_TO_SCAFFOLD_INTENT[intent.category] || "business";

  // Get scaffold config (colors, fonts, title) and body HTML
  const config = getScaffoldConfig(scaffoldIntent);
  const bodyHtml = getScaffold(scaffoldIntent);

  // Look up the matched template for its name
  const template = TEMPLATES.find((t) => t.id === intent.templateId);
  const templateName = template?.name || "Business";

  // Update the config title to reflect the matched template
  config.title = template?.name || config.title;
  config.description = template?.description || config.description;

  // Build the full HTML page with component library
  const fullHtml = buildScaffoldPage(config, bodyHtml);

  return {
    html: fullHtml,
    templateName,
    confidence: intent.confidence,
  };
}

// ── Internal: Build a complete HTML page from scaffold config + body ──

function buildScaffoldPage(
  config: { title: string; description: string; font1: string; font2: string; colors: Record<string, string | undefined>; customCss?: string },
  bodyHtml: string
): string {
  const { title, description, font1, font2, colors, customCss } = config;

  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font1)}:wght@400;500;600;700;800;900&family=${encodeURIComponent(font2)}:wght@400;500;600;700&display=swap`;

  const serifFonts = ["Playfair Display", "Cormorant Garamond", "Merriweather"];
  const headingStack = serifFonts.includes(font1) ? "serif" : "sans-serif";

  const rawPage = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description.replace(/"/g, "&quot;")}">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontUrl}" rel="stylesheet">
  <style>
:root {
  --color-primary: ${colors.primary || "#3b82f6"};
  --color-primary-dark: ${colors.primaryDark || colors.primary || "#2563eb"};
  --color-bg: ${colors.bg || "#ffffff"};
  --color-bg-alt: ${colors.bgAlt || "#f8fafc"};
  --color-surface: ${colors.surface || "#ffffff"};
  --color-text: ${colors.text || "#0f172a"};
  --color-text-muted: ${colors.textMuted || "#64748b"};
  --color-border: ${colors.border || "#e2e8f0"};
  --color-accent: ${colors.accent || colors.primary || "#3b82f6"};
  --font-heading: '${font1}', ${headingStack};
  --font-body: '${font2}', sans-serif;
  --section-padding: 100px;
  --container-padding: 24px;
  --max-width: 1200px;
  --btn-radius: 8px;
  --card-radius: 12px;
}
body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  margin: 0;
}
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  line-height: 1.15;
}
${customCss || ""}
  </style>
</head>
<body>
${bodyHtml}
<script>
(function(){
  var btn = document.querySelector('.mobile-menu-btn');
  var nav = document.querySelector('.nav-links');
  if (btn && nav) {
    btn.addEventListener('click', function() {
      nav.classList.toggle('open');
      btn.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { nav.classList.remove('open'); btn.classList.remove('open'); });
    });
  }
})();
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var t=document.querySelector(this.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}
  });
});
document.querySelectorAll('.faq-question').forEach(function(q){
  q.addEventListener('click',function(){
    var a=this.nextElementSibling;
    if(a){a.classList.toggle('open');}
    var icon=this.querySelector('.faq-icon');
    if(icon){icon.textContent=a&&a.classList.contains('open')?'\\u2212':'+';}
  });
});
(function(){
  var sel='.fade-in,.fade-in-left,.fade-in-right,.scale-in';
  var els=document.querySelectorAll(sel);
  els.forEach(function(el){el.classList.add('will-animate');});
  if('IntersectionObserver' in window){
    var obs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}
      });
    },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
    els.forEach(function(el){obs.observe(el);});
  } else {
    els.forEach(function(el){el.classList.add('visible');});
  }
  setTimeout(function(){
    document.querySelectorAll(sel+':not(.visible)').forEach(function(el){el.classList.add('visible');});
  },3000);
})();
</script>
</body>
</html>`;

  // Inject the component library CSS for full styling
  return injectComponentLibrary(rawPage);
}
