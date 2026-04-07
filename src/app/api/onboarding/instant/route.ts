import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 300;

type JobStatus = "pending" | "ready" | "error";
type JobRecord = {
  status: JobStatus;
  files?: Record<string, string>;
  dependencies?: Record<string, string>;
  error?: string;
  businessName: string;
  email: string;
  createdAt: number;
};

// Module-scope in-memory store. Survives within a single serverless instance.
const jobs: Map<string, JobRecord> =
  (globalThis as unknown as { __zb_onboarding_jobs?: Map<string, JobRecord> }).__zb_onboarding_jobs || new Map();
(globalThis as unknown as { __zb_onboarding_jobs?: Map<string, JobRecord> }).__zb_onboarding_jobs = jobs;

const REACT_SYSTEM = `You are Zoobicon, the most advanced AI website generator on the market. Output ONLY a valid JSON object with this exact structure — no markdown, no code fences:

{
  "files": {
    "App.tsx": "...",
    "components/Navbar.tsx": "...",
    "components/Hero.tsx": "...",
    "components/Services.tsx": "...",
    "components/About.tsx": "...",
    "components/Testimonials.tsx": "...",
    "components/Contact.tsx": "...",
    "components/Footer.tsx": "...",
    "lib/store.ts": "...",
    "styles.css": "..."
  },
  "dependencies": {}
}

Every component is a working React 18 + TypeScript functional component using Tailwind CSS classes. App.tsx imports every component. Contact form must validate and show a success state. Mobile responsive. $100K agency quality. Specific copy for the actual business — never generic placeholder text.`;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function doGeneration(jobId: string, businessName: string, location: string | undefined) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const rec = jobs.get(jobId);
      if (rec) {
        rec.status = "error";
        rec.error = "AI service is temporarily unavailable.";
      }
      return;
    }

    const client = new Anthropic({ apiKey, timeout: 240_000 });

    const prompt = `Build a complete modern website for ${businessName}${location ? " in " + location : ""}. Include hero, services, about, testimonials, contact form, and footer. Use the business name as the brand. $100K agency quality.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16000,
      system: REACT_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      const rec = jobs.get(jobId);
      if (rec) {
        rec.status = "error";
        rec.error = "AI returned no content.";
      }
      return;
    }

    let raw = textBlock.text.trim();
    raw = raw.replace(/^```(?:json|JSON)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) {
      const rec = jobs.get(jobId);
      if (rec) {
        rec.status = "error";
        rec.error = "AI response was not valid JSON.";
      }
      return;
    }

    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      files?: Record<string, string>;
      dependencies?: Record<string, string>;
    };

    if (!parsed.files || !parsed.files["App.tsx"]) {
      const rec = jobs.get(jobId);
      if (rec) {
        rec.status = "error";
        rec.error = "AI response missing App.tsx.";
      }
      return;
    }

    const rec = jobs.get(jobId);
    if (rec) {
      rec.status = "ready";
      rec.files = parsed.files;
      rec.dependencies = parsed.dependencies || {};
    }
  } catch (err) {
    const rec = jobs.get(jobId);
    if (rec) {
      rec.status = "error";
      rec.error = err instanceof Error ? err.message : "Generation failed.";
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const businessName = typeof body.businessName === "string" ? body.businessName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const location = typeof body.location === "string" ? body.location.trim() : undefined;

    if (businessName.length < 3 || businessName.length > 80) {
      return new Response(
        JSON.stringify({ error: "Business name must be 3 to 80 characters." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Please enter a valid email address." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const jobId = crypto.randomUUID();
    jobs.set(jobId, {
      status: "pending",
      businessName,
      email,
      createdAt: Date.now(),
    });

    // Cleanup old jobs (>1hr)
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [id, rec] of jobs.entries()) {
      if (rec.createdAt < cutoff) jobs.delete(id);
    }

    // Fire and forget — generation runs in background
    void doGeneration(jobId, businessName, location);

    const magicLinkUrl = `/auth/login?onboarding=${jobId}&email=${encodeURIComponent(email)}`;

    return new Response(
      JSON.stringify({ jobId, status: "started", magicLinkUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Could not start onboarding. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return new Response(
      JSON.stringify({ error: "jobId is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const rec = jobs.get(jobId);
  if (!rec) {
    return new Response(
      JSON.stringify({ status: "error", error: "Job not found." }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      status: rec.status,
      files: rec.status === "ready" ? rec.files : undefined,
      dependencies: rec.status === "ready" ? rec.dependencies : undefined,
      error: rec.status === "error" ? rec.error : undefined,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
