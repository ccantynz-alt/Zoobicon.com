import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { authenticateRequest, checkUsageQuota, trackUsage } from "@/lib/auth-guard";
import { getGeneratorSystemSupplement } from "@/lib/generator-prompts";

const REACT_SYSTEM = `You are Zoobicon, an elite AI that generates React applications. You produce beautiful, production-quality React components with TypeScript and Tailwind CSS.

Output ONLY a valid JSON object with this exact structure — no markdown, no code fences, no explanation before or after:

{
  "files": {
    "App.tsx": "// Main app component importing all sections",
    "components/Hero.tsx": "// Hero section component",
    "components/Features.tsx": "// Features grid component",
    "components/About.tsx": "// About section component",
    "components/Testimonials.tsx": "// Testimonials section",
    "components/Stats.tsx": "// Stats section",
    "components/FAQ.tsx": "// FAQ accordion",
    "components/CTA.tsx": "// Call to action section",
    "components/Footer.tsx": "// Footer component",
    "components/Navbar.tsx": "// Navigation bar",
    "styles.css": "// Custom CSS variables and minimal overrides (Tailwind via CDN)"
  },
  "dependencies": {}
}

## RULES — FOLLOW EXACTLY

### Component Architecture
- Use React 18 functional components with TypeScript (.tsx)
- Every component exports a default function: \`export default function Hero() { ... }\`
- App.tsx is the entry point that imports and renders ALL section components in order
- App.tsx must import "./styles.css" at the top
- Each component is self-contained — all data (copy, images, stats) is defined inside the component
- Use React hooks where needed (useState for FAQ accordion, mobile menu toggle, etc.)

### Styling
- Use Tailwind CSS classes for ALL styling (Tailwind is loaded via CDN in the preview)
- styles.css should ONLY contain: CSS custom properties (:root variables), @import for Google Fonts, and minimal overrides (under 30 lines)
- NEVER use inline style objects unless absolutely necessary for dynamic values
- Use modern Tailwind: bg-gradient-to-r, backdrop-blur, ring, shadow-xl, etc.

### Visual Quality — $20K+ Agency Standard
- Hero: Split layout (text left + image/visual right) or full-bleed gradient with overlay text
- Navbar: Sticky, semi-transparent with backdrop-blur, logo left + nav links + CTA button right
- Features: 6 cards in a responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- About: Two-column layout with image/visual left, text + bullet points right
- Testimonials: 3 cards with star ratings, avatar photos (randomuser.me), name, role, and specific quotes
- Stats: 4 bold numbers on a dark background section
- FAQ: Accordion with useState toggle — clicking question reveals/hides answer
- CTA: Bold colored background section with headline + two buttons
- Footer: Dark background, 4-column layout with links

### Images
- Hero: Use CSS gradient backgrounds or Tailwind gradient classes for tech/SaaS. For other industries, use https://images.unsplash.com/photo-{relevant-id}?w=800&h=600&fit=crop
- Feature cards: Use inline SVG icons (create simple icon components or use JSX SVGs)
- Testimonial avatars: https://randomuser.me/api/portraits/men/N.jpg or women/N.jpg (N=1-99, unique per person)
- About section: CSS gradient or relevant Unsplash image
- All images: className="object-cover rounded-xl" or similar

### Icons
- Create simple inline SVG icons as JSX within components — do NOT import from external packages
- Example: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>

### Colors & Typography
- Define :root CSS custom properties in styles.css for the brand colors
- Use industry-appropriate color schemes:
  - Tech/SaaS: Dark bg (slate-900), electric accents (indigo-500, cyan-500)
  - Restaurant: Warm palette (amber, orange), serif-style headings
  - Healthcare: Teal, soft greens, warm whites
  - Real Estate: Navy + gold, serif headings
  - Portfolio: Bold typography, vivid accent colors
- Text contrast must meet WCAG AA (4.5:1 body, 3:1 large text)

### Copy Quality
- Headlines MUST be specific to the business — NO generic phrases like "Welcome to [Brand]" or "Get Started Today"
- Testimonials include specific metrics: "Increased conversions by 47%", "Saved 15 hours per week"
- CTAs are action-specific: "Schedule Free Assessment", "Start Building Today" — NOT generic "Learn More"

### Critical Rules
- Output ONLY the JSON object — start with { and end with }
- NO markdown code fences (\`\`\`) around the JSON
- NO explanation text before or after the JSON
- Every file path in "files" must be a string containing valid TypeScript/JSX or CSS
- App.tsx MUST import every component file using relative paths: import Hero from "./components/Hero"
- The "dependencies" object should be empty {} unless lucide-react icons are absolutely needed
- Minimum 9 sections: Navbar, Hero, Features, About, Testimonials, Stats, FAQ, CTA, Footer
- Every component must render meaningful, complete content — no "TODO" or placeholder comments`;

export const maxDuration = 300; // 5 minutes — React component generation needs more time than HTML

export async function POST(req: NextRequest) {
  try {
    const { prompt, tier, model: requestedModel, generator } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "A prompt is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (prompt.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Prompt too long (max 5000 characters)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Auth + usage enforcement
    const auth = await authenticateRequest(req, { requireAuth: true, requireVerified: true });
    if (auth.error) return auth.error;

    const quota = await checkUsageQuota(auth.user.email, auth.user.plan, "generation");
    if (quota.error) return quota.error;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service is temporarily unavailable. Please try again later." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = new Anthropic({ apiKey, timeout: 120_000 });

    let systemPrompt = REACT_SYSTEM;

    // Append generator-specific instructions
    if (generator && typeof generator === "string") {
      const supplement = getGeneratorSystemSupplement(generator);
      if (supplement) {
        systemPrompt += "\n\n" + supplement;
      }
    }

    const isPremium = tier === "premium";
    const model = requestedModel || (isPremium ? "claude-sonnet-4-6" : "claude-sonnet-4-6");
    const maxTokens = 32000;

    const userMessage = `Build a premium, agency-quality React application for: ${prompt}

Requirements:
- Split into logical components (Navbar, Hero, Features, About, Testimonials, Stats, FAQ, CTA, Footer)
- Use Tailwind CSS classes for all styling
- Industry-appropriate colors and typography
- Professional copy specific to the business — no generic placeholder text
- Every section must be visually complete with real content
- FAQ should have working accordion (useState toggle)
- Mobile-responsive (use Tailwind responsive prefixes: sm:, md:, lg:)

Output the JSON object with "files" and "dependencies" keys. Start with { — no preamble.`;

    let response;
    try {
      response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });
    } catch (apiErr: unknown) {
      // If primary model fails, try Haiku as fallback
      if (model !== "claude-haiku-4-5") {
        console.warn(`[React] ${model} failed, falling back to Haiku`);
        try {
          response = await client.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
          });
        } catch {
          throw apiErr;
        }
      } else {
        throw apiErr;
      }
    }

    // Extract text from response
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return new Response(
        JSON.stringify({ error: "AI returned no text content" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let rawText = textBlock.text.trim();

    // Strip markdown code fences if present
    rawText = rawText.replace(/^```(?:json|JSON)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");

    // Find the JSON object boundaries
    const jsonStart = rawText.indexOf("{");
    const jsonEnd = rawText.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      return new Response(
        JSON.stringify({ error: "AI response was not valid JSON. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const jsonStr = rawText.slice(jsonStart, jsonEnd + 1);

    let parsed: { files?: Record<string, string>; dependencies?: Record<string, string> };
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[React] JSON parse failed:", parseErr);
      return new Response(
        JSON.stringify({ error: "AI response contained invalid JSON. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!parsed.files || typeof parsed.files !== "object" || Object.keys(parsed.files).length === 0) {
      return new Response(
        JSON.stringify({ error: "AI response missing files. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate that App.tsx exists
    if (!parsed.files["App.tsx"]) {
      return new Response(
        JSON.stringify({ error: "AI response missing App.tsx entry point. Please try again." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Track usage
    await trackUsage(auth.user.email, "generation").catch(() => {});

    return new Response(
      JSON.stringify({
        files: parsed.files,
        dependencies: parsed.dependencies || {},
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[React Generate] Error:", err);
    const message =
      err instanceof Anthropic.AuthenticationError
        ? "AI service is temporarily unavailable. The site owner needs to update their API key."
        : err instanceof Anthropic.RateLimitError
        ? "AI service is busy. Please wait a moment and try again."
        : "React generation failed. Please try again.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
