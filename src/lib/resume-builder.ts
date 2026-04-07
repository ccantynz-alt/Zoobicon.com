/**
 * Resume Builder — Anthropic-powered resume generation, tailoring, ATS scoring, cover letters.
 * Uses claude-haiku-4-5-20251001 via raw fetch (no SDK dependency).
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

export interface ResumeExperience {
  company: string;
  role: string;
  start: string;
  end: string;
  bullets: string[];
}

export interface ResumeEducation {
  school: string;
  degree: string;
  year: string;
}

export interface ResumeInput {
  name: string;
  title: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  summary?: string;
}

export interface ResumeSections {
  header: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
}

export interface Resume {
  markdown: string;
  html: string;
  sections: ResumeSections;
}

export interface CoverLetterInput {
  resume: Resume;
  jobDescription: string;
  company: string;
}

export class MissingApiKeyError extends Error {
  public readonly status: number = 503;
  constructor() {
    super("ANTHROPIC_API_KEY is not configured");
    this.name = "MissingApiKeyError";
  }
}

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
}

async function callAnthropic(
  system: string,
  messages: AnthropicMessage[],
  maxTokens: number = 2048
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as AnthropicResponse;
  const text = data.content
    .map((c) => (c.type === "text" && c.text ? c.text : ""))
    .join("");
  return text.trim();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("# ")) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith("## ")) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith("### ")) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith("- ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${escapeHtml(line.slice(2))}</li>`);
    } else if (line.length === 0) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push("");
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<p>${escapeHtml(line)}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

function buildSections(input: ResumeInput, summary: string): ResumeSections {
  const header = `# ${input.name}\n## ${input.title}`;
  const summarySection = `## Summary\n${summary}`;
  const expSection =
    "## Experience\n" +
    input.experience
      .map(
        (e) =>
          `### ${e.role} — ${e.company}\n${e.start} – ${e.end}\n` +
          e.bullets.map((b) => `- ${b}`).join("\n")
      )
      .join("\n\n");
  const eduSection =
    "## Education\n" +
    input.education
      .map((e) => `- ${e.degree}, ${e.school} (${e.year})`)
      .join("\n");
  const skillsSection = "## Skills\n" + input.skills.map((s) => `- ${s}`).join("\n");
  return {
    header,
    summary: summarySection,
    experience: expSection,
    education: eduSection,
    skills: skillsSection,
  };
}

export async function generateResume(input: ResumeInput): Promise<Resume> {
  const system =
    "You are an elite executive resume writer. Write crisp, metric-driven, ATS-friendly resume content. No fluff, no buzzwords, no first person.";

  let summary = input.summary ?? "";
  if (!summary) {
    summary = await callAnthropic(
      system,
      [
        {
          role: "user",
          content: `Write a 2-3 sentence professional summary for ${input.name}, a ${input.title}. Skills: ${input.skills.join(", ")}. Most recent role: ${input.experience[0]?.role ?? "N/A"} at ${input.experience[0]?.company ?? "N/A"}. Return only the summary text.`,
        },
      ],
      400
    );
  }

  // Have Claude polish bullets for impact
  const polishedBullets = await callAnthropic(
    system,
    [
      {
        role: "user",
        content: `Rewrite these resume bullets to be metric-driven, action-verb-led, and ATS-friendly. Return JSON array of arrays matching the input shape exactly.\n\nINPUT: ${JSON.stringify(input.experience.map((e) => e.bullets))}`,
      },
    ],
    1500
  );

  let polished: string[][] = input.experience.map((e) => e.bullets);
  try {
    const match = polishedBullets.match(/\[[\s\S]*\]/);
    if (match) {
      const parsed: unknown = JSON.parse(match[0]);
      if (Array.isArray(parsed)) {
        polished = parsed.map((row, i) =>
          Array.isArray(row)
            ? row.map((b) => String(b))
            : input.experience[i]?.bullets ?? []
        );
      }
    }
  } catch {
    // keep original bullets
  }

  const enrichedInput: ResumeInput = {
    ...input,
    experience: input.experience.map((e, i) => ({
      ...e,
      bullets: polished[i] ?? e.bullets,
    })),
  };

  const sections = buildSections(enrichedInput, summary);
  const markdown = [
    sections.header,
    sections.summary,
    sections.experience,
    sections.education,
    sections.skills,
  ].join("\n\n");
  const html = markdownToHtml(markdown);

  return { markdown, html, sections };
}

export async function extractKeywords(jobDescription: string): Promise<string[]> {
  const system =
    "You extract ATS keywords from job descriptions. Return ONLY a JSON array of strings — skills, tools, certifications, role-specific terms. No commentary.";
  const text = await callAnthropic(
    system,
    [{ role: "user", content: jobDescription }],
    800
  );
  try {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const parsed: unknown = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((k) => String(k)).filter((k) => k.length > 0);
  } catch {
    return [];
  }
}

export async function tailorResume(
  resume: Resume,
  jobDescription: string
): Promise<Resume> {
  const system =
    "You rewrite resumes to align with specific job descriptions. Preserve all factual information (dates, companies, titles). Reorder and rephrase to match JD keywords. Return ONLY the rewritten markdown resume, no preamble.";
  const markdown = await callAnthropic(
    system,
    [
      {
        role: "user",
        content: `JOB DESCRIPTION:\n${jobDescription}\n\nCURRENT RESUME (markdown):\n${resume.markdown}\n\nRewrite the resume markdown to maximize alignment with the JD. Keep all facts. Return only markdown.`,
      },
    ],
    3000
  );

  const cleaned = markdown.replace(/^```(?:markdown)?\n?/i, "").replace(/```$/g, "").trim();
  const html = markdownToHtml(cleaned);
  return {
    markdown: cleaned,
    html,
    sections: resume.sections,
  };
}

export async function atsScore(
  resume: Resume,
  jobDescription: string
): Promise<number> {
  const keywords = await extractKeywords(jobDescription);
  if (keywords.length === 0) return 0;
  const haystack = resume.markdown.toLowerCase();
  let hits = 0;
  for (const k of keywords) {
    if (haystack.includes(k.toLowerCase())) hits += 1;
  }
  const score = Math.round((hits / keywords.length) * 100);
  return Math.max(0, Math.min(100, score));
}

export async function coverLetter(input: CoverLetterInput): Promise<string> {
  const system =
    "You write concise, compelling cover letters. 3 paragraphs. No buzzwords. No 'I am writing to'. Specific to the company and role. Return only the letter body.";
  const letter = await callAnthropic(
    system,
    [
      {
        role: "user",
        content: `COMPANY: ${input.company}\n\nJOB DESCRIPTION:\n${input.jobDescription}\n\nCANDIDATE RESUME:\n${input.resume.markdown}\n\nWrite a 3-paragraph cover letter. Specific. Direct. Metric-driven.`,
      },
    ],
    1200
  );
  return letter;
}
