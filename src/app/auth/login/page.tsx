"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Eye, EyeOff, ArrowRight, Chrome } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [authError, setAuthError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    try {
      // Try admin login first
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const { user } = await res.json();
        localStorage.setItem("zoobicon_user", JSON.stringify(user));
        window.location.href = "/dashboard";
        return;
      }

      if (res.status === 401) {
        // Fall through to regular user login (demo mode)
        localStorage.setItem(
          "zoobicon_user",
          JSON.stringify({ email, name: email.split("@")[0], role: "user", plan: "free" })
        );
        window.location.href = "/dashboard";
        return;
      }

      const data = await res.json();
      setAuthError(data.error || "Sign in failed");
    } catch {
      // Network error – fall back to demo login
      localStorage.setItem(
        "zoobicon_user",
        JSON.stringify({ email, name: email.split("@")[0], role: "user", plan: "free" })
      );
      window.location.href = "/dashboard";
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Zoobicon</span>
          </Link>

          <h1 className="text-3xl font-black tracking-tight mb-2">Welcome back</h1>
          <p className="text-white/40 mb-8">
            Sign in to your account to continue building.
          </p>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-sm font-medium">
              <Chrome className="w-4 h-4" />
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              Continue with GitHub
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/20">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm
                           placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-white/40">Password</label>
                <a href="#" className="text-xs text-brand-400 hover:text-brand-300">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 pr-10 text-sm
                             placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <p className="text-sm text-red-400/80 text-center py-2">{authError}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-gradient px-4 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              <span>{isLoading ? "Signing in..." : "Sign in"}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign up free
            </Link>
          </p>
        </div>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-dark-300 to-dark-500 border-l border-white/[0.04] relative overflow-hidden">
        <div className="glow-orb glow-orb-blue w-[400px] h-[400px] top-1/4 right-1/4 opacity-20" />
        <div className="glow-orb glow-orb-purple w-[300px] h-[300px] bottom-1/4 left-1/4 opacity-15" />
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="text-5xl font-black tracking-tight mb-4 gradient-text-hero">
            Build Empires
          </div>
          <p className="text-white/40 text-lg">
            The most advanced AI platform for creating, marketing, and dominating the digital landscape.
          </p>
        </div>
      </div>
    </div>
  );
}
