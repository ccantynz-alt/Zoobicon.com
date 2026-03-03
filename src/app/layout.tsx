import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZOOBICON // AI Website Builder",
  description: "Build websites from the future. Powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="scan-lines cyber-grid min-h-screen">
        {children}
      </body>
    </html>
  );
}
