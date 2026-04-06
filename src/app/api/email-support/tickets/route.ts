import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// ---------------------------------------------------------------------------
// Support Tickets API — tries real DB first, falls back to demo data
// GET  /api/email-support/tickets — list tickets with filters
// POST /api/email-support/tickets — create ticket
// PUT  /api/email-support/tickets — update ticket
// ---------------------------------------------------------------------------

export interface TicketMessage {
  id: string;
  from: "customer" | "agent" | "ai" | "internal";
  body: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  subject: string;
  body: string;
  from: string;
  customerName: string;
  status: "open" | "pending" | "resolved" | "spam";
  priority: "low" | "medium" | "high" | "urgent";
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  tags: string[];
}

// Demo data kept as fallback when DB is unavailable
const DEMO_TICKETS: Ticket[] = [
  {
    id: "TK-3001",
    subject: "Can't export my website as React project",
    body: "Hi, I've been trying to export my generated website as a React project but the button seems to do nothing. I'm on the Pro plan. Can you help?",
    from: "sarah@startup.io",
    customerName: "Sarah Chen",
    status: "open",
    priority: "high",
    assignee: null,
    createdAt: "2026-03-15T09:23:00Z",
    updatedAt: "2026-03-15T09:23:00Z",
    messages: [
      { id: "m1", from: "customer", body: "Hi, I've been trying to export my generated website as a React project but the button seems to do nothing. I'm on the Pro plan. Can you help?", timestamp: "2026-03-15T09:23:00Z" },
    ],
    tags: ["export", "react", "bug"],
  },
  {
    id: "TK-3002",
    subject: "Bulk generation CSV format question",
    body: "What columns does the CSV need for bulk generation? I want to create 50 client sites at once for my agency.",
    from: "james@agency.co",
    customerName: "James Rodriguez",
    status: "pending",
    priority: "medium",
    assignee: "Support Team",
    createdAt: "2026-03-15T08:45:00Z",
    updatedAt: "2026-03-15T09:10:00Z",
    messages: [
      { id: "m2", from: "customer", body: "What columns does the CSV need for bulk generation? I want to create 50 client sites at once for my agency.", timestamp: "2026-03-15T08:45:00Z" },
      { id: "m3", from: "ai", body: "Hi James! The CSV format requires 3 columns: name, prompt, and template. I've attached a sample CSV. Our docs at zoobicon.com/docs/bulk have the full specification.", timestamp: "2026-03-15T08:46:00Z" },
    ],
    tags: ["agency", "bulk", "csv"],
  },
  {
    id: "TK-3003",
    subject: "Love the new multi-page feature!",
    body: "Just wanted to say the multi-page site generation is incredible. Generated a 5-page portfolio site in under 2 minutes. Amazing work!",
    from: "lisa@design.com",
    customerName: "Lisa Park",
    status: "resolved",
    priority: "low",
    assignee: null,
    createdAt: "2026-03-15T07:12:00Z",
    updatedAt: "2026-03-15T07:15:00Z",
    messages: [
      { id: "m4", from: "customer", body: "Just wanted to say the multi-page site generation is incredible. Generated a 5-page portfolio site in under 2 minutes. Amazing work!", timestamp: "2026-03-15T07:12:00Z" },
      { id: "m5", from: "ai", body: "Thank you so much, Lisa! We're thrilled you're enjoying the multi-page feature. If you'd like to share your portfolio, we'd love to feature it in our showcase!", timestamp: "2026-03-15T07:13:00Z" },
    ],
    tags: ["feedback", "positive"],
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search");

  // Try real database first
  try {
    let tickets;
    if (search) {
      const q = `%${search}%`;
      tickets = await sql`
        SELECT t.*,
          (SELECT COUNT(*)::int FROM support_messages m WHERE m.ticket_id = t.id) AS message_count
        FROM support_tickets t
        WHERE (t.subject ILIKE ${q} OR t.from_email ILIKE ${q} OR t.from_name ILIKE ${q})
        ${status && status !== "all" ? sql`AND t.status = ${status}` : sql``}
        ${priority ? sql`AND t.priority = ${priority}` : sql``}
        ORDER BY t.updated_at DESC
        LIMIT 50
      `;
    } else if (status && status !== "all") {
      tickets = await sql`
        SELECT t.*,
          (SELECT COUNT(*)::int FROM support_messages m WHERE m.ticket_id = t.id) AS message_count
        FROM support_tickets t
        WHERE t.status = ${status}
        ${priority ? sql`AND t.priority = ${priority}` : sql``}
        ORDER BY
          CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
          t.updated_at DESC
        LIMIT 50
      `;
    } else {
      tickets = await sql`
        SELECT t.*,
          (SELECT COUNT(*)::int FROM support_messages m WHERE m.ticket_id = t.id) AS message_count
        FROM support_tickets t
        ${priority ? sql`WHERE t.priority = ${priority}` : sql``}
        ORDER BY
          CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
          t.updated_at DESC
        LIMIT 50
      `;
    }

    // Get stats
    const stats = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'open')::int AS open,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
        COUNT(*) FILTER (WHERE status = 'spam')::int AS spam,
        COUNT(*) FILTER (WHERE ai_auto_replied = true)::int AS ai_handled
      FROM support_tickets
    `;

    // Fetch messages for each ticket
    const ticketIds = tickets.map((t: { id: string }) => t.id);
    let messagesMap: Record<string, TicketMessage[]> = {};
    if (ticketIds.length > 0) {
      const messages = await sql`
        SELECT id, ticket_id, sender, body_text, created_at
        FROM support_messages
        WHERE ticket_id = ANY(${ticketIds})
        ORDER BY created_at ASC
      `;
      for (const m of messages) {
        const tid = m.ticket_id as string;
        if (!messagesMap[tid]) messagesMap[tid] = [];
        messagesMap[tid].push({
          id: m.id as string,
          from: m.sender as "customer" | "agent" | "ai" | "internal",
          body: m.body_text as string,
          timestamp: (m.created_at as Date).toISOString?.() || String(m.created_at),
        });
      }
    }

    // Map DB rows to Ticket shape
    const mapped: Ticket[] = tickets.map((t: Record<string, unknown>) => ({
      id: t.id as string,
      subject: (t.subject || "") as string,
      body: (messagesMap[t.id as string]?.[0]?.body || "") as string,
      from: (t.from_email || "") as string,
      customerName: (t.from_name || (t.from_email as string)?.split("@")[0] || "Unknown") as string,
      status: (t.status || "open") as Ticket["status"],
      priority: (t.priority || "medium") as Ticket["priority"],
      assignee: (t.assignee || null) as string | null,
      createdAt: (t.created_at as Date)?.toISOString?.() || String(t.created_at),
      updatedAt: (t.updated_at as Date)?.toISOString?.() || String(t.updated_at),
      messages: messagesMap[t.id as string] || [],
      tags: Array.isArray(t.tags) ? t.tags as string[] : typeof t.tags === "string" ? JSON.parse(t.tags as string || "[]") : [],
    }));

    return NextResponse.json({
      tickets: mapped,
      total: mapped.length,
      stats: stats[0] || { total: 0, open: 0, pending: 0, resolved: 0, spam: 0, ai_handled: 0 },
      source: "database",
    });
  } catch (err) {
    console.warn("[email-support/tickets] DB unavailable, using demo data:", (err as Error).message);
  }

  // Fallback to demo data
  let filtered = [...DEMO_TICKETS];

  if (status && status !== "all") {
    filtered = filtered.filter((t) => t.status === status);
  }
  if (priority) {
    filtered = filtered.filter((t) => t.priority === priority);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.body.toLowerCase().includes(q) ||
        t.from.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q))
    );
  }

  return NextResponse.json({
    tickets: filtered,
    total: filtered.length,
    stats: {
      open: DEMO_TICKETS.filter((t) => t.status === "open").length,
      pending: DEMO_TICKETS.filter((t) => t.status === "pending").length,
      resolved: DEMO_TICKETS.filter((t) => t.status === "resolved").length,
      spam: DEMO_TICKETS.filter((t) => t.status === "spam").length,
      total: DEMO_TICKETS.length,
    },
    source: "demo",
  });
}

export async function POST(request: NextRequest) {
  try {
    const { subject, body, from, priority } = await request.json();

    if (!subject || !body || !from) {
      return NextResponse.json(
        { error: "subject, body, and from are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Try real database
    try {
      const name = from.split("@")[0].charAt(0).toUpperCase() + from.split("@")[0].slice(1);
      const result = await sql`
        INSERT INTO support_tickets (subject, from_email, from_name, status, priority)
        VALUES (${subject}, ${from}, ${name}, 'open', ${priority || "medium"})
        RETURNING id, created_at
      `;
      const ticket = result[0];

      await sql`
        INSERT INTO support_messages (ticket_id, sender, body_text)
        VALUES (${ticket.id}, 'customer', ${body})
      `;

      return NextResponse.json({
        ticket: {
          id: ticket.id,
          subject,
          body,
          from,
          customerName: name,
          status: "open",
          priority: priority || "medium",
          assignee: null,
          createdAt: (ticket.created_at as Date).toISOString(),
          updatedAt: (ticket.created_at as Date).toISOString(),
          messages: [{ id: `m-${Date.now()}`, from: "customer", body, timestamp: new Date().toISOString() }],
          tags: [],
        },
        source: "database",
      }, { status: 201 });
    } catch (dbErr) {
      console.warn("[email-support/tickets] DB unavailable for create:", (dbErr as Error).message);
    }

    // Fallback: return ticket without persisting
    const newTicket: Ticket = {
      id: `TK-${Date.now()}`,
      subject,
      body,
      from,
      customerName: from.split("@")[0].charAt(0).toUpperCase() + from.split("@")[0].slice(1),
      status: "open",
      priority: priority || "medium",
      assignee: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{ id: `m-${Date.now()}`, from: "customer", body, timestamp: new Date().toISOString() }],
      tags: [],
    };

    return NextResponse.json({ ticket: newTicket, source: "local" }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status, priority, assignee } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Ticket id is required" },
        { status: 400 }
      );
    }

    // Try real database
    try {
      if (status) {
        await sql`UPDATE support_tickets SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (priority) {
        await sql`UPDATE support_tickets SET priority = ${priority}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (assignee !== undefined) {
        await sql`UPDATE support_tickets SET assignee = ${assignee}, updated_at = NOW() WHERE id = ${id}`;
      }
      return NextResponse.json({ success: true, source: "database" });
    } catch (dbErr) {
      console.warn("[email-support/tickets] DB unavailable for update:", (dbErr as Error).message);
    }

    // Fallback: return success (client will update local state)
    return NextResponse.json({ success: true, source: "local" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
