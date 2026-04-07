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
    try {
      const obj = asRecord(args);
      const prompt = asString(obj.prompt, "prompt");
      if (prompt.length > 1000) {
        return { ok: false, error: "prompt must be 1-1000 chars" };
      }
      const fullStack = asBoolOpt(obj.fullStack, "fullStack") ?? false;
      const baseUrl = getBaseUrl();
      // Fire and forget — SSE happens client-side
      fetch(`${baseUrl}/api/generate/react-stream`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, fullStack }),
      }).catch(() => {});
      return {
        ok: true,
        status: "started",
        message:
          "Generation started — connect to /api/generate/react-stream for SSE updates",
        endpoint: "/api/generate/react-stream",
        payload: { prompt, fullStack },
      };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
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
        enum: ["professional", "warm", "energetic", "calm"],
        description: "Optional voice style",
      },
    },
    required: ["script"],
  },
  handler: async (args) => {
    try {
      const obj = asRecord(args);
      const script = asString(obj.script, "script");
      if (script.length > 2000) {
        return { ok: false, error: "script must be 1-2000 chars" };
      }
      const voiceStyle = asStringOpt(obj.voiceStyle, "voiceStyle");
      const allowed = ["professional", "warm", "energetic", "calm"] as const;
      if (voiceStyle && !allowed.includes(voiceStyle as typeof allowed[number])) {
        return { ok: false, error: `voiceStyle must be one of ${allowed.join(", ")}` };
      }
      const mod: any = await import("@/lib/video-pipeline");
      const fn = mod.generateFullVideo || mod.default;
      if (typeof fn !== "function") {
        return { ok: false, error: "video pipeline unavailable" };
      }
      const result = await fn({
        script,
        voiceStyle: (voiceStyle as any) ?? "professional",
      });
      return {
        ok: true,
        videoUrl: result?.videoUrl,
        audioUrl: result?.audioUrl,
        duration: result?.duration,
        cost: result?.cost,
      };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
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
      siteId: { type: "string", description: "Id of an existing site to deploy" },
      files: {
        type: "object",
        description: "Map of filepath -> file contents (alternative to siteId)",
      },
      projectName: { type: "string", description: "Project name (required with files)" },
    },
  },
  handler: async (args) => {
    try {
      const obj = asRecord(args);
      const siteId = asStringOpt(obj.siteId, "siteId");
      const projectName = asStringOpt(obj.projectName, "projectName");
      let files: Record<string, string> | undefined;
      if (obj.files !== undefined && obj.files !== null) {
        if (typeof obj.files !== "object") {
          return { ok: false, error: "'files' must be an object" };
        }
        files = obj.files as Record<string, string>;
      }

      if (!siteId && !(files && projectName)) {
        return {
          ok: false,
          error: "provide either 'siteId' or both 'files' and 'projectName'",
        };
      }

      // Resolve siteId → files via db, if applicable
      if (siteId && !files) {
        try {
          const dbMod: any = await import("@/lib/db");
          const getSite = dbMod.getSite || dbMod.getSiteById;
          if (typeof getSite === "function") {
            const site = await getSite(siteId);
            if (site?.files) files = site.files;
            if (site?.name && !projectName) {
              (obj as any).projectName = site.name;
            }
          }
        } catch {
          // db unavailable — fall through to hosting deploy
        }
      }

      // Try Vercel deploy module first
      try {
        const vercelMod: any = await import("@/lib/vercel-deploy");
        const deployFn =
          vercelMod.deployToVercel || vercelMod.deploy || vercelMod.default;
        if (typeof deployFn === "function") {
          const result = await deployFn({
            siteId,
            files,
            projectName: projectName || (obj as any).projectName,
          });
          return {
            ok: true,
            url: result?.url,
            deploymentId: result?.deploymentId || result?.id,
          };
        }
      } catch {
        // module not present yet — fall through
      }

      // Fallback: zoobicon.sh hosting deploy
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/api/hosting/deploy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ siteId, files, projectName }),
      });
      if (!res.ok) {
        return { ok: false, error: `deploy failed: ${res.status} ${res.statusText}` };
      }
      const data = await res.json();
      return {
        ok: true,
        url: data?.url,
        deploymentId: data?.deploymentId || data?.id || data?.slug,
      };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

// ── Tool: zoobicon.transcribe_audio ───────────────────────────────────────

const transcribeAudioTool: MCPTool = {
  name: "zoobicon.transcribe_audio",
  description: "Transcribe an audio file URL to text via Deepgram.",
  inputSchema: {
    type: "object",
    properties: {
      audioUrl: { type: "string", description: "Public URL of the audio file" },
    },
    required: ["audioUrl"],
  },
  handler: async (args) => {
    try {
      const obj = asRecord(args);
      const audioUrl = asString(obj.audioUrl, "audioUrl");
      const mod: any = await import("@/lib/deepgram");
      const fn = mod.transcribeAudio || mod.default;
      if (typeof fn !== "function") {
        return { ok: false, error: "deepgram transcribeAudio not available" };
      }
      const result = await fn(audioUrl);
      return {
        ok: true,
        text: result?.text ?? result?.transcript ?? "",
        confidence: result?.confidence ?? null,
      };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  },
};

// ── Tool: zoobicon.generate_image ─────────────────────────────────────────

const generateImageTool: MCPTool = {
  name: "zoobicon.generate_image",
  description: "Generate AI images via the Zoobicon image generation pipeline.",
  inputSchema: {
    type: "object",
    properties: {
      prompt: { type: "string", description: "Image description" },
      style: { type: "string", description: "Optional style hint" },
      numImages: { type: "number", description: "Number of images to generate" },
    },
    required: ["prompt"],
  },
  handler: async (args) => {
    try {
      const obj = asRecord(args);
      const prompt = asString(obj.prompt, "prompt");
      const style = asStringOpt(obj.style, "style");
      const numImages =
        typeof obj.numImages === "number" ? obj.numImages : undefined;
      try {
        const mod: any = await import("@/lib/image-gen");
        const fn = mod.generateImage || mod.default;
        if (typeof fn !== "function") {
          return {
            ok: false,
            error: "Image generation not available — set REPLICATE_API_TOKEN",
          };
        }
        const result = await fn({ prompt, style, numImages });
        return {
          ok: true,
          images: result?.images ?? result?.urls ?? [],
          cost: result?.cost ?? null,
        };
      } catch {
        return {
          ok: false,
          error: "Image generation not available — set REPLICATE_API_TOKEN",
        };
      }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
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
  transcribeAudioTool,
  generateImageTool,
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
