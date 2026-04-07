/**
 * AI Multi-Language Translator for generated sites.
 * Powered by Anthropic Claude Haiku for fast, culturally-aware translation.
 */
import Anthropic from "@anthropic-ai/sdk";

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
  { code: "pl", name: "Polish", nativeName: "Polski" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "sv", name: "Swedish", nativeName: "Svenska" },
  { code: "da", name: "Danish", nativeName: "Dansk" },
  { code: "no", name: "Norwegian", nativeName: "Norsk" },
  { code: "fi", name: "Finnish", nativeName: "Suomi" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
];

const HAIKU_MODEL = "claude-haiku-4-5-20251001";

export class TranslatorConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslatorConfigError";
  }
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new TranslatorConfigError(
      "ANTHROPIC_API_KEY is not set. Add it to your environment variables to enable AI translation."
    );
  }
  return new Anthropic({ apiKey });
}

function languageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang ? `${lang.name} (${lang.nativeName})` : code;
}

function buildSystemPrompt(sourceLang: string, targetLang: string): string {
  return `You are a senior professional translator and localization expert with 20+ years of experience translating marketing, product, and UI copy.

Source language: ${languageName(sourceLang)}
Target language: ${languageName(targetLang)}

Your principles:
- Cultural adaptation over literal translation. Idioms, metaphors, and humor must feel native to the target audience.
- Preserve the brand voice: confident, modern, premium. Never robotic. Never machine-translated feel.
- Maintain tone, register, and emotional cadence of the source.
- Keep proper nouns, brand names, product names, code identifiers, URLs, email addresses, and placeholders ({name}, {{value}}, %s, $variables) UNCHANGED.
- Never translate code, JSX tags, HTML attributes, CSS class names, or technical identifiers.
- Punctuation and spacing must follow target-language conventions.
- For right-to-left languages (Arabic), output natural RTL text without directional markers.
- Output ONLY the translation. No explanations. No quotes around the result. No prefixes like "Translation:".`;
}

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string = "en"
): Promise<string> {
  if (!text || !text.trim()) return text;
  if (targetLang === sourceLang) return text;

  const client = getClient();
  const response = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 2048,
    system: buildSystemPrompt(sourceLang, targetLang),
    messages: [
      {
        role: "user",
        content: `Translate the following text. Output only the translation:\n\n${text}`,
      },
    ],
  });

  const block = response.content[0];
  if (!block || block.type !== "text") {
    throw new Error("Translator returned no text content");
  }
  return block.text.trim();
}

export async function translateBatch(
  items: string[],
  targetLang: string,
  sourceLang: string = "en"
): Promise<string[]> {
  if (items.length === 0) return [];
  if (targetLang === sourceLang) return [...items];

  const client = getClient();
  const BATCH_SIZE = 20;
  const batches: string[][] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  const results = await Promise.all(
    batches.map(async (batch) => {
      const numbered = batch
        .map((item, idx) => `${idx + 1}. ${item.replace(/\n/g, " ")}`)
        .join("\n");

      const response = await client.messages.create({
        model: HAIKU_MODEL,
        max_tokens: 4096,
        system: buildSystemPrompt(sourceLang, targetLang),
        messages: [
          {
            role: "user",
            content: `Translate each numbered line below. Output the translations in the EXACT same numbered format (one per line, "N. translation"). Do not merge, skip, or reorder lines. There are ${batch.length} lines.\n\n${numbered}`,
          },
        ],
      });

      const block = response.content[0];
      if (!block || block.type !== "text") {
        throw new Error("Translator returned no text content");
      }

      const lines = block.text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const out: string[] = new Array(batch.length).fill("");
      for (const line of lines) {
        const match = line.match(/^(\d+)[.):\-\s]+(.*)$/);
        if (!match) continue;
        const idx = parseInt(match[1], 10) - 1;
        if (idx >= 0 && idx < batch.length) {
          out[idx] = match[2].trim();
        }
      }
      // Fallback: any blanks → original
      for (let i = 0; i < batch.length; i++) {
        if (!out[i]) out[i] = batch[i];
      }
      return out;
    })
  );

  return results.flat();
}

interface ExtractedString {
  fileIndex: number;
  start: number;
  end: number;
  original: string;
  isJsxText: boolean;
}

const TRANSLATABLE_PROPS = new Set([
  "title",
  "label",
  "placeholder",
  "alt",
  "aria-label",
  "ariaLabel",
  "description",
  "subtitle",
  "heading",
  "subheading",
  "buttonText",
  "ctaText",
  "tooltip",
  "helperText",
]);

function shouldTranslate(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  if (!/[a-zA-Z]/.test(trimmed)) return false;
  // Skip pure code-looking tokens
  if (/^[A-Z_][A-Z0-9_]*$/.test(trimmed)) return false;
  if (/^https?:\/\//.test(trimmed)) return false;
  if (/^[\w.-]+@[\w.-]+$/.test(trimmed)) return false;
  if (/^\{.*\}$/.test(trimmed)) return false;
  return true;
}

function extractFromFile(content: string, fileIndex: number): ExtractedString[] {
  const found: ExtractedString[] = [];

  // 1. JSX text content: >Some Text<  (must contain a letter, no { } that span the whole region)
  const jsxTextRegex = />([^<>{}]+)</g;
  let m: RegExpExecArray | null;
  while ((m = jsxTextRegex.exec(content)) !== null) {
    const original = m[1];
    if (!shouldTranslate(original)) continue;
    const start = m.index + 1;
    const end = start + original.length;
    found.push({ fileIndex, start, end, original, isJsxText: true });
  }

  // 2. Translatable string-literal props: title="..." label='...' placeholder={"..."}
  const propRegex = /\b([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*(?:\{?\s*)(["'`])((?:\\.|(?!\2)[^\\])*)\2/g;
  while ((m = propRegex.exec(content)) !== null) {
    const propName = m[1];
    if (!TRANSLATABLE_PROPS.has(propName)) continue;
    const quote = m[2];
    const value = m[3];
    if (!shouldTranslate(value)) continue;
    const valueStart = m.index + m[0].lastIndexOf(quote + value + quote) + 1;
    const valueEnd = valueStart + value.length;
    found.push({
      fileIndex,
      start: valueStart,
      end: valueEnd,
      original: value,
      isJsxText: false,
    });
  }

  return found;
}

function spliceTranslations(
  content: string,
  items: ExtractedString[],
  translations: Map<number, string>
): string {
  // Sort descending so earlier indices remain valid
  const sorted = [...items].sort((a, b) => b.start - a.start);
  let out = content;
  for (const item of sorted) {
    const idx = items.indexOf(item);
    const translated = translations.get(idx);
    if (!translated) continue;
    out = out.slice(0, item.start) + translated + out.slice(item.end);
  }
  return out;
}

export async function translateReactFiles(
  files: Record<string, string>,
  targetLang: string,
  sourceLang: string = "en"
): Promise<Record<string, string>> {
  if (targetLang === sourceLang) return { ...files };

  const fileNames = Object.keys(files);
  const allExtracted: ExtractedString[][] = fileNames.map(() => []);
  const flatStrings: string[] = [];
  const flatRefs: { fileIndex: number; itemIndex: number }[] = [];

  fileNames.forEach((name, fileIndex) => {
    const content = files[name];
    if (
      !/\.(tsx|jsx|ts|js|html)$/i.test(name) &&
      !content.includes("<") // skip non-markup files
    ) {
      return;
    }
    const extracted = extractFromFile(content, fileIndex);
    allExtracted[fileIndex] = extracted;
    extracted.forEach((item, itemIndex) => {
      flatStrings.push(item.original);
      flatRefs.push({ fileIndex, itemIndex });
    });
  });

  if (flatStrings.length === 0) return { ...files };

  const translatedFlat = await translateBatch(flatStrings, targetLang, sourceLang);

  // Group translations per file
  const perFile: Map<number, Map<number, string>> = new Map();
  flatRefs.forEach((ref, i) => {
    if (!perFile.has(ref.fileIndex)) perFile.set(ref.fileIndex, new Map());
    perFile.get(ref.fileIndex)!.set(ref.itemIndex, translatedFlat[i]);
  });

  const out: Record<string, string> = {};
  fileNames.forEach((name, fileIndex) => {
    const items = allExtracted[fileIndex];
    const translations = perFile.get(fileIndex);
    if (!items || items.length === 0 || !translations) {
      out[name] = files[name];
      return;
    }
    out[name] = spliceTranslations(files[name], items, translations);
  });

  return out;
}
