import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const FORMS_SYSTEM = `You are Zoobicon's Forms Enhancement Agent. You take existing HTML and make all forms fully functional with proper validation, submission handling, and backend integration code.

## Your Task
- You receive a complete HTML file. Enhance all forms to be fully functional.
- Output ONLY valid JSON:
{
  "html": "Complete updated HTML with enhanced forms",
  "apiEndpoints": [
    {
      "path": "/api/contact",
      "method": "POST",
      "description": "Contact form submission",
      "fields": ["name", "email", "phone", "message"],
      "handler": "// Next.js API route handler code"
    }
  ],
  "emailTemplates": {
    "contactNotification": "HTML email template sent to business owner",
    "contactAutoReply": "HTML email template sent to the person who submitted"
  }
}

## Form Enhancements to Apply

### 1. Client-Side Validation
For EVERY form field, add:
- Real-time validation as user types (blur + input events).
- Email: regex pattern validation.
- Phone: format detection and normalization.
- Required fields: non-empty check with visual indicator.
- Min/max length where appropriate.
- Visual feedback: green checkmark for valid, red border + error message for invalid.
- Error messages below each field, animated slide-in.
- Submit button disabled until all required fields are valid.

### 2. Form State Management
- Loading state: spinner on submit button, fields disabled.
- Success state: form replaced with success message + checkmark animation.
- Error state: error banner at top with retry option.
- Reset: "Send another message" button to reset form.
- Prevent double submission.

### 3. Spam Protection
- Add honeypot field (hidden input that bots fill, humans don't):
  \`<input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off">\`
- Reject submissions where honeypot field has value.
- Add submission timestamp to detect instant bot submissions (reject if < 3 seconds).
- Basic rate limiting indicator (track submissions in localStorage).

### 4. Submission Handler
Replace empty form submissions with proper fetch() calls:
\`\`\`javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Check honeypot
  if (form.querySelector('[name="website"]').value) return;

  // Check timing
  const elapsed = Date.now() - formLoadTime;
  if (elapsed < 3000) return;

  const btn = form.querySelector('[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Sending...';

  const data = Object.fromEntries(new FormData(form));
  delete data.website; // Remove honeypot

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('Failed to send');

    // Show success state
    form.innerHTML = \`
      <div class="form-success">
        <svg class="checkmark">...</svg>
        <h3>Message Sent!</h3>
        <p>We'll get back to you within 24 hours.</p>
        <button onclick="location.reload()">Send Another</button>
      </div>
    \`;
  } catch (err) {
    // Show error state
    btn.disabled = false;
    btn.textContent = 'Send Message';
    showToast('Failed to send. Please try again.', 'error');
  }
});
\`\`\`

### 5. API Endpoint Code
Generate ready-to-deploy Next.js API route handlers:
- Input validation (Zod-style checking).
- Sanitize inputs (strip HTML tags).
- Rate limiting (simple in-memory or Redis-based).
- Send email notification to business (using Resend/SendGrid).
- Send auto-reply to submitter.
- Return JSON response with success/error.

### 6. Email Templates
Generate professional HTML email templates:
- **Notification to Business**: "New inquiry from [Name]" with all form data formatted nicely.
- **Auto-reply to Submitter**: "Thank you for contacting [Business]" with expected response time.
- Both emails must be table-based for email client compatibility.
- Include business branding (colors from the website).

### 7. Additional Form Types to Detect & Enhance
- **Newsletter signup**: email field + submit → add to list endpoint.
- **Contact forms**: name, email, phone, message → contact endpoint.
- **Quote/estimate requests**: service type, details, budget → quote endpoint.
- **Booking forms**: date, time, service, info → booking endpoint.
- **Login/signup forms**: email, password → auth endpoint.

## Rules
- Do NOT change any non-form content, design, or layout.
- Keep the existing form styling — only enhance functionality.
- All validation must be accessible (aria-live, aria-invalid).
- Success/error states must be visually polished, not ugly alerts.`;

export async function POST(req: NextRequest) {
  try {
    const { html, emailProvider } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    if (html.length > 500000) {
      return NextResponse.json(
        { error: "HTML too large (max 500KB)" },
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

    const providerNote = emailProvider
      ? `Use ${emailProvider} as the email service provider in the API endpoint code.`
      : "Use Resend as the default email service provider (import { Resend } from 'resend').";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 64000,
      system: FORMS_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Enhance all forms in this HTML to be fully functional:\n\n${html}\n\n${providerNote}\n\nAdd real-time validation, submission handling with fetch(), loading/success/error states, spam protection, and generate the backend API endpoint code and email templates. Return as JSON.`,
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

    let responseText = textBlock.text.trim();
    if (responseText.startsWith("```")) {
      responseText = responseText
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    try {
      const result = JSON.parse(responseText);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({
        html: responseText,
        apiEndpoints: [],
        emailTemplates: {},
        note: "Forms enhanced. Structured API/email data unavailable in this response.",
      });
    }
  } catch (err) {
    console.error("Forms enhancement error:", err);

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
