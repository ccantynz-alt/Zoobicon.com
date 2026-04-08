/**
 * Grammar Checker — powered by Anthropic Claude Haiku 4.5
 * Provides grammar checking, rewriting, and language detection.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

export type IssueType = 'grammar' | 'spelling' | 'style' | 'clarity' | 'tone';

export interface GrammarIssue {
  type: IssueType;
  offset: number;
  length: number;
  original: string;
  suggestion: string;
  explanation: string;
}

export interface GrammarCheckResult {
  issues: GrammarIssue[];
  score: number;
  corrected: string;
}

export type RewriteTone =
  | 'professional'
  | 'casual'
  | 'friendly'
  | 'persuasive'
  | 'concise';

export interface RewriteResult {
  rewritten: string;
  tone: RewriteTone;
}

export interface LanguageDetectionResult {
  language: string;
  code: string;
  confidence: number;
}

export interface GrammarCheckOptions {
  includeStyle?: boolean;
  includeTone?: boolean;
  targetAudience?: string;
}

export class GrammarCheckerError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'GrammarCheckerError';
  }
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
}

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new GrammarCheckerError(
      'ANTHROPIC_API_KEY is not configured. Set it in your environment to use grammar checking.',
      503
    );
  }
  return key;
}

async function callClaude(systemPrompt: string, userPrompt: string, maxTokens = 2048): Promise<string> {
  const apiKey = getApiKey();
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new GrammarCheckerError(
      `Anthropic API error (${res.status}): ${errText}`,
      res.status
    );
  }

  const data = (await res.json()) as AnthropicResponse;
  const block = data.content?.find((b) => b.type === 'text');
  if (!block || !block.text) {
    throw new GrammarCheckerError('Empty response from Anthropic', 502);
  }
  return block.text;
}

function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new GrammarCheckerError('Failed to parse JSON from model output', 502);
  }
  const sliced = candidate.slice(start, end + 1);
  try {
    return JSON.parse(sliced) as T;
  } catch {
    throw new GrammarCheckerError('Invalid JSON from model output', 502);
  }
}

function isIssueType(value: string): value is IssueType {
  return (
    value === 'grammar' ||
    value === 'spelling' ||
    value === 'style' ||
    value === 'clarity' ||
    value === 'tone'
  );
}

interface RawIssue {
  type?: string;
  offset?: number;
  length?: number;
  original?: string;
  suggestion?: string;
  explanation?: string;
}

interface RawCheckResponse {
  issues?: RawIssue[];
  score?: number;
  corrected?: string;
}

export async function checkGrammar(
  text: string,
  opts: GrammarCheckOptions = {}
): Promise<GrammarCheckResult> {
  if (!text || !text.trim()) {
    return { issues: [], score: 100, corrected: text };
  }

  const includeStyle = opts.includeStyle ?? true;
  const includeTone = opts.includeTone ?? false;
  const audience = opts.targetAudience ?? 'general';

  const systemPrompt = `You are an expert grammar and writing assistant. Analyse the user's text and return a strict JSON object with this shape:
{
  "issues": [
    {
      "type": "grammar" | "spelling" | "style" | "clarity" | "tone",
      "offset": <character offset in original text>,
      "length": <length of original substring>,
      "original": "<exact substring>",
      "suggestion": "<replacement>",
      "explanation": "<brief why>"
    }
  ],
  "score": <integer 0-100 quality score>,
  "corrected": "<full corrected text>"
}

Rules:
- Only include style issues if includeStyle is true (currently ${includeStyle}).
- Only include tone issues if includeTone is true (currently ${includeTone}).
- Target audience: ${audience}.
- Offsets must be exact character positions in the ORIGINAL text.
- Output JSON only. No prose, no markdown fences.`;

  const userPrompt = `Analyse this text:\n\n${text}`;
  const raw = await callClaude(systemPrompt, userPrompt, 4096);
  const parsed = extractJson<RawCheckResponse>(raw);

  const issues: GrammarIssue[] = (parsed.issues ?? [])
    .filter((i): i is Required<Pick<RawIssue, 'type'>> & RawIssue =>
      typeof i.type === 'string' && isIssueType(i.type)
    )
    .map((i) => ({
      type: i.type as IssueType,
      offset: typeof i.offset === 'number' ? i.offset : 0,
      length: typeof i.length === 'number' ? i.length : 0,
      original: typeof i.original === 'string' ? i.original : '',
      suggestion: typeof i.suggestion === 'string' ? i.suggestion : '',
      explanation: typeof i.explanation === 'string' ? i.explanation : '',
    }));

  return {
    issues,
    score: typeof parsed.score === 'number' ? parsed.score : 100,
    corrected: typeof parsed.corrected === 'string' ? parsed.corrected : text,
  };
}

export async function rewriteText(text: string, tone: RewriteTone): Promise<RewriteResult> {
  if (!text || !text.trim()) {
    return { rewritten: text, tone };
  }

  const toneGuide: Record<RewriteTone, string> = {
    professional: 'formal, polished, business-appropriate, confident',
    casual: 'relaxed, conversational, everyday language',
    friendly: 'warm, approachable, encouraging',
    persuasive: 'compelling, action-oriented, benefit-focused',
    concise: 'short, direct, no filler, minimum words',
  };

  const systemPrompt = `You are an expert writer. Rewrite the user's text in a ${tone} tone (${toneGuide[tone]}). Preserve meaning and key facts. Return strict JSON:
{ "rewritten": "<rewritten text>" }
Output JSON only.`;

  const raw = await callClaude(systemPrompt, `Rewrite this text:\n\n${text}`, 4096);
  const parsed = extractJson<{ rewritten?: string }>(raw);
  return {
    rewritten: typeof parsed.rewritten === 'string' ? parsed.rewritten : text,
    tone,
  };
}

export async function detectLanguage(text: string): Promise<LanguageDetectionResult> {
  if (!text || !text.trim()) {
    return { language: 'Unknown', code: 'und', confidence: 0 };
  }

  const systemPrompt = `You are a language detection expert. Identify the language of the user's text. Return strict JSON:
{ "language": "<English name>", "code": "<ISO 639-1 two-letter code>", "confidence": <0-1 float> }
Output JSON only.`;

  const raw = await callClaude(systemPrompt, `Detect language:\n\n${text.slice(0, 2000)}`, 256);
  const parsed = extractJson<{ language?: string; code?: string; confidence?: number }>(raw);
  return {
    language: typeof parsed.language === 'string' ? parsed.language : 'Unknown',
    code: typeof parsed.code === 'string' ? parsed.code : 'und',
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
  };
}
