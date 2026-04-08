import { sql } from "@/lib/db";

export const MARKETPLACE_CATEGORIES = [
  "SaaS",
  "Agency",
  "Portfolio",
  "E-commerce",
  "Blog",
  "Restaurant",
  "Real Estate",
  "Fitness",
  "Education",
  "Nonprofit",
  "Event",
  "Landing Page",
  "Dashboard",
  "Documentation",
] as const;

export type MarketplaceCategory = (typeof MARKETPLACE_CATEGORIES)[number];

export interface MarketplaceTemplate {
  id: string;
  author_id: string;
  name: string;
  description: string;
  category: string;
  price_cents: number;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  preview_url: string | null;
  downloads: number;
  rating: number;
  status: string;
  created_at: string;
}

export interface ListOptions {
  category?: string;
  search?: string;
  sortBy?: "popular" | "newest" | "rating" | "price";
  limit?: number;
  offset?: number;
}

export interface UseTemplateResult {
  ok?: boolean;
  requiresPayment?: boolean;
  priceCents?: number;
  files?: Record<string, string>;
  dependencies?: Record<string, string>;
  template?: MarketplaceTemplate;
}

type Row = Record<string, unknown>;

function rowToTemplate(r: Row): MarketplaceTemplate {
  return {
    id: String(r.id),
    author_id: String(r.author_id ?? ""),
    name: String(r.name ?? ""),
    description: String(r.description ?? ""),
    category: String(r.category ?? ""),
    price_cents: Number(r.price_cents ?? 0),
    files: (r.files as Record<string, string>) ?? {},
    dependencies: (r.dependencies as Record<string, string>) ?? {},
    preview_url: (r.preview_url as string | null) ?? null,
    downloads: Number(r.downloads ?? 0),
    rating: Number(r.rating ?? 0),
    status: String(r.status ?? "published"),
    created_at: String(r.created_at ?? ""),
  };
}

export async function ensureMarketplaceTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS marketplace_templates (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      author_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      price_cents INTEGER NOT NULL DEFAULT 0,
      files JSONB NOT NULL DEFAULT '{}'::jsonb,
      dependencies JSONB NOT NULL DEFAULT '{}'::jsonb,
      preview_url TEXT,
      downloads INTEGER NOT NULL DEFAULT 0,
      rating NUMERIC NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS marketplace_purchases (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      template_id TEXT NOT NULL,
      buyer_id TEXT NOT NULL,
      price_paid_cents INTEGER NOT NULL DEFAULT 0,
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS marketplace_reviews (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      template_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function listTemplates(opts: ListOptions = {}): Promise<MarketplaceTemplate[]> {
  await ensureMarketplaceTables();
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  const category = opts.category ?? null;
  const search = opts.search ? `%${opts.search}%` : null;
  const sortBy = opts.sortBy ?? "popular";

  let rows: Row[];
  if (sortBy === "newest") {
    rows = (await sql`
      SELECT * FROM marketplace_templates
      WHERE status = 'published'
        AND (${category}::text IS NULL OR category = ${category})
        AND (${search}::text IS NULL OR name ILIKE ${search} OR description ILIKE ${search})
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as Row[];
  } else if (sortBy === "rating") {
    rows = (await sql`
      SELECT * FROM marketplace_templates
      WHERE status = 'published'
        AND (${category}::text IS NULL OR category = ${category})
        AND (${search}::text IS NULL OR name ILIKE ${search} OR description ILIKE ${search})
      ORDER BY rating DESC, downloads DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as Row[];
  } else if (sortBy === "price") {
    rows = (await sql`
      SELECT * FROM marketplace_templates
      WHERE status = 'published'
        AND (${category}::text IS NULL OR category = ${category})
        AND (${search}::text IS NULL OR name ILIKE ${search} OR description ILIKE ${search})
      ORDER BY price_cents ASC
      LIMIT ${limit} OFFSET ${offset}
    `) as Row[];
  } else {
    rows = (await sql`
      SELECT * FROM marketplace_templates
      WHERE status = 'published'
        AND (${category}::text IS NULL OR category = ${category})
        AND (${search}::text IS NULL OR name ILIKE ${search} OR description ILIKE ${search})
      ORDER BY downloads DESC, rating DESC
      LIMIT ${limit} OFFSET ${offset}
    `) as Row[];
  }
  return rows.map(rowToTemplate);
}

export async function getTemplate(id: string): Promise<MarketplaceTemplate | null> {
  await ensureMarketplaceTables();
  const rows = (await sql`SELECT * FROM marketplace_templates WHERE id = ${id} LIMIT 1`) as Row[];
  if (rows.length === 0) return null;
  return rowToTemplate(rows[0]);
}

export async function publishTemplate(
  authorId: string,
  name: string,
  description: string,
  category: string,
  files: Record<string, string>,
  dependencies: Record<string, string>,
  priceCents = 0
): Promise<MarketplaceTemplate> {
  await ensureMarketplaceTables();
  const filesJson = JSON.stringify(files ?? {});
  const depsJson = JSON.stringify(dependencies ?? {});
  const rows = (await sql`
    INSERT INTO marketplace_templates
      (author_id, name, description, category, price_cents, files, dependencies, status)
    VALUES
      (${authorId}, ${name}, ${description}, ${category}, ${priceCents},
       ${filesJson}::jsonb, ${depsJson}::jsonb, 'published')
    RETURNING *
  `) as Row[];
  return rowToTemplate(rows[0]);
}

export async function useTemplate(
  templateId: string,
  buyerId: string
): Promise<UseTemplateResult> {
  await ensureMarketplaceTables();
  const tpl = await getTemplate(templateId);
  if (!tpl) return { ok: false };
  if (tpl.price_cents > 0) {
    return { requiresPayment: true, priceCents: tpl.price_cents, template: tpl };
  }
  await sql`
    INSERT INTO marketplace_purchases (template_id, buyer_id, price_paid_cents)
    VALUES (${templateId}, ${buyerId}, 0)
  `;
  await sql`
    UPDATE marketplace_templates SET downloads = downloads + 1 WHERE id = ${templateId}
  `;
  return { ok: true, files: tpl.files, dependencies: tpl.dependencies, template: tpl };
}

export async function recordReview(
  templateId: string,
  userId: string,
  rating: number,
  comment?: string
): Promise<{ ok: boolean; rating: number }> {
  await ensureMarketplaceTables();
  const r = Math.max(1, Math.min(5, Math.round(rating)));
  await sql`
    INSERT INTO marketplace_reviews (template_id, user_id, rating, comment)
    VALUES (${templateId}, ${userId}, ${r}, ${comment ?? null})
  `;
  const agg = (await sql`
    SELECT AVG(rating)::numeric AS avg FROM marketplace_reviews WHERE template_id = ${templateId}
  `) as Row[];
  const avg = Number(agg[0]?.avg ?? 0);
  await sql`UPDATE marketplace_templates SET rating = ${avg} WHERE id = ${templateId}`;
  return { ok: true, rating: avg };
}

export interface CategoryCount {
  category: string;
  count: number;
}

export async function getCategories(): Promise<CategoryCount[]> {
  await ensureMarketplaceTables();
  const rows = (await sql`
    SELECT category, COUNT(*)::int AS count
    FROM marketplace_templates
    WHERE status = 'published'
    GROUP BY category
    ORDER BY count DESC
  `) as Row[];
  return rows.map((r) => ({
    category: String(r.category ?? ""),
    count: Number(r.count ?? 0),
  }));
}
