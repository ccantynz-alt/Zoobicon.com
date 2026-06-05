/**
 * hero-restaurant-warm — slot-locked variant tuned for restaurants.
 *
 * Warm cream + amber palette (theme: "warm"), Playfair italic accent,
 * sensory copy expected. Photo-on-the-right two-column layout with
 * reservation CTA. Slots match hero-spotlight where possible so the
 * planner can swap them; restaurant-specific additions: cuisineType,
 * heroPhotoUrl, hoursLine.
 */

import type { ComponentSchema } from "../../types";

export const HERO_RESTAURANT_WARM_SCHEMA: ComponentSchema = {
  id: "hero-restaurant-warm-slot",
  category: "hero",
  variant: "restaurant-warm",
  name: "Hero — restaurant (warm)",
  description: "Two-column hero for restaurants. Headline + cuisine kicker + sensory subhead + reservation CTA on the left; food photo on the right. Warm theme.",
  industries: ["restaurant", "hospitality"],
  themes: ["warm"],
  slots: [
    {
      name: "cuisineType",
      type: "text",
      prompt: "Cuisine kicker. ALL CAPS, letter-spaced. e.g. 'NEAPOLITAN ITALIAN', 'COASTAL JAPANESE', 'NEIGHBOURHOOD BISTRO'.",
      maxLength: 32,
      required: true,
    },
    {
      name: "restaurantName",
      type: "text",
      prompt: "The restaurant's name as it appears on the door. 1-3 words. Wrap one in <em>…</em> for the Playfair italic accent.",
      maxLength: 60,
      required: true,
    },
    {
      name: "tagline",
      type: "richText",
      prompt: "Sensory tagline. 1-2 sentences. Name real dishes, ingredients, rooms, or experiences. Avoid 'best', 'finest', 'authentic'.",
      maxLength: 220,
      required: true,
    },
    {
      name: "reserveLabel",
      type: "text",
      prompt: "Primary CTA label. Verb-led. e.g. 'Book a table', 'Reserve tonight'.",
      maxLength: 24,
      default: "Book a table",
    },
    {
      name: "reserveHref",
      type: "url",
      prompt: "Primary CTA href. /reservations, /book, or an external booking link.",
      default: "/reservations",
    },
    {
      name: "menuLabel",
      type: "text",
      prompt: "Secondary CTA label.",
      maxLength: 24,
      default: "See menu",
    },
    {
      name: "menuHref",
      type: "url",
      prompt: "Secondary CTA href.",
      default: "/menu",
    },
    {
      name: "hoursLine",
      type: "text",
      prompt: "Short opening hours line. e.g. 'Dinner Tues-Sat from 5:30pm · Sunday roast from noon'.",
      maxLength: 100,
      default: "Open daily from 5pm",
    },
    {
      name: "heroPhotoUrl",
      type: "url",
      prompt: "Hero photograph URL. Should be a food/room/atmosphere shot, not a stock photo. If unknown, leave empty — a tasteful warm gradient placeholder ships in its place.",
      default: "",
    },
  ],
};

export const HERO_RESTAURANT_WARM_TEMPLATE = `import React from "react";

export default function HeroRestaurantWarm() {
  const photoUrl = "{{slot.heroPhotoUrl | raw}}";

  return (
    <section
      className="relative px-6 py-20 sm:py-28"
      style={{ background: "linear-gradient(180deg, #fdf8ee 0%, #fbf2dc 100%)", color: "#3a2410" }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          <div className="mb-5 inline-flex items-center gap-2">
            <span className="h-px w-8" style={{ background: "#c1853f" }} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "#8a5a1f" }}>
              {{slot.cuisineType}}
            </span>
          </div>
          <h1
            className="mb-6 text-balance text-5xl tracking-tight sm:text-6xl"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              color: "#2a1908",
              fontWeight: 600,
              lineHeight: 1.05,
            }}
            dangerouslySetInnerHTML={{ __html: "{{slot.restaurantName | raw}}" }}
          />
          <p
            className="mb-8 max-w-md text-pretty text-lg leading-relaxed"
            style={{ color: "#5a3a1c" }}
          >
            {{slot.tagline}}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="{{slot.reserveHref | raw}}"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: "#2a1908", color: "#fdf8ee" }}
            >
              {{slot.reserveLabel}}
            </a>
            <a
              href="{{slot.menuHref | raw}}"
              className="inline-flex items-center gap-1.5 px-3 py-3 text-sm font-medium underline-offset-4 transition-colors hover:underline"
              style={{ color: "#5a3a1c" }}
            >
              {{slot.menuLabel}} →
            </a>
          </div>
          <p className="mt-8 text-xs uppercase tracking-[0.18em]" style={{ color: "#8a5a1f" }}>
            {{slot.hoursLine}}
          </p>
        </div>

        <div className="relative">
          <div
            className="relative aspect-[4/5] overflow-hidden rounded-2xl"
            style={{
              background: photoUrl
                ? \`url(\${photoUrl}) center/cover\`
                : "linear-gradient(135deg, #e9c89b 0%, #c89967 50%, #8b6539 100%)",
              boxShadow: "0 24px 60px -20px rgba(60, 36, 16, 0.35), 0 4px 12px rgba(60, 36, 16, 0.15)",
            }}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg, transparent 60%, rgba(42, 25, 8, 0.45) 100%)",
              }}
            />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-6 -right-6 -z-10 h-32 w-32 rounded-full"
            style={{ background: "rgba(193, 133, 63, 0.25)", filter: "blur(40px)" }}
          />
        </div>
      </div>
    </section>
  );
}
`;

export const HERO_RESTAURANT_WARM_EXAMPLE = {
  cuisineType: "NEAPOLITAN ITALIAN",
  restaurantName: "Trattoria <em>Bellini</em>",
  tagline:
    "Wood-fired pizza, slow-braised ragù, and a wine list that reads like a love letter to Campania. Forty seats, one open kitchen, no shortcuts.",
  reserveLabel: "Book a table",
  reserveHref: "/reservations",
  menuLabel: "See menu",
  menuHref: "/menu",
  hoursLine: "Dinner Tues–Sat from 5:30pm · Sunday roast from noon",
  heroPhotoUrl: "",
};
