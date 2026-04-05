/**
 * SMS & WhatsApp Messaging (#33)
 *
 * Twilio integration for notifications, bookings, marketing.
 * Another wholesale API → retail reseller opportunity.
 *
 * Cost: $0.005-0.01/SMS (Twilio wholesale)
 * Sell: $0.03-0.05/SMS (retail)
 * Margin: 70-80%
 *
 * Use cases:
 *   - Booking confirmations (for customer apps)
 *   - Order notifications (for e-commerce apps)
 *   - Marketing messages (for email marketing alternative)
 *   - Two-factor auth (for customer app security)
 *   - Appointment reminders (for booking apps)
 *
 * Env vars:
 *   TWILIO_ACCOUNT_SID — Twilio account SID
 *   TWILIO_AUTH_TOKEN — Twilio auth token
 *   TWILIO_PHONE_NUMBER — Your Twilio phone number
 */

const TWILIO_API = "https://api.twilio.com/2010-04-01";

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

/**
 * Send an SMS message.
 */
export async function sendSMS(
  to: string,
  body: string,
  from?: string
): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const defaultFrom = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken) {
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("To", to);
    formData.append("From", from || defaultFrom || "");
    formData.append("Body", body);

    const res = await fetch(
      `${TWILIO_API}/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.message || "SMS send failed" };
    }

    return {
      success: true,
      messageId: data.sid,
      cost: parseFloat(data.price) || 0.005,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "SMS failed" };
  }
}

/**
 * Send a WhatsApp message via Twilio.
 */
export async function sendWhatsApp(
  to: string,
  body: string
): Promise<SMSResult> {
  // Twilio WhatsApp uses the same API but with "whatsapp:" prefix
  const whatsappTo = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const whatsappFrom = `whatsapp:${process.env.TWILIO_PHONE_NUMBER || ""}`;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return { success: false, error: "WhatsApp service not configured" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("To", whatsappTo);
    formData.append("From", whatsappFrom);
    formData.append("Body", body);

    const res = await fetch(
      `${TWILIO_API}/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      }
    );

    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || "WhatsApp failed" };

    return { success: true, messageId: data.sid };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "WhatsApp failed" };
  }
}

/**
 * Check if messaging is configured.
 */
export function isMessagingConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Send booking confirmation (template for customer apps).
 */
export async function sendBookingConfirmation(
  phone: string,
  details: { businessName: string; date: string; time: string; service: string }
): Promise<SMSResult> {
  const body = `Booking confirmed at ${details.businessName}!\n\n${details.service}\n${details.date} at ${details.time}\n\nSee you there!`;
  return sendSMS(phone, body);
}

/**
 * Send order notification (template for e-commerce apps).
 */
export async function sendOrderNotification(
  phone: string,
  details: { orderNumber: string; total: string; businessName: string }
): Promise<SMSResult> {
  const body = `Order #${details.orderNumber} confirmed! Total: ${details.total}. Thank you for shopping with ${details.businessName}.`;
  return sendSMS(phone, body);
}
