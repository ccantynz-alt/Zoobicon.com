"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Zap,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [envInstruction, setEnvInstruction] = useState("");

  const checks = [
    { label: "12+ characters", met: password.length >= 12 },
    { label: "One uppercase", met: /[A-Z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
    { label: "Passwords match", met: password.length > 0 && password === confirm },
  ];
  const allMet = checks.every((c) => c.met);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No reset token found. Please request a new password reset link.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allMet) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      } else {
        setStatus("success");
        setMessage(data.message || "Password reset successfully.");
        if (data.envInstruction) setEnvInstruction(data.envInstruction);
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Zoobicon</span>
          </Link>

          {status === "success" ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-cyan/10 to-stone-500/10 border border-accent-cyan/20 mb-6">
                <CheckCircle2 className="w-8 h-8 text-accent-cyan" />
              </div>
              <h1 className="text-2xl font-black tracking-tight mb-3">Password reset</h1>
              <p className="text-white/50 text-sm mb-6">{message}</p>

              {envInstruction && (
                <div className="mb-6 p-4 rounded-xl border border-stone-500/20 bg-stone-500/5 text-left">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-stone-400/80 font-medium">Admin — update Vercel env var then redeploy</p>
                  </div>
                  <code className="block text-xs font-mono text-stone-400 bg-dark-400/50 rounded-lg p-3 break-all">
                    {envInstruction}
                  </code>
                </div>
              )}

              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-sm font-bold text-white"
              >
                Go to sign in
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : status === "error" && !token ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-500/10 border border-stone-500/20 mb-6">
                <XCircle className="w-8 h-8 text-stone-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tight mb-3">Invalid link</h1>
              <p className="text-white/50 text-sm mb-6">{message}</p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center gap-2 btn-gradient px-6 py-3 rounded-xl text-sm font-bold text-white"
              >
                Request new link
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-black tracking-tight mb-2">Choose new password</h1>
              <p className="text-white/50 mb-8 text-sm">
                Your reset link is valid. Enter a strong new password below.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 12 characters"
                      required
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 pr-10 text-sm
                                 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/50"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Confirm password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your new password"
                    required
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm
                               placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 transition-all"
                  />
                </div>

                {/* Strength checks */}
                {password.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {checks.map((c) => (
                      <div key={c.label} className="flex items-center gap-1.5">
                        <CheckCircle2 className={`w-3 h-3 flex-shrink-0 ${c.met ? "text-accent-cyan" : "text-white/15"}`} />
                        <span className={`text-[10px] ${c.met ? "text-accent-cyan" : "text-white/50"}`}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {status === "error" && message && (
                  <p className="text-sm text-stone-400/80 text-center py-1">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !allMet}
                  className="w-full btn-gradient px-4 py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2
                             disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                >
                  <span>{isLoading ? "Resetting..." : "Reset password"}</span>
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Right visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-dark-300 to-dark-500 border-l border-white/[0.04] relative overflow-hidden">
        <div className="glow-orb glow-orb-blue w-[400px] h-[400px] top-1/4 right-1/4 opacity-20" />
        <div className="glow-orb glow-orb-purple w-[300px] h-[300px] bottom-1/4 left-1/4 opacity-15" />
        <div className="relative z-10 text-center max-w-md px-8">
          <div className="text-5xl font-black tracking-tight mb-4 gradient-text-hero">
            Secure by design.
          </div>
          <p className="text-white/50 text-lg">
            Your new password is protected with industry-standard encryption.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-dark-400">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple animate-pulse" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
