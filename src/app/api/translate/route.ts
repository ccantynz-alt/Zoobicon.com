import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  ja: "Japanese",
  zh: "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
  ko: "Korean",
  hi: "Hindi",
  ar: "Arabic",
  pt: "Portuguese",
  ru: "Russian",
  it: "Italian",
  nl: "Dutch",
  sv: "Swedish",
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  pl: "Polish",
  cs: "Czech",
  tr: "Turkish",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  fil: "Filipino",
  uk: "Ukrainian",
  ro: "Romanian",
  el: "Greek",
  he: "Hebrew",
};

const RTL_LANGUAGES = new Set(["ar", "he"]);

const SYSTEM_PROMPT = `You are an expert internationalization (i18n) engineer. Your task is to take an HTML page and translate all visible text content into multiple languages, then produce a single HTML file with a built-in language switcher.

Rules:
- Output ONLY the final HTML. No markdown, no explanation, no code fences.
- Preserve ALL original HTML structure, CSS styles, classes, IDs, and JavaScript functionality exactly.
- Translate ONLY visible text content (headings, paragraphs, buttons, labels, links, placeholders, alt text, etc.).
- Do NOT translate HTML tags, attributes (except text-containing ones like alt, placeholder, title, aria-label), CSS, JavaScript variable names, or URLs.
- For RTL languages (Arabic, Hebrew), add dir="rtl" handling in the language switcher logic so text direction switches correctly.
- The language switcher should be a clean, floating dropdown in the top-right corner of the page.
- The switcher should use a globe icon (SVG inline) and show the current language name.
- When a language is selected, ALL translated text on the page should update instantly without a page reload.
- Use data attributes (data-i18n="key") on each translatable element.
- Store all translations in a JavaScript object within a <script> tag.
- The default language should be "en" (English / original).
- Make the language switcher visually polished with smooth transitions, matching the page's design aesthetic.
- The switcher dropdown should have a subtle backdrop blur and shadow.
- Ensure the switcher works on mobile (responsive).`;

export async function POST(req: NextRequest) {
  try {
    const { code, targetLanguages } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "HTML code is required" },
        { status: 400 }
      );
    }

    if (
      !targetLanguages ||
      !Array.isArray(targetLanguages) ||
      targetLanguages.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one target language is required" },
        { status: 400 }
      );
    }

    const validLanguages = targetLanguages.filter(
      (lang: string) => lang in LANGUAGE_NAMES
    );

    if (validLanguages.length === 0) {
      return NextResponse.json(
        { error: "No valid target languages provided" },
        { status: 400 }
      );
    }

    const languageList = validLanguages
      .map(
        (lang: string) =>
          `- ${lang}: ${LANGUAGE_NAMES[lang]}${RTL_LANGUAGES.has(lang) ? " (RTL)" : ""}`
      )
      .join("\n");

    const userPrompt = `Here is the HTML page to translate:

\`\`\`html
${code}
\`\`\`

Translate all visible text content into these languages:
${languageList}

Requirements:
1. Keep "en" (English) as the original/default language.
2. Add a floating language switcher dropdown in the top-right corner with a globe icon.
3. The switcher must list all languages: English (original) and all translated languages.
4. Use data-i18n attributes on every translatable element.
5. Store translations in a JS object like: const translations = { "en": { "key1": "Hello", ... }, "es": { "key1": "Hola", ... }, ... }
6. When switching languages, update all text instantly.
7. For RTL languages (${[...RTL_LANGUAGES].filter((l) => validLanguages.includes(l)).join(", ") || "none selected"}), toggle dir="rtl" on the <html> element and adjust the switcher position.
8. The language switcher should:
   - Have a semi-transparent dark background with backdrop blur
   - Show flag emoji next to each language name
   - Highlight the currently active language
   - Have smooth open/close animation
   - Be positioned fixed so it doesn't scroll away
   - Close when clicking outside
9. Preserve absolutely ALL original styling, layout, animations, and interactivity.
10. Output the complete, working HTML file.`;

    const client = new Anthropic();

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const textBlock = message.content.find((b: { type: string }) => b.type === "text") as { type: "text"; text: string } | undefined;
    const translatedCode = textBlock?.text || "";

    if (!translatedCode) {
      return NextResponse.json(
        { error: "Failed to generate translated code" },
        { status: 500 }
      );
    }

    // Extract translations object from the generated code for the response
    const translations: Record<string, Record<string, string>> = {};
    const translationMatch = translatedCode.match(
      /const\s+translations\s*=\s*(\{[\s\S]*?\});/
    );

    if (translationMatch) {
      try {
        // Attempt to parse the translations object
        const parsed = new Function(`return ${translationMatch[1]}`)();
        Object.assign(translations, parsed);
      } catch {
        // If parsing fails, still return the translated code
        // The translations are embedded in the HTML and will work
        validLanguages.forEach((lang: string) => {
          translations[lang] = { note: "Translations embedded in HTML" };
        });
      }
    } else {
      validLanguages.forEach((lang: string) => {
        translations[lang] = { note: "Translations embedded in HTML" };
      });
    }

    return NextResponse.json({
      translatedCode,
      translations,
      languageCount: validLanguages.length,
    });
  } catch (error) {
    console.error("Translation API error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI service error: ${error.message}` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: "An unexpected error occurred during translation" },
      { status: 500 }
    );
  }
}
