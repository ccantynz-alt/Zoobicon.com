/**
 * Template Snapshot System
 *
 * Pre-built, production-ready React website templates stored as Sandpack-ready file maps.
 * Instead of generating 8+ components from scratch (3 minutes), we:
 * 1. Classify user intent via keyword matching
 * 2. Serve a matching template instantly (<1 second)
 * 3. AI only customizes content (company name, headlines, colors) — NOT structure
 *
 * This is the KEY speed advantage: <10 seconds total vs 3 minutes from-scratch generation.
 */

import { saasTemplate } from "./saas";
import { agencyTemplate } from "./agency";
import { restaurantTemplate } from "./restaurant";
import { portfolioTemplate } from "./portfolio";
import { startupTemplate } from "./startup";

// ── Types ──

export interface TemplateSnapshot {
  id: string;
  name: string;
  industry: string;
  description: string;
  keywords: string[];
  files: Record<string, string>;
  colors: { primary: string; bg: string; text: string };
}

// ── Registry ──

export const TEMPLATE_SNAPSHOTS: TemplateSnapshot[] = [
  saasTemplate,
  agencyTemplate,
  restaurantTemplate,
  portfolioTemplate,
  startupTemplate,
];

// ── Matching ──

/**
 * Score a template against a user prompt.
 * Uses keyword frequency + exact phrase bonus + word boundary matching.
 */
function scoreTemplate(template: TemplateSnapshot, prompt: string): number {
  const lower = prompt.toLowerCase();
  const words = lower.split(/\s+/);
  let score = 0;

  for (const keyword of template.keywords) {
    const kw = keyword.toLowerCase();

    // Exact substring match in the full prompt (strongest signal)
    if (lower.includes(kw)) {
      score += kw.split(/\s+/).length * 3; // Multi-word keywords score higher
    }

    // Individual word match (weaker but catches partial matches)
    for (const word of words) {
      if (word === kw) {
        score += 2;
      } else if (word.includes(kw) || kw.includes(word)) {
        score += 1;
      }
    }
  }

  // Industry name direct match is a strong signal
  if (lower.includes(template.industry.toLowerCase())) {
    score += 10;
  }

  return score;
}

/**
 * Find the best matching template for a user prompt.
 * Returns the highest-scoring template, defaulting to SaaS if nothing matches well.
 */
export function findBestTemplate(prompt: string): TemplateSnapshot {
  let bestScore = 0;
  let bestTemplate = TEMPLATE_SNAPSHOTS[0]; // default: SaaS

  for (const template of TEMPLATE_SNAPSHOTS) {
    const score = scoreTemplate(template, prompt);
    if (score > bestScore) {
      bestScore = score;
      bestTemplate = template;
    }
  }

  return bestTemplate;
}

/**
 * Get a template by its ID. Returns undefined if not found.
 */
export function getTemplateById(id: string): TemplateSnapshot | undefined {
  return TEMPLATE_SNAPSHOTS.find((t) => t.id === id);
}

/**
 * List all available template IDs and names for UI display.
 */
export function listTemplates(): { id: string; name: string; industry: string }[] {
  return TEMPLATE_SNAPSHOTS.map((t) => ({
    id: t.id,
    name: t.name,
    industry: t.industry,
  }));
}
