import { sql } from "@/lib/db";

export type ExpenseCategory =
  | "meals"
  | "travel"
  | "software"
  | "office"
  | "marketing"
  | "utilities"
  | "other";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "meals",
  "travel",
  "software",
  "office",
  "marketing",
  "utilities",
  "other",
];

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  date: string;
  receiptUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AddExpenseInput {
  userId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  date: string;
  receiptUrl?: string;
}

export interface ScannedReceipt {
  merchant: string;
  total: number;
  currency: string;
  date: string;
  items: Array<{ name: string; price: number }>;
  taxAmount: number;
}

export interface DateRange {
  from: string;
  to: string;
}

interface ExpenseRow {
  id: string;
  user_id: string;
  amount_cents: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  receipt_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

let schemaReady = false;
async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      amount_cents integer NOT NULL,
      currency text NOT NULL,
      category text NOT NULL,
      description text NOT NULL,
      date date NOT NULL,
      receipt_url text,
      metadata jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  schemaReady = true;
}

function rowToExpense(r: ExpenseRow): Expense {
  return {
    id: r.id,
    userId: r.user_id,
    amount: r.amount_cents / 100,
    currency: r.currency,
    category: (EXPENSE_CATEGORIES as string[]).includes(r.category)
      ? (r.category as ExpenseCategory)
      : "other",
    description: r.description,
    date: typeof r.date === "string" ? r.date : new Date(r.date).toISOString().slice(0, 10),
    receiptUrl: r.receipt_url,
    metadata: r.metadata ?? {},
    createdAt: r.created_at,
  };
}

function genId(): string {
  return `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function addExpense(input: AddExpenseInput): Promise<Expense> {
  await ensureSchema();
  const id = genId();
  const cents = Math.round(input.amount * 100);
  const rows = (await sql`
    INSERT INTO expenses (id, user_id, amount_cents, currency, category, description, date, receipt_url, metadata)
    VALUES (${id}, ${input.userId}, ${cents}, ${input.currency}, ${input.category}, ${input.description}, ${input.date}, ${input.receiptUrl ?? null}, ${JSON.stringify({})}::jsonb)
    RETURNING *
  `) as unknown as ExpenseRow[];
  return rowToExpense(rows[0]);
}

export async function listExpenses(userId: string, range?: DateRange): Promise<Expense[]> {
  await ensureSchema();
  const rows = range
    ? ((await sql`
        SELECT * FROM expenses
        WHERE user_id = ${userId} AND date >= ${range.from} AND date <= ${range.to}
        ORDER BY date DESC, created_at DESC
      `) as unknown as ExpenseRow[])
    : ((await sql`
        SELECT * FROM expenses
        WHERE user_id = ${userId}
        ORDER BY date DESC, created_at DESC
      `) as unknown as ExpenseRow[]);
  return rows.map(rowToExpense);
}

export interface CategoryReport {
  category: ExpenseCategory;
  total: number;
  count: number;
}

export async function reportByCategory(
  userId: string,
  range?: DateRange
): Promise<CategoryReport[]> {
  const expenses = await listExpenses(userId, range);
  const map = new Map<ExpenseCategory, CategoryReport>();
  for (const c of EXPENSE_CATEGORIES) {
    map.set(c, { category: c, total: 0, count: 0 });
  }
  for (const e of expenses) {
    const r = map.get(e.category);
    if (r) {
      r.total += e.amount;
      r.count += 1;
    }
  }
  return Array.from(map.values()).filter((r) => r.count > 0);
}

export function exportCsv(expenses: Expense[]): string {
  const header = "id,date,category,description,amount,currency,receipt_url";
  const escape = (v: string): string => `"${v.replace(/"/g, '""')}"`;
  const lines = expenses.map((e) =>
    [
      e.id,
      e.date,
      e.category,
      escape(e.description),
      e.amount.toFixed(2),
      e.currency,
      e.receiptUrl ?? "",
    ].join(",")
  );
  return [header, ...lines].join("\n");
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}
interface AnthropicResponse {
  content?: AnthropicContentBlock[];
}

export async function scanReceipt(imageUrl: string): Promise<ScannedReceipt> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: 'Extract receipt data as strict JSON with this schema: {"merchant":string,"total":number,"currency":string,"date":"YYYY-MM-DD","items":[{"name":string,"price":number}],"taxAmount":number}. Output ONLY the JSON, no prose.',
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as AnthropicResponse;
  const text = data.content?.find((b) => b.type === "text")?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Failed to parse receipt JSON from model output");
  const parsed = JSON.parse(match[0]) as ScannedReceipt;
  return {
    merchant: String(parsed.merchant ?? ""),
    total: Number(parsed.total ?? 0),
    currency: String(parsed.currency ?? "USD"),
    date: String(parsed.date ?? new Date().toISOString().slice(0, 10)),
    items: Array.isArray(parsed.items) ? parsed.items : [],
    taxAmount: Number(parsed.taxAmount ?? 0),
  };
}
