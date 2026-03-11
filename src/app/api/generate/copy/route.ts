import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_COPY_TYPES = [
  "website-copy",
  "landing-page",
  "product-descriptions",
  "about-page",
  "email-copy",
  "social-media",
  "ad-copy",
  "taglines",
  "case-studies",
  "testimonials",
  "faq",
  "meta-seo",
];

const COPY_SYSTEM = `You are Zoobicon's Professional Copywriter Agent. You produce conversion-optimized, brand-aligned copy that reads like it was written by a $200/hour copywriter.

## Output Format
- Output ONLY valid JSON:
{
  "copyType": "website-copy",
  "brandVoice": "Description of the voice used",
  "sections": [
    {
      "section": "hero",
      "headline": "Main headline",
      "subheadline": "Supporting text",
      "cta": "CTA button text",
      "alternates": ["Alternate headline 1", "Alternate headline 2"]
    }
  ],
  "metaSeo": {
    "title": "SEO-optimized page title",
    "description": "Meta description",
    "keywords": ["keyword1", "keyword2"]
  }
}

## Copywriting Principles

### Headlines
- Lead with the benefit, not the feature.
- Use specific numbers when possible ("47% faster" not "much faster").
- Address the reader directly ("you", "your").
- Create urgency without being pushy.
- Max 10 words for primary headlines.
- Provide 3 alternate headlines for A/B testing.

### Body Copy
- Short paragraphs (2-3 sentences max).
- Use bullet points for features/benefits.
- Each feature expressed as a benefit.
- Specific > vague ("Save 4 hours weekly" not "Save time").
- Social proof woven naturally into copy.
- Active voice throughout.
- Power words: discover, proven, exclusive, guaranteed, instant.

### CTAs
- Action-oriented: "Start your free trial" not "Submit".
- Reduce friction: "No credit card required" under buttons.
- Match CTA to the value: "Get my free guide" not "Download".
- Provide primary and secondary CTA options.

### Brand Voice Matching
Detect and match the appropriate voice:
- **Corporate/Enterprise**: Professional, authoritative, trustworthy. Longer sentences, industry terminology.
- **Startup/Tech**: Conversational, innovative, energetic. Short punchy sentences.
- **Luxury/Premium**: Aspirational, refined, exclusive. Evocative language.
- **Healthcare/Wellness**: Warm, caring, trustworthy. Empathetic tone.
- **Creative/Agency**: Bold, confident, witty. Personality-driven.
- **E-commerce**: Benefit-focused, urgent, social-proof heavy.
- **Legal/Financial**: Authoritative, precise, reassuring. Trust-building.

### Section-Specific Copy

**Hero**: Value prop headline + supporting sentence + CTA.
**Features**: Benefit headline + 2 sentence description per feature.
**About**: Origin story, mission, values — human and relatable.
**Testimonials**: Specific, metric-driven, attributed with name/title/company.
**FAQ**: Objection-handling disguised as Q&A.
**CTA Section**: Urgency + benefit restatement + social proof.
**Footer**: Trust signals, contact info, legal.`;

export async function POST(req: NextRequest) {
  try {
    const { businessName, industry, copyType, targetAudience, tone, existingCopy } = await req.json();

    if (!businessName || typeof businessName !== "string") {
      return NextResponse.json({ error: "businessName is required" }, { status: 400 });
    }

    const type = VALID_COPY_TYPES.includes(copyType) ? copyType : "website-copy";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const existingContext = existingCopy
      ? `\n\nExisting copy to improve/rewrite:\n${existingCopy}`
      : "";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: COPY_SYSTEM,
      messages: [{
        role: "user",
        content: `Write professional ${type} copy for "${businessName}".\n\nIndustry: ${industry || "Infer from name"}\nTarget Audience: ${targetAudience || "Infer from industry"}\nTone: ${tone || "Match to industry"}${existingContext}\n\nGenerate compelling, conversion-optimized copy with A/B test alternates for headlines. Include meta SEO copy. Return as structured JSON.`,
      }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    let responseText = textBlock.text.trim();
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      return NextResponse.json(JSON.parse(responseText));
    } catch {
      return NextResponse.json({ rawCopy: responseText, copyType: type });
    }
  } catch (err) {
    console.error("Copy generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
