import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const EVENT_SYSTEM = `You are Zoobicon's Event & Conference Site Generator. You create stunning event, conference, and meetup websites as single HTML files. Think Apple WWDC, Google I/O, or premium summit landing pages.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.
- No external dependencies except Google Fonts.

## Event Site Sections

### 1. Hero
- Full-viewport dramatic hero with event name, date, and location.
- Countdown timer (days, hours, minutes, seconds — live updating).
- Primary CTA: "Register Now" or "Get Tickets".
- Animated gradient or video-style background (CSS animation).
- Event tagline/theme.

### 2. About / Overview
- Event description (what, why, who it's for).
- Key stats: "500+ Attendees", "30+ Speakers", "3 Days", "50+ Sessions".
- Animated counters on scroll.

### 3. Speakers
- Speaker grid: photo (picsum.photos/seed/SPEAKER-NAME/WIDTH/HEIGHT), name, title, company, social links.
- Hover: bio overlay or expand.
- Featured keynote speakers larger than regular.
- 8-12 speakers minimum.

### 4. Schedule / Agenda
- Tabbed by day (Day 1, Day 2, etc.).
- Timeline layout: time, session title, speaker, room/track.
- Track filtering (e.g., "Technical", "Business", "Workshop").
- Expandable session details.
- "Add to Calendar" button per session.

### 5. Tickets / Registration
- 2-3 ticket tiers (Early Bird, Regular, VIP).
- Price, inclusions checklist, CTA button per tier.
- "Sold Out" state for expired tiers.
- Group discount note.
- Registration form: name, email, company, ticket type, dietary preferences.

### 6. Venue
- Venue name, address, embedded map placeholder.
- Venue photos.
- How to get there (transit, parking, airport).
- Nearby hotels with links.

### 7. Sponsors
- Tiered sponsor logos: Platinum, Gold, Silver.
- "Become a Sponsor" CTA.
- Logo grid with hover link.

### 8. FAQ
- Accordion with common event questions.
- Refund policy, dress code, what's included, COVID policy, etc.

### 9. Footer
- Event organizer info, contact, social links.
- Past event highlights or photos.
- Newsletter signup for updates.

### Countdown Timer
- Live countdown to event date using JavaScript.
- Flip-clock or digital display style.
- Shows "Event Started!" when countdown reaches zero.
- Responsive sizing.

### Design
- Bold, modern, high-energy design.
- Large typography for event name and headings.
- Dynamic background (animated gradient, geometric patterns, or dark with accent lights).
- Smooth scroll animations on all sections.
- Parallax effects on hero.
- Mobile-optimized: stacked layout, full-width elements.
- Consistent accent color throughout.
- Professional imagery.`;

export async function POST(req: NextRequest) {
  try {
    const { eventName, eventType, date, location, speakers, ticketTiers } = await req.json();

    if (!eventName || typeof eventName !== "string") {
      return NextResponse.json({ error: "eventName is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const speakerList = Array.isArray(speakers) && speakers.length > 0
      ? `Speakers:\n${speakers.map((s: { name: string; title?: string; company?: string }, i: number) => `${i + 1}. ${s.name}${s.title ? `, ${s.title}` : ""}${s.company ? ` at ${s.company}` : ""}`).join("\n")}`
      : "Generate 8-12 realistic speakers with diverse backgrounds.";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: EVENT_SYSTEM,
      messages: [{
        role: "user",
        content: `Create an event/conference website for "${eventName}".\n\nType: ${eventType || "tech conference"}\nDate: ${date || "Generate a date 3 months from now"}\nLocation: ${location || "Generate a prestigious venue"}\n\n${speakerList}\n\nInclude: countdown timer, speaker grid, multi-day schedule with track filtering, tiered tickets with registration form, venue info, sponsor logos, FAQ accordion. Make it look like a premium tech conference site.`,
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

    return NextResponse.json({ html, eventName, eventType: eventType || "conference" });
  } catch (err) {
    console.error("Event site generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
