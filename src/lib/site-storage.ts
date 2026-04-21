/**
 * Site Storage — Vercel Blob
 *
 * Moves site HTML/CSS/JS from Neon Postgres BYTEA/TEXT columns to
 * Vercel Blob Storage for:
 *   - CDN-cached serving (global edge)
 *   - No 10MB query timeout limit
 *   - Built-in versioning (each put creates a new URL)
 *   - Proper content-type headers
 *
 * Postgres remains the metadata store (slug, owner, status).
 * During migration: falls back to Postgres if Blob is unavailable.
 *
 * Env var: BLOB_READ_WRITE_TOKEN (auto-provided by Vercel when Blob
 * storage is enabled in project settings).
 */

import { put, del, list } from "@vercel/blob";

const BLOB_PREFIX = "sites";

/** Check if Vercel Blob is configured */
export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export interface SiteFiles {
  html: string;
  css?: string;
  js?: string;
}

export interface StoredSite {
  html: string;
  css?: string;
  js?: string;
  htmlUrl: string;
  cssUrl?: string;
  jsUrl?: string;
}

/**
 * Upload site files to Vercel Blob.
 *
 * Stores files under `sites/{slug}/index.html`, `sites/{slug}/styles.css`, etc.
 * Each upload gets a unique CDN URL with cache-control headers.
 *
 * @returns URLs for each uploaded file
 */
export async function uploadSite(
  slug: string,
  files: SiteFiles
): Promise<StoredSite> {
  if (!isBlobConfigured()) {
    throw new Error(
      "Vercel Blob not configured. Set BLOB_READ_WRITE_TOKEN in environment variables."
    );
  }

  const results: StoredSite = {
    html: files.html,
    htmlUrl: "",
  };

  // Upload HTML (always required)
  const htmlBlob = await put(
    `${BLOB_PREFIX}/${slug}/index.html`,
    files.html,
    {
      access: "public",
      contentType: "text/html; charset=utf-8",
      addRandomSuffix: false,
      cacheControlMaxAge: 120, // 2 min browser cache, CDN revalidates
    }
  );
  results.htmlUrl = htmlBlob.url;

  // Upload CSS if provided
  if (files.css) {
    const cssBlob = await put(
      `${BLOB_PREFIX}/${slug}/styles.css`,
      files.css,
      {
        access: "public",
        contentType: "text/css; charset=utf-8",
        addRandomSuffix: false,
        cacheControlMaxAge: 3600,
      }
    );
    results.css = files.css;
    results.cssUrl = cssBlob.url;
  }

  // Upload JS if provided
  if (files.js) {
    const jsBlob = await put(
      `${BLOB_PREFIX}/${slug}/main.js`,
      files.js,
      {
        access: "public",
        contentType: "application/javascript; charset=utf-8",
        addRandomSuffix: false,
        cacheControlMaxAge: 3600,
      }
    );
    results.js = files.js;
    results.jsUrl = jsBlob.url;
  }

  return results;
}

/**
 * Get a site's files from Vercel Blob.
 *
 * Fetches the HTML (and optionally CSS/JS) from Blob storage.
 * Returns null if the site doesn't exist in Blob storage.
 */
export async function getSite(
  slug: string
): Promise<StoredSite | null> {
  if (!isBlobConfigured()) {
    return null; // Blob not configured — caller should fall back to Postgres
  }

  try {
    // List blobs under this slug's prefix
    const { blobs } = await list({
      prefix: `${BLOB_PREFIX}/${slug}/`,
    });

    if (blobs.length === 0) {
      return null; // Site not in Blob storage yet
    }

    const htmlBlob = blobs.find((b) => b.pathname.endsWith("index.html"));
    if (!htmlBlob) {
      return null;
    }

    // Fetch the actual content
    const htmlRes = await fetch(htmlBlob.url);
    if (!htmlRes.ok) return null;
    const html = await htmlRes.text();

    const result: StoredSite = {
      html,
      htmlUrl: htmlBlob.url,
    };

    // Optionally fetch CSS
    const cssBlob = blobs.find((b) => b.pathname.endsWith("styles.css"));
    if (cssBlob) {
      const cssRes = await fetch(cssBlob.url);
      if (cssRes.ok) {
        result.css = await cssRes.text();
        result.cssUrl = cssBlob.url;
      }
    }

    // Optionally fetch JS
    const jsBlob = blobs.find((b) => b.pathname.endsWith("main.js"));
    if (jsBlob) {
      const jsRes = await fetch(jsBlob.url);
      if (jsRes.ok) {
        result.js = await jsRes.text();
        result.jsUrl = jsBlob.url;
      }
    }

    return result;
  } catch (err) {
    console.error(`[site-storage] Failed to get site ${slug} from Blob:`, err);
    return null; // Fall back to Postgres
  }
}

/**
 * Delete all files for a site from Vercel Blob.
 */
export async function deleteSite(slug: string): Promise<void> {
  if (!isBlobConfigured()) return;

  try {
    const { blobs } = await list({
      prefix: `${BLOB_PREFIX}/${slug}/`,
    });

    if (blobs.length > 0) {
      await Promise.all(blobs.map((b) => del(b.url)));
    }
  } catch (err) {
    console.error(`[site-storage] Failed to delete site ${slug} from Blob:`, err);
    // Non-fatal — Postgres still has the record
  }
}

/**
 * Get the public CDN URL for a site's HTML.
 * Returns null if not stored in Blob.
 */
export async function getSiteUrl(slug: string): Promise<string | null> {
  if (!isBlobConfigured()) return null;

  try {
    const { blobs } = await list({
      prefix: `${BLOB_PREFIX}/${slug}/index.html`,
    });
    return blobs[0]?.url ?? null;
  } catch {
    return null;
  }
}
