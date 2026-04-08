import { NextRequest, NextResponse } from 'next/server';
import { convertImageToSite, ConvertImageOptions } from '@/lib/image-to-site';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 503 }
    );
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let imageBase64 = '';
    let mimeType = 'image/png';
    const options: ConvertImageOptions = {};

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const file = form.get('image');
      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Missing image file field' }, { status: 400 });
      }
      const buf = Buffer.from(await file.arrayBuffer());
      imageBase64 = buf.toString('base64');
      mimeType = file.type || 'image/png';
      const notes = form.get('notes');
      const brandName = form.get('brandName');
      if (typeof notes === 'string') options.notes = notes;
      if (typeof brandName === 'string') options.brandName = brandName;
    } else {
      const body = (await req.json()) as {
        imageBase64?: string;
        mimeType?: string;
        notes?: string;
        brandName?: string;
      };
      if (!body.imageBase64) {
        return NextResponse.json({ error: 'Missing imageBase64' }, { status: 400 });
      }
      imageBase64 = body.imageBase64;
      mimeType = body.mimeType || 'image/png';
      if (body.notes) options.notes = body.notes;
      if (body.brandName) options.brandName = body.brandName;
    }

    const result = await convertImageToSite(imageBase64, mimeType, options);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
