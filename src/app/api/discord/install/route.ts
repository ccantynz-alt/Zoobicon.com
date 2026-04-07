import { NextResponse } from 'next/server';
import { getInstallUrl } from '@/lib/discord-bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const url = getInstallUrl();
    return NextResponse.redirect(url, 302);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Discord install URL unavailable';
    return NextResponse.json(
      {
        error: message,
        hint: 'Set DISCORD_CLIENT_ID in Vercel environment variables.',
      },
      { status: 500 },
    );
  }
}
