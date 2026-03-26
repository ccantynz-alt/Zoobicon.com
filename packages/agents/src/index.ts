/**
 * @zoobicon/agents — Open-source AI agent framework
 *
 * Build autonomous agents that discover tasks, execute them, and self-heal.
 * Zero external dependencies. Works everywhere Node.js 18+ runs.
 *
 * @example Quick start
 * ```typescript
 * import { createAgent } from "@zoobicon/agents";
 *
 * const agent = createAgent({
 *   id: "my-agent",
 *   name: "My Agent",
 *   discover: async () => [{ url: "https://example.com" }],
 *   execute: async (input) => {
 *     const res = await fetch(input.url);
 *     return { output: { status: res.status }, confidence: 1 };
 *   },
 * });
 *
 * await agent.run();
 * ```
 *
 * @packageDocumentation
 */

// Core
export { BaseAgent, onAgentEvent } from "./base";
export type {
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
} from "./base";

// Storage backends
export { InMemoryAgentStore, PostgresAgentStore } from "./store";
export type { SqlFunction } from "./store";

// Registry & scheduler
export {
  registerAgent,
  getAgent,
  listAgents,
  runAgent,
  runScheduledAgents,
  getAgentHistory,
  getAgentHealth,
  setDefaultStore,
} from "./registry";

// Skills / plugins
export {
  registerSkill,
  getSkill,
  listSkills,
  executeSkill,
} from "./skills";
export type { Skill, SkillHandler, SkillContext } from "./skills";

// Convenience
export { createAgent } from "./helpers";
export type { CreateAgentOptions } from "./helpers";
