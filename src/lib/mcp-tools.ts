/**
 * Zoobicon MCP Tool Registry
 *
 * Typed registry of tools exposed via the Model Context Protocol JSON-RPC
 * endpoint at /api/mcp. External Claude / GPT / Gemini clients can list and
 * invoke these to drive the Zoobicon platform.
 */

import { REGISTRY, type RegistryComponent } from "@/lib/component-registry";

// ── Types ──────────────────────────────────────────────────────────────────

export interface MCPJsonSchema {
  type: "object";
  properties: Record<string, unknown>;
  required?: string[];
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: MCPJsonSchema;
  handler: (args: unknown) => Promise<unknown>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    throw new Error("arguments must be an object");
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`'${field}' must be a non-empty string`);
  }
  return value;
}

function asStringOpt(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new Error(`'${field}' must be a string`);
  }
  return value;
}

function asStringArrayOpt(value: unknown, field: string): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    throw new Error(`'${field}' must be an array of strings`);
  }
  return value as string[];
}

function asBoolOpt(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw new Error(`'${field}' must be a boolean`);
  }
  return value;
}

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function newJobId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

// ── Tool: zoobicon.search_domains ─────────────────────────────────────────

const searchDomainsTool: MCPTool = {
  name: "zoobicon.search_domains",
  description:
    "Search domain availability across TLDs via the Zoobicon OpenSRS-backed registry. Returns availability + pricing.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Domain name or keyword to search" },
      tlds: {
        type: "array",
        items: { type: "string" },
        description: "Optional list of TLDs to check (e.g. ['com','ai','io'])",
      },
    },
    required: ["query"],
  },
  handler: async (args) => {
    const obj = asRecord(args);
    const query = asString(obj.query, "query");
    const tlds = asStringArrayOpt(obj.tlds, "tlds");
    const url = new URL("/api/domains/search", getBaseUrl());
    url.searchParams.set("q", query);
    if (tlds && tlds.length > 0) url.searchParams.set("tlds", tlds.join(","));
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`domain search failed: ${res.status} ${res.statusText}`);
    }
    return await res.json();
  },
};

// ── Tool: zoobicon.generate_site ──────────────────────────────────────────

const generateSiteTool: MCPTool = {
  name: "zoobicon.generate_site",
  description:
    "Kick off an AI website generation job. Returns a job id immediately; client should poll for completion.",
  inputSchema: {
    type: "object",
    properties: {
      prompt: { type: "string", description: "Natural-language description of the site" },
      fullStack: {
        type: "boolean",
        description: "If true, include backend (auth, database, API routes)",
      },
    },
    required: ["prompt"],
  },
  handler: async (args) => {
    const obj = asRecord(args);
    const prompt = asString(obj.prompt, "prompt");
    const fullStack = asBoolOpt(obj.fullStack, "fullStack") ?? false;
    return {
      status: "queued",
      jobId: newJobId("site"),
      prompt,
      fullStack,
      note: "Stub — wire into real backend in next pass",
    };
  },
};

// ── Tool: zoobicon.generate_video ─────────────────────────────────────────

const generateVideoTool: MCPTool = {
  name: "zoobicon.generate_video",
  description:
    "Kick off an AI video generation job using the Zoobicon Replicate pipeline (Fish Speech + FLUX + OmniHuman).",
  inputSchema: {
    type: "object",
    properties: {
      script: { type: "string", description: "Spoken script for the video" },
      voiceStyle: {
        type: "string",
        description: "Optional voice style (e.g. 'energetic', 'calm', 'corporate')",
      },
    },
    required: ["script"],
  },
  handler: async (args) => {
    const obj = asRecord(args);
    const script = asString(obj.script, "script");
    const voiceStyle = asStringOpt(obj.voiceStyle, "voiceStyle");
    return {
      status: "queued",
      jobId: newJobId("video"),
      script,
      voiceStyle: voiceStyle ?? "default",
      note: "Stub — wire into real backend in next pass",
    };
  },
};

// ── Tool: zoobicon.list_components ────────────────────────────────────────

const listComponentsTool: MCPTool = {
  name: "zoobicon.list_components",
  description:
    "Return the full Zoobicon 60-component registry catalogue (id, name, category, variant, tags) for context-aware AI clients.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async () => {
    const components = REGISTRY.map((c: RegistryComponent) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      variant: c.variant,
      description: c.description,
      tags: c.tags,
    }));
    const byCategory: Record<string, number> = {};
    for (const c of components) {
      byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
    }
    return { total: components.length, byCategory, components };
  },
};

// ── Tool: zoobicon.deploy_site ────────────────────────────────────────────

const deploySiteTool: MCPTool = {
  name: "zoobicon.deploy_site",
  description: "Deploy a generated site to zoobicon.sh hosting.",
  inputSchema: {
    type: "object",
    properties: {
      siteId: { type: "string", description: "Id of the site to deploy" },
    },
    required: ["siteId"],
  },
  handler: async (args) => {
    const obj = asRecord(args);
    const siteId = asString(obj.siteId, "siteId");
    return {
      status: "queued",
      jobId: newJobId("deploy"),
      siteId,
      note: "Stub — wire into real backend in next pass",
    };
  },
};

// ── Tool: zoobicon.get_pricing_tiers ──────────────────────────────────────

const getPricingTiersTool: MCPTool = {
  name: "zoobicon.get_pricing_tiers",
  description: "Return the four Zoobicon subscription tiers and their included features.",
  inputSchema: {
    type: "object",
    properties: {},
  },
  handler: async () => {
    return {
      currency: "USD",
      tiers: [
        {
          id: "starter",
          name: "Starter",
          price: 49,
          interval: "month",
          features: ["Site", "Domain", "Email (3 mailboxes)", "SSL"],
        },
        {
          id: "pro",
          name: "Pro",
          price: 129,
          interval: "month",
          features: [
            "Everything in Starter",
            "AI auto-reply",
            "SEO monitor",
          ],
        },
        {
          id: "agency",
          name: "Agency",
          price: 299,
          interval: "month",
          features: [
            "Everything in Pro",
            "AI video",
            "5 sites",
            "Priority support",
          ],
        },
        {
          id: "white-label",
          name: "White-label",
          price: 499,
          interval: "month",
          features: ["Full platform reseller licence"],
        },
      ],
    };
  },
};

// ── Registry ───────────────────────────────────────────────────────────────

export const MCP_TOOLS: MCPTool[] = [
  searchDomainsTool,
  generateSiteTool,
  generateVideoTool,
  listComponentsTool,
  deploySiteTool,
  getPricingTiersTool,
];

export function getMCPTool(name: string): MCPTool | undefined {
  return MCP_TOOLS.find((t) => t.name === name);
}

export function listMCPToolDescriptors(): Array<{
  name: string;
  description: string;
  inputSchema: MCPJsonSchema;
}> {
  return MCP_TOOLS.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema,
  }));
}
