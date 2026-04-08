import Anthropic from '@anthropic-ai/sdk';

export interface ConvertImageOptions {
  notes?: string;
  brandName?: string;
}

export interface ConvertImageResult {
  files: Record<string, string>;
  dependencies: Record<string, string>;
}

const BANNED_BUZZWORDS = [
  'revolutionary',
  'unleash',
  'empower',
  'synergy',
  'next-generation',
  'game-changer',
  'leverage',
  'elevate',
];

const SYSTEM_PROMPT = `You are a senior frontend engineer at a $100K agency. Recreate the layout shown in the screenshot as a production-ready Next.js 14 (App Router) + TypeScript + Tailwind CSS site.

Hard requirements:
- Pixel-aware recreation of the screenshot's layout, hierarchy, color, typography, and spacing.
- Clean, idiomatic React Server Components where possible. Use 'use client' only when needed for interactivity.
- TypeScript strict. No 'any'. No untyped props.
- Tailwind only. No CSS-in-JS, no styled-components, no CSS modules.
- Responsive mobile-first. WCAG AA. Semantic HTML. SEO meta in layout/page.
- $100K agency aesthetic: scroll-triggered animations, hover micro-interactions, gradient accents, generous spacing, text-balance, tracking-tight, premium typography.
- Components must MOVE: framer-motion entry animations, hover transforms, animated underlines, gradient borders where appropriate.
- Real, plausible copy. No lorem ipsum. No fluff.
- BANNED words (never output): ${BANNED_BUZZWORDS.join(', ')}.

Output format (STRICT JSON, no prose, no markdown fences):
{
  "files": {
    "/app/page.tsx": "...",
    "/app/layout.tsx": "...",
    "/app/globals.css": "...",
    "/components/Hero.tsx": "...",
    "...": "..."
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "tailwindcss": "3.4.0",
    "framer-motion": "12.0.0",
    "lucide-react": "0.460.0"
  }
}

Return ONLY the JSON object. No explanations. No code fences.`;

function extractJson(text: string): ConvertImageResult {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Model did not return JSON');
  }
  const json = trimmed.slice(start, end + 1);
  const parsed = JSON.parse(json) as ConvertImageResult;
  if (!parsed.files || typeof parsed.files !== 'object') {
    throw new Error('Invalid response: missing files');
  }
  if (!parsed.dependencies || typeof parsed.dependencies !== 'object') {
    parsed.dependencies = {
      next: '14.2.0',
      react: '18.3.1',
      'react-dom': '18.3.1',
    };
  }
  return parsed;
}

type SupportedMime = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

function normalizeMime(mimeType: string): SupportedMime {
  const m = mimeType.toLowerCase();
  if (m === 'image/jpg') return 'image/jpeg';
  if (m === 'image/jpeg' || m === 'image/png' || m === 'image/gif' || m === 'image/webp') {
    return m;
  }
  return 'image/png';
}

export async function convertImageToSite(
  imageBase64: string,
  mimeType: string,
  options: ConvertImageOptions = {}
): Promise<ConvertImageResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey });
  const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

  const userText: string[] = [
    'Recreate this screenshot as a complete Next.js + TypeScript + Tailwind site.',
  ];
  if (options.brandName) userText.push(`Brand name: ${options.brandName}.`);
  if (options.notes) userText.push(`Additional notes: ${options.notes}.`);
  userText.push('Return strict JSON only.');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: normalizeMime(mimeType),
              data: cleanBase64,
            },
          },
          {
            type: 'text',
            text: userText.join('\n'),
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  if (!textBlock) {
    throw new Error('Model returned no text content');
  }

  return extractJson(textBlock.text);
}
