/**
 * Example: Content Moderator Agent
 *
 * Scans text content for prohibited patterns (profanity, spam links,
 * personal information leaks). Runs on demand when new content is submitted.
 *
 * Usage:
 *   npx ts-node examples/content-moderator.ts
 */

import { createAgent, type AgentFinding } from "../src";

interface ModerationInput {
  contentId: string;
  text: string;
  authorId?: string;
}

interface ModerationResult {
  contentId: string;
  flagged: boolean;
  reasons: string[];
  severity: "clean" | "warning" | "blocked";
}

// Simple pattern-based rules (in production, use an LLM or moderation API)
const RULES = [
  {
    name: "email-leak",
    pattern: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
    severity: "warning" as const,
    message: "Contains email address (potential PII leak)",
  },
  {
    name: "phone-leak",
    pattern: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    severity: "warning" as const,
    message: "Contains phone number (potential PII leak)",
  },
  {
    name: "spam-links",
    pattern: /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl)\/\w+/gi,
    severity: "warning" as const,
    message: "Contains URL shortener (potential spam)",
  },
  {
    name: "excessive-caps",
    pattern: /\b[A-Z]{10,}\b/g,
    severity: "info" as const,
    message: "Contains excessive capitalization",
  },
];

const contentModerator = createAgent<ModerationInput, ModerationResult>({
  id: "content-moderator",
  name: "Content Moderator",
  description: "Scans user content for prohibited patterns and PII leaks",
  maxConcurrency: 10,
  maxRetries: 0, // Moderation shouldn't retry
  taskTimeoutMs: 5000,
  discover: async () => {
    // In production, fetch unmoderated content from a queue
    return [
      { contentId: "post-1", text: "Check out this great deal at bit.ly/scam123!" },
      { contentId: "post-2", text: "Contact me at john@example.com or 555-123-4567" },
      { contentId: "post-3", text: "This is a perfectly normal comment about the weather." },
      { contentId: "post-4", text: "BUY NOW DISCOUNT AMAZING DEAL LIMITED TIME OFFER" },
    ];
  },
  execute: async (input) => {
    const { contentId, text } = input;
    const findings: AgentFinding[] = [];
    const reasons: string[] = [];
    let maxSeverity: "clean" | "warning" | "blocked" = "clean";

    for (const rule of RULES) {
      const matches = text.match(rule.pattern);
      if (matches && matches.length > 0) {
        reasons.push(rule.message);
        findings.push({
          severity: rule.severity === "warning" ? "warning" : "info",
          category: "moderation",
          title: `${rule.name} detected in ${contentId}`,
          description: `${rule.message}. Found ${matches.length} match(es): ${matches.slice(0, 3).join(", ")}`,
          autoFixed: false,
          metadata: { contentId, rule: rule.name, matchCount: matches.length },
        });

        if (rule.severity === "warning" && maxSeverity === "clean") {
          maxSeverity = "warning";
        }
      }
    }

    return {
      output: {
        contentId,
        flagged: reasons.length > 0,
        reasons,
        severity: maxSeverity,
      },
      confidence: 0.85, // Pattern-based is less confident than LLM-based
      findings,
    };
  },
});

contentModerator.run().then((result) => {
  console.log(`\nModeration complete:`);
  console.log(`  ${result.tasksCompleted} items scanned`);
  console.log(`  ${result.findings.length} issues detected`);
  for (const f of result.findings) {
    console.log(`  [${f.severity.toUpperCase()}] ${f.title}`);
  }
});
