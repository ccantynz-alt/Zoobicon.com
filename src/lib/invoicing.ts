// ---------------------------------------------------------------------------
// AI Invoicing & Proposals — Library
//
// localStorage-backed invoicing system with rich mock data.
// Replaces FreshBooks ($17/mo) and Bonsai ($25/mo).
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company?: string;
  totalBilled: number;
  invoiceCount: number;
  lastActivity: string;
}

export interface Proposal {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  summary: string;
  scope: string[];
  timeline: string;
  deliverables: string[];
  pricing: InvoiceItem[];
  total: number;
  status: "draft" | "sent" | "accepted" | "declined";
  createdAt: string;
}

export interface RecurringInvoice {
  id: string;
  clientId: string;
  clientName: string;
  description: string;
  amount: number;
  frequency: "weekly" | "monthly" | "quarterly";
  nextDate: string;
  active: boolean;
}

export interface PaymentEvent {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  paidAt: string;
  method: string;
}

export interface InvoiceStats {
  outstanding: number;
  paidThisMonth: number;
  overdue: number;
  overdueCount: number;
  totalRevenue: number;
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  invoices: "zoobicon_invoices",
  clients: "zoobicon_invoice_clients",
  proposals: "zoobicon_proposals",
  recurring: "zoobicon_recurring_invoices",
  payments: "zoobicon_payment_events",
  counter: "zoobicon_invoice_counter",
} as const;

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_CLIENTS: Client[] = [
  { id: "cl-001", name: "Sarah Chen", email: "sarah@bloomcafe.com", company: "Bloom Cafe", totalBilled: 4200, invoiceCount: 3, lastActivity: "2026-03-18" },
  { id: "cl-002", name: "Marcus Rivera", email: "marcus@riveraphotography.com", company: "Rivera Photography", totalBilled: 6800, invoiceCount: 5, lastActivity: "2026-03-15" },
  { id: "cl-003", name: "Priya Patel", email: "priya@zenithfitness.io", company: "Zenith Fitness", totalBilled: 3500, invoiceCount: 2, lastActivity: "2026-03-10" },
  { id: "cl-004", name: "David Okonkwo", email: "david@oaklegal.com", company: "Oak & Associates Legal", totalBilled: 12400, invoiceCount: 8, lastActivity: "2026-03-20" },
  { id: "cl-005", name: "Emma Larsson", email: "emma@nordicdesigns.se", company: "Nordic Designs", totalBilled: 8900, invoiceCount: 6, lastActivity: "2026-03-12" },
  { id: "cl-006", name: "Alex Kim", email: "alex@startupgrind.co", company: "StartupGrind", totalBilled: 2100, invoiceCount: 1, lastActivity: "2026-03-08" },
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: "inv-001", number: "INV-1001", clientId: "cl-001", clientName: "Sarah Chen", clientEmail: "sarah@bloomcafe.com",
    items: [
      { description: "Website redesign — 5 pages with custom animations", quantity: 1, rate: 1800, amount: 1800 },
      { description: "SEO optimization & meta tags", quantity: 1, rate: 400, amount: 400 },
    ],
    subtotal: 2200, tax: 198, total: 2398, status: "paid", issuedAt: "2026-02-20", dueAt: "2026-03-06", paidAt: "2026-03-04",
    notes: "Thank you for choosing Zoobicon!",
  },
  {
    id: "inv-002", number: "INV-1002", clientId: "cl-002", clientName: "Marcus Rivera", clientEmail: "marcus@riveraphotography.com",
    items: [
      { description: "Portfolio website — gallery with lightbox", quantity: 1, rate: 1500, amount: 1500 },
      { description: "Contact form integration", quantity: 1, rate: 200, amount: 200 },
      { description: "Mobile responsive optimization", quantity: 1, rate: 300, amount: 300 },
    ],
    subtotal: 2000, tax: 180, total: 2180, status: "paid", issuedAt: "2026-02-25", dueAt: "2026-03-11", paidAt: "2026-03-09",
  },
  {
    id: "inv-003", number: "INV-1003", clientId: "cl-004", clientName: "David Okonkwo", clientEmail: "david@oaklegal.com",
    items: [
      { description: "Law firm website — 8 pages with case study section", quantity: 1, rate: 3200, amount: 3200 },
      { description: "Client portal with document uploads", quantity: 1, rate: 1800, amount: 1800 },
      { description: "SSL certificate & security hardening", quantity: 1, rate: 400, amount: 400 },
    ],
    subtotal: 5400, tax: 486, total: 5886, status: "sent", issuedAt: "2026-03-10", dueAt: "2026-03-24",
  },
  {
    id: "inv-004", number: "INV-1004", clientId: "cl-003", clientName: "Priya Patel", clientEmail: "priya@zenithfitness.io",
    items: [
      { description: "Fitness studio landing page", quantity: 1, rate: 900, amount: 900 },
      { description: "Class booking integration", quantity: 1, rate: 600, amount: 600 },
    ],
    subtotal: 1500, tax: 135, total: 1635, status: "overdue", issuedAt: "2026-02-15", dueAt: "2026-03-01",
    notes: "Payment overdue — please remit at your earliest convenience.",
  },
  {
    id: "inv-005", number: "INV-1005", clientId: "cl-005", clientName: "Emma Larsson", clientEmail: "emma@nordicdesigns.se",
    items: [
      { description: "E-commerce storefront — 40 products", quantity: 1, rate: 2800, amount: 2800 },
      { description: "Stripe payment integration", quantity: 1, rate: 500, amount: 500 },
      { description: "Inventory management system", quantity: 1, rate: 700, amount: 700 },
    ],
    subtotal: 4000, tax: 360, total: 4360, status: "paid", issuedAt: "2026-02-10", dueAt: "2026-02-24", paidAt: "2026-02-22",
  },
  {
    id: "inv-006", number: "INV-1006", clientId: "cl-002", clientName: "Marcus Rivera", clientEmail: "marcus@riveraphotography.com",
    items: [
      { description: "Monthly website maintenance", quantity: 1, rate: 300, amount: 300 },
      { description: "Content updates — March batch", quantity: 4, rate: 75, amount: 300 },
    ],
    subtotal: 600, tax: 54, total: 654, status: "sent", issuedAt: "2026-03-15", dueAt: "2026-03-29",
  },
  {
    id: "inv-007", number: "INV-1007", clientId: "cl-006", clientName: "Alex Kim", clientEmail: "alex@startupgrind.co",
    items: [
      { description: "SaaS landing page with waitlist", quantity: 1, rate: 1200, amount: 1200 },
      { description: "A/B testing setup (2 variants)", quantity: 1, rate: 400, amount: 400 },
    ],
    subtotal: 1600, tax: 144, total: 1744, status: "draft", issuedAt: "2026-03-20", dueAt: "2026-04-03",
  },
  {
    id: "inv-008", number: "INV-1008", clientId: "cl-004", clientName: "David Okonkwo", clientEmail: "david@oaklegal.com",
    items: [
      { description: "Blog setup with CMS", quantity: 1, rate: 800, amount: 800 },
      { description: "10 initial blog posts (AI-generated)", quantity: 10, rate: 50, amount: 500 },
    ],
    subtotal: 1300, tax: 117, total: 1417, status: "paid", issuedAt: "2026-01-20", dueAt: "2026-02-03", paidAt: "2026-02-01",
  },
  {
    id: "inv-009", number: "INV-1009", clientId: "cl-005", clientName: "Emma Larsson", clientEmail: "emma@nordicdesigns.se",
    items: [
      { description: "Multi-language support (EN, SE, DE)", quantity: 3, rate: 400, amount: 1200 },
    ],
    subtotal: 1200, tax: 108, total: 1308, status: "overdue", issuedAt: "2026-02-20", dueAt: "2026-03-06",
  },
  {
    id: "inv-010", number: "INV-1010", clientId: "cl-001", clientName: "Sarah Chen", clientEmail: "sarah@bloomcafe.com",
    items: [
      { description: "Online ordering system integration", quantity: 1, rate: 1400, amount: 1400 },
      { description: "Menu page with dietary filters", quantity: 1, rate: 600, amount: 600 },
    ],
    subtotal: 2000, tax: 180, total: 2180, status: "sent", issuedAt: "2026-03-18", dueAt: "2026-04-01",
  },
];

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "prop-001", clientId: "cl-004", clientName: "David Okonkwo", title: "Oak & Associates — Full Digital Presence Overhaul",
    summary: "A comprehensive redesign of your law firm's digital presence including a new 12-page website, client portal, blog, and SEO strategy to position Oak & Associates as the premier legal practice in the region.",
    scope: [
      "Full website redesign with modern legal-focused UI",
      "Client portal with secure document exchange",
      "Blog engine with AI-assisted content creation",
      "Local SEO campaign targeting 15 practice-area keywords",
      "Monthly analytics reporting for 6 months",
    ],
    timeline: "4 weeks — Phase 1 (website) in 2 weeks, Phase 2 (portal + blog) in 2 weeks",
    deliverables: ["12-page responsive website", "Secure client portal", "Blog with 20 initial posts", "SEO setup + 6-month reporting", "Training documentation"],
    pricing: [
      { description: "Website redesign — 12 pages", quantity: 1, rate: 4800, amount: 4800 },
      { description: "Client portal development", quantity: 1, rate: 2200, amount: 2200 },
      { description: "Blog engine + 20 AI posts", quantity: 1, rate: 1600, amount: 1600 },
      { description: "SEO campaign (6 months)", quantity: 6, rate: 500, amount: 3000 },
    ],
    total: 11600, status: "sent", createdAt: "2026-03-14",
  },
  {
    id: "prop-002", clientId: "cl-006", clientName: "Alex Kim", title: "StartupGrind — MVP Website + Launch Strategy",
    summary: "Build a conversion-optimized SaaS landing page with waitlist, integrate analytics, and create a 30-day launch campaign including email sequences and social media assets.",
    scope: [
      "SaaS landing page with animated hero and social proof",
      "Waitlist with email capture and drip sequence",
      "A/B testing for 3 hero variants",
      "Social media launch kit (10 posts across platforms)",
    ],
    timeline: "2 weeks — Landing page in week 1, launch assets in week 2",
    deliverables: ["Landing page with 3 A/B variants", "Email drip sequence (5 emails)", "Social media kit (10 posts)", "Analytics dashboard"],
    pricing: [
      { description: "SaaS landing page with animations", quantity: 1, rate: 1200, amount: 1200 },
      { description: "A/B testing setup", quantity: 1, rate: 400, amount: 400 },
      { description: "Email drip sequence (5 emails)", quantity: 1, rate: 500, amount: 500 },
      { description: "Social media launch kit", quantity: 1, rate: 600, amount: 600 },
    ],
    total: 2700, status: "accepted", createdAt: "2026-03-08",
  },
  {
    id: "prop-003", clientId: "cl-003", clientName: "Priya Patel", title: "Zenith Fitness — Digital Transformation Package",
    summary: "Transform Zenith Fitness's online presence with a booking-enabled website, member portal, and automated marketing to fill classes and retain members.",
    scope: [
      "Fitness studio website with class schedule",
      "Online booking and payment system",
      "Member portal with workout tracking",
      "Automated email marketing (class reminders, promotions)",
    ],
    timeline: "3 weeks",
    deliverables: ["6-page website", "Booking system", "Member portal", "Email automation (8 templates)"],
    pricing: [
      { description: "Fitness website — 6 pages", quantity: 1, rate: 1800, amount: 1800 },
      { description: "Booking system integration", quantity: 1, rate: 1200, amount: 1200 },
      { description: "Member portal", quantity: 1, rate: 900, amount: 900 },
      { description: "Email automation setup", quantity: 1, rate: 600, amount: 600 },
    ],
    total: 4500, status: "draft", createdAt: "2026-03-19",
  },
];

const MOCK_RECURRING: RecurringInvoice[] = [
  { id: "rec-001", clientId: "cl-002", clientName: "Marcus Rivera", description: "Monthly website maintenance & content updates", amount: 500, frequency: "monthly", nextDate: "2026-04-01", active: true },
  { id: "rec-002", clientId: "cl-004", clientName: "David Okonkwo", description: "Monthly SEO reporting & optimization", amount: 500, frequency: "monthly", nextDate: "2026-04-01", active: true },
  { id: "rec-003", clientId: "cl-005", clientName: "Emma Larsson", description: "Quarterly e-commerce performance audit", amount: 1200, frequency: "quarterly", nextDate: "2026-06-01", active: true },
];

const MOCK_PAYMENTS: PaymentEvent[] = [
  { id: "pay-001", invoiceNumber: "INV-1001", clientName: "Sarah Chen", amount: 2398, paidAt: "2026-03-04T14:22:00Z", method: "Stripe" },
  { id: "pay-002", invoiceNumber: "INV-1002", clientName: "Marcus Rivera", amount: 2180, paidAt: "2026-03-09T10:15:00Z", method: "Stripe" },
  { id: "pay-003", invoiceNumber: "INV-1005", clientName: "Emma Larsson", amount: 4360, paidAt: "2026-02-22T16:45:00Z", method: "Bank Transfer" },
  { id: "pay-004", invoiceNumber: "INV-1008", clientName: "David Okonkwo", amount: 1417, paidAt: "2026-02-01T09:30:00Z", method: "Stripe" },
];

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* quota exceeded — silently ignore */ }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getInvoices(): Invoice[] {
  return loadFromStorage<Invoice[]>(STORAGE_KEYS.invoices, MOCK_INVOICES);
}

export function saveInvoices(invoices: Invoice[]): void {
  saveToStorage(STORAGE_KEYS.invoices, invoices);
}

export function createInvoice(partial: Partial<Invoice>): Invoice {
  const invoices = getInvoices();
  const number = generateInvoiceNumber();
  const invoice: Invoice = {
    id: `inv-${Date.now()}`,
    number,
    clientId: partial.clientId || "",
    clientName: partial.clientName || "",
    clientEmail: partial.clientEmail || "",
    items: partial.items || [],
    subtotal: partial.subtotal || 0,
    tax: partial.tax || 0,
    total: partial.total || 0,
    status: partial.status || "draft",
    issuedAt: partial.issuedAt || new Date().toISOString().slice(0, 10),
    dueAt: partial.dueAt || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    paidAt: partial.paidAt,
    notes: partial.notes,
  };
  invoices.unshift(invoice);
  saveInvoices(invoices);
  return invoice;
}

export function updateInvoiceStatus(id: string, status: Invoice["status"]): Invoice | null {
  const invoices = getInvoices();
  const idx = invoices.findIndex((inv) => inv.id === id);
  if (idx === -1) return null;
  invoices[idx].status = status;
  if (status === "paid") invoices[idx].paidAt = new Date().toISOString().slice(0, 10);
  saveInvoices(invoices);
  return invoices[idx];
}

export function getClients(): Client[] {
  return loadFromStorage<Client[]>(STORAGE_KEYS.clients, MOCK_CLIENTS);
}

export function saveClients(clients: Client[]): void {
  saveToStorage(STORAGE_KEYS.clients, clients);
}

export function addClient(client: Omit<Client, "id" | "totalBilled" | "invoiceCount" | "lastActivity">): Client {
  const clients = getClients();
  const newClient: Client = {
    ...client,
    id: `cl-${Date.now()}`,
    totalBilled: 0,
    invoiceCount: 0,
    lastActivity: new Date().toISOString().slice(0, 10),
  };
  clients.unshift(newClient);
  saveClients(clients);
  return newClient;
}

export function getInvoiceStats(): InvoiceStats {
  const invoices = getInvoices();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

  const outstanding = invoices
    .filter((inv) => inv.status === "sent")
    .reduce((sum, inv) => sum + inv.total, 0);

  const paidThisMonth = invoices
    .filter((inv) => inv.status === "paid" && inv.paidAt && inv.paidAt >= monthStart)
    .reduce((sum, inv) => sum + inv.total, 0);

  const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");
  const overdue = overdueInvoices.reduce((sum, inv) => sum + inv.total, 0);

  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0);

  return { outstanding, paidThisMonth, overdue, overdueCount: overdueInvoices.length, totalRevenue };
}

export function generateInvoiceNumber(): string {
  if (typeof window === "undefined") return "INV-1001";
  const counter = parseInt(localStorage.getItem(STORAGE_KEYS.counter) || "1010", 10) + 1;
  localStorage.setItem(STORAGE_KEYS.counter, String(counter));
  return `INV-${counter}`;
}

export function getProposals(): Proposal[] {
  return loadFromStorage<Proposal[]>(STORAGE_KEYS.proposals, MOCK_PROPOSALS);
}

export function saveProposals(proposals: Proposal[]): void {
  saveToStorage(STORAGE_KEYS.proposals, proposals);
}

export function createProposal(partial: Partial<Proposal>): Proposal {
  const proposals = getProposals();
  const proposal: Proposal = {
    id: `prop-${Date.now()}`,
    clientId: partial.clientId || "",
    clientName: partial.clientName || "",
    title: partial.title || "Untitled Proposal",
    summary: partial.summary || "",
    scope: partial.scope || [],
    timeline: partial.timeline || "",
    deliverables: partial.deliverables || [],
    pricing: partial.pricing || [],
    total: partial.total || 0,
    status: partial.status || "draft",
    createdAt: partial.createdAt || new Date().toISOString().slice(0, 10),
  };
  proposals.unshift(proposal);
  saveProposals(proposals);
  return proposal;
}

export function getRecurringInvoices(): RecurringInvoice[] {
  return loadFromStorage<RecurringInvoice[]>(STORAGE_KEYS.recurring, MOCK_RECURRING);
}

export function getPaymentEvents(): PaymentEvent[] {
  return loadFromStorage<PaymentEvent[]>(STORAGE_KEYS.payments, MOCK_PAYMENTS);
}

export function formatCurrency(cents: number): string {
  return `$${(cents).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
