import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zoobicon - The Future of AI-Powered Web Creation",
  description:
    "Build stunning websites, dominate SEO, create viral videos, and automate your entire digital presence with the most advanced AI agents on the planet.",
  keywords: [
    "AI website builder",
    "AI SEO",
    "AI video creator",
    "website generator",
    "AI marketing",
    "Zoobicon",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#050507] text-[#f0f0f2] antialiased">
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}
