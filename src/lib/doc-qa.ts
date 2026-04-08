import { sql } from "./db";

export interface DocChunk {
  id: string;
  doc_id: string;
  content: string;
  embedding: number[];
  position: number;
}

export interface DocRecord {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface AskSource {
  chunk: string;
  score: number;
}

export interface AskResult {
  answer: string;
  sources: AskSource[];
}

let schemaReady = false;
async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await sql`CREATE TABLE IF NOT EXISTS docs (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS doc_chunks (
    id text PRIMARY KEY,
    doc_id text NOT NULL,
    content text NOT NULL,
    embedding jsonb NOT NULL,
    position int NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  schemaReady = true;
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function chunkText(text: string, size = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  if (!text) return chunks;
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    if (i + size >= text.length) break;
    i += size - overlap;
  }
  return chunks;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function tfidfEmbed(text: string): number[] {
  const tokens = tokenize(text);
  const vec = new Array<number>(256).fill(0);
  for (const tok of tokens) {
    let h = 0;
    for (let i = 0; i < tok.length; i++) {
      h = (h * 31 + tok.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(h) % 256;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

interface VoyageResponse {
  data: Array<{ embedding: number[] }>;
}

async function voyageEmbed(texts: string[]): Promise<number[][] | null> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model: "voyage-3", input: texts }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as VoyageResponse;
    return json.data.map((d) => d.embedding);
  } catch {
    return null;
  }
}

async function embedAll(texts: string[]): Promise<number[][]> {
  const v = await voyageEmbed(texts);
  if (v && v.length === texts.length) return v;
  return texts.map((t) => tfidfEmbed(t));
}

function cosine(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

export async function ingestDocument(params: {
  userId: string;
  name: string;
  content: string;
}): Promise<{ id: string; chunks: number }> {
  await ensureSchema();
  const docId = genId("doc");
  await sql`INSERT INTO docs (id, user_id, name) VALUES (${docId}, ${params.userId}, ${params.name})`;
  const pieces = chunkText(params.content);
  if (pieces.length === 0) return { id: docId, chunks: 0 };
  const embeddings = await embedAll(pieces);
  for (let i = 0; i < pieces.length; i++) {
    const cid = genId("chk");
    await sql`INSERT INTO doc_chunks (id, doc_id, content, embedding, position)
      VALUES (${cid}, ${docId}, ${pieces[i]}, ${JSON.stringify(embeddings[i])}, ${i})`;
  }
  return { id: docId, chunks: pieces.length };
}

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
}

async function haikuAnswer(question: string, context: string): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Answer the question using ONLY the context below. If the answer is not in the context, say so.\n\nContext:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}`);
  const json = (await res.json()) as AnthropicResponse;
  const text = json.content.find((c) => c.type === "text")?.text ?? "";
  return text.trim();
}

interface ChunkRow {
  id: string;
  doc_id: string;
  content: string;
  embedding: number[];
  position: number;
}

export async function ask(params: {
  userId: string;
  docId?: string;
  question: string;
}): Promise<AskResult> {
  await ensureSchema();
  const qEmbedArr = await embedAll([params.question]);
  const qEmbed = qEmbedArr[0];
  const rows = params.docId
    ? ((await sql`SELECT c.id, c.doc_id, c.content, c.embedding, c.position
        FROM doc_chunks c JOIN docs d ON d.id = c.doc_id
        WHERE d.user_id = ${params.userId} AND c.doc_id = ${params.docId}`) as ChunkRow[])
    : ((await sql`SELECT c.id, c.doc_id, c.content, c.embedding, c.position
        FROM doc_chunks c JOIN docs d ON d.id = c.doc_id
        WHERE d.user_id = ${params.userId}`) as ChunkRow[]);
  const scored = rows.map((r) => ({
    chunk: r.content,
    score: cosine(qEmbed, Array.isArray(r.embedding) ? r.embedding : []),
  }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);
  if (top.length === 0) {
    return { answer: "No documents found to answer from.", sources: [] };
  }
  const context = top.map((t, i) => `[${i + 1}] ${t.chunk}`).join("\n\n");
  const answer = await haikuAnswer(params.question, context);
  return { answer, sources: top };
}

export async function listDocuments(userId: string): Promise<DocRecord[]> {
  await ensureSchema();
  const rows = (await sql`SELECT id, user_id, name, created_at FROM docs
    WHERE user_id = ${userId} ORDER BY created_at DESC`) as DocRecord[];
  return rows;
}

export async function deleteDocument(id: string): Promise<void> {
  await ensureSchema();
  await sql`DELETE FROM doc_chunks WHERE doc_id = ${id}`;
  await sql`DELETE FROM docs WHERE id = ${id}`;
}
