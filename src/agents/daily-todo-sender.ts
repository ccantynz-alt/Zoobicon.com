/**
 * Daily To-Do Sender Agent
 *
 * Sends Craig's daily to-do list via email every morning.
 * Runs every 60 minutes — but only actually sends once per day (tracks last send date).
 */

import { BaseAgent } from "./base";
import { registerAgent } from "./registry";
import { formatTodoEmail, getTodoList, CRAIG_EMAIL, SEND_HOUR_UTC } from "@/lib/daily-todo";
import { sendMail } from "@/lib/zoobicon-mail";

class DailyTodoSender extends BaseAgent {
  constructor() {
    super({
      id: "daily-todo-sender",
      name: "Daily To-Do Sender",
      description: "Sends Craig's daily to-do list email every morning",
      model: "haiku",
      intervalMinutes: 60, // Check every hour, but only send once per day
      maxConcurrency: 1,
      maxRetries: 3,
      taskTimeoutMs: 30_000,
      autoExecute: true,
      confidenceThreshold: 1.0, // Always send when due
      tags: ["internal", "email", "todo"],
    });
  }

  async discoverTasks() {
    const now = new Date();
    const todayKey = now.toISOString().split("T")[0]; // "2026-03-24"
    const currentHourUTC = now.getUTCHours();

    // Only send if we're at or past the send hour
    if (currentHourUTC < SEND_HOUR_UTC) {
      return [];
    }

    // Check if we already sent today (stored in memory — resets on cold start, but
    // the agent framework's run history in DB prevents duplicate sends within an hour)
    const lastSentKey =
      typeof globalThis !== "undefined"
        ? (globalThis as Record<string, string>).__todoLastSent
        : undefined;

    if (lastSentKey === todayKey) {
      return [];
    }

    const items = getTodoList();
    if (items.length === 0) {
      return []; // Nothing to send
    }

    return [
      {
        id: `todo-email-${todayKey}`,
        type: "send-daily-todo",
        input: { date: todayKey, itemCount: items.length },
      },
    ];
  }

  async executeTask(task: { id: string; type: string; input: Record<string, unknown> }) {
    const { subject, html, text } = formatTodoEmail();
    const items = getTodoList();
    const critical = items.filter((t) => t.priority === "critical").length;

    const result = await sendMail({
      to: CRAIG_EMAIL,
      from: "Zoobicon To-Do <todo@zoobicon.com>",
      subject,
      html,
      text,
    });

    // Mark as sent today
    if (typeof globalThis !== "undefined") {
      (globalThis as Record<string, string>).__todoLastSent = task.input.date as string;
    }

    return {
      success: result.success,
      provider: result.provider,
      messageId: result.messageId,
      itemCount: items.length,
      criticalCount: critical,
      sentTo: CRAIG_EMAIL,
      confidence: 1.0,
    };
  }
}

// Auto-register
const agent = new DailyTodoSender();
registerAgent(agent);

export default agent;
