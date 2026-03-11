import { createHmac, timingSafeEqual } from "crypto";

// --- Slack Request Verification ---

async function verifySlackRequest(
  request: Request,
  rawBody: string
): Promise<boolean> {
  const secret = process.env.SLACK_SIGNING_SECRET;
  if (!secret) {
    console.warn("[Slack] SLACK_SIGNING_SECRET not set — skipping verification");
    return true; // allow in dev, but log warning
  }

  const timestamp = request.headers.get("x-slack-request-timestamp");
  const signature = request.headers.get("x-slack-signature");

  if (!timestamp || !signature) return false;

  // Reject requests older than 5 minutes (replay attack protection)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

  const sigBasestring = `v0:${timestamp}:${rawBody}`;
  const hmac = createHmac("sha256", secret).update(sigBasestring).digest("hex");
  const expected = `v0=${hmac}`;

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// --- Main POST handler ---

export async function POST(request: Request) {
  const rawBody = await request.text();

  // Verify request authenticity
  const isValid = await verifySlackRequest(request, rawBody);
  if (!isValid) {
    console.error("[Slack] Invalid request signature — rejecting");
    return new Response("Unauthorized", { status: 401 });
  }

  const body = JSON.parse(rawBody);

  // Slack URL verification challenge
  if (body.type === "url_verification") {
    return new Response(body.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Handle event callbacks
  if (body.type === "event_callback") {
    const event = body.event;

    // Ignore bot messages to prevent loops
    if (event?.bot_id || event?.subtype === "bot_message") {
      return new Response("ok", { status: 200 });
    }

    switch (event?.type) {
      case "message": {
        const { channel, user, text, ts } = event;
        console.log(`[Slack] message in #${channel} from ${user}: ${text}`);
        await handleChannelMessage({ channel, user, text, ts });
        break;
      }

      case "app_mention": {
        const { channel, user, text, ts } = event;
        console.log(`[Slack] app_mention in #${channel} from ${user}: ${text}`);
        await handleAppMention({ channel, user, text, ts });
        break;
      }

      case "reaction_added": {
        const { reaction, user, item } = event;
        console.log(`[Slack] reaction :${reaction}: by ${user} on ${item?.ts}`);
        await handleReactionAdded({ reaction, user, item });
        break;
      }

      default:
        console.log(`[Slack] unhandled event type: ${event?.type}`);
    }

    return new Response("ok", { status: 200 });
  }

  return new Response("ok", { status: 200 });
}

// --- Types ---

interface SlackMessage {
  channel: string;
  user: string;
  text: string;
  ts: string;
}

interface SlackReaction {
  reaction: string;
  user: string;
  item: { type: string; channel: string; ts: string };
}

// --- Slack API Helpers ---

async function postSlackMessage(channel: string, text: string, thread_ts?: string) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.error("[Slack] SLACK_BOT_TOKEN is not set");
    return null;
  }

  const payload: Record<string, string> = { channel, text };
  if (thread_ts) payload.thread_ts = thread_ts;

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error("[Slack] postMessage error:", data.error);
  }
  return data;
}

async function addReaction(channel: string, timestamp: string, emoji: string) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return;

  await fetch("https://slack.com/api/reactions.add", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel, timestamp, name: emoji }),
  });
}

// --- Command Parser ---

function parseCommand(text: string): { command: string; args: string } {
  // Strip the bot mention from text (e.g., "<@U123> status" → "status")
  const cleaned = text.replace(/<@[A-Z0-9]+>/g, "").trim().toLowerCase();
  const spaceIndex = cleaned.indexOf(" ");
  if (spaceIndex === -1) {
    return { command: cleaned, args: "" };
  }
  return {
    command: cleaned.substring(0, spaceIndex),
    args: cleaned.substring(spaceIndex + 1).trim(),
  };
}

// --- Event Handlers ---

async function handleChannelMessage({ channel, user, text, ts }: SlackMessage) {
  if (!text) return;

  const lower = text.toLowerCase();

  // Respond to greetings in channels
  if (/^(hi|hello|hey)\b/i.test(lower)) {
    await postSlackMessage(
      channel,
      `Hey <@${user}>! I'm the Zoobicon bot. Mention me with a command to get started — try \`@Zoobicon help\``,
      ts
    );
  }
}

async function handleAppMention({ channel, user, text, ts }: SlackMessage) {
  const { command, args } = parseCommand(text);

  switch (command) {
    case "help":
      await postSlackMessage(
        channel,
        [
          `*Zoobicon Bot Commands*`,
          "",
          "`@Zoobicon help` — Show this help message",
          "`@Zoobicon status` — Platform status check",
          "`@Zoobicon build <prompt>` — Start an AI website build",
          "`@Zoobicon sites <email>` — List sites for an email",
          "`@Zoobicon info` — About Zoobicon",
          "",
          "Visit https://zoobicon.com/builder to use the full builder.",
        ].join("\n"),
        ts
      );
      break;

    case "status":
      await handleStatusCommand(channel, ts);
      break;

    case "build":
      await handleBuildCommand(channel, user, args, ts);
      break;

    case "sites":
      await handleSitesCommand(channel, args, ts);
      break;

    case "info":
      await postSlackMessage(
        channel,
        [
          "*Zoobicon* — AI Website Builder",
          "",
          "Build production-ready websites in seconds with our 10-agent AI pipeline.",
          "Powered by Claude Opus, with support for GPT-4o and Gemini.",
          "",
          "https://zoobicon.com",
        ].join("\n"),
        ts
      );
      break;

    default:
      await postSlackMessage(
        channel,
        `Hey <@${user}>! I didn't recognize that command. Try \`@Zoobicon help\` to see what I can do.`,
        ts
      );
  }
}

async function handleReactionAdded({ reaction, user, item }: SlackReaction) {
  // Track specific reactions for engagement signals
  if (reaction === "rocket" || reaction === "fire" || reaction === "star") {
    console.log(
      `[Slack] Positive reaction :${reaction}: from ${user} on message ${item?.ts} in ${item?.channel}`
    );
    // Could log to analytics/DB in the future
  }

  // Auto-acknowledge bug reports
  if (reaction === "bug") {
    await postSlackMessage(
      item.channel,
      `Bug report noted from <@${user}>! Our team has been notified.`,
      item.ts
    );
  }
}

// --- Command Implementations ---

async function handleStatusCommand(channel: string, thread_ts: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zoobicon.com";

  // Check API health
  let apiStatus = "unknown";
  try {
    const res = await fetch(`${appUrl}/api/hosting/sites?email=healthcheck@zoobicon.com`, {
      signal: AbortSignal.timeout(5000),
    });
    apiStatus = res.ok ? "operational" : "degraded";
  } catch {
    apiStatus = "unreachable";
  }

  // Check if AI keys are configured
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGoogle = !!process.env.GOOGLE_AI_API_KEY;
  const hasDB = !!process.env.DATABASE_URL;

  const statusEmoji: Record<string, string> = {
    operational: ":large_green_circle:",
    degraded: ":large_yellow_circle:",
    unreachable: ":red_circle:",
    unknown: ":white_circle:",
  };

  await postSlackMessage(
    channel,
    [
      "*Zoobicon Platform Status*",
      "",
      `${statusEmoji[apiStatus]} API: ${apiStatus}`,
      `${hasDB ? ":large_green_circle:" : ":red_circle:"} Database: ${hasDB ? "connected" : "not configured"}`,
      `${hasAnthropic ? ":large_green_circle:" : ":red_circle:"} Claude AI: ${hasAnthropic ? "ready" : "no key"}`,
      `${hasOpenAI ? ":large_green_circle:" : ":white_circle:"} OpenAI: ${hasOpenAI ? "ready" : "not configured"}`,
      `${hasGoogle ? ":large_green_circle:" : ":white_circle:"} Google AI: ${hasGoogle ? "ready" : "not configured"}`,
    ].join("\n"),
    thread_ts
  );
}

async function handleBuildCommand(
  channel: string,
  user: string,
  prompt: string,
  thread_ts: string
) {
  if (!prompt) {
    await postSlackMessage(
      channel,
      `<@${user}> Please provide a prompt! Example: \`@Zoobicon build a modern portfolio site for a photographer\``,
      thread_ts
    );
    return;
  }

  await postSlackMessage(
    channel,
    [
      `<@${user}> Starting your build...`,
      "",
      `*Prompt:* ${prompt}`,
      "",
      `For the full interactive experience with live preview, visit:`,
      `https://zoobicon.com/builder`,
      "",
      `_Building via Slack gives you a direct link once complete._`,
    ].join("\n"),
    thread_ts
  );

  // Add a rocket reaction to acknowledge
  await addReaction(channel, thread_ts, "rocket");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zoobicon.com";

  try {
    const res = await fetch(`${appUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        tier: "premium",
      }),
      signal: AbortSignal.timeout(300000), // 5 minute timeout
    });

    if (!res.ok) {
      throw new Error(`Generation failed: ${res.status}`);
    }

    const data = await res.json();

    if (data.html) {
      // Deploy the generated site
      const deployRes = await fetch(`${appUrl}/api/hosting/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: prompt.substring(0, 50),
          email: `slack-${user}@zoobicon.com`,
          code: data.html,
        }),
      });

      if (deployRes.ok) {
        const deployData = await deployRes.json();
        await addReaction(channel, thread_ts, "white_check_mark");
        await postSlackMessage(
          channel,
          [
            `<@${user}> Your site is live!`,
            "",
            `*URL:* ${deployData.url}`,
            `*Edit:* https://zoobicon.com/edit/${deployData.siteSlug}`,
            "",
            `_Built with Zoobicon's 10-agent AI pipeline._`,
          ].join("\n"),
          thread_ts
        );
      } else {
        throw new Error("Deploy failed");
      }
    } else {
      throw new Error("No HTML generated");
    }
  } catch (error) {
    console.error("[Slack] Build command error:", error);
    await addReaction(channel, thread_ts, "x");
    await postSlackMessage(
      channel,
      `<@${user}> Build failed — try the full builder at https://zoobicon.com/builder for a better experience.`,
      thread_ts
    );
  }
}

async function handleSitesCommand(
  channel: string,
  email: string,
  thread_ts: string
) {
  if (!email || !email.includes("@")) {
    await postSlackMessage(
      channel,
      `Please provide an email: \`@Zoobicon sites user@example.com\``,
      thread_ts
    );
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zoobicon.com";

  try {
    const res = await fetch(
      `${appUrl}/api/hosting/sites?email=${encodeURIComponent(email)}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const sites = data.sites || [];

    if (sites.length === 0) {
      await postSlackMessage(
        channel,
        `No sites found for \`${email}\`. Build one at https://zoobicon.com/builder`,
        thread_ts
      );
      return;
    }

    const siteList = sites
      .slice(0, 10) // max 10 in Slack message
      .map(
        (s: { name: string; slug: string; status: string }, i: number) =>
          `${i + 1}. *${s.name || s.slug}* — \`${s.slug}.zoobicon.sh\` (${s.status})`
      )
      .join("\n");

    await postSlackMessage(
      channel,
      [
        `*Sites for ${email}:*`,
        "",
        siteList,
        sites.length > 10 ? `\n_...and ${sites.length - 10} more_` : "",
      ].join("\n"),
      thread_ts
    );
  } catch (error) {
    console.error("[Slack] Sites command error:", error);
    await postSlackMessage(
      channel,
      `Could not fetch sites. Make sure the email is correct and try again.`,
      thread_ts
    );
  }
}

// Health check endpoint
export async function GET() {
  return new Response("Slack events endpoint is active", { status: 200 });
}
