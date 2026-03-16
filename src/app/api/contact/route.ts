import { NextResponse } from "next/server";
import { notifyContactForm, notifyWaitlist } from "@/lib/admin-notify";

/**
 * POST /api/contact
 *
 * Generic contact form handler used by the forms-backend generator.
 * Accepts form submissions and emails them to the admin via Resend.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, message, phone, subject, company, source, ...extra } = body;

    // Basic validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length < 2) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Log the submission
    console.log("[Contact Form]", {
      name: name || "Anonymous",
      email,
      subject: subject || "Contact Form Submission",
      message: message.slice(0, 500),
      phone: phone || null,
      company: company || null,
      source: source || null,
      timestamp: new Date().toISOString(),
    });

    // Send notification email to admin
    if (source && source.includes("waitlist")) {
      await notifyWaitlist({ email, product: source.replace("-waitlist", "") });
    } else {
      await notifyContactForm({
        name,
        email,
        subject,
        message: message.slice(0, 2000),
        phone,
        company,
        source,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Your message has been received. We'll get back to you within 24 hours.",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
