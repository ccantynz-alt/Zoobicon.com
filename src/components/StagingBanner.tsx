"use client";

/**
 * Staging Banner — bright yellow bar at the top of every page on preview/staging deployments.
 * Invisible in production. Impossible to miss on staging.
 * Prevents anyone from confusing a staging deployment with the live site.
 */
export default function StagingBanner() {
  // VERCEL_ENV is only available server-side, but NEXT_PUBLIC_ vars are available client-side
  // We use a different check: if the hostname is NOT a known production domain, show the banner
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;
  const isProduction =
    hostname === "zoobicon.com" ||
    hostname === "zoobicon.ai" ||
    hostname === "zoobicon.io" ||
    hostname === "zoobicon.sh" ||
    hostname === "dominat8.io" ||
    hostname === "dominat8.com" ||
    hostname === "www.zoobicon.com";

  if (isProduction || hostname === "localhost") return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "linear-gradient(90deg, #f59e0b, #d97706)",
        color: "#000",
        textAlign: "center",
        padding: "6px 16px",
        fontSize: "13px",
        fontWeight: 700,
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        letterSpacing: "0.02em",
      }}
    >
      ⚠️ STAGING ENVIRONMENT — Changes here do not affect production
      <a
        href="https://zoobicon.com"
        style={{
          marginLeft: 12,
          color: "#000",
          textDecoration: "underline",
          fontWeight: 600,
        }}
      >
        View Production →
      </a>
    </div>
  );
}
