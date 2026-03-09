import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_WIDGETS = [
  "kpi-cards",
  "line-chart",
  "bar-chart",
  "donut-chart",
  "area-chart",
  "data-table",
  "heatmap",
  "progress-bars",
  "activity-feed",
  "map-widget",
  "gauge-chart",
  "sparklines",
];

const WIDGET_DESCRIPTIONS: Record<string, string> = {
  "kpi-cards":
    "KPI summary cards (4-6): each with metric name, large value, trend arrow (up/down), percentage change, mini sparkline or icon. Cards should have subtle color-coding: green for positive trends, red for negative.",
  "line-chart":
    "Line chart using pure SVG: multiple data series with different colors, hover tooltips showing exact values, x-axis (dates/months) and y-axis (values) labels, grid lines, legend. Smooth bezier curves between points. Animate on scroll entry.",
  "bar-chart":
    "Bar chart using pure CSS/SVG: vertical bars with hover highlight, value labels on hover, category labels on x-axis, y-axis scale, optional grouped bars for comparison. Animate bars growing from bottom on scroll entry.",
  "donut-chart":
    "Donut/ring chart using SVG: segments with distinct colors, hover to expand segment slightly, center text showing total or primary metric, legend with values and percentages. Animate segments drawing in on load.",
  "area-chart":
    "Area chart using SVG: filled area below line with gradient opacity, multiple overlapping series optional, hover crosshair showing values for that point, time-based x-axis.",
  "data-table":
    "Data table: sortable columns (click header to sort), search/filter bar, pagination (10/25/50 per page), row actions (view/edit/delete), column resizing handles, export button, status badge column, selectable rows with bulk actions.",
  heatmap:
    "Activity heatmap (GitHub-style): grid of colored cells representing activity intensity over time, color scale legend, hover shows date and value, weekly columns, month labels. CSS Grid based.",
  "progress-bars":
    "Progress/goal tracking bars: horizontal bars with percentage fill, labels and values, color-coded by status (on-track green, at-risk yellow, behind red), animate fill on scroll entry. Include target markers.",
  "activity-feed":
    "Activity/event feed: chronological list with avatars, action descriptions, relative timestamps ('3 min ago'), action type icons, expandable details, 'Load more' button. Newest first.",
  "map-widget":
    "Geographic distribution widget: styled div representing a map with plotted data points, location-based metrics, top locations table alongside. Use CSS shapes for a stylized map representation (not actual map API).",
  "gauge-chart":
    "Gauge/speedometer charts using SVG: semicircle gauge with needle, color zones (red/yellow/green), current value display, min/max labels. Animate needle on load. Good for scores, health metrics, performance ratings.",
  sparklines:
    "Inline sparkline charts: tiny SVG line charts embedded in table cells or KPI cards showing recent trends without axes. 7-day or 30-day mini trends. Color indicates direction (green up, red down).",
};

const DASHBOARD_SYSTEM = `You are Zoobicon's Data Dashboard Generator. You create stunning, production-quality analytics dashboards as single HTML files. These should look like premium dashboard products (think Mixpanel, Datadog, or Stripe Dashboard).

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.
- No external dependencies except Google Fonts.

## Design System

### Layout
- Top navigation bar: app name, date range picker, refresh button, user menu.
- Optional sidebar for dashboard categories/sections.
- Dashboard grid using CSS Grid: widgets placed in a responsive grid.
- Desktop: 12-column grid allowing widgets to span 3, 4, 6, or 12 columns.
- Tablet: 6-column grid, widgets reflow.
- Mobile: single column, widgets stack.
- Comfortable gap between widgets (16-24px).
- Each widget is a card with header (title + actions) and body (chart/content).

### Color Palette
- Dark theme option: #0f172a background, #1e293b cards, #e2e8f0 text.
- Light theme option: #f8fafc background, #ffffff cards, #1e293b text.
- Chart colors: use a consistent palette of 6-8 colors that work together:
  [#6366f1, #8b5cf6, #ec4899, #f43f5e, #f97316, #eab308, #22c55e, #06b6d4]
- Status colors: success #10b981, warning #f59e0b, error #ef4444, info #3b82f6.
- Use CSS custom properties for the entire color system.

### Typography
- Inter for UI text, JetBrains Mono for numbers/metrics.
- Large numbers: 28-36px, 700 weight, letter-spacing -0.02em.
- Labels: 12-13px, 500 weight, uppercase, letter-spacing 0.05em, muted color.
- Body: 14px, 400 weight.

### Chart Standards (CRITICAL — Pure CSS/SVG Only)
- NO external libraries (no Chart.js, no D3, no ApexCharts).
- All charts built with inline SVG or pure CSS.
- SVG charts: use <svg viewBox="..."> with responsive sizing.
- Line/area charts: <polyline> or <path> with SVG coordinates calculated from data.
- Bar charts: <rect> elements or CSS div heights.
- Donut charts: SVG <circle> with stroke-dasharray/stroke-dashoffset.
- Include proper axes, labels, and gridlines.
- Hover interactions with CSS :hover on SVG elements + title attributes or JS tooltips.
- Animate charts on initial render and on scroll into view.

### Interactivity
- Date range picker: preset buttons (Today, 7d, 30d, 90d, 1y) + custom range.
- Widget actions: fullscreen toggle, refresh, export (download CSV of data).
- Data table: sort, search, filter, paginate — all functional.
- Charts: hover tooltips showing exact values.
- Dashboard refresh: simulate data update with loading skeleton.
- Drag-to-reorder widgets (optional, advanced).
- Dark/light mode toggle.

### Data Generation
- Generate realistic, coherent data (numbers that make business sense).
- Time series: 30-90 days of daily data points.
- Trends: include growth patterns, not random noise.
- Store generated data in localStorage.
- On refresh: slightly modify values to simulate real-time updates.
- All data calculations (totals, averages, percentages) must be mathematically correct.

### Widget Card Design
- Border-radius: 12px.
- Shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06).
- Header: widget title (left), action buttons (right), subtle bottom border.
- Body: chart or content with appropriate padding.
- Loading state: skeleton animation while "loading".
- Empty state: icon + message if no data.

### Responsive Behavior
- Desktop (>1200px): full grid layout with sidebar.
- Tablet (768-1200px): smaller grid, sidebar collapses.
- Mobile (<768px): single column, charts resize to full width.
- Tables become horizontally scrollable on mobile.
- KPI cards: 2 per row on mobile (not 4).`;

export async function POST(req: NextRequest) {
  try {
    const { title, description, widgets, theme } = await req.json();

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Dashboard title is required" },
        { status: 400 }
      );
    }

    const selectedWidgets =
      Array.isArray(widgets) && widgets.length > 0
        ? widgets.filter((w: string) => VALID_WIDGETS.includes(w))
        : ["kpi-cards", "line-chart", "bar-chart", "donut-chart", "data-table", "activity-feed"];

    if (selectedWidgets.length === 0) {
      return NextResponse.json(
        {
          error: `No valid widgets selected. Available: ${VALID_WIDGETS.join(", ")}`,
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

    const widgetList = selectedWidgets
      .map((w: string) => `- ${w}: ${WIDGET_DESCRIPTIONS[w] || w}`)
      .join("\n");

    const themeNote = theme === "dark" ? "Use a DARK theme." : theme === "light" ? "Use a LIGHT theme." : "Include a dark/light mode toggle. Default to dark theme.";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: DASHBOARD_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Create a stunning data dashboard: "${title}"${description ? `\n\nDescription: ${description}` : ""}\n\n${themeNote}\n\nRequired widgets:\n${widgetList}\n\nGenerate realistic data that tells a coherent story (e.g., growing user base, seasonal revenue patterns, regional distribution). All charts must be pure CSS/SVG with hover interactions. Include date range picker and dashboard-level controls.`,
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
      title,
      widgetsIncluded: selectedWidgets,
      theme: theme || "auto",
    });
  } catch (err) {
    console.error("Dashboard generation error:", err);

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
