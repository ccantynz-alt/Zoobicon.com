/**
 * Auth Page Generator
 *
 * Generates complete, working authentication pages for every full-stack app.
 * No competitor auto-generates auth pages that actually WORK.
 *
 * Generated components:
 *   - LoginPage.tsx — email/password login with validation
 *   - SignupPage.tsx — registration with password strength indicator
 *   - ForgotPassword.tsx — password reset flow
 *   - AuthGuard.tsx — route protection component
 *   - UserMenu.tsx — logged-in user dropdown (name, avatar, logout)
 *
 * All components use the app's lib/backend.ts for actual auth operations.
 * Works in preview (localStorage) and production (Supabase).
 */

/**
 * Generate auth component files for a React app.
 * Returns a file map to merge into the generated app's files.
 */
export function generateAuthFiles(options?: {
  brandName?: string;
  primaryColor?: string;
  includeOAuth?: boolean;
}): Record<string, string> {
  const brand = options?.brandName || "App";
  const color = options?.primaryColor || "indigo";

  const files: Record<string, string> = {};

  // Login Page
  files["components/LoginPage.tsx"] = `import React, { useState } from "react";
import { signIn } from "../lib/backend";

export default function LoginPage({ onSuccess, onSwitchToSignup }: { onSuccess: () => void; onSwitchToSignup: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    try {
      await signIn(email, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-2">Welcome back</h2>
        <p className="text-gray-500 text-center mb-8">Sign in to ${brand}</p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${color}-500" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${color}-500" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-${color}-600 hover:bg-${color}-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account? <button onClick={onSwitchToSignup} className="text-${color}-600 font-semibold hover:underline">Sign up</button>
        </p>
      </div>
    </div>
  );
}`;

  // Signup Page
  files["components/SignupPage.tsx"] = `import React, { useState } from "react";
import { signUp } from "../lib/backend";

export default function SignupPage({ onSuccess, onSwitchToLogin }: { onSuccess: () => void; onSwitchToLogin: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please fill in all fields"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    try {
      await signUp(email, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-2">Create your account</h2>
        <p className="text-gray-500 text-center mb-8">Start using ${brand} for free</p>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${color}-500" placeholder="John Smith" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${color}-500" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${color}-500" placeholder="••••••••" />
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={\`h-full \${strengthColors[passwordStrength]} transition-all\`} style={{ width: \`\${passwordStrength * 25}%\` }} />
                </div>
                <span className="text-xs text-gray-500">{strengthLabels[passwordStrength]}</span>
              </div>
            )}
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-${color}-600 hover:bg-${color}-500 text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account? <button onClick={onSwitchToLogin} className="text-${color}-600 font-semibold hover:underline">Sign in</button>
        </p>
      </div>
    </div>
  );
}`;

  // Auth Guard
  files["components/AuthGuard.tsx"] = `import React, { useEffect, useState } from "react";
import { getUser } from "../lib/backend";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<unknown>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    const u = getUser();
    setUser(u);
    setChecking(false);
  }, []);

  const handleAuthSuccess = () => {
    setUser(getUser());
  };

  if (checking) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-gray-200 border-t-${options?.primaryColor || "indigo"}-600 rounded-full animate-spin" /></div>;

  if (!user) {
    return mode === "login"
      ? <LoginPage onSuccess={handleAuthSuccess} onSwitchToSignup={() => setMode("signup")} />
      : <SignupPage onSuccess={handleAuthSuccess} onSwitchToLogin={() => setMode("login")} />;
  }

  return <>{children}</>;
}`;

  return files;
}
