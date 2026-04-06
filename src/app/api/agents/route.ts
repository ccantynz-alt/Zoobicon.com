import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// GET  /api/agents — List all agents with status, last run, next run, success rate
// POST /api/agents — Run or manage a specific agent
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { getAgentHealth } = await import("@/agents");
    const health = await getAgentHealth();

    // Enrich with success rates from run history
    const enrichedAgents = await Promise.all(
      health.agents.map(async (agent) => {
        let successRate: number | null = null;
        let lastError: string | null = null;

        try {
          const { getAgentHistory } = await import("@/agents");
          const history = await getAgentHistory(agent.id, 20);

          if (history.length > 0) {
            const successful = history.filter((r) => r.status === "completed").length;
            successRate = history.length > 0 ? successful / history.length : null;

            // Find last error
            const lastErrorRun = history.find((r) => r.status === "error");
            if (lastErrorRun?.metadata) {
              lastError = (lastErrorRun.metadata as Record<string, unknown>).error as string || null;
            }
          }
        } catch {
          // History unavailable
        }

        return {
          id: agent.id,
          name: agent.name,
          status: agent.status,
          lastRun: agent.lastRunAt ? new Date(agent.lastRunAt).toISOString() : null,
          lastRunStatus: agent.lastRunStatus,
          nextRun: agent.nextRunAt ? new Date(agent.nextRunAt).toISOString() : null,
          successRate,
          lastError,
        };
      })
    );

    return NextResponse.json({
      agents: enrichedAgents,
      summary: {
        total: health.totalAgents,
        running: health.running,
        idle: health.idle,
        errored: health.errored,
      },
      framework: {
        version: "1.0.0",
        name: "Zoobicon Agent Framework",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list agents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, agentId } = body;

    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    const effectiveAction = action || "run";

    switch (effectiveAction) {
      case "run": {
        const { runAgent } = await import("@/agents");
        const run = await runAgent(agentId);

        if (!run) {
          return NextResponse.json(
            { error: `Agent "${agentId}" not found` },
            { status: 404 }
          );
        }

        return NextResponse.json({
          run,
          message: `Agent "${agentId}" completed with ${run.tasksCompleted} tasks completed, ${run.tasksFailed} failed`,
        });
      }

      case "history": {
        const { getAgentHistory } = await import("@/agents");
        const limit = body.limit || 20;
        const history = await getAgentHistory(agentId, limit);

        return NextResponse.json({ agentId, history });
      }

      case "run-all": {
        const { runScheduledAgents } = await import("@/agents");
        const result = await runScheduledAgents();

        return NextResponse.json({
          ...result,
          message: `Ran ${result.ran.length} agents, skipped ${result.skipped.length}, ${result.errors.length} errors`,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action "${effectiveAction}". Valid actions: run, history, run-all` },
          { status: 400 }
        );
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Agent operation failed" },
      { status: 500 }
    );
  }
}
