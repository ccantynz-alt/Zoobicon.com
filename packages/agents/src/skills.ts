/**
 * @zoobicon/agents — Skills System
 *
 * Extensible plugin architecture for agents. Skills are self-contained
 * capabilities that any agent can invoke during task execution.
 *
 * Register custom skills or use the built-in ones (http-check, send-alert).
 *
 * @module @zoobicon/agents
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A skill is a reusable capability that agents can invoke.
 *
 * Skills are registered globally and available to all agents.
 * Think of them as shared tools in an agent's toolbox.
 */
export interface Skill {
  /** Unique skill identifier (e.g., "http-check", "send-email") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what this skill does */
  description: string;
  /** Semantic version */
  version: string;
  /** Author name or email */
  author?: string;
  /** Tags for discovery */
  tags?: string[];
  /** The function that executes the skill */
  handler: SkillHandler;
  /** Default configuration (overridable per invocation) */
  config?: Record<string, unknown>;
}

/**
 * Function signature for skill handlers.
 *
 * @param input   - Skill-specific input data
 * @param context - Execution context with agent ID and config
 * @returns Skill-specific output data
 */
export type SkillHandler = (input: unknown, context: SkillContext) => Promise<unknown>;

/**
 * Context passed to skill handlers during execution.
 */
export interface SkillContext {
  /** ID of the agent invoking the skill */
  agentId: string;
  /** ID of the skill being executed */
  skillId: string;
  /** Merged configuration (skill defaults + invocation overrides) */
  config: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const skillRegistry = new Map<string, Skill>();

/**
 * Register a skill globally so any agent can use it.
 *
 * @param skill - The skill definition including handler
 *
 * @example
 * ```typescript
 * registerSkill({
 *   id: "send-slack",
 *   name: "Send Slack Message",
 *   description: "Posts a message to a Slack channel",
 *   version: "1.0.0",
 *   handler: async (input, ctx) => {
 *     const { channel, text } = input as { channel: string; text: string };
 *     // ... post to Slack API
 *     return { sent: true };
 *   },
 * });
 * ```
 */
export function registerSkill(skill: Skill): void {
  skillRegistry.set(skill.id, skill);
}

/**
 * Look up a registered skill by ID.
 *
 * @param id - Skill identifier
 * @returns The skill definition, or undefined if not found
 */
export function getSkill(id: string): Skill | undefined {
  return skillRegistry.get(id);
}

/**
 * List all registered skills.
 *
 * @returns Array of all skill definitions
 */
export function listSkills(): Skill[] {
  return Array.from(skillRegistry.values());
}

/**
 * Execute a skill by ID.
 *
 * @param skillId - The skill to execute
 * @param input   - Skill-specific input
 * @param context - Partial context (agentId required; skillId and config are auto-filled)
 * @returns The skill's output
 * @throws If the skill is not found
 *
 * @example
 * ```typescript
 * const result = await executeSkill("http-check", {
 *   url: "https://example.com",
 *   expectedStatus: [200],
 * }, { agentId: "my-agent" });
 * ```
 */
export async function executeSkill(
  skillId: string,
  input: unknown,
  context: Omit<SkillContext, "skillId" | "config">
): Promise<unknown> {
  const skill = skillRegistry.get(skillId);
  if (!skill) throw new Error(`Skill "${skillId}" not found`);
  return skill.handler(input, { ...context, skillId, config: skill.config || {} });
}

// ---------------------------------------------------------------------------
// Built-in Skills
// ---------------------------------------------------------------------------

registerSkill({
  id: "http-check",
  name: "HTTP Health Check",
  description: "Check if a URL is reachable and returns an expected HTTP status code",
  version: "1.0.0",
  tags: ["http", "health", "monitoring"],
  handler: async (input: unknown) => {
    const { url, expectedStatus = [200], timeoutMs = 10000 } = input as {
      url: string;
      expectedStatus?: number[];
      timeoutMs?: number;
    };
    const start = Date.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      return {
        url,
        status: res.status,
        ok: expectedStatus.includes(res.status),
        responseTimeMs: Date.now() - start,
      };
    } catch (err) {
      return {
        url,
        status: null,
        ok: false,
        responseTimeMs: Date.now() - start,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});

registerSkill({
  id: "send-alert",
  name: "Send Alert",
  description: "Send an alert notification. Logs to console by default; override config.alertFn for custom delivery.",
  version: "1.0.0",
  tags: ["alert", "notification"],
  handler: async (input: unknown, context: SkillContext) => {
    const { message, severity = "info" } = input as {
      message: string;
      severity?: string;
    };

    // Allow custom alert function via config
    const alertFn = context.config.alertFn as ((msg: string, sev: string) => Promise<void>) | undefined;
    if (alertFn) {
      await alertFn(message, severity);
    } else {
      console.log(`[ALERT:${severity}] ${message}`);
    }

    return { sent: true, message, severity };
  },
});
