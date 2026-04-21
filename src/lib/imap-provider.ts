/**
 * IMAP Email Provider — connects admin dashboard to real mailbox
 *
 * Reads emails directly from any IMAP server (Zoho, Gmail, MXRoute, etc.)
 * No Mailgun webhook needed — pulls real emails with full body content.
 *
 * Features:
 *   - Connection pooling with 5-minute TTL
 *   - Retry with exponential backoff (1s, 2s, 4s) on network failure
 *   - Rate limiting: max 5 concurrent folder fetches per account
 *   - Structured error responses (never lets ImapFlow errors bubble)
 *
 * ENV vars:
 *   IMAP_HOST     — IMAP server (e.g. imappro.zoho.com, imap.gmail.com)
 *   IMAP_PORT     — Port (default 993)
 *   IMAP_USER     — Email address (e.g. admin@zoobicon.com)
 *   IMAP_PASSWORD  — Password or app-specific password
 */

import { ImapFlow } from "imapflow";

// ── Types ──

export interface ImapEmail {
  id: string;
  uid: number;
  from_address: string;
  from_name: string;
  to_address: string;
  subject: string;
  text_body: string;
  html_body: string;
  received_at: string;
  read: boolean;
  folder: string;
  has_attachments: boolean;
}

export interface ImapError {
  ok: false;
  code: "AUTH_FAILURE" | "NETWORK_ERROR" | "TIMEOUT" | "NOT_CONFIGURED" | "RATE_LIMITED" | "UNKNOWN";
  message: string;
}

export type ImapResult<T> = { ok: true; data: T } | ImapError;

// ── Configuration ──

function getConfig() {
  return {
    host: process.env.IMAP_HOST || "",
    port: parseInt(process.env.IMAP_PORT || "993", 10),
    user: process.env.IMAP_USER || "",
    pass: process.env.IMAP_PASSWORD || "",
  };
}

export function isImapConfigured(): boolean {
  const c = getConfig();
  return !!(c.host && c.user && c.pass);
}

// ── Connection Pool ──

const CONNECTION_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface PooledConnection {
  client: ImapFlow;
  createdAt: number;
  inUse: boolean;
}

let pooledConn: PooledConnection | null = null;

async function getPooledClient(): Promise<ImapFlow> {
  // Return existing connection if still valid
  if (pooledConn && !pooledConn.inUse) {
    const age = Date.now() - pooledConn.createdAt;
    if (age < CONNECTION_TTL_MS) {
      // Test the connection is still alive
      try {
        pooledConn.inUse = true;
        // A lightweight NOOP to verify the connection is alive
        await pooledConn.client.noop();
        return pooledConn.client;
      } catch {
        // Connection is dead — close it and create a new one
        try { await pooledConn.client.logout(); } catch { /* ignore */ }
        pooledConn = null;
      }
    } else {
      // TTL expired
      try { await pooledConn.client.logout(); } catch { /* ignore */ }
      pooledConn = null;
    }
  }

  // Create a new connection
  const c = getConfig();
  const client = new ImapFlow({
    host: c.host,
    port: c.port,
    secure: true,
    auth: { user: c.user, pass: c.pass },
    logger: false,
  });
  await client.connect();
  pooledConn = { client, createdAt: Date.now(), inUse: true };
  return client;
}

function releasePooledClient(): void {
  if (pooledConn) {
    pooledConn.inUse = false;
  }
}

async function closePooledClient(): Promise<void> {
  if (pooledConn) {
    try { await pooledConn.client.logout(); } catch { /* ignore */ }
    pooledConn = null;
  }
}

// ── Retry Logic ──

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000; // 1s, 2s, 4s

function classifyError(err: unknown): ImapError["code"] {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes("auth") || lower.includes("login") || lower.includes("credentials") || lower.includes("401")) {
    return "AUTH_FAILURE";
  }
  if (lower.includes("timeout") || lower.includes("timed out") || lower.includes("etimedout")) {
    return "TIMEOUT";
  }
  if (lower.includes("econnrefused") || lower.includes("econnreset") || lower.includes("enetunreach") || lower.includes("enotfound") || lower.includes("socket")) {
    return "NETWORK_ERROR";
  }
  return "UNKNOWN";
}

async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: { maxRetries?: number },
): Promise<T> {
  const maxRetries = opts?.maxRetries ?? MAX_RETRIES;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const code = classifyError(err);

      // Auth failures are not retryable
      if (code === "AUTH_FAILURE") throw err;

      // Timeouts get only 1 retry
      if (code === "TIMEOUT" && attempt >= 1) throw err;

      // Last attempt — don't sleep, just throw
      if (attempt === maxRetries) throw err;

      // Kill the pooled connection on error so next attempt creates a fresh one
      await closePooledClient();

      // Exponential backoff: 1s, 2s, 4s
      const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ── Semaphore for Rate Limiting ──

const MAX_CONCURRENT_FETCHES = 5;
let activeFetches = 0;
const fetchQueue: Array<{ resolve: () => void }> = [];

async function acquireFetchSlot(): Promise<void> {
  if (activeFetches < MAX_CONCURRENT_FETCHES) {
    activeFetches++;
    return;
  }
  // Wait in queue
  return new Promise<void>((resolve) => {
    fetchQueue.push({ resolve });
  });
}

function releaseFetchSlot(): void {
  activeFetches--;
  const next = fetchQueue.shift();
  if (next) {
    activeFetches++;
    next.resolve();
  }
}

// ── Folder Map ──

const FOLDER_MAP: Record<string, string> = {
  inbox: "INBOX",
  sent: "Sent",
  spam: "Junk",
  trash: "Trash",
  drafts: "Drafts",
};

function resolveFolder(folder: string): string {
  return FOLDER_MAP[folder.toLowerCase()] || folder;
}

// ── Public API ──

/**
 * Fetch emails from a mailbox folder.
 */
export async function fetchEmails(
  folder: string = "INBOX",
  limit: number = 50,
  page: number = 1,
): Promise<ImapResult<{ emails: ImapEmail[]; total: number; unread: number }>> {
  if (!isImapConfigured()) {
    return { ok: false, code: "NOT_CONFIGURED", message: "IMAP is not configured. Set IMAP_HOST, IMAP_USER, and IMAP_PASSWORD." };
  }

  await acquireFetchSlot();
  try {
    return await withRetry(async () => {
      const client = await getPooledClient();
      try {
        const imapFolder = resolveFolder(folder);
        const lock = await client.getMailboxLock(imapFolder);

        try {
          const status = await client.status(imapFolder, { messages: true, unseen: true });
          const total = status.messages || 0;
          const unread = status.unseen || 0;

          if (total === 0) {
            return { ok: true as const, data: { emails: [], total: 0, unread } };
          }

          // Calculate range for pagination (newest first)
          const start = Math.max(1, total - (page * limit) + 1);
          const end = Math.max(1, total - ((page - 1) * limit));
          const range = `${start}:${end}`;

          const emails: ImapEmail[] = [];

          for await (const message of client.fetch(range, {
            envelope: true,
            source: true,
            bodyStructure: true,
            flags: true,
            uid: true,
          })) {
            const envelope = message.envelope;
            if (!envelope) continue;

            let textBody = "";
            let htmlBody = "";

            if (message.source) {
              const raw = message.source.toString();

              const textMatch = raw.match(/Content-Type:\s*text\/plain[\s\S]*?\r?\n\r?\n([\s\S]*?)(?=\r?\n--|\r?\n\.\r?\n|$)/i);
              if (textMatch) textBody = textMatch[1].trim();

              const htmlMatch = raw.match(/Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n([\s\S]*?)(?=\r?\n--|\r?\n\.\r?\n|$)/i);
              if (htmlMatch) htmlBody = htmlMatch[1].trim();

              if (!textBody && !htmlBody) {
                const bodyStart = raw.indexOf("\r\n\r\n");
                if (bodyStart > -1) {
                  const body = raw.slice(bodyStart + 4).trim();
                  if (raw.includes("text/html")) {
                    htmlBody = body;
                  } else {
                    textBody = body;
                  }
                }
              }
            }

            const fromAddr = envelope.from?.[0];
            const toAddr = envelope.to?.[0];

            emails.push({
              id: `imap-${message.uid}`,
              uid: message.uid,
              from_address: fromAddr ? `${fromAddr.name || ""} <${fromAddr.address || ""}>`.trim() : "Unknown",
              from_name: fromAddr?.name || fromAddr?.address?.split("@")[0] || "Unknown",
              to_address: toAddr?.address || "",
              subject: envelope.subject || "(No Subject)",
              text_body: textBody,
              html_body: htmlBody,
              received_at: envelope.date?.toISOString() || new Date().toISOString(),
              read: message.flags?.has("\\Seen") || false,
              folder: folder.toLowerCase(),
              has_attachments: !!(message.bodyStructure && hasAttachments(message.bodyStructure)),
            });
          }

          emails.reverse();
          return { ok: true as const, data: { emails, total, unread } };
        } finally {
          lock.release();
        }
      } finally {
        releasePooledClient();
      }
    });
  } catch (err) {
    const code = classifyError(err);
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, code, message: formatErrorMessage(code, message) };
  } finally {
    releaseFetchSlot();
  }
}

/**
 * Mark an email as read/unread.
 */
export async function markRead(uid: number, read: boolean, folder: string = "INBOX"): Promise<ImapResult<boolean>> {
  if (!isImapConfigured()) {
    return { ok: false, code: "NOT_CONFIGURED", message: "IMAP is not configured." };
  }

  try {
    return await withRetry(async () => {
      const client = await getPooledClient();
      try {
        const lock = await client.getMailboxLock(resolveFolder(folder));
        try {
          if (read) {
            await client.messageFlagsAdd({ uid: uid.toString() }, ["\\Seen"], { uid: true });
          } else {
            await client.messageFlagsRemove({ uid: uid.toString() }, ["\\Seen"], { uid: true });
          }
          return { ok: true as const, data: true };
        } finally {
          lock.release();
        }
      } finally {
        releasePooledClient();
      }
    });
  } catch (err) {
    const code = classifyError(err);
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, code, message: formatErrorMessage(code, message) };
  }
}

/**
 * Move email to a folder (trash, spam, etc.)
 */
export async function moveEmail(uid: number, fromFolder: string, toFolder: string): Promise<ImapResult<boolean>> {
  if (!isImapConfigured()) {
    return { ok: false, code: "NOT_CONFIGURED", message: "IMAP is not configured." };
  }

  try {
    return await withRetry(async () => {
      const client = await getPooledClient();
      try {
        const lock = await client.getMailboxLock(resolveFolder(fromFolder));
        try {
          await client.messageMove({ uid: uid.toString() }, resolveFolder(toFolder), { uid: true });
          return { ok: true as const, data: true };
        } finally {
          lock.release();
        }
      } finally {
        releasePooledClient();
      }
    });
  } catch (err) {
    const code = classifyError(err);
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, code, message: formatErrorMessage(code, message) };
  }
}

// ── Helpers ──

function hasAttachments(structure: Record<string, unknown>): boolean {
  if (structure.disposition === "attachment") return true;
  if (Array.isArray(structure.childNodes)) {
    return structure.childNodes.some((child: Record<string, unknown>) => hasAttachments(child));
  }
  return false;
}

function formatErrorMessage(code: ImapError["code"], raw: string): string {
  switch (code) {
    case "AUTH_FAILURE":
      return "IMAP authentication failed. Check IMAP_USER and IMAP_PASSWORD in environment variables.";
    case "NETWORK_ERROR":
      return `Cannot connect to IMAP server. Check IMAP_HOST and ensure the server is reachable. (${raw})`;
    case "TIMEOUT":
      return "IMAP connection timed out. The server may be overloaded or unreachable.";
    case "NOT_CONFIGURED":
      return "IMAP is not configured. Set IMAP_HOST, IMAP_USER, and IMAP_PASSWORD.";
    case "RATE_LIMITED":
      return "Too many concurrent IMAP requests. Please wait and try again.";
    default:
      return `IMAP error: ${raw}`;
  }
}
