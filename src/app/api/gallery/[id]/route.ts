import { NextRequest, NextResponse } from "next/server";

/* ---------- GET: single gallery item ---------- */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // MVP: Return mock detail data
  const item = {
    id,
    prompt:
      "A modern yoga studio website with class schedules, instructor bios, and an online booking system. Calm earth-tone palette with elegant typography.",
    siteName: "Zen Flow Studio",
    creator: "Sarah M.",
    creatorAvatar: null,
    category: "Business",
    upvotes: 234,
    comments: [
      { id: "c1", author: "Mike R.", text: "Love the color palette!", createdAt: "2026-03-20T16:00:00Z" },
      { id: "c2", author: "Anna S.", text: "The booking section is gorgeous. How did you prompt for that?", createdAt: "2026-03-20T17:30:00Z" },
      { id: "c3", author: "Dev_Jay", text: "Remixed this for my Pilates studio, works perfectly.", createdAt: "2026-03-21T09:15:00Z" },
    ],
    buildTime: 92,
    url: "#",
    createdAt: "2026-03-20T14:30:00Z",
    staffPick: true,
    tags: ["booking", "wellness"],
    model: "Claude Opus",
    generationType: "pipeline",
  };

  return NextResponse.json({ item });
}

/* ---------- POST: upvote or comment ---------- */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { action, text } = body;

    if (!action || !["upvote", "comment"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'upvote' or 'comment'." },
        { status: 400 }
      );
    }

    if (action === "upvote") {
      // MVP: Return mock updated count
      return NextResponse.json({
        success: true,
        itemId: id,
        action: "upvote",
        newCount: 235,
      });
    }

    if (action === "comment") {
      if (!text || text.trim().length === 0) {
        return NextResponse.json(
          { error: "Comment text is required" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        itemId: id,
        action: "comment",
        comment: {
          id: `comment_${Date.now()}`,
          author: "You",
          text: text.trim(),
          createdAt: new Date().toISOString(),
        },
      });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
