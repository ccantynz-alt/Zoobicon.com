import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const ANIMATIONS_SYSTEM = `You are Zoobicon's Animation Enhancement Agent. You take an existing HTML website and inject premium scroll animations, parallax effects, and micro-interactions that make it look like a $20,000+ agency build.

## Your Task
- You receive a complete HTML file. Enhance it with animations WITHOUT changing the content, layout, or design.
- Output ONLY the complete updated HTML. No markdown, no explanation, no code fences.

## Animations to Add

### 1. Scroll-Triggered Reveals
- Add \`.reveal\` class to all section headings, cards, images, and content blocks.
- Use Intersection Observer to trigger animations when elements enter viewport.
- Animation types to rotate between:
  - \`fadeInUp\`: opacity 0→1, translateY(40px→0)
  - \`fadeInLeft\`: opacity 0→1, translateX(-40px→0)
  - \`fadeInRight\`: opacity 0→1, translateX(40px→0)
  - \`scaleIn\`: opacity 0→1, scale(0.95→1)
- Use staggered delays for grouped items (cards, features, grid items): each child gets +0.1s delay.
- Easing: cubic-bezier(0.16, 1, 0.3, 1) for smooth deceleration.
- Duration: 0.8s for most elements, 1s for hero elements.

### 2. Parallax Effects
- Hero section background: add \`background-attachment: fixed\` or JS-based parallax (translateY at 0.3x scroll speed).
- Floating decorative elements: subtle up/down movement on scroll at 0.1-0.2x speed.
- Section background images: slight parallax offset for depth.

### 3. Animated Number Counters
- Find any statistics/numbers in the HTML (years of experience, clients served, projects, etc.).
- Wrap them in counter elements that animate from 0 to target value on scroll.
- Duration: 2s with easeOutExpo timing.
- Add "+" suffix for numbers where appropriate.

### 4. Text Animations
- Hero headline: split into words, animate each word with staggered fadeInUp (0.05s delay between words).
- Section headings: subtle fadeInUp on scroll entry.
- Do NOT animate body text — only headings and hero text.

### 5. Smooth Scroll Enhancements
- Add \`scroll-behavior: smooth\` to html.
- Navbar links with hash targets: smooth scroll with offset for sticky nav height.
- Add scroll progress indicator bar at top of page (thin colored bar showing scroll %).

### 6. Hover Micro-Interactions
- Buttons: add magnetic effect (slight movement toward cursor on hover within 50px).
- Cards: enhance existing hover with subtle tilt effect (perspective + rotateX/Y based on mouse position).
- Images in cards: add Ken Burns effect (slow scale animation on hover, 8s duration).
- Links: add underline slide-in animation from left to right.

### 7. Page Load Animation
- Hero content: cascade animation on page load (0.3s stagger between headline, subtitle, CTA).
- Navbar: slide down from top (translateY(-100%→0)) on load.

### 8. Floating/Breathing Animations
- Add subtle continuous floating animation to decorative elements, icons, or accent shapes.
- Use \`animation: float 6s ease-in-out infinite\` with translateY(±10px).

## Technical Requirements
- All animations must respect \`prefers-reduced-motion: reduce\` — disable all animations if set.
- Use CSS @keyframes for repeating animations.
- Use Intersection Observer API for scroll-triggered animations (NOT scroll event listener).
- Keep performance in mind: use \`transform\` and \`opacity\` only (GPU-accelerated properties).
- Use \`will-change: transform, opacity\` on animated elements.
- All JS must be vanilla — no external libraries.
- Animation CSS goes in the existing <style> tag.
- Animation JS goes in the existing <script> tag or a new one before </body>.

## What NOT to Do
- Do NOT change any content, text, images, or links.
- Do NOT change colors, fonts, or layout structure.
- Do NOT add particle effects, matrix animations, or typing effects.
- Do NOT make animations slow or dramatic — subtlety is key.
- Do NOT add animations that block user interaction or cause layout shifts.`;

const VALID_ANIMATION_TYPES = [
  "scroll-reveals",
  "parallax",
  "counters",
  "text-animations",
  "hover-effects",
  "page-load",
  "floating",
  "scroll-progress",
  "all",
];

export async function POST(req: NextRequest) {
  try {
    const { html, animations } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    if (html.length > 500000) {
      return NextResponse.json(
        { error: "HTML too large (max 500KB)" },
        { status: 400 }
      );
    }

    const selectedAnimations: string[] =
      Array.isArray(animations) && animations.length > 0
        ? animations.filter((a: string) => VALID_ANIMATION_TYPES.includes(a))
        : ["all"];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const animationFilter =
      selectedAnimations.includes("all")
        ? "Add ALL animation types listed in your instructions."
        : `Only add these animation types: ${selectedAnimations.join(", ")}. Skip the others.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: ANIMATIONS_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Here is the HTML website to enhance with animations:\n\n${html}\n\n---\n\n${animationFilter}\n\nAdd premium scroll animations, parallax effects, and micro-interactions. Keep every piece of content, color, and layout exactly the same — only add motion and polish.`,
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

    let enhancedHtml = textBlock.text.trim();
    if (enhancedHtml.startsWith("```")) {
      enhancedHtml = enhancedHtml
        .replace(/^```(?:html)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    return NextResponse.json({
      html: enhancedHtml,
      animationsApplied: selectedAnimations,
    });
  } catch (err) {
    console.error("Animation enhancement error:", err);

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
