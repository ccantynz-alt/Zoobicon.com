import { test } from "node:test";
import assert from "node:assert/strict";

// Extract the JSX string from the fixed module by reading the source
// Since we can't render React without a full environment, we parse the raw source
// of the component to verify href values are not "#" or empty.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixedSource = readFileSync(resolve(__dirname, "components/Footer.tsx"), "utf-8");

test('Privacy link does not use href="#"', () => {
  // Find the Privacy anchor href
  const privacyMatch = fixedSource.match(/href="([^"]*)"[^>]*>Privacy</);
  assert.ok(privacyMatch, "Privacy anchor tag not found in Footer.tsx");
  const href = privacyMatch[1];
  assert.notEqual(href, "#", 'Privacy link href must not be "#"');
  assert.ok(href.length > 0, "Privacy link href must not be empty");
});

test('Terms link does not use href="#"', () => {
  // Find the Terms anchor href
  const termsMatch = fixedSource.match(/href="([^"]*)"[^>]*>Terms</);
  assert.ok(termsMatch, "Terms anchor tag not found in Footer.tsx");
  const href = termsMatch[1];
  assert.notEqual(href, "#", 'Terms link href must not be "#"');
  assert.ok(href.length > 0, "Terms link href must not be empty");
});

test('Privacy link points to a real path', () => {
  const privacyMatch = fixedSource.match(/href="([^"]*)"[^>]*>Privacy</);
  assert.ok(privacyMatch, "Privacy anchor tag not found");
  assert.equal(privacyMatch[1], "/privacy", 'Privacy href should be "/privacy"');
});

test('Terms link points to a real path', () => {
  const termsMatch = fixedSource.match(/href="([^"]*)"[^>]*>Terms</);
  assert.ok(termsMatch, "Terms anchor tag not found");
  assert.equal(termsMatch[1], "/terms", 'Terms href should be "/terms"');
});

test('No anchor tags with href="#" exist in Footer', () => {
  const hashHrefMatches = fixedSource.match(/href="#"/g);
  assert.equal(
    hashHrefMatches,
    null,
    `Found ${hashHrefMatches ? hashHrefMatches.length : 0} anchor(s) with href="#" — all should be replaced`
  );
});