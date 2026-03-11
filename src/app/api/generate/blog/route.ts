import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const BLOG_SYSTEM = `You are Zoobicon's Blog & Content Site Generator. You create professional blog and magazine-style content websites as single HTML files with full functionality.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.
- No external dependencies except Google Fonts.

## Blog Site Structure

### Navigation
- Sticky header with blog name/logo, category links, search icon, dark mode toggle.
- Mobile: hamburger menu with full-screen overlay.
- Search: expandable search bar with live filtering.

### Homepage Layout Options
1. **Magazine**: Featured hero article (full-width) + grid of recent articles.
2. **Classic Blog**: Chronological list with sidebar.
3. **Minimal**: Clean card grid, no sidebar.
4. **Editorial**: Large typography-driven layout with pull quotes.

### Article Cards
- Featured image (picsum.photos/seed/KEYWORD/WIDTH/HEIGHT with a unique descriptive keyword per article).
- Category badge/tag with color coding.
- Title (linked, hover effect).
- Excerpt (2-3 lines, truncated with ellipsis).
- Author: avatar (small picsum.photos/seed/author-name/WIDTH/HEIGHT), name, date.
- Reading time estimate.
- Hover: subtle lift + shadow enhancement.

### Featured/Hero Article
- Full-width hero image with gradient overlay.
- Category badge.
- Large title overlaid on image.
- Author info with avatar.
- "Read More" CTA button.

### Article Detail View (in-page, SPA-style)
When an article card is clicked, show the full article:
- Full-width hero image.
- Title, author info, date, reading time, category.
- Article body with:
  - Proper typography (16-18px, 1.8 line-height, max-width 720px).
  - Pull quotes styled differently.
  - Subheadings (h2, h3) with anchor links.
  - Inline images with captions.
  - Code blocks if technical (styled with monospace font).
  - Bullet lists, numbered lists.
- Table of contents sidebar (sticky on desktop, collapsible on mobile).
- Social share buttons (Twitter, LinkedIn, Facebook, copy link).
- Author bio card at bottom.
- Related articles grid (3 cards).
- Comments section (localStorage-based).
- "Back to all articles" link.
- Progress bar at top showing reading progress.

### Sidebar (if classic layout)
- Search widget.
- Categories list with article counts.
- Recent articles (5 items, thumbnail + title).
- Tags cloud.
- Newsletter signup form.
- Social media links.

### Category Pages
- Filter articles by category when category link/badge is clicked.
- Show category name and description at top.
- Grid of filtered articles.
- Smooth filter animation.

### Content Generation
- Generate 8-12 realistic articles with:
  - Unique titles relevant to the blog topic.
  - Real-sounding excerpts (not lorem ipsum).
  - Full article body (3-5 paragraphs) for at least 3 featured articles.
  - Varied categories (4-6 categories).
  - Different authors (3-4 authors with bios).
  - Realistic dates (spanning the last 3 months).
  - Reading time based on content length.
- Store all articles in a JavaScript data array.
- Render dynamically from data (not hardcoded HTML per article).

### Design Standards
- Typography-first: large, readable text. Serif OR sans depending on blog type.
- Clean whitespace, max content width 1200px for grid, 720px for article body.
- Subtle color palette: mostly neutrals with one accent color for links/CTAs.
- Professional imagery (consistent picsum seeds for visual coherence).
- Smooth transitions and scroll animations.
- Dark mode support with toggle.
- Responsive: full-width on mobile, proper image handling.

### Interactive Features
- Category filtering (no page reload).
- Search with live results.
- Bookmark/save articles (localStorage).
- Dark/light mode toggle with persistence.
- Comments: add/view comments per article (localStorage).
- Newsletter signup with success state.
- Infinite scroll OR pagination for article list.
- Reading progress bar on article view.
- Share buttons with Web Share API on mobile.
- Smooth page transitions between list and detail view.`;

export async function POST(req: NextRequest) {
  try {
    const { blogName, topic, layout, categories } = await req.json();

    if (!blogName || typeof blogName !== "string") {
      return NextResponse.json(
        { error: "blogName is required" },
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

    const layoutType = layout || "magazine";
    const topicText = topic ? `Topic/niche: ${topic}` : "Infer the topic from the blog name.";
    const categoriesText =
      Array.isArray(categories) && categories.length > 0
        ? `Categories: ${categories.join(", ")}`
        : "Generate 4-6 appropriate categories.";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: BLOG_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Create a professional blog/content website called "${blogName}".\n\n${topicText}\nLayout: ${layoutType}\n${categoriesText}\n\nGenerate 8-12 realistic articles with full content for at least 3. Include: homepage with featured article, article cards with filtering, full article view with table of contents and reading progress, search, dark mode, comments, and newsletter signup. Data-driven rendering from JS arrays.`,
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
      blogName,
      topic: topic || "general",
      layout: layoutType,
    });
  } catch (err) {
    console.error("Blog generation error:", err);

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
