/**
 * AI Logo Generator
 * Builds high-quality FLUX prompts and delegates to image-gen.ts (which has
 * its own multi-provider fallback chain per Bible Law 9).
 */

export type LogoStyle =
  | "minimal"
  | "modern"
  | "playful"
  | "luxury"
  | "tech"
  | "organic";

export interface LogoRequest {
  brand: string;
  industry?: string;
  style?: LogoStyle;
  colors?: string[];
  tagline?: string;
}

export interface LogoVariant {
  url: string;
  prompt: string;
  brand: string;
  style: LogoStyle;
}

const STYLE_DESCRIPTORS: Record<LogoStyle, string> = {
  minimal:
    "minimalist vector logo, ultra-clean geometry, generous negative space, single bold mark, swiss design",
  modern:
    "modern vector logo, contemporary geometric mark, crisp edges, 2026 design trends, refined typography",
  playful:
    "playful vector logo, friendly rounded shapes, vibrant character, approachable mark, hand-crafted feel",
  luxury:
    "luxury vector logo, elegant serif wordmark, refined monogram, premium gold accents, timeless mark",
  tech:
    "tech vector logo, futuristic geometric mark, abstract circuit-inspired symbol, sharp precision, startup brand",
  organic:
    "organic vector logo, natural flowing curves, leaf-inspired mark, soft botanical shapes, eco brand",
};

function buildPrompt(req: LogoRequest, variantSeed: number): string {
  const style: LogoStyle = req.style ?? "modern";
  const descriptor = STYLE_DESCRIPTORS[style];
  const industry = req.industry ? `, ${req.industry} industry` : "";
  const colors =
    req.colors && req.colors.length > 0
      ? `, color palette: ${req.colors.join(", ")}`
      : "";
  const variantHints = [
    "iconic symbol mark, centered composition",
    "abstract geometric monogram, balanced layout",
    "wordmark with custom letterforms, horizontal layout",
    "emblem badge style, contained mark",
  ];
  const variant = variantHints[variantSeed % variantHints.length];

  return [
    `${descriptor} for "${req.brand}"${industry}`,
    variant,
    "flat design, vector art, white background, perfectly centered, high contrast",
    "professional brand identity, award-winning logo design, behance featured",
    colors,
  ]
    .filter(Boolean)
    .join(", ");
}

const NEGATIVE_PROMPT =
  "text artifacts, garbled letters, misspelled text, realistic photo, photograph, 3d render, watermark, signature, low quality, blurry, jpeg artifacts, busy background, gradient mesh, drop shadow, multiple logos, collage, frame, border";

export async function generateLogo(
  req: LogoRequest
): Promise<{ variants: LogoVariant[] }> {
  if (!req.brand || typeof req.brand !== "string") {
    throw new Error("brand is required");
  }

  const style: LogoStyle = req.style ?? "modern";

  // Dynamic import to avoid pulling image-gen into bundles that don't need it.
  const { generateImage } = await import("./image-gen");

  const seeds = [0, 1, 2, 3];
  const results = await Promise.all(
    seeds.map(async (seed): Promise<LogoVariant> => {
      const prompt = buildPrompt(req, seed);
      const fullPrompt = `${prompt}. Negative: ${NEGATIVE_PROMPT}`;
      const img = await generateImage({
        prompt: fullPrompt,
        width: 1024,
        height: 1024,
        style: "illustration",
        quality: "hd",
      });
      return {
        url: img.url,
        prompt,
        brand: req.brand,
        style,
      };
    })
  );

  return { variants: results };
}
