/**
 * Zoobicon Translator
 * Multi-language translation via Anthropic Claude Haiku 4.5.
 * No SDK — direct fetch to Anthropic Messages API.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_VERSION = '2023-06-01';

export interface TranslateResult {
  text: string;
  targetLang: string;
  sourceLang: string;
}

export interface BatchItem {
  id: string;
  text: string;
}

export interface BatchResult {
  id: string;
  text: string;
}

export interface LanguageInfo {
  code: string;
  name: string;
}

export class TranslatorError extends Error {
  public readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'TranslatorError';
    this.status = status;
  }
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
  error?: { message?: string };
}

function requireKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new TranslatorError('ANTHROPIC_API_KEY not configured', 503);
  }
  return key;
}

async function callClaude(
  system: string,
  user: string,
  maxTokens: number = 4096,
): Promise<string> {
  const key = requireKey();
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new TranslatorError(`Anthropic API error ${res.status}: ${txt}`, res.status);
  }

  const data = (await res.json()) as AnthropicResponse;
  const block = data.content?.find((b) => b.type === 'text');
  const text = block?.text;
  if (!text) {
    throw new TranslatorError('Empty response from Claude', 502);
  }
  return text.trim();
}

function langName(code: string): string {
  const map = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return map ? map.name : code;
}

/**
 * Translate plain text into target language.
 */
export async function translate(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<TranslateResult> {
  if (!text.trim()) {
    return { text: '', targetLang, sourceLang: sourceLang ?? 'auto' };
  }
  const src = sourceLang ?? (await detectLanguage(text));
  const system =
    'You are a professional translator. Translate the user message into the requested target language. ' +
    'Preserve meaning, tone, formatting, line breaks, punctuation and inline code. ' +
    'Output ONLY the translated text — no preface, no quotes, no explanation.';
  const user = `Source language: ${langName(src)} (${src})
Target language: ${langName(targetLang)} (${targetLang})

Text to translate:
${text}`;
  const out = await callClaude(system, user, Math.max(1024, text.length * 4));
  return { text: out, targetLang, sourceLang: src };
}

/**
 * Translate a batch of items in a single Claude call.
 */
export async function translateBatch(
  items: BatchItem[],
  targetLang: string,
): Promise<BatchResult[]> {
  if (items.length === 0) return [];
  const system =
    'You are a professional translator. You will receive a JSON array of objects with `id` and `text`. ' +
    'Translate each `text` into the target language. ' +
    'Output ONLY a valid JSON array of objects with `id` and `text` (translated). No prose, no markdown fences.';
  const user = `Target language: ${langName(targetLang)} (${targetLang})

${JSON.stringify(items)}`;
  const raw = await callClaude(system, user, 8192);
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new TranslatorError('Failed to parse batch translation JSON', 502);
  }
  if (!Array.isArray(parsed)) {
    throw new TranslatorError('Batch translation did not return an array', 502);
  }
  const result: BatchResult[] = [];
  for (const entry of parsed) {
    if (
      typeof entry === 'object' &&
      entry !== null &&
      'id' in entry &&
      'text' in entry &&
      typeof (entry as { id: unknown }).id === 'string' &&
      typeof (entry as { text: unknown }).text === 'string'
    ) {
      const e = entry as { id: string; text: string };
      result.push({ id: e.id, text: e.text });
    }
  }
  return result;
}

/**
 * Detect ISO language code of given text.
 */
export async function detectLanguage(text: string): Promise<string> {
  if (!text.trim()) return 'en';
  const system =
    'You are a language detector. Given a piece of text, respond with ONLY the lowercase ISO 639-1 ' +
    'two-letter code of the language (e.g. en, es, fr, ja, zh). No other text.';
  const sample = text.slice(0, 500);
  const out = await callClaude(system, sample, 8);
  const code = out.toLowerCase().replace(/[^a-z-]/g, '').slice(0, 5);
  return code || 'en';
}

/**
 * Translate HTML preserving tags and attributes.
 */
export async function translateHtml(html: string, targetLang: string): Promise<string> {
  if (!html.trim()) return '';
  const system =
    'You are a professional translator working on HTML. Translate ONLY the visible text content ' +
    'between tags into the target language. Do NOT translate tag names, attribute names, attribute values, ' +
    'URLs, class names, ids, inline JavaScript, or CSS. Preserve all whitespace and structure exactly. ' +
    'Output ONLY the translated HTML — no markdown fences, no explanation.';
  const user = `Target language: ${langName(targetLang)} (${targetLang})

${html}`;
  const out = await callClaude(system, user, Math.max(2048, html.length * 4));
  return out.replace(/^```(?:html)?\s*/i, '').replace(/```\s*$/, '').trim();
}

/**
 * Translate only specified fields of a JSON object.
 */
export async function translateJson<T extends Record<string, unknown>>(
  obj: T,
  targetLang: string,
  fields: string[],
): Promise<T> {
  const items: BatchItem[] = [];
  for (const f of fields) {
    const v = obj[f];
    if (typeof v === 'string' && v.trim()) {
      items.push({ id: f, text: v });
    }
  }
  if (items.length === 0) return { ...obj };
  const translated = await translateBatch(items, targetLang);
  const out: Record<string, unknown> = { ...obj };
  for (const t of translated) {
    out[t.id] = t.text;
  }
  return out as T;
}

/**
 * 100+ supported ISO 639-1 codes with English names.
 */
const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'eu', name: 'Basque' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ceb', name: 'Cebuano' },
  { code: 'ny', name: 'Chichewa' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'co', name: 'Corsican' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'et', name: 'Estonian' },
  { code: 'tl', name: 'Filipino' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'fy', name: 'Frisian' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'haw', name: 'Hawaiian' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'hmn', name: 'Hmong' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'jw', name: 'Javanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'ko', name: 'Korean' },
  { code: 'ku', name: 'Kurdish' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'la', name: 'Latin' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'my', name: 'Myanmar (Burmese)' },
  { code: 'ne', name: 'Nepali' },
  { code: 'no', name: 'Norwegian' },
  { code: 'or', name: 'Odia (Oriya)' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'ru', name: 'Russian' },
  { code: 'sm', name: 'Samoan' },
  { code: 'gd', name: 'Scots Gaelic' },
  { code: 'sr', name: 'Serbian' },
  { code: 'st', name: 'Sesotho' },
  { code: 'sn', name: 'Shona' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish' },
  { code: 'su', name: 'Sundanese' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tg', name: 'Tajik' },
  { code: 'ta', name: 'Tamil' },
  { code: 'tt', name: 'Tatar' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ug', name: 'Uyghur' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yi', name: 'Yiddish' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' },
];

export function supportedLanguages(): LanguageInfo[] {
  return [...SUPPORTED_LANGUAGES];
}
