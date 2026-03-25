/**
 * /api/todo — Craig's Daily To-Do List
 *
 * GET  — Returns the current to-do list as JSON
 * POST — Sends the to-do list email to Craig immediately (or called by cron)
 */

import { NextResponse } from "next/server";
import {
  getTodoList,
  getTodoListByCategory,
  formatTodoEmail,
  CRAIG_EMAIL,
} from "@/lib/daily-todo";
import { sendMail } from "@/lib/zoobicon-mail";

export async function GET() {
  const items = getTodoList();
  const grouped = getTodoListByCategory();
  const critical = items.filter((t) => t.priority === "critical").length;
  const high = items.filter((t) => t.priority === "high").length;
  const inProgress = items.filter((t) => t.status === "in-progress").length;

  return NextResponse.json({
    total: items.length,
    critical,
    high,
    inProgress,
    categories: grouped,
    items,
  });
}

export async function POST() {
  try {
    const { subject, html, text } = formatTodoEmail();

    const result = await sendMail({
      to: CRAIG_EMAIL,
      from: "Zoobicon To-Do <todo@zoobicon.com>",
      subject,
      html,
      text,
    });

    return NextResponse.json({
      success: true,
      message: `To-do list sent to ${CRAIG_EMAIL}`,
      provider: result.provider,
      messageId: result.messageId,
      itemCount: getTodoList().length,
    });
  } catch (error) {
    console.error("[TodoEmail] Failed to send:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send to-do list email. Check mail provider config.",
      },
      { status: 500 }
    );
  }
}
