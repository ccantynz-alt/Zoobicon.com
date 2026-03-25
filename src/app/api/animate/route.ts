import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, checkUsageQuota, trackUsage } from "@/lib/auth-guard";

interface AnimationConfig {
  selector: string;
  type: string;
  options: Record<string, unknown>;
}

const ANIMATION_TYPES = [
  "fadeIn",
  "slideUp",
  "slideDown",
  "slideLeft",
  "slideRight",
  "scaleIn",
  "bounce",
  "rotate",
  "parallax",
  "typewriter",
  "countUp",
  "stagger",
  "morphBackground",
  "scrollReveal",
];

const SYSTEM_PROMPT = `You are an expert CSS animation and motion design engineer. Your job is to inject animations into existing HTML code.

You will receive:
1. The original HTML code
2. A list of animations to apply, each with a CSS selector, animation type, and options

Animation types and what they do:
- fadeIn: Element fades from opacity 0 to 1
- slideUp: Element slides up from below into position
- slideDown: Element slides down from above into position
- slideLeft: Element slides in from the right
- slideRight: Element slides in from the left
- scaleIn: Element scales from small to full size
- bounce: Element bounces into view
- rotate: Element rotates into position
- parallax: Element moves at a different speed on scroll for depth effect
- typewriter: Text appears character by character
- countUp: Numbers animate counting up to their value
- stagger: Child elements animate in sequence with delays
- morphBackground: Background color/gradient smoothly transitions
- scrollReveal: Element reveals on scroll with a clip-path or opacity animation

Rules:
- Output ONLY the modified HTML. No markdown, no explanation, no code fences.
- Add all @keyframes definitions in a <style> tag in the <head> (merge with existing <style> if present).
- Add a lightweight Intersection Observer-based scroll animation script in a <script> tag before </body>.
- The scroll animation script must NOT use any external dependencies.
- Elements with scroll-triggered animations should start hidden and animate in when they enter the viewport.
- Preserve ALL existing functionality, styles, and scripts.
- Use CSS custom properties for animation durations/delays when possible.
- Use data-animate attributes on elements to mark them for scroll-triggered animations.
- Respect the options provided: duration, delay, easing, threshold, etc.
- Make animations performant (prefer transform and opacity over layout-triggering properties).
- Ensure animations work across modern browsers.`;

export async function POST(req: NextRequest) {
  try {
    // Auth + quota enforcement — prevent unauthenticated abuse
    const auth = await authenticateRequest(req, { requireAuth: true, requireVerified: true });
    if (auth.error) return auth.error;
    const quota = await checkUsageQuota(auth.user.email, auth.user.plan, "generation");
    if (quota.error) return quota.error;

    const { code, animations } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "HTML code is required" },
        { status: 400 }
      );
    }

    if (!animations || !Array.isArray(animations) || animations.length === 0) {
      return NextResponse.json(
        { error: "At least one animation configuration is required" },
        { status: 400 }
      );
    }

    for (const anim of animations) {
      if (!anim.selector || !anim.type) {
        return NextResponse.json(
          { error: "Each animation must have a selector and type" },
          { status: 400 }
        );
      }
      if (!ANIMATION_TYPES.includes(anim.type)) {
        return NextResponse.json(
          {
            error: `Invalid animation type: "${anim.type}". Valid types: ${ANIMATION_TYPES.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again later." },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const animationDescriptions = animations
      .map(
        (a: AnimationConfig, i: number) =>
          `${i + 1}. Selector: "${a.selector}" | Type: "${a.type}" | Options: ${JSON.stringify(a.options || {})}`
      )
      .join("\n");

    const userPrompt = `Here is the HTML code to add animations to:

${code}

Please apply the following animations:
${animationDescriptions}

Remember: Output ONLY the complete modified HTML with all animations injected. No markdown, no explanation.`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const animatedCode =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      animatedCode,
      animationsAdded: animations.length,
    });
  } catch (error) {
    console.error("Animation API error:", error);
    return NextResponse.json(
      { error: "Failed to apply animations" },
      { status: 500 }
    );
  }
}
