import { NextResponse } from "next/server";

const DEMO_HISTORY = [
  { id: "pub1", content: "Just launched a new portfolio site for a client!", platforms: ["twitter", "linkedin"], status: "published", publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: "pub2", content: "Check out our latest AI-generated restaurant website", platforms: ["twitter", "facebook", "linkedin"], status: "published", publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: "pub3", content: "5 tips for better AI website prompts", platforms: ["twitter", "reddit"], status: "scheduled", scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString() },
];

export async function GET() {
  return NextResponse.json({
    history: DEMO_HISTORY,
    connectedPlatforms: ["twitter", "linkedin"],
    total: DEMO_HISTORY.length,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, platforms, schedule } = body;
    if (!content || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: "Missing required fields: content, platforms (array)" }, { status: 400 });
    }
    const validPlatforms = ["twitter", "linkedin", "facebook", "reddit", "tiktok", "instagram"];
    const invalid = platforms.filter((p: string) => !validPlatforms.includes(p));
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Invalid platforms: ${invalid.join(", ")}` }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      post: {
        id: `pub${Date.now()}`,
        content,
        platforms,
        status: schedule ? "scheduled" : "published",
        ...(schedule ? { scheduledFor: schedule } : { publishedAt: new Date().toISOString() }),
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
