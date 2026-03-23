/**
 * Curated Unsplash image library by industry.
 * Every photo ID is a real Unsplash image. Format:
 * https://images.unsplash.com/photo-{ID}?w={W}&h={H}&fit=crop&q=80&auto=format
 */

export interface StockImage {
  id: string;
  alt: string;
}

export interface IndustryImages {
  hero: StockImage[];
  features: StockImage[];
  about: StockImage[];
  avatars: StockImage[];
  gallery: StockImage[];
}

const INDUSTRIES: Record<string, IndustryImages> = {
  cybersecurity: {
    hero: [
      { id: "1550751827-4bd374c3f58b", alt: "Security operations center with monitors" },
      { id: "1563986768-e681e06ad700", alt: "Digital security lock interface" },
    ],
    features: [
      { id: "1558494949-ef010cbdcc31", alt: "Server room with blue lights" },
      { id: "1526374965-0b475be1e645", alt: "Network infrastructure cables" },
      { id: "1551288049-bebda4e38f71", alt: "Code on dark screen" },
      { id: "1555949963-ff9fe0c870eb", alt: "Data center corridor" },
      { id: "1563013544-824ae1b704d3", alt: "Cloud computing visualization" },
      { id: "1504639725-590f85f29a94", alt: "Digital padlock security" },
    ],
    about: [
      { id: "1573164713-88cee78acb22", alt: "Security team working together" },
    ],
    avatars: [
      { id: "1560250097-0b93528c311a", alt: "Security professional" },
      { id: "1472099645-9fc16e924ed2", alt: "IT manager" },
      { id: "1507003211-169ccf034155", alt: "CISO portrait" },
    ],
    gallery: [
      { id: "1558494949-ef010cbdcc31", alt: "Server room" },
      { id: "1451187580-e0b2cfa8e8ac", alt: "Network monitoring dashboard" },
      { id: "1555949963-ff9fe0c870eb", alt: "Data center" },
      { id: "1563986768-e681e06ad700", alt: "Security interface" },
    ],
  },

  restaurant: {
    hero: [
      { id: "1517248135-c4d8a636b4c0", alt: "Beautifully plated gourmet dish" },
      { id: "1414235077-c02aee436965", alt: "Elegant restaurant interior" },
    ],
    features: [
      { id: "1504674900-694d4cfee661", alt: "Fresh pasta dish" },
      { id: "1476224203-1fcc1dbbc7c4", alt: "Grilled steak platter" },
      { id: "1551218808-94e220e084d2", alt: "Artisan dessert" },
      { id: "1510812431-53a0e87c3e37", alt: "Wine glasses on table" },
      { id: "1559339352-11d035aa65de", alt: "Chef preparing food" },
      { id: "1555396273-367ea4eb4db5", alt: "Fresh ingredients on board" },
    ],
    about: [
      { id: "1577219491-a03577c0ac85", alt: "Chef in kitchen" },
    ],
    avatars: [
      { id: "1438761681-6e27ca5e4b20", alt: "Restaurant patron" },
      { id: "1494790108-6b6c8b3a521d", alt: "Food critic" },
      { id: "1524504388-65ba29a5a0c7", alt: "Wine enthusiast" },
    ],
    gallery: [
      { id: "1517248135-c4d8a636b4c0", alt: "Signature dish" },
      { id: "1414235077-c02aee436965", alt: "Dining room" },
      { id: "1559339352-11d035aa65de", alt: "Chef at work" },
      { id: "1510812431-53a0e87c3e37", alt: "Wine selection" },
    ],
  },

  realestate: {
    hero: [
      { id: "1600596542-7bab3aecbf44", alt: "Luxury modern home exterior" },
      { id: "1600585154-354e7b1a5a66", alt: "Beautiful house with pool" },
    ],
    features: [
      { id: "1600607687-556838e9a7bb", alt: "Modern living room interior" },
      { id: "1600566753-190c98e1f085", alt: "Spacious kitchen with island" },
      { id: "1600585154-63a40ddf1f19", alt: "Master bedroom suite" },
      { id: "1600573472-5a4f9e2c4e24", alt: "Landscaped backyard" },
      { id: "1600047509-5b7680c2b8cb", alt: "Modern bathroom design" },
      { id: "1600596542-7bab3aecbf44", alt: "Penthouse view" },
    ],
    about: [
      { id: "1560518883-ce09cec505bd", alt: "Real estate team" },
    ],
    avatars: [
      { id: "1573496359-87d9b5f00e09", alt: "Real estate agent" },
      { id: "1560250097-0b93528c311a", alt: "Property buyer" },
      { id: "1507003211-169ccf034155", alt: "Homeowner" },
    ],
    gallery: [
      { id: "1600596542-7bab3aecbf44", alt: "Luxury home" },
      { id: "1600585154-354e7b1a5a66", alt: "Pool house" },
      { id: "1600607687-556838e9a7bb", alt: "Living room" },
      { id: "1600566753-190c98e1f085", alt: "Kitchen" },
    ],
  },

  saas: {
    hero: [
      { id: "1551434678-e076c223a692", alt: "Team collaborating on software" },
      { id: "1460925895-ad837f7b6f7a", alt: "Developer workspace with code" },
    ],
    features: [
      { id: "1551288049-bebda4e38f71", alt: "Code on screen" },
      { id: "1551434678-e076c223a692", alt: "Team using software" },
      { id: "1563013544-824ae1b704d3", alt: "Cloud dashboard" },
      { id: "1460925895-ad837f7b6f7a", alt: "Development environment" },
      { id: "1522071820-d3c889c0e6b1", alt: "Analytics charts" },
      { id: "1555949963-ff9fe0c870eb", alt: "Server infrastructure" },
    ],
    about: [
      { id: "1522071820-d3c889c0e6b1", alt: "Team meeting" },
    ],
    avatars: [
      { id: "1560250097-0b93528c311a", alt: "CTO" },
      { id: "1573496359-87d9b5f00e09", alt: "Product manager" },
      { id: "1472099645-9fc16e924ed2", alt: "Engineer" },
    ],
    gallery: [
      { id: "1551434678-e076c223a692", alt: "Team collaboration" },
      { id: "1460925895-ad837f7b6f7a", alt: "Developer coding" },
      { id: "1563013544-824ae1b704d3", alt: "Cloud platform" },
      { id: "1522071820-d3c889c0e6b1", alt: "Data analytics" },
    ],
  },

  healthcare: {
    hero: [
      { id: "1519494026-d9e6ce8a2aee", alt: "Modern medical facility" },
      { id: "1576091160-4a55f6e4f6be", alt: "Doctor with patient" },
    ],
    features: [
      { id: "1559757175-0eb30cd8c063", alt: "Medical technology" },
      { id: "1576091160-4a55f6e4f6be", alt: "Patient consultation" },
      { id: "1551190822-62fe2ed6b3cc", alt: "Lab research" },
      { id: "1538108149-b87bca8dbf89", alt: "Medical team" },
      { id: "1579684385-f10ea7a28fb5", alt: "Healthcare app" },
      { id: "1505751172-c5c3e3ece33c", alt: "Wellness treatment" },
    ],
    about: [
      { id: "1538108149-b87bca8dbf89", alt: "Medical team portrait" },
    ],
    avatars: [
      { id: "1559839734-2b71ea197ec2", alt: "Doctor" },
      { id: "1573496359-87d9b5f00e09", alt: "Nurse" },
      { id: "1560250097-0b93528c311a", alt: "Patient" },
    ],
    gallery: [
      { id: "1519494026-d9e6ce8a2aee", alt: "Facility" },
      { id: "1576091160-4a55f6e4f6be", alt: "Consultation" },
      { id: "1559757175-0eb30cd8c063", alt: "Equipment" },
      { id: "1551190822-62fe2ed6b3cc", alt: "Lab" },
    ],
  },

  fitness: {
    hero: [
      { id: "1534438327-507cb9a453c3", alt: "Modern gym interior" },
      { id: "1571019613-f71b75e3ba4e", alt: "Person exercising" },
    ],
    features: [
      { id: "1571019613-f71b75e3ba4e", alt: "Weight training" },
      { id: "1518611012-f25fd2a2b8f1", alt: "Yoga class" },
      { id: "1534438327-507cb9a453c3", alt: "Gym equipment" },
      { id: "1552674605-33c3ab5b2249", alt: "Group fitness" },
      { id: "1571019614-eb1d1e9a8a3e", alt: "Personal training" },
      { id: "1517836357-a93bf0cdf1e0", alt: "Nutrition plan" },
    ],
    about: [
      { id: "1552674605-33c3ab5b2249", alt: "Fitness team" },
    ],
    avatars: [
      { id: "1548690312-e3b507d8c110", alt: "Trainer" },
      { id: "1571019613-f71b75e3ba4e", alt: "Client" },
      { id: "1534438327-507cb9a453c3", alt: "Coach" },
    ],
    gallery: [],
  },

  legal: {
    hero: [
      { id: "1589829545-cdf1a56c3063", alt: "Law office interior" },
      { id: "1507679799-987e1cfaa53f", alt: "Legal library" },
    ],
    features: [
      { id: "1589829545-cdf1a56c3063", alt: "Law firm" },
      { id: "1450101499-5d2b72e55288", alt: "Legal consultation" },
      { id: "1507679799-987e1cfaa53f", alt: "Law books" },
      { id: "1554224155-6726b3ff858f", alt: "Courthouse" },
      { id: "1521791136-7ce1efdd2654", alt: "Contract signing" },
      { id: "1553877522-2e9b3e8bf2b6", alt: "Business meeting" },
    ],
    about: [
      { id: "1450101499-5d2b72e55288", alt: "Attorney team" },
    ],
    avatars: [
      { id: "1560250097-0b93528c311a", alt: "Senior partner" },
      { id: "1573496359-87d9b5f00e09", alt: "Associate" },
      { id: "1507003211-169ccf034155", alt: "Client" },
    ],
    gallery: [],
  },

  ecommerce: {
    hero: [
      { id: "1556742049-0cfed4f6a45d", alt: "Online shopping experience" },
      { id: "1441986300-9da7a6e8f6f3", alt: "Product showcase" },
    ],
    features: [
      { id: "1556742049-0cfed4f6a45d", alt: "Shopping bags" },
      { id: "1441986300-9da7a6e8f6f3", alt: "Products display" },
      { id: "1557821552-17af4c6c2f65", alt: "Package delivery" },
      { id: "1556742111-a30e3c78f3b4", alt: "Customer unboxing" },
      { id: "1563013544-824ae1b704d3", alt: "Analytics dashboard" },
      { id: "1556740738-b6a63e27c4ee", alt: "Mobile shopping" },
    ],
    about: [
      { id: "1556742049-0cfed4f6a45d", alt: "Our store" },
    ],
    avatars: [
      { id: "1438761681-6e27ca5e4b20", alt: "Happy customer" },
      { id: "1494790108-6b6c8b3a521d", alt: "Shopper" },
      { id: "1524504388-65ba29a5a0c7", alt: "Brand fan" },
    ],
    gallery: [],
  },

  education: {
    hero: [
      { id: "1523050854-25b69d5e3aff", alt: "Students in modern classroom" },
      { id: "1524178232-f1eaaa9a57f2", alt: "Library study space" },
    ],
    features: [
      { id: "1523050854-25b69d5e3aff", alt: "Classroom" },
      { id: "1524178232-f1eaaa9a57f2", alt: "Study session" },
      { id: "1503676260-5c2b99a96c26", alt: "Online learning" },
      { id: "1509062522-c22dbdd52aad", alt: "Graduation" },
      { id: "1522202176-5c55fcd8de2c", alt: "Campus" },
      { id: "1546410531-bd28ef3e5e93", alt: "Science lab" },
    ],
    about: [
      { id: "1522202176-5c55fcd8de2c", alt: "Campus overview" },
    ],
    avatars: [
      { id: "1560250097-0b93528c311a", alt: "Professor" },
      { id: "1573496359-87d9b5f00e09", alt: "Student" },
      { id: "1472099645-9fc16e924ed2", alt: "Dean" },
    ],
    gallery: [],
  },

  finance: {
    hero: [
      { id: "1560179707-f14e90ef3623", alt: "Modern financial district" },
      { id: "1554224155-6726b3ff858f", alt: "Trading floor" },
    ],
    features: [
      { id: "1560179707-f14e90ef3623", alt: "Finance office" },
      { id: "1554224155-6726b3ff858f", alt: "Business meeting" },
      { id: "1553877522-2e9b3e8bf2b6", alt: "Financial planning" },
      { id: "1460925895-ad837f7b6f7a", alt: "Data analysis" },
      { id: "1522071820-d3c889c0e6b1", alt: "Market charts" },
      { id: "1521791136-7ce1efdd2654", alt: "Client handshake" },
    ],
    about: [
      { id: "1553877522-2e9b3e8bf2b6", alt: "Advisory team" },
    ],
    avatars: [
      { id: "1560250097-0b93528c311a", alt: "Financial advisor" },
      { id: "1507003211-169ccf034155", alt: "Client" },
      { id: "1573496359-87d9b5f00e09", alt: "Analyst" },
    ],
    gallery: [],
  },

  photography: {
    hero: [
      { id: "1452587925-f56d2f48e8b4", alt: "Photographer with camera" },
      { id: "1506905925-346c8a29d6f5", alt: "Dramatic landscape photo" },
    ],
    features: [
      { id: "1452587925-f56d2f48e8b4", alt: "Portrait session" },
      { id: "1506905925-346c8a29d6f5", alt: "Landscape photography" },
      { id: "1519741497-120026e84997", alt: "Wedding photography" },
      { id: "1493863641-1dbb2393b444", alt: "Product photography" },
      { id: "1516035069-2b2cc37b0ffe", alt: "Event photography" },
      { id: "1542038784-4c51c74be7cf", alt: "Studio setup" },
    ],
    about: [
      { id: "1452587925-f56d2f48e8b4", alt: "Photographer at work" },
    ],
    avatars: [
      { id: "1494790108-6b6c8b3a521d", alt: "Photographer" },
      { id: "1438761681-6e27ca5e4b20", alt: "Client" },
      { id: "1524504388-65ba29a5a0c7", alt: "Art director" },
    ],
    gallery: [
      { id: "1506905925-346c8a29d6f5", alt: "Landscape" },
      { id: "1519741497-120026e84997", alt: "Wedding" },
      { id: "1493863641-1dbb2393b444", alt: "Product" },
      { id: "1516035069-2b2cc37b0ffe", alt: "Event" },
      { id: "1542038784-4c51c74be7cf", alt: "Studio" },
      { id: "1452587925-f56d2f48e8b4", alt: "Portrait" },
    ],
  },

  agency: {
    hero: [
      { id: "1552664730-d307ca884978", alt: "Creative agency workspace" },
      { id: "1522071820-d3c889c0e6b1", alt: "Team brainstorming" },
    ],
    features: [
      { id: "1552664730-d307ca884978", alt: "Design studio" },
      { id: "1551434678-e076c223a692", alt: "Team collaboration" },
      { id: "1460925895-ad837f7b6f7a", alt: "Development" },
      { id: "1522071820-d3c889c0e6b1", alt: "Strategy session" },
      { id: "1542744095-fcf48d80b0fd", alt: "Creative work" },
      { id: "1517245386-dbfbf76d9de8", alt: "Brand design" },
    ],
    about: [
      { id: "1552664730-d307ca884978", alt: "Agency team" },
    ],
    avatars: [
      { id: "1560250097-0b93528c311a", alt: "Creative director" },
      { id: "1573496359-87d9b5f00e09", alt: "Designer" },
      { id: "1472099645-9fc16e924ed2", alt: "Developer" },
    ],
    gallery: [
      { id: "1552664730-d307ca884978", alt: "Workspace" },
      { id: "1542744095-fcf48d80b0fd", alt: "Creative process" },
      { id: "1517245386-dbfbf76d9de8", alt: "Brand work" },
      { id: "1551434678-e076c223a692", alt: "Team" },
    ],
  },

  construction: {
    hero: [
      { id: "1504307651-8f87a6c77b06", alt: "Modern building under construction" },
      { id: "1541888946-09fc257cf1ce", alt: "Architectural project" },
    ],
    features: [
      { id: "1504307651-8f87a6c77b06", alt: "Construction site" },
      { id: "1541888946-09fc257cf1ce", alt: "Building design" },
      { id: "1503387762-593555c46764", alt: "Interior renovation" },
      { id: "1558618666-fcd25c85f1ab", alt: "Blueprint planning" },
      { id: "1513467535-f4622d78e2ca", alt: "Heavy equipment" },
      { id: "1486406146-926c8fa41fc0", alt: "Finished building" },
    ],
    about: [
      { id: "1504307651-8f87a6c77b06", alt: "Construction team" },
    ],
    avatars: [
      { id: "1560250097-0b93528c311a", alt: "Project manager" },
      { id: "1507003211-169ccf034155", alt: "Architect" },
      { id: "1472099645-9fc16e924ed2", alt: "Engineer" },
    ],
    gallery: [],
  },
};

// Keywords that map prompts to industries
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  cybersecurity: ["cyber", "security", "infosec", "hacking", "firewall", "soc", "threat", "vulnerability", "penetration", "encryption"],
  restaurant: ["restaurant", "cafe", "food", "dining", "bistro", "bar", "grill", "kitchen", "chef", "catering", "bakery", "pizza", "sushi"],
  realestate: ["real estate", "realty", "property", "homes", "housing", "apartment", "condo", "mortgage", "listing", "broker"],
  saas: ["saas", "software", "app", "platform", "dashboard", "startup", "devtool", "developer tool", "api", "cloud"],
  healthcare: ["health", "medical", "clinic", "hospital", "dental", "doctor", "wellness", "therapy", "pharma", "telehealth"],
  fitness: ["fitness", "gym", "workout", "yoga", "pilates", "crossfit", "personal trainer", "athletic", "sports"],
  legal: ["law", "legal", "attorney", "lawyer", "firm", "litigation", "counsel", "barrister"],
  ecommerce: ["ecommerce", "e-commerce", "shop", "store", "retail", "product", "buy", "sell", "merchandise"],
  education: ["education", "school", "university", "course", "learning", "academy", "tutor", "training", "edtech"],
  finance: ["finance", "bank", "investment", "accounting", "insurance", "fintech", "wealth", "advisory", "trading", "crypto"],
  photography: ["photography", "photographer", "photo", "studio", "portrait", "wedding photo", "videography"],
  agency: ["agency", "marketing", "creative", "design agency", "digital agency", "advertising", "branding"],
  construction: ["construction", "building", "contractor", "renovation", "architecture", "roofing", "plumbing", "electric"],
};

/**
 * Detect industry from a user prompt.
 */
export function detectIndustry(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  let bestMatch: string | null = null;
  let bestScore = 0;

  const industries = Object.keys(INDUSTRY_KEYWORDS);
  for (let i = 0; i < industries.length; i++) {
    const industry = industries[i];
    const keywords = INDUSTRY_KEYWORDS[industry];
    let score = 0;
    for (let j = 0; j < keywords.length; j++) {
      if (lower.indexOf(keywords[j]) !== -1) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = industry;
    }
  }

  return bestMatch;
}

/**
 * Get curated images for an industry.
 */
export function getIndustryImages(industry: string): IndustryImages | null {
  return INDUSTRIES[industry] || null;
}

/**
 * Build an Unsplash URL from a photo ID.
 */
export function unsplashUrl(id: string, w: number, h: number): string {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80&auto=format`;
}

/**
 * Generate an image instruction block for the AI system prompt.
 * This tells the AI exactly which URLs to use for each section.
 */
export function getImagePromptBlock(prompt: string): string {
  const industry = detectIndustry(prompt);
  if (!industry) return "";

  const images = INDUSTRIES[industry];
  if (!images) return "";

  const heroImg = images.hero[0];
  const featureImgs = images.features.slice(0, 6);
  const aboutImg = images.about[0];
  const avatarImgs = images.avatars.slice(0, 3);

  let block = `\n## CURATED IMAGES — USE THESE EXACT URLs (industry: ${industry})
Instead of picsum.photos, use these HIGH-QUALITY Unsplash images:

HERO IMAGE:
${unsplashUrl(heroImg.id, 1400, 800)} — ${heroImg.alt}

FEATURE CARD IMAGES (one per card):`;

  featureImgs.forEach((img, i) => {
    block += `\n${i + 1}. ${unsplashUrl(img.id, 400, 250)} — ${img.alt}`;
  });

  block += `\n\nABOUT SECTION IMAGE:
${unsplashUrl(aboutImg.id, 640, 480)} — ${aboutImg.alt}

TESTIMONIAL AVATARS:`;
  avatarImgs.forEach((img, i) => {
    block += `\n${i + 1}. ${unsplashUrl(img.id, 80, 80)} — ${img.alt}`;
  });

  if (images.gallery.length > 0) {
    block += `\n\nGALLERY/PORTFOLIO IMAGES:`;
    images.gallery.forEach((img, i) => {
      block += `\n${i + 1}. ${unsplashUrl(img.id, 600, 400)} — ${img.alt}`;
    });
  }

  block += `\n\nFor any additional images not listed above, use https://picsum.photos/seed/DESCRIPTIVE-KEYWORD/WIDTH/HEIGHT with industry-specific keywords.`;

  return block;
}
