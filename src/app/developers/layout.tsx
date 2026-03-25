import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Tools & REST API | Zoobicon",
  description:
    "Build and deploy websites programmatically with the Zoobicon REST API, CLI tools, and GitHub integration. Full developer documentation and SDK.",
  openGraph: {
    title: "Developer Tools & REST API | Zoobicon",
    description:
      "Build and deploy websites programmatically with the Zoobicon REST API, CLI tools, and GitHub integration. Full developer documentation and SDK.",
    url: "https://zoobicon.com/developers",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/developers" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
