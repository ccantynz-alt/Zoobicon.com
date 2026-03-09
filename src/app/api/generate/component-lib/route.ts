import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const COMPONENT_LIB_SYSTEM = `You are Zoobicon's UI Component Library Generator. You create comprehensive, reusable UI component libraries as a single interactive HTML showcase page. Think Shadcn/UI, Radix, or Material Design component documentation.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.

## Component Categories

### Layout Components
- Container (max-width responsive wrapper).
- Grid (12-column responsive grid system with gap).
- Stack (vertical/horizontal flex stack with spacing).
- Divider (horizontal/vertical line separator).

### Typography Components
- Heading (h1-h6 with consistent styling).
- Text (body, small, caption, overline variants).
- Link (with hover underline animation).
- Code (inline and block code styling).
- Badge/pill text.

### Form Components
- Input (text, email, password, number, search — with label, placeholder, error state, disabled state).
- Textarea (with character counter).
- Select (custom styled dropdown with options).
- Checkbox (custom styled with label).
- Radio group (custom styled).
- Toggle switch.
- Range slider with value display.
- File upload dropzone.
- Form group (label + input + error message wrapper).

### Button Components
- Primary (filled with brand color).
- Secondary (outlined).
- Ghost (text-only with hover background).
- Danger (red for destructive actions).
- Icon button (icon-only, circular).
- Button group (connected buttons).
- Loading button (with spinner state).
- Sizes: sm, md, lg.

### Data Display
- Card (image, header, body, footer variants).
- Table (with sorting indicators, striped rows, hover highlight).
- Badge (status colors: success, warning, error, info, neutral).
- Avatar (image, initials fallback, size variants, status dot).
- Progress bar (with value label).
- Stat card (value, label, trend indicator).
- Empty state (icon, message, action button).
- Skeleton loader (content placeholder animation).

### Feedback Components
- Alert (info, success, warning, error with icon, dismissible).
- Toast notification (auto-dismiss, stacking).
- Modal/Dialog (overlay, header, body, footer, close button).
- Confirmation dialog.
- Tooltip (on hover, top/bottom/left/right positioning).
- Loading spinner (multiple sizes).

### Navigation Components
- Navbar (logo, links, CTA button, mobile hamburger).
- Sidebar (collapsible, with icons + labels, active state).
- Tabs (horizontal/vertical, with content panels).
- Breadcrumbs (with separator).
- Pagination (numbered + prev/next).
- Bottom tab bar (mobile navigation).

### Overlay Components
- Dropdown menu (with dividers and icons).
- Bottom sheet (mobile, slide up).
- Command palette (Cmd+K overlay with search).

## Showcase Page Structure

### Navigation
- Sticky sidebar with component category links.
- Search bar to filter components.
- Dark/light mode toggle.

### Per Component
- Component name and description.
- Live interactive demo (the actual component, not a screenshot).
- Variant showcase (all states: default, hover, focus, disabled, error).
- Size variants displayed side by side.
- Usage code snippet (CSS class names and HTML structure).
- Props/options table.

### Design System Foundation
- All components use CSS custom properties.
- Consistent border-radius scale: 4px, 8px, 12px, 16px.
- Consistent shadow scale: sm, md, lg.
- Consistent spacing scale: 4, 8, 12, 16, 24, 32, 48px.
- Consistent color palette with semantic naming.
- All components respect prefers-reduced-motion.
- All components are keyboard accessible.
- Focus-visible outlines on interactive elements.`;

export async function POST(req: NextRequest) {
  try {
    const { libraryName, brandColor, style, components } = await req.json();

    if (!libraryName || typeof libraryName !== "string") {
      return NextResponse.json({ error: "libraryName is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const componentFilter = Array.isArray(components) && components.length > 0
      ? `Only include these components: ${components.join(", ")}.`
      : "Include ALL component categories listed in your instructions.";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: COMPONENT_LIB_SYSTEM,
      messages: [{
        role: "user",
        content: `Create a UI component library called "${libraryName}".\n\nBrand color: ${brandColor || "#6366f1"}\nStyle: ${style || "modern minimal"}\n\n${componentFilter}\n\nBuild an interactive showcase page with live demos, all variants (default/hover/focus/disabled/error), dark mode toggle, and usage code snippets. Every component must use CSS custom properties for easy theming.`,
      }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    let html = textBlock.text.trim();
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({ html, libraryName, style: style || "modern minimal" });
  } catch (err) {
    console.error("Component library generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
