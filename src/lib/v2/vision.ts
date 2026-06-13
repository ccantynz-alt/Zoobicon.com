/**
 * Vision self-critique — the builder gains SIGHT of its own work.
 *
 * Code-level critics can't see spacing, contrast, overlap or balance. This adds
 * a real one: screenshot the finished page with a headless browser (Cloudflare
 * Browser Rendering), then have a vision model judge the *rendered image* like a
 * design director and report concrete visual flaws. Those notes feed the fixer
 * alongside the code critics, so the page gets fixed for how it actually LOOKS.
 *
 * Fully graceful: no Cloudflare creds ⇒ no screenshot ⇒ returns "" and the
 * code critics carry on. No Anthropic key / any failure ⇒ "". Never throws.
 */

const VISION_MODEL = "claude-sonnet-4-6"; // vision-capable, fast, cheap for a critique

// Render the given HTML to a PNG via Cloudflare Browser Rendering. Returns
// base64 (no data: prefix) or null if unavailable.
async function screenshotHtml(html: string): Promise<string | null> {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!account || !token) return null;
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/browser-rendering/screenshot`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          screenshotOptions: { fullPage: false, type: "png" },
          viewport: { width: 1280, height: 900 },
          gotoOptions: { waitUntil: "networkidle0", timeout: 20000 },
        }),
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) return null; // not a real image
    return buf.toString("base64");
  } catch {
    return null;
  }
}

const VISION_PROMPT = `You are a senior design director looking at a screenshot of a finished marketing website. List up to 6 SPECIFIC, concrete VISUAL problems you can actually see — things only visible in the rendered image: weak hierarchy, cramped or uneven spacing, low contrast / unreadable text, overlapping or misaligned elements, an empty/flat hero, awkward image crops, unbalanced layout, inconsistent styling. For each, say exactly what to change. Bullet points only, no prose, no praise. If it genuinely looks great, say "LGTM".`;

/**
 * Screenshot the page and return visual critique notes (markdown bullets), or
 * "" when sight isn't available. Never throws.
 */
export async function visionCritique(html: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "";
  const shot = await screenshotHtml(html);
  if (!shot) return ""; // no eyes yet (Cloudflare Browser Rendering not enabled)
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/png", data: shot } },
              { type: "text", text: VISION_PROMPT },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(40000),
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = (data.content?.find((b) => b.type === "text")?.text || "").trim();
    if (!text || /^lgtm/i.test(text)) return "";
    return `### visual critique (what it actually looks like)\n${text}`;
  } catch {
    return "";
  }
}
