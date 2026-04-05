/**
 * Pre-build check: Verify all lucide-react icon imports exist in the installed version.
 * Catches the #1 recurring build error — icons used but not imported or removed from library.
 */
const fs = require("fs");
const path = require("path");

let lucideExports;
try {
  lucideExports = new Set(Object.keys(require("lucide-react")));
} catch {
  console.log("[icon-check] lucide-react not installed, skipping check");
  process.exit(0);
}

const issues = [];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  // Find lucide-react import block
  const importMatch = content.match(
    /import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/s
  );
  if (!importMatch) return;

  const imported = importMatch[1]
    .split(",")
    .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
    .filter(Boolean);

  for (const icon of imported) {
    if (!lucideExports.has(icon)) {
      issues.push({ file: filePath, icon });
    }
  }

  // Also check for icons used as JSX values (icon: SomeIcon) but not imported
  // Only flag icons with specific lucide-style names (2+ words, PascalCase)
  const iconUsagePattern = /icon:\s*([A-Z][a-z]+[A-Z]\w+)/g;
  let match;
  while ((match = iconUsagePattern.exec(content)) !== null) {
    const iconName = match[1];
    if (!imported.includes(iconName) && lucideExports.has(iconName)) {
      issues.push({
        file: filePath,
        icon: iconName,
        type: "used-not-imported",
      });
    }
  }
}

function walk(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (
      stat.isDirectory() &&
      !item.startsWith(".") &&
      item !== "node_modules"
    ) {
      walk(full);
    } else if (
      (item.endsWith(".tsx") || item.endsWith(".ts")) &&
      stat.isFile()
    ) {
      checkFile(full);
    }
  }
}

walk("src");

if (issues.length > 0) {
  console.error("\n❌ ICON CHECK FAILED — lucide-react import errors:\n");
  for (const issue of issues) {
    if (issue.type === "used-not-imported") {
      console.error(`  ${issue.file}: "${issue.icon}" used but not imported`);
    } else {
      console.error(
        `  ${issue.file}: "${issue.icon}" does not exist in lucide-react`
      );
    }
  }
  console.error(
    "\nFix: Add missing imports or replace with existing icons.\n"
  );
  process.exit(1);
} else {
  console.log("✓ All lucide-react icon imports verified");
}
