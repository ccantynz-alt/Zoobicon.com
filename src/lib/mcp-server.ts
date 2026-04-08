/**
 * Zoobicon MCP (Model Context Protocol) Server
 * Raw JSON-RPC 2.0 implementation per https://modelcontextprotocol.io
 *
 * Exposes Zoobicon's product catalog as MCP tools so that Cursor,
 * Claude Desktop, Windsurf and any other MCP client can call them.
 *
 * No @modelcontextprotocol/sdk dependency — pure TypeScript.
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
export const MCP_SERVER_VERSION = "1.0.0";
export const MCP_SERVER_DESCRIPTION =
  "Zoobicon MCP server — 75+ AI products (websites, video, domains, email, images, docs, utilities) callable as MCP tools.";

// ---------- Tool catalog ----------

type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<unknown>;

interface InternalTool {
  def: McpToolDefinition;
  handler: ToolHandler;
}

function str(args: Record<string, unknown>, key: string, fallback = ""): string {
  const v = args[key];
  return typeof v === "string" ? v : fallback;
}

function num(args: Record<string, unknown>, key: string, fallback = 0): number {
  const v = args[key];
  return typeof v === "number" ? v : fallback;
}

/**
 * Dynamically import a Zoobicon lib module. If the module doesn't exist
 * yet (some products are still being wired), surface a clear error
 * naming the missing module + the tool that requested it.
 */
async function loadLib<T = Record<string, unknown>>(
  toolName: string,
  modulePath: string,
): Promise<T> {
  try {
    const mod = (await import(/* webpackIgnore: true */ modulePath)) as T;
    return mod;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err);
    throw new Error(
      `[mcp:${toolName}] missing implementation '${modulePath}': ${message}`,
    );
  }
}

const TOOLS: InternalTool[] = [
  {
    def: {
      name: "generate_website",
      description:
        "Generate a complete React/Next.js website from a natural-language prompt. Returns Sandpack-ready files + dependencies.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "What the site should be" },
          style: { type: "string", description: "Optional design style hint" },
        },
        required: ["prompt"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        runAgentPipeline?: (p: string) => Promise<unknown>;
      }>("generate_website", "@/lib/agents");
      if (typeof lib.runAgentPipeline !== "function") {
        throw new Error("agents.runAgentPipeline not exported");
      }
      return lib.runAgentPipeline(str(args, "prompt"));
    },
  },
  {
    def: {
      name: "generate_video",
      description:
        "Generate an AI video using Zoobicon's own pipeline (Fish Speech + FLUX + OmniHuman via Replicate).",
      inputSchema: {
        type: "object",
        properties: {
          script: { type: "string" },
          voice: { type: "string" },
        },
        required: ["script"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        renderVideo?: (i: unknown) => Promise<unknown>;
      }>("generate_video", "@/lib/video-pipeline");
      if (typeof lib.renderVideo !== "function") {
        throw new Error("video-pipeline.renderVideo not exported");
      }
      return lib.renderVideo({
        script: str(args, "script"),
        voice: str(args, "voice", "default"),
      });
    },
  },
  {
    def: {
      name: "register_domain",
      description: "Register a domain via OpenSRS.",
      inputSchema: {
        type: "object",
        properties: { domain: { type: "string" }, years: { type: "number" } },
        required: ["domain"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        registerDomain?: (d: string, y: number) => Promise<unknown>;
      }>("register_domain", "@/lib/opensrs");
      if (typeof lib.registerDomain !== "function") {
        throw new Error("opensrs.registerDomain not exported");
      }
      return lib.registerDomain(str(args, "domain"), num(args, "years", 1));
    },
  },
  {
    def: {
      name: "check_domain_availability",
      description: "Check if a domain is available for registration.",
      inputSchema: {
        type: "object",
        properties: { domain: { type: "string" } },
        required: ["domain"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        checkAvailability?: (d: string) => Promise<unknown>;
      }>("check_domain_availability", "@/lib/opensrs");
      if (typeof lib.checkAvailability !== "function") {
        throw new Error("opensrs.checkAvailability not exported");
      }
      return lib.checkAvailability(str(args, "domain"));
    },
  },
  {
    def: {
      name: "search_domains",
      description:
        "Search across many TLDs for a base name and return availability + pricing.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          tlds: { type: "array", items: { type: "string" } },
        },
        required: ["query"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        searchDomains?: (q: string, tlds?: string[]) => Promise<unknown>;
      }>("search_domains", "@/lib/opensrs");
      if (typeof lib.searchDomains !== "function") {
        throw new Error("opensrs.searchDomains not exported");
      }
      const tlds = Array.isArray(args.tlds)
        ? (args.tlds as string[])
        : undefined;
      return lib.searchDomains(str(args, "query"), tlds);
    },
  },
  {
    def: {
      name: "deploy_site",
      description: "Deploy generated site files to zoobicon.sh hosting.",
      inputSchema: {
        type: "object",
        properties: {
          slug: { type: "string" },
          files: { type: "object" },
        },
        required: ["slug", "files"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        deploySite?: (s: string, f: unknown) => Promise<unknown>;
      }>("deploy_site", "@/lib/hosting");
      if (typeof lib.deploySite !== "function") {
        throw new Error("hosting.deploySite not exported");
      }
      return lib.deploySite(str(args, "slug"), args.files);
    },
  },
  {
    def: {
      name: "send_email",
      description: "Send a transactional email via Mailgun.",
      inputSchema: {
        type: "object",
        properties: {
          to: { type: "string" },
          subject: { type: "string" },
          html: { type: "string" },
        },
        required: ["to", "subject", "html"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        sendEmail?: (i: unknown) => Promise<unknown>;
      }>("send_email", "@/lib/mailgun");
      if (typeof lib.sendEmail !== "function") {
        throw new Error("mailgun.sendEmail not exported");
      }
      return lib.sendEmail({
        to: str(args, "to"),
        subject: str(args, "subject"),
        html: str(args, "html"),
      });
    },
  },
  {
    def: {
      name: "generate_image",
      description: "Generate an AI image via FLUX on Replicate.",
      inputSchema: {
        type: "object",
        properties: { prompt: { type: "string" } },
        required: ["prompt"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        generateImage?: (p: string) => Promise<unknown>;
      }>("generate_image", "@/lib/image-generator");
      if (typeof lib.generateImage !== "function") {
        throw new Error("image-generator.generateImage not exported");
      }
      return lib.generateImage(str(args, "prompt"));
    },
  },
  {
    def: {
      name: "generate_logo",
      description: "Generate a brand logo from a business name + style.",
      inputSchema: {
        type: "object",
        properties: {
          businessName: { type: "string" },
          style: { type: "string" },
        },
        required: ["businessName"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        generateLogo?: (n: string, s: string) => Promise<unknown>;
      }>("generate_logo", "@/lib/logo-generator");
      if (typeof lib.generateLogo !== "function") {
        throw new Error("logo-generator.generateLogo not exported");
      }
      return lib.generateLogo(
        str(args, "businessName"),
        str(args, "style", "modern"),
      );
    },
  },
  {
    def: {
      name: "scan_receipt",
      description: "OCR a receipt image and return structured line items.",
      inputSchema: {
        type: "object",
        properties: { imageUrl: { type: "string" } },
        required: ["imageUrl"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        scanReceipt?: (u: string) => Promise<unknown>;
      }>("scan_receipt", "@/lib/receipt-scanner");
      if (typeof lib.scanReceipt !== "function") {
        throw new Error("receipt-scanner.scanReceipt not exported");
      }
      return lib.scanReceipt(str(args, "imageUrl"));
    },
  },
  {
    def: {
      name: "translate",
      description: "Translate text into a target language.",
      inputSchema: {
        type: "object",
        properties: {
          text: { type: "string" },
          targetLang: { type: "string" },
        },
        required: ["text", "targetLang"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        translate?: (t: string, l: string) => Promise<unknown>;
      }>("translate", "@/lib/translator");
      if (typeof lib.translate !== "function") {
        throw new Error("translator.translate not exported");
      }
      return lib.translate(str(args, "text"), str(args, "targetLang"));
    },
  },
  {
    def: {
      name: "grammar_check",
      description: "Check grammar + style of text and return suggestions.",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        checkGrammar?: (t: string) => Promise<unknown>;
      }>("grammar_check", "@/lib/grammar");
      if (typeof lib.checkGrammar !== "function") {
        throw new Error("grammar.checkGrammar not exported");
      }
      return lib.checkGrammar(str(args, "text"));
    },
  },
  {
    def: {
      name: "create_invoice",
      description: "Create a PDF invoice from line items.",
      inputSchema: {
        type: "object",
        properties: {
          customer: { type: "string" },
          items: { type: "array" },
        },
        required: ["customer", "items"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        createInvoice?: (i: unknown) => Promise<unknown>;
      }>("create_invoice", "@/lib/invoicing");
      if (typeof lib.createInvoice !== "function") {
        throw new Error("invoicing.createInvoice not exported");
      }
      return lib.createInvoice({
        customer: str(args, "customer"),
        items: args.items,
      });
    },
  },
  {
    def: {
      name: "generate_resume",
      description: "Generate a polished resume from structured input.",
      inputSchema: {
        type: "object",
        properties: { profile: { type: "object" } },
        required: ["profile"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        generateResume?: (p: unknown) => Promise<unknown>;
      }>("generate_resume", "@/lib/resume-generator");
      if (typeof lib.generateResume !== "function") {
        throw new Error("resume-generator.generateResume not exported");
      }
      return lib.generateResume(args.profile);
    },
  },
  {
    def: {
      name: "generate_contract",
      description: "Generate a legal contract draft from parameters.",
      inputSchema: {
        type: "object",
        properties: {
          type: { type: "string" },
          parties: { type: "array", items: { type: "string" } },
        },
        required: ["type"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        generateContract?: (i: unknown) => Promise<unknown>;
      }>("generate_contract", "@/lib/contract-generator");
      if (typeof lib.generateContract !== "function") {
        throw new Error("contract-generator.generateContract not exported");
      }
      return lib.generateContract({
        type: str(args, "type"),
        parties: args.parties,
      });
    },
  },
  {
    def: {
      name: "summarize_url",
      description: "Fetch a URL and return a concise summary.",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        summarizeUrl?: (u: string) => Promise<unknown>;
      }>("summarize_url", "@/lib/summarizer");
      if (typeof lib.summarizeUrl !== "function") {
        throw new Error("summarizer.summarizeUrl not exported");
      }
      return lib.summarizeUrl(str(args, "url"));
    },
  },
  {
    def: {
      name: "generate_podcast",
      description: "Generate an AI podcast episode from a topic.",
      inputSchema: {
        type: "object",
        properties: { topic: { type: "string" }, length: { type: "number" } },
        required: ["topic"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        generatePodcast?: (i: unknown) => Promise<unknown>;
      }>("generate_podcast", "@/lib/podcast-generator");
      if (typeof lib.generatePodcast !== "function") {
        throw new Error("podcast-generator.generatePodcast not exported");
      }
      return lib.generatePodcast({
        topic: str(args, "topic"),
        length: num(args, "length", 5),
      });
    },
  },
  {
    def: {
      name: "create_quiz",
      description: "Generate a quiz on a given topic.",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string" },
          questions: { type: "number" },
        },
        required: ["topic"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        createQuiz?: (i: unknown) => Promise<unknown>;
      }>("create_quiz", "@/lib/quiz-generator");
      if (typeof lib.createQuiz !== "function") {
        throw new Error("quiz-generator.createQuiz not exported");
      }
      return lib.createQuiz({
        topic: str(args, "topic"),
        questions: num(args, "questions", 10),
      });
    },
  },
  {
    def: {
      name: "lookup_ip",
      description: "Look up geolocation + ASN for an IP address.",
      inputSchema: {
        type: "object",
        properties: { ip: { type: "string" } },
        required: ["ip"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        lookupIp?: (ip: string) => Promise<unknown>;
      }>("lookup_ip", "@/lib/ip-lookup");
      if (typeof lib.lookupIp !== "function") {
        throw new Error("ip-lookup.lookupIp not exported");
      }
      return lib.lookupIp(str(args, "ip"));
    },
  },
  {
    def: {
      name: "geocode_address",
      description: "Convert a postal address into latitude/longitude.",
      inputSchema: {
        type: "object",
        properties: { address: { type: "string" } },
        required: ["address"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        geocode?: (a: string) => Promise<unknown>;
      }>("geocode_address", "@/lib/geocoder");
      if (typeof lib.geocode !== "function") {
        throw new Error("geocoder.geocode not exported");
      }
      return lib.geocode(str(args, "address"));
    },
  },
  {
    def: {
      name: "convert_currency",
      description: "Convert an amount between two currencies at live rates.",
      inputSchema: {
        type: "object",
        properties: {
          amount: { type: "number" },
          from: { type: "string" },
          to: { type: "string" },
        },
        required: ["amount", "from", "to"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        convertCurrency?: (
          a: number,
          f: string,
          t: string,
        ) => Promise<unknown>;
      }>("convert_currency", "@/lib/currency");
      if (typeof lib.convertCurrency !== "function") {
        throw new Error("currency.convertCurrency not exported");
      }
      return lib.convertCurrency(
        num(args, "amount"),
        str(args, "from"),
        str(args, "to"),
      );
    },
  },
  {
    def: {
      name: "qr_code",
      description: "Generate a QR code PNG/SVG for a given payload.",
      inputSchema: {
        type: "object",
        properties: {
          data: { type: "string" },
          format: { type: "string" },
        },
        required: ["data"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        generateQr?: (d: string, f: string) => Promise<unknown>;
      }>("qr_code", "@/lib/qr");
      if (typeof lib.generateQr !== "function") {
        throw new Error("qr.generateQr not exported");
      }
      return lib.generateQr(str(args, "data"), str(args, "format", "png"));
    },
  },
  {
    def: {
      name: "shorten_url",
      description: "Shorten a long URL via Zoobicon's URL shortener.",
      inputSchema: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        shortenUrl?: (u: string) => Promise<unknown>;
      }>("shorten_url", "@/lib/url-shortener");
      if (typeof lib.shortenUrl !== "function") {
        throw new Error("url-shortener.shortenUrl not exported");
      }
      return lib.shortenUrl(str(args, "url"));
    },
  },
  {
    def: {
      name: "check_grammar",
      description:
        "Alias of grammar_check — kept for client compatibility. Returns inline corrections.",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        checkGrammar?: (t: string) => Promise<unknown>;
      }>("check_grammar", "@/lib/grammar");
      if (typeof lib.checkGrammar !== "function") {
        throw new Error("grammar.checkGrammar not exported");
      }
      return lib.checkGrammar(str(args, "text"));
    },
  },
  {
    def: {
      name: "generate_blog_post",
      description: "Generate a long-form SEO blog post on a given topic.",
      inputSchema: {
        type: "object",
        properties: {
          topic: { type: "string" },
          tone: { type: "string" },
          words: { type: "number" },
        },
        required: ["topic"],
      },
    },
    handler: async (args) => {
      const lib = await loadLib<{
        generateBlogPost?: (i: unknown) => Promise<unknown>;
      }>("generate_blog_post", "@/lib/blog-generator");
      if (typeof lib.generateBlogPost !== "function") {
        throw new Error("blog-generator.generateBlogPost not exported");
      }
      return lib.generateBlogPost({
        topic: str(args, "topic"),
        tone: str(args, "tone", "professional"),
        words: num(args, "words", 1200),
      });
    },
  },
];

export const ZOOBICON_MCP_TOOLS: McpToolDefinition[] = TOOLS.map((t) => t.def);

function findTool(name: string): InternalTool | undefined {
  return TOOLS.find((t) => t.def.name === name);
}

// ---------- JSON-RPC error helpers ----------

const ERR_PARSE = -32700;
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

      case "tools/list": {
        return makeSuccess(id, { tools: ZOOBICON_MCP_TOOLS });
      }

      case "tools/call": {
        const params = req.params as McpToolCallParams | undefined;
        if (!params || typeof params.name !== "string") {
          return makeError(id, ERR_INVALID_PARAMS, "missing tool name");
        }
        const tool = findTool(params.name);
        if (!tool) {
          return makeError(
            id,
            ERR_METHOD_NOT_FOUND,
            `unknown tool: ${params.name}`,
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

      case "resources/list": {
        return makeSuccess(id, { resources: [] });
      }

      case "prompts/list": {
        return makeSuccess(id, { prompts: [] });
      }

      case "ping": {
        return makeSuccess(id, {});
      }

      default:
        return makeError(
          id,
          ERR_METHOD_NOT_FOUND,
          `method not found: ${req.method}`,
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
    return makeError(null, ERR_PARSE, "invalid JSON-RPC 2.0 request");
  }
  return dispatch(body);
}
