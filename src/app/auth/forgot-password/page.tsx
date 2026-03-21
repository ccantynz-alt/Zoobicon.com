"use client";

import { useState } from "react";
import Link from "next/link";
import BackgroundEffects from "@/components/BackgroundEffects";
import { Zap, ArrowRight, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Always show success regardless of whether account exists (security best practice)
      if (res.ok || res.status === 404) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative">
      <BackgroundEffects preset="minimal" />
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Zoobicon</span>
          </Link>

          {submitted ? (
            /* Success state */
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/10 to-accent-purple/10 border border-brand-500/20 mb-6">
                <CheckCircle2 className="w-8 h-8 text-brand-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tight mb-3">Check your email</h1>
              <p className="text-white/50 text-sm mb-2">
                If an account exists for <span className="text-white/60">{email}</span>, we&apos;ve sent a password reset link.
              </p>
              <p className="text-white/50 text-xs mb-8">
                Didn&apos;t receive it? Check your spam folder or try again in a few minutes.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { setSubmitted(false); setEmail(""); }}
                  className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-sm font-medium"
                >
                  Try a different email
                </button>
                <Link
                  href="/auth/login"
                  className="w-full flex items-center justify-center gap-2 btn-gradient px-4 py-3 rounded-xl text-sm font-bold text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            /* Form state */
            <>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white/60 transition-colors mb-8"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>

              <h1 className="text-3xl font-black tracking-tight mb-2">Reset your password</h1>
              <p className="text-white/50 mb-8 text-sm">
                Enter the email address for your account and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-9 pr-4 py-3 text-sm
                                 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-400/80 text-center py-1">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-gradient px-4 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  <span>{isLoading ? "Sending..." : "Send reset link"}</span>
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-white/50">
                Remember your password?{" "}
                <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
                  Sign in
                </Link>
              </p>
            </>
          )}
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
          <p className="text-white/50 text-lg">
            The most advanced AI platform for creating, marketing, and dominating the digital landscape.
          </p>
        </div>
      </div>
    </div>
  );
}
