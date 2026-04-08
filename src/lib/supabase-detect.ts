/**
 * Supabase Intent Detection + Client Code Generation
 *
 * Detects whether a user's prompt implies a full-stack app that needs
 * Supabase (auth, database, storage). Used by the react-stream endpoint
 * to auto-provision a Supabase project and inject client code.
 *
 * Progressive enhancement: if SUPABASE_ACCESS_TOKEN is not set,
 * the builder still works — it just skips provisioning.
 */

export interface SupabaseNeeds {
  /** User wants login/signup/OAuth/session management */
  needsAuth: boolean;
  /** User wants database tables, CRUD, queries, user data persistence */
  needsDatabase: boolean;
  /** User wants file uploads, images, avatars, media storage */
  needsStorage: boolean;
}

// ── Keyword dictionaries ──

const AUTH_KEYWORDS = [
  "auth",
  "login",
  "log in",
  "sign in",
  "signin",
  "signup",
  "sign up",
  "register",
  "registration",
  "password",
  "oauth",
  "session",
  "logout",
  "log out",
  "sign out",
  "account",
  "profile",
  "user account",
  "user profile",
  "authentication",
  "authorization",
  "permissions",
  "roles",
  "admin panel",
  "admin dashboard",
  "protected route",
  "private route",
  "member",
  "membership",
];

const DATABASE_KEYWORDS = [
  "database",
  "db",
  "postgres",
  "sql",
  "crud",
  "table",
  "tables",
  "users",
  "posts",
  "comments",
  "orders",
  "products",
  "items",
  "todos",
  "tasks",
  "dashboard",
  "admin",
  "backend",
  "full-stack",
  "fullstack",
  "full stack",
  "data",
  "store data",
  "save data",
  "persist",
  "records",
  "list of",
  "manage",
  "management",
  "cms",
  "content management",
  "inventory",
  "bookings",
  "appointments",
  "reservations",
  "crm",
  "customer",
  "customers",
  "analytics",
  "tracking",
  "e-commerce",
  "ecommerce",
  "shop",
  "store",
  "marketplace",
  "checkout",
  "cart",
  "wishlist",
  "favorites",
  "blog with comments",
  "forum",
  "social",
  "feed",
  "messages",
  "chat",
  "notifications",
  "real-time",
  "realtime",
];

const STORAGE_KEYWORDS = [
  "upload",
  "file upload",
  "image upload",
  "photo upload",
  "avatar",
  "media",
  "attachments",
  "gallery with upload",
  "portfolio upload",
  "documents",
  "files",
  "storage",
  "bucket",
  "profile picture",
  "profile photo",
  "cover image",
];

/**
 * Detect what Supabase features the user's prompt implies.
 * Uses simple keyword matching — fast, no AI call needed.
 */
export function detectSupabaseNeeds(prompt: string): SupabaseNeeds {
  const lower = prompt.toLowerCase();

  const needsAuth = AUTH_KEYWORDS.some((kw) => lower.includes(kw));
  const needsDatabase = DATABASE_KEYWORDS.some((kw) => lower.includes(kw));
  const needsStorage = STORAGE_KEYWORDS.some((kw) => lower.includes(kw));

  // If auth is needed, database is almost always needed too (user records)
  const impliedDatabase = needsAuth || needsDatabase;

  return {
    needsAuth,
    needsDatabase: impliedDatabase,
    needsStorage,
  };
}

/**
 * Returns true if any Supabase feature is needed.
 */
export function needsSupabase(needs: SupabaseNeeds): boolean {
  return needs.needsAuth || needs.needsDatabase || needs.needsStorage;
}

/**
 * Generate the Supabase client file that gets injected into the generated project.
 * This file is what the generated components import to talk to Supabase.
 */
export function generateSupabaseClient(
  projectUrl: string,
  anonKey: string,
): string {
  return `// lib/supabase.ts — auto-provisioned by Zoobicon
// Supabase client for auth, database, and storage.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "${projectUrl}";
const supabaseAnonKey = "${anonKey}";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ── Auth helpers ──

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// ── Database helpers ──

export async function query<T = Record<string, unknown>>(
  table: string,
  filters?: Record<string, unknown>,
) {
  let q = supabase.from(table).select("*");
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      q = q.eq(key, value);
    }
  }
  const { data, error } = await q;
  if (error) throw error;
  return data as T[];
}

export async function insert<T = Record<string, unknown>>(
  table: string,
  row: Record<string, unknown>,
) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return data as T;
}

export async function update<T = Record<string, unknown>>(
  table: string,
  id: string | number,
  updates: Record<string, unknown>,
  idColumn = "id",
) {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq(idColumn, id)
    .select()
    .single();
  if (error) throw error;
  return data as T;
}

export async function remove(
  table: string,
  id: string | number,
  idColumn = "id",
) {
  const { error } = await supabase.from(table).delete().eq(idColumn, id);
  if (error) throw error;
}

// ── Storage helpers ──

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw error;
  return data;
}

export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
`;
}

/**
 * Generate an auth context/provider component for React apps.
 * This wraps the app in a Supabase auth context so any component
 * can check auth state.
 */
export function generateAuthProvider(): string {
  return `// lib/AuthProvider.tsx — auto-provisioned by Zoobicon
// Provides auth state to all components via React context.
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, getSession } from "./supabase";

interface AuthUser {
  id: string;
  email: string | undefined;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
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

/**
 * Describe what was provisioned — used in SSE events so the frontend
 * knows a Supabase project was created.
 */
export interface SupabaseProvisionResult {
  projectUrl: string;
  anonKey: string;
  projectRef: string;
  needsAuth: boolean;
  needsDatabase: boolean;
  needsStorage: boolean;
  tables: string[];
  authProviders: string[];
  buckets: string[];
}
