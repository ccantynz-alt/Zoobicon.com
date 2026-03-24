import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { classifyIntent, getScaffold, getScaffoldConfig, generatePatchPrompt } from "@/lib/scaffold-engine";
import { COMPONENT_LIBRARY_CSS } from "@/lib/component-library";
import { replacePicsumUrls } from "@/lib/stock-images";

export const maxDuration = 300;

// ── Types ──

interface SiteConfig {
  title: string;
  description: string;
  font1: string;
  font2: string;
  colors: {
    primary: string;
    primaryDark?: string;
    bg: string;
    bgAlt: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    accent?: string;
  };
  customCss?: string;
}

interface PatchResponse {
  title?: string;
  description?: string;
  colors?: Partial<SiteConfig["colors"]>;
  sections?: Record<string, Record<string, string>>;
}

// ── Build full HTML page from config + body ──
// Mirrors the pattern from /api/generate/quick — wraps body in DOCTYPE/head/style
// with component library CSS, Google Fonts, CSS custom properties, and JS utilities.

function buildFullPage(config: SiteConfig, bodyHtml: string): string {
  const { title, description, font1, font2, colors, customCss } = config;

  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font1)}:wght@400;500;600;700;800;900&family=${encodeURIComponent(font2)}:wght@400;500;600;700&display=swap`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description.replace(/"/g, "&quot;")}">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontUrl}" rel="stylesheet">
  <style>
${COMPONENT_LIBRARY_CSS}

/* ── Site Theme ── */
:root {
  --color-primary: ${colors.primary};
  --color-primary-dark: ${colors.primaryDark || colors.primary};
  --color-bg: ${colors.bg};
  --color-bg-alt: ${colors.bgAlt};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-text-muted: ${colors.textMuted};
  --color-border: ${colors.border};
  --color-accent: ${colors.accent || colors.primary};
  --font-heading: '${font1}', ${font1 === "Playfair Display" || font1 === "Cormorant Garamond" || font1 === "Merriweather" ? "serif" : "sans-serif"};
  --font-body: '${font2}', sans-serif;
  --section-padding: 100px;
  --container-padding: 24px;
  --max-width: 1200px;
  --btn-radius: 8px;
  --card-radius: 12px;
}
body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
}
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  line-height: 1.15;
}
${customCss || ""}
  </style>
</head>
<body>
${bodyHtml}
<script>
// Mobile menu
(function(){
  var btn = document.querySelector('.mobile-menu-btn');
  var nav = document.querySelector('.nav-links');
  if (btn && nav) {
    btn.addEventListener('click', function() {
      nav.classList.toggle('open');
      btn.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { nav.classList.remove('open'); btn.classList.remove('open'); });
    });
  }
})();
// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener('click',function(e){
    var t=document.querySelector(this.getAttribute('href'));
    if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'});}
  });
});
// FAQ accordion
document.querySelectorAll('.faq-question').forEach(function(q){
  q.addEventListener('click',function(){
    var a=this.nextElementSibling;
    if(a){a.classList.toggle('open');}
    var icon=this.querySelector('.faq-icon');
    if(icon){icon.textContent=a&&a.classList.contains('open')?'\\u2212':'+';}
  });
});
// Scroll animations
(function(){
  var sel='.fade-in,.fade-in-left,.fade-in-right,.scale-in';
  var els=document.querySelectorAll(sel);
  els.forEach(function(el){el.classList.add('will-animate');});
  if('IntersectionObserver' in window){
    var obs=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}
      });
    },{threshold:0.08,rootMargin:'0px 0px -40px 0px'});
    els.forEach(function(el){obs.observe(el);});
  } else {
    els.forEach(function(el){el.classList.add('visible');});
  }
  setTimeout(function(){
    document.querySelectorAll(sel+':not(.visible)').forEach(function(el){el.classList.add('visible');});
  },3000);
})();
// Animated counters
document.querySelectorAll('.stat-number[data-target]').forEach(function(el){
  var obs=new IntersectionObserver(function(entries){
    if(entries[0].isIntersecting){
      var target=parseInt(el.dataset.target);
      var suffix=el.dataset.suffix||'';
      var prefix=el.dataset.prefix||'';
      var duration=1500;
      var start=Date.now();
      (function animate(){
        var p=Math.min((Date.now()-start)/duration,1);
        p=1-Math.pow(1-p,3);
        el.textContent=prefix+Math.floor(target*p).toLocaleString()+suffix;
        if(p<1)requestAnimationFrame(animate);
      })();
      obs.unobserve(el);
    }
  },{threshold:0.5});
  obs.observe(el);
});
</script>
</body>
</html>`;
}

// ── SSE helpers ──

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ── Apply AI-generated patches to scaffold HTML ──
// Performs simple string replacements to inject customized content into the scaffold.

function applyPatches(html: string, config: SiteConfig, patch: PatchResponse): { html: string; config: SiteConfig } {
  let updatedHtml = html;
  const updatedConfig = { ...config };

  // Update title and description if provided
  if (patch.title) {
    updatedConfig.title = patch.title;
    updatedHtml = updatedHtml.replace(/<title>[^<]*<\/title>/, `<title>${patch.title}</title>`);
  }
  if (patch.description) {
    updatedConfig.description = patch.description;
    updatedHtml = updatedHtml.replace(
      /<meta name="description" content="[^"]*">/,
      `<meta name="description" content="${patch.description.replace(/"/g, "&quot;")}">`
    );
  }

  // Update colors if provided
  if (patch.colors) {
    const colorMap: Record<string, string> = {
      primary: "--color-primary",
      primaryDark: "--color-primary-dark",
      bg: "--color-bg",
      bgAlt: "--color-bg-alt",
      surface: "--color-surface",
      text: "--color-text",
      textMuted: "--color-text-muted",
      border: "--color-border",
      accent: "--color-accent",
    };
    for (const [key, cssVar] of Object.entries(colorMap)) {
      const value = patch.colors[key as keyof typeof patch.colors];
      if (value) {
        const regex = new RegExp(`${cssVar.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}:\\s*[^;]+;`);
        updatedHtml = updatedHtml.replace(regex, `${cssVar}: ${value};`);
        (updatedConfig.colors as Record<string, string>)[key] = value;
      }
    }
  }

  // Apply section content replacements
  if (patch.sections) {
    for (const [sectionId, fields] of Object.entries(patch.sections)) {
      for (const [fieldId, content] of Object.entries(fields)) {
        // Replace by data attribute markers: data-section="hero" data-field="headline"
        const attrPattern = new RegExp(
          `(data-section="${sectionId}"[^>]*data-field="${fieldId}"[^>]*>)[^<]*(<)`,
          "gi"
        );
        updatedHtml = updatedHtml.replace(attrPattern, `$1${content}$2`);

        // Also try class-based markers: class="hero-headline"
        const classPattern = new RegExp(
          `(class="[^"]*${sectionId}-${fieldId}[^"]*"[^>]*>)[^<]*(<)`,
          "gi"
        );
        updatedHtml = updatedHtml.replace(classPattern, `$1${content}$2`);
      }
    }
  }

  return { html: updatedHtml, config: updatedConfig };
}

// ── Parse AI JSON response ──

function parseAIResponse(text: string): PatchResponse | null {
  // Try parsing the whole response as JSON
  try {
    return JSON.parse(text) as PatchResponse;
  } catch {
    // Not pure JSON — try extracting from code blocks or tags
  }

  // Try extracting from ```json ... ``` blocks
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim()) as PatchResponse;
    } catch {
      // Continue to next strategy
    }
  }

  // Try extracting from { ... } (first complete JSON object)
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]) as PatchResponse;
    } catch {
      // Could not parse
    }
  }

  return null;
}

// ── Main handler ──

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await request.json();
    const { prompt, tier, model, generatorType, agencyBrand } = body as {
      prompt: string;
      tier?: string;
      model?: string;
      generatorType?: string;
      agencyBrand?: { name?: string; colors?: Record<string, string> };
    };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "A prompt is required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // ── Phase 0: Classify intent and get scaffold (<1s) ──
          const intent = classifyIntent(prompt);
          const scaffoldConfig = getScaffoldConfig(intent);
          const scaffoldBody = getScaffold(intent);

          // Apply agency branding if provided
          if (agencyBrand?.colors) {
            if (agencyBrand.colors.primary) scaffoldConfig.colors.primary = agencyBrand.colors.primary;
            if (agencyBrand.colors.bg) scaffoldConfig.colors.bg = agencyBrand.colors.bg;
            if (agencyBrand.colors.text) scaffoldConfig.colors.text = agencyBrand.colors.text;
          }

          // Extract MANDATORY COLORS from user's customization selection
          const mandatoryPrimaryMatch = prompt.match(/--color-primary:\s*(#[0-9a-fA-F]{3,8})/);
          const mandatoryAccentMatch = prompt.match(/--color-accent:\s*(#[0-9a-fA-F]{3,8})/);
          if (mandatoryPrimaryMatch) {
            scaffoldConfig.colors.primary = mandatoryPrimaryMatch[1];
            scaffoldConfig.colors.primaryDark = mandatoryPrimaryMatch[1];
          }
          if (mandatoryAccentMatch) {
            scaffoldConfig.colors.accent = mandatoryAccentMatch[1];
          }

          // Build the initial scaffold page
          const scaffoldHtml = buildFullPage(scaffoldConfig, scaffoldBody);

          // Send scaffold immediately — user sees a page in <1s
          controller.enqueue(encoder.encode(sseEvent({
            type: "scaffold",
            content: scaffoldHtml,
          })));

          // ── Phase 1: AI customization via Haiku ──
          controller.enqueue(encoder.encode(sseEvent({
            type: "status",
            message: "Customizing content with AI...",
          })));

          const patchPrompt = generatePatchPrompt(intent, scaffoldConfig);

          const userPromptWithContext = [
            prompt,
            generatorType ? `\nGenerator type: ${generatorType}` : "",
            tier ? `\nQuality tier: ${tier}` : "",
            agencyBrand?.name ? `\nAgency brand: ${agencyBrand.name}` : "",
          ]
            .filter(Boolean)
            .join("");

          const client = new Anthropic();
          const response = await client.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 8192,
            system: patchPrompt,
            messages: [{ role: "user", content: userPromptWithContext }],
          });

          // Extract text from response
          const aiText = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === "text")
            .map((block) => block.text)
            .join("");

          // Parse AI response
          const patch = parseAIResponse(aiText);

          if (patch) {
            // Apply patches to scaffold
            const { html: updatedHtml } = applyPatches(scaffoldHtml, scaffoldConfig, patch);

            // If the AI provided a full title, also update <title> with it
            let finalHtml = updatedHtml;

            // If sections had replacements, rebuild the page with updated config for color changes
            if (patch.colors || patch.title || patch.description) {
              const mergedConfig: SiteConfig = {
                ...scaffoldConfig,
                title: patch.title || scaffoldConfig.title,
                description: patch.description || scaffoldConfig.description,
                colors: { ...scaffoldConfig.colors, ...(patch.colors || {}) },
              };
              finalHtml = buildFullPage(mergedConfig, applyPatchesToBody(scaffoldBody, patch));
            }

            controller.enqueue(encoder.encode(sseEvent({
              type: "status",
              message: "Content customized successfully.",
            })));

            // Replace generic picsum URLs with industry-relevant images
            finalHtml = replacePicsumUrls(finalHtml, prompt);

            controller.enqueue(encoder.encode(sseEvent({
              type: "replace",
              content: finalHtml,
            })));
          } else {
            // AI response wasn't parseable — send scaffold as-is with a note
            const fallbackHtml = replacePicsumUrls(scaffoldHtml, prompt);

            controller.enqueue(encoder.encode(sseEvent({
              type: "status",
              message: "Using scaffold template with default content.",
            })));

            controller.enqueue(encoder.encode(sseEvent({
              type: "replace",
              content: fallbackHtml,
            })));
          }

          // ── Done ──
          controller.enqueue(encoder.encode(sseEvent({ type: "done" })));
          controller.close();
        } catch (err) {
          const message = err instanceof Anthropic.AuthenticationError
            ? "AI service is temporarily unavailable. The site owner needs to update their API key."
            : err instanceof Anthropic.RateLimitError
              ? "AI service is busy. Please wait a moment and try again."
              : err instanceof Anthropic.InternalServerError
                ? "AI service is temporarily overloaded. Please try again in a moment."
                : err instanceof Error
                  ? err.message
                  : "Generation failed. Please try again.";

          controller.enqueue(encoder.encode(sseEvent({
            type: "error",
            message,
          })));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid request";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ── Helper: Apply section patches to body HTML only ──

function applyPatchesToBody(bodyHtml: string, patch: PatchResponse): string {
  let updated = bodyHtml;

  if (patch.sections) {
    for (const [sectionId, fields] of Object.entries(patch.sections)) {
      for (const [fieldId, content] of Object.entries(fields)) {
        // Replace by data attribute markers
        const attrPattern = new RegExp(
          `(data-section="${sectionId}"[^>]*data-field="${fieldId}"[^>]*>)[^<]*(<)`,
          "gi"
        );
        updated = updated.replace(attrPattern, `$1${content}$2`);

        // Also try class-based markers
        const classPattern = new RegExp(
          `(class="[^"]*${sectionId}-${fieldId}[^"]*"[^>]*>)[^<]*(<)`,
          "gi"
        );
        updated = updated.replace(classPattern, `$1${content}$2`);
      }
    }
  }

  return updated;
}
