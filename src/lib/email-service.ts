/**
 * Zoobicon Email Service — Domain Verification & Content Analysis
 *
 * Generates DNS verification records for custom sending domains
 * and provides email content spam analysis.
 *
 * All actual email delivery is handled by Mailgun (see mailgun.ts).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DomainVerification {
  domain: string;
  status: "pending" | "verified" | "failed";
  dkimTokens: string[];
  spfRecord: string;
  dmarcRecord: string;
  verificationToken: string;
  requiredRecords: DnsRequirement[];
}

export interface DnsRequirement {
  type: "TXT" | "CNAME" | "MX";
  name: string;
  value: string;
  purpose: "spf" | "dkim" | "dmarc" | "verification" | "mx";
}

// ---------------------------------------------------------------------------
// Domain Verification — Generate required DNS records
// ---------------------------------------------------------------------------

export function generateDomainVerification(domain: string): DomainVerification {
  const verificationToken = `zoobicon-verify-${crypto.randomUUID().slice(0, 12)}`;

  // Generate DKIM selector tokens (Mailgun uses CNAME records)
  const dkimTokens = Array.from({ length: 3 }, () =>
    crypto.randomUUID().replace(/-/g, "").slice(0, 32)
  );

  const requiredRecords: DnsRequirement[] = [
    // Domain verification TXT
    {
      type: "TXT",
      name: `_zoobicon.${domain}`,
      value: verificationToken,
      purpose: "verification",
    },
    // SPF record
    {
      type: "TXT",
      name: domain,
      value: "v=spf1 include:mailgun.org ~all",
      purpose: "spf",
    },
    // DKIM CNAME records
    ...dkimTokens.map((token, i) => ({
      type: "CNAME" as const,
      name: `zb${i + 1}._domainkey.${domain}`,
      value: `${token}.dkim.zoobicon.io`,
      purpose: "dkim" as const,
    })),
    // DMARC policy
    {
      type: "TXT",
      name: `_dmarc.${domain}`,
      value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@zoobicon.io; pct=100`,
      purpose: "dmarc",
    },
    // MX record for receiving via Mailgun
    {
      type: "MX",
      name: domain,
      value: "mxa.mailgun.org",
      purpose: "mx",
    },
  ];

  return {
    domain,
    status: "pending",
    dkimTokens,
    spfRecord: requiredRecords.find((r) => r.purpose === "spf")!.value,
    dmarcRecord: requiredRecords.find((r) => r.purpose === "dmarc")!.value,
    verificationToken,
    requiredRecords,
  };
}

// ---------------------------------------------------------------------------
// Deliverability AI Analysis (uses existing LLM infrastructure)
// ---------------------------------------------------------------------------

export function analyzeEmailContent(html: string): {
  spamScore: number;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let spamScore = 0;

  // Check for common spam triggers
  const lowerHtml = html.toLowerCase();

  if (lowerHtml.includes("click here")) {
    issues.push("Contains 'click here' — a spam trigger phrase");
    spamScore += 10;
  }
  if (lowerHtml.includes("act now")) {
    issues.push("Contains 'act now' — urgency language triggers spam filters");
    spamScore += 10;
  }
  if (lowerHtml.includes("free money") || lowerHtml.includes("guaranteed")) {
    issues.push("Contains high-risk spam words");
    spamScore += 20;
  }
  if ((html.match(/!/g) || []).length > 3) {
    issues.push("Excessive exclamation marks");
    spamScore += 5;
  }
  if ((html.match(/[A-Z]{5,}/g) || []).length > 2) {
    issues.push("Excessive ALL CAPS text");
    spamScore += 10;
  }

  // Check for best practices
  if (!lowerHtml.includes("unsubscribe")) {
    issues.push("Missing unsubscribe link — required by CAN-SPAM and GDPR");
    spamScore += 15;
    suggestions.push("Add an unsubscribe link to comply with email regulations");
  }
  if (!lowerHtml.includes("<!doctype") && !lowerHtml.includes("<html")) {
    suggestions.push("Use proper HTML document structure for better rendering");
  }
  if (!lowerHtml.includes("alt=")) {
    suggestions.push(
      "Add alt text to images — some clients block images by default"
    );
  }

  // Image-to-text ratio
  const imgCount = (html.match(/<img/gi) || []).length;
  const textLength = html.replace(/<[^>]+>/g, "").trim().length;
  if (imgCount > 0 && textLength < 200) {
    issues.push("Low text-to-image ratio — may trigger spam filters");
    spamScore += 10;
    suggestions.push("Add more text content to balance the image-to-text ratio");
  }

  if (issues.length === 0) {
    suggestions.push("Email content looks clean — no major spam triggers detected");
  }

  return {
    spamScore: Math.min(spamScore, 100),
    issues,
    suggestions,
  };
}
