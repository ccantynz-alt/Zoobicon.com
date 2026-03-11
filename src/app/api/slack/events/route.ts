export async function POST(request: Request) {
  const body = await request.json();

  // Slack URL verification challenge — respond with plain text
  if (body.type === "url_verification") {
    return new Response(body.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Handle event callbacks
  if (body.type === "event_callback") {
    const event = body.event;

    switch (event?.type) {
      case "message": {
        // message.channels — messages posted in public channels
        const { channel, user, text, ts } = event;
        console.log(`[Slack] message in #${channel} from ${user}: ${text}`);
        await handleChannelMessage({ channel, user, text, ts });
        break;
      }

      case "app_mention": {
        // app_mention — when the bot is @mentioned
        const { channel, user, text, ts } = event;
        console.log(`[Slack] app_mention in #${channel} from ${user}: ${text}`);
        await handleAppMention({ channel, user, text, ts });
        break;
      }

      case "reaction_added": {
        // reaction_added — when a reaction emoji is added to a message
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

// --- Event Handlers ---

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

async function postSlackMessage(channel: string, text: string) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.error("[Slack] SLACK_BOT_TOKEN is not set");
    return;
  }
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel, text }),
  });
}

async function handleChannelMessage({ channel, user, text, ts }: SlackMessage) {
  // TODO: Add your channel message logic here
  // Example: log to DB, trigger workflows, etc.
}

async function handleAppMention({ channel, user, text, ts }: SlackMessage) {
  // Respond when the bot is @mentioned
  await postSlackMessage(channel, `Hey <@${user}>! 👋 How can I help?`);
}

async function handleReactionAdded({ reaction, user, item }: SlackReaction) {
  // TODO: Add your reaction logic here
  // Example: track reactions for analytics, trigger actions on specific emojis
}

// Allow GET for health checks
export async function GET() {
  return new Response("Slack events endpoint is active", { status: 200 });
}
