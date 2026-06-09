import Link from "next/link";

/**
 * 404 — Rule 29 editorial-light palette only.
 * Background: --paper (warm bone). Display numeral: ink with a soft
 * champagne shadow. CTAs: filled ink + outlined hairline. No
 * gradients, no purple, no neon shadows.
 */
export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <div className="text-center max-w-lg">
        <div
          className="text-[120px] md:text-[160px] font-black tracking-[-0.06em] leading-none mb-4"
          style={{
            // The display numeral IS the brand — sandy champagne gradient
            // (lighter sand at top → deeper bronze at bottom) so it reads
            // as Zoobicon on first glance, not as a generic 404.
            background: "linear-gradient(180deg, #e4ff6b 0%, #d4f24e 55%, #a9c43a 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </div>
        <h1
          className="text-2xl md:text-3xl font-bold mb-3 tracking-tight"
          style={{ color: "var(--ink)" }}
        >
          Page not found
        </h1>
        <p
          className="mb-8 leading-relaxed"
          style={{ color: "var(--ink-muted)" }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            Back to Home
          </Link>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all border"
            style={{
              color: "var(--ink)",
              background: "var(--paper-elevated)",
              borderColor: "var(--rule)",
            }}
          >
            Try the Builder
          </Link>
        </div>
      </div>
    </div>
  );
}
