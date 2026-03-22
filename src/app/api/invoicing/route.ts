import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// GET /api/invoicing
// Returns invoices, clients, stats, proposals, recurring, and payments.
//
// Query params:
//   ?view=invoices | clients | stats | proposals | recurring | payments | all
//   ?status=draft | sent | paid | overdue  (filter invoices)
// ---------------------------------------------------------------------------

// Mock data mirrors src/lib/invoicing.ts — server-side fallback for SSR / API consumers.
// In production this would query a database.

const MOCK_CLIENTS = [
  { id: "cl-001", name: "Sarah Chen", email: "sarah@bloomcafe.com", company: "Bloom Cafe", totalBilled: 4200, invoiceCount: 3, lastActivity: "2026-03-18" },
  { id: "cl-002", name: "Marcus Rivera", email: "marcus@riveraphotography.com", company: "Rivera Photography", totalBilled: 6800, invoiceCount: 5, lastActivity: "2026-03-15" },
  { id: "cl-003", name: "Priya Patel", email: "priya@zenithfitness.io", company: "Zenith Fitness", totalBilled: 3500, invoiceCount: 2, lastActivity: "2026-03-10" },
  { id: "cl-004", name: "David Okonkwo", email: "david@oaklegal.com", company: "Oak & Associates Legal", totalBilled: 12400, invoiceCount: 8, lastActivity: "2026-03-20" },
  { id: "cl-005", name: "Emma Larsson", email: "emma@nordicdesigns.se", company: "Nordic Designs", totalBilled: 8900, invoiceCount: 6, lastActivity: "2026-03-12" },
  { id: "cl-006", name: "Alex Kim", email: "alex@startupgrind.co", company: "StartupGrind", totalBilled: 2100, invoiceCount: 1, lastActivity: "2026-03-08" },
];

const MOCK_STATS = {
  outstanding: 8720,
  paidThisMonth: 4578,
  overdue: 2943,
  overdueCount: 2,
  totalRevenue: 10355,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const view = searchParams.get("view") || "all";
    const status = searchParams.get("status") || "";

    const result: Record<string, unknown> = {};

    if (view === "clients" || view === "all") {
      result.clients = MOCK_CLIENTS;
    }

    if (view === "stats" || view === "all") {
      result.stats = MOCK_STATS;
    }

    if (view === "all") {
      result.invoiceCount = 10;
      result.proposalCount = 3;
    }

    if (status) {
      result.filter = status;
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/invoicing
// Create a new invoice or proposal.
// Body: { type: "invoice" | "proposal", data: {...} }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: "Missing type or data" },
        { status: 400 }
      );
    }

    if (type === "invoice") {
      const id = `inv-${Date.now()}`;
      const number = `INV-${1010 + Math.floor(Math.random() * 100)}`;
      return NextResponse.json({
        success: true,
        invoice: { id, number, ...data, status: data.status || "draft" },
      });
    }

    if (type === "proposal") {
      const id = `prop-${Date.now()}`;
      return NextResponse.json({
        success: true,
        proposal: { id, ...data, status: data.status || "draft" },
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown type: ${type}` },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/invoicing
// Update invoice status.
// Body: { id: string, status: "draft" | "sent" | "paid" | "overdue" }
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "Missing id or status" },
        { status: 400 }
      );
    }

    const validStatuses = ["draft", "sent", "paid", "overdue"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status: ${status}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: {
        id,
        status,
        updatedAt: new Date().toISOString(),
        paidAt: status === "paid" ? new Date().toISOString() : undefined,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
