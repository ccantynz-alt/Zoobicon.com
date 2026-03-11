import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_FEATURES = [
  "employee-directory",
  "leave-management",
  "attendance-tracking",
  "payroll-overview",
  "org-chart",
  "performance-reviews",
  "recruitment",
  "onboarding",
  "document-management",
  "announcements",
];

const HRM_SYSTEM = `You are Zoobicon's HR Management System Generator. You create comprehensive HR management dashboards as single HTML files. Think BambooHR, Gusto, or Rippling quality.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.

## HRM Dashboard Structure

### Layout
- Sidebar navigation (dark theme) with HR-specific icons.
- Top bar: company name, search, notifications, user profile.
- Dashboard home: today's summary (birthdays, anniversaries, on leave, pending approvals).

### Employee Directory
- Searchable/filterable employee table.
- Employee card view toggle.
- Each employee: photo, name, department, role, email, phone, status.
- Employee detail: full profile, employment history, documents, leave balance.
- Add/edit employee form with validation.

### Leave Management
- Leave request form: type (vacation, sick, personal), dates, reason.
- Leave calendar: team view showing who's out.
- Pending approvals list for managers.
- Leave balance display per employee.
- Leave history table.

### Attendance
- Clock in/out button with timestamp.
- Today's attendance summary.
- Monthly attendance report.
- Late/absent tracking with visual indicators.

### Payroll Overview
- Payroll summary: total payroll cost, headcount, average salary.
- Employee compensation table (sortable).
- Pay period selector.
- Payslip template view.

### Org Chart
- Visual hierarchy tree using CSS/SVG.
- Expandable/collapsible departments.
- Employee cards on each node.
- Search to highlight position.

### Performance Reviews
- Review cycles list.
- Self-assessment form.
- Manager feedback form.
- Rating scales (1-5 or 1-10).
- Goals tracking with progress bars.

### Data
- Seed with 20-30 employees across 4-5 departments.
- Realistic names, titles, salaries, leave balances.
- All stored in localStorage.
- All CRUD operations functional.
- Charts and stats calculated from data.

### Design
- Professional, corporate, warm.
- Blue/teal primary palette.
- Clean data tables, well-organized forms.
- Status badges for everything (active/on-leave/probation).
- Mobile responsive with collapsible sidebar.`;

export async function POST(req: NextRequest) {
  try {
    const { companyName, features, departments } = await req.json();

    if (!companyName || typeof companyName !== "string") {
      return NextResponse.json({ error: "companyName is required" }, { status: 400 });
    }

    const selectedFeatures = Array.isArray(features) && features.length > 0
      ? features.filter((f: string) => VALID_FEATURES.includes(f))
      : ["employee-directory", "leave-management", "attendance-tracking", "org-chart", "announcements"];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: HRM_SYSTEM,
      messages: [{
        role: "user",
        content: `Create an HR management system for "${companyName}".\n\nDepartments: ${Array.isArray(departments) ? departments.join(", ") : "Engineering, Marketing, Sales, Operations, HR"}\nFeatures: ${selectedFeatures.join(", ")}\n\nSeed with 20-30 realistic employees. All CRUD operations must work with localStorage. Include dashboard with today's summary, attendance tracking, and team calendar.`,
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

    return NextResponse.json({ html, companyName, featuresIncluded: selectedFeatures });
  } catch (err) {
    console.error("HRM generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
