import { neon } from '@neondatabase/serverless';

export interface Photo {
  id: string;
  user_id: string;
  url: string;
  name: string;
  tags: string[];
  description: string;
  colors: string[];
  created_at: string;
}

export interface Album {
  id: string;
  user_id: string;
  name: string;
  photo_ids: string[];
  created_at: string;
}

export interface TagResult {
  tags: string[];
  description: string;
  dominantColors: string[];
}

function getDb(): ReturnType<typeof neon> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const err = new Error('DATABASE_URL not set') as Error & { status?: number };
    err.status = 503;
    throw err;
  }
  return neon(url);
}

async function ensureTables(): Promise<void> {
  const sql = getDb();
  await sql`CREATE TABLE IF NOT EXISTS photos (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    url text NOT NULL,
    name text NOT NULL,
    tags jsonb NOT NULL DEFAULT '[]'::jsonb,
    description text NOT NULL DEFAULT '',
    colors jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS albums (
    id text PRIMARY KEY,
    user_id text NOT NULL,
    name text NOT NULL,
    photo_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function uploadPhoto(input: { userId: string; url: string; name: string }): Promise<Photo> {
  await ensureTables();
  const sql = getDb();
  const id = genId('ph');
  const rows = (await sql`INSERT INTO photos (id, user_id, url, name)
    VALUES (${id}, ${input.userId}, ${input.url}, ${input.name})
    RETURNING id, user_id, url, name, tags, description, colors, created_at`) as unknown as Photo[];
  return rows[0];
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}
interface AnthropicResponse {
  content?: AnthropicContentBlock[];
}

async function visionTag(url: string): Promise<TagResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    const err = new Error('ANTHROPIC_API_KEY not set') as Error & { status?: number };
    err.status = 503;
    throw err;
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url } },
            {
              type: 'text',
              text: 'Analyze this image. Respond with ONLY raw JSON: {"tags":["tag1",...],"description":"...","dominantColors":["#hex",...]}',
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic vision failed: ${res.status}`);
  }
  const data = (await res.json()) as AnthropicResponse;
  const text = data.content?.find((c) => c.type === 'text')?.text ?? '{}';
  const match = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : '{}') as Partial<TagResult>;
  return {
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    description: typeof parsed.description === 'string' ? parsed.description : '',
    dominantColors: Array.isArray(parsed.dominantColors) ? parsed.dominantColors : [],
  };
}

export async function tagPhotos(photoIds: string[]): Promise<Record<string, TagResult>> {
  await ensureTables();
  const sql = getDb();
  const out: Record<string, TagResult> = {};
  for (const id of photoIds) {
    const rows = (await sql`SELECT id, url FROM photos WHERE id = ${id}`) as unknown as { id: string; url: string }[];
    if (rows.length === 0) continue;
    const result = await visionTag(rows[0].url);
    await sql`UPDATE photos SET tags = ${JSON.stringify(result.tags)}::jsonb,
      description = ${result.description},
      colors = ${JSON.stringify(result.dominantColors)}::jsonb
      WHERE id = ${id}`;
    out[id] = result;
  }
  return out;
}

export async function searchPhotos(userId: string, query: string): Promise<Photo[]> {
  await ensureTables();
  const sql = getDb();
  const q = `%${query.toLowerCase()}%`;
  const rows = (await sql`SELECT id, user_id, url, name, tags, description, colors, created_at
    FROM photos
    WHERE user_id = ${userId}
      AND (LOWER(description) LIKE ${q} OR LOWER(tags::text) LIKE ${q} OR LOWER(name) LIKE ${q})
    ORDER BY created_at DESC`) as unknown as Photo[];
  return rows;
}

export async function createAlbum(input: { userId: string; name: string; photoIds: string[] }): Promise<Album> {
  await ensureTables();
  const sql = getDb();
  const id = genId('al');
  const rows = (await sql`INSERT INTO albums (id, user_id, name, photo_ids)
    VALUES (${id}, ${input.userId}, ${input.name}, ${JSON.stringify(input.photoIds)}::jsonb)
    RETURNING id, user_id, name, photo_ids, created_at`) as unknown as Album[];
  return rows[0];
}

export async function deletePhoto(id: string): Promise<{ deleted: boolean }> {
  await ensureTables();
  const sql = getDb();
  await sql`DELETE FROM photos WHERE id = ${id}`;
  return { deleted: true };
}
