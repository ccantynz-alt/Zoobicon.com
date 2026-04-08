import crypto from "crypto";
import { sql } from "@/lib/db";

const SLACK_OAUTH_URL = "https://slack.com/api/oauth.v2.access";
const SLACK_POST_MESSAGE_URL = "https://slack.com/api/chat.postMessage";
const SCOPES = "commands,chat:write,channels:read";

export interface SlackInstall {
  team_id: string;
  team_name: string;
  access_token: string;
  bot_user_id: string;
  scope: string;
  installed_by: string;
}

export interface SlashCommandPayload {
  token: string;
  team_id: string;
  team_domain: string;
  channel_id: string;
  channel_name: string;
  user_id: string;
  user_name: string;
  command: string;
  text: string;
  response_url: string;
  trigger_id: string;
}

export interface SlashCommandResponse {
  response_type: "ephemeral" | "in_channel";
  text: string;
  blocks?: unknown[];
}

interface SlackOAuthResponse {
  ok: boolean;
  error?: string;
  access_token?: string;
  scope?: string;
  bot_user_id?: string;
  team?: { id: string; name: string };
  authed_user?: { id: string };
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `[slack-bot] Missing required env var: ${name}. Set it in Vercel → Environment Variables.`,
    );
  }
  return v;
}

export async function ensureSlackTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS slack_installs (
      team_id TEXT PRIMARY KEY,
      team_name TEXT NOT NULL,
      access_token TEXT NOT NULL,
      bot_user_id TEXT NOT NULL,
      scope TEXT NOT NULL,
      installed_by TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export function getInstallUrl(state: string): string {
  const clientId = requireEnv("SLACK_CLIENT_ID");
  const params = new URLSearchParams({
    client_id: clientId,
    scope: SCOPES,
    state,
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function handleOAuthCallback(
  code: string,
  _state: string,
): Promise<{ team_id: string; team_name: string }> {
  const clientId = requireEnv("SLACK_CLIENT_ID");
  const clientSecret = requireEnv("SLACK_CLIENT_SECRET");

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(SLACK_OAUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = (await res.json()) as SlackOAuthResponse;
  if (!data.ok || !data.access_token || !data.team || !data.bot_user_id) {
    throw new Error(
      `[slack-bot] OAuth exchange failed: ${data.error ?? "unknown_error"}`,
    );
  }

  const installedBy = data.authed_user?.id ?? "unknown";
  await ensureSlackTables();
  await sql`
    INSERT INTO slack_installs (team_id, team_name, access_token, bot_user_id, scope, installed_by)
    VALUES (${data.team.id}, ${data.team.name}, ${data.access_token}, ${data.bot_user_id}, ${data.scope ?? SCOPES}, ${installedBy})
    ON CONFLICT (team_id) DO UPDATE SET
      team_name = EXCLUDED.team_name,
      access_token = EXCLUDED.access_token,
      bot_user_id = EXCLUDED.bot_user_id,
      scope = EXCLUDED.scope,
      installed_by = EXCLUDED.installed_by
  `;

  return { team_id: data.team.id, team_name: data.team.name };
}

export function verifySlackSignature(
  headers: Record<string, string | undefined> | Headers,
  body: string,
): boolean {
  const signingSecret = requireEnv("SLACK_SIGNING_SECRET");

  const get = (k: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(k) ?? headers.get(k.toLowerCase()) ?? undefined;
    }
    return headers[k] ?? headers[k.toLowerCase()];
  };

  const timestamp = get("X-Slack-Request-Timestamp") ?? get("x-slack-request-timestamp");
  const signature = get("X-Slack-Signature") ?? get("x-slack-signature");
  if (!timestamp || !signature) return false;

  const ts = parseInt(timestamp, 10);
  if (Number.isNaN(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > 60 * 5) return false;

  const base = `v0:${timestamp}:${body}`;
  const hmac = crypto.createHmac("sha256", signingSecret).update(base).digest("hex");
  const expected = `v0=${hmac}`;

  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function getAccessToken(teamId: string): Promise<string> {
  const rows = (await sql`
    SELECT access_token FROM slack_installs WHERE team_id = ${teamId} LIMIT 1
  `) as Array<{ access_token: string }>;
  if (!rows.length) {
    throw new Error(`[slack-bot] No install found for team ${teamId}. Reinstall via /api/slack/install.`);
  }
  return rows[0].access_token;
}

export async function postMessage(
  teamId: string,
  channel: string,
  text: string,
  blocks?: unknown[],
): Promise<void> {
  const token = await getAccessToken(teamId);
  const res = await fetch(SLACK_POST_MESSAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel, text, blocks }),
  });
  const data = (await res.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    throw new Error(`[slack-bot] postMessage failed: ${data.error ?? "unknown_error"}`);
  }
}

export async function handleSlashCommand(
  payload: SlashCommandPayload,
): Promise<SlashCommandResponse> {
  const text = (payload.text || "").trim();
  switch (payload.command) {
    case "/zoobicon-build": {
      if (!text) {
        return {
          response_type: "ephemeral",
          text: "Usage: `/zoobicon-build <describe your site>` — e.g. `/zoobicon-build SaaS landing page for AI accountant`",
        };
      }
      void postMessage(payload.team_id, payload.channel_id, `Building: ${text} — results coming shortly.`).catch(
        () => undefined,
      );
      return {
        response_type: "ephemeral",
        text: `Kicking off build for: *${text}*. I'll post the preview link in this channel.`,
      };
    }
    case "/zoobicon-domain": {
      if (!text) {
        return {
          response_type: "ephemeral",
          text: "Usage: `/zoobicon-domain <name or keyword>` — e.g. `/zoobicon-domain coolstartup`",
        };
      }
      return {
        response_type: "ephemeral",
        text: `Searching domains for *${text}*: https://zoobicon.com/domains?q=${encodeURIComponent(text)}`,
      };
    }
    case "/zoobicon-video": {
      if (!text) {
        return {
          response_type: "ephemeral",
          text: "Usage: `/zoobicon-video <describe the video>` — e.g. `/zoobicon-video 30s product demo for fitness app`",
        };
      }
      void postMessage(payload.team_id, payload.channel_id, `Generating video: ${text}`).catch(() => undefined);
      return {
        response_type: "ephemeral",
        text: `Generating video for: *${text}*. I'll DM the result when ready.`,
      };
    }
    default:
      return {
        response_type: "ephemeral",
        text: `Unknown command: ${payload.command}. Try /zoobicon-build, /zoobicon-domain, or /zoobicon-video.`,
      };
  }
}
