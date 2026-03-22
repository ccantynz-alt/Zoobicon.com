/* ─── Brand Kit — localStorage-based brand identity system ─── */

export interface BrandKit {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: "compact" | "default" | "spacious";
  };
  logo?: {
    url?: string;
    mark?: string;
    text: string;
  };
  voice: {
    tone: number;       // 0 = professional, 100 = casual
    formality: number;  // 0 = serious, 100 = playful
    complexity: number; // 0 = technical, 100 = simple
    keywords: string[];
  };
  audience: {
    industry: string;
    description: string;
    ageRange: string;
    location: string;
  };
  appliedToAll: boolean;
  updatedAt: string;
}

const STORAGE_KEY = "zoobicon_brand_kit";

export function getBrandKit(): BrandKit | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveBrandKit(kit: BrandKit): void {
  if (typeof window === "undefined") return;
  try {
    kit.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kit));
  } catch {
    // storage full or unavailable
  }
}

export function getDefaultBrandKit(): BrandKit {
  return {
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#06b6d4",
      background: "#0a0a12",
      text: "#f8fafc",
    },
    typography: {
      headingFont: "Inter",
      bodyFont: "Inter",
      scale: "default",
    },
    logo: {
      text: "My Brand",
    },
    voice: {
      tone: 50,
      formality: 50,
      complexity: 50,
      keywords: [],
    },
    audience: {
      industry: "",
      description: "",
      ageRange: "25-45",
      location: "United States",
    },
    appliedToAll: false,
    updatedAt: new Date().toISOString(),
  };
}

export function generateBrandPromptContext(kit: BrandKit): string {
  const toneLabel = kit.voice.tone > 66 ? "casual and conversational" : kit.voice.tone > 33 ? "balanced and approachable" : "professional and authoritative";
  const formalityLabel = kit.voice.formality > 66 ? "playful and fun" : kit.voice.formality > 33 ? "friendly but not silly" : "serious and formal";
  const complexityLabel = kit.voice.complexity > 66 ? "simple, easy to understand" : kit.voice.complexity > 33 ? "moderately technical" : "technical and detailed";

  const lines: string[] = [
    "## Brand Kit Context",
    "",
    `**Brand Colors:** Primary ${kit.colors.primary}, Secondary ${kit.colors.secondary}, Accent ${kit.colors.accent}, Background ${kit.colors.background}, Text ${kit.colors.text}`,
    `**Typography:** Headings in ${kit.typography.headingFont}, Body in ${kit.typography.bodyFont}, Scale: ${kit.typography.scale}`,
  ];

  if (kit.logo?.text) {
    lines.push(`**Brand Name:** ${kit.logo.text}`);
  }

  lines.push(
    `**Writing Voice:** ${toneLabel}, ${formalityLabel}, ${complexityLabel}`,
  );

  if (kit.voice.keywords.length > 0) {
    lines.push(`**Brand Keywords:** ${kit.voice.keywords.join(", ")}`);
  }

  if (kit.audience.industry) {
    lines.push(`**Industry:** ${kit.audience.industry}`);
  }
  if (kit.audience.description) {
    lines.push(`**Target Audience:** ${kit.audience.description}`);
  }
  if (kit.audience.ageRange) {
    lines.push(`**Demographics:** Age ${kit.audience.ageRange}, Location: ${kit.audience.location || "Global"}`);
  }

  return lines.join("\n");
}

const INDUSTRY_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  technology: { primary: "#6366f1", secondary: "#8b5cf6", accent: "#06b6d4" },
  healthcare: { primary: "#0ea5e9", secondary: "#14b8a6", accent: "#22c55e" },
  finance: { primary: "#1e40af", secondary: "#3b82f6", accent: "#f59e0b" },
  education: { primary: "#7c3aed", secondary: "#a78bfa", accent: "#f97316" },
  food: { primary: "#dc2626", secondary: "#f97316", accent: "#facc15" },
  fashion: { primary: "#ec4899", secondary: "#f43f5e", accent: "#a855f7" },
  fitness: { primary: "#16a34a", secondary: "#22c55e", accent: "#eab308" },
  real_estate: { primary: "#0d9488", secondary: "#14b8a6", accent: "#f59e0b" },
  creative: { primary: "#e11d48", secondary: "#be185d", accent: "#8b5cf6" },
  legal: { primary: "#1e3a5f", secondary: "#374151", accent: "#d4a853" },
  nonprofit: { primary: "#059669", secondary: "#10b981", accent: "#6366f1" },
  ecommerce: { primary: "#7c3aed", secondary: "#6366f1", accent: "#f59e0b" },
};

export function suggestColors(industry: string): { primary: string; secondary: string; accent: string } {
  const key = industry.toLowerCase().replace(/[\s&-]+/g, "_");
  return INDUSTRY_COLORS[key] || INDUSTRY_COLORS.technology;
}

export function generateVoiceSample(kit: BrandKit): string {
  const toneVal = kit.voice.tone;
  const formalVal = kit.voice.formality;
  const complexVal = kit.voice.complexity;
  const brandName = kit.logo?.text || "our company";
  const industry = kit.audience.industry || "business";

  if (toneVal > 66 && formalVal > 66) {
    return `Hey there! Welcome to ${brandName} - we're shaking up the ${industry} world and having a blast doing it. No boring corporate speak here. Just real talk, real results, and maybe a few high-fives along the way. Ready to join the fun?`;
  }
  if (toneVal < 33 && formalVal < 33) {
    return `${brandName} delivers enterprise-grade ${industry} solutions engineered for measurable impact. Our methodology combines data-driven strategy with proven frameworks to drive sustainable growth. We partner with organizations committed to operational excellence and transformative outcomes.`;
  }
  if (complexVal > 66) {
    return `At ${brandName}, we keep things simple. Need help with ${industry}? We've got you covered. No jargon, no complicated processes - just straightforward solutions that work. Let's chat about what you need.`;
  }
  if (complexVal < 33) {
    return `${brandName} leverages cutting-edge ${industry} methodologies and proprietary frameworks to deliver optimized solutions. Our multi-vector approach integrates cross-functional capabilities with advanced analytics for maximum ROI.`;
  }
  return `Welcome to ${brandName}. We're a ${industry} company built on the belief that great results come from genuine partnerships. Our team brings deep expertise and a collaborative approach to every project. Let's build something meaningful together.`;
}

export function exportBrandKit(kit: BrandKit): string {
  return JSON.stringify(kit, null, 2);
}

export function importBrandKit(json: string): BrandKit {
  const parsed = JSON.parse(json);
  // Validate required fields
  if (!parsed.colors || !parsed.typography || !parsed.voice || !parsed.audience) {
    throw new Error("Invalid brand kit format: missing required fields");
  }
  return {
    ...getDefaultBrandKit(),
    ...parsed,
    updatedAt: new Date().toISOString(),
  };
}
