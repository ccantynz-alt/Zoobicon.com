"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { safeRedirect } from "@/lib/safe-redirect";
import {
  Zap,
  Eye,
  EyeOff,
  ArrowRight,
  Globe2,
} from "lucide-react";

const OAUTH_ERRORS: Record<string, string> = {
  no_code: "Authentication was cancelled. Please try again.",
  oauth_not_configured: "OAuth is not configured yet. Please use email & password.",
  github_oauth_not_configured: "GitHub sign-in is not set up yet. Please use email & password or contact support.",
  google_oauth_not_configured: "Google sign-in is not set up yet. Please use email & password or contact support.",
  invalid_state: "Your sign-in session expired or was tampered with. Please try again.",
  token_exchange_failed: "Authentication failed. Please try again.",
  user_info_failed: "Could not retrieve your profile. Please try again.",
  no_email: "No email found on your account. Please use email & password.",
  oauth_failed: "Sign-in failed. Please try again or use email & password.",
  invalid_callback: "Something went wrong. Please try again.",
  no_user_data: "Authentication incomplete. Please try again.",
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [authError, setAuthError] = useState("");
  const [oauthNotice, setOauthNotice] = useState("");

  useEffect(() => {
    const error = searchParams.get("error");
    if (error && OAUTH_ERRORS[error]) {
      setOauthNotice(OAUTH_ERRORS[error]);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        try { localStorage.setItem("zoobicon_user", JSON.stringify(data.user)); } catch {}
        // Honor ?redirect param — the builder + marketplace + any gated page
        // sends users here with their original destination. Dropping them on
        // /dashboard instead breaks the flow and feels like a loop.
        // safeRedirect blocks open-redirect phishing (//evil.com, /\evil.com,
        // /%2f%2fevil.com, etc.) and falls back to /dashboard when unsafe.
        window.location.href = safeRedirect(searchParams.get("redirect"));
        return;
      }

      setAuthError(data.error || "Invalid credentials");
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex relative"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #d4b86d, #b8923f)",
              }}
            >
              <Zap className="w-4 h-4" style={{ color: "var(--paper)" }} />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: "var(--ink)" }}>Zoobicon</span>
          </Link>

          <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: "var(--ink)" }}>Welcome back</h1>
          <p className="mb-8" style={{ color: "var(--ink-muted)" }}>
            Sign in to your account to continue building.
          </p>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <a
              href="/api/auth/oauth/google"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--rule)",
                color: "var(--ink)",
              }}
            >
              <Globe2 className="w-4 h-4" />
              Continue with Google
            </a>
            <a
              href="/api/auth/oauth/github"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: "var(--paper-elevated)",
                border: "1px solid var(--rule)",
                color: "var(--ink)",
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              Continue with GitHub
            </a>
          </div>
          {oauthNotice && (
            <p className="text-xs text-center -mt-2 mb-4 px-2" style={{ color: "var(--gold-deep)" }}>{oauthNotice}</p>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ background: "var(--rule)" }} />
            <span className="text-xs" style={{ color: "var(--ink-muted)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--rule)" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--ink-secondary)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
                style={{
                  background: "var(--paper-elevated)",
                  border: "1px solid var(--rule)",
                  color: "var(--ink)",
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--ink-secondary)" }}>Password</label>
                <Link href="/auth/forgot-password" className="text-xs hover:underline" style={{ color: "var(--gold-deep)" }}>Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none transition-all"
                  style={{
                    background: "var(--paper-elevated)",
                    border: "1px solid var(--rule)",
                    color: "var(--ink)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <p className="text-sm text-center py-2" style={{ color: "var(--gold-deep)" }}>{authError}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed mt-2 transition-all"
              style={{
                background: "var(--ink)",
                color: "var(--paper)",
              }}
            >
              <span>{isLoading ? "Signing in..." : "Sign in"}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--ink-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link
              href={(() => {
                // Preserve ?redirect= when toggling to signup so users keep
                // their original destination across both forms.
                const r = searchParams.get("redirect");
                return r && r.startsWith("/") && !r.startsWith("//")
                  ? `/auth/signup?redirect=${encodeURIComponent(r)}`
                  : "/auth/signup";
              })()}
              className="font-medium hover:underline"
              style={{ color: "var(--gold-deep)" }}
            >
              Sign up free
            </Link>
          </p>

          <div className="mt-4 pt-4 text-center" style={{ borderTop: "1px solid var(--rule)" }}>
            <Link
              href="/admin-recover"
              className="text-xs hover:underline transition-colors"
              style={{ color: "var(--ink-muted)" }}
            >
              Admin locked out? Use recovery token →
            </Link>
          </div>
        </div>
      </div>

      {/* Right - Visual */}
      <div
        className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, var(--paper-elevated) 0%, var(--paper-bright) 100%)",
          borderLeft: "1px solid var(--rule)",
        }}
      >
        {/* Soft champagne glow accents — replaced the old blue/purple glow orbs. */}
        <div
          className="pointer-events-none absolute w-[400px] h-[400px] top-1/4 right-1/4 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(184, 146, 63, 0.18), transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="pointer-events-none absolute w-[300px] h-[300px] bottom-1/4 left-1/4 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(212, 184, 109, 0.14), transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div className="relative z-10 text-center max-w-md px-8">
          <div
            className="text-5xl font-black tracking-tight mb-4"
            style={{
              background: "linear-gradient(135deg, #d4b86d, #b8923f, #8c6b25)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Build Empires
          </div>
          <p className="text-lg" style={{ color: "var(--ink-secondary)" }}>
            The most advanced AI platform for creating, marketing, and dominating the digital landscape.
          </p>
        </div>
      </div>
    </div>
  );
}
