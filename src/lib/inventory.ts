import { sql } from "./db";

export interface Product {
  id: string;
  user_id: string;
  sku: string;
  name: string;
  price_cents: number;
  stock: number;
  reorder_level: number;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  delta: number;
  reason: string;
  created_at: string;
}

export interface AddProductInput {
  userId: string;
  sku: string;
  name: string;
  price_cents: number;
  stock: number;
  reorderLevel: number;
}

function ensureDb(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL_MISSING");
  }
}

let schemaReady = false;
async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  ensureDb();
  await sql`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, sku)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  schemaReady = true;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function addProduct(input: AddProductInput): Promise<Product> {
  await ensureSchema();
  const id = newId("prd");
  const rows = (await sql`INSERT INTO products (id, user_id, sku, name, price_cents, stock, reorder_level)
    VALUES (${id}, ${input.userId}, ${input.sku}, ${input.name}, ${input.price_cents}, ${input.stock}, ${input.reorderLevel})
    RETURNING *`) as unknown as Product[];
  return rows[0];
}

export async function adjustStock(productId: string, delta: number, reason: string): Promise<Product> {
  await ensureSchema();
  const movementId = newId("mov");
  await sql`INSERT INTO stock_movements (id, product_id, delta, reason)
    VALUES (${movementId}, ${productId}, ${delta}, ${reason})`;
  const rows = (await sql`UPDATE products SET stock = stock + ${delta} WHERE id = ${productId} RETURNING *`) as unknown as Product[];
  if (rows.length === 0) {
    throw new Error("PRODUCT_NOT_FOUND");
  }
  return rows[0];
}

export async function lowStockAlerts(userId: string): Promise<Product[]> {
  await ensureSchema();
  const rows = (await sql`SELECT * FROM products WHERE user_id = ${userId} AND stock <= reorder_level ORDER BY stock ASC`) as unknown as Product[];
  return rows;
}

export async function listProducts(userId: string, search?: string): Promise<Product[]> {
  await ensureSchema();
  if (search && search.trim().length > 0) {
    const like = `%${search.trim()}%`;
    const rows = (await sql`SELECT * FROM products WHERE user_id = ${userId} AND (name ILIKE ${like} OR sku ILIKE ${like}) ORDER BY created_at DESC`) as unknown as Product[];
    return rows;
  }
  const rows = (await sql`SELECT * FROM products WHERE user_id = ${userId} ORDER BY created_at DESC`) as unknown as Product[];
  return rows;
}

export async function recordSale(productId: string, qty: number): Promise<Product> {
  if (qty <= 0) throw new Error("INVALID_QTY");
  return adjustStock(productId, -qty, "sale");
}
