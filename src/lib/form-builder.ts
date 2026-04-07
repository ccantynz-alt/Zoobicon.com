import { sql } from "@/lib/db";
import { callLLM } from "@/lib/llm-provider";

export type FormFieldType =
  | "text"
  | "email"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "file";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface FormRow {
  id: string;
  owner_id: string;
  name: string;
  schema: { fields: FormField[] };
  created_at: string;
}

export interface SubmissionRow {
  id: string;
  form_id: string;
  data: Record<string, unknown>;
  ip: string | null;
  ua: string | null;
  ts: string;
}

let tablesReady = false;

export async function ensureFormTables(): Promise<void> {
  if (tablesReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS forms (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      schema JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS form_submissions (
      id TEXT PRIMARY KEY,
      form_id TEXT NOT NULL,
      data JSONB NOT NULL,
      ip TEXT,
      ua TEXT,
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS form_submissions_form_id_idx ON form_submissions (form_id)`;
  tablesReady = true;
}

function rid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export async function createForm(
  ownerId: string,
  name: string,
  fields: FormField[]
): Promise<FormRow> {
  await ensureFormTables();
  const id = rid("form");
  const schema = { fields };
  const rows = (await sql`
    INSERT INTO forms (id, owner_id, name, schema)
    VALUES (${id}, ${ownerId}, ${name}, ${JSON.stringify(schema)}::jsonb)
    RETURNING id, owner_id, name, schema, created_at
  `) as unknown as FormRow[];
  return rows[0];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitForm(
  formId: string,
  data: Record<string, unknown>,
  meta: { ip?: string | null; ua?: string | null } = {}
): Promise<SubmissionRow> {
  await ensureFormTables();
  const formRows = (await sql`
    SELECT id, owner_id, name, schema, created_at FROM forms WHERE id = ${formId}
  `) as unknown as FormRow[];
  if (formRows.length === 0) {
    throw new Error("Form not found");
  }
  const fields = formRows[0].schema?.fields ?? [];
  for (const f of fields) {
    const v = data[f.id];
    const empty = v === undefined || v === null || v === "";
    if (f.required && empty) {
      throw new Error(`Field "${f.label}" is required`);
    }
    if (empty) continue;
    if (f.type === "email" && typeof v === "string" && !EMAIL_RE.test(v)) {
      throw new Error(`Field "${f.label}" must be a valid email`);
    }
    if (f.type === "number" && typeof v !== "number" && Number.isNaN(Number(v))) {
      throw new Error(`Field "${f.label}" must be a number`);
    }
  }
  const id = rid("sub");
  const rows = (await sql`
    INSERT INTO form_submissions (id, form_id, data, ip, ua)
    VALUES (${id}, ${formId}, ${JSON.stringify(data)}::jsonb, ${meta.ip ?? null}, ${meta.ua ?? null})
    RETURNING id, form_id, data, ip, ua, ts
  `) as unknown as SubmissionRow[];
  return rows[0];
}

export async function getSubmissions(
  formId: string,
  limit = 100
): Promise<SubmissionRow[]> {
  await ensureFormTables();
  const rows = (await sql`
    SELECT id, form_id, data, ip, ua, ts
    FROM form_submissions
    WHERE form_id = ${formId}
    ORDER BY ts DESC
    LIMIT ${limit}
  `) as unknown as SubmissionRow[];
  return rows;
}

export async function generateFormFromPrompt(prompt: string): Promise<FormField[]> {
  const system = `You convert natural-language form descriptions into a JSON array of FormField objects.
Output JSON ONLY — no prose, no markdown fences.
Each field: { "id": string (snake_case), "type": "text"|"email"|"number"|"textarea"|"select"|"checkbox"|"radio"|"date"|"file", "label": string, "required": boolean, "options"?: string[], "placeholder"?: string }
Use "select"/"radio"/"checkbox" only when options make sense and include an "options" array.`;

  const res = await callLLM({
    model: "claude-haiku-4-5-20251001",
    system,
    userMessage: `Form description: ${prompt}\n\nReturn the JSON array of fields.`,
    maxTokens: 2000,
  });

  let text = res.text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1) {
    throw new Error("AI did not return a JSON array");
  }
  const parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("AI output is not an array");
  }
  const valid: FormFieldType[] = [
    "text",
    "email",
    "number",
    "textarea",
    "select",
    "checkbox",
    "radio",
    "date",
    "file",
  ];
  const out: FormField[] = [];
  for (const raw of parsed) {
    if (typeof raw !== "object" || raw === null) continue;
    const r = raw as Record<string, unknown>;
    const type = String(r.type ?? "text") as FormFieldType;
    if (!valid.includes(type)) continue;
    const label = String(r.label ?? "Field");
    const id = String(r.id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
    const field: FormField = {
      id,
      type,
      label,
      required: Boolean(r.required),
    };
    if (Array.isArray(r.options)) {
      field.options = r.options.map((o) => String(o));
    }
    if (typeof r.placeholder === "string") {
      field.placeholder = r.placeholder;
    }
    out.push(field);
  }
  return out;
}
