import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface SiteFile {
  path: string;
  content: string;
}

interface CompleteBody {
  userId?: string;
  chosenDomain?: string;
  siteFiles?: Record<string, string> | SiteFile[];
  contactEmail?: string;
}

interface CompleteResult {
  success: boolean;
  steps?: Record<string, unknown>;
  domain?: string;
  siteUrl?: string;
  mailbox?: string;
  error?: string;
}

interface DomainHookModule {
  completeSignupFlow: (input: {
    userId: string;
    chosenDomain: string;
    siteFiles: Record<string, string> | SiteFile[];
    contactEmail: string;
  }) => Promise<CompleteResult>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: CompleteBody;
  try {
    body = (await req.json()) as CompleteBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { userId, chosenDomain, siteFiles, contactEmail } = body;
  if (!userId || !chosenDomain || !siteFiles || !contactEmail) {
    return NextResponse.json(
      {
        error:
          'Missing required fields. Need: userId, chosenDomain, siteFiles, contactEmail',
      },
      { status: 400 }
    );
  }

  try {
    const mod = (await import('@/lib/domain-hook')) as unknown as DomainHookModule;
    if (typeof mod.completeSignupFlow !== 'function') {
      return NextResponse.json(
        { error: 'domain-hook.completeSignupFlow is not available on the server' },
        { status: 500 }
      );
    }
    const result = await mod.completeSignupFlow({
      userId,
      chosenDomain,
      siteFiles,
      contactEmail,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      { error: `Signup flow failed: ${message}` },
      { status: 500 }
    );
  }
}
