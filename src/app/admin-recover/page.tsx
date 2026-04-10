"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, KeyRound, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

/**
 * Emergency admin recovery.
 *
 * This page lives OUTSIDE /admin/* on purpose so it doesn't get wrapped
 * by the admin layout (which would require auth to reach).
 *
 * Flow:
 *   1. Craig sets ADMIN_RECOVERY_TOKEN + ADMIN_EMAIL in Vercel env vars.
 *   2. Visits /admin-recover.
 *   3. Pastes the token. On success, admin session is written into
 *      localStorage and Craig lands in the admin dashboard.
 *
 * THE IRON LAW: admin must never be locked out.
 */
export default function AdminRecoverPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState<{
    configured: boolean;
    adminEmailSet: boolean;
    recoveryTokenSet: boolean;
  } | null>(null);

  useEffect(() => {
    // Probe configuration so Craig knows BEFORE trying whether the
    // server is set up for recovery at all.
    fetch("/api/auth/admin-recover")
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => setConfig({ configured: false, adminEmailSet: false, recoveryTokenSet: false }));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin-recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Recovery failed (${res.status})`);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Recovery response was invalid. Please try again.");
        setLoading(false);
        return;
      }

      // Write admin session into localStorage — same shape as normal login
      localStorage.setItem("zoobicon_user", JSON.stringify(data.user));
      setSuccess(true);

      // Small delay so Craig sees the success state, then redirect
      setTimeout(() => {
        router.push("/admin");
      }, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-stone-500/20 to-stone-500/20 border border-stone-500/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-stone-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Recovery</h1>
              <p className="text-xs text-slate-400">Break-glass access for locked-out admins</p>
            </div>
          </div>

          {config && !config.configured && (
            <div className="mb-6 rounded-lg border border-stone-500/30 bg-stone-500/10 p-4 text-sm text-stone-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-1">Recovery not configured</div>
                  <div className="text-stone-100/80 text-xs leading-relaxed">
                    To enable recovery, set these in Vercel → Settings → Environment Variables:
                    <ul className="mt-2 space-y-1">
                      <li>
                        <code className="bg-black/30 px-1.5 py-0.5 rounded">ADMIN_EMAIL</code>
                        {config.adminEmailSet ? (
                          <span className="text-stone-400 ml-2">set</span>
                        ) : (
                          <span className="text-stone-400 ml-2">missing</span>
                        )}
                      </li>
                      <li>
                        <code className="bg-black/30 px-1.5 py-0.5 rounded">ADMIN_RECOVERY_TOKEN</code>
                        {config.recoveryTokenSet ? (
                          <span className="text-stone-400 ml-2">set</span>
                        ) : (
                          <span className="text-stone-400 ml-2">missing</span>
                        )}
                      </li>
                    </ul>
                    <div className="mt-2">
                      Use any long random string for the token, then redeploy.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {success ? (
            <div className="rounded-lg border border-stone-500/30 bg-stone-500/10 p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <div className="font-semibold text-stone-300">Recovery successful</div>
              <div className="text-sm text-stone-200/80 mt-1">Redirecting to admin dashboard…</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Recovery token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste your recovery token"
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-lg pl-10 pr-3 py-2.5 text-sm placeholder:text-slate-600 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-500/50"
                    autoComplete="off"
                    spellCheck={false}
                    required
                    disabled={loading || (config !== null && !config.configured)}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  The token you set as <code className="text-slate-400">ADMIN_RECOVERY_TOKEN</code> in
                  Vercel env vars.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-stone-500/30 bg-stone-500/10 p-3 text-sm text-stone-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token.trim() || (config !== null && !config.configured)}
                className="w-full bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg shadow-stone-500/20"
              >
                {loading ? "Verifying…" : "Recover admin access"}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="text-xs text-slate-500 leading-relaxed">
              This endpoint bypasses the database so it works even when Neon is down. It
              requires physical access to Vercel environment variables — meaning only Craig
              can use it.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
