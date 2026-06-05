/**
 * Zoobicon Backend Client Generator
 *
 * Generates the lib/zoobicon.ts file injected into every full-stack generated project.
 * Replaces Supabase — all data flows through Zoobicon's own Neon-backed API.
 * No external accounts, no tokens to set. Works out of the box.
 */

/**
 * Generate the zoobicon.ts client file injected into Sandpack / deployed sites.
 * projectId is embedded as a constant so every data operation is automatically
 * scoped to this site — no credentials needed from the end-user.
 */
export function generateZoobiconClient(projectId: string): string {
  const keyName = `zbk_${projectId.slice(0, 8)}`;
  return `// lib/zoobicon.ts — powered by Zoobicon
// Backend for this site: auth, data storage, and form submissions.
// All data is scoped to this project and visible in your Zoobicon dashboard.

const API = "https://zoobicon.com";
const PROJECT_ID = "${projectId}";

// ── Session helpers ──
function getToken(): string | null {
  try { return localStorage.getItem("${keyName}"); } catch { return null; }
}
function saveToken(t: string): void {
  try { localStorage.setItem("${keyName}", t); } catch {}
}
function clearToken(): void {
  try { localStorage.removeItem("${keyName}"); } catch {}
}
function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: "Bearer " + t } : {};
}

// ── Auth ──

export async function signUp(email: string, password: string) {
  const res = await fetch(API + "/api/v1/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "signup", projectId: PROJECT_ID, email, password }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Sign up failed");
  saveToken(data.token);
  return { user: data.user };
}

export async function signIn(email: string, password: string) {
  const res = await fetch(API + "/api/v1/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "signin", projectId: PROJECT_ID, email, password }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Sign in failed");
  saveToken(data.token);
  return { user: data.user };
}

export async function signOut(): Promise<void> {
  clearToken();
}

export function getUser(): { id: string; email: string } | null {
  const token = getToken();
  if (!token) return null;
  try {
    const raw = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(raw));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      clearToken();
      return null;
    }
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export async function getSession() {
  const user = getUser();
  if (!user) return null;
  return { user, token: getToken() };
}

// ── Data (tables, forms, records) ──

export async function insert(
  collection: string,
  data: Record<string, unknown>
) {
  const res = await fetch(API + "/api/v1/data/" + collection, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ projectId: PROJECT_ID, data }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Save failed");
  return body;
}

export async function query<T = Record<string, unknown>>(
  collection: string,
  filters?: Record<string, unknown>
): Promise<T[]> {
  const params = new URLSearchParams({ projectId: PROJECT_ID });
  if (filters) params.set("filters", JSON.stringify(filters));
  const res = await fetch(API + "/api/v1/data/" + collection + "?" + params, {
    headers: { ...authHeaders() },
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Query failed");
  return body.rows as T[];
}

export async function update(
  collection: string,
  id: string,
  updates: Record<string, unknown>
) {
  const res = await fetch(API + "/api/v1/data/" + collection + "/" + id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ projectId: PROJECT_ID, updates }),
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Update failed");
  return body;
}

export async function remove(collection: string, id: string) {
  const res = await fetch(API + "/api/v1/data/" + collection + "/" + id, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ projectId: PROJECT_ID }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const b = await res.json();
    throw new Error(b.error || "Delete failed");
  }
}
`;
}

/**
 * Generate the AuthProvider.tsx file injected into generated projects that need auth.
 * Uses polling (setInterval) instead of Supabase's realtime subscription — keeps
 * session fresh without any external WebSocket dependency.
 */
export function generateZoobiconAuthProvider(): string {
  return `// lib/AuthProvider.tsx — powered by Zoobicon
import React, { createContext, useContext, useEffect, useState } from "react";
import { getUser, signOut } from "./zoobicon";

interface ZbkUser { id: string; email: string; }
interface AuthContextType { user: ZbkUser | null; loading: boolean; signOut: () => void; }

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ZbkUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getUser());
    setLoading(false);
    // Recheck session every minute (token expiry check is local, no network call)
    const id = setInterval(() => setUser(getUser()), 60_000);
    return () => clearInterval(id);
  }, []);

  const handleSignOut = () => {
    signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}
`;
}
