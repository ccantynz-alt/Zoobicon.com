Looking at the file, I need to identify the broken relative markdown link. Scanning the links:

- `[examples/](./examples)` - links to `./examples` directory
- `[uptime-monitor](./examples/uptime-monitor.ts)`
- `[rss-watcher](./examples/rss-watcher.ts)`
- `[price-tracker](./examples/price-tracker.ts)`
- `[content-moderator](./examples/content-moderator.ts)`
- `[scheduled-reporter](./examples/scheduled-reporter.ts)`

The link `[examples/](./examples)` points to `./examples` (a directory), while all the specific example files use `./examples/filename.ts`. The directory link itself is likely fine. 

Looking more carefully at the `[Zoobicon](https://zoobicon.com)` links — those are absolute. 

The issue is `[examples/](./examples)` — it links to a directory path `./examples` but the text shows `examples/`. Actually the real broken link is likely one of the relative links pointing to a file that doesn't match. 

Wait — the link `[Get started at zoobicon.com](https://zoobicon.com)` is absolute. Let me re-examine relative links only. The `./examples` directory link and the individual `.ts` files are all relative. Among these, `[examples/](./examples)` uses a trailing slash in the display text but `./examples` without trailing slash — that's fine.

The broken one is most likely `[examples/](./examples)` which should point to `./examples/` or perhaps the README is in `packages/agents/` and the examples folder path needs to be verified. Actually the most suspicious link is the bare `[examples/](./examples)` — changing it to `[examples/](./examples/)` with a trailing slash would fix a directory link.

# @zoobicon/agents

Open-source AI agent framework for Node.js. Build autonomous agents that discover tasks, execute them with retry and concurrency, and report findings — all with zero external dependencies.

Extracted from the [Zoobicon](https://zoobicon.com) platform, where it powers monitoring, SEO optimization, content moderation, and more.

## Quick Start

```bash
npm install @zoobicon/agents
```

```typescript
import { createAgent } from "@zoobicon/agents";

const monitor = createAgent({
  id: "uptime-monitor",
  name: "Uptime Monitor",
  scheduleIntervalSec: 300, // Every 5 minutes
  discover: async () => [
    { url: "https://example.com" },
    { url: "https://api.example.com/health" },
  ],
  execute: async (input) => {
    const res = await fetch(input.url);
    return {
      output: { status: res.status, ok: res.ok },
      confidence: 1,
      findings: res.ok ? [] : [{
        severity: "critical",
        category: "uptime",
        title: `${input.url} is down (HTTP ${res.status})`,
        description: `Expected 200, got ${res.status}`,
        autoFixed: false,
      }],
    };
  },
});

const result = await monitor.run();
console.log(`Checked ${result.tasksCompleted} endpoints, ${result.findings.length} issues`);
```

## Features

- **Zero dependencies** — Works in Node.js 18+, Bun, and Deno
- **Task discovery** — Agents find their own work via `discoverTasks()`
- **Retry with backoff** — Exponential backoff on failure, configurable max retries
- **Concurrency control** — Process tasks in parallel with a concurrency limit
- **Timeout protection** — Per-task timeouts prevent runaway execution
- **Confidence scoring** — Tasks report confidence; low-confidence results get flagged for review
- **Findings system** — Structured observations with severity levels for reporting
- **Event bus** — Subscribe to agent lifecycle events for logging, metrics, or alerting
- **Pluggable storage** — InMemory (default), Postgres, or bring your own
- **Skills/plugins** — Shared capabilities any agent can invoke
- **Scheduling** — Built-in interval-based scheduler with deduplication

## API Reference

### `createAgent(options)`

The easiest way to define an agent. Returns a `BaseAgent` instance.

```typescript
const agent = createAgent({
  // Required
  id: "my-agent",              // Unique identifier
  name: "My Agent",            // Display name
  discover: async () => [...], // Return array of task inputs
  execute: async (input, ctx) => ({ output, confidence, findings }),

  // Optional
  description: "What it does",
  scheduleIntervalSec: 300,    // 0 = manual only (default)
  maxConcurrency: 5,           // Parallel tasks (default: 1)
  maxRetries: 2,               // Retries per task (default: 2)
  taskTimeoutMs: 60000,        // Per-task timeout (default: 60s)
  autoExecute: true,           // Auto-execute mode (default: true)
  confidenceThreshold: 0.5,    // Flag below this (default: 0.5)
  tags: ["monitoring"],
  store: new InMemoryAgentStore(), // or PostgresAgentStore
  autoRegister: true,          // Register with global registry (default: true)
});
```

### `BaseAgent` (class)

For more control, extend `BaseAgent` directly:

```typescript
import { BaseAgent, type TaskContext, type AgentFinding } from "@zoobicon/agents";

class SEOAgent extends BaseAgent<{ url: string }, { score: number }> {
  protected async discoverTasks() {
    // Find pages that need checking
    return [{ url: "https://example.com" }];
  }

  protected async execute(input: { url: string }, context: TaskContext) {
    // Do the work
    const score = await analyzeSEO(input.url);
    return {
      output: { score },
      confidence: 0.9,
      findings: score < 50 ? [{
        severity: "warning" as const,
        category: "seo",
        title: `Low SEO score: ${score}/100`,
        description: `${input.url} scored ${score}/100`,
        autoFixed: false,
      }] : [],
    };
  }

  // Optional lifecycle hooks
  protected async initialize() { /* setup */ }
  protected async cleanup() { /* teardown */ }
}
```

### Agent Methods

| Method | Description |
|--------|-------------|
| `agent.run()` | Full cycle: discover tasks, execute all, return `AgentRun` |
| `agent.runTask(input)` | Execute a single task immediately |
| `agent.status` | Current status: `"idle"`, `"running"`, `"paused"`, `"error"` |
| `agent.currentRun` | The in-progress run, or `null` |
| `agent.config` | Read-only agent configuration |

### Registry & Scheduler

```typescript
import {
  registerAgent,
  getAgent,
  listAgents,
  runAgent,
  runScheduledAgents,
  getAgentHealth,
  setDefaultStore,
} from "@zoobicon/agents";

// Set a shared store for all registry agents
setDefaultStore(new PostgresAgentStore(sql));

// Register an agent
registerAgent(config, (store) => new MyAgent(config, store));

// Run by ID
await runAgent("my-agent");

// Run all agents that are due (call from a cron endpoint)
const { ran, skipped, errors } = await runScheduledAgents();

// Health dashboard data
const health = await getAgentHealth();
// { totalAgents: 5, running: 1, idle: 3, errored: 1, agents: [...] }
```

### Event Bus

```typescript
import { onAgentEvent } from "@zoobicon/agents";

const unsubscribe = onAgentEvent((event) => {
  // event.type: "started" | "completed" | "failed" | "task_completed" | "task_failed" | "finding" | "heartbeat"
  console.log(`[${event.agentId}] ${event.type}`, event.data);
});

// Later: stop listening
unsubscribe();
```

### Skills System

Skills are reusable capabilities shared across agents:

```typescript
import { registerSkill, executeSkill } from "@zoobicon/agents";

// Register a custom skill
registerSkill({
  id: "send-slack",
  name: "Send Slack Message",
  description: "Posts to a Slack channel",
  version: "1.0.0",
  handler: async (input) => {
    const { channel, text } = input as { channel: string; text: string };
    await fetch(webhookUrl, { method: "POST", body: JSON.stringify({ channel, text }) });
    return { sent: true };
  },
});

// Use it from any agent's execute method
await executeSkill("send-slack", { channel: "#alerts", text: "Server down!" }, { agentId: "my-agent" });
```

**Built-in skills:**

| Skill | Description |
|-------|-------------|
| `http-check` | Check if a URL returns an expected HTTP status |
| `send-alert` | Log an alert (console by default, configurable) |

### Storage Backends

#### InMemoryAgentStore (default)

Zero setup. Data lost on restart.

```typescript
import { InMemoryAgentStore } from "@zoobicon/agents";
const store = new InMemoryAgentStore();
```

#### PostgresAgentStore

Auto-creates tables on first use. Accepts any SQL tagged-template function.

```typescript
import { neon } from "@neondatabase/serverless";
import { PostgresAgentStore } from "@zoobicon/agents";

const sql = neon(process.env.DATABASE_URL!);
const store = new PostgresAgentStore(sql);

const agent = createAgent({ ..., store });
```

Works with `@neondatabase/serverless`, `postgres`, `@vercel/postgres`, or any driver that supports tagged template queries.

**Tables created automatically:**
- `agent_configs` — Agent configurations
- `agent_runs` — Run history with findings
- `agent_tasks` — Individual task records

## Examples

See the [`examples/`](./examples/) directory:

| Example | Description |
|---------|-------------|
| [uptime-monitor](./examples/uptime-monitor.ts) | Monitor URLs, alert on downtime or slow responses |
| [rss-watcher](./examples/rss-watcher.ts) | Watch RSS feeds for new entries |
| [price-tracker](./examples/price-tracker.ts) | Track product prices, alert on drops |
| [content-moderator](./examples/content-moderator.ts) | Scan text for prohibited patterns and PII |
| [scheduled-reporter](./examples/scheduled-reporter.ts) | Gather metrics and produce daily summary reports |

## Types

All types are exported for TypeScript users:

```typescript
import type {
  AgentConfig,
  AgentStatus,
  AgentRun,
  AgentFinding,
  AgentEvent,
  AgentStore,
  Task,
  TaskContext,
  TaskStatus,
  Severity,
  Skill,
  SkillHandler,
  SkillContext,
  SqlFunction,
  CreateAgentOptions,
} from "@zoobicon/agents";
```

## Hosted on Zoobicon

Want agents without managing infrastructure? [Zoobicon](https://zoobicon.com) runs your agents in the cloud with:

- Dashboard for monitoring all agents
- Cron scheduling with no server to manage
- Postgres persistence included
- Built-in alerting (email, Slack, webhooks)
- Pre-built agents for SEO, uptime, content moderation, and more

[Get started at zoobicon.com](https://zoobicon.com)

## License

MIT