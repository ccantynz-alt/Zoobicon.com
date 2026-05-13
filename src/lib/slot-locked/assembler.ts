/**
 * Slot-Locked assembler — KILLER-MOVES-BUILDER.md #B1.
 *
 * Takes (template, schema, slot-values) → React file source.
 *
 * Two design rules:
 *
 *   1. The TEMPLATE is the source of truth for structure. It's
 *      hand-written, lives in `src/lib/component-registry/slot-locked/`,
 *      and contains placeholder tokens like `{{slot.headline}}` or
 *      `{{#each features}}…{{/each}}` for list slots.
 *
 *   2. The ASSEMBLER never invokes an LLM. Given a valid filled-slot
 *      JSON object, assembly is deterministic and side-effect-free.
 *      If the JSON validates against the schema, the output is
 *      guaranteed structurally correct.
 *
 * This module is dependency-free (pure string + regex) so it can run
 * in edge runtime, Node, or even the browser if needed (e.g. for the
 * visual editor's live preview of slot edits).
 */

import type {
  AssemblyResult,
  ComponentSchema,
  ListSlotDef,
  SlotDef,
  SlotValidation,
  SlotValue,
  SlotValueMap,
} from "./types";

// ───────────────────────────────────────────────────────────────────────
// Validation
// ───────────────────────────────────────────────────────────────────────

/**
 * Validate a single slot value against its definition. Returns
 * `{ ok: true }` when valid, `{ ok: false, reason, corrected }` when
 * the assembler can recover (truncate text, fall back to default),
 * and `{ ok: false, reason }` when the slot is fatally invalid (e.g.
 * required slot missing and no default).
 */
export function validateSlot(def: SlotDef, value: SlotValue | undefined): SlotValidation {
  // Missing value path — required + no default = fatal.
  if (value === undefined || value === null) {
    if (def.default !== undefined) return { ok: true, corrected: def.default };
    if (def.required) return { ok: false, reason: `required slot "${def.name}" missing` };
    return { ok: true, corrected: "" };
  }

  switch (def.type) {
    case "text":
    case "richText": {
      if (typeof value !== "string") {
        if (def.default !== undefined) return { ok: false, reason: `slot "${def.name}" expected string`, corrected: def.default };
        return { ok: false, reason: `slot "${def.name}" expected string, got ${typeof value}` };
      }
      let v = value.trim();
      if (def.maxLength && v.length > def.maxLength) {
        v = v.slice(0, def.maxLength - 1).trimEnd() + "…";
        return { ok: false, reason: `slot "${def.name}" exceeded maxLength ${def.maxLength}, truncated`, corrected: v };
      }
      if (def.pattern && !new RegExp(def.pattern).test(v)) {
        if (def.default !== undefined) return { ok: false, reason: `slot "${def.name}" failed pattern`, corrected: def.default };
        return { ok: false, reason: `slot "${def.name}" failed pattern /${def.pattern}/` };
      }
      return { ok: true, corrected: v };
    }
    case "url": {
      if (typeof value !== "string") return { ok: false, reason: `slot "${def.name}" expected string URL` };
      const v = value.trim();
      // Allow # anchors, /relative, https://, or empty.
      if (v && !/^(#|\/|https?:\/\/)/.test(v)) {
        return { ok: false, reason: `slot "${def.name}" invalid URL "${v}"`, corrected: "#" };
      }
      if (def.internalOnly && /^https?:\/\//.test(v)) {
        return { ok: false, reason: `slot "${def.name}" must be internal, got "${v}"`, corrected: "#" };
      }
      return { ok: true, corrected: v };
    }
    case "icon": {
      if (typeof value !== "string") return { ok: false, reason: `slot "${def.name}" expected icon name` };
      const v = value.trim();
      if (!/^[A-Z][A-Za-z0-9]*$/.test(v)) {
        return { ok: false, reason: `slot "${def.name}" icon "${v}" not in lucide PascalCase form`, corrected: def.default ?? "Circle" };
      }
      return { ok: true, corrected: v };
    }
    case "color": {
      if (typeof value !== "string") return { ok: false, reason: `slot "${def.name}" expected color string` };
      const v = value.trim();
      const validHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v);
      const validVar = /^var\(--[\w-]+\)$/.test(v);
      const validRgba = /^rgba?\(/.test(v);
      if (!validHex && !validVar && !validRgba) {
        return { ok: false, reason: `slot "${def.name}" invalid color "${v}"`, corrected: def.default ?? "var(--gold)" };
      }
      if (def.allowedValues && def.allowedValues.length > 0 && !def.allowedValues.includes(v)) {
        return { ok: false, reason: `slot "${def.name}" color "${v}" not in allowed list`, corrected: def.allowedValues[0] };
      }
      return { ok: true, corrected: v };
    }
    case "enum": {
      if (typeof value !== "string") return { ok: false, reason: `slot "${def.name}" expected enum value` };
      if (!def.values.includes(value)) {
        return { ok: false, reason: `slot "${def.name}" "${value}" not in ${JSON.stringify(def.values)}`, corrected: def.default ?? def.values[0] };
      }
      return { ok: true, corrected: value };
    }
    case "boolean": {
      if (typeof value === "boolean") return { ok: true, corrected: value };
      if (value === "true") return { ok: true, corrected: true };
      if (value === "false") return { ok: true, corrected: false };
      return { ok: false, reason: `slot "${def.name}" expected boolean`, corrected: def.default ?? false };
    }
    case "number": {
      const n = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(n)) return { ok: false, reason: `slot "${def.name}" expected number`, corrected: def.default ?? 0 };
      if (def.numberType === "integer" && !Number.isInteger(n)) {
        return { ok: false, reason: `slot "${def.name}" expected integer`, corrected: Math.round(n) };
      }
      if (def.min !== undefined && n < def.min) return { ok: false, reason: `slot "${def.name}" below min ${def.min}`, corrected: def.min };
      if (def.max !== undefined && n > def.max) return { ok: false, reason: `slot "${def.name}" above max ${def.max}`, corrected: def.max };
      return { ok: true, corrected: n };
    }
    case "list": {
      if (!Array.isArray(value)) return { ok: false, reason: `slot "${def.name}" expected array, got ${typeof value}` };
      let items = value as SlotValueMap[];
      if (items.length < def.minItems) {
        // Repeat the first item (or empty) to satisfy minItems.
        const filler: SlotValueMap = items[0] ?? {};
        while (items.length < def.minItems) items = [...items, filler];
      }
      if (items.length > def.maxItems) {
        items = items.slice(0, def.maxItems);
      }
      return { ok: true, corrected: items };
    }
  }
}

// ───────────────────────────────────────────────────────────────────────
// Template rendering
//
// Templates use a deliberately small mustache-like syntax:
//
//   {{slot.headline}}                      — simple slot interpolation
//   {{slot.headline | escape}}             — explicit HTML escape (default)
//   {{slot.headline | raw}}                — opt out of escape (use sparingly)
//   {{#if slot.showLogos}}…{{/if}}         — conditional block
//   {{#each slot.features}}…{{/each}}      — list block (item refs as {{item.title}})
//
// We deliberately do NOT support arbitrary expressions, function calls,
// or imports inside templates. The whole point is the template is
// hand-written and reviewed; runtime safety comes from the assembler
// staying syntactically dumb.
// ───────────────────────────────────────────────────────────────────────

const TAG_RE = /\{\{\s*([#/]?[\w.]+(?:\s*\|\s*\w+)?)\s*\}\}/g;

interface RenderContext {
  slots: SlotValueMap;
  /** Item context for #each blocks. Lookup falls through if undefined. */
  item?: SlotValueMap;
  /** Names of list-slots being iterated so we know how to expand. */
  warnings: string[];
}

/**
 * Render a template string against a slot context. Returns the
 * assembled output (a TSX file body).
 *
 * Intentionally one-pass + simple. Templates that need complex logic
 * should be split into multiple variants in the registry.
 */
export function renderTemplate(template: string, ctx: RenderContext): string {
  // Pass 1: expand #each blocks first. Outer-most match wins.
  let out = expandEachBlocks(template, ctx);
  // Pass 2: expand #if blocks.
  out = expandIfBlocks(out, ctx);
  // Pass 3: scalar interpolation.
  out = out.replace(TAG_RE, (raw, tag: string) => {
    const [path, filter = "escape"] = tag.split("|").map((s) => s.trim());
    const value = resolvePath(path, ctx);
    if (value === undefined || value === null) {
      ctx.warnings.push(`unresolved tag {{${path}}}`);
      return "";
    }
    if (filter === "raw") return String(value);
    return escapeForJsx(String(value));
  });
  return out;
}

function expandEachBlocks(template: string, ctx: RenderContext): string {
  // Match the outer-most #each block. Use a state-machine since nested
  // blocks can't be expressed with regex alone.
  const start = template.indexOf("{{#each");
  if (start === -1) return template;

  // Find the matching {{/each}}.
  const openTag = template.match(/\{\{#each\s+([\w.]+)\s*\}\}/);
  if (!openTag) return template;
  const openLen = openTag[0].length;
  const openIdx = template.indexOf(openTag[0]);
  const innerStart = openIdx + openLen;

  let depth = 1;
  let i = innerStart;
  while (i < template.length && depth > 0) {
    if (template.startsWith("{{#each", i)) {
      depth++;
      i += 7;
    } else if (template.startsWith("{{/each}}", i)) {
      depth--;
      if (depth === 0) break;
      i += 9;
    } else {
      i++;
    }
  }
  if (depth !== 0) return template; // malformed — return as-is

  const inner = template.slice(innerStart, i);
  const after = template.slice(i + "{{/each}}".length);
  const before = template.slice(0, openIdx);

  const listPath = openTag[1];
  const list = resolvePath(listPath, ctx);
  if (!Array.isArray(list)) {
    ctx.warnings.push(`#each iterates non-array "${listPath}"`);
    return before + expandEachBlocks(after, ctx);
  }

  const expanded = list
    .map((item) =>
      expandEachBlocks(inner, { ...ctx, item: item as SlotValueMap }),
    )
    .join("");
  return before + expanded + expandEachBlocks(after, ctx);
}

function expandIfBlocks(template: string, ctx: RenderContext): string {
  const openTag = template.match(/\{\{#if\s+([\w.]+)\s*\}\}/);
  if (!openTag) return template;
  const openIdx = template.indexOf(openTag[0]);
  const innerStart = openIdx + openTag[0].length;
  let depth = 1;
  let i = innerStart;
  while (i < template.length && depth > 0) {
    if (template.startsWith("{{#if", i)) { depth++; i += 5; }
    else if (template.startsWith("{{/if}}", i)) { depth--; if (depth === 0) break; i += 7; }
    else i++;
  }
  if (depth !== 0) return template;
  const inner = template.slice(innerStart, i);
  const after = template.slice(i + "{{/if}}".length);
  const before = template.slice(0, openIdx);

  const cond = resolvePath(openTag[1], ctx);
  const keep = !!cond;
  return before + (keep ? expandIfBlocks(inner, ctx) : "") + expandIfBlocks(after, ctx);
}

function resolvePath(path: string, ctx: RenderContext): SlotValue | undefined {
  // `slot.headline`, `slot.cta.label`, `item.title`, `item.icon` — all
  // dot-separated paths into either ctx.slots or ctx.item.
  const parts = path.split(".");
  const head = parts[0];
  let cursor: SlotValue | undefined;
  if (head === "slot") cursor = ctx.slots as SlotValue;
  else if (head === "item") cursor = ctx.item as SlotValue | undefined;
  else return undefined;
  for (const p of parts.slice(1)) {
    if (cursor === null || cursor === undefined) return undefined;
    if (typeof cursor !== "object") return undefined;
    cursor = (cursor as SlotValueMap)[p];
  }
  return cursor;
}

/**
 * Escape user-provided text for safe interpolation into JSX text
 * nodes. We avoid raw `<` (would break the parser) and `{` (would be
 * read as a JSX expression boundary). Curly + angle braces escape via
 * unicode equivalents that render identically.
 *
 * Strings inside JSX attribute values are handled by the caller — the
 * template wraps them in `{"…"}` and we escape `"` and `\`.
 */
function escapeForJsx(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ───────────────────────────────────────────────────────────────────────
// Top-level assemble()
// ───────────────────────────────────────────────────────────────────────

export function assembleComponent(opts: {
  template: string;
  schema: ComponentSchema;
  slots: SlotValueMap;
}): AssemblyResult {
  const warnings: string[] = [];
  const filledFromDefault: string[] = [];

  // 1. Validate + normalise each slot.
  const validated: SlotValueMap = {};
  for (const def of opts.schema.slots) {
    const v = validateSlot(def, opts.slots[def.name]);
    if (!v.ok && v.corrected === undefined) {
      return { ok: false, reason: v.reason, warnings, filledFromDefault };
    }
    if (!v.ok) warnings.push(v.reason || `slot "${def.name}" corrected`);
    if (opts.slots[def.name] === undefined && def.default !== undefined) {
      filledFromDefault.push(def.name);
    }
    validated[def.name] = v.corrected ?? opts.slots[def.name] ?? def.default ?? "";

    // For list slots, validate each item's sub-schema too.
    if (def.type === "list") {
      const items = (validated[def.name] as SlotValueMap[]) || [];
      const corrected: SlotValueMap[] = [];
      for (const item of items) {
        const itemValidated: SlotValueMap = {};
        for (const itemDef of (def as ListSlotDef).itemSchema) {
          const iv = validateSlot(itemDef, item[itemDef.name]);
          if (!iv.ok && iv.corrected === undefined) {
            return { ok: false, reason: `list "${def.name}": ${iv.reason}`, warnings, filledFromDefault };
          }
          if (!iv.ok) warnings.push(iv.reason || `list-item slot corrected`);
          itemValidated[itemDef.name] = iv.corrected ?? item[itemDef.name] ?? itemDef.default ?? "";
        }
        corrected.push(itemValidated);
      }
      validated[def.name] = corrected;
    }
  }

  // 2. Render the template against the validated slot context.
  const code = renderTemplate(opts.template, { slots: validated, warnings });

  return { ok: true, code, warnings, filledFromDefault };
}

// ───────────────────────────────────────────────────────────────────────
// Schema → AI prompt
//
// Converts a ComponentSchema into the instruction string the customiser
// LLM sees. The AI is told the schema + given the user's brand brief,
// and must return a JSON object that fills the slots. JSON-mode +
// `response_format: { type: "json_object" }` in the Anthropic SDK call.
// ───────────────────────────────────────────────────────────────────────

export function schemaToPrompt(schema: ComponentSchema, brandBrief: string): string {
  const lines: string[] = [
    `You are filling in the content for a "${schema.name}" (${schema.category}/${schema.variant}) component.`,
    schema.description,
    "",
    `Brand brief:`,
    brandBrief,
    "",
    `Return a JSON object that fills these slots. Do not add extra keys. Do not add explanatory prose around the JSON.`,
    "",
    `Slots:`,
  ];
  for (const slot of schema.slots) {
    lines.push(slotToPromptLine(slot));
  }
  return lines.join("\n");
}

function slotToPromptLine(slot: SlotDef, indent = ""): string {
  const parts: string[] = [`${indent}- ${slot.name} (${slot.type}): ${slot.prompt}`];
  switch (slot.type) {
    case "text":
    case "richText":
      if (slot.maxLength) parts.push(`${indent}  max length ${slot.maxLength} chars`);
      break;
    case "enum":
      parts.push(`${indent}  must be one of: ${slot.values.join(", ")}`);
      break;
    case "list":
      parts.push(`${indent}  array, ${slot.minItems}-${slot.maxItems} items, each item has:`);
      for (const sub of slot.itemSchema) {
        parts.push(slotToPromptLine(sub, indent + "    "));
      }
      break;
    case "icon":
      if (slot.category) parts.push(`${indent}  category: ${slot.category}`);
      parts.push(`${indent}  use a lucide-react icon name in PascalCase, e.g. "ArrowRight"`);
      break;
    case "color":
      if (slot.allowedValues) parts.push(`${indent}  must be one of: ${slot.allowedValues.join(", ")}`);
      break;
  }
  if (slot.required) parts.push(`${indent}  REQUIRED`);
  return parts.join("\n");
}
