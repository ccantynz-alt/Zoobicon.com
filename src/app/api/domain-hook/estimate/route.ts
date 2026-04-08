import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface EstimateResult {
  domain?: string;
  total?: number;
  currency?: string;
  breakdown?: Record<string, number>;
}

interface DomainHookModule {
  estimateFlowCost: (domain: string) => Promise<EstimateResult> | EstimateResult;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const domain = req.nextUrl.searchParams.get('domain');
  if (!domain) {
    return NextResponse.json(
      { error: 'Missing required query parameter: domain' },
      { status: 400 }
    );
  }

  try {
    const mod = (await import('@/lib/domain-hook')) as unknown as DomainHookModule;
    if (typeof mod.estimateFlowCost !== 'function') {
      return NextResponse.json(
        { error: 'domain-hook.estimateFlowCost is not available on the server' },
        { status: 500 }
      );
    }
    const estimate = await mod.estimateFlowCost(domain);
    return NextResponse.json(estimate);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      { error: `Failed to estimate cost: ${message}` },
      { status: 500 }
    );
  }
}
