/**
 * IMAP Email Provider — connects admin dashboard to real mailbox
 *
 * Reads emails directly from any IMAP server (Zoho, Gmail, MXRoute, etc.)
 * No Mailgun webhook needed — pulls real emails with full body content.
 *
 * ENV vars:
 *   IMAP_HOST     — IMAP server (e.g. imappro.zoho.com, imap.gmail.com)
 *   IMAP_PORT     — Port (default 993)
 *   IMAP_USER     — Email address (e.g. admin@zoobicon.com)
 *   IMAP_PASSWORD  — Password or app-specific password
 */

import { ImapFlow } from "imapflow";

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

async function createClient(): Promise<ImapFlow> {
  const c = getConfig();
  const client = new ImapFlow({
    host: c.host,
    port: c.port,
    secure: true,
    auth: { user: c.user, pass: c.pass },
    logger: false,
  });
  await client.connect();
  return client;
}

/**
 * Fetch emails from a mailbox folder.
 */
export async function fetchEmails(
  folder: string = "INBOX",
  limit: number = 50,
  page: number = 1,
): Promise<{ emails: ImapEmail[]; total: number; unread: number }> {
  if (!isImapConfigured()) {
    return { emails: [], total: 0, unread: 0 };
  }

  const client = await createClient();

  try {
    // Map friendly names to IMAP folder names
    const folderMap: Record<string, string> = {
      inbox: "INBOX",
      sent: "Sent",
      spam: "Junk",
      trash: "Trash",
      drafts: "Drafts",
    };
    const imapFolder = folderMap[folder.toLowerCase()] || folder;

    const lock = await client.getMailboxLock(imapFolder);

    try {
      const status = await client.status(imapFolder, { messages: true, unseen: true });
      const total = status.messages || 0;
      const unread = status.unseen || 0;

      if (total === 0) {
        return { emails: [], total: 0, unread };
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

        // Parse body from source
        let textBody = "";
        let htmlBody = "";

        if (message.source) {
          const raw = message.source.toString();

          // Extract text/plain body
          const textMatch = raw.match(/Content-Type:\s*text\/plain[\s\S]*?\r?\n\r?\n([\s\S]*?)(?=\r?\n--|\r?\n\.\r?\n|$)/i);
          if (textMatch) textBody = textMatch[1].trim();

          // Extract text/html body
          const htmlMatch = raw.match(/Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n([\s\S]*?)(?=\r?\n--|\r?\n\.\r?\n|$)/i);
          if (htmlMatch) htmlBody = htmlMatch[1].trim();

          // If no multipart, try the whole body after headers
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

      // Sort newest first
      emails.reverse();

      return { emails, total, unread };
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

/**
 * Mark an email as read/unread.
 */
export async function markRead(uid: number, read: boolean, folder: string = "INBOX"): Promise<boolean> {
  if (!isImapConfigured()) return false;

  const client = await createClient();
  try {
    const folderMap: Record<string, string> = { inbox: "INBOX", sent: "Sent", spam: "Junk", trash: "Trash" };
    const lock = await client.getMailboxLock(folderMap[folder] || folder);
    try {
      if (read) {
        await client.messageFlagsAdd({ uid: uid.toString() }, ["\\Seen"], { uid: true });
      } else {
        await client.messageFlagsRemove({ uid: uid.toString() }, ["\\Seen"], { uid: true });
      }
      return true;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

/**
 * Move email to a folder (trash, spam, etc.)
 */
export async function moveEmail(uid: number, fromFolder: string, toFolder: string): Promise<boolean> {
  if (!isImapConfigured()) return false;

  const client = await createClient();
  try {
    const folderMap: Record<string, string> = { inbox: "INBOX", sent: "Sent", spam: "Junk", trash: "Trash" };
    const lock = await client.getMailboxLock(folderMap[fromFolder] || fromFolder);
    try {
      await client.messageMove({ uid: uid.toString() }, folderMap[toFolder] || toFolder, { uid: true });
      return true;
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

/**
 * Check if a bodyStructure has attachments.
 */
function hasAttachments(structure: Record<string, unknown>): boolean {
  if (structure.disposition === "attachment") return true;
  if (Array.isArray(structure.childNodes)) {
    return structure.childNodes.some((child: Record<string, unknown>) => hasAttachments(child));
  }
  return false;
}
