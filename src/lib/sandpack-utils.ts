/**
 * Sandpack utility functions for extracting HTML/CSS/JS into separate files.
 * Used by SandpackPreview to provide in-browser hot-reload preview.
 */

export interface SandpackFiles {
  [path: string]: { code: string; active?: boolean };
}

/**
 * Extracts inline <style> and <script> contents from a complete HTML document
 * into separate CSS and JS files suitable for Sandpack's static template.
 *
 * - All <style> tag contents are combined into /styles.css
 * - All inline <script> tag contents (without src attribute) are combined into /script.js
 * - External <script src="..."> and <link rel="stylesheet"> tags are preserved in HTML
 * - The HTML is updated to reference /styles.css and /script.js instead of inline blocks
 */
export function extractSandpackFiles(fullHtml: string): SandpackFiles {
  if (!fullHtml || !fullHtml.trim()) {
    return {
      "/index.html": {
        code: "<!DOCTYPE html>\n<html>\n<head><title>Empty</title></head>\n<body><p>No content to preview.</p></body>\n</html>",
        active: true,
      },
    };
  }

  let html = fullHtml;
  const cssBlocks: string[] = [];
  const jsBlocks: string[] = [];

  // Extract all <style>...</style> blocks (including those with attributes)
  html = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_match, _attrs: string, content: string) => {
    const trimmed = content.trim();
    if (trimmed) {
      cssBlocks.push(trimmed);
    }
    return ""; // Remove the style tag from HTML
  });

  // Extract all inline <script>...</script> blocks (skip those with src= attribute)
  html = html.replace(/<script([^>]*)>([\s\S]*?)<\/script>/gi, (_match, attrs: string, content: string) => {
    // Keep external scripts (those with src attribute) in the HTML
    if (/\bsrc\s*=/i.test(attrs)) {
      return _match; // Leave external script tags in place
    }
    const trimmed = content.trim();
    if (trimmed) {
      jsBlocks.push(trimmed);
    }
    return ""; // Remove the inline script tag from HTML
  });

  // Inject references to extracted files
  const hasCss = cssBlocks.length > 0;
  const hasJs = jsBlocks.length > 0;

  if (hasCss) {
    // Insert <link> for CSS right before </head> or at end of <head> content
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, '  <link rel="stylesheet" href="/styles.css">\n</head>');
    } else if (/<head[^>]*>/i.test(html)) {
      html = html.replace(/(<head[^>]*>)/i, '$1\n  <link rel="stylesheet" href="/styles.css">');
    } else {
      // No <head> tag at all — wrap in one
      html = html.replace(
        /(<html[^>]*>)/i,
        '$1\n<head>\n  <link rel="stylesheet" href="/styles.css">\n</head>'
      );
    }
  }

  if (hasJs) {
    // Insert <script src> right before </body>
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, '  <script src="/script.js"></script>\n</body>');
    } else if (/<\/html>/i.test(html)) {
      html = html.replace(/<\/html>/i, '<script src="/script.js"></script>\n</html>');
    } else {
      // No </body> or </html> — append at the end
      html += '\n<script src="/script.js"></script>';
    }
  }

  // Clean up any extra blank lines left by extraction
  html = html.replace(/\n{3,}/g, "\n\n");

  const files: SandpackFiles = {
    "/index.html": {
      code: html.trim(),
      active: true,
    },
  };

  if (hasCss) {
    files["/styles.css"] = {
      code: cssBlocks.join("\n\n/* --- */\n\n"),
    };
  }

  if (hasJs) {
    files["/script.js"] = {
      code: jsBlocks.join("\n\n// ---\n\n"),
    };
  }

  return files;
}
