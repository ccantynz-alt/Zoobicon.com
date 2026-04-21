import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  pbkdf2Sync,
} from "node:crypto";
import { sql } from "@/lib/db";

export type SecretType = "api_key" | "password" | "token" | "certificate" | "note";

export interface StoreSecretInput {
  userId: string;
  name: string;
  value: string;
  type: SecretType;
}

export interface SecretRecord {
  id: string;
  userId: string;
  name: string;
  type: SecretType;
  createdAt: string;
  updatedAt: string;
}

export interface SecretWithValue extends SecretRecord {
  value: string;
}

export class VaultUnavailableError extends Error {
  public readonly status = 503;
  constructor(message: string) {
    super(message);
    this.name = "VaultUnavailableError";
  }
}

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";
const PBKDF2_SALT = "zoobicon-vault-v1";
const ALGO = "aes-256-gcm";

function assertEnv(): void {
  if (!process.env.DATABASE_URL) {
    throw new VaultUnavailableError("DATABASE_URL not configured");
  }
  if (!process.env.VAULT_MASTER_KEY) {
    throw new VaultUnavailableError("VAULT_MASTER_KEY not configured");
  }
}

function deriveKey(): Buffer {
  const master = process.env.VAULT_MASTER_KEY as string;
  return pbkdf2Sync(master, PBKDF2_SALT, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
}

function encrypt(plaintext: string): { ciphertext: string; iv: string; tag: string } {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: enc.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

function decrypt(ciphertext: string, iv: string, tag: string): string {
  const key = deriveKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

let schemaReady = false;
async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS vault_secrets (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL,
      ciphertext  TEXT NOT NULL,
      iv          TEXT NOT NULL,
      tag         TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS vault_secrets_user_id_idx ON vault_secrets(user_id)`;
  schemaReady = true;
}

interface Row {
  id: string;
  user_id: string;
  name: string;
  type: string;
  ciphertext: string;
  iv: string;
  tag: string;
  created_at: string;
  updated_at: string;
}

function rowToRecord(r: Row): SecretRecord {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    type: r.type as SecretType,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function newId(): string {
  return `vs_${randomBytes(12).toString("hex")}`;
}

export async function storeSecret(input: StoreSecretInput): Promise<SecretRecord> {
  assertEnv();
  await ensureSchema();
  const id = newId();
  const { ciphertext, iv, tag } = encrypt(input.value);
  const rows = (await sql`
    INSERT INTO vault_secrets (id, user_id, name, type, ciphertext, iv, tag)
    VALUES (${id}, ${input.userId}, ${input.name}, ${input.type}, ${ciphertext}, ${iv}, ${tag})
    RETURNING id, user_id, name, type, ciphertext, iv, tag, created_at, updated_at
  `) as unknown as Row[];
  return rowToRecord(rows[0]);
}

export async function getSecret(userId: string, secretId: string): Promise<SecretWithValue | null> {
  assertEnv();
  await ensureSchema();
  const rows = (await sql`
    SELECT id, user_id, name, type, ciphertext, iv, tag, created_at, updated_at
    FROM vault_secrets
    WHERE id = ${secretId} AND user_id = ${userId}
    LIMIT 1
  `) as unknown as Row[];
  if (rows.length === 0) return null;
  const r = rows[0];
  const value = decrypt(r.ciphertext, r.iv, r.tag);
  return { ...rowToRecord(r), value };
}

export async function listSecrets(userId: string): Promise<SecretRecord[]> {
  assertEnv();
  await ensureSchema();
  const rows = (await sql`
    SELECT id, user_id, name, type, ciphertext, iv, tag, created_at, updated_at
    FROM vault_secrets
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `) as unknown as Row[];
  return rows.map(rowToRecord);
}

export async function deleteSecret(userId: string, secretId: string): Promise<boolean> {
  assertEnv();
  await ensureSchema();
  const rows = (await sql`
    DELETE FROM vault_secrets
    WHERE id = ${secretId} AND user_id = ${userId}
    RETURNING id
  `) as unknown as { id: string }[];
  return rows.length > 0;
}

export async function rotateSecret(
  userId: string,
  secretId: string,
  newValue: string,
): Promise<SecretRecord | null> {
  assertEnv();
  await ensureSchema();
  const { ciphertext, iv, tag } = encrypt(newValue);
  const rows = (await sql`
    UPDATE vault_secrets
    SET ciphertext = ${ciphertext}, iv = ${iv}, tag = ${tag}, updated_at = NOW()
    WHERE id = ${secretId} AND user_id = ${userId}
    RETURNING id, user_id, name, type, ciphertext, iv, tag, created_at, updated_at
  `) as unknown as Row[];
  if (rows.length === 0) return null;
  return rowToRecord(rows[0]);
}
