import { NextRequest, NextResponse } from "next/server";

/* ─── AI Blog Post Generation ─── */

interface GenerateRequest {
  topic: string;
  tone?: "Professional" | "Casual" | "Technical" | "Persuasive";
  length?: "short" | "medium" | "long";
}

const TONE_STYLES: Record<string, string> = {
  Professional: "Clear, authoritative, well-structured with data and insights.",
  Casual: "Conversational, friendly, uses relatable examples and light humor.",
  Technical: "Detailed, precise, uses code examples and technical terminology.",
  Persuasive: "Compelling, benefit-focused, uses social proof and urgency.",
};

const LENGTH_WORDS: Record<string, number> = {
  short: 500,
  medium: 1000,
  long: 2000,
};

function generateMockPost(topic: string, tone: string, length: string) {
  const wordTarget = LENGTH_WORDS[length] || 1000;
  const toneDesc = TONE_STYLES[tone] || TONE_STYLES.Professional;

  // Generate a realistic blog post based on the topic
  const title = generateTitle(topic, tone);
  const metaDescription = generateMetaDescription(topic);
  const tags = generateTags(topic);
  const body = generateBody(topic, tone, wordTarget);
  const featuredImagePrompt = `Professional blog header image for an article about "${topic}". Modern, clean, ${tone.toLowerCase()} aesthetic. High quality, editorial style.`;

  return {
    title,
    metaDescription,
    tags,
    body,
    featuredImagePrompt,
    seoScore: 82 + Math.floor(Math.random() * 14), // 82-95
    tone,
    wordCount: wordTarget,
  };
}

function generateTitle(topic: string, tone: string): string {
  const words = topic.toLowerCase().split(/\s+/);
  const year = "2026";

  if (tone === "Persuasive") {
    return `Why ${capitalize(topic)} Will Transform Your Business in ${year}`;
  }
  if (tone === "Technical") {
    return `The Complete Technical Guide to ${capitalize(topic)}`;
  }
  if (tone === "Casual") {
    if (words.length <= 3) {
      return `Everything You Need to Know About ${capitalize(topic)}`;
    }
    return `Here's the Deal with ${capitalize(topic)} (And Why It Matters)`;
  }
  // Professional
  if (words.length <= 4) {
    return `${capitalize(topic)}: A Comprehensive Guide for ${year}`;
  }
  return `How ${capitalize(topic)} Is Shaping the Future`;
}

function generateMetaDescription(topic: string): string {
  return `Discover the latest insights on ${topic.toLowerCase()}. This comprehensive guide covers strategies, best practices, and actionable tips you can implement today.`;
}

function generateTags(topic: string): string[] {
  const base = topic
    .split(/[\s,]+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .map(capitalize);
  return [...new Set([...base, "Strategy", "2026 Guide"])].slice(0, 5);
}

function generateBody(topic: string, tone: string, wordTarget: number): string {
  const isLong = wordTarget >= 2000;
  const isMedium = wordTarget >= 1000;

  let html = "";

  // Intro
  html += `<h2>Understanding ${capitalize(topic)}</h2>\n`;
  html += `<p>In today's rapidly evolving digital landscape, <strong>${topic.toLowerCase()}</strong> has become a critical consideration for businesses and professionals alike. Whether you're just getting started or looking to refine your approach, this guide will give you the foundation you need.</p>\n\n`;

  // Section 1
  html += `<h3>Why ${capitalize(topic)} Matters Now</h3>\n`;
  html += `<p>The landscape has shifted dramatically in the past year. Organizations that embrace ${topic.toLowerCase()} are seeing measurable improvements in their outcomes. Here's what the data shows:</p>\n`;
  html += `<ul>\n`;
  html += `<li><strong>73% of businesses</strong> report improved performance after implementing modern strategies</li>\n`;
  html += `<li><strong>2.5x faster</strong> time-to-market for teams that adopt best practices</li>\n`;
  html += `<li><strong>40% reduction</strong> in operational costs through optimization</li>\n`;
  html += `</ul>\n\n`;

  // Section 2
  html += `<h3>Getting Started: The Foundation</h3>\n`;
  html += `<p>Before diving into advanced techniques, it's essential to establish a solid foundation. Here are the key principles:</p>\n`;
  html += `<ol>\n`;
  html += `<li><strong>Define your objectives</strong> — What specific outcomes are you targeting?</li>\n`;
  html += `<li><strong>Assess your current state</strong> — Where are you now, and what gaps exist?</li>\n`;
  html += `<li><strong>Build incrementally</strong> — Start with quick wins before tackling complex challenges</li>\n`;
  html += `</ol>\n\n`;

  if (isMedium) {
    // Section 3
    html += `<h3>Advanced Strategies for ${capitalize(topic)}</h3>\n`;
    html += `<p>Once you've established the basics, it's time to implement more sophisticated approaches. The most successful practitioners focus on three key areas:</p>\n`;
    html += `<p><strong>Automation and efficiency:</strong> Leverage AI and automation tools to handle repetitive tasks, freeing your team to focus on strategic decisions. The ROI on automation investment typically exceeds 300% within the first year.</p>\n`;
    html += `<p><strong>Data-driven decisions:</strong> Every action should be informed by data. Set up tracking, establish KPIs, and review performance weekly. Organizations that adopt data-driven decision making are <strong>5x more likely</strong> to make faster decisions than their competitors.</p>\n`;
    html += `<p><strong>Continuous optimization:</strong> The best strategies evolve. Conduct regular audits, A/B test your approaches, and stay current with industry developments.</p>\n\n`;

    // Section 4
    html += `<h3>Common Mistakes to Avoid</h3>\n`;
    html += `<p>Even experienced professionals fall into these traps:</p>\n`;
    html += `<ul>\n`;
    html += `<li><strong>Over-complicating the approach</strong> — Simplicity wins. Start simple and add complexity only when needed.</li>\n`;
    html += `<li><strong>Ignoring mobile users</strong> — Over 70% of interactions happen on mobile devices.</li>\n`;
    html += `<li><strong>Neglecting measurement</strong> — If you can't measure it, you can't improve it.</li>\n`;
    html += `<li><strong>Following trends blindly</strong> — Not every trend applies to your situation. Evaluate critically.</li>\n`;
    html += `</ul>\n\n`;
  }

  if (isLong) {
    // Section 5
    html += `<h3>Case Study: Real-World Results</h3>\n`;
    html += `<p>A mid-sized e-commerce company implemented these strategies over a 6-month period. The results were significant:</p>\n`;
    html += `<ul>\n`;
    html += `<li>Organic traffic increased by <strong>156%</strong></li>\n`;
    html += `<li>Conversion rate improved from 2.1% to <strong>4.7%</strong></li>\n`;
    html += `<li>Customer acquisition cost decreased by <strong>38%</strong></li>\n`;
    html += `<li>Monthly recurring revenue grew by <strong>$45,000</strong></li>\n`;
    html += `</ul>\n`;
    html += `<p>The key takeaway: consistent application of fundamentals beats sporadic attempts at advanced tactics every time.</p>\n\n`;

    // Section 6
    html += `<h3>Tools and Resources</h3>\n`;
    html += `<p>Here are the tools we recommend for implementing these strategies:</p>\n`;
    html += `<ul>\n`;
    html += `<li><strong>Analytics:</strong> Google Analytics 4, Plausible, or Fathom for tracking</li>\n`;
    html += `<li><strong>Automation:</strong> Zapier, Make, or custom API integrations</li>\n`;
    html += `<li><strong>Content:</strong> AI writing assistants for drafting, human editors for polish</li>\n`;
    html += `<li><strong>SEO:</strong> Ahrefs or Semrush for keyword research and tracking</li>\n`;
    html += `</ul>\n\n`;

    // Section 7
    html += `<h3>Implementation Timeline</h3>\n`;
    html += `<p>Here's a realistic timeline for implementation:</p>\n`;
    html += `<ul>\n`;
    html += `<li><strong>Week 1-2:</strong> Audit current state, define objectives, set up tracking</li>\n`;
    html += `<li><strong>Week 3-4:</strong> Implement foundational changes, establish baseline metrics</li>\n`;
    html += `<li><strong>Month 2:</strong> Roll out advanced strategies, begin A/B testing</li>\n`;
    html += `<li><strong>Month 3-6:</strong> Optimize based on data, scale what works, cut what doesn't</li>\n`;
    html += `</ul>\n\n`;
  }

  // Conclusion
  html += `<h3>What's Next</h3>\n`;
  html += `<p>${capitalize(topic)} is not a one-time project — it's an ongoing practice. The businesses that win are the ones that commit to continuous improvement, stay curious about new developments, and execute consistently.</p>\n`;
  html += `<p>Start with the foundations outlined above, measure your results, and iterate. The best time to start was yesterday. The second best time is now.</p>`;

  return html;
}

function capitalize(s: string): string {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { topic, tone = "Professional", length = "medium" } = body;

    if (!topic || topic.trim().length < 3) {
      return NextResponse.json(
        { error: "Please provide a topic with at least 3 characters." },
        { status: 400 }
      );
    }

    // Simulate AI generation delay (1-3s)
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1500));

    const post = generateMockPost(topic.trim(), tone, length);

    return NextResponse.json({ success: true, post });
  } catch {
    return NextResponse.json({ error: "Failed to generate blog post." }, { status: 500 });
  }
}
