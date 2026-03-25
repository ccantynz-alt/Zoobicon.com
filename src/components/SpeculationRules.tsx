"use client";

/**
 * Speculation Rules API — pre-renders pages the user is likely to visit.
 * Supported in Chrome 108+, Edge 108+. Gracefully ignored in other browsers.
 *
 * This gives near-instant page transitions for internal navigation,
 * dramatically improving Core Web Vitals and conversion rates.
 */
export default function SpeculationRules() {
  return (
    <script
      type="speculationrules"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          prerender: [
            {
              where: {
                and: [
                  { href_matches: "/*" },
                  { not: { href_matches: "/api/*" } },
                  { not: { href_matches: "/admin/*" } },
                  { not: { href_matches: "/auth/*" } },
                  { not: { href_matches: "/edit/*" } },
                  { not: { href_matches: "/dashboard" } },
                  { not: { selector_matches: "[data-no-prerender]" } },
                ]
              },
              eagerness: "moderate"
            }
          ],
          prefetch: [
            {
              where: {
                and: [
                  { href_matches: "/*" },
                  { not: { href_matches: "/api/*" } },
                ]
              },
              eagerness: "moderate"
            }
          ]
        })
      }}
    />
  );
}
