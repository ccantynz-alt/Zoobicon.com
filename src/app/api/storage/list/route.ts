import { NextRequest, NextResponse } from 'next/server';
import { getS3Config, listObjects, S3NotConfiguredError, S3_ENV_VARS } from '@/lib/storage-s3';

export const runtime = 'nodejs';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!getS3Config()) {
    return NextResponse.json(
      {
        error: 'S3 storage not configured',
        hint: `Set the following environment variables in Vercel: ${S3_ENV_VARS.join(', ')}`,
      },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get('prefix') || '';
    const maxKeysRaw = searchParams.get('maxKeys');
    const maxKeys = maxKeysRaw ? Math.min(1000, Math.max(1, Number(maxKeysRaw))) : 100;
    const result = await listObjects(prefix, maxKeys);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof S3NotConfiguredError) {
      return NextResponse.json(
        { error: err.message, hint: `Required env vars: ${S3_ENV_VARS.join(', ')}` },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : 'List failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
