export async function POST(request: Request) {
  const body = await request.json();

  // Slack URL verification challenge — respond with plain text
  if (body.type === "url_verification") {
    return new Response(body.challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Handle event callbacks
  if (body.type === "event_callback") {
    const event = body.event;
    console.log("Slack event received:", event?.type);
    return new Response("ok", { status: 200 });
  }

  return new Response("ok", { status: 200 });
}

// Allow GET for health checks
export async function GET() {
  return new Response("Slack events endpoint is active", { status: 200 });
}
