import { sql } from "@/lib/db";

export interface KbDocument {
  id: number;
  owner_id: string;
  title: string;
  content: string;
  source_url: string | null;
  created_at: string;
}

export interface KbChunkRow {
  id: number;
  doc_id: number;
  chunk_index: number;
  text: string;
  embedding: string;
}

export interface KbSource {
  docId: number;
  chunkText: string;
  score: number;
}

export interface KbQueryResult {
  answer: string;
  sources: KbSource[];
}

let tablesEnsured = false;

export async function ensureKbTables(): Promise<void> {
  if (tablesEnsured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS kb_documents (
      id SERIAL PRIMARY KEY,
      owner_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      source_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS kb_chunks (
      id SERIAL PRIMARY KEY,
      doc_id INTEGER NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      text TEXT NOT NULL,
      embedding TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS kb_chunks_doc_id_idx ON kb_chunks(doc_id)`;
  tablesEnsured = true;
}

export function chunkText(text: string, maxChars = 1500, overlap = 200): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (clean.length <= maxChars) return clean.length > 0 ? [clean] : [];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    const end = Math.min(start + maxChars, clean.length);
    let cut = end;
    if (end < clean.length) {
      const lastBreak = clean.lastIndexOf("\n", end);
      const lastSpace = clean.lastIndexOf(" ", end);
      const candidate = Math.max(lastBreak, lastSpace);
      if (candidate > start + maxChars / 2) cut = candidate;
    }
    chunks.push(clean.slice(start, cut).trim());
    if (cut >= clean.length) break;
    start = Math.max(cut - overlap, start + 1);
  }
  return chunks.filter((c) => c.length > 0);
}

function hashEmbedding(text: string, dims = 32): number[] {
  const vec = new Array<number>(dims).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  for (const tok of tokens) {
    let h = 2166136261;
    for (let i = 0; i < tok.length; i++) {
      h ^= tok.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    const idx = Math.abs(h) % dims;
    vec[idx] += 1;
  }
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vec.map((v) => v / norm);
}

export async function embed(text: string): Promise<number[]> {
  const key = process.env.VOYAGE_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ input: text, model: "voyage-3-lite" }),
      });
      if (res.ok) {
        const data = (await res.json()) as { data: Array<{ embedding: number[] }> };
        if (data.data && data.data[0] && Array.isArray(data.data[0].embedding)) {
          return data.data[0].embedding;
        }
      }
    } catch {
      // fall through to hash fallback
    }
  }
  return hashEmbedding(text);
}

export function cosineSim(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (denom === 0) return 0;
  return dot / denom;
}

export async function ingestDocument(
  ownerId: string,
  title: string,
  content: string,
  sourceUrl?: string
): Promise<{ docId: number; chunkCount: number }> {
  await ensureKbTables();
  const inserted = (await sql`
    INSERT INTO kb_documents (owner_id, title, content, source_url)
    VALUES (${ownerId}, ${title}, ${content}, ${sourceUrl ?? null})
    RETURNING id
  `) as Array<{ id: number }>;
  const docId = inserted[0].id;
  const chunks = chunkText(content);
  let i = 0;
  for (const c of chunks) {
    const vec = await embed(c);
    await sql`
      INSERT INTO kb_chunks (doc_id, chunk_index, text, embedding)
      VALUES (${docId}, ${i}, ${c}, ${JSON.stringify(vec)})
    `;
    i++;
  }
  return { docId, chunkCount: chunks.length };
}

export async function queryKb(
  ownerId: string,
  question: string,
  topK = 5
): Promise<KbQueryResult> {
  await ensureKbTables();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "ANTHROPIC_API_KEY is not set. Configure it in environment variables to enable knowledge base answers."
    );
    (err as Error & { status?: number }).status = 503;
    throw err;
  }
  const qVec = await embed(question);
  const rows = (await sql`
    SELECT c.id, c.doc_id, c.chunk_index, c.text, c.embedding
    FROM kb_chunks c
    INNER JOIN kb_documents d ON d.id = c.doc_id
    WHERE d.owner_id = ${ownerId}
  `) as KbChunkRow[];

  const scored: KbSource[] = rows.map((r) => {
    let parsed: number[] = [];
    try {
      parsed = JSON.parse(r.embedding) as number[];
    } catch {
      parsed = [];
    }
    return {
      docId: r.doc_id,
      chunkText: r.text,
      score: cosineSim(qVec, parsed),
    };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);

  if (top.length === 0) {
    return {
      answer: "No documents found in your knowledge base. Upload some content first.",
      sources: [],
    };
  }

  const contextBlock = top
    .map((s, idx) => `[Source ${idx + 1} | doc ${s.docId}]\n${s.chunkText}`)
    .join("\n\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a knowledge base assistant. Answer the user's question using ONLY the sources below. If the sources don't contain the answer, say so honestly. Cite sources as [Source N].\n\nSOURCES:\n${contextBlock}\n\nQUESTION: ${question}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Anthropic API error (${res.status}): ${text}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const answer = data.content
    .filter((c) => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text as string)
    .join("\n")
    .trim();

  return { answer: answer || "(no answer generated)", sources: top };
}

export async function listDocuments(ownerId: string): Promise<KbDocument[]> {
  await ensureKbTables();
  const rows = (await sql`
    SELECT id, owner_id, title, content, source_url, created_at
    FROM kb_documents
    WHERE owner_id = ${ownerId}
    ORDER BY created_at DESC
  `) as KbDocument[];
  return rows;
}
