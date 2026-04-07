import { NextResponse } from "next/server";
import { addExpense, EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/expense-tracker";

export const runtime = "nodejs";

interface AddBody {
  userId?: string;
  amount?: number;
  currency?: string;
  category?: string;
  description?: string;
  date?: string;
  receiptUrl?: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL is not set" }, { status: 503 });
  }
  let body: AddBody;
  try {
    body = (await req.json()) as AddBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { userId, amount, currency, category, description, date, receiptUrl } = body;
  if (
    !userId ||
    typeof amount !== "number" ||
    !currency ||
    !category ||
    !description ||
    !date
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!(EXPENSE_CATEGORIES as string[]).includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  try {
    const expense = await addExpense({
      userId,
      amount,
      currency,
      category: category as ExpenseCategory,
      description,
      date,
      receiptUrl,
    });
    return NextResponse.json({ expense });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
