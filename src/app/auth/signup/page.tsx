"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Eye, EyeOff, ArrowRight, Chrome, Check } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [oauthNotice, setOauthNotice] = useState("");

  const passwordChecks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "One uppercase", met: /[A-Z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
  ];

  const [authError, setAuthError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || "Signup failed");
        return;
      }

      try { localStorage.setItem("zoobicon_user", JSON.stringify(data.user)); } catch {}
      window.location.href = "/dashboard";
    } catch {
      setAuthError("Network error. Please try again.");
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

          <h1 className="text-3xl font-black tracking-tight mb-2">Create your account</h1>
          <p className="text-white/40 mb-8">
            Start building with the most advanced AI platform.
          </p>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => setOauthNotice("Google sign-up is coming soon. Please use email & password below.")}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-sm font-medium"
            >
              <Chrome className="w-4 h-4" />
              Sign up with Google
            </button>
            <button
              type="button"
              onClick={() => setOauthNotice("GitHub sign-up is coming soon. Please use email & password below.")}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              Sign up with GitHub
            </button>
          </div>
          {oauthNotice && (
            <p className="text-xs text-amber-400/80 text-center -mt-2 mb-4 px-2">{oauthNotice}</p>
          )}

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-xs text-white/20">or</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm
                           placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 transition-all"
              />
            </div>

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
              <label className="block text-xs font-medium text-white/40 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
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
              {password.length > 0 && (
                <div className="flex gap-3 mt-2">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className="flex items-center gap-1">
                      <Check className={`w-3 h-3 ${check.met ? "text-accent-cyan" : "text-white/15"}`} />
                      <span className={`text-[10px] ${check.met ? "text-accent-cyan" : "text-white/20"}`}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
              <span>{isLoading ? "Creating account..." : "Create free account"}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-white/20">
            By signing up you agree to our{" "}
            <Link href="/terms" className="text-white/40 hover:text-white/60">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-white/40 hover:text-white/60">Privacy Policy</Link>.
          </p>

          <p className="mt-4 text-center text-sm text-white/30">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-dark-300 to-dark-500 border-l border-white/[0.04] relative overflow-hidden">
        <div className="glow-orb glow-orb-purple w-[400px] h-[400px] top-1/4 right-1/4 opacity-20" />
        <div className="glow-orb glow-orb-cyan w-[300px] h-[300px] bottom-1/4 left-1/4 opacity-15" />
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="text-5xl font-black tracking-tight mb-6 gradient-text-hero">
            Build. Create. Dominate.
          </div>
          <div className="space-y-3">
            {[
              "AI Website Builder",
              "SEO Campaign Agent",
              "AI Video Creator",
              "8+ AI-Powered Products",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 justify-center">
                <div className="w-5 h-5 rounded-full bg-accent-cyan/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-accent-cyan" />
                </div>
                <span className="text-sm text-white/50">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
