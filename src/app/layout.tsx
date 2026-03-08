import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZOOBICON — AI Website Builder",
  description:
    "Build stunning websites with AI. Describe what you want, Zoobicon brings it to life.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zoobicon",
  },
  formatDetection: {
    telephone: false, // Prevent iOS from auto-linking phone numbers
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover", // Extend content into safe areas (iPhone notch, Dynamic Island)
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#0a0a0f" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* iOS splash screens & icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Windows tile color */}
        <meta name="msapplication-TileColor" content="#0a0a0f" />
        <meta name="msapplication-config" content="none" />
      </head>
      <body className="scan-lines">{children}</body>
    </html>
  );
}
