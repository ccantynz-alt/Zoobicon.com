/**
 * Discord bot integration for Zoobicon.
 * Ed25519 signature verification via Node 18+ Web Crypto (crypto.subtle).
 */

export interface DiscordInteractionData {
  name?: string;
  options?: Array<{ name: string; value: string | number | boolean }>;
}

export interface DiscordInteraction {
  type: number;
  id?: string;
  token?: string;
  data?: DiscordInteractionData;
}

export interface DiscordInteractionResponse {
  type: number;
  data?: {
    content: string;
    flags?: number;
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[discord-bot] Missing required env var: ${name}. ` +
        `Set ${name} in Vercel → Environment Variables before using Discord integration.`,
    );
  }
  return value;
}

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('[discord-bot] Invalid hex string length');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Verify a Discord interaction signature using Ed25519.
 * Requires Node 18+ which exposes Ed25519 in Web Crypto via crypto.subtle.
 */
export async function verifyDiscordSignature(
  signature: string,
  timestamp: string,
  body: string,
  publicKey: string,
): Promise<boolean> {
  if (!signature || !timestamp || !body || !publicKey) {
    return false;
  }

  try {
    const subtle = (globalThis.crypto as Crypto | undefined)?.subtle;
    if (!subtle) {
      throw new Error(
        '[discord-bot] crypto.subtle unavailable. Requires Node 18+ runtime.',
      );
    }

    const sigBytes = hexToUint8Array(signature);
    const keyBytes = hexToUint8Array(publicKey);
    const messageBytes = new TextEncoder().encode(timestamp + body);

    const cryptoKey = await subtle.importKey(
      'raw',
      keyBytes,
      { name: 'Ed25519' },
      false,
      ['verify'],
    );

    return await subtle.verify('Ed25519', cryptoKey, sigBytes, messageBytes);
  } catch (err) {
    console.warn('[discord-bot] Signature verification failed:', err);
    return false;
  }
}

/**
 * Build the Discord OAuth install URL for adding the bot to a server.
 * Default permissions 2048 = SEND_MESSAGES.
 */
export function getInstallUrl(
  scopes: string[] = ['bot', 'applications.commands'],
): string {
  const clientId = requireEnv('DISCORD_CLIENT_ID');
  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes.join(' '),
    permissions: '2048',
  });
  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

const INTERACTION_TYPE_PING = 1;
const INTERACTION_TYPE_APPLICATION_COMMAND = 2;
const RESPONSE_TYPE_PONG = 1;
const RESPONSE_TYPE_CHANNEL_MESSAGE = 4;

function commandReply(content: string): DiscordInteractionResponse {
  return {
    type: RESPONSE_TYPE_CHANNEL_MESSAGE,
    data: { content },
  };
}

/**
 * Route a verified Discord interaction to the appropriate handler.
 */
export function handleInteraction(
  interaction: DiscordInteraction,
): DiscordInteractionResponse {
  if (interaction.type === INTERACTION_TYPE_PING) {
    return { type: RESPONSE_TYPE_PONG };
  }

  if (interaction.type === INTERACTION_TYPE_APPLICATION_COMMAND) {
    const name = interaction.data?.name ?? '';
    const options = interaction.data?.options ?? [];
    const firstOption = options[0]?.value;
    const arg = typeof firstOption === 'string' ? firstOption : '';

    switch (name) {
      case 'zoobicon-build':
        return commandReply(
          arg
            ? `Building site for: **${arg}**\nVisit https://zoobicon.com/builder to watch live.`
            : 'Usage: `/zoobicon-build <prompt>` — describe the site you want.',
        );
      case 'zoobicon-domain':
        return commandReply(
          arg
            ? `Searching domains for: **${arg}**\nResults: https://zoobicon.com/domains?q=${encodeURIComponent(arg)}`
            : 'Usage: `/zoobicon-domain <name>` — check domain availability.',
        );
      case 'zoobicon-video':
        return commandReply(
          arg
            ? `Generating video for: **${arg}**\nTrack progress at https://zoobicon.com/video-creator`
            : 'Usage: `/zoobicon-video <prompt>` — generate an AI video.',
        );
      default:
        return commandReply(
          `Unknown command: \`/${name}\`. Try \`/zoobicon-build\`, \`/zoobicon-domain\`, or \`/zoobicon-video\`.`,
        );
    }
  }

  return commandReply('Unsupported interaction type.');
}

/**
 * Post a message to a Discord channel via the bot token.
 */
export async function postMessage(
  channelId: string,
  content: string,
  botToken?: string,
): Promise<{ ok: boolean; status: number; error?: string }> {
  const token = botToken ?? requireEnv('DISCORD_BOT_TOKEN');
  if (!channelId) {
    return { ok: false, status: 400, error: 'channelId required' };
  }

  try {
    const res = await fetch(
      `https://discord.com/api/v10/channels/${encodeURIComponent(channelId)}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      },
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: text };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return {
      ok: false,
      status: 500,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
