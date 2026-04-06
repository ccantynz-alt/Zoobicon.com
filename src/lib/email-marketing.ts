// ─── Email Marketing Library ───
// Types, mock data, and utility functions for the AI Email Marketing system.

export interface Subscriber {
  id: string;
  email: string;
  name: string;
  subscribedAt: string;
  source: "site-form" | "import" | "manual" | "api";
  status: "active" | "unsubscribed";
  tags: string[];
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  status: "draft" | "scheduled" | "sent";
  sentAt?: string;
  scheduledFor?: string;
  openRate?: number;
  clickRate?: number;
  recipients: number;
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  description: string;
  emails: { subject: string; delay: string }[];
  active: boolean;
  sent: number;
}

export interface FormOptions {
  headline: string;
  description: string;
  buttonText: string;
  primaryColor: string;
  bgColor: string;
  textColor: string;
}

export interface EmailStats {
  totalSubscribers: number;
  avgOpenRate: number;
  avgClickRate: number;
  monthlyGrowth: number;
  totalCampaignsSent: number;
  activeAutomations: number;
}

// ─── Mock Subscribers ───
const MOCK_SUBSCRIBERS: Subscriber[] = [
  { id: "sub-001", email: "sarah@startup.io", name: "Sarah Chen", subscribedAt: "2026-01-15T09:00:00Z", source: "site-form", status: "active", tags: ["pro", "early-adopter"] },
  { id: "sub-002", email: "james@agency.co", name: "James Rodriguez", subscribedAt: "2026-01-18T14:30:00Z", source: "site-form", status: "active", tags: ["agency"] },
  { id: "sub-003", email: "lisa@design.com", name: "Lisa Park", subscribedAt: "2026-01-20T11:00:00Z", source: "import", status: "active", tags: ["designer"] },
  { id: "sub-004", email: "mike@devshop.io", name: "Mike Thompson", subscribedAt: "2026-01-22T08:45:00Z", source: "manual", status: "active", tags: ["developer"] },
  { id: "sub-005", email: "emma@freelance.work", name: "Emma Wilson", subscribedAt: "2026-01-25T16:20:00Z", source: "site-form", status: "active", tags: ["freelancer"] },
  { id: "sub-006", email: "david@techcorp.com", name: "David Kim", subscribedAt: "2026-02-01T10:10:00Z", source: "api", status: "active", tags: ["enterprise"] },
  { id: "sub-007", email: "olivia@brand.studio", name: "Olivia Martinez", subscribedAt: "2026-02-03T13:00:00Z", source: "site-form", status: "active", tags: ["designer", "pro"] },
  { id: "sub-008", email: "alex@saas.io", name: "Alex Nguyen", subscribedAt: "2026-02-05T09:30:00Z", source: "import", status: "active", tags: ["saas", "early-adopter"] },
  { id: "sub-009", email: "rachel@blog.net", name: "Rachel Adams", subscribedAt: "2026-02-08T15:45:00Z", source: "site-form", status: "unsubscribed", tags: ["blogger"] },
  { id: "sub-010", email: "carlos@ecom.shop", name: "Carlos Rivera", subscribedAt: "2026-02-10T11:20:00Z", source: "manual", status: "active", tags: ["ecommerce"] },
  { id: "sub-011", email: "jenny@growth.co", name: "Jenny Liu", subscribedAt: "2026-02-14T08:00:00Z", source: "site-form", status: "active", tags: ["marketer"] },
  { id: "sub-012", email: "tom@studio.dev", name: "Tom Baker", subscribedAt: "2026-02-17T12:30:00Z", source: "import", status: "active", tags: ["developer", "agency"] },
  { id: "sub-013", email: "nina@consulting.biz", name: "Nina Patel", subscribedAt: "2026-02-20T14:10:00Z", source: "site-form", status: "active", tags: ["consulting"] },
  { id: "sub-014", email: "ryan@app.works", name: "Ryan Cooper", subscribedAt: "2026-03-01T10:00:00Z", source: "api", status: "active", tags: ["developer", "pro"] },
  { id: "sub-015", email: "mia@creative.co", name: "Mia Johnson", subscribedAt: "2026-03-05T09:15:00Z", source: "site-form", status: "active", tags: ["designer"] },
  { id: "sub-016", email: "ben@startup.fund", name: "Ben Taylor", subscribedAt: "2026-03-08T16:45:00Z", source: "manual", status: "active", tags: ["investor"] },
  { id: "sub-017", email: "sophie@retail.com", name: "Sophie Brown", subscribedAt: "2026-03-12T11:30:00Z", source: "site-form", status: "active", tags: ["ecommerce", "pro"] },
  { id: "sub-018", email: "marcus@dev.agency", name: "Marcus Green", subscribedAt: "2026-03-15T08:20:00Z", source: "import", status: "active", tags: ["agency", "developer"] },
];

// ─── Mock Campaigns ───
const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "camp-001", name: "Spring Launch", subject: "Introducing AI Website Builder 2.0", content: "<h1>We just shipped something huge.</h1><p>Our AI pipeline now generates full-stack apps in 95 seconds. Multi-page sites, e-commerce stores, and complete CRUD applications — all from a single prompt.</p><p>Try it today and get 50% off your first month.</p>", status: "sent", sentAt: "2026-03-01T10:00:00Z", openRate: 42.3, clickRate: 8.7, recipients: 1247 },
  { id: "camp-002", name: "Feature Update", subject: "New: 43 Specialized Generators", content: "<h1>We listened. You asked for more.</h1><p>Restaurant menus, SaaS dashboards, portfolios, e-commerce stores — we now have 43 specialized generators, each with its own AI prompt tuning.</p>", status: "sent", sentAt: "2026-02-15T09:00:00Z", openRate: 38.1, clickRate: 6.2, recipients: 1103 },
  { id: "camp-003", name: "Agency Program", subject: "White-label AI for your agency", content: "<h1>Build client sites 10x faster.</h1><p>Our new Agency plan gives you white-label generation, client portals, bulk operations, and approval workflows. Your clients will never know it's AI.</p>", status: "sent", sentAt: "2026-02-01T11:00:00Z", openRate: 51.2, clickRate: 12.4, recipients: 892 },
  { id: "camp-004", name: "Weekly Digest #12", subject: "This week: E-commerce + Visual Editing", content: "<h1>What's new this week</h1><p>E-commerce storefronts with cart, checkout, and product search. Visual editing with click-to-select and property panels. 15 new templates.</p>", status: "sent", sentAt: "2026-01-25T10:00:00Z", openRate: 35.6, clickRate: 5.8, recipients: 834 },
  { id: "camp-005", name: "Video Creator Launch", subject: "AI Video Creator is here", content: "<h1>From script to screen.</h1><p>Our new Video Creator pipeline generates scripts, storyboards, scene images, voiceovers, and subtitles — all from a single description.</p>", status: "sent", sentAt: "2026-03-10T10:00:00Z", openRate: 47.8, clickRate: 11.3, recipients: 1389 },
  { id: "camp-006", name: "Easter Promo", subject: "Build your dream site this weekend — 30% off", content: "<h1>Spring into action.</h1><p>This weekend only: 30% off all plans. Use code SPRING30 at checkout. Build unlimited sites, deploy instantly, and cancel anytime.</p>", status: "scheduled", scheduledFor: "2026-04-05T09:00:00Z", recipients: 1456 },
  { id: "camp-007", name: "Product Roadmap Q2", subject: "Here's what we're building next", content: "", status: "draft", recipients: 0 },
  { id: "camp-008", name: "Customer Spotlight", subject: "How Agency X built 200 client sites in a month", content: "", status: "draft", recipients: 0 },
];

// ─── Mock Automations ───
const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: "auto-001", name: "Welcome Series", trigger: "New subscriber joins",
    description: "Introduce new subscribers to the platform with a 3-email onboarding sequence.",
    emails: [
      { subject: "Welcome to Zoobicon! Here's how to build your first site", delay: "Immediately" },
      { subject: "5 prompts that create stunning websites", delay: "2 days" },
      { subject: "You haven't deployed yet — here's a free template", delay: "5 days" },
    ],
    active: true, sent: 487,
  },
  {
    id: "auto-002", name: "Re-engagement", trigger: "No login for 14 days",
    description: "Bring back inactive users with personalized content and offers.",
    emails: [
      { subject: "We miss you! Here's what's new", delay: "14 days inactive" },
      { subject: "Your sites are waiting — plus a special offer", delay: "21 days inactive" },
    ],
    active: true, sent: 156,
  },
  {
    id: "auto-003", name: "Upgrade Nudge", trigger: "Free tier limit reached",
    description: "Convert free users who hit their build limit.",
    emails: [
      { subject: "You've used all your free builds — upgrade for unlimited", delay: "Immediately" },
      { subject: "Last chance: 20% off Pro for the next 48 hours", delay: "2 days" },
    ],
    active: true, sent: 312,
  },
  {
    id: "auto-004", name: "Post-Deploy Follow-up", trigger: "Site deployed",
    description: "Help users get the most from their deployed site.",
    emails: [
      { subject: "Your site is live! Here's how to get traffic", delay: "1 hour" },
      { subject: "Add a custom domain to look professional", delay: "3 days" },
    ],
    active: false, sent: 723,
  },
  {
    id: "auto-005", name: "Birthday / Anniversary", trigger: "Account anniversary",
    description: "Celebrate milestones with personalized offers.",
    emails: [
      { subject: "Happy anniversary! Here's a gift from us", delay: "On date" },
    ],
    active: false, sent: 89,
  },
];

// ─── Subscriber Growth Data (last 12 months) ───
export const SUBSCRIBER_GROWTH = [
  { month: "Apr 2025", count: 120 },
  { month: "May 2025", count: 185 },
  { month: "Jun 2025", count: 267 },
  { month: "Jul 2025", count: 334 },
  { month: "Aug 2025", count: 412 },
  { month: "Sep 2025", count: 521 },
  { month: "Oct 2025", count: 643 },
  { month: "Nov 2025", count: 789 },
  { month: "Dec 2025", count: 891 },
  { month: "Jan 2026", count: 1024 },
  { month: "Feb 2026", count: 1203 },
  { month: "Mar 2026", count: 1456 },
];

// ─── Public API ───

export function getSubscribers(): Subscriber[] {
  return MOCK_SUBSCRIBERS;
}

export function getCampaigns(): Campaign[] {
  return MOCK_CAMPAIGNS;
}

export function getAutomations(): Automation[] {
  return MOCK_AUTOMATIONS;
}

export function getEmailStats(): EmailStats {
  const subs = MOCK_SUBSCRIBERS.filter((s) => s.status === "active");
  const sentCampaigns = MOCK_CAMPAIGNS.filter((c) => c.status === "sent");
  const avgOpen =
    sentCampaigns.reduce((sum, c) => sum + (c.openRate || 0), 0) /
    (sentCampaigns.length || 1);
  const avgClick =
    sentCampaigns.reduce((sum, c) => sum + (c.clickRate || 0), 0) /
    (sentCampaigns.length || 1);

  const now = new Date();
  const thisMonth = subs.filter((s) => {
    const d = new Date(s.subscribedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return {
    totalSubscribers: subs.length,
    avgOpenRate: Math.round(avgOpen * 10) / 10,
    avgClickRate: Math.round(avgClick * 10) / 10,
    monthlyGrowth: thisMonth,
    totalCampaignsSent: sentCampaigns.length,
    activeAutomations: MOCK_AUTOMATIONS.filter((a) => a.active).length,
  };
}

export function generateSubjectLines(topic: string): string[] {
  // AI-powered in production — returns smart suggestions based on topic
  const templates = [
    `${topic} — here's what you need to know`,
    `Big news: ${topic}`,
    `You asked, we delivered: ${topic}`,
    `[New] ${topic} is live`,
    `The future of ${topic} starts today`,
  ];
  // Shuffle and return 3
  const shuffled = templates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export function getFormEmbedCode(
  style: "inline" | "popup" | "slide-in" | "full-page",
  options: FormOptions
): string {
  const { headline, description, buttonText, primaryColor, bgColor, textColor } = options;

  if (style === "inline") {
    return `<!-- Zoobicon Email Signup Form -->
<div id="zoobicon-form" style="max-width:480px;margin:0 auto;padding:32px;background:${bgColor};border-radius:12px;font-family:system-ui,sans-serif;">
  <h3 style="margin:0 0 8px;color:${textColor};font-size:24px;font-weight:700;">${headline}</h3>
  <p style="margin:0 0 20px;color:${textColor};opacity:0.7;font-size:15px;">${description}</p>
  <form action="https://zoobicon.com/api/email-marketing/subscribe" method="POST" style="display:flex;gap:8px;">
    <input type="email" name="email" placeholder="your@email.com" required
      style="flex:1;padding:12px 16px;border:1px solid rgba(255,255,255,0.15);border-radius:8px;background:rgba(255,255,255,0.05);color:${textColor};font-size:15px;outline:none;" />
    <button type="submit"
      style="padding:12px 24px;background:${primaryColor};color:white;border:none;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;">${buttonText}</button>
  </form>
</div>`;
  }

  if (style === "popup") {
    return `<!-- Zoobicon Popup Signup Form -->
<script>
(function(){
  var shown = sessionStorage.getItem('zbk_popup');
  if (shown) return;
  setTimeout(function(){
    var overlay = document.createElement('div');
    overlay.id = 'zbk-popup-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = '<div style="max-width:440px;width:90%;padding:40px;background:${bgColor};border-radius:16px;position:relative;font-family:system-ui,sans-serif;">'
      + '<button onclick="document.getElementById(\\'zbk-popup-overlay\\').remove()" style="position:absolute;top:12px;right:12px;background:none;border:none;color:${textColor};font-size:24px;cursor:pointer;">&times;</button>'
      + '<h3 style="margin:0 0 8px;color:${textColor};font-size:24px;font-weight:700;">${headline}</h3>'
      + '<p style="margin:0 0 20px;color:${textColor};opacity:0.7;font-size:15px;">${description}</p>'
      + '<form action="https://zoobicon.com/api/email-marketing/subscribe" method="POST" style="display:flex;gap:8px;">'
      + '<input type="email" name="email" placeholder="your@email.com" required style="flex:1;padding:12px 16px;border:1px solid rgba(255,255,255,0.15);border-radius:8px;background:rgba(255,255,255,0.05);color:${textColor};font-size:15px;" />'
      + '<button type="submit" style="padding:12px 24px;background:${primaryColor};color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">${buttonText}</button>'
      + '</form></div>';
    document.body.appendChild(overlay);
    sessionStorage.setItem('zbk_popup', '1');
  }, 5000);
})();
</script>`;
  }

  if (style === "slide-in") {
    return `<!-- Zoobicon Slide-in Signup Form -->
<script>
(function(){
  var shown = sessionStorage.getItem('zbk_slidein');
  if (shown) return;
  window.addEventListener('scroll', function handler(){
    if ((window.scrollY + window.innerHeight) / document.body.scrollHeight > 0.5) {
      var el = document.createElement('div');
      el.id = 'zbk-slidein';
      el.style.cssText = 'position:fixed;bottom:24px;right:24px;max-width:380px;padding:28px;background:${bgColor};border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.4);z-index:99999;font-family:system-ui,sans-serif;animation:zbk-slide 0.4s ease;';
      el.innerHTML = '<button onclick="document.getElementById(\\'zbk-slidein\\').remove()" style="position:absolute;top:8px;right:12px;background:none;border:none;color:${textColor};font-size:20px;cursor:pointer;">&times;</button>'
        + '<h3 style="margin:0 0 6px;color:${textColor};font-size:20px;font-weight:700;">${headline}</h3>'
        + '<p style="margin:0 0 16px;color:${textColor};opacity:0.7;font-size:14px;">${description}</p>'
        + '<form action="https://zoobicon.com/api/email-marketing/subscribe" method="POST">'
        + '<input type="email" name="email" placeholder="your@email.com" required style="width:100%;padding:10px 14px;border:1px solid rgba(255,255,255,0.15);border-radius:8px;background:rgba(255,255,255,0.05);color:${textColor};font-size:14px;margin-bottom:10px;box-sizing:border-box;" />'
        + '<button type="submit" style="width:100%;padding:10px;background:${primaryColor};color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;">${buttonText}</button>'
        + '</form>';
      document.body.appendChild(el);
      var style = document.createElement('style');
      style.textContent = '@keyframes zbk-slide{from{transform:translateY(100px);opacity:0}to{transform:translateY(0);opacity:1}}';
      document.head.appendChild(style);
      sessionStorage.setItem('zbk_slidein', '1');
      window.removeEventListener('scroll', handler);
    }
  });
})();
</script>`;
  }

  // full-page
  return `<!-- Zoobicon Full-Page Signup -->
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:${bgColor};font-family:system-ui,sans-serif;">
  <div style="max-width:520px;width:90%;text-align:center;padding:48px;">
    <h1 style="margin:0 0 12px;color:${textColor};font-size:40px;font-weight:800;">${headline}</h1>
    <p style="margin:0 0 32px;color:${textColor};opacity:0.7;font-size:18px;line-height:1.6;">${description}</p>
    <form action="https://zoobicon.com/api/email-marketing/subscribe" method="POST" style="display:flex;gap:10px;max-width:420px;margin:0 auto;">
      <input type="email" name="email" placeholder="your@email.com" required
        style="flex:1;padding:14px 18px;border:1px solid rgba(255,255,255,0.15);border-radius:10px;background:rgba(255,255,255,0.05);color:${textColor};font-size:16px;" />
      <button type="submit"
        style="padding:14px 28px;background:${primaryColor};color:white;border:none;border-radius:10px;font-weight:700;font-size:16px;cursor:pointer;">${buttonText}</button>
    </form>
  </div>
</div>`;
}
