import { NextRequest, NextResponse } from 'next/server';
import { getS3Config, deleteObject, S3NotConfiguredError, S3_ENV_VARS } from '@/lib/storage-s3';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
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
    const body = (await req.json()) as { key?: unknown };
    if (typeof body.key !== 'string' || body.key.length === 0) {
      return NextResponse.json({ error: 'Missing "key" in request body' }, { status: 400 });
    }
    const result = await deleteObject(body.key);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof S3NotConfiguredError) {
      return NextResponse.json(
        { error: err.message, hint: `Required env vars: ${S3_ENV_VARS.join(', ')}` },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
