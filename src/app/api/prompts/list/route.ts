import { NextRequest, NextResponse } from 'next/server';
import { listPrompts, PromptCategory } from '@/lib/prompt-library';

const VALID_CATEGORIES: PromptCategory[] = [
  'marketing',
  'sales',
  'support',
  'content',
  'dev',
  'design',
  'research',
];

export async function GET(req: NextRequest): Promise<NextResponse> {
  const categoryParam = req.nextUrl.searchParams.get('category');
  let category: PromptCategory | undefined;
  if (categoryParam) {
    if (!VALID_CATEGORIES.includes(categoryParam as PromptCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }
    category = categoryParam as PromptCategory;
  }
  const prompts = listPrompts(category);
  return NextResponse.json({ prompts, count: prompts.length });
}
