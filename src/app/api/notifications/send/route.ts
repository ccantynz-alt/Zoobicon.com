import { NextRequest, NextResponse } from "next/server";
import { dispatch, NotificationChannel } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as {
      userId?: string;
      type?: string;
      title?: string;
      body?: string;
      link?: string;
      channels?: NotificationChannel[];
      email?: string;
      phone?: string;
    };
    if (!body.userId || !body.type || !body.title || !body.body) {
      return NextResponse.json(
        { error: "userId, type, title, body required" },
        { status: 400 }
      );
    }
    const dispatched = await dispatch(body.userId, {
      type: body.type,
      title: body.title,
      body: body.body,
      link: body.link,
      channels: body.channels,
      email: body.email,
      phone: body.phone,
    });
    return NextResponse.json({ dispatched });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
