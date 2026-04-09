/**
 * Zoobicon MCP (Model Context Protocol) Server
 * Real JSON-RPC 2.0 implementation per https://modelcontextprotocol.io
 *
 * Exposes Zoobicon products as MCP tools so that Claude Desktop,
 * Cursor, Windsurf, and any other MCP client can call them.
 *
 * No @modelcontextprotocol/sdk dependency -- pure TypeScript.
 *
 * IMPORTANT: This file must NOT import from @/lib/component-registry
 * at the top level. Use dynamic imports only where needed.
 */

// ---------- JSON-RPC 2.0 types ----------

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: unknown;
}

export interface JsonRpcSuccess<T = unknown> {
  jsonrpc: "2.0";
  id: string | number | null;
  result: T;
}

export interface JsonRpcError {
  jsonrpc: "2.0";
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export type JsonRpcResponse<T = unknown> = JsonRpcSuccess<T> | JsonRpcError;

// ---------- MCP types ----------

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpToolCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface McpToolCallResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export const MCP_PROTOCOL_VERSION = "2025-06-18";
export const MCP_SERVER_NAME = "zoobicon";
export const MCP_SERVER_VERSION = "1.1.0";
export const MCP_SERVER_DESCRIPTION =
  "Zoobicon MCP server -- generate websites, search domains, create videos, generate images, transcribe audio, and more. 75+ AI products callable as MCP tools.";

// ---------- Internal helpers ----------

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function internalPost(path: string, body: unknown, timeoutMs = 120_000): Promise<unknown> {
  const url = `${getBaseUrl()}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!res.ok) {
      return { ok: false, error: `${path} returned ${res.status}: ${res.statusText}`, data };
    }
    return { ok: true, ...(typeof data === "object" && data !== null ? data : { data }) };
  } finally {
    clearTimeout(timer);
  }
}

async function internalGet(path: string, timeoutMs = 30_000): Promise<unknown> {
  const url = `${getBaseUrl()}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    const text = await res.text();
    let data: unknown;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!res.ok) {
      return { ok: false, error: `${path} returned ${res.status}: ${res.statusText}`, data };
    }
    return { ok: true, ...(typeof data === "object" && data !== null ? data : { data }) };
  } finally {
    clearTimeout(timer);
  }
}

function str(args: Record<string, unknown>, key: string, fallback = ""): string {
  const v = args[key];
  return typeof v === "string" ? v : fallback;
}

// ---------- Tool catalog ----------

type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

interface InternalTool {
  def: McpToolDefinition;
  handler: ToolHandler;
}

const TOOLS: InternalTool[] = [
  // ================================================================
  // 1. generate_website
  // ================================================================
  {
    def: {
      name: "generate_website",
      description:
        "Generate a complete React/Next.js website from a natural-language prompt using Zoobicon's multi-agent AI pipeline. Returns generated files and dependencies suitable for Sandpack preview or deployment.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Natural-language description of the website to generate (e.g. 'A SaaS landing page for a project management tool with pricing table and testimonials')",
          },
          mode: {
            type: "string",
            enum: ["fast", "premium"],
            description: "Generation mode. 'fast' uses Haiku for speed (<15s). 'premium' uses Opus for maximum quality (<60s). Default: fast.",
          },
        },
        required: ["prompt"],
      },
    },
    handler: async (args) => {
      const prompt = str(args, "prompt");
      if (!prompt) return { ok: false, error: "prompt is required" };
      if (prompt.length > 2000) return { ok: false, error: "prompt must be 1-2000 characters" };
      const mode = str(args, "mode", "fast");
      // The react-stream endpoint is SSE-based, so for MCP we use the non-streaming react endpoint
      // which returns { files, dependencies } as JSON
      const result = await internalPost("/api/generate/react", { prompt, mode });
      return result;
    },
  },

  // ================================================================
  // 2. search_domains
  // ================================================================
  {
    def: {
      name: "search_domains",
      description:
        "Search domain name availability across multiple TLDs using Zoobicon's OpenSRS-backed registry. Returns availability status and pricing for each TLD.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Domain name or keyword to search (e.g. 'mycompany' or 'techstartup')",
          },
          tlds: {
            type: "array",
            items: { type: "string" },
            description: "Optional list of TLDs to check (e.g. ['com', 'ai', 'io']). Defaults to popular TLDs if omitted.",
          },
        },
        required: ["query"],
      },
    },
    handler: async (args) => {
      const query = str(args, "query");
      if (!query || query.length < 2) return { ok: false, error: "query must be at least 2 characters" };
      const tlds = Array.isArray(args.tlds) ? (args.tlds as string[]) : undefined;
      const qs = new URLSearchParams();
      qs.set("q", query);
      if (tlds && tlds.length > 0) qs.set("tlds", tlds.join(","));
      return await internalGet(`/api/domains/search?${qs.toString()}`);
    },
  },

  // ================================================================
  // 3. generate_video
  // ================================================================
  {
    def: {
      name: "generate_video",
      description:
        "Generate an AI spokesperson video using Zoobicon's own pipeline (Fish Speech TTS + FLUX avatar + lip-sync via Replicate). Describe what you want and the AI Video Director will write scripts and produce the video.",
      inputSchema: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "Natural-language description of the video you want (e.g. 'A 30-second product demo video for a fitness app targeting young professionals')",
          },
        },
        required: ["description"],
      },
    },
    handler: async (args) => {
      const description = str(args, "description");
      if (!description) return { ok: false, error: "description is required" };
      if (description.length > 3000) return { ok: false, error: "description must be 1-3000 characters" };
      // The video-creator/chat endpoint expects messages in chat format
      const result = await internalPost("/api/video-creator/chat", {
        messages: [{ role: "user", content: description }],
      }, 180_000);
      return result;
    },
  },

  // ================================================================
  // 4. check_domain_availability
  // ================================================================
  {
    def: {
      name: "check_domain_availability",
      description:
        "Check if a specific domain name is available for registration. Returns availability status and pricing.",
      inputSchema: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "Full domain name to check (e.g. 'example.com', 'myapp.ai')",
          },
        },
        required: ["domain"],
      },
    },
    handler: async (args) => {
      const domain = str(args, "domain");
      if (!domain) return { ok: false, error: "domain is required" };
      // Extract the name and TLD from the domain
      const parts = domain.split(".");
      if (parts.length < 2) return { ok: false, error: "domain must include a TLD (e.g. example.com)" };
      const name = parts.slice(0, -1).join(".");
      const tld = parts[parts.length - 1];
      const qs = new URLSearchParams();
      qs.set("q", name);
      qs.set("tlds", tld);
      return await internalGet(`/api/domains/search?${qs.toString()}`);
    },
  },

  // ================================================================
  // 5. transcribe_audio
  // ================================================================
  {
    def: {
      name: "transcribe_audio",
      description:
        "Transcribe an audio file to text using AI speech-to-text. Accepts a public URL to an audio file (MP3, WAV, etc).",
      inputSchema: {
        type: "object",
        properties: {
          audio_url: {
            type: "string",
            description: "Public URL of the audio file to transcribe",
          },
        },
        required: ["audio_url"],
      },
    },
    handler: async (args) => {
      const audioUrl = str(args, "audio_url");
      if (!audioUrl) return { ok: false, error: "audio_url is required" };
      try {
        new URL(audioUrl);
      } catch {
        return { ok: false, error: "audio_url must be a valid URL" };
      }
      // Try Deepgram module via dynamic import
      try {
        const mod: Record<string, unknown> = await import("@/lib/deepgram");
        const fn = (mod.transcribeAudio || mod.default) as ((url: string) => Promise<{ text?: string; transcript?: string; confidence?: number }>) | undefined;
        if (typeof fn === "function") {
          const result = await fn(audioUrl);
          return {
            ok: true,
            text: result?.text ?? result?.transcript ?? "",
            confidence: result?.confidence ?? null,
          };
        }
      } catch {
        // Deepgram not available, try video-captions
      }
      // Fallback: try the video-creator voiceover/transcription endpoint
      try {
        const result = await internalPost("/api/video-creator/voiceover", {
          mode: "transcribe",
          audioUrl,
        });
        return result;
      } catch {
        return { ok: false, error: "Transcription service not available. Ensure DEEPGRAM_API_KEY is set." };
      }
    },
  },

  // ================================================================
  // 6. generate_image
  // ================================================================
  {
    def: {
      name: "generate_image",
      description:
        "Generate AI images from a text prompt using FLUX on Replicate (with DALL-E and Stability AI fallbacks).",
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Description of the image to generate (e.g. 'A modern minimalist office space with warm lighting')",
          },
          style: {
            type: "string",
            enum: ["photo", "illustration", "3d", "artistic"],
            description: "Image style. Default: photo.",
          },
          width: {
            type: "number",
            description: "Image width in pixels. Default: 1024.",
          },
          height: {
            type: "number",
            description: "Image height in pixels. Default: 768.",
          },
        },
        required: ["prompt"],
      },
    },
    handler: async (args) => {
      const prompt = str(args, "prompt");
      if (!prompt) return { ok: false, error: "prompt is required" };
      const style = str(args, "style", "photo");
      const width = typeof args.width === "number" ? args.width : 1024;
      const height = typeof args.height === "number" ? args.height : 768;
      return await internalPost("/api/generate/ai-images", {
        prompt,
        style,
        width,
        height,
      });
    },
  },

  // ================================================================
  // 7. edit_website (bonus -- diff-based editing)
  // ================================================================
  {
    def: {
      name: "edit_website",
      description:
        "Apply a natural-language edit to an existing set of generated files. Uses diff-based editing for speed (2-5 seconds). Only changed files are regenerated.",
      inputSchema: {
        type: "object",
        properties: {
          files: {
            type: "object",
            description: "Map of filepath to file contents (the current state of the project)",
          },
          instruction: {
            type: "string",
            description: "What to change (e.g. 'Make the header blue and add a testimonials section')",
          },
        },
        required: ["files", "instruction"],
      },
    },
    handler: async (args) => {
      const instruction = str(args, "instruction");
      if (!instruction) return { ok: false, error: "instruction is required" };
      if (!args.files || typeof args.files !== "object") {
        return { ok: false, error: "'files' must be an object mapping filepath to contents" };
      }
      return await internalPost("/api/generate/edit", {
        files: args.files,
        instruction,
      });
    },
  },

  // ================================================================
  // 8. deploy_site (bonus -- one-click deploy)
  // ================================================================
  {
    def: {
      name: "deploy_site",
      description:
        "Deploy generated website files to zoobicon.sh hosting. Returns a live URL.",
      inputSchema: {
        type: "object",
        properties: {
          projectName: {
            type: "string",
            description: "Project name (used as subdomain: projectname.zoobicon.sh)",
          },
          files: {
            type: "object",
            description: "Map of filepath to file contents to deploy",
          },
        },
        required: ["projectName", "files"],
      },
    },
    handler: async (args) => {
      const projectName = str(args, "projectName");
      if (!projectName) return { ok: false, error: "projectName is required" };
      if (!args.files || typeof args.files !== "object") {
        return { ok: false, error: "'files' must be an object" };
      }
      return await internalPost("/api/hosting/deploy", {
        projectName,
        files: args.files,
      });
    },
  },

  // ================================================================
  // 9. suggest_business_names (bonus -- AI name generator)
  // ================================================================
  {
    def: {
      name: "suggest_business_names",
      description:
        "Generate AI business name suggestions with domain availability checks. Great for brainstorming brand names.",
      inputSchema: {
        type: "object",
        properties: {
          description: {
            type: "string",
            description: "Business description to generate names for",
          },
          style: {
            type: "string",
            description: "Optional naming style (modern, playful, professional, minimal, etc)",
          },
          count: {
            type: "number",
            description: "Number of name suggestions (default: 12)",
          },
        },
        required: ["description"],
      },
    },
    handler: async (args) => {
      const description = str(args, "description");
      if (!description) return { ok: false, error: "description is required" };
      const style = str(args, "style", "");
      const count = typeof args.count === "number" ? args.count : 12;
      return await internalPost("/api/tools/business-names", { description, style, count });
    },
  },

  // ================================================================
  // 10. register_domain (bonus -- domain registration)
  // ================================================================
  {
    def: {
      name: "register_domain",
      description:
        "Register a domain via Zoobicon's OpenSRS-backed registrar. Requires registrant contact information.",
      inputSchema: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description: "Full domain to register (e.g. example.com)",
          },
          registrant: {
            type: "object",
            description: "Registrant contact: { firstName, lastName, email, phone, address, city, country, postalCode }",
          },
          years: {
            type: "number",
            description: "Registration period in years (default: 1)",
          },
        },
        required: ["domain", "registrant"],
      },
    },
    handler: async (args) => {
      const domain = str(args, "domain");
      if (!domain) return { ok: false, error: "domain is required" };
      if (!args.registrant || typeof args.registrant !== "object") {
        return { ok: false, error: "'registrant' must be a contact object" };
      }
      const years = typeof args.years === "number" ? args.years : 1;
      return await internalPost("/api/domains/register", {
        domain,
        registrant: args.registrant,
        years,
      });
    },
  },

  // ================================================================
  // 11. generate_voiceover (bonus -- TTS)
  // ================================================================
  {
    def: {
      name: "generate_voiceover",
      description:
        "Generate a text-to-speech voiceover using Zoobicon's Replicate fallback chain (Kokoro, Fish Speech, Orpheus, XTTS v2).",
      inputSchema: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Text to convert to speech",
          },
          voice: {
            type: "string",
            description: "Optional voice style or ID",
          },
        },
        required: ["text"],
      },
    },
    handler: async (args) => {
      const text = str(args, "text");
      if (!text) return { ok: false, error: "text is required" };
      return await internalPost("/api/video-creator/voiceover", { text, voice: str(args, "voice", "") });
    },
  },

  // ================================================================
  // 12. analyze_seo (bonus -- SEO audit)
  // ================================================================
  {
    def: {
      name: "analyze_seo",
      description:
        "Run a full SEO audit on a URL -- meta tags, headings, structured data, performance hints.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Target URL to audit" },
        },
        required: ["url"],
      },
    },
    handler: async (args) => {
      const url = str(args, "url");
      if (!url) return { ok: false, error: "url is required" };
      return await internalPost("/api/tools/seo-analyzer", { url });
    },
  },

  // ================================================================
  // 13. send_email (bonus -- transactional email)
  // ================================================================
  {
    def: {
      name: "send_email",
      description:
        "Send a transactional email via Mailgun. Includes the Zoobicon four-domain footer automatically.",
      inputSchema: {
        type: "object",
        properties: {
          to: { type: "string", description: "Recipient email address" },
          subject: { type: "string", description: "Email subject line" },
          html: { type: "string", description: "HTML body content" },
        },
        required: ["to", "subject", "html"],
      },
    },
    handler: async (args) => {
      const to = str(args, "to");
      const subject = str(args, "subject");
      const html = str(args, "html");
      if (!to || !subject || !html) return { ok: false, error: "to, subject, and html are all required" };
      if (!process.env.MAILGUN_API_KEY) {
        return { ok: false, error: "Email service not configured. MAILGUN_API_KEY required." };
      }
      return await internalPost("/api/email/send", { to, subject, html });
    },
  },

  // ================================================================
  // 14. list_components (bonus -- component registry)
  // ================================================================
  {
    def: {
      name: "list_components",
      description:
        "Return the Zoobicon component registry catalogue (60+ components: navbars, heroes, features, pricing, etc). Use this to see what building blocks are available for site generation.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => {
      // Dynamic import to avoid TDZ issues with component-registry
      try {
        const mod = await import("@/lib/component-registry");
        const REGISTRY = mod.REGISTRY as Array<{ id: string; name: string; category: string; variant: string; description: string; tags: string[] }>;
        const components = REGISTRY.map((c) => ({
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
        return { ok: true, total: components.length, byCategory, components };
      } catch {
        return { ok: false, error: "Component registry unavailable" };
      }
    },
  },

  // ================================================================
  // 15. get_pricing (bonus -- pricing info)
  // ================================================================
  {
    def: {
      name: "get_pricing",
      description: "Return the Zoobicon subscription tiers and pricing.",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    handler: async () => ({
      ok: true,
      currency: "USD",
      tiers: [
        { id: "starter", name: "Starter", price: 49, interval: "month", features: ["Site", "Domain", "Email (3 mailboxes)", "SSL"] },
        { id: "pro", name: "Pro", price: 129, interval: "month", features: ["Everything in Starter", "AI auto-reply", "SEO monitor"] },
        { id: "agency", name: "Agency", price: 299, interval: "month", features: ["Everything in Pro", "AI video", "5 sites", "Priority support"] },
        { id: "white-label", name: "White-label", price: 499, interval: "month", features: ["Full platform reseller licence"] },
      ],
    }),
  },
];

// ---------- Exported tool list ----------

export const ZOOBICON_MCP_TOOLS: McpToolDefinition[] = TOOLS.map((t) => t.def);

function findTool(name: string): InternalTool | undefined {
  return TOOLS.find((t) => t.def.name === name);
}

// ---------- JSON-RPC error helpers ----------

const ERR_INVALID_REQUEST = -32600;
const ERR_METHOD_NOT_FOUND = -32601;
const ERR_INVALID_PARAMS = -32602;
const ERR_INTERNAL = -32603;

function makeError(
  id: string | number | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcError {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

function makeSuccess<T>(
  id: string | number | null,
  result: T,
): JsonRpcSuccess<T> {
  return { jsonrpc: "2.0", id, result };
}

function isJsonRpcRequest(x: unknown): x is JsonRpcRequest {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return r.jsonrpc === "2.0" && typeof r.method === "string";
}

// ---------- Method dispatcher ----------

async function dispatch(req: JsonRpcRequest): Promise<JsonRpcResponse> {
  const id = req.id ?? null;

  try {
    switch (req.method) {
      // MCP lifecycle: initialize
      case "initialize": {
        return makeSuccess(id, {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: {
            tools: { listChanged: false },
            resources: { listChanged: false },
            prompts: { listChanged: false },
          },
          serverInfo: {
            name: MCP_SERVER_NAME,
            version: MCP_SERVER_VERSION,
          },
          instructions: MCP_SERVER_DESCRIPTION,
        });
      }

      // MCP: notifications/initialized (client acknowledgement -- no response needed for notifications, but we handle gracefully)
      case "notifications/initialized": {
        return makeSuccess(id, {});
      }

      // List all available tools
      case "tools/list": {
        return makeSuccess(id, { tools: ZOOBICON_MCP_TOOLS });
      }

      // Call a specific tool
      case "tools/call": {
        const params = req.params as McpToolCallParams | undefined;
        if (!params || typeof params.name !== "string") {
          return makeError(id, ERR_INVALID_PARAMS, "params.name is required for tools/call");
        }
        const tool = findTool(params.name);
        if (!tool) {
          return makeError(
            id,
            ERR_METHOD_NOT_FOUND,
            `Unknown tool: '${params.name}'. Use tools/list to see available tools.`,
          );
        }
        try {
          const result = await tool.handler(params.arguments ?? {});
          const text =
            typeof result === "string"
              ? result
              : JSON.stringify(result, null, 2);
          const ok: McpToolCallResult = {
            content: [{ type: "text", text }],
          };
          return makeSuccess(id, ok);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const errResult: McpToolCallResult = {
            content: [{ type: "text", text: `Error: ${message}` }],
            isError: true,
          };
          return makeSuccess(id, errResult);
        }
      }

      // Resources (empty for now)
      case "resources/list": {
        return makeSuccess(id, { resources: [] });
      }

      // Prompts (empty for now)
      case "prompts/list": {
        return makeSuccess(id, { prompts: [] });
      }

      // Ping
      case "ping": {
        return makeSuccess(id, {});
      }

      default:
        return makeError(
          id,
          ERR_METHOD_NOT_FOUND,
          `Method not found: ${req.method}`,
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return makeError(id, ERR_INTERNAL, message);
  }
}

/**
 * Public entry point. Accepts a single JSON-RPC request or a batch.
 * Returns the matching response or response array.
 */
export async function handleMcpRequest(body: unknown): Promise<unknown> {
  // Batch
  if (Array.isArray(body)) {
    if (body.length === 0) {
      return makeError(null, ERR_INVALID_REQUEST, "empty batch");
    }
    const responses = await Promise.all(
      body.map((entry) => {
        if (!isJsonRpcRequest(entry)) {
          return Promise.resolve(
            makeError(null, ERR_INVALID_REQUEST, "invalid request in batch"),
          );
        }
        return dispatch(entry);
      }),
    );
    return responses;
  }

  // Single
  if (!isJsonRpcRequest(body)) {
    return makeError(null, -32700, "Invalid JSON-RPC 2.0 request. Expected { jsonrpc: '2.0', method: string, id, params? }");
  }
  return dispatch(body);
}
