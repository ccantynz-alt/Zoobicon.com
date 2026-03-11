import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  // Slack URL verification challenge
  if (body.type === "url_verification") {
    return NextResponse.json({ challenge: body.challenge });
  }

  // Handle event callbacks
  if (body.type === "event_callback") {
    const event = body.event;

    // TODO: Handle specific Slack events here
    console.log("Slack event received:", event?.type);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
