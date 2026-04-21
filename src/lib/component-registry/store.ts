/**
 * Registry store — isolated from index.ts to prevent circular-import TDZ.
 * Category files (navbars.ts, heroes.ts, etc.) import from here, not from
 * index.ts, so they can run their top-level registerComponent() calls
 * without racing index.ts's own const initialization.
 */

export interface RegistryComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  variant: string;
  description: string;
  code: string;
  tags: string[];
}

export type ComponentCategory =
  | "navbar"
  | "hero"
  | "features"
  | "testimonials"
  | "pricing"
  | "stats"
  | "faq"
  | "cta"
  | "footer"
  | "about"
  | "contact"
  | "gallery"
  | "blog"
  | "ecommerce"
  | "forms"
  | "misc";

export const REGISTRY: RegistryComponent[] = [];

/**
 * Register a component into the global registry.
 * Called by each category file at import time.
 */
export function registerComponent(component: RegistryComponent): void {
  if (!REGISTRY.find((c) => c.id === component.id)) {
    REGISTRY.push(component);
  }
}
