import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_FEATURES = [
  "course-catalog",
  "lesson-player",
  "progress-tracking",
  "quizzes",
  "certificates",
  "discussion-forums",
  "student-dashboard",
  "instructor-dashboard",
  "assignments",
  "leaderboard",
];

const LMS_SYSTEM = `You are Zoobicon's Learning Management System Generator. You create comprehensive online learning platforms as single HTML files. Think Udemy, Coursera, or Teachable quality.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.

## LMS Features

### Course Catalog
- Course cards: thumbnail, title, instructor, rating, enrollment count, price/free badge.
- Category filters and search.
- Sort: popular, newest, highest rated.
- Course detail page: overview, curriculum outline, instructor bio, reviews, enrollment CTA.

### Lesson Player
- Video placeholder (styled div with play button).
- Lesson sidebar: curriculum with expandable modules, lesson checkmarks, progress bar.
- Previous/Next navigation.
- Lesson content area below video: text notes, downloadable resources.
- Mark as complete button.
- Auto-advance to next lesson toggle.

### Progress Tracking
- Overall course progress circle/bar.
- Module-by-module completion.
- Streak tracking (consecutive days of learning).
- Time spent metrics.
- Learning goals and reminders.

### Quizzes
- Multiple choice, true/false, fill-in-the-blank.
- One question per screen OR all visible.
- Instant feedback (correct/incorrect with explanation).
- Score at end with pass/fail threshold.
- Retry option.
- Quiz timer option.

### Certificates
- Completion certificate (print-ready HTML).
- Student name, course name, date, certificate ID.
- Professional design with border and signature line.
- Download/print button.

### Student Dashboard
- Enrolled courses with progress.
- Continue learning button for last active course.
- Completed courses.
- Certificates earned.
- Learning statistics (hours, courses, streaks).

### Design
- Clean, educational, approachable.
- Light background, blue/indigo primary accent.
- Progress elements in green.
- Card-based course layout.
- Video player area: dark background.
- Sidebar curriculum: clean checklist style.
- Mobile: full-width, bottom nav for lesson player.

### Data
- Seed with 6-8 courses, each with 3-5 modules and 3-4 lessons per module.
- Progress data in localStorage.
- Quiz answers and scores stored.
- 3-4 instructor profiles.
- Realistic course content (titles, descriptions, learning objectives).`;

export async function POST(req: NextRequest) {
  try {
    const { platformName, topic, features, courses } = await req.json();

    if (!platformName || typeof platformName !== "string") {
      return NextResponse.json({ error: "platformName is required" }, { status: 400 });
    }

    const selectedFeatures = Array.isArray(features) && features.length > 0
      ? features.filter((f: string) => VALID_FEATURES.includes(f))
      : ["course-catalog", "lesson-player", "progress-tracking", "quizzes", "student-dashboard", "certificates"];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: LMS_SYSTEM,
      messages: [{
        role: "user",
        content: `Create a learning management system called "${platformName}".\n\nTopic: ${topic || "technology and business"}\nFeatures: ${selectedFeatures.join(", ")}\nCourses: ${Array.isArray(courses) ? courses.join(", ") : "Generate 6-8 realistic courses"}\n\nSeed with full course structure (modules, lessons, quizzes). Progress tracking with localStorage. Lesson player with curriculum sidebar. Student dashboard with enrolled courses and certificates. Make it feel like Udemy or Coursera.`,
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

    return NextResponse.json({ html, platformName, featuresIncluded: selectedFeatures });
  } catch (err) {
    console.error("LMS generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
