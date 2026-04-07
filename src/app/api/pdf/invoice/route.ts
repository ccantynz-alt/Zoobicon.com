import { NextRequest, NextResponse } from "next/server";
import {
  Invoice,
  InvoiceLineItem,
  InvoiceParty,
  renderInvoicePdf,
} from "@/lib/pdf-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isParty(value: unknown): value is InvoiceParty {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.name === "string" &&
    typeof v.email === "string" &&
    typeof v.address === "string"
  );
}

function isLineItem(value: unknown): value is InvoiceLineItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.description === "string" &&
    typeof v.quantity === "number" &&
    typeof v.unitPrice === "number" &&
    typeof v.total === "number"
  );
}

function isInvoice(value: unknown): value is Invoice {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.number === "string" &&
    typeof v.issueDate === "string" &&
    typeof v.dueDate === "string" &&
    isParty(v.from) &&
    isParty(v.to) &&
    Array.isArray(v.items) &&
    v.items.every(isLineItem) &&
    typeof v.subtotal === "number" &&
    typeof v.total === "number" &&
    typeof v.currency === "string"
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!isInvoice(body)) {
    return NextResponse.json(
      {
        error:
          "Invalid invoice payload. Required: number, issueDate, dueDate, from, to, items[], subtotal, total, currency.",
      },
      { status: 400 },
    );
  }

  const result = await renderInvoicePdf(body);

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Disposition": `inline; filename="invoice-${body.number}.${
        result.mode === "pdf" ? "pdf" : "html"
      }"`,
      "X-PDF-Mode": result.mode,
      "Cache-Control": "no-store",
    },
  });
}
