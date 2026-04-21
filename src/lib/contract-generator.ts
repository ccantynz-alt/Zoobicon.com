import { sql } from "./db";

export type ContractType =
  | "nda"
  | "sow"
  | "msa"
  | "employment"
  | "consulting"
  | "sales"
  | "partnership"
  | "license";

export interface ContractParty {
  name: string;
  role?: string;
  address?: string;
  email?: string;
}

export interface GenerateContractInput {
  type: ContractType;
  parties: ContractParty[];
  terms: Record<string, string | number | boolean>;
  userId?: string;
}

export interface GeneratedContract {
  id: string;
  type: ContractType;
  content: string;
  status: string;
  createdAt: string;
}

export interface ContractAnalysis {
  risks: string[];
  obligations: string[];
  dates: string[];
  summary: string;
}

export interface SignInput {
  contractId: string;
  signerEmail: string;
  ip?: string;
}

export interface SignResult {
  signatureId: string;
  token: string;
  signedAt: string;
}

interface AnthropicTextBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicTextBlock[];
}

const MODEL = "claude-haiku-4-5-20251001";

let schemaReady = false;

async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      type TEXT NOT NULL,
      parties JSONB NOT NULL,
      terms JSONB NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS contract_signatures (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      signer_email TEXT NOT NULL,
      signed_at TIMESTAMPTZ,
      ip TEXT,
      token TEXT NOT NULL
    )
  `;
  schemaReady = true;
}

function randomId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function callAnthropic(prompt: string, maxTokens: number): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY missing");
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text}`);
  }
  const data = (await res.json()) as AnthropicResponse;
  const block = data.content?.find((c) => c.type === "text");
  return block?.text ?? "";
}

export async function generateContract(
  input: GenerateContractInput
): Promise<GeneratedContract> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  await ensureSchema();

  const prompt = `You are a senior contracts attorney. Draft a complete, professional ${input.type.toUpperCase()} contract in clean Markdown.

Parties:
${JSON.stringify(input.parties, null, 2)}

Terms:
${JSON.stringify(input.terms, null, 2)}

Requirements:
- Numbered sections with clear headings
- Definitions, obligations, payment, term, termination, confidentiality, IP, warranties, liability, governing law, signatures
- Plain English where possible, precise where required
- Output ONLY the contract markdown, no preamble`;

  const content = await callAnthropic(prompt, 4096);
  const id = randomId("ct");
  const createdAt = new Date().toISOString();

  await sql`
    INSERT INTO contracts (id, user_id, type, parties, terms, content, status, created_at)
    VALUES (${id}, ${input.userId ?? null}, ${input.type}, ${JSON.stringify(
      input.parties
    )}::jsonb, ${JSON.stringify(input.terms)}::jsonb, ${content}, 'draft', ${createdAt})
  `;

  return { id, type: input.type, content, status: "draft", createdAt };
}

export async function analyzeContract(text: string): Promise<ContractAnalysis> {
  const prompt = `Analyze the following contract. Return STRICT JSON only matching:
{"risks":string[],"obligations":string[],"dates":string[],"summary":string}

Contract:
"""
${text.slice(0, 60000)}
"""

Output JSON only, no markdown fences.`;

  const raw = await callAnthropic(prompt, 2048);
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  let parsed: Partial<ContractAnalysis> = {};
  try {
    parsed = JSON.parse(cleaned) as Partial<ContractAnalysis>;
  } catch {
    parsed = {};
  }
  return {
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    obligations: Array.isArray(parsed.obligations) ? parsed.obligations : [],
    dates: Array.isArray(parsed.dates) ? parsed.dates : [],
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
  };
}

export async function eSign(input: SignInput): Promise<SignResult> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");
  await ensureSchema();
  const signatureId = randomId("sig");
  const token = `${randomId("tok")}${Math.random().toString(36).slice(2, 12)}`;
  const signedAt = new Date().toISOString();

  await sql`
    INSERT INTO contract_signatures (id, contract_id, signer_email, signed_at, ip, token)
    VALUES (${signatureId}, ${input.contractId}, ${input.signerEmail}, ${signedAt}, ${
      input.ip ?? null
    }, ${token})
  `;
  await sql`
    UPDATE contracts SET status = 'signed' WHERE id = ${input.contractId}
  `;

  return { signatureId, token, signedAt };
}
