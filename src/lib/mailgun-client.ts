/**
 * Mailgun client stub — requires MAILGUN_API_KEY and MAILGUN_DOMAIN in env.
 * Silently no-ops when not configured so the build passes.
 */

const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY || "";
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN || "mg.zoobicon.com";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!MAILGUN_API_KEY) {
    console.warn("[mailgun] MAILGUN_API_KEY not set — email not sent");
    return { ok: false, error: "MAILGUN_API_KEY not configured" };
  }

  const form = new URLSearchParams();
  form.set("from", opts.from || `Zoobicon <noreply@${MAILGUN_DOMAIN}>`);
  form.set("to", opts.to);
  form.set("subject", opts.subject);
  form.set("html", opts.html);

  try {
    const res = await fetch(
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64")}`,
        },
        body: form,
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Mailgun HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
