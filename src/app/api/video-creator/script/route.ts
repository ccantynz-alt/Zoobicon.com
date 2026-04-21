import { callLLMWithFailover } from "@/lib/llm-provider";

export const maxDuration = 45;

interface ScriptRequest {
  projectType: string;
  topic: string;
  targetAudience?: string;
  tone?: string;
  duration?: string;
  keyPoints?: string[];
}

const TYPE_TEMPLATES: Record<string, string> = {
  "social-ad": `Write a scroll-stopping social media ad script. Structure:
- HOOK (first 2 seconds): An unexpected, provocative, or contrarian statement that makes people stop scrolling. NOT a question — a bold claim, shocking stat, or pattern interrupt. Examples: "This $12 tool replaced my $3,000/month agency", "Your competitors know something you don't", "I deleted every app on my phone except this one"
- PROBLEM (3-5 seconds): Visceral, specific pain point — describe the FEELING, not just the fact. "You know that sinking feeling when you check analytics and nothing's moved in weeks?"
- SOLUTION (5-8 seconds): Introduce the product/service as the transformation, not the tool. "What if you could see results before your morning coffee?"
- PROOF (3-5 seconds): Specific numbers, timeframes, transformations. "Sarah went from 200 to 14,000 followers in 6 weeks"
- CTA (2-3 seconds): Create FOMO or urgency. "The beta closes Friday" or "First 100 users get lifetime access"`,

  "product-demo": `Write a product demo script that makes viewers feel the product. Structure:
- HOOK (3-5 seconds): Show the END result first — the "after" state. "Watch me build a complete website in 90 seconds"
- BEFORE (5-8 seconds): Show the painful "before" — the old way of doing things, how much it costs, how long it takes
- THE MOMENT (5-8 seconds): The dramatic reveal — show the product in action with real-time results. Speed, ease, quality.
- DEEP DIVE (10-20 seconds): 2-3 specific features, each demonstrated with concrete output. Not bullet points — show real results
- MONEY SHOT (5 seconds): The final, complete result side-by-side with what it replaced
- CTA (3-5 seconds): Bridge to action with a value anchor — "All of this for less than your morning coffee"`,

  "explainer": `Write an explainer video that teaches AND sells. Structure:
- HOOK (3-5 seconds): "Most people think X. They're wrong." or "There's a reason why Y is happening right now."
- THE SHIFT (5-10 seconds): Explain the paradigm change — what's different now that makes this possible/necessary
- THE FRAMEWORK (15-30 seconds): Break down the concept in 3 clear steps. Each step should have a memorable name or metaphor. Use analogies people already understand.
- PROOF IT WORKS (5-10 seconds): Case study, data point, or before/after that validates the framework
- YOUR MOVE (3-5 seconds): "Now you have two choices — keep doing X, or start doing Y. Here's how."`,

  "testimonial": `Write a testimonial video script that feels REAL, not scripted. Structure:
- IDENTITY (3-5 seconds): "I'm [name], [relatable role]. I'm not a tech person / I don't have a big budget / I was skeptical."
- THE STRUGGLE (5-10 seconds): Paint a SPECIFIC picture — not "I had a problem" but "I was spending every Sunday night rebuilding my website instead of being with my family"
- THE MOMENT (3-5 seconds): When they discovered the solution — make it feel like a turning point, not an ad
- THE TRANSFORMATION (10-15 seconds): SPECIFIC metrics and emotional change. "My site went from 40 visitors to 2,000 in the first month. But honestly? The best part was not dreading Monday mornings anymore."
- THE RECOMMENDATION (5-8 seconds): Speak directly to the viewer — "If you're where I was 6 months ago, just try it. You'll wonder why you waited."`,

  "brand-story": `Write a brand story that creates an emotional connection. Structure:
- THE MOMENT (5-10 seconds): Start with a specific, vivid moment — not "we started in 2020" but "It was 2am, I was staring at a blank screen, and I realized nobody should have to go through this"
- THE WHY (5-8 seconds): The injustice, gap, or frustration that demanded a solution. Make it personal and universal at the same time.
- THE STRUGGLE (5-8 seconds): Show vulnerability — what almost made you quit, what went wrong, what you learned. This is what makes it human.
- THE BREAKTHROUGH (10-15 seconds): The moment it clicked — show real impact on real people. Use specific names, numbers, transformations.
- THE INVITATION (5-8 seconds): "This isn't just our story anymore. It's yours too." Frame the audience as the next chapter.`,

  "tutorial": `Write a tutorial that viewers will actually follow. Structure:
- THE PROMISE (3-5 seconds): "In the next [X] seconds, you'll know how to [specific outcome]." Not "learn about" — "know how to."
- THE CONTEXT (3-5 seconds): "You'll need: [specific list]. That's it."
- STEP-BY-STEP (20-40 seconds): Number each step. For each step: (1) Say what to do, (2) Show it being done, (3) Show the result. Use the phrase "Notice how..." to direct attention to key details.
- THE SHORTCUT (5-8 seconds): One pro tip that saves time or avoids the #1 mistake. "Here's what most tutorials won't tell you..."
- THE WIN (3-5 seconds): Show the complete result. "You just built X in Y minutes. Share it with #hashtag to show me."`,
};

export async function POST(request: Request) {
  try {
    const body: ScriptRequest = await request.json();
    const { projectType, topic, targetAudience, tone, duration, keyPoints } = body;

    if (!projectType || !topic) {
      return Response.json({ error: "Missing required fields: projectType, topic" }, { status: 400 });
    }

    const typeTemplate = TYPE_TEMPLATES[projectType] || TYPE_TEMPLATES["social-ad"];
    const durationStr = duration || "30s";
    const durationNum = parseInt(durationStr) || 30;

    const systemPrompt = `You are a top-tier video scriptwriter — your scripts get millions of views on TikTok, Instagram, and YouTube. You write like a human storyteller, not a corporate copywriter.

You MUST respond with ONLY valid JSON — no markdown, no code fences, no explanation text.

JSON schema:
{
  "script": "The complete video script with natural narration/voiceover text. Include [PAUSE] markers for dramatic pauses. Include (VISUAL CUE: description) inline notes for key visual moments.",
  "scenes": number (estimated number of distinct visual scenes),
  "estimatedDuration": "Xs" (estimated read time in seconds),
  "hooks": ["3-5 alternative opening hook lines that could replace the first line"]
}

WRITING RULES:
- Write like you're talking to ONE person, not an audience. Use "you" constantly.
- Read every sentence aloud in your head — if it sounds like a brochure, rewrite it.
- Target ~150 words per minute. For a ${durationStr} video, write approximately ${Math.round((durationNum / 60) * 150)} words.
- Vary sentence length dramatically. Short punchy. Then a longer, more flowing sentence that builds momentum and draws the viewer deeper.
- Use concrete specifics: "47% faster" beats "significantly faster". "$12/month" beats "affordable".
- Include [PAUSE] after emotional beats — give the viewer time to feel.
- Include (VISUAL CUE: ...) notes for key visual moments — be cinematic and specific.

BANNED PHRASES (never use these):
- "In today's fast-paced world" / "In this digital age"
- "Take your business to the next level"
- "Seamless" / "Cutting-edge" / "Revolutionary" / "Game-changing"
- "But wait, there's more"
- "Whether you're a [list of 5 personas]"
- "Look no further"
- "Without further ado"
- "The possibilities are endless"

THE HOOK TEST: The first sentence must make someone stop scrolling. If it could be the opening of any video about any topic, it's too generic. It must be SPECIFIC to this exact topic.`;

    const userMessage = `Write a ${durationStr} video script.

PROJECT TYPE: ${projectType.replace(/-/g, " ")}
${typeTemplate}

TOPIC/BRIEF: ${topic}

TARGET AUDIENCE: ${targetAudience || "general audience"}

TONE: ${tone || "engaging and professional"}

${keyPoints?.length ? `KEY POINTS TO COVER:\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}` : ""}

Write the script as JSON now.`;

    const response = await callLLMWithFailover(
      {
        model: "claude-sonnet-4-6",
        system: systemPrompt,
        userMessage,
        maxTokens: 4096,
      },
      (provider, model) => {
        console.warn(`[video-creator/script] Failed over to ${provider}:${model}`);
      },
    );

    let parsed;
    try {
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("[video-creator/script] Failed to parse LLM response:", response.text.slice(0, 500));
      return Response.json({ error: "Failed to parse script. Please try again." }, { status: 500 });
    }

    if (!parsed.script || typeof parsed.script !== "string") {
      return Response.json({ error: "Invalid script response. Please try again." }, { status: 500 });
    }

    const result = {
      script: parsed.script,
      scenes: parsed.scenes || Math.ceil(durationNum / 8),
      estimatedDuration: parsed.estimatedDuration || durationStr,
      hooks: Array.isArray(parsed.hooks) ? parsed.hooks : [],
    };

    return Response.json(result);
  } catch (err) {
    console.error("[video-creator/script] Error:", err);
    const raw = err instanceof Error ? err.message : "";
    let message = "Script generation failed. Please try again.";
    if (raw.toLowerCase().includes("rate limit") || raw.includes("429"))
      message = "AI service is busy. Please wait a moment and try again.";
    return Response.json({ error: message }, { status: 500 });
  }
}
