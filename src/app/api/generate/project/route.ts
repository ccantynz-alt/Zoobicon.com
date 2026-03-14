import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const PROJECT_SYSTEM = `You are Zoobicon, a world-class AI project generator. Given a description, you produce a complete, production-ready multi-file project as a JSON object.

## Output Format
- Output ONLY a valid JSON object. No markdown, no explanation, no code fences.
- The JSON must follow this exact structure:
{
  "projectName": "my-project",
  "files": [
    {
      "path": "src/app/page.tsx",
      "content": "// file content here...",
      "language": "tsx"
    }
  ]
}

## Language Detection
- Detect the language from the file extension:
  - .tsx/.ts → "tsx"/"ts"
  - .jsx/.js → "jsx"/"js"
  - .css/.scss → "css"
  - .json → "json"
  - .html → "html"
  - .md → "md"
  - Everything else → "text"

## Code Quality Standards
- Use modern patterns: hooks, functional components, async/await
- Full TypeScript types — no \`any\` unless truly needed
- Tailwind CSS for all styling
- Proper imports and exports
- Real, working code — every file must be syntactically correct
- Components should be well-structured and reusable
- Use descriptive variable and function names

## JSON Escaping — CRITICAL
- All file content must be properly JSON-escaped
- Escape double quotes as \\"
- Escape newlines as \\n
- Escape tabs as \\t
- Escape backslashes as \\\\
- Do NOT use backticks or template literals in the JSON output`;

const NEXTJS_INSTRUCTIONS = `
## Next.js 14 Project Structure (App Router)
Generate these files at minimum:
- package.json (with next, react, react-dom, typescript, tailwindcss, @types/react, @types/react-dom, @types/node, postcss, autoprefixer)
- tsconfig.json (standard Next.js TypeScript config)
- next.config.js (minimal config)
- tailwind.config.ts (with content paths for src/)
- postcss.config.js (with tailwindcss and autoprefixer)
- src/app/layout.tsx (root layout with html, body, metadata export)
- src/app/page.tsx (home page)
- src/app/globals.css (Tailwind directives + custom styles)

Additional components go in src/components/.
Additional pages go in src/app/[route]/page.tsx.
API routes go in src/app/api/[route]/route.ts.

Use "use client" directive on components that use React hooks or browser APIs.
Use Next.js Link component for navigation.
Export metadata from page.tsx and layout.tsx for SEO.`;

const REACT_INSTRUCTIONS = `
## React + Vite Project Structure
Generate these files at minimum:
- package.json (with react, react-dom, typescript, @vitejs/plugin-react, vite, tailwindcss, postcss, autoprefixer, @types/react, @types/react-dom)
- tsconfig.json (standard React TypeScript config)
- vite.config.ts (with @vitejs/plugin-react)
- tailwind.config.ts (with content paths)
- postcss.config.js (with tailwindcss and autoprefixer)
- index.html (Vite entry point with <div id="root">)
- src/main.tsx (ReactDOM.createRoot entry)
- src/App.tsx (main App component with routing if needed)
- src/index.css (Tailwind directives + custom styles)

Additional components go in src/components/.
Use React Router (react-router-dom) if multiple pages are needed.`;

const STATIC_INSTRUCTIONS = `
## Static HTML/CSS/JS Project Structure
Generate these files at minimum:
- index.html (complete HTML5 document with linked CSS and JS)
- styles.css (all styles, well-organized with sections)
- script.js (vanilla JavaScript, modern ES6+)
- package.json (with "http-server" as a dependency and "start": "http-server ." script)

For multi-page static sites, create additional .html files.
Use clean, semantic HTML5.
Use CSS custom properties for theming.
Use modern JavaScript (const/let, arrow functions, template literals, fetch API).`;

interface ProjectRequest {
  prompt: string;
  framework: "nextjs" | "react" | "static";
  model?: string;
}

interface ProjectFileResponse {
  path: string;
  content: string;
  language: string;
}

interface ProjectResponse {
  projectName: string;
  files: ProjectFileResponse[];
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, framework, model }: ProjectRequest = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "A prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        { error: "Prompt too long (max 5000 characters)" },
        { status: 400 }
      );
    }

    const validFrameworks = ["nextjs", "react", "static"];
    if (!framework || !validFrameworks.includes(framework)) {
      return NextResponse.json(
        { error: "framework must be one of: nextjs, react, static" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    let frameworkInstructions = NEXTJS_INSTRUCTIONS;
    if (framework === "react") frameworkInstructions = REACT_INSTRUCTIONS;
    if (framework === "static") frameworkInstructions = STATIC_INSTRUCTIONS;

    const systemPrompt = PROJECT_SYSTEM + "\n" + frameworkInstructions;

    const userMessage = `Generate a complete, production-ready ${framework === "nextjs" ? "Next.js 14" : framework === "react" ? "React + Vite" : "static HTML/CSS/JS"} project for the following:

${prompt}

Requirements:
- Every file must contain real, working code — not placeholders or TODOs.
- The project must be ready to run with just \`npm install && npm run dev\` (or \`npm start\` for static).
- Use Tailwind CSS for styling. Make it look professional and polished.
- Include proper TypeScript types throughout${framework !== "static" ? "" : " (not applicable for static)"}.
- Generate all necessary config files.
- Create well-structured, modular components.
- The design should be modern, clean, and responsive.`;

    const selectedModel = model || "claude-sonnet-4-6";

    const message = await client.messages.create({
      model: selectedModel,
      max_tokens: 32000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response generated" },
        { status: 500 }
      );
    }

    let rawText = textBlock.text.trim();

    // Strip markdown code fences if present
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed: ProjectResponse;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Try to extract JSON from the response if it has surrounding text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          return NextResponse.json(
            { error: "Failed to parse AI response as JSON" },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Failed to parse AI response as JSON" },
          { status: 500 }
        );
      }
    }

    // Validate the response structure
    if (!parsed.files || !Array.isArray(parsed.files) || parsed.files.length === 0) {
      return NextResponse.json(
        { error: "Invalid response: missing files array" },
        { status: 500 }
      );
    }

    for (const file of parsed.files) {
      if (!file.path || typeof file.content !== "string") {
        return NextResponse.json(
          { error: "Invalid file data: each file must have path and content" },
          { status: 500 }
        );
      }
      // Auto-detect language if not provided
      if (!file.language) {
        const ext = file.path.split(".").pop()?.toLowerCase() || "text";
        const langMap: Record<string, string> = {
          tsx: "tsx", ts: "ts", jsx: "jsx", js: "js",
          css: "css", scss: "css", json: "json",
          html: "html", md: "md", mjs: "js",
        };
        file.language = langMap[ext] || "text";
      }
    }

    if (!parsed.projectName) {
      parsed.projectName = "my-project";
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Project generation error:", err);

    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `API error: ${err.message}` },
        { status: err.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
