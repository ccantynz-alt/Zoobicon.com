import { NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export interface VideoShot {
  shotNumber: number;
  duration: number;
  visual: string;
  textOverlay: string;
  voiceover: string;
  transition: string;
  mood: string;
}

export interface VideoScript {
  title: string;
  totalDuration: number;
  hook: string;
  targetPlatform: string;
  aspectRatio: string;
  shots: VideoShot[];
  voiceoverFull: string;
  musicStyle: string;
  ctaText: string;
}

const TEMPLATE_PROMPTS: Record<string, string> = {
  "product-demo": `You are a viral video scriptwriter for tech products. Create a PRODUCT DEMO video script.
Format: Fast-paced, punchy, shows the product in action.
Structure: Hook (2s) → Problem (3s) → Solution reveal (3s) → Demo montage (12-15s) → Social proof (3s) → CTA (3s).
Style: Clean cuts, big bold text overlays, satisfying reveal moments.`,

  "before-after": `You are a viral video scriptwriter. Create a BEFORE/AFTER transformation video script.
Format: Split-screen or sequential comparison showing the old way vs the new way.
Structure: "Still doing X?" hook (2s) → Old painful way (5s) → Transition wipe (1s) → New amazing way (10s) → Results (3s) → CTA (3s).
Style: Dramatic contrast, use text like "STOP" and "TRY THIS INSTEAD", satisfying transformation moment.`,

  "speedrun": `You are a viral video scriptwriter. Create a SPEEDRUN/TIMELAPSE video script.
Format: Watch something get built impossibly fast. Timer on screen.
Structure: "Watch me build X in Y seconds" (2s) → Live build with timer (15-18s) → Reveal final result (3s) → "Link in bio" CTA (2s).
Style: Screen recording feel, timer ticking, fast typing, code/site appearing in real-time.`,

  "testimonial": `You are a viral video scriptwriter. Create a TESTIMONIAL/RESULTS video script.
Format: Real results, real numbers, trust-building.
Structure: Bold claim hook (2s) → Context/who they are (3s) → The journey (5s) → Results with numbers (8s) → How they did it (3s) → CTA (3s).
Style: Big numbers on screen, before/after metrics, authentic feel.`,

  "feature-highlight": `You are a viral video scriptwriter. Create a FEATURE HIGHLIGHT video script.
Format: Showcase one specific killer feature in depth.
Structure: "Did you know X can do THIS?" hook (2s) → Feature intro (3s) → Step-by-step demo (12s) → "But wait" bonus (3s) → CTA (3s).
Style: Zoom-ins on UI, cursor movements, satisfying interactions, text callouts.`,

  "listicle": `You are a viral video scriptwriter. Create a LISTICLE video script.
Format: "5 things you didn't know about X" or "3 reasons to try X"
Structure: Hook with number (2s) → Item 1 (4s) → Item 2 (4s) → Item 3 (4s) → Item 4 (4s) → "But the best part..." Item 5 (4s) → CTA (3s).
Style: Numbered text overlays, quick transitions, each item is its own mini-reveal.`,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      template = "product-demo",
      brief = "",
      businessName = "Zoobicon",
      product = "AI Website Builder",
      platform = "tiktok",
      duration = 30,
      tone = "confident",
    } = body;

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
    }

    const templatePrompt = TEMPLATE_PROMPTS[template] || TEMPLATE_PROMPTS["product-demo"];

    const aspectRatio = platform === "youtube" ? "16:9" : "9:16";
    const platformName = platform === "tiktok" ? "TikTok/Reels" : platform === "youtube" ? "YouTube" : "Instagram";

    const systemPrompt = `${templatePrompt}

IMPORTANT RULES:
- Target duration: ${duration} seconds total
- Platform: ${platformName} (${aspectRatio} aspect ratio)
- Tone: ${tone}
- Every shot must have a text overlay — viewers watch on mute
- First 2 seconds must hook attention (pattern interrupt, bold claim, or question)
- Include specific timing for each shot
- Voiceover should be punchy, conversational, no corporate speak
- End with a clear CTA

Return ONLY valid JSON matching this exact structure (no markdown, no explanation):
{
  "title": "short video title",
  "totalDuration": ${duration},
  "hook": "the opening hook line",
  "targetPlatform": "${platform}",
  "aspectRatio": "${aspectRatio}",
  "shots": [
    {
      "shotNumber": 1,
      "duration": 3,
      "visual": "description of what's on screen",
      "textOverlay": "BIG TEXT ON SCREEN",
      "voiceover": "what the narrator says",
      "transition": "cut/zoom/wipe/dissolve",
      "mood": "energetic/calm/dramatic/satisfying"
    }
  ],
  "voiceoverFull": "complete voiceover script as one paragraph",
  "musicStyle": "genre and energy level for background music",
  "ctaText": "the final call to action text"
}`;

    const userMessage = `Create a ${duration}-second ${template.replace("-", " ")} video for:
Business: ${businessName}
Product: ${product}
Brief: ${brief || `Promote ${product} by ${businessName} — show why it's the best choice`}
Platform: ${platformName}
Tone: ${tone}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Claude API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse script from AI response");
    }

    const script: VideoScript = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ script });
  } catch (err) {
    console.error("Video script generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Script generation failed" },
      { status: 500 }
    );
  }
}
