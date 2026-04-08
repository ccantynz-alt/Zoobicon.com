/**
 * CSV ETL utilities — parse, transform, clean, dedupe, export, import.
 * Strict TypeScript, no `any`.
 */

import { sql } from "@/lib/db";

export type CsvValue = string | number | boolean | null;
export type CsvRow = Record<string, CsvValue>;

export interface ParseResult {
  headers: string[];
  rows: CsvRow[];
  errors: string[];
}

export type ColumnType = "string" | "number" | "date" | "email" | "url" | "bool";
export type Schema = Record<string, ColumnType>;

export type MappingFn = (row: CsvRow) => CsvValue;
export type Mapping = Record<string, string | MappingFn>;

const BOM = "\uFEFF";

/**
 * Parse a CSV string into headers + rows.
 * Handles: quoted fields, embedded commas, escaped quotes (""), CR/LF, BOM.
 */
export function parseCsv(text: string): ParseResult {
  const errors: string[] = [];
  if (typeof text !== "string") {
    return { headers: [], rows: [], errors: ["input is not a string"] };
  }

  let input = text;
  if (input.startsWith(BOM)) input = input.slice(1);

  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < len && input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\r") {
      i++;
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      records.push(row);
      field = "";
      row = [];
      i++;
      continue;
    }
    field += ch;
    i++;
  }

  if (inQuotes) {
    errors.push("unterminated quoted field");
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  if (records.length === 0) {
    return { headers: [], rows: [], errors };
  }

  const rawHeaders = records[0].map((h) => h.trim());
  const headers = rawHeaders.map((h, idx) => (h.length > 0 ? h : `column_${idx + 1}`));
  const rows: CsvRow[] = [];

  for (let r = 1; r < records.length; r++) {
    const rec = records[r];
    if (rec.length === 1 && rec[0] === "") continue;
    const obj: CsvRow = {};
    for (let c = 0; c < headers.length; c++) {
      const v = c < rec.length ? rec[c] : "";
      obj[headers[c]] = v;
    }
    if (rec.length !== headers.length) {
      errors.push(`row ${r + 1}: expected ${headers.length} fields, got ${rec.length}`);
    }
    rows.push(obj);
  }

  return { headers, rows, errors };
}

function escapeCsvField(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Serialize rows back to CSV text.
 */
export function writeCsv(rows: CsvRow[], headers?: string[]): string {
  const cols =
    headers && headers.length > 0
      ? headers
      : rows.length > 0
      ? Object.keys(rows[0])
      : [];
  const lines: string[] = [];
  lines.push(cols.map((c) => escapeCsvField(c)).join(","));
  for (const row of rows) {
    lines.push(cols.map((c) => escapeCsvField(row[c] ?? null)).join(","));
  }
  return lines.join("\n");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;
const BOOL_RE = /^(true|false|yes|no|y|n|1|0)$/i;
const NUMBER_RE = /^-?\d+(\.\d+)?$/;

function detectValueType(v: CsvValue): ColumnType | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === "") return null;
  if (EMAIL_RE.test(s)) return "email";
  if (URL_RE.test(s)) return "url";
  if (BOOL_RE.test(s)) return "bool";
  if (NUMBER_RE.test(s)) return "number";
  const d = Date.parse(s);
  if (!Number.isNaN(d) && /\d{4}/.test(s) && /[-/:]/.test(s)) return "date";
  return "string";
}

/**
 * Infer a schema (column types) from sampled rows.
 */
export function detectSchema(rows: CsvRow[]): Schema {
  const schema: Schema = {};
  if (rows.length === 0) return schema;
  const cols = Object.keys(rows[0]);
  const sample = rows.slice(0, 200);

  for (const col of cols) {
    const counts: Record<ColumnType, number> = {
      string: 0,
      number: 0,
      date: 0,
      email: 0,
      url: 0,
      bool: 0,
    };
    let nonEmpty = 0;
    for (const row of sample) {
      const t = detectValueType(row[col]);
      if (t === null) continue;
      nonEmpty++;
      counts[t]++;
    }
    if (nonEmpty === 0) {
      schema[col] = "string";
      continue;
    }
    let best: ColumnType = "string";
    let bestCount = -1;
    (Object.keys(counts) as ColumnType[]).forEach((k) => {
      if (counts[k] > bestCount) {
        bestCount = counts[k];
        best = k;
      }
    });
    schema[col] = best;
  }
  return schema;
}

/**
 * Apply a field mapping to transform rows into a new shape.
 */
export function transformRows(rows: CsvRow[], mapping: Mapping): CsvRow[] {
  const targets = Object.keys(mapping);
  const out: CsvRow[] = [];
  for (const row of rows) {
    const next: CsvRow = {};
    for (const target of targets) {
      const m = mapping[target];
      if (typeof m === "function") {
        next[target] = m(row);
      } else {
        next[target] = row[m] ?? null;
      }
    }
    out.push(next);
  }
  return out;
}

/**
 * Drop duplicate rows by composite key.
 */
export function dedupe(rows: CsvRow[], keys: string[]): CsvRow[] {
  if (keys.length === 0) {
    const seen = new Set<string>();
    const out: CsvRow[] = [];
    for (const row of rows) {
      const k = JSON.stringify(row);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(row);
    }
    return out;
  }
  const seen = new Set<string>();
  const out: CsvRow[] = [];
  for (const row of rows) {
    const k = keys.map((key) => String(row[key] ?? "")).join("\u0001");
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(row);
  }
  return out;
}

/**
 * Trim string fields and normalize whitespace + email/url casing.
 */
export function cleanData(rows: CsvRow[]): CsvRow[] {
  const out: CsvRow[] = [];
  for (const row of rows) {
    const next: CsvRow = {};
    for (const key of Object.keys(row)) {
      const v = row[key];
      if (typeof v === "string") {
        let s = v.trim().replace(/\s+/g, " ");
        if (EMAIL_RE.test(s)) s = s.toLowerCase();
        else if (URL_RE.test(s)) s = s.toLowerCase();
        next[key] = s;
      } else {
        next[key] = v;
      }
    }
    out.push(next);
  }
  return out;
}

/**
 * Export rows as JSON string.
 */
export function exportJson(rows: CsvRow[]): string {
  return JSON.stringify(rows, null, 2);
}

function sanitizeIdentifier(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 63);
  if (cleaned.length === 0) return "col";
  if (/^[0-9]/.test(cleaned)) return `c_${cleaned}`;
  return cleaned;
}

export interface ImportResult {
  inserted: number;
  table: string;
  errors: string[];
}

/**
 * Import rows into a Postgres table. Sanitizes identifiers, parameterizes values.
 */
export async function importToDb(opts: {
  tableName: string;
  rows: CsvRow[];
  userId: string;
}): Promise<ImportResult> {
  const errors: string[] = [];
  const table = sanitizeIdentifier(opts.tableName);
  if (!table) {
    return { inserted: 0, table, errors: ["invalid table name"] };
  }
  if (opts.rows.length === 0) {
    return { inserted: 0, table, errors: ["no rows to import"] };
  }

  const sourceCols = Object.keys(opts.rows[0]);
  const colMap: Record<string, string> = {};
  const safeCols: string[] = [];
  for (const c of sourceCols) {
    const safe = sanitizeIdentifier(c);
    colMap[c] = safe;
    safeCols.push(safe);
  }

  let inserted = 0;
  try {
    const colList = safeCols.map((c) => `"${c}"`).join(", ");
    for (const row of opts.rows) {
      const values: CsvValue[] = sourceCols.map((c) => row[c] ?? null);
      const placeholders = values
        .map((_, i) => `$${i + 1}`)
        .concat([`$${values.length + 1}`])
        .join(", ");
      const queryText = `INSERT INTO "${table}" (${colList}, "user_id") VALUES (${placeholders})`;
      const params: (CsvValue | string)[] = [...values, opts.userId];
      const sqlClient = sql as unknown as (
        text: string,
        params: (CsvValue | string)[]
      ) => Promise<unknown>;
      try {
        await sqlClient(queryText, params);
        inserted++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  return { inserted, table, errors };
}
