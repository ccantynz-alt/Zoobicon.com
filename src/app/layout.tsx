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
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b11" },
    { media: "(prefers-color-scheme: light)", color: "#0b0b11" },
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
        {/* Critical inline styles — guarantees dark bg even before CSS bundle loads */}
        <style dangerouslySetInnerHTML={{ __html: `html,body{background:#0b0b11;color:#e4e4e7;margin:0;font-family:system-ui,-apple-system,sans-serif}` }} />
        {/* Preconnect to Google Fonts CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Async font loading — never blocks rendering */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap';document.head.appendChild(l)})()` }} />
        {/* Fallback for users with JS disabled */}
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
            rel="stylesheet"
          />
        </noscript>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="msapplication-TileColor" content="#0b0b11" />
        <meta name="msapplication-config" content="none" />
      </head>
      <body className="grain">{children}</body>
    </html>
  );
}
