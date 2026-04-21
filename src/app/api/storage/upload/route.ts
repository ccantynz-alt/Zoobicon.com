import { NextRequest, NextResponse } from 'next/server';
import { getS3Config, uploadObject, S3NotConfiguredError, S3_ENV_VARS } from '@/lib/storage-s3';

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
    const form = await req.formData();
    const file = form.get('file');
    const keyField = form.get('key');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing "file" in multipart form' }, { status: 400 });
    }
    const key = typeof keyField === 'string' && keyField.length > 0 ? keyField : file.name;
    if (!key) {
      return NextResponse.json({ error: 'Missing "key" and file has no name' }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || 'application/octet-stream';
    const result = await uploadObject(key, buf, contentType);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof S3NotConfiguredError) {
      return NextResponse.json(
        { error: err.message, hint: `Required env vars: ${S3_ENV_VARS.join(', ')}` },
        { status: 503 }
      );
    }
    const message = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
