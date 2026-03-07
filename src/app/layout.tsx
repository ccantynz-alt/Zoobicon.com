import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZOOBICON — AI Website Builder",
  description:
    "Build stunning websites with AI. Describe what you want, Zoobicon brings it to life.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="scan-lines">{children}</body>
    </html>
  );
}
