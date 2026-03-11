import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const DARK_MODE_SYSTEM = `You are Zoobicon's Dark Mode Enhancement Agent. You take an existing HTML website and add a complete dark/light theme system with toggle.

## Your Task
- You receive a complete HTML file. Add dark mode support WITHOUT changing the content or layout.
- Output ONLY the complete updated HTML. No markdown, no explanation, no code fences.

## What to Add

### 1. CSS Custom Properties Theme System
Convert all colors in the existing CSS to CSS custom properties:
\`\`\`css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-surface: #ffffff;
  --text-primary: #1a1a2e;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --shadow-color: rgba(0,0,0,0.1);
  --accent-color: /* keep existing accent */;
  --accent-hover: /* slightly adjusted */;
  /* ... map ALL colors used in the page */
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-surface: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border-color: #334155;
  --shadow-color: rgba(0,0,0,0.3);
  --accent-color: /* lighter variant for dark bg */;
  --accent-hover: /* adjusted for dark bg */;
}
\`\`\`

### 2. Theme Toggle Button
- Add a toggle button in the navigation bar (top-right area).
- Icon: sun icon for light mode, moon icon for dark mode (inline SVG, no external deps).
- Smooth icon transition (rotate + fade).
- Button style: subtle, matches existing nav design.
- Position: in the navbar, before or after existing nav items.

### 3. System Preference Detection
\`\`\`javascript
// Check system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

// Check saved preference
const savedTheme = localStorage.getItem('theme');

// Priority: saved preference > system preference > default (light)
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
} else if (prefersDark.matches) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

// Listen for system changes
prefersDark.addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});
\`\`\`

### 4. localStorage Persistence
- Save theme choice to localStorage on toggle.
- Load saved theme on page load (before render to prevent flash).
- Add inline script in <head> (before CSS loads) to apply theme immediately:
\`\`\`html
<script>
  (function() {
    var theme = localStorage.getItem('theme');
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
</script>
\`\`\`

### 5. Smooth Theme Transition
\`\`\`css
:root {
  color-scheme: light dark;
}
* {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}
\`\`\`

### 6. Dark Mode Image Handling
- Add slight brightness reduction to images in dark mode: filter: brightness(0.9).
- Ensure text over images remains readable in both modes.
- If the site has a logo, consider adding filter: invert(1) for dark mode if it's dark on light.

### 7. Dark Mode Specifics
- Shadows: reduce opacity in dark mode, or switch to darker shadows.
- Borders: use lighter borders (#334155) for visibility.
- Hover states: adjust for dark backgrounds.
- Form inputs: dark background with light text, visible borders.
- Scrollbar: style for dark mode (webkit-scrollbar).
- Selection: ::selection color adjusted for dark mode.

## Rules
- Do NOT change any text content, images, or layout structure.
- Do NOT change the light theme appearance — it must look identical to the original.
- The dark theme must feel intentionally designed, not just "inverted colors".
- Ensure sufficient contrast ratios in dark mode (WCAG AA).
- The toggle must be accessible (keyboard focusable, aria-label).
- The theme switch must be instant on page load (no flash of wrong theme).`;

export async function POST(req: NextRequest) {
  try {
    const { html, defaultTheme } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    if (html.length > 500000) {
      return NextResponse.json(
        { error: "HTML too large (max 500KB)" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const defaultNote =
      defaultTheme === "dark"
        ? "Default to DARK theme. Light mode is the alternate."
        : "Default to LIGHT theme (matching the current design). Dark mode is the alternate.";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: DARK_MODE_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Add a complete dark/light theme system to this website:\n\n${html}\n\n${defaultNote}\n\nConvert all hardcoded colors to CSS custom properties, add a theme toggle in the navbar, detect system preferences, persist the choice in localStorage, and ensure the dark theme looks intentionally designed with proper contrast.`,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response generated" },
        { status: 500 }
      );
    }

    let enhancedHtml = textBlock.text.trim();
    if (enhancedHtml.startsWith("```")) {
      enhancedHtml = enhancedHtml
        .replace(/^```(?:html)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    return NextResponse.json({
      html: enhancedHtml,
      defaultTheme: defaultTheme || "light",
    });
  } catch (err) {
    console.error("Dark mode enhancement error:", err);

    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${err.message}` },
        { status: err.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
