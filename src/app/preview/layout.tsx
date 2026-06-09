import type { Metadata } from "next";

// Standalone preview of the ZOOBICON BOLD homepage (Rule 37).
// noindex so this staging surface never competes with the live "/" page
// in search while it's under review. Promote by swapping into src/app/page.tsx.
export const metadata: Metadata = {
  title: "Zoobicon — Describe it. Watch it build. Ship it.",
  description:
    "The AI website builder that ships a production-ready React site in seconds. Six agents, 118 components, live preview, and hosting + domain in one flow.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/preview" },
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
