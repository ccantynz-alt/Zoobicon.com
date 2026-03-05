"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Shield,
  User,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";

type StoredUser = {
  email: string;
  name: string;
  role: "user" | "admin";
  plan: "free" | "unlimited";
};

export default function SettingsPage() {
  const [user, setUser] = useState<StoredUser | null>(null);

  // Change-password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [envInstruction, setEnvInstruction] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("zoobicon_user");
      if (raw) setUser(JSON.parse(raw));
      else window.location.href = "/auth/login";
    } catch {
      window.location.href = "/auth/login";
    }
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    setEnvInstruction("");

    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 12) {
      setPwError("New password must be at least 12 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setPwSuccess(true);
        setEnvInstruction(data.envInstruction || "");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwError(data.error || "Failed to change password.");
      }
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`ADMIN_PASSWORD=${newPassword || envInstruction}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050507]">
      {/* Nav */}
      <nav className="border-b border-white/[0.04] bg-[#050507]/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-white/30 hover:text-white/60 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-base font-bold tracking-tight">Zoobicon</span>
            </Link>
          </div>
          <span className="text-sm text-white/30">Settings</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Account info */}
        <section className="gradient-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-purple/20 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-400" />
            </div>
            <h2 className="text-base font-bold">Account</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-white/30 mb-1">Name</div>
              <div className="font-medium">{user.name}</div>
            </div>
            <div>
              <div className="text-xs text-white/30 mb-1">Email</div>
              <div className="font-medium">{user.email}</div>
            </div>
            <div>
              <div className="text-xs text-white/30 mb-1">Role</div>
              <div className={`font-medium ${user.role === "admin" ? "text-brand-400" : ""}`}>
                {user.role === "admin" ? "Admin" : "User"}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/30 mb-1">Plan</div>
              <div className={`font-medium ${user.plan === "unlimited" ? "text-brand-400" : ""}`}>
                {user.plan === "unlimited" ? "Unlimited" : "Free"}
              </div>
            </div>
          </div>
        </section>

        {/* Change Password — admin only */}
        {user.role === "admin" ? (
          <section className="gradient-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-purple/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-brand-400" />
              </div>
              <h2 className="text-base font-bold">Change Admin Password</h2>
            </div>
            <p className="text-xs text-white/30 mb-5 ml-12">
              After confirming your current password you&apos;ll get the exact value to set in your deployment.
            </p>

            {pwSuccess ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-semibold text-brand-300 mb-1">Password validated</div>
                    <div className="text-white/50">
                      Your new password has been confirmed. Update the{" "}
                      <code className="text-brand-400 text-xs">ADMIN_PASSWORD</code> environment variable
                      in your deployment to activate it:
                    </div>
                  </div>
                </div>

                {envInstruction && (
                  <div className="relative">
                    <pre className="text-xs bg-dark-200 border border-white/[0.06] rounded-xl px-4 py-3 pr-12 text-brand-300 overflow-x-auto">
                      {envInstruction}
                    </pre>
                    <button
                      onClick={handleCopy}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                      title="Copy"
                    >
                      {copied ? <Check className="w-4 h-4 text-brand-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400/60 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-white/30">
                    On <strong className="text-white/50">Vercel</strong>: Settings → Environment Variables → update <code className="text-amber-300/70">ADMIN_PASSWORD</code> then redeploy.
                    On <strong className="text-white/50">Render</strong>: Dashboard → Environment → update the variable (no redeploy needed).
                  </p>
                </div>

                <button
                  onClick={() => { setPwSuccess(false); setEnvInstruction(""); }}
                  className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Change again
                </button>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Current password</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 pr-10 text-sm
                                 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 12 characters"
                      required
                      minLength={12}
                      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 pr-10 text-sm
                                 placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm
                               placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500/30 transition-all"
                  />
                </div>

                {pwError && (
                  <div className="flex items-center gap-2 text-sm text-red-400/80">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    {pwError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-gradient px-4 py-3 rounded-xl text-sm font-bold text-white
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Verifying..." : "Confirm password change"}
                </button>
              </form>
            )}
          </section>
        ) : (
          /* Regular user — forgot password prompt */
          <section className="gradient-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-purple/20 flex items-center justify-center">
                <Shield className="w-4 h-4 text-brand-400" />
              </div>
              <h2 className="text-base font-bold">Password</h2>
            </div>
            <p className="text-sm text-white/40 mb-4">
              Need to reset your password? We&apos;ll email you a secure reset link.
            </p>
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-sm font-medium"
            >
              Send reset link
            </Link>
          </section>
        )}

        <div className="text-center">
          <Link href="/dashboard" className="text-sm text-white/30 hover:text-white/60 transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
