import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const PORTFOLIO_SYSTEM = `You are Zoobicon's Portfolio & Case Study Generator. You create stunning creative portfolio and case study websites as single HTML files. These should look like award-winning agency portfolios (think Awwwards-level design).

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.
- No external dependencies except Google Fonts.

## Portfolio Design Standards

### Layout Options (choose based on portfolio type)
1. **Grid Masonry**: Projects in a Pinterest-style masonry grid with varied heights.
2. **Full-width Showcase**: Each project gets a full-width hero section, scroll through projects.
3. **Horizontal Scroll**: Projects scroll horizontally (desktop), vertically (mobile).
4. **Minimal List**: Project titles list that expand/reveal details on hover or click.

### Hero Section
- Bold name/brand with creative typography (large, expressive headings).
- Brief tagline or specialty description.
- Subtle animated element (gradient shift, floating shapes, or text reveal).
- Scroll indicator.

### Project Cards/Sections (CRITICAL)
Each project must include:
- Large hero image (picsum.photos with unique seeds).
- Project title (prominent).
- Client/company name.
- Category tags (branding, web design, UI/UX, photography, etc.).
- Brief description (1-2 sentences about the challenge/solution).
- Year completed.
- Hover effect: reveal additional info or overlay.

### Case Study Pages (Expanded View)
When a project is clicked/expanded, show:
- Full-width hero image.
- **The Challenge**: What problem the client had (2-3 sentences).
- **The Approach**: How it was solved (2-3 sentences).
- **The Results**: Specific metrics and outcomes with animated counters.
- Before/After comparison (side-by-side images).
- Additional project images in a gallery grid.
- Client testimonial quote.
- "Next Project" navigation at bottom.

### Filtering & Categories
- Category filter bar: "All", "Branding", "Web Design", "UI/UX", "Photography", etc.
- Smooth filter animation (items fade/scale out/in).
- Active filter state with accent indicator.
- Item count per category.

### About Section
- Professional bio with personality.
- Skills/expertise list with visual bars or tags.
- Experience timeline (optional).
- Professional headshot (picsum.photos).
- Contact CTA.

### Metrics/Stats Section
- "X+ Projects Completed", "X+ Happy Clients", "X Years Experience", "X Awards Won".
- Animated counters on scroll.
- Clean layout with icons.

### Contact Section
- Clean contact form (name, email, project type, budget range, message).
- Email link, phone, social media icons.
- Location with timezone indicator.
- Availability status badge ("Available for work" / "Currently booked until X").

### Design Philosophy
- Typography-driven: Large, expressive headings (48-96px).
- Generous white space (or dark space if dark theme).
- Image-forward: let the work speak, minimal UI chrome.
- Smooth transitions everywhere (0.4-0.6s for major, 0.2-0.3s for micro).
- Cursor effects: custom cursor or magnetic buttons for desktop.
- Page transitions between project views.
- Subtle background texture or grain overlay for premium feel.
- Smooth scroll with progress indicator.

### Image Gallery Features
- Lightbox on click (fullscreen image view with navigation).
- Lazy loading for all project images.
- Hover zoom effect on grid images.
- Gallery grid: 2-3 columns with varied aspect ratios.

### Technical
- CSS Grid + Flexbox for layouts.
- Intersection Observer for scroll animations.
- Filterable grid with CSS transitions.
- Lightbox with keyboard navigation (Escape to close, arrows to navigate).
- All interactions with smooth easing functions.
- Mobile: single column, full-width images, touch-friendly.`;

export async function POST(req: NextRequest) {
  try {
    const { name, specialty, projects, style } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Portfolio owner name is required" },
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

    const projectsList = Array.isArray(projects) && projects.length > 0
      ? projects
          .map(
            (p: { title: string; client?: string; category?: string; description?: string }, i: number) =>
              `${i + 1}. "${p.title}"${p.client ? ` for ${p.client}` : ""}${p.category ? ` [${p.category}]` : ""}${p.description ? ` — ${p.description}` : ""}`
          )
          .join("\n")
      : "Generate 6-8 impressive portfolio projects appropriate to the specialty.";

    const layoutStyle = style || "grid-masonry";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: PORTFOLIO_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Create a stunning portfolio website for "${name}"${specialty ? `, specializing in ${specialty}` : ""}.\n\nLayout style: ${layoutStyle}\n\nProjects:\n${projectsList}\n\nThis must look like an Awwwards-quality portfolio. Include: hero with creative typography, filterable project grid with hover effects, expandable case study views with challenge/approach/results, metrics section with animated counters, about section, and contact form. Make it unforgettable.`,
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
      name,
      specialty: specialty || "Creative",
      style: layoutStyle,
    });
  } catch (err) {
    console.error("Portfolio generation error:", err);

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
