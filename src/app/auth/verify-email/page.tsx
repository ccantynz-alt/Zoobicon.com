"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "true";
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [emailInput, setEmailInput] = useState(email);

  async function handleResend() {
    if (!emailInput) {
      setResendMessage("Please enter your email address.");
      return;
    }
    setResending(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await res.json();
      setResendMessage(data.message || data.error || "Email sent.");
    } catch {
      setResendMessage("Failed to send. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#1e293b] rounded-2xl p-8 shadow-2xl border border-white/10">
          {expired ? (
            <>
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Link Expired</h1>
              <p className="text-slate-400 mb-6">
                Your verification link has expired. Enter your email below to get a new one.
              </p>
            </>
          ) : (
            <>
              <Mail className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Check Your Email</h1>
              <p className="text-slate-400 mb-6">
                We sent a verification link to your email. Click the link to activate your account and start building.
              </p>
            </>
          )}

          <div className="space-y-4">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-[#0f172a] border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {resending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {resending ? "Sending..." : "Resend Verification Email"}
            </button>

            {resendMessage && (
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-[#0f172a] rounded-lg p-3">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                {resendMessage}
              </div>
            )}
          </div>

          <p className="text-slate-500 text-sm mt-6">
            Already verified?{" "}
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
