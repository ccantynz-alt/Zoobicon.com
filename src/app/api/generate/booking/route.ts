import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const VALID_FEATURES = [
  "calendar-view",
  "time-slots",
  "service-selection",
  "staff-selection",
  "client-form",
  "confirmation-email",
  "reminders",
  "recurring-appointments",
  "waitlist",
  "reviews",
  "pricing-display",
  "cancellation-policy",
];

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  "calendar-view":
    "Interactive monthly calendar with available/booked date indicators. Click a date to see available time slots. Today highlighted, past dates grayed out. Previous/next month navigation.",
  "time-slots":
    "Time slot grid for selected date: morning/afternoon/evening groupings, 30-min or 60-min intervals, available (selectable) vs booked (grayed) slots, selected state with accent color.",
  "service-selection":
    "Service category picker: cards or list with service name, duration, price, and brief description. Select one service before choosing time. Filter by category if multiple service types.",
  "staff-selection":
    "Staff/provider picker: cards with photo (picsum.photos), name, title, and available times. Filter calendar by selected staff member. Brief bio on hover/click.",
  "client-form":
    "Client booking form: name, email, phone, optional notes/special requests. Form validation with inline errors. Auto-fill from localStorage if returning client. Terms checkbox.",
  "confirmation-email":
    "Booking confirmation screen: summary of service, date, time, provider, and client details. 'Add to Calendar' button (generates .ics data). Confirmation number. Print-friendly layout.",
  reminders:
    "Reminder preferences: toggle email/SMS reminders, select timing (24h before, 1h before). Show upcoming appointments list with countdown timers.",
  "recurring-appointments":
    "Recurring booking option: weekly, bi-weekly, monthly frequency. Set number of occurrences or end date. Show all dates in summary before confirming.",
  waitlist:
    "Waitlist for fully-booked times: 'Join Waitlist' button on unavailable slots, waitlist position display, notification preference when spot opens.",
  reviews:
    "Review section: star ratings for staff/services, review cards with client name/date/text, overall rating display, 'Leave a Review' form after completed appointment.",
  "pricing-display":
    "Pricing table: all services with duration and price, package deals/bundles, membership/subscription options with savings display, clear currency formatting.",
  "cancellation-policy":
    "Cancellation policy display: clear rules (24h notice, etc.), cancel/reschedule buttons on upcoming appointments, cancellation reason form, refund policy note.",
};

const BOOKING_SYSTEM = `You are Zoobicon's Booking System Generator. You create production-quality appointment booking applications as single, complete HTML files. These must look like professional booking platforms (think Calendly, Acuity, or Square Appointments).

## Output Format
- Output ONLY the raw HTML. No markdown, no explanation, no code fences.
- Complete document: <!DOCTYPE html>, <html lang="en">, <head>, <body>.
- All CSS in <style> tag. All JS in <script> before </body>.
- No external dependencies except Google Fonts.

## Design Standards

### Layout
- Clean, focused booking flow — no distracting sidebars or complex navigation.
- Step-by-step wizard OR single-page scroll with clear sections.
- Progress indicator showing current step in booking flow.
- Max content width 800px for the booking flow, centered.
- Sidebar with business info (name, address, phone, hours) on desktop.

### Visual Design
- Calming, professional palette appropriate to the business type.
- Healthcare/Wellness: soft blues, greens, lavender.
- Beauty/Salon: rose gold, blush, warm neutrals.
- Professional/Consulting: navy, slate, clean whites.
- Fitness: energetic but clean — deep teal, orange accents.
- Restaurant: warm tones — burgundy, cream, olive.
- 2 Google Fonts: clean sans-serif (Inter, DM Sans, Plus Jakarta Sans).
- Cards with 12px border-radius, subtle shadows.
- Generous white space — booking requires calm, not clutter.

### Calendar Component
- Monthly grid with proper day alignment (start on Sunday or Monday).
- Today highlighted with accent ring.
- Available dates: normal text, clickable with hover effect.
- Booked/unavailable dates: grayed out, not clickable.
- Selected date: filled accent color background.
- Smooth month transition animation.
- Mobile: full-width, large tap targets (min 44px).

### Time Slot Component
- Grid of time buttons organized by time of day.
- Morning (8am-12pm), Afternoon (12pm-5pm), Evening (5pm-9pm).
- Available: outlined button, accent color on hover.
- Selected: filled accent color.
- Unavailable: grayed, disabled.
- Duration indicator next to each slot.

### Booking Form
- Clean input fields with floating labels or top labels.
- Real-time validation: green checkmark or red error.
- Phone field with format hint.
- Email validation.
- Required field indicators.
- Submit button: large, full-width, accent color with loading state.

### Confirmation
- Success animation (checkmark circle).
- Full booking summary in a card.
- 'Add to Calendar' functionality.
- Print/save option.
- Booking reference number.

### Data & State
- Store all bookings in localStorage.
- Generate realistic availability (Mon-Fri 9-5, some slots pre-booked).
- Seed data: 5-8 upcoming appointments for demo.
- All interactions must work: select date → pick time → fill form → confirm.
- Cancel/reschedule flow if those features are selected.

### What NOT to Do
- Don't make it look like a medical form or government website.
- Don't use tiny text or cramped spacing.
- Don't skip the confirmation step — always confirm before booking.
- Don't forget mobile responsiveness — many bookings happen on phones.`;

export async function POST(req: NextRequest) {
  try {
    const { businessName, businessType, services, features } = await req.json();

    if (!businessName || typeof businessName !== "string") {
      return NextResponse.json(
        { error: "businessName is required" },
        { status: 400 }
      );
    }

    if (!businessType || typeof businessType !== "string") {
      return NextResponse.json(
        { error: "businessType is required (e.g., 'salon', 'dental clinic', 'consulting')" },
        { status: 400 }
      );
    }

    const serviceList = Array.isArray(services) && services.length > 0
      ? services
      : [{ name: "Consultation", duration: 60, price: 100 }];

    const selectedFeatures =
      Array.isArray(features) && features.length > 0
        ? features.filter((f: string) => VALID_FEATURES.includes(f))
        : ["calendar-view", "time-slots", "service-selection", "client-form", "confirmation-email"];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const servicesText = serviceList
      .map(
        (s: { name: string; duration?: number; price?: number }, i: number) =>
          `${i + 1}. "${s.name}" — ${s.duration || 60} minutes — $${s.price || 0}`
      )
      .join("\n");

    const featuresText = selectedFeatures
      .map((f: string) => `- ${f}: ${FEATURE_DESCRIPTIONS[f] || f}`)
      .join("\n");

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: BOOKING_SYSTEM,
      messages: [
        {
          role: "user",
          content: `Create a complete booking system for "${businessName}" (${businessType}).\n\nServices offered:\n${servicesText}\n\nRequired features:\n${featuresText}\n\nThis must look and feel like a professional booking platform. The entire booking flow must work: browse services → pick date → choose time → fill info → confirm. All data persisted in localStorage.`,
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

    let html = textBlock.text.trim();
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return NextResponse.json({
      html,
      businessName,
      businessType,
      services: serviceList,
      featuresIncluded: selectedFeatures,
    });
  } catch (err) {
    console.error("Booking system generation error:", err);

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
