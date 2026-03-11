import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_FEATURES = [
  "user-management",
  "analytics-dashboard",
  "billing-subscription",
  "settings-panel",
  "notifications",
  "team-management",
  "file-management",
  "activity-log",
  "api-keys",
  "onboarding-wizard",
  "search",
  "roles-permissions",
];

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  "user-management":
    "User management panel: user table with search/filter, user detail view, edit user modal, invite user flow, status badges (active/inactive/pending), avatar display, role assignment. Include pagination.",
  "analytics-dashboard":
    "Analytics dashboard: KPI cards at top (total users, revenue, growth %, active sessions), line chart for trends (pure CSS/SVG), bar chart for comparisons, donut chart for distribution. Date range picker. Real-time feel with subtle pulse animation on live metrics.",
  "billing-subscription":
    "Billing & subscription management: current plan display with usage meters, plan comparison table, upgrade/downgrade flow, payment method cards (masked card numbers), invoice history table with download buttons, upcoming payment info.",
  "settings-panel":
    "Settings panel: tabbed interface with General, Security, Notifications, API, and Appearance sub-tabs. Toggle switches, input fields, save buttons with loading states. Dark mode toggle in Appearance. Two-factor auth toggle in Security.",
  notifications:
    "Notification center: bell icon with badge count in header, dropdown panel with notification list (read/unread states), notification types (info/warning/success/error icons), mark all as read, individual dismiss. Toast notifications for actions.",
  "team-management":
    "Team management: team members table with roles (Admin/Editor/Viewer), invite member modal with email + role selection, pending invitations list, remove member with confirmation, team activity feed.",
  "file-management":
    "File management: grid/list view toggle, file cards with type icons (PDF, image, doc, spreadsheet), upload dropzone with drag-and-drop, file preview modal, folder navigation breadcrumbs, file size and date metadata, search files.",
  "activity-log":
    "Activity log: chronological event feed with user avatars, action descriptions, timestamps (relative: '2 minutes ago'), filterable by user/action type, expandable detail view, export button.",
  "api-keys":
    "API key management: list of API keys with masked values, create new key modal with name/permissions, copy-to-clipboard button, revoke key with confirmation, last used timestamp, key permissions display.",
  "onboarding-wizard":
    "Onboarding wizard: multi-step progress bar, step content (welcome, profile setup, team invite, integrations, complete), next/back navigation, skip option, completion celebration animation, progress persistence in localStorage.",
  search:
    "Global search: command palette (Cmd+K) overlay, fuzzy search across all entities, categorized results (Users, Files, Settings), keyboard navigation (arrow keys), recent searches, search history.",
  "roles-permissions":
    "Roles & permissions: role list with descriptions, permission matrix table (checkboxes for each permission per role), create custom role, assign permissions, visual permission groups (Users, Billing, Content, Admin).",
};

function buildSystemPrompt(appName: string, appType: string): string {
  return `You are Zoobicon's SaaS Dashboard Generator. You create production-quality SaaS application dashboards as single, complete HTML files. These should look like real SaaS products worth $10,000-$50,000 in development.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document: <!DOCTYPE html>, <html lang="en">, <head> with meta viewport, and <body>.
- All CSS in a <style> tag in <head>. No external stylesheets except Google Fonts.
- All JS in a <script> tag before </body>.

## Application Details
- App Name: ${appName}
- App Type: ${appType}

## Design System — CRITICAL

### Layout
- Sidebar navigation (collapsible): 260px wide on desktop, icon-only (64px) when collapsed, off-canvas on mobile.
- Top header bar: breadcrumbs, global search trigger, notification bell, user avatar dropdown.
- Main content area: max-width 1400px, comfortable padding (24-32px).
- Use CSS Grid for the overall layout, Flexbox for components.

### Color Palette
- Primary brand color derived from app type (blue for tech, green for finance, purple for creative, etc.).
- Sidebar: dark theme (#1a1b2e, #0f172a, or similar dark shade).
- Main content: light background (#f8fafc, #f1f5f9).
- Cards: white (#ffffff) with subtle shadow.
- Status colors: success (#10b981), warning (#f59e0b), error (#ef4444), info (#3b82f6).
- Use CSS custom properties for the entire palette for easy theming.

### Typography
- Import Inter from Google Fonts (the industry standard for SaaS).
- Headings: 600 or 700 weight, tracking -0.02em.
- Body: 400 weight, 14-15px base size (dashboard-appropriate, not blog-sized).
- Monospace for code/API keys: JetBrains Mono or similar.

### Components Must Include
- Cards with 8-12px border-radius, 1px border (#e2e8f0), subtle shadow.
- Tables with sticky headers, zebra striping option, row hover highlight.
- Buttons: primary (filled), secondary (outlined), ghost (text-only), danger (red).
- Form inputs: clean borders, focus ring in brand color, proper labels.
- Badges/pills for statuses with appropriate colors.
- Modal overlays with backdrop blur.
- Dropdown menus with smooth animation.
- Toggle switches (not checkboxes) for boolean settings.
- Tooltips on hover for icon-only buttons.
- Loading skeletons for async states.
- Empty states with illustrations/icons and action buttons.
- Toast notifications (success/error/info) that auto-dismiss.

### Interactions & Polish
- Sidebar nav items: icon + label, active state with accent background, hover effect.
- Sidebar collapse toggle with smooth width transition.
- Smooth page transitions between sections (fade or slide).
- All buttons with loading spinner states.
- Tables with sort indicators on column headers.
- Search with debounced input and results highlighting.
- Modal open/close with scale + fade animation.
- Toast notifications slide in from top-right, auto-dismiss after 4s.
- CSS transitions on ALL interactive elements.

### Responsive Design
- Desktop (>1024px): full sidebar + content.
- Tablet (768-1024px): collapsed sidebar + full content.
- Mobile (<768px): hamburger menu, sidebar as overlay, stacked layouts.
- Tables become scrollable or card-based on mobile.

### Data & State
- All data stored in localStorage for demo persistence.
- Seed data on first load: 10-20 realistic entries for each data type.
- All CRUD operations must work: create, read, update, delete.
- Search and filter must actually filter displayed data.
- Charts must render from data (pure CSS/SVG — NO external libraries).
- Sorting must actually sort table data.

### What Makes This Look Like a REAL SaaS Product
- Consistent spacing system (4px, 8px, 12px, 16px, 24px, 32px, 48px).
- Hover states on EVERYTHING interactive.
- Focus-visible outlines for keyboard navigation.
- Proper form validation with inline error messages.
- Empty states that feel designed, not broken.
- Loading states that feel intentional.
- Breadcrumbs that update with navigation.
- Active sidebar item matches current view.
- Notification badge count that updates.
- User avatar with dropdown menu (profile, settings, logout).`;
}

export async function POST(req: NextRequest) {
  try {
    const { appName, appType, features } = await req.json();

    if (!appName || typeof appName !== "string") {
      return NextResponse.json(
        { error: "appName is required" },
        { status: 400 }
      );
    }

    if (!appType || typeof appType !== "string") {
      return NextResponse.json(
        { error: "appType is required (e.g., 'project management', 'analytics', 'HR')" },
        { status: 400 }
      );
    }

    if (!Array.isArray(features) || features.length === 0) {
      return NextResponse.json(
        { error: "At least one feature is required" },
        { status: 400 }
      );
    }

    const invalidFeatures = features.filter(
      (f: string) => !VALID_FEATURES.includes(f)
    );
    if (invalidFeatures.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid features: ${invalidFeatures.join(", ")}. Valid: ${VALID_FEATURES.join(", ")}`,
        },
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

    const featureList = features
      .map((f: string) => `- ${f}: ${FEATURE_DESCRIPTIONS[f] || f}`)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: buildSystemPrompt(appName, appType),
      messages: [
        {
          role: "user",
          content: `Build a complete SaaS dashboard application called "${appName}" for ${appType}.\n\nRequired features:\n${featureList}\n\nThis must look and feel like a real SaaS product — not a demo or mockup. All features must be fully functional with localStorage persistence. Include realistic seed data. The UI must be polished enough that someone would believe this is a real product.`,
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

    let html = textBlock.text.trim();
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({
      html,
      appName,
      appType,
      featuresIncluded: features,
    });
  } catch (err) {
    console.error("SaaS generation error:", err);

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
