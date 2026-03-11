import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_FEATURES = [
  "kanban-board",
  "task-list",
  "timeline-gantt",
  "team-members",
  "file-sharing",
  "comments",
  "time-tracking",
  "milestones",
  "calendar",
  "reports",
];

const PROJECT_MGMT_SYSTEM = `You are Zoobicon's Project Management Tool Generator. You create full-featured project management applications as single HTML files. Think Asana, Linear, or Monday.com quality.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.

## Project Management Features

### Kanban Board
- Columns: To Do, In Progress, Review, Done (customizable).
- Drag-and-drop cards between columns (HTML5 drag API).
- Card content: title, assignee avatar, priority badge, due date, label tags.
- Add card: inline form at bottom of each column.
- Card detail modal: full description, comments, attachments, subtasks checklist.
- Column WIP limits with visual indicator.

### Task List
- Table/list view of all tasks across projects.
- Columns: task name, status, assignee, priority, due date, tags.
- Inline editing for quick updates.
- Bulk actions: select multiple → change status, assign, delete.
- Sorting by any column.
- Filtering: status, assignee, priority, date range.
- Subtasks with progress percentage.

### Timeline/Gantt
- Horizontal timeline with task bars (pure CSS/SVG).
- Tasks positioned by start and end dates.
- Color-coded by project or status.
- Today marker line.
- Scroll horizontally across weeks/months.
- Milestones as diamond markers.

### Team
- Team member cards: avatar, name, role, current workload.
- Workload view: bar showing assigned tasks per person.
- Assign tasks to members.
- Activity feed per member.

### Time Tracking
- Start/stop timer on tasks.
- Manual time entry.
- Time log per task and per person.
- Weekly summary view.
- Total hours display.

### Design
- Clean, productivity-focused UI.
- Sidebar: projects list, team, reports, settings.
- Consistent card/task styling.
- Status colors: gray (todo), blue (in progress), orange (review), green (done).
- Priority: red (urgent), orange (high), yellow (medium), gray (low).
- Quick-add: press 'N' or '+' to create new task.
- Keyboard shortcuts.
- Responsive with mobile task list view.

### Data
- Seed with 3 demo projects, 20-30 tasks, 5 team members.
- All operations: create, edit, delete, drag, assign, comment.
- localStorage persistence.
- Stats: tasks completed this week, overdue count, team velocity.`;

export async function POST(req: NextRequest) {
  try {
    const { appName, features, projects } = await req.json();

    if (!appName || typeof appName !== "string") {
      return NextResponse.json({ error: "appName is required" }, { status: 400 });
    }

    const selectedFeatures = Array.isArray(features) && features.length > 0
      ? features.filter((f: string) => VALID_FEATURES.includes(f))
      : ["kanban-board", "task-list", "team-members", "comments", "milestones"];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: PROJECT_MGMT_SYSTEM,
      messages: [{
        role: "user",
        content: `Create a project management tool called "${appName}".\n\nFeatures: ${selectedFeatures.join(", ")}\nSample projects: ${Array.isArray(projects) ? projects.join(", ") : "Website Redesign, Mobile App Launch, Q1 Marketing Campaign"}\n\nSeed with realistic tasks, team members, and project data. Kanban drag-and-drop must work. All CRUD operations functional with localStorage. Make it feel like Asana or Linear.`,
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

    return NextResponse.json({ html, appName, featuresIncluded: selectedFeatures });
  } catch (err) {
    console.error("Project management generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
