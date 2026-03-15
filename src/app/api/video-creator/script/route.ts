import { callLLM } from "@/lib/llm-provider";

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
  "social-ad": `Write a social media ad script. Structure:
- HOOK (first 2 seconds): A bold, attention-grabbing statement or question
- PROBLEM (3-5 seconds): Relatable pain point
- SOLUTION (5-8 seconds): Introduce the product/service
- PROOF (3-5 seconds): Social proof, stats, or results
- CTA (2-3 seconds): Clear call to action with urgency`,

  "product-demo": `Write a product demo script. Structure:
- INTRO (3-5 seconds): Name the product and its core promise
- PROBLEM (5-8 seconds): Show the problem it solves
- WALKTHROUGH (15-30 seconds): Step-by-step feature demonstration
- RESULTS (5-8 seconds): Show the outcome/transformation
- CTA (3-5 seconds): How to get started`,

  "explainer": `Write an explainer video script. Structure:
- HOOK (3-5 seconds): Pose the question or problem
- CONTEXT (5-10 seconds): Why this matters
- EXPLANATION (15-30 seconds): Break down the concept in 3-4 simple steps
- EXAMPLE (5-10 seconds): Real-world application
- SUMMARY (3-5 seconds): Key takeaway and next step`,

  "testimonial": `Write a testimonial video script. Structure:
- INTRO (3-5 seconds): Who the person is and their role
- BEFORE (5-10 seconds): What their situation was like before
- DISCOVERY (3-5 seconds): How they found the solution
- TRANSFORMATION (10-15 seconds): Specific results with numbers/metrics
- RECOMMENDATION (5-8 seconds): Why they'd recommend it`,

  "brand-story": `Write a brand story video script. Structure:
- ORIGIN (5-10 seconds): How and why the brand started
- MISSION (5-8 seconds): What drives the team
- CHALLENGE (5-8 seconds): Obstacles overcome
- IMPACT (10-15 seconds): Real impact on customers/community
- VISION (5-8 seconds): Where the brand is headed`,

  "tutorial": `Write a tutorial video script. Structure:
- INTRO (3-5 seconds): What viewers will learn
- PREREQUISITES (3-5 seconds): What's needed to follow along
- STEPS (20-40 seconds): Numbered, clear instructions for each step
- TIPS (5-8 seconds): Pro tips or common mistakes to avoid
- RECAP (3-5 seconds): Quick summary of what was covered`,
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

    const systemPrompt = `You are an expert video scriptwriter who creates engaging, conversion-optimized scripts for social media and marketing videos.

You MUST respond with ONLY valid JSON — no markdown, no code fences, no explanation text.

JSON schema:
{
  "script": "The complete video script with natural narration/voiceover text. Include [PAUSE] markers for dramatic pauses. Include (VISUAL CUE: description) inline notes for key visual moments.",
  "scenes": number (estimated number of distinct visual scenes),
  "estimatedDuration": "Xs" (estimated read time in seconds),
  "hooks": ["3-5 alternative opening hook lines that could replace the first line"]
}

Rules:
- The script should read naturally when spoken aloud
- Target a speaking pace of ~150 words per minute
- For a ${durationStr} video, write approximately ${Math.round((durationNum / 60) * 150)} words
- Include emotional beats and pacing variation
- Every sentence should earn its place — no filler
- The opening line must be a scroll-stopping hook`;

    const userMessage = `Write a ${durationStr} video script.

PROJECT TYPE: ${projectType.replace(/-/g, " ")}
${typeTemplate}

TOPIC/BRIEF: ${topic}

TARGET AUDIENCE: ${targetAudience || "general audience"}

TONE: ${tone || "engaging and professional"}

${keyPoints?.length ? `KEY POINTS TO COVER:\n${keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}` : ""}

Write the script as JSON now.`;

    const response = await callLLM({
      model: "claude-sonnet-4-6",
      system: systemPrompt,
      userMessage,
      maxTokens: 4096,
    });

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
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
