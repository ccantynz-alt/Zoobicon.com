import { NextRequest, NextResponse } from 'next/server';
import { checkMxRecords, checkSpfRecord, checkDmarcRecord, checkDkim } from '@/lib/email-validator';

export const maxDuration = 30;
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const domain = typeof body?.domain === 'string' ? body.domain.trim().toLowerCase() : '';
    const selector = typeof body?.selector === 'string' ? body.selector : 'default';
    if (!domain) {
      return NextResponse.json({ error: 'Missing domain' }, { status: 400 });
    }

    const [mxR, spfR, dmarcR, dkimR] = await Promise.allSettled([
      checkMxRecords(domain),
      checkSpfRecord(domain),
      checkDmarcRecord(domain, ),
      checkDkim(domain, selector),
    ]);

    return NextResponse.json({
      domain,
      mx: mxR.status === 'fulfilled' ? mxR.value : { ok: false, records: [] },
      spf: spfR.status === 'fulfilled' ? spfR.value : { ok: false },
      dmarc: dmarcR.status === 'fulfilled' ? dmarcR.value : { ok: false },
      dkim: dkimR.status === 'fulfilled' ? dkimR.value : { ok: false },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'DNS check failed' },
      { status: 500 }
    );
  }
}
