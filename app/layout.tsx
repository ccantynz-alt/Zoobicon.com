import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zoobicon — The AI Website Builder from the Future",
  description:
    "Zoobicon is a futuristic AI-powered platform that builds stunning websites through intelligent automation. Describe what you want — Zoobicon brings it to life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
