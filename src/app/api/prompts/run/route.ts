import { NextRequest, NextResponse } from 'next/server';
import { runPrompt, getPrompt, estimateCost } from '@/lib/prompt-library';

interface RunBody {
  id?: string;
  variables?: Record<string, string | number>;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: RunBody;
  try {
    body = (await req.json()) as RunBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, variables } = body;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
  }

  const prompt = getPrompt(id);
  if (!prompt) {
    return NextResponse.json({ error: `Prompt not found: ${id}` }, { status: 404 });
  }

  try {
    const result = await runPrompt(id, variables ?? {});
    const cost = estimateCost(prompt.model, result.tokens.input, result.tokens.output);
    return NextResponse.json({
      text: result.text,
      tokens: result.tokens,
      cost: Number(cost.toFixed(6)),
    });
  } catch (err) {
    const error = err as Error & { status?: number };
    const status = error.status ?? 500;
    return NextResponse.json(
      {
        error: error.message || 'Failed to run prompt',
        hint:
          status === 503
            ? 'Set ANTHROPIC_API_KEY in your Vercel environment variables.'
            : undefined,
      },
      { status }
    );
  }
}
