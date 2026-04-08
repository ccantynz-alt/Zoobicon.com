import { sql } from "@/lib/db";

export interface SiteFiles {
  [path: string]: string;
}

export interface SiteDependencies {
  [name: string]: string;
}

export interface BackupRow {
  id: string;
  site_id: string;
  owner_id: string;
  label: string | null;
  files: SiteFiles;
  dependencies: SiteDependencies;
  size_bytes: number;
  created_at: string;
}

export type BackupMeta = Omit<BackupRow, "files" | "dependencies">;

export async function ensureBackupTables(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS site_backups (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      site_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      label TEXT,
      files JSONB NOT NULL DEFAULT '{}'::jsonb,
      dependencies JSONB NOT NULL DEFAULT '{}'::jsonb,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_site_backups_site_id ON site_backups(site_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_site_backups_owner_id ON site_backups(owner_id)`;
}

interface SiteRow {
  id: string;
  owner_id: string;
  files: SiteFiles | null;
  dependencies: SiteDependencies | null;
}

async function fetchSite(siteId: string, ownerId: string): Promise<SiteRow> {
  const rows = (await sql`
    SELECT id, owner_id, files, dependencies
    FROM sites
    WHERE id = ${siteId} AND owner_id = ${ownerId}
    LIMIT 1
  `) as unknown as SiteRow[];
  if (!rows || rows.length === 0) {
    throw new Error(
      `Site not found or access denied (siteId=${siteId}). Verify the site exists and you own it.`
    );
  }
  return rows[0];
}

export async function createBackup(
  siteId: string,
  ownerId: string,
  label?: string
): Promise<BackupRow> {
  await ensureBackupTables();
  const site = await fetchSite(siteId, ownerId);
  const files: SiteFiles = site.files ?? {};
  const dependencies: SiteDependencies = site.dependencies ?? {};
  const sizeBytes = JSON.stringify({ files, dependencies }).length;

  const rows = (await sql`
    INSERT INTO site_backups (site_id, owner_id, label, files, dependencies, size_bytes)
    VALUES (${siteId}, ${ownerId}, ${label ?? null}, ${JSON.stringify(files)}::jsonb, ${JSON.stringify(dependencies)}::jsonb, ${sizeBytes})
    RETURNING id, site_id, owner_id, label, files, dependencies, size_bytes, created_at
  `) as unknown as BackupRow[];
  return rows[0];
}

export async function listBackups(
  siteId: string,
  limit: number = 20
): Promise<BackupMeta[]> {
  await ensureBackupTables();
  const rows = (await sql`
    SELECT id, site_id, owner_id, label, size_bytes, created_at
    FROM site_backups
    WHERE site_id = ${siteId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `) as unknown as BackupMeta[];
  return rows;
}

export async function getBackup(
  backupId: string,
  ownerId: string
): Promise<BackupRow> {
  await ensureBackupTables();
  const rows = (await sql`
    SELECT id, site_id, owner_id, label, files, dependencies, size_bytes, created_at
    FROM site_backups
    WHERE id = ${backupId} AND owner_id = ${ownerId}
    LIMIT 1
  `) as unknown as BackupRow[];
  if (!rows || rows.length === 0) {
    throw new Error(
      `Backup not found or access denied (backupId=${backupId}).`
    );
  }
  return rows[0];
}

export async function restoreBackup(
  backupId: string,
  ownerId: string
): Promise<{ restoredFiles: number }> {
  const backup = await getBackup(backupId, ownerId);
  await fetchSite(backup.site_id, ownerId);
  const files = backup.files ?? {};
  const dependencies = backup.dependencies ?? {};
  await sql`
    UPDATE sites
    SET files = ${JSON.stringify(files)}::jsonb,
        dependencies = ${JSON.stringify(dependencies)}::jsonb
    WHERE id = ${backup.site_id} AND owner_id = ${ownerId}
  `;
  return { restoredFiles: Object.keys(files).length };
}

export async function deleteBackup(
  backupId: string,
  ownerId: string
): Promise<{ ok: true }> {
  await ensureBackupTables();
  await sql`
    DELETE FROM site_backups
    WHERE id = ${backupId} AND owner_id = ${ownerId}
  `;
  return { ok: true };
}

export async function pruneOldBackups(
  siteId: string,
  keep: number = 10
): Promise<{ deleted: number }> {
  await ensureBackupTables();
  const rows = (await sql`
    SELECT id FROM site_backups
    WHERE site_id = ${siteId}
    ORDER BY created_at DESC
    OFFSET ${keep}
  `) as unknown as Array<{ id: string }>;
  if (rows.length === 0) return { deleted: 0 };
  const ids = rows.map((r) => r.id);
  await sql`DELETE FROM site_backups WHERE id = ANY(${ids}::uuid[])`;
  return { deleted: ids.length };
}
