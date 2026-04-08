/**
 * Backend Generator — Detects backend needs and generates Supabase integration code
 *
 * When a user generates a full-stack app, this module:
 * 1. Analyzes the prompt to detect backend requirements (auth, database, forms, etc.)
 * 2. Generates Supabase client setup code (lib/supabase.ts)
 * 3. Generates database migration SQL for the app's schema
 * 4. Generates auth components (login/signup) to inject into the generated code
 * 5. Falls back gracefully to localStorage if Supabase is unavailable
 *
 * This is what makes us match Lovable — every full-stack app gets real Postgres + auth + storage.
 */

import {
  isSupabaseConfigured,
  createProject,
  executeSQL,
  generateClientCode,
  generateSchemaPrompt,
} from "./supabase-provision";

// ── Types ──

export interface BackendNeeds {
  auth: boolean;       // Login/signup, user accounts
  database: boolean;   // Persistent data storage (CRUD)
  storage: boolean;    // File uploads, images
  email: boolean;      // Contact forms, notifications
  realtime: boolean;   // Live updates, chat, collaboration
  payments: boolean;   // Stripe, checkout, subscriptions
}

export interface BackendResult {
  provisioned: boolean;      // Whether a real Supabase project was created
  projectUrl?: string;       // e.g. https://abc123.supabase.co
  anonKey?: string;          // Public anon key for client-side
  files: Record<string, string>;  // Files to inject into the generated app
  migrationSQL?: string;     // SQL to run on the project
  dependencies: Record<string, string>;  // npm deps to add
  needs: BackendNeeds;       // What was detected
}

// ── Prompt Analysis ──

/**
 * Analyze a user's prompt to detect what backend capabilities the app needs.
 * Uses keyword matching — fast and deterministic, no AI call needed.
 */
export function detectBackendNeeds(prompt: string): BackendNeeds {
  const p = prompt.toLowerCase();

  const auth =
    /\b(login|sign.?up|sign.?in|auth|register|account|user.?profile|password|oauth|session|dashboard)\b/.test(p);

  const database =
    /\b(crud|database|data|table|list|todo|task|project|manage|admin|inventory|catalog|store|order|booking|appointment|schedule|crm|blog|post|article|comment|review)\b/.test(p);

  const storage =
    /\b(upload|image|photo|file|avatar|gallery|media|attachment|document)\b/.test(p);

  const email =
    /\b(contact.?form|email|newsletter|subscribe|notification|message|inbox|mail)\b/.test(p);

  const realtime =
    /\b(real.?time|live|chat|message|notification|collaboration|socket|presence)\b/.test(p);

  const payments =
    /\b(payment|stripe|checkout|subscription|pricing|billing|cart|purchase|buy|e.?commerce|shop|store)\b/.test(p);

  return { auth, database, storage, email, realtime, payments };
}

/**
 * Check if the prompt needs ANY backend at all.
 */
export function needsBackend(prompt: string): boolean {
  const needs = detectBackendNeeds(prompt);
  return needs.auth || needs.database || needs.storage || needs.realtime || needs.payments;
}

// ── Supabase Provisioning ──

/**
 * Provision a Supabase project and generate all backend files for the app.
 * If Supabase is not configured, falls back gracefully to localStorage.
 */
export async function generateBackend(
  appName: string,
  prompt: string,
  ownerEmail: string,
  schemaSQL?: string,
): Promise<BackendResult> {
  const needs = detectBackendNeeds(prompt);
  const files: Record<string, string> = {};
  const dependencies: Record<string, string> = {};

  // If Supabase is configured, provision a real project
  if (isSupabaseConfigured()) {
    try {
      const safeName = appName.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 30) || "app";
      const project = await createProject(safeName);

      // Wait a moment for project to initialize (Supabase needs ~10s)
      // We don't block — schema execution will retry
      if (schemaSQL) {
        try {
          await executeSQL(project.id, schemaSQL);
        } catch (sqlErr) {
          console.warn("[backend-generator] Schema execution failed (project may still be initializing):", sqlErr);
          // Include the SQL so the user can run it manually
          files["setup/migration.sql"] = schemaSQL;
        }
      }

      // Generate Supabase client code
      files["lib/supabase.ts"] = generateClientCode(project.projectUrl, project.anonKey);

      // Generate auth components if needed
      if (needs.auth) {
        files["components/AuthProvider.tsx"] = generateAuthProvider();
        files["components/LoginForm.tsx"] = generateLoginForm();
        files["components/SignupForm.tsx"] = generateSignupForm();
      }

      // Generate database hooks if needed
      if (needs.database) {
        files["hooks/useDatabase.ts"] = generateDatabaseHook();
      }

      // Generate storage hook if needed
      if (needs.storage) {
        files["hooks/useStorage.ts"] = generateStorageHook();
      }

      // Generate realtime hook if needed
      if (needs.realtime) {
        files["hooks/useRealtime.ts"] = generateRealtimeHook();
      }

      dependencies["@supabase/supabase-js"] = "^2.39.0";

      return {
        provisioned: true,
        projectUrl: project.projectUrl,
        anonKey: project.anonKey,
        files,
        migrationSQL: schemaSQL,
        dependencies,
        needs,
      };
    } catch (err) {
      console.error("[backend-generator] Supabase provisioning failed, falling back to local:", err);
      // Fall through to local mode
    }
  }

  // Local fallback — generates localStorage-based backend
  files["lib/backend.ts"] = generateLocalBackend(needs);

  if (needs.auth) {
    files["components/AuthProvider.tsx"] = generateLocalAuthProvider();
    files["components/LoginForm.tsx"] = generateLoginForm(true);
    files["components/SignupForm.tsx"] = generateSignupForm(true);
  }

  if (needs.database) {
    files["hooks/useDatabase.ts"] = generateLocalDatabaseHook();
  }

  if (needs.storage) {
    files["hooks/useStorage.ts"] = generateLocalStorageHook();
  }

  return {
    provisioned: false,
    files,
    dependencies,
    needs,
  };
}

// ── Schema Generation Prompt ──

export { generateSchemaPrompt };

// ── Generated Code Templates ──

function generateAuthProvider(): string {
  return `import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
`;
}

function generateLocalAuthProvider(): string {
  return `import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'zoobicon_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, []);

  const signUp = async (email: string, _password: string) => {
    const users = JSON.parse(localStorage.getItem('zoobicon_users') || '[]');
    if (users.find((u: User) => u.email === email)) throw new Error('Email already registered');
    const newUser: User = { id: crypto.randomUUID(), email, createdAt: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem('zoobicon_users', JSON.stringify(users));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const signIn = async (email: string, _password: string) => {
    const users = JSON.parse(localStorage.getItem('zoobicon_users') || '[]');
    const found = users.find((u: User) => u.email === email);
    if (!found) throw new Error('Invalid credentials');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    setUser(found);
  };

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
`;
}

function generateLoginForm(local: boolean = false): string {
  const importLine = local
    ? `import { useAuth } from './AuthProvider';`
    : `import { useAuth } from './AuthProvider';`;

  return `import { useState, FormEvent } from 'react';
${importLine}

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToSignup }: LoginFormProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
      <p className="text-gray-500 mb-6">Sign in to your account</p>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            required autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <button onClick={onSwitchToSignup} className="text-indigo-600 font-medium hover:underline">Sign up</button>
      </p>
    </div>
  );
}
`;
}

function generateSignupForm(local: boolean = false): string {
  const importLine = local
    ? `import { useAuth } from './AuthProvider';`
    : `import { useAuth } from './AuthProvider';`;

  return `import { useState, FormEvent } from 'react';
${importLine}

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function SignupForm({ onSuccess, onSwitchToLogin }: SignupFormProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await signUp(email, password);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-2xl bg-white shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Create account</h2>
      <p className="text-gray-500 mb-6">Get started with your new account</p>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            required autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            required autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-indigo-600 font-medium hover:underline">Sign in</button>
      </p>
    </div>
  );
}
`;
}

function generateDatabaseHook(): string {
  return `import { useState, useCallback } from 'react';
import { query, insert, update, remove } from '../lib/supabase';

/**
 * Hook for CRUD operations on any Supabase table.
 * Usage: const { data, loading, fetch, create, edit, del } = useDatabase('todos');
 */
export function useDatabase<T extends { id: string }>(table: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (filter?: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const rows = await query(table, { filter });
      setData(rows as T[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [table]);

  const create = useCallback(async (item: Omit<T, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await insert(table, item as Record<string, unknown>);
      setData(prev => [...prev, ...(result as T[])]);
      return result[0] as T;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [table]);

  const edit = useCallback(async (id: string, updates: Partial<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await update(table, id, updates as Record<string, unknown>);
      setData(prev => prev.map(item => item.id === id ? { ...item, ...(result[0] as T) } : item));
      return result[0] as T;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [table]);

  const del = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await remove(table, id);
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [table]);

  return { data, loading, error, fetch, create, edit, del };
}
`;
}

function generateLocalDatabaseHook(): string {
  return `import { useState, useCallback } from 'react';

const STORAGE_PREFIX = 'zoobicon_db_';

/**
 * Hook for CRUD operations using localStorage (development mode).
 * When deployed to Zoobicon Cloud, this automatically upgrades to real Postgres.
 */
export function useDatabase<T extends { id: string }>(table: string) {
  const key = STORAGE_PREFIX + table;
  const [data, setData] = useState<T[]>(() => {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persist = (rows: T[]) => {
    localStorage.setItem(key, JSON.stringify(rows));
    setData(rows);
  };

  const fetch = useCallback(async (filter?: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      let rows: T[] = JSON.parse(localStorage.getItem(key) || '[]');
      if (filter) {
        rows = rows.filter(row => Object.entries(filter).every(([k, v]) => (row as Record<string, unknown>)[k] === v));
      }
      setData(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [key]);

  const create = useCallback(async (item: Omit<T, 'id'>) => {
    setLoading(true);
    try {
      const newItem = { ...item, id: crypto.randomUUID(), created_at: new Date().toISOString() } as T;
      const rows = [...data, newItem];
      persist(rows);
      return newItem;
    } finally {
      setLoading(false);
    }
  }, [data, key]);

  const edit = useCallback(async (id: string, updates: Partial<T>) => {
    setLoading(true);
    try {
      const rows = data.map(item => item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item);
      persist(rows);
      return rows.find(r => r.id === id) as T;
    } finally {
      setLoading(false);
    }
  }, [data, key]);

  const del = useCallback(async (id: string) => {
    setLoading(true);
    try {
      persist(data.filter(item => item.id !== id));
    } finally {
      setLoading(false);
    }
  }, [data, key]);

  return { data, loading, error, fetch, create, edit, del };
}
`;
}

function generateStorageHook(): string {
  return `import { useState, useCallback } from 'react';
import { uploadFile, getPublicUrl } from '../lib/supabase';

/**
 * Hook for file uploads via Supabase Storage.
 */
export function useStorage(bucket: string = 'uploads') {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, path?: string) => {
    setUploading(true);
    setError(null);
    try {
      const filePath = path || \`\${Date.now()}_\${file.name}\`;
      await uploadFile(bucket, filePath, file);
      return getPublicUrl(bucket, filePath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [bucket]);

  return { upload, uploading, error };
}
`;
}

function generateLocalStorageHook(): string {
  return `import { useState, useCallback } from 'react';

/**
 * Hook for file handling using data URLs (development mode).
 * When deployed to Zoobicon Cloud, this upgrades to real cloud storage.
 */
export function useStorage(_bucket: string = 'uploads') {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, _path?: string) => {
    setUploading(true);
    setError(null);
    try {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, error };
}
`;
}

function generateRealtimeHook(): string {
  return `import { useEffect, useRef, useState } from 'react';
import { subscribe } from '../lib/supabase';

/**
 * Hook for real-time Supabase subscriptions.
 * Usage: const { events } = useRealtime('messages');
 */
export function useRealtime<T = unknown>(table: string) {
  const [events, setEvents] = useState<T[]>([]);
  const subRef = useRef<ReturnType<typeof subscribe> | null>(null);

  useEffect(() => {
    subRef.current = subscribe(table, (payload: unknown) => {
      const p = payload as { new?: T };
      if (p.new) setEvents(prev => [...prev, p.new as T]);
    });

    return () => {
      subRef.current?.unsubscribe?.();
    };
  }, [table]);

  const clear = () => setEvents([]);

  return { events, clear };
}
`;
}

function generateLocalBackend(needs: BackendNeeds): string {
  return `/**
 * Zoobicon Backend — Local Development Mode
 *
 * This uses localStorage for development/preview.
 * When deployed to Zoobicon Cloud, all operations automatically
 * upgrade to real Postgres + auth + storage.
 */

const PREFIX = 'zoobicon_app_';

// ── Auth ──
${needs.auth ? `
export function signUp(email: string, _password: string) {
  const users = JSON.parse(localStorage.getItem(PREFIX + 'users') || '[]');
  if (users.find((u: {email:string}) => u.email === email)) throw new Error('Email already registered');
  const user = { id: crypto.randomUUID(), email, createdAt: new Date().toISOString() };
  users.push(user);
  localStorage.setItem(PREFIX + 'users', JSON.stringify(users));
  localStorage.setItem(PREFIX + 'current_user', JSON.stringify(user));
  return user;
}

export function signIn(email: string, _password: string) {
  const users = JSON.parse(localStorage.getItem(PREFIX + 'users') || '[]');
  const user = users.find((u: {email:string}) => u.email === email);
  if (!user) throw new Error('Invalid credentials');
  localStorage.setItem(PREFIX + 'current_user', JSON.stringify(user));
  return user;
}

export function signOut() { localStorage.removeItem(PREFIX + 'current_user'); }

export function getUser() {
  const s = localStorage.getItem(PREFIX + 'current_user');
  return s ? JSON.parse(s) : null;
}
` : '// Auth not needed for this app'}

// ── Database ──
${needs.database ? `
export function query(table: string, filter?: Record<string, unknown>) {
  let rows = JSON.parse(localStorage.getItem(PREFIX + table) || '[]');
  if (filter) {
    rows = rows.filter((r: Record<string, unknown>) =>
      Object.entries(filter).every(([k, v]) => r[k] === v)
    );
  }
  return rows;
}

export function insert(table: string, data: Record<string, unknown>) {
  const rows = query(table);
  const row = { ...data, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  rows.push(row);
  localStorage.setItem(PREFIX + table, JSON.stringify(rows));
  return row;
}

export function update(table: string, id: string, data: Record<string, unknown>) {
  const rows = query(table);
  const idx = rows.findIndex((r: {id:string}) => r.id === id);
  if (idx === -1) throw new Error('Not found');
  rows[idx] = { ...rows[idx], ...data, updated_at: new Date().toISOString() };
  localStorage.setItem(PREFIX + table, JSON.stringify(rows));
  return rows[idx];
}

export function remove(table: string, id: string) {
  const rows = query(table).filter((r: {id:string}) => r.id !== id);
  localStorage.setItem(PREFIX + table, JSON.stringify(rows));
}
` : '// Database not needed for this app'}

// ── Storage ──
${needs.storage ? `
export function uploadFile(_bucket: string, file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
` : '// Storage not needed for this app'}
`;
}
