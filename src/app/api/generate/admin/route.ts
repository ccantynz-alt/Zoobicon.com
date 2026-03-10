import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_FEATURES = [
  "content-editor",
  "media-library",
  "user-management",
  "settings",
  "analytics",
  "seo-manager",
  "form-submissions",
  "navigation-editor",
  "theme-customizer",
  "backup-export",
];

const ADMIN_SYSTEM = `You are Zoobicon's Admin Panel / CMS Generator. You create lightweight content management admin panels that let non-technical users manage their website content. Think WordPress admin but modern and clean.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.

## Admin Panel Structure

### Login Screen
- Clean login form with email and password.
- "Remember me" checkbox.
- Demo credentials displayed: admin@example.com / admin123.
- Login validates against localStorage credentials.
- Session persistence in localStorage.

### Dashboard Home
- Welcome message with quick stats cards.
- Recent activity feed.
- Quick action buttons (new page, new post, upload media).
- System status indicators.

### Content Editor
- WYSIWYG-style content editing (contenteditable div with toolbar).
- Toolbar: bold, italic, headings, links, images, lists, quotes.
- Page/post list with status (published/draft/scheduled).
- Create/edit/delete pages.
- SEO fields per page: title, description, slug.
- Preview button (opens content in new view).
- Auto-save to localStorage.

### Media Library
- Grid of uploaded media (use picsum.photos/seed/KEYWORD/WIDTH/HEIGHT with unique keywords for demo images).
- Upload zone (drag-and-drop placeholder).
- Image details: filename, size, dimensions, upload date.
- Copy URL button.
- Delete with confirmation.
- Search/filter media.

### Navigation Editor
- Drag-and-drop menu item reordering.
- Add/remove menu items.
- Nest items for dropdowns.
- Preview navigation structure.
- Save to localStorage.

### Theme Customizer
- Color pickers for primary, secondary, accent, background colors.
- Font selection dropdowns.
- Logo upload placeholder.
- Live preview pane showing changes.
- Reset to defaults button.
- Save theme settings to localStorage.

### Design
- Sidebar navigation (dark theme, 250px wide).
- White main content area.
- Clean, professional UI — not flashy.
- Form elements with proper labels, validation.
- Toast notifications for actions.
- Responsive: sidebar collapses to hamburger on mobile.
- Consistent spacing and component styling.
- Loading states for async actions.

### Data
- Seed with 5-8 demo pages/posts.
- 10+ demo media items.
- Sample navigation structure.
- All CRUD operations work with localStorage.
- Session management for login/logout.`;

export async function POST(req: NextRequest) {
  try {
    const { siteName, features } = await req.json();

    if (!siteName || typeof siteName !== "string") {
      return NextResponse.json({ error: "siteName is required" }, { status: 400 });
    }

    const selectedFeatures = Array.isArray(features) && features.length > 0
      ? features.filter((f: string) => VALID_FEATURES.includes(f))
      : ["content-editor", "media-library", "settings", "analytics"];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: ADMIN_SYSTEM,
      messages: [{
        role: "user",
        content: `Create an admin panel/CMS for managing "${siteName}".\n\nFeatures: ${selectedFeatures.join(", ")}\n\nInclude login screen, dashboard, and all selected feature panels. All CRUD operations must work with localStorage. Seed with realistic demo content. Must feel like a real CMS, not a mockup.`,
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

    return NextResponse.json({ html, siteName, featuresIncluded: selectedFeatures });
  } catch (err) {
    console.error("Admin panel generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
