/**
 * Slot-Locked Composition — KILLER-MOVES-BUILDER.md #B1
 * INNOVATIONS.md §Innovation #1
 *
 * The big bet: AI never touches code. Each registry component becomes
 * a hand-written template with named slots and a JSON schema. The AI
 * customiser produces a JSON object that fills the schema. The server
 * assembles JSON + template into the final React file deterministically.
 *
 * Result: structural correctness is 100%, repair is cheap (regenerate
 * a slot, not a file), tokens drop ~70%, output is cacheable by prompt
 * hash, sites can be hot-swap-upgraded by improving the template
 * without touching the customer's content.
 *
 * Why competitors can't copy in 12 months: Bolt's ActionRunner and
 * Lovable's diff-stream are wired around streaming code-strings into
 * a code editor. Pivoting requires rewriting the core stream parser,
 * the preview pipeline, and retraining users who expect to see code.
 *
 * This file defines the type system. Assembler lives in `assembler.ts`,
 * templates live in `src/lib/component-registry/slot-locked/`.
 */

// ───────────────────────────────────────────────────────────────────────
// Slot definitions
//
// Each slot has a type, an optional set of constraints (max length,
// regex, choice enum), and a `prompt` field that tells the AI what
// kind of content belongs there. The customiser sees the schema and
// nothing else — it cannot ship code, only fill these blanks.
// ───────────────────────────────────────────────────────────────────────

export type SlotType =
  | "text"          // single-line copy. e.g. headline, button label.
  | "richText"      // multi-line copy. e.g. paragraph, testimonial.
  | "url"           // http(s) URL. validated.
  | "icon"          // lucide-react icon name. validated against allow-list.
  | "color"         // hex color or CSS var. e.g. "#b8923f" or "var(--gold)"
  | "list"          // ordered array of items (each item is its own sub-slot tree)
  | "enum"          // choice from a fixed set of values
  | "boolean"       // toggle — render variant A or B
  | "number";       // numeric value (stat counter, price)

export interface BaseSlotDef {
  /** Slot name — referenced as {{slot.name}} in the template. */
  name: string;
  /** Slot type — drives validation + UI affordances. */
  type: SlotType;
  /** Plain-English description of what content belongs here.
   *  Sent to the AI customiser as part of the prompt. */
  prompt: string;
  /** Optional default — used when no customised value is supplied
   *  (fallback for staged builds, A/B tests, registry preview pages). */
  default?: SlotValue;
  /** Whether this slot is required. Missing required slots fail
   *  assembly (with the offending slot name in the error message). */
  required?: boolean;
}

export interface TextSlotDef extends BaseSlotDef {
  type: "text" | "richText";
  /** Maximum length (post-trim). Assembler truncates with ellipsis
   *  if the AI returns over-long content (Anthropic's JSON-mode
   *  doesn't honour length constraints reliably). */
  maxLength?: number;
  /** Optional regex the value must match. Use sparingly — heavy
   *  regex constraints lower AI output quality. */
  pattern?: string;
}

export interface UrlSlotDef extends BaseSlotDef {
  type: "url";
  /** Default href when none supplied. e.g. "#" for anchor placeholders. */
  default?: string;
  /** Whether the URL must be on-domain (relative paths only).
   *  Useful for in-site links like /pricing. */
  internalOnly?: boolean;
}

export interface IconSlotDef extends BaseSlotDef {
  type: "icon";
  /** Optional category hint — "navigation" / "feature" / "action" —
   *  helps the AI pick a meaningful icon. */
  category?: string;
}

export interface ColorSlotDef extends BaseSlotDef {
  type: "color";
  /** When set, slot value MUST be one of these. Use for theme-locked
   *  accent slots: ["var(--gold)", "var(--gold-deep)", "var(--ink)"]. */
  allowedValues?: string[];
}

export interface EnumSlotDef extends BaseSlotDef {
  type: "enum";
  /** Allowed values for this slot. Assembler hard-fails if the AI
   *  returns anything else (vs text slots which truncate). */
  values: string[];
}

export interface BooleanSlotDef extends BaseSlotDef {
  type: "boolean";
}

export interface NumberSlotDef extends BaseSlotDef {
  type: "number";
  min?: number;
  max?: number;
  /** "integer" enforces whole numbers; "float" allows decimals. */
  numberType?: "integer" | "float";
}

export interface ListSlotDef extends BaseSlotDef {
  type: "list";
  /** Minimum + maximum number of items. The AI is told this range; the
   *  assembler enforces it (truncates if too many, repeats default if
   *  too few — never silently fails). */
  minItems: number;
  maxItems: number;
  /** Schema describing each item. List slots are recursive — items
   *  can contain their own sub-slots. e.g. a list of features where
   *  each feature has icon + title + description. */
  itemSchema: SlotDef[];
}

export type SlotDef =
  | TextSlotDef
  | UrlSlotDef
  | IconSlotDef
  | ColorSlotDef
  | EnumSlotDef
  | BooleanSlotDef
  | NumberSlotDef
  | ListSlotDef;

// ───────────────────────────────────────────────────────────────────────
// Slot values (the runtime payload the AI returns)
// ───────────────────────────────────────────────────────────────────────

export type SlotValue =
  | string
  | number
  | boolean
  | SlotValueMap
  | SlotValueMap[]
  | string[];

export interface SlotValueMap {
  [key: string]: SlotValue;
}

// ───────────────────────────────────────────────────────────────────────
// Component schema (the contract between the registry and the customiser)
// ───────────────────────────────────────────────────────────────────────

export interface ComponentSchema {
  /** Component id — must match the registry key. */
  id: string;
  /** Category — navbar | hero | features | testimonials | pricing | etc. */
  category: string;
  /** Variant — distinguishes multiple options in the same category. */
  variant: string;
  /** Display name for UI (registry browser, planner output). */
  name: string;
  /** Plain-English description for the planner. */
  description: string;
  /** Industry affinity hints, used by the planner to prefer this
   *  variant for matching industries. Empty array = universal. */
  industries?: string[];
  /** Theme affinity hints, used to filter on the editorial/light/warm/
   *  dark theme system. Empty array = all themes. */
  themes?: ("editorial" | "light" | "warm" | "dark")[];
  /** The slot schema the AI must fill. Order matters for UI rendering. */
  slots: SlotDef[];
}

/** Result of assembling a template + filled slots. */
export interface AssemblyResult {
  ok: boolean;
  /** When ok: the React/TSX source code. */
  code?: string;
  /** When !ok: human-readable reason for failure. */
  reason?: string;
  /** Always populated — slot validation issues found (non-fatal). */
  warnings: string[];
  /** Slots that were filled from defaults (the AI didn't provide them). */
  filledFromDefault: string[];
}

/** Validation result for a slot value against its definition. */
export interface SlotValidation {
  ok: boolean;
  reason?: string;
  /** When !ok, the corrected value the assembler will use instead
   *  (truncated text, default fallback, etc). */
  corrected?: SlotValue;
}
