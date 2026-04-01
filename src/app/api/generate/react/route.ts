import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { authenticateRequest, checkUsageQuota, trackUsage } from "@/lib/auth-guard";
import { getGeneratorSystemSupplement } from "@/lib/generator-prompts";

const REACT_SYSTEM = `You are Zoobicon, the most advanced AI website generator on the market. You produce FULL-STACK, production-ready React applications that ACTUALLY WORK — not just pretty pages with fake data.

Output ONLY a valid JSON object with this exact structure — no markdown, no code fences, no explanation before or after:

{
  "files": {
    "App.tsx": "// Main app component with routing and state management",
    "components/Navbar.tsx": "// Navigation bar with mobile menu",
    "components/Hero.tsx": "// Hero section",
    "components/Features.tsx": "// Features grid",
    "components/About.tsx": "// About section",
    "components/Testimonials.tsx": "// Testimonials with real metrics",
    "components/Stats.tsx": "// Animated stats section",
    "components/Pricing.tsx": "// Pricing cards with toggle",
    "components/FAQ.tsx": "// Interactive FAQ accordion",
    "components/Contact.tsx": "// WORKING contact form with validation",
    "components/CTA.tsx": "// Call to action section",
    "components/Footer.tsx": "// Footer with newsletter signup",
    "lib/store.ts": "// App state management using React context",
    "styles.css": "// CSS custom properties and overrides"
  },
  "dependencies": {}
}

## CRITICAL RULES — WHAT MAKES US BETTER THAN EVERY COMPETITOR

### 1. APPS MUST ACTUALLY WORK
- Contact forms: validate inputs, show success/error states, store submissions in localStorage
- Newsletter signups: validate email, show confirmation, prevent duplicates
- FAQ sections: working accordion with smooth open/close animation
- Pricing toggles: monthly/annual switch that updates prices with animation
- Mobile menu: hamburger that opens/closes with transition
- Scroll effects: smooth scroll to sections, active nav highlighting
- Counters: animate numbers when they scroll into view
- Tabs/filters: working tab switching for feature sections or portfolios
- Search: if the app has a search feature, make it filter real data
- Shopping carts: if e-commerce, items add to cart with count badge
- Dark/light mode: if requested, working toggle with localStorage persistence
- Forms: EVERY form must validate on submit, show inline errors, clear on success

### 2. STATE MANAGEMENT
- Create a lib/store.ts file using React Context for app-wide state
- Contact form submissions stored in state (and localStorage for persistence)
- Newsletter signups stored in state
- Shopping cart items in state
- Any user preferences (theme, language) in state
- Export a useStore() hook for components to consume

### 3. COMPONENT ARCHITECTURE
- React 18 functional components with TypeScript (.tsx)
- Every component exports a default function
- App.tsx imports and renders all components in order
- App.tsx wraps everything in the StoreProvider from lib/store.ts
- Use useState, useEffect, useRef, useCallback where appropriate
- MINIMUM 12 components per site

### 4. VISUAL QUALITY — $50K+ AGENCY STANDARD
- Hero: Split layout or full-bleed gradient. MUST include a compelling image area (gradient mockup, floating cards, or dashboard illustration built in CSS/JSX)
- Navbar: Sticky, backdrop-blur, logo + nav links + CTA. Mobile hamburger with animated menu
- Features: 6+ cards in responsive grid with hover effects (scale, shadow, border glow)
- Testimonials: 3+ cards with star ratings, photos (randomuser.me), specific metrics
- Pricing: 3 tiers with monthly/annual toggle. Featured plan highlighted. All features listed
- Stats: 4+ animated counters on gradient background
- Contact: Working form with name, email, message fields. Validation. Success state
- FAQ: 5+ questions with smooth accordion animation
- Footer: 4-column layout with newsletter input, social icons, domain links
- CTA: Bold gradient section with compelling headline

### 5. ANIMATIONS & INTERACTIONS
- Intersection Observer for scroll-triggered animations (fade in, slide up)
- Hover effects on ALL interactive elements (cards, buttons, links)
- Smooth transitions (transition-all duration-300)
- Loading states on form submissions
- Success/error toast notifications after form actions
- Counter animation when stats section scrolls into view
- Staggered animations for card grids

### 6. IMAGES & ICONS
- Create inline SVG icons as JSX — do NOT import external packages
- Testimonial avatars: https://randomuser.me/api/portraits/men/N.jpg or women/N.jpg
- Hero: use CSS gradient backgrounds with floating decorative elements
- Feature icons: gradient background circles with inline SVG icons

### 7. COPY & CONTENT
- Headlines MUST be specific to the business — NO generic "Welcome" or "Get Started"
- Every headline should stop someone scrolling
- Testimonials include specific metrics: "Increased conversions by 47%"
- Feature descriptions: 2-3 real sentences, not one-liners
- CTAs are action-specific: "Schedule Free Assessment", not "Learn More"

### 8. STYLING
- Tailwind CSS classes for ALL styling (loaded via CDN)
- styles.css: ONLY CSS custom properties + Google Fonts import + minimal overrides
- Industry-appropriate colors (tech=indigo, health=teal, food=amber, legal=navy)
- Text contrast WCAG AA compliant
- Fully responsive: sm:, md:, lg: breakpoints throughout

### 9. CRITICAL OUTPUT RULES
- Start with { and end with } — no preamble, no markdown fences
- Every file in "files" must contain valid TypeScript/JSX or CSS
- App.tsx MUST import every component
- lib/store.ts MUST exist with React Context provider
- Minimum 12 sections/components
- EVERY interactive element must work — no placeholder onClick handlers`;

export const maxDuration = 300;

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

    const client = new Anthropic({ apiKey, timeout: 240_000 });

    let systemPrompt = REACT_SYSTEM;
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

    // ── STREAMING: Send partial results as files are completed ──
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        sendEvent({ type: "status", message: "AI is generating your React application..." });

        try {
          let fullText = "";

          const apiStream = client.messages.stream({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
          });

          let lastFileCount = 0;
          let chunkCounter = 0;

          apiStream.on("text", (text) => {
            fullText += text;
            chunkCounter++;

            // Every 20 chunks, try to extract completed files and send them
            if (chunkCounter % 20 === 0) {
              try {
                const partialFiles = extractCompletedFiles(fullText);
                const fileCount = Object.keys(partialFiles).length;

                if (fileCount > lastFileCount) {
                  lastFileCount = fileCount;
                  const fileNames = Object.keys(partialFiles);
                  const latestFile = fileNames[fileNames.length - 1];
                  sendEvent({
                    type: "partial",
                    files: partialFiles,
                    fileCount,
                    latestFile,
                  });
                  sendEvent({
                    type: "status",
                    message: `Built ${fileCount} files — ${latestFile}...`,
                  });
                }
              } catch {
                // JSON not complete yet — that's normal during streaming
              }
            }
          });

          const finalMessage = await apiStream.finalMessage();

          // Extract final text
          const textBlock = finalMessage.content.find((b) => b.type === "text");
          if (!textBlock || textBlock.type !== "text") {
            sendEvent({ type: "error", message: "AI returned no text content" });
            controller.close();
            return;
          }

          let rawText = textBlock.text.trim();
          rawText = rawText.replace(/^```(?:json|JSON)?\s*\n?/, "").replace(/\n?\s*```\s*$/, "");

          const jsonStart = rawText.indexOf("{");
          const jsonEnd = rawText.lastIndexOf("}");
          if (jsonStart === -1 || jsonEnd === -1) {
            sendEvent({ type: "error", message: "AI response was not valid JSON. Please try again." });
            controller.close();
            return;
          }

          const jsonStr = rawText.slice(jsonStart, jsonEnd + 1);

          let parsed: { files?: Record<string, string>; dependencies?: Record<string, string> };
          try {
            parsed = JSON.parse(jsonStr);
          } catch {
            sendEvent({ type: "error", message: "AI response contained invalid JSON. Please try again." });
            controller.close();
            return;
          }

          if (!parsed.files || !parsed.files["App.tsx"]) {
            sendEvent({ type: "error", message: "AI response missing App.tsx. Please try again." });
            controller.close();
            return;
          }

          // Track usage
          await trackUsage(auth.user.email, "generation").catch(() => {});

          // Send final complete result
          sendEvent({
            type: "done",
            files: parsed.files,
            dependencies: parsed.dependencies || {},
            fileCount: Object.keys(parsed.files).length,
          });
        } catch (err) {
          const message =
            err instanceof Anthropic.AuthenticationError
              ? "AI service is temporarily unavailable."
              : err instanceof Anthropic.RateLimitError
              ? "AI service is busy. Please wait a moment and try again."
              : "React generation failed. Please try again.";
          sendEvent({ type: "error", message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[React Generate] Error:", err);
    return new Response(
      JSON.stringify({ error: "React generation failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Try to extract completed file entries from a partially-streamed JSON response.
 * This is a best-effort parser — it extracts files whose content appears complete
 * (the value string is closed properly).
 */
function extractCompletedFiles(partial: string): Record<string, string> {
  const files: Record<string, string> = {};

  // Find "files": { ... and try to extract key-value pairs
  const filesStart = partial.indexOf('"files"');
  if (filesStart === -1) return files;

  const braceStart = partial.indexOf("{", filesStart + 7);
  if (braceStart === -1) return files;

  // Extract file entries using regex — match "filename": "content" pairs
  // where content is a complete string (ends with unescaped quote)
  const fileRegex = /"([^"]+\.(?:tsx?|css|json))"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  const searchArea = partial.slice(braceStart);

  let match;
  while ((match = fileRegex.exec(searchArea)) !== null) {
    const fileName = match[1];
    const content = match[2]
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
    files[fileName] = content;
  }

  return files;
}
