import { NextRequest, NextResponse } from "next/server";
import {
  sendMail,
  createList,
  getLists,
  getSubscribers,
  getCampaigns,
  createCampaign,
  sendCampaign,
  createAutomation,
  getAutomations,
  getSMTPConfig,
} from "@/lib/zoobicon-mail";

// ---------------------------------------------------------------------------
// Zoobicon Mail API
//
// GET  /api/mail — Dashboard: lists, campaigns, stats, SMTP config
// POST /api/mail — Send email, create list, create campaign, send campaign
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") || "overview";
  const userEmail = req.nextUrl.searchParams.get("user") || "admin@zoobicon.com";
  const listId = req.nextUrl.searchParams.get("listId");

  try {
    if (action === "lists") {
      const lists = await getLists(userEmail);
      return NextResponse.json({ lists });
    }

    if (action === "subscribers" && listId) {
      const search = req.nextUrl.searchParams.get("search") || undefined;
      const tag = req.nextUrl.searchParams.get("tag") || undefined;
      const result = await getSubscribers(listId, { search, tag });
      return NextResponse.json(result);
    }

    if (action === "campaigns") {
      const campaigns = await getCampaigns(userEmail, listId || undefined);
      return NextResponse.json({ campaigns });
    }

    if (action === "automations") {
      const automations = await getAutomations(userEmail);
      return NextResponse.json({ automations });
    }

    if (action === "smtp") {
      return NextResponse.json({ smtp: getSMTPConfig() });
    }

    // Overview
    const [lists, campaigns, automations] = await Promise.all([
      getLists(userEmail),
      getCampaigns(userEmail),
      getAutomations(userEmail),
    ]);

    const totalSubscribers = lists.reduce((sum, l) => sum + l.subscriberCount, 0);
    const sentCampaigns = campaigns.filter((c) => c.status === "sent");
    const totalDelivered = sentCampaigns.reduce((sum, c) => sum + c.delivered, 0);
    const totalOpened = sentCampaigns.reduce((sum, c) => sum + c.opened, 0);

    return NextResponse.json({
      overview: {
        totalLists: lists.length,
        totalSubscribers,
        totalCampaigns: campaigns.length,
        sentCampaigns: sentCampaigns.length,
        activeAutomations: automations.filter((a) => a.active).length,
        avgOpenRate: totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 1000) / 10 : 0,
      },
      lists,
      recentCampaigns: campaigns.slice(0, 5),
      smtp: getSMTPConfig(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch mail data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // --- Send a single email ---
    if (action === "send") {
      const { from, to, subject, html, text, replyTo, tags } = body;
      if (!to || !subject) {
        return NextResponse.json({ error: "to and subject required" }, { status: 400 });
      }
      const result = await sendMail({
        from: from || `Zoobicon <noreply@${process.env.MAILGUN_DOMAIN || "zoobicon.com"}>`,
        to,
        subject,
        html,
        text,
        replyTo,
        tags,
      });
      return NextResponse.json(result);
    }

    // --- Create a list ---
    if (action === "create_list") {
      const { userEmail, name, description } = body;
      if (!userEmail || !name) {
        return NextResponse.json({ error: "userEmail and name required" }, { status: 400 });
      }
      const list = await createList(userEmail, name, description);
      return NextResponse.json({ list });
    }

    // --- Create a campaign ---
    if (action === "create_campaign") {
      const { listId, userEmail, name, subject, fromName, fromEmail, htmlContent, textContent, scheduledFor } = body;
      if (!listId || !userEmail || !subject || !fromEmail) {
        return NextResponse.json({ error: "listId, userEmail, subject, fromEmail required" }, { status: 400 });
      }
      const campaign = await createCampaign({
        listId,
        userEmail,
        name: name || subject,
        subject,
        fromName,
        fromEmail,
        htmlContent: htmlContent || "",
        textContent,
        scheduledFor,
      });
      return NextResponse.json({ campaign });
    }

    // --- Send a campaign ---
    if (action === "send_campaign") {
      const { campaignId } = body;
      if (!campaignId) {
        return NextResponse.json({ error: "campaignId required" }, { status: 400 });
      }
      const result = await sendCampaign(campaignId);
      return NextResponse.json(result);
    }

    // --- Create automation ---
    if (action === "create_automation") {
      const { userEmail, listId, name, trigger, triggerValue, steps } = body;
      if (!userEmail || !listId || !name || !trigger) {
        return NextResponse.json({ error: "userEmail, listId, name, trigger required" }, { status: 400 });
      }
      const automation = await createAutomation({
        userEmail,
        listId,
        name,
        trigger,
        triggerValue,
        steps: steps || [],
      });
      return NextResponse.json({ automation });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Mail operation failed" },
      { status: 500 }
    );
  }
}
