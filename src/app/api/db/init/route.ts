import { initSchema } from "@/lib/db";

const html = (title: string, color: string, body: string) => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Zoobicon DB Init</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0f1117;color:#e2e8f0;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .card{background:#1a1f2e;border:1px solid ${color}33;border-radius:12px;padding:2rem;max-width:560px;width:100%;margin:2rem}
  h1{margin:0 0 .5rem;color:${color};font-size:1.5rem}
  p{margin:.5rem 0;line-height:1.6}
  pre{background:#0f1117;border:1px solid #2d3748;border-radius:8px;padding:1rem;font-size:.85rem;overflow-x:auto;color:#a0aec0}
  .ok{color:#68d391} .warn{color:#f6ad55} .err{color:#fc8181}
</style>
</head>
<body><div class="card">${body}</div></body>
</html>`;

/**
 * GET /api/db/init
 * Runs CREATE TABLE IF NOT EXISTS for all tables.
 * Safe to run multiple times — only creates tables that don't exist.
 */
export async function GET() {
  // ── 1. Check env var first ──────────────────────────────────────────────
  if (!process.env.DATABASE_URL) {
    return new Response(
      html(
        "❌ Missing DATABASE_URL",
        "#fc8181",
        `<h1>❌ DATABASE_URL is not set</h1>
        <p>The database connection string is missing from your Vercel environment variables.</p>
        <p><strong>To fix this:</strong></p>
        <ol style="line-height:2">
          <li>Go to <strong>vercel.com</strong> → your Zoobicon project → <strong>Settings → Environment Variables</strong></li>
          <li>Add a variable named <code>DATABASE_URL</code></li>
          <li>The value is your Neon connection string — find it at <strong>console.neon.tech</strong> → your project → <em>Connection string</em></li>
          <li>Make sure it's enabled for <strong>Production</strong>, Preview, and Development</li>
          <li>Redeploy, then visit this page again</li>
        </ol>
        <p class="warn">⚠️ Without DATABASE_URL, auth, sites, domains, and the builder cannot save anything.</p>`
      ),
      { status: 503, headers: { "Content-Type": "text/html" } }
    );
  }

  // ── 2. Run schema init ──────────────────────────────────────────────────
  try {
    await initSchema();

    return new Response(
      html(
        "✅ Database Ready",
        "#68d391",
        `<h1>✅ Database is ready</h1>
        <p class="ok">All tables created successfully. You only need to run this once.</p>
        <p><strong>What was created:</strong></p>
        <pre>users, projects, project_versions, project_messages
sites, deployments, custom_domains, dns_records
site_analytics, agencies, agency_members, agency_clients
agency_client_sites, bulk_jobs, agency_generations
collab_rooms, collab_participants, collab_code_sync
email_domains, email_mailboxes, email_inbound
email_events, email_outbound
registered_domains, support_tickets, support_messages
knowledge_base, support_usage, support_sessions
video_batches, usage_tracking
site_users, site_data</pre>
        <p>You can safely visit this page again — it uses <code>CREATE TABLE IF NOT EXISTS</code> so nothing is overwritten.</p>
        <p>✅ <strong>Next step:</strong> Go build something on <a href="/builder" style="color:#90cdf4">/builder</a></p>`
      ),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isConnErr = message.includes("ECONNREFUSED") || message.includes("timeout") || message.includes("SSL");

    return new Response(
      html(
        "❌ Database Error",
        "#fc8181",
        `<h1>❌ Could not connect to the database</h1>
        <p class="err">${message}</p>
        ${isConnErr ? `<p><strong>This looks like a connection problem. Check:</strong></p>
        <ol style="line-height:2">
          <li>Is your <strong>DATABASE_URL</strong> correct? (copy it fresh from console.neon.tech)</li>
          <li>Is your Neon project <strong>active</strong>? Free projects sleep after 5 days of inactivity — visit console.neon.tech to wake it</li>
          <li>Is Vercel's region (iad1) allowed in Neon's IP allowlist? (Neon allows all by default)</li>
        </ol>` : ""}
        <p>If this keeps happening, copy the error above and send it to support.</p>`
      ),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}
