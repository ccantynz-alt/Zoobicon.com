/**
 * Environment detection for staging vs production.
 *
 * Uses Vercel's built-in VERCEL_ENV variable:
 * - "production" — live site at zoobicon.com
 * - "preview" — PR preview deployments (staging)
 * - "development" — local dev (npm run dev)
 *
 * Critical for:
 * - Preventing agents from running on staging
 * - Preventing real emails from being sent on staging
 * - Showing staging banner on preview deployments
 * - Using test Stripe keys on preview
 */

type Environment = "production" | "preview" | "development";

export function getEnvironment(): Environment {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "production") return "production";
  if (vercelEnv === "preview") return "preview";
  if (process.env.NODE_ENV === "production" && !vercelEnv) return "production";
  return "development";
}

export function isProduction(): boolean {
  return getEnvironment() === "production";
}

export function isPreview(): boolean {
  return getEnvironment() === "preview";
}

export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

export function getBaseUrl(): string {
  if (isProduction()) {
    return process.env.NEXT_PUBLIC_APP_URL || "https://zoobicon.com";
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function getEnvironmentLabel(): string {
  const env = getEnvironment();
  if (env === "production") return "Production";
  if (env === "preview") return "Staging";
  return "Development";
}
