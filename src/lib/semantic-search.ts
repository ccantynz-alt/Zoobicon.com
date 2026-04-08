import { neon } from '@neondatabase/serverless';

export interface SearchDocument {
  id: string;
  userId: string;
  collection: string;
  content: string;
  metadata: Record<string, unknown>;
  score?: number;
}

export interface IndexParams {
  userId: string;
  collection: string;
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface SearchParams {
  userId: string;
  collection: string;
  query: string;
  limit?: number;
}

interface DbRow {
  id: string;
  user_id: string;
  collection: string;
  content: string;
  embedding: number[] | null;
  metadata: Record<string, unknown> | null;
}

interface VoyageResponse {
  data: Array<{ embedding: number[]; index: number }>;
}

function getDb(): ReturnType<typeof neon> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  return neon(url);
}

let tablesEnsured = false;
async function ensureTables(): Promise<void> {
  if (tablesEnsured) return;
  const sql = getDb();
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS search_documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      collection TEXT NOT NULL,
      content TEXT NOT NULL,
      embedding JSONB,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS search_documents_user_collection_idx ON search_documents(user_id, collection)`;
  tablesEnsured = true;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function tfidfEmbedding(text: string): number[] {
  const tokens = tokenize(text);
  const dim = 256;
  const vec = new Array<number>(dim).fill(0);
  for (const tok of tokens) {
    let hash = 0;
    for (let i = 0; i < tok.length; i++) {
      hash = (hash * 31 + tok.charCodeAt(i)) | 0;
    }
    const idx = Math.abs(hash) % dim;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

async function generateEmbedding(text: string): Promise<number[]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) return tfidfEmbedding(text);
  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ input: [text], model: 'voyage-3' }),
    });
    if (!res.ok) return tfidfEmbedding(text);
    const json = (await res.json()) as VoyageResponse;
    const emb = json.data?.[0]?.embedding;
    if (!emb || !Array.isArray(emb)) return tfidfEmbedding(text);
    return emb;
  } catch {
    return tfidfEmbedding(text);
  }
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
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export async function indexDocument(params: IndexParams): Promise<{ ok: boolean; id: string }> {
  const sql = getDb();
  if (!sql) throw new Error('DATABASE_URL not configured');
  await ensureTables();
  const embedding = await generateEmbedding(params.text);
  const metadata = params.metadata ?? {};
  await sql`
    INSERT INTO search_documents (id, user_id, collection, content, embedding, metadata)
    VALUES (${params.id}, ${params.userId}, ${params.collection}, ${params.text}, ${JSON.stringify(embedding)}::jsonb, ${JSON.stringify(metadata)}::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      content = EXCLUDED.content,
      embedding = EXCLUDED.embedding,
      metadata = EXCLUDED.metadata
  `;
  return { ok: true, id: params.id };
}

export async function search(params: SearchParams): Promise<SearchDocument[]> {
  const sql = getDb();
  if (!sql) throw new Error('DATABASE_URL not configured');
  await ensureTables();
  const limit = params.limit ?? 10;
  const queryEmb = await generateEmbedding(params.query);
  const rows = (await sql`
    SELECT id, user_id, collection, content, embedding, metadata
    FROM search_documents
    WHERE user_id = ${params.userId} AND collection = ${params.collection}
  `) as unknown as DbRow[];
  const scored: SearchDocument[] = rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    collection: r.collection,
    content: r.content,
    metadata: r.metadata ?? {},
    score: r.embedding ? cosine(queryEmb, r.embedding) : 0,
  }));
  scored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return scored.slice(0, limit);
}

export async function deleteDocument(id: string): Promise<{ ok: boolean }> {
  const sql = getDb();
  if (!sql) throw new Error('DATABASE_URL not configured');
  await ensureTables();
  await sql`DELETE FROM search_documents WHERE id = ${id}`;
  return { ok: true };
}

export async function reindexCollection(collection: string): Promise<{ ok: boolean; count: number }> {
  const sql = getDb();
  if (!sql) throw new Error('DATABASE_URL not configured');
  await ensureTables();
  const rows = (await sql`
    SELECT id, content FROM search_documents WHERE collection = ${collection}
  `) as unknown as Array<{ id: string; content: string }>;
  let count = 0;
  for (const row of rows) {
    const emb = await generateEmbedding(row.content);
    await sql`UPDATE search_documents SET embedding = ${JSON.stringify(emb)}::jsonb WHERE id = ${row.id}`;
    count++;
  }
  return { ok: true, count };
}

export async function hybridSearch(params: SearchParams): Promise<SearchDocument[]> {
  const sql = getDb();
  if (!sql) throw new Error('DATABASE_URL not configured');
  await ensureTables();
  const limit = params.limit ?? 10;
  const semantic = await search({ ...params, limit: limit * 2 });
  const queryTokens = new Set(tokenize(params.query));
  const merged: SearchDocument[] = semantic.map((doc) => {
    const docTokens = tokenize(doc.content);
    let matches = 0;
    for (const t of docTokens) if (queryTokens.has(t)) matches++;
    const keywordScore = docTokens.length > 0 ? matches / docTokens.length : 0;
    const combined = (doc.score ?? 0) * 0.7 + keywordScore * 0.3;
    return { ...doc, score: combined };
  });
  merged.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return merged.slice(0, limit);
}
