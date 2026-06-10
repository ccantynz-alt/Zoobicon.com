/**
 * Vapron email send client — wraps `services/email-send` (BLK-030).
 *
 * Vapron runs its own outbound mail service at
 * https://api.crontech.ai/email-send/v1/messages — no Mailgun, no SES,
 * no third-party dependency. This module is the single Zoobicon callsite
 * for all outbound transactional mail.
 *
 * Auth:    Bearer $EMAIL_SEND_TOKEN
 * Tenant:  $CRONTECH_EMAIL_TENANT_ID (defaults to "zoobicon")
 * From:    $EMAIL_FROM (defaults to "Zoobicon <noreply@mail.zoobicon.com>")
 *
 * When EMAIL_SEND_TOKEN is unset the function logs and returns ok:false
 * so callers gracefully degrade — no crash, no silent data loss.
 *
 * Delivery lifecycle events arrive at /api/email-send/webhook.
 */

const CRONTECH_API_BASE = process.env.CRONTECH_API_BASE || "https://api.crontech.ai";
const EMAIL_SEND_TOKEN = process.env.EMAIL_SEND_TOKEN || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "Zoobicon <noreply@mail.zoobicon.com>";
const TENANT_ID = process.env.CRONTECH_EMAIL_TENANT_ID || "zoobicon";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Override the default from address for this message. */
  from?: string;
  /** Idempotency key — Vapron deduplicates on this within 24h. */
  messageId?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  status?: string;
  error?: string;
}

/**
 * Returns true when the email service is configured and ready to send.
 * Use this to gate UI features that depend on email (e.g. "Send receipt").
 */
export function emailSendAvailable(): boolean {
  return Boolean(EMAIL_SEND_TOKEN);
}

/**
 * Send a transactional email via Vapron's own email service.
 * Returns { ok: true, id } on 202 Accepted, { ok: false, error } otherwise.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!EMAIL_SEND_TOKEN) {
    console.log(
      `[email-send:stubbed] to="${Array.isArray(input.to) ? input.to.join(",") : input.to}" subject="${input.subject.slice(0, 60)}" ` +
      `(EMAIL_SEND_TOKEN not set — set it in Vercel env to enable delivery)`,
    );
    return { ok: false, error: "EMAIL_SEND_TOKEN not set" };
  }

  const body: Record<string, unknown> = {
    from: input.from || EMAIL_FROM,
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text || input.subject,
    tenantId: TENANT_ID,
  };
  if (input.messageId) body.messageId = input.messageId;

  try {
    const res = await fetch(`${CRONTECH_API_BASE}/email-send/v1/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${EMAIL_SEND_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 202) {
      const data = (await res.json()) as { id?: string; status?: string };
      return { ok: true, id: data.id, status: data.status };
    }

    const text = await res.text().catch(() => "");
    let detail = text.slice(0, 300);
    try {
      const parsed = JSON.parse(text) as { issues?: unknown[] };
      if (parsed.issues) detail = JSON.stringify(parsed.issues).slice(0, 300);
    } catch { /* raw text is fine */ }

    console.error(`[email-send] ${res.status} from Vapron email: ${detail}`);
    return { ok: false, error: `Vapron email ${res.status}: ${detail}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[email-send] network error: ${msg}`);
    return { ok: false, error: msg };
  }
}

/**
 * Verify a Vapron email webhook signature.
 * Header: x-crontech-signature: sha256=<hex>
 * Computed as: hmac_sha256(webhookSecret, rawBody)
 */
export async function verifyEmailWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string,
): Promise<boolean> {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const received = signatureHeader.slice(7); // strip "sha256="
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === received;
}
