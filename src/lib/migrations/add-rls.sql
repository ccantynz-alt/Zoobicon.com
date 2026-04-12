-- ============================================================================
-- Row-Level Security (RLS) Migration for Zoobicon
-- ============================================================================
-- Enables Postgres RLS on all user-facing tables so that even if application
-- code omits a WHERE user_email = ? clause, the database itself enforces
-- tenant isolation.
--
-- Usage:
--   Before every query on behalf of a user, call:
--     SELECT set_config('app.current_user_email', 'user@example.com', true);
--   The `true` makes it transaction-local (safe for connection pooling).
--
-- The second argument to current_setting() is `true` (missing_ok), which
-- returns '' when the variable is not set. This means queries without
-- context return NO rows (safe default — data never leaks).
--
-- Admin bypass: connect with a role that has BYPASSRLS, or use
--   SET ROLE zoobicon_admin;
-- before running admin queries.
-- ============================================================================

-- Create admin role that bypasses RLS (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'zoobicon_admin') THEN
    CREATE ROLE zoobicon_admin NOLOGIN BYPASSRLS;
  END IF;
END
$$;

-- Grant the admin role to the current database user so SET ROLE works
DO $$
BEGIN
  EXECUTE format('GRANT zoobicon_admin TO %I', current_user);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not grant zoobicon_admin to current user: %', SQLERRM;
END
$$;

-- ============================================================================
-- Enable RLS on user-facing tables
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_domains ENABLE ROW LEVEL SECURITY;

-- audit_logs: created by src/lib/audit-log.ts, uses owner_id as tenant key
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    EXECUTE 'ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY';
  END IF;
END
$$;

-- ============================================================================
-- Create policies (DROP IF EXISTS to make migration idempotent)
-- ============================================================================

-- projects: user_email column
DROP POLICY IF EXISTS projects_user_policy ON projects;
CREATE POLICY projects_user_policy ON projects
  USING (user_email = current_setting('app.current_user_email', true));

-- sites: email column (not user_email)
DROP POLICY IF EXISTS sites_user_policy ON sites;
CREATE POLICY sites_user_policy ON sites
  USING (email = current_setting('app.current_user_email', true));

-- registered_domains: user_email column
DROP POLICY IF EXISTS registered_domains_user_policy ON registered_domains;
CREATE POLICY registered_domains_user_policy ON registered_domains
  USING (user_email = current_setting('app.current_user_email', true));

-- audit_logs: owner_id is the tenant key
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS audit_logs_user_policy ON audit_logs';
    EXECUTE 'CREATE POLICY audit_logs_user_policy ON audit_logs
      USING (owner_id = current_setting(''app.current_user_email'', true))';
  END IF;
END
$$;

-- ============================================================================
-- Allow the owner role (used by Neon connections) full access with RLS
-- This ensures the app works correctly since it sets the session var
-- ============================================================================
-- Note: The table owner automatically bypasses RLS unless FORCE ROW LEVEL
-- SECURITY is set. Since Neon connects as the table owner, RLS only kicks
-- in when we explicitly FORCE it. We FORCE it to ensure our app always goes
-- through the policy check.

ALTER TABLE projects FORCE ROW LEVEL SECURITY;
ALTER TABLE sites FORCE ROW LEVEL SECURITY;
ALTER TABLE registered_domains FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    EXECUTE 'ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY';
  END IF;
END
$$;
