/**
 * mailgun-client — compatibility shim that exposes a simple `sendEmail`
 * signature on top of the existing mailgun.ts module. Daily-comeback, domain-hook,
 * and instant-onboarding all import this path.
 */

import { sendViaMailgun, type MailgunSendResult } from "./mailgun";

export interface SendEmailArgs {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: string[];
}

export async function sendEmail(args: SendEmailArgs): Promise<MailgunSendResult> {
  const from =
    args.from ||
    `Zoobicon <noreply@${process.env.MAILGUN_DOMAIN || "zoobicon.com"}>`;
  return sendViaMailgun({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    text: args.text,
    replyTo: args.replyTo,
    tags: args.tags,
  });
}
