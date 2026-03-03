import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zoobicon - AI Website Builder",
  description: "Describe a website and watch it come to life. Powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fafbfc]">
        {children}
      </body>
    </html>
  );
}
