import { NextRequest } from "next/server";

export interface TicketMessage {
  id: string;
  from: "customer" | "agent" | "ai";
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
  {
    id: "TK-3004",
    subject: "Enterprise SSO integration timeline",
    body: "We're evaluating Zoobicon for our 200-person team. When will SAML SSO be available? This is a hard requirement for us.",
    from: "mike@enterprise.com",
    customerName: "Mike Thompson",
    status: "open",
    priority: "urgent",
    assignee: "Sales Team",
    createdAt: "2026-03-15T06:30:00Z",
    updatedAt: "2026-03-15T06:30:00Z",
    messages: [
      { id: "m6", from: "customer", body: "We're evaluating Zoobicon for our 200-person team. When will SAML SSO be available? This is a hard requirement for us.", timestamp: "2026-03-15T06:30:00Z" },
    ],
    tags: ["enterprise", "sso", "sales"],
  },
  {
    id: "TK-3005",
    subject: "CLI deploy fails with custom domain",
    body: "Running `zb deploy --domain mysite.com` gives error: DNS_PROBE_FAILED. I've set up the CNAME record as documented. It's been 72 hours.",
    from: "anna@freelance.dev",
    customerName: "Anna Kowalski",
    status: "open",
    priority: "high",
    assignee: null,
    createdAt: "2026-03-14T22:15:00Z",
    updatedAt: "2026-03-14T22:15:00Z",
    messages: [
      { id: "m7", from: "customer", body: "Running `zb deploy --domain mysite.com` gives error: DNS_PROBE_FAILED. I've set up the CNAME record as documented. It's been 72 hours.", timestamp: "2026-03-14T22:15:00Z" },
    ],
    tags: ["cli", "deploy", "dns", "bug"],
  },
  {
    id: "TK-3006",
    subject: "Billing discrepancy on my last invoice",
    body: "I was charged $98 instead of $49 for Pro plan this month. I didn't upgrade or add anything. Please investigate.",
    from: "david@smallbiz.com",
    customerName: "David Kim",
    status: "open",
    priority: "high",
    assignee: null,
    createdAt: "2026-03-14T20:00:00Z",
    updatedAt: "2026-03-14T20:00:00Z",
    messages: [
      { id: "m8", from: "customer", body: "I was charged $98 instead of $49 for Pro plan this month. I didn't upgrade or add anything. Please investigate.", timestamp: "2026-03-14T20:00:00Z" },
    ],
    tags: ["billing", "urgent"],
  },
  {
    id: "TK-3007",
    subject: "How to add Google Analytics to generated sites?",
    body: "I want to add my GA4 tracking code to all my generated sites. Is there a global setting or do I need to edit each site manually?",
    from: "priya@marketing.co",
    customerName: "Priya Sharma",
    status: "pending",
    priority: "low",
    assignee: null,
    createdAt: "2026-03-14T18:30:00Z",
    updatedAt: "2026-03-14T19:00:00Z",
    messages: [
      { id: "m9", from: "customer", body: "I want to add my GA4 tracking code to all my generated sites. Is there a global setting or do I need to edit each site manually?", timestamp: "2026-03-14T18:30:00Z" },
      { id: "m10", from: "ai", body: "Hi Priya! Currently you can add GA4 tracking by editing the HTML of each site and placing the gtag.js snippet in the <head>. We're working on a global analytics injection feature for Pro users - expected next month!", timestamp: "2026-03-14T18:31:00Z" },
    ],
    tags: ["analytics", "ga4", "feature-request"],
  },
  {
    id: "TK-3008",
    subject: "AI-generated images look low quality",
    body: "The AI images in my e-commerce site look blurry and generic. I'm using Stability AI. Are there settings to improve quality? Happy to pay more for better results.",
    from: "tom@ecommerce.shop",
    customerName: "Tom Baker",
    status: "open",
    priority: "medium",
    assignee: null,
    createdAt: "2026-03-14T16:45:00Z",
    updatedAt: "2026-03-14T16:45:00Z",
    messages: [
      { id: "m11", from: "customer", body: "The AI images in my e-commerce site look blurry and generic. I'm using Stability AI. Are there settings to improve quality? Happy to pay more for better results.", timestamp: "2026-03-14T16:45:00Z" },
    ],
    tags: ["images", "quality", "ecommerce"],
  },
  {
    id: "TK-3009",
    subject: "Feature request: Figma plugin",
    body: "Would love a Figma plugin that lets me send designs directly to Zoobicon for conversion. Currently I'm using the import panel but a plugin would be way faster.",
    from: "emma@uxstudio.com",
    customerName: "Emma Wilson",
    status: "resolved",
    priority: "low",
    assignee: null,
    createdAt: "2026-03-14T14:20:00Z",
    updatedAt: "2026-03-14T14:25:00Z",
    messages: [
      { id: "m12", from: "customer", body: "Would love a Figma plugin that lets me send designs directly to Zoobicon for conversion. Currently I'm using the import panel but a plugin would be way faster.", timestamp: "2026-03-14T14:20:00Z" },
      { id: "m13", from: "ai", body: "Great suggestion, Emma! A Figma plugin is on our roadmap. I've added your vote to the feature request. In the meantime, our Figma Import panel supports direct URL import - just paste your Figma share link!", timestamp: "2026-03-14T14:21:00Z" },
    ],
    tags: ["feature-request", "figma"],
  },
  {
    id: "TK-3010",
    subject: "Sites down - getting 502 errors",
    body: "All 3 of my deployed sites are returning 502 Bad Gateway errors. This has been happening for the last 20 minutes. My clients are complaining. URGENT!",
    from: "alex@webagency.io",
    customerName: "Alex Rivera",
    status: "open",
    priority: "urgent",
    assignee: "Engineering",
    createdAt: "2026-03-14T12:05:00Z",
    updatedAt: "2026-03-14T12:05:00Z",
    messages: [
      { id: "m14", from: "customer", body: "All 3 of my deployed sites are returning 502 Bad Gateway errors. This has been happening for the last 20 minutes. My clients are complaining. URGENT!", timestamp: "2026-03-14T12:05:00Z" },
    ],
    tags: ["outage", "502", "urgent", "hosting"],
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const search = searchParams.get("search");

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

  return new Response(
    JSON.stringify({
      tickets: filtered,
      total: filtered.length,
      stats: {
        open: DEMO_TICKETS.filter((t) => t.status === "open").length,
        pending: DEMO_TICKETS.filter((t) => t.status === "pending").length,
        resolved: DEMO_TICKETS.filter((t) => t.status === "resolved").length,
        spam: DEMO_TICKETS.filter((t) => t.status === "spam").length,
        total: DEMO_TICKETS.length,
      },
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { subject, body, from, priority } = await request.json();

    if (!subject || !body || !from) {
      return new Response(
        JSON.stringify({ error: "subject, body, and from are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const newTicket: Ticket = {
      id: `TK-${3000 + DEMO_TICKETS.length + 1}`,
      subject,
      body,
      from,
      customerName: from.split("@")[0].charAt(0).toUpperCase() + from.split("@")[0].slice(1),
      status: "open",
      priority: priority || "medium",
      assignee: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `m-${Date.now()}`,
          from: "customer",
          body,
          timestamp: new Date().toISOString(),
        },
      ],
      tags: [],
    };

    return new Response(JSON.stringify({ ticket: newTicket }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create ticket";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status, priority, assignee } = await request.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Ticket id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const ticket = DEMO_TICKETS.find((t) => t.id === id);
    if (!ticket) {
      return new Response(
        JSON.stringify({ error: "Ticket not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const updated = {
      ...ticket,
      status: status || ticket.status,
      priority: priority || ticket.priority,
      assignee: assignee !== undefined ? assignee : ticket.assignee,
      updatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ ticket: updated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update ticket";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
