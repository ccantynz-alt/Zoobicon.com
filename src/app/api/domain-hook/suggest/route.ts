import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface SuggestBody {
  businessName?: string;
  industry?: string;
  description?: string;
}

interface DomainSuggestion {
  domain: string;
  available?: boolean;
  price?: number;
  tld?: string;
}

interface DomainHookModule {
  suggestDomains: (input: {
    businessName: string;
    industry?: string;
    description?: string;
  }) => Promise<DomainSuggestion[]>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: SuggestBody;
  try {
    body = (await req.json()) as SuggestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { businessName, industry, description } = body;
  if (!businessName || typeof businessName !== 'string') {
    return NextResponse.json(
      { error: 'businessName is required (string)' },
      { status: 400 }
    );
  }

  try {
    const mod = (await import('@/lib/domain-hook')) as unknown as DomainHookModule;
    if (typeof mod.suggestDomains !== 'function') {
      return NextResponse.json(
        { error: 'domain-hook.suggestDomains is not available on the server' },
        { status: 500 }
      );
    }
    const suggestions = await mod.suggestDomains({ businessName, industry, description });
    return NextResponse.json({ suggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      { error: `Failed to suggest domains: ${message}` },
      { status: 500 }
    );
  }
}
