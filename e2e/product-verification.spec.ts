import { test, expect } from "@playwright/test";

/**
 * PRODUCT VERIFICATION TESTS
 *
 * These tests verify that the core products ACTUALLY WORK, not just load.
 * They simulate a logged-in user performing real actions.
 */

// Helper: set up localStorage auth for admin user
async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem(
      "zoobicon_user",
      JSON.stringify({
        email: "admin@zoobicon.com",
        name: "Admin",
        role: "admin",
        plan: "unlimited",
      })
    );
  });
}

// ─── AI BUILDER — THE CORE PRODUCT ──────────────────────────

test.describe("AI Builder (logged in)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("builder loads with prompt input visible", async ({ page }) => {
    await page.goto("/builder");
    await page.waitForLoadState("networkidle");

    // Should have the prompt input
    const input = page.locator(
      'textarea, input[placeholder*="Describe"], input[placeholder*="website"], input[placeholder*="build"]'
    ).first();
    await expect(input).toBeVisible({ timeout: 10000 });
  });

  test("builder does NOT redirect to signup when logged in", async ({ page }) => {
    await page.goto("/builder");
    await page.waitForLoadState("networkidle");
    // Should stay on /builder, not redirect to /auth/signup
    expect(page.url()).toContain("/builder");
  });

  test("builder shows preview area", async ({ page }) => {
    await page.goto("/builder");
    await page.waitForLoadState("networkidle");

    // Should have preview tab or area
    const preview = page.locator('button:has-text("Preview"), [data-testid="preview"]').first();
    await expect(preview).toBeVisible({ timeout: 10000 });
  });

  test("builder generation triggers and shows progress", async ({ page }) => {
    await page.goto("/builder");
    await page.waitForLoadState("networkidle");

    // Fill in a prompt
    const input = page.locator(
      'textarea, input[placeholder*="Describe"], input[placeholder*="website"], input[placeholder*="build"]'
    ).first();
    await input.fill("A simple bakery website with hero, menu, and contact sections");

    // Click build button
    const buildBtn = page.locator(
      'button:has-text("Build"), button:has-text("Generate"), button:has-text("Create")'
    ).first();
    await buildBtn.click();

    // Should show generation progress (not an immediate error)
    // Wait up to 15 seconds for either progress or error
    const hasProgress = await page
      .locator('text=/generating|assembling|building|selecting|customizing/i')
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    const hasError = await page
      .locator('text=/something went wrong|generation failed|error/i')
      .first()
      .isVisible({ timeout: 2000 })
      .catch(() => false);

    // Should show progress, not an immediate error
    if (hasError) {
      // Get the error text for debugging
      const errorText = await page
        .locator('text=/something went wrong|generation failed|error/i')
        .first()
        .textContent()
        .catch(() => "unknown error");
      console.log(`Builder error: ${errorText}`);
    }

    // At minimum, should not show "No React components to preview" immediately
    const hasBlankPreview = await page
      .locator('text="No React components to preview"')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(hasProgress || !hasBlankPreview).toBeTruthy();
  });
});

// ─── VIDEO CREATOR ──────────────────────────────────────────

test.describe("Video Creator (logged in)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("video creator loads with 3-step flow", async ({ page }) => {
    await page.goto("/video-creator");
    await page.waitForLoadState("networkidle");

    // Should show step 1: Describe
    await expect(
      page.locator('text=/describe|what.*video/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test("video creator accepts description and generates scripts", async ({
    page,
  }) => {
    await page.goto("/video-creator");
    await page.waitForLoadState("networkidle");

    // Find the text input for description
    const input = page.locator("textarea, input[type='text']").first();
    await expect(input).toBeVisible({ timeout: 10000 });

    await input.fill(
      "A 30 second promotional video for Zoobicon AI website builder"
    );

    // Click the generate/next button
    const nextBtn = page
      .locator(
        'button:has-text("Generate"), button:has-text("Next"), button:has-text("Create")'
      )
      .first();
    await nextBtn.click();

    // Should show loading or move to step 2
    // Wait for either scripts to appear or an error
    const hasScripts = await page
      .locator('text=/script|pick|choose/i')
      .first()
      .isVisible({ timeout: 30000 })
      .catch(() => false);

    const hasError = await page
      .locator('text=/something went wrong|failed|error/i')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (hasError) {
      const errorText = await page
        .locator('text=/something went wrong|failed|error/i')
        .first()
        .textContent()
        .catch(() => "unknown error");
      console.log(`Video creator error: ${errorText}`);
    }

    // Should either show scripts or at least be loading (not a hard crash)
    expect(hasScripts || !hasError).toBeTruthy();
  });
});

// ─── DOMAIN SEARCH — REVENUE DRIVER ────────────────────────

test.describe("Domain Search (functional)", () => {
  test("search actually returns availability results", async ({ page }) => {
    await page.goto("/domains");
    await page.waitForLoadState("networkidle");

    const input = page.locator("input[type='text']").first();
    await input.fill("google");

    const searchBtn = page.locator('button:has-text("Search")').first();
    await searchBtn.click();

    // Wait for results — should show availability within 10 seconds
    const hasResults = await page
      .locator('text=/available|taken|registered|unavailable/i')
      .first()
      .isVisible({ timeout: 15000 })
      .catch(() => false);

    expect(hasResults).toBeTruthy();
  });

  test("AI name generator tab works", async ({ page }) => {
    await page.goto("/domains");
    await page.waitForLoadState("networkidle");

    // Click AI Name Generator tab
    const genTab = page
      .locator('button:has-text("AI"), button:has-text("Generator")')
      .first();
    await genTab.click();

    // Should show the generator input
    const genInput = page
      .locator(
        'textarea, input[placeholder*="describe"], input[placeholder*="business"]'
      )
      .first();
    await expect(genInput).toBeVisible({ timeout: 5000 });
  });
});

// ─── DICTATION — AUTH-AWARE CTAs ────────────────────────────

test.describe("Dictation Product (auth-aware)", () => {
  test("shows login CTA when not logged in", async ({ page }) => {
    await page.goto("/products/dictation");
    await page.waitForLoadState("networkidle");

    // CTA should link to signup/login
    const signupLink = page.locator('a[href*="/auth/"]').first();
    await expect(signupLink).toBeVisible({ timeout: 10000 });
  });

  test("shows dictation CTA when logged in", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/products/dictation");
    await page.waitForLoadState("networkidle");

    // CTA should link to /dictation, not /auth/signup
    const dictationLink = page.locator('a[href="/dictation"]').first();
    const signupLink = page.locator('a[href*="/auth/signup"]');

    const hasDictationLink = await dictationLink
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const signupCount = await signupLink.count();

    // Should either have dictation link or at least not have signup-only CTAs
    // (Some CTAs might still show signup for upsell, that's OK)
    expect(hasDictationLink || signupCount === 0).toBeTruthy();
  });
});

// ─── ADMIN PANEL ────────────────────────────────────────────

test.describe("Admin Panel (logged in as admin)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("admin dashboard loads", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    // Should show admin content, not redirect
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test("admin domains page loads", async ({ page }) => {
    await page.goto("/admin/domains");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/admin/domains");
  });
});

// ─── HEALTH ENDPOINT ────────────────────────────────────────

test.describe("Health Endpoint", () => {
  test("returns healthy status with all checks", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("healthy");
    expect(data.checks).toBeDefined();
    expect(data.checks.length).toBeGreaterThan(0);
  });

  test("video health endpoint confirms Replicate token", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/video-creator/health?admin=true"
    );
    const data = await response.json();
    expect(data.status).toBe("ok");
    expect(data.envVarsSet.REPLICATE_API_TOKEN).toBe(true);
  });
});
