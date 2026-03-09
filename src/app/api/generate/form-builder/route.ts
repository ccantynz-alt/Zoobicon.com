import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const FORM_BUILDER_SYSTEM = `You are Zoobicon's Form Builder Generator. You create sophisticated, multi-step forms with conditional logic, validation, and data collection as single HTML files. Think Typeform, JotForm, or Google Forms quality.

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document with all CSS in <style> and all JS in <script>.

## Form Types & Features

### Form Presentation Styles
1. **Conversational** (Typeform-style): One question per screen, large text, enter to continue.
2. **Multi-step Wizard**: Progress bar, step groups, next/back navigation.
3. **Single Page**: All fields visible, sections with scroll-spy sidebar.
4. **Inline Card**: Compact card-style form for embedding.

### Field Types
- Text input (short text, long text/textarea).
- Email with validation.
- Phone with format hint.
- Number with min/max.
- Select dropdown.
- Multi-select checkboxes.
- Radio buttons (single select).
- Star rating (1-5).
- Slider/range with value display.
- Date picker (native input type="date" styled).
- Time picker.
- File upload zone (placeholder).
- Yes/No toggle.
- Likert scale (matrix of radio buttons).
- Signature pad placeholder.
- Address fields (autocomplete grouping).

### Conditional Logic
- Show/hide fields based on previous answers.
- Skip steps based on selections.
- Branch to different paths (e.g., if "Yes" → show details, if "No" → skip).
- Calculate and display values based on inputs.
- Conditional validation rules.

### Validation
- Real-time validation on blur and input.
- Required field indicators (*).
- Custom error messages below fields.
- Email format, phone format, min/max length.
- Visual feedback: green border for valid, red for invalid.
- Form-level validation before submit.

### UX Features
- Progress indicator (% complete or step X of Y).
- Auto-save to localStorage (every field change).
- Resume from where you left off.
- Keyboard navigation (Tab, Enter to continue).
- Smooth transitions between steps/questions.
- Success screen with animation (confetti or checkmark).
- "Review your answers" summary before final submit.
- Edit previous answers from review screen.
- Estimated completion time displayed.

### Data Handling
- Collect all form data into a structured JSON object.
- Display submitted data in a confirmation view.
- Store submissions in localStorage array.
- Export submissions as CSV (download button in admin view).
- Simple admin view to see all submissions in a table.

### Design
- Clean, focused design — form is the center of attention.
- Large, readable questions.
- Generous spacing between fields.
- Touch-friendly on mobile (large tap targets).
- Subtle animations (field focus, step transitions).
- Brand-color accent for focused fields and buttons.
- Mobile: full-width fields, larger text.`;

export async function POST(req: NextRequest) {
  try {
    const { formName, formType, fields, style } = await req.json();

    if (!formName || typeof formName !== "string") {
      return NextResponse.json({ error: "formName is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const fieldsList = Array.isArray(fields) && fields.length > 0
      ? `Fields:\n${fields.map((f: { label: string; type?: string; required?: boolean; options?: string[] }, i: number) => `${i + 1}. "${f.label}" (${f.type || "text"})${f.required ? " *required" : ""}${f.options ? ` [${f.options.join(", ")}]` : ""}`).join("\n")}`
      : "Generate appropriate fields based on the form type.";

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: FORM_BUILDER_SYSTEM,
      messages: [{
        role: "user",
        content: `Create a form called "${formName}".\n\nForm type: ${formType || "survey"}\nPresentation style: ${style || "multi-step"}\n\n${fieldsList}\n\nInclude: progress indicator, conditional logic where appropriate, real-time validation, auto-save, review step, success animation, and an admin view to see submissions. All data persisted in localStorage.`,
      }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    let html = textBlock.text.trim();
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({ html, formName, formType: formType || "survey", style: style || "multi-step" });
  } catch (err) {
    console.error("Form builder generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
