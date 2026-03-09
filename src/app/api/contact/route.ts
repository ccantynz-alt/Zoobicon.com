import { NextResponse } from "next/server";

/**
 * POST /api/contact
 *
 * Generic contact form handler used by the forms-backend generator.
 * Accepts form submissions and stores them. In production, this would
 * forward to an email service (SendGrid, Resend, etc.) or a CRM.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, message, phone, subject, company, ...extra } = body;

    // Basic validation
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!message || typeof message !== "string" || message.trim().length < 2) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Log the submission (in production, send to email service / database)
    console.log("[Contact Form]", {
      name: name || "Anonymous",
      email,
      subject: subject || "Contact Form Submission",
      message: message.slice(0, 500),
      phone: phone || null,
      company: company || null,
      timestamp: new Date().toISOString(),
    });

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
