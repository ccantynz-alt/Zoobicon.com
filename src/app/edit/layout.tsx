import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Editor — Edit Your Website | Zoobicon",
  description:
    "Edit your deployed website in real-time. Visual editor, code editor, AI chat editing, version history, and 16+ sidebar tools. Make changes and publish instantly.",
  openGraph: {
    title: "Live Editor — Edit Your Website | Zoobicon",
    description:
      "Edit your deployed website in real-time with visual editing, AI chat, code editor, and version history.",
    url: "https://zoobicon.com/edit",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
