import { sql } from "./db";

export type SocialPlatform =
  | "twitter"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "threads"
  | "bluesky"
  | "mastodon";

export interface SchedulePostInput {
  userId: string;
  platforms: SocialPlatform[];
  content: string;
  mediaUrl?: string;
  scheduledFor: string; // ISO
}

export interface SocialPostRow {
  id: string;
  user_id: string;
  platforms: SocialPlatform[];
  content: string;
  media_url: string | null;
  scheduled_for: string;
  status: string;
  results: Record<string, PlatformResult> | null;
  created_at: string;
}

export interface PlatformResult {
  ok: boolean;
  status: number;
  message: string;
  hint?: string;
  externalId?: string;
}

let schemaReady = false;
async function ensureSchema(): Promise<void> {
  if (schemaReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS social_posts (
      id text PRIMARY KEY,
      user_id text NOT NULL,
      platforms jsonb NOT NULL,
      content text NOT NULL,
      media_url text,
      scheduled_for timestamptz NOT NULL,
      status text NOT NULL DEFAULT 'scheduled',
      results jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  schemaReady = true;
}

function newId(): string {
  return `sp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function schedulePost(input: SchedulePostInput): Promise<SocialPostRow> {
  if (!input.userId) throw new Error("userId is required");
  if (!Array.isArray(input.platforms) || input.platforms.length === 0) {
    throw new Error("At least one platform is required");
  }
  if (!input.content || input.content.trim().length === 0) {
    throw new Error("content is required");
  }
  if (!input.scheduledFor) throw new Error("scheduledFor (ISO timestamp) is required");
  await ensureSchema();
  const id = newId();
  const rows = (await sql`
    INSERT INTO social_posts (id, user_id, platforms, content, media_url, scheduled_for, status)
    VALUES (${id}, ${input.userId}, ${JSON.stringify(input.platforms)}::jsonb, ${input.content}, ${input.mediaUrl ?? null}, ${input.scheduledFor}, 'scheduled')
    RETURNING *
  `) as unknown as SocialPostRow[];
  return rows[0];
}

export async function listScheduled(userId: string): Promise<SocialPostRow[]> {
  if (!userId) throw new Error("userId is required");
  await ensureSchema();
  const rows = (await sql`
    SELECT * FROM social_posts WHERE user_id = ${userId} ORDER BY scheduled_for ASC
  `) as unknown as SocialPostRow[];
  return rows;
}

export async function cancelPost(id: string): Promise<SocialPostRow | null> {
  if (!id) throw new Error("id is required");
  await ensureSchema();
  const rows = (await sql`
    UPDATE social_posts SET status = 'cancelled' WHERE id = ${id} RETURNING *
  `) as unknown as SocialPostRow[];
  return rows[0] ?? null;
}

interface PlatformDispatcher {
  envVar: string;
  hint: string;
  send: (token: string, content: string, mediaUrl: string | null) => Promise<PlatformResult>;
}

async function postJson(
  url: string,
  token: string,
  body: Record<string, unknown>,
  authScheme: string = "Bearer"
): Promise<PlatformResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `${authScheme} ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let externalId: string | undefined;
    try {
      const parsed = JSON.parse(text) as { id?: string; uri?: string; data?: { id?: string } };
      externalId = parsed.id ?? parsed.uri ?? parsed.data?.id;
    } catch {
      /* not JSON */
    }
    return {
      ok: res.ok,
      status: res.status,
      message: res.ok ? "posted" : `upstream error: ${text.slice(0, 200)}`,
      externalId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "network error";
    return { ok: false, status: 0, message };
  }
}

const DISPATCHERS: Record<SocialPlatform, PlatformDispatcher> = {
  twitter: {
    envVar: "TWITTER_BEARER_TOKEN",
    hint: "Set TWITTER_BEARER_TOKEN in Vercel env (X API v2 OAuth2 user token).",
    send: (token, content) =>
      postJson("https://api.twitter.com/2/tweets", token, { text: content }),
  },
  linkedin: {
    envVar: "LINKEDIN_TOKEN",
    hint: "Set LINKEDIN_TOKEN (OAuth2 access token with w_member_social scope).",
    send: (token, content) =>
      postJson("https://api.linkedin.com/v2/ugcPosts", token, {
        author: "urn:li:person:me",
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: content },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
  },
  facebook: {
    envVar: "FACEBOOK_PAGE_TOKEN",
    hint: "Set FACEBOOK_PAGE_TOKEN (Page access token) and FACEBOOK_PAGE_ID.",
    send: async (token, content) => {
      const pageId = process.env.FACEBOOK_PAGE_ID;
      if (!pageId) {
        return {
          ok: false,
          status: 503,
          message: "FACEBOOK_PAGE_ID missing",
          hint: "Set FACEBOOK_PAGE_ID in env",
        };
      }
      return postJson(
        `https://graph.facebook.com/v19.0/${pageId}/feed?access_token=${encodeURIComponent(token)}`,
        token,
        { message: content }
      );
    },
  },
  instagram: {
    envVar: "INSTAGRAM_TOKEN",
    hint: "Set INSTAGRAM_TOKEN and INSTAGRAM_USER_ID (Graph API).",
    send: async (token, content, mediaUrl) => {
      const userId = process.env.INSTAGRAM_USER_ID;
      if (!userId) {
        return { ok: false, status: 503, message: "INSTAGRAM_USER_ID missing", hint: "Set INSTAGRAM_USER_ID" };
      }
      if (!mediaUrl) {
        return { ok: false, status: 400, message: "Instagram requires mediaUrl" };
      }
      return postJson(
        `https://graph.facebook.com/v19.0/${userId}/media?access_token=${encodeURIComponent(token)}`,
        token,
        { image_url: mediaUrl, caption: content }
      );
    },
  },
  threads: {
    envVar: "THREADS_TOKEN",
    hint: "Set THREADS_TOKEN and THREADS_USER_ID (Threads Graph API).",
    send: async (token, content) => {
      const userId = process.env.THREADS_USER_ID;
      if (!userId) {
        return { ok: false, status: 503, message: "THREADS_USER_ID missing", hint: "Set THREADS_USER_ID" };
      }
      return postJson(
        `https://graph.threads.net/v1.0/${userId}/threads?access_token=${encodeURIComponent(token)}`,
        token,
        { media_type: "TEXT", text: content }
      );
    },
  },
  bluesky: {
    envVar: "BLUESKY_TOKEN",
    hint: "Set BLUESKY_TOKEN (app password JWT) and BLUESKY_DID.",
    send: async (token, content) => {
      const did = process.env.BLUESKY_DID;
      if (!did) {
        return { ok: false, status: 503, message: "BLUESKY_DID missing", hint: "Set BLUESKY_DID" };
      }
      return postJson(
        "https://bsky.social/xrpc/com.atproto.repo.createRecord",
        token,
        {
          repo: did,
          collection: "app.bsky.feed.post",
          record: { text: content, createdAt: new Date().toISOString() },
        }
      );
    },
  },
  mastodon: {
    envVar: "MASTODON_TOKEN",
    hint: "Set MASTODON_TOKEN and MASTODON_INSTANCE (e.g. mastodon.social).",
    send: async (token, content) => {
      const instance = process.env.MASTODON_INSTANCE ?? "mastodon.social";
      return postJson(`https://${instance}/api/v1/statuses`, token, { status: content });
    },
  },
};

export async function publishNow(postId: string): Promise<SocialPostRow> {
  if (!postId) throw new Error("postId is required");
  await ensureSchema();
  const rows = (await sql`SELECT * FROM social_posts WHERE id = ${postId}`) as unknown as SocialPostRow[];
  const post = rows[0];
  if (!post) throw new Error(`Post ${postId} not found`);
  if (post.status === "cancelled") throw new Error("Post is cancelled");

  const platforms = post.platforms;
  const results: Record<string, PlatformResult> = {};
  for (const platform of platforms) {
    const dispatcher = DISPATCHERS[platform];
    if (!dispatcher) {
      results[platform] = { ok: false, status: 400, message: `Unknown platform: ${platform}` };
      continue;
    }
    const token = process.env[dispatcher.envVar];
    if (!token) {
      results[platform] = {
        ok: false,
        status: 503,
        message: `${dispatcher.envVar} not set`,
        hint: dispatcher.hint,
      };
      continue;
    }
    results[platform] = await dispatcher.send(token, post.content, post.media_url);
  }

  const allOk = Object.values(results).every((r) => r.ok);
  const status = allOk ? "published" : "partial";
  const updated = (await sql`
    UPDATE social_posts SET status = ${status}, results = ${JSON.stringify(results)}::jsonb
    WHERE id = ${postId}
    RETURNING *
  `) as unknown as SocialPostRow[];
  return updated[0];
}

interface AnthropicMessageResponse {
  content: Array<{ type: string; text?: string }>;
}

export async function suggestHashtags(content: string, platform: SocialPlatform): Promise<string[]> {
  if (!content) throw new Error("content is required");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set — required for hashtag suggestions");
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Suggest 8 trending, relevant hashtags for this ${platform} post. Return ONLY a JSON array of strings, each starting with #. No prose.\n\nPost:\n${content}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as AnthropicMessageResponse;
  const text = data.content.find((b) => b.type === "text")?.text ?? "[]";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}
