import { NextRequest, NextResponse } from 'next/server';
import {
  verifyDiscordSignature,
  handleInteraction,
  type DiscordInteraction,
} from '@/lib/discord-bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json(
      {
        error:
          'Discord integration not configured. Set DISCORD_PUBLIC_KEY in Vercel environment variables.',
      },
      { status: 500 },
    );
  }

  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');

  if (!signature || !timestamp) {
    return NextResponse.json(
      { error: 'Missing signature headers' },
      { status: 401 },
    );
  }

  const rawBody = await req.text();

  const valid = await verifyDiscordSignature(
    signature,
    timestamp,
    rawBody,
    publicKey,
  );
  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid request signature' },
      { status: 401 },
    );
  }

  let interaction: DiscordInteraction;
  try {
    interaction = JSON.parse(rawBody) as DiscordInteraction;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const response = handleInteraction(interaction);
  return NextResponse.json(response);
}
