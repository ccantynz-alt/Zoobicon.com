import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// GET  /api/agents — List all agents with status
// POST /api/agents — Run a specific agent by ID
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const { listAgents, getAgentHealth } = await import("@/agents");
    const [agents, health] = await Promise.all([listAgents(), getAgentHealth()]);

    return NextResponse.json({
      agents,
      health,
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
    const { agentId } = await req.json();

    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

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
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Agent run failed" },
      { status: 500 }
    );
  }
}
