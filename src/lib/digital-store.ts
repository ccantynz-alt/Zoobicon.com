/* ---------- Digital Product Store — localStorage MVP ---------- */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "download" | "template" | "course" | "license";
  status: "active" | "draft";
  sales: number;
  revenue: number;
  createdAt: string;
  thumbnail?: string;
}

export interface Order {
  id: string;
  customerEmail: string;
  productId: string;
  productName: string;
  amount: number;
  status: "completed" | "pending" | "refunded";
  createdAt: string;
}

export interface DiscountCode {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  uses: number;
  maxUses?: number;
  expiresAt?: string;
}

export interface StoreStats {
  revenue: number;
  products: number;
  sales: number;
  monthRevenue: number;
}

/* ---------- Keys ---------- */
const PRODUCTS_KEY = "zoobicon_store_products";
const ORDERS_KEY = "zoobicon_store_orders";
const DISCOUNTS_KEY = "zoobicon_store_discounts";

/* ---------- Mock products ---------- */
const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_001",
    name: "Website Template Pack",
    description: "12 premium, responsive website templates for SaaS, portfolios, and landing pages. Fully customizable with clean code.",
    price: 29,
    type: "template",
    status: "active",
    sales: 187,
    revenue: 5423,
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "prod_002",
    name: "SEO Checklist PDF",
    description: "The ultimate 47-point SEO checklist. Covers technical SEO, on-page optimization, link building, and local SEO.",
    price: 9,
    type: "download",
    status: "active",
    sales: 412,
    revenue: 3708,
    createdAt: "2026-01-22T14:30:00Z",
  },
  {
    id: "prod_003",
    name: "React Component Library",
    description: "50+ production-ready React components with TypeScript, Tailwind CSS, and full accessibility support.",
    price: 49,
    type: "download",
    status: "active",
    sales: 93,
    revenue: 4557,
    createdAt: "2026-02-03T09:15:00Z",
  },
  {
    id: "prod_004",
    name: "Business Starter Kit",
    description: "Everything you need to launch: business plan template, financial projections spreadsheet, brand guidelines, and pitch deck.",
    price: 19,
    type: "download",
    status: "active",
    sales: 256,
    revenue: 4864,
    createdAt: "2026-02-10T11:00:00Z",
  },
  {
    id: "prod_005",
    name: "Social Media Templates",
    description: "200+ editable social media templates for Instagram, TikTok, LinkedIn, and Twitter. Figma + Canva formats.",
    price: 15,
    type: "template",
    status: "active",
    sales: 334,
    revenue: 5010,
    createdAt: "2026-02-18T16:45:00Z",
  },
  {
    id: "prod_006",
    name: "Email Marketing Guide",
    description: "Free comprehensive guide to email marketing. Covers list building, automation, copywriting, and deliverability.",
    price: 0,
    type: "download",
    status: "active",
    sales: 1283,
    revenue: 0,
    createdAt: "2026-02-25T08:00:00Z",
  },
  {
    id: "prod_007",
    name: "Complete Agency Toolkit",
    description: "Client proposal templates, contract generator, project tracker, invoice system, and brand questionnaire. Built for agencies.",
    price: 79,
    type: "download",
    status: "active",
    sales: 64,
    revenue: 5056,
    createdAt: "2026-03-01T13:20:00Z",
  },
  {
    id: "prod_008",
    name: "Notion Dashboard Templates",
    description: "10 Notion templates: CRM, project management, content calendar, habit tracker, finance dashboard, and more.",
    price: 12,
    type: "template",
    status: "draft",
    sales: 0,
    revenue: 0,
    createdAt: "2026-03-18T10:00:00Z",
  },
];

/* ---------- Mock orders ---------- */
const MOCK_ORDERS: Order[] = [
  { id: "ord_1001", customerEmail: "sarah@designstudio.co", productId: "prod_001", productName: "Website Template Pack", amount: 29, status: "completed", createdAt: "2026-03-22T09:14:00Z" },
  { id: "ord_1002", customerEmail: "james.k@gmail.com", productId: "prod_002", productName: "SEO Checklist PDF", amount: 9, status: "completed", createdAt: "2026-03-22T08:47:00Z" },
  { id: "ord_1003", customerEmail: "tech@startupxyz.io", productId: "prod_003", productName: "React Component Library", amount: 49, status: "completed", createdAt: "2026-03-21T22:33:00Z" },
  { id: "ord_1004", customerEmail: "maria.r@outlook.com", productId: "prod_005", productName: "Social Media Templates", amount: 15, status: "pending", createdAt: "2026-03-21T19:05:00Z" },
  { id: "ord_1005", customerEmail: "dev@agency360.com", productId: "prod_007", productName: "Complete Agency Toolkit", amount: 79, status: "completed", createdAt: "2026-03-21T16:12:00Z" },
  { id: "ord_1006", customerEmail: "nina.w@freelance.io", productId: "prod_004", productName: "Business Starter Kit", amount: 19, status: "completed", createdAt: "2026-03-21T14:28:00Z" },
  { id: "ord_1007", customerEmail: "alex@buildfast.dev", productId: "prod_001", productName: "Website Template Pack", amount: 29, status: "refunded", createdAt: "2026-03-21T11:55:00Z" },
  { id: "ord_1008", customerEmail: "lisa.chen@company.co", productId: "prod_002", productName: "SEO Checklist PDF", amount: 9, status: "completed", createdAt: "2026-03-20T20:40:00Z" },
  { id: "ord_1009", customerEmail: "founder@newventure.ai", productId: "prod_004", productName: "Business Starter Kit", amount: 19, status: "completed", createdAt: "2026-03-20T15:17:00Z" },
  { id: "ord_1010", customerEmail: "mark.j@creativelab.co", productId: "prod_005", productName: "Social Media Templates", amount: 15, status: "completed", createdAt: "2026-03-20T10:02:00Z" },
];

/* ---------- Mock discount codes ---------- */
const MOCK_DISCOUNTS: DiscountCode[] = [
  { code: "SAVE10", type: "percentage", value: 10, uses: 23, maxUses: 100 },
  { code: "LAUNCH20", type: "percentage", value: 20, uses: 8, maxUses: 50, expiresAt: "2026-04-01T00:00:00Z" },
  { code: "WELCOME5", type: "fixed", value: 5, uses: 47 },
];

/* ---------- localStorage helpers ---------- */
function readStorage<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
    }
  } catch { /* ignore */ }
  return fallback;
}

function writeStorage<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch { /* ignore */ }
}

/* ---------- Public API ---------- */

export function getProducts(): Product[] {
  return readStorage<Product>(PRODUCTS_KEY, MOCK_PRODUCTS);
}

export function addProduct(
  product: Omit<Product, "id" | "sales" | "revenue" | "createdAt">
): Product {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: `prod_${Date.now().toString(36)}`,
    sales: 0,
    revenue: 0,
    createdAt: new Date().toISOString(),
  };
  products.unshift(newProduct);
  writeStorage(PRODUCTS_KEY, products);
  return newProduct;
}

export function updateProduct(id: string, updates: Partial<Product>): void {
  const products = getProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx !== -1) {
    products[idx] = { ...products[idx], ...updates };
    writeStorage(PRODUCTS_KEY, products);
  }
}

export function deleteProduct(id: string): void {
  const products = getProducts().filter((p) => p.id !== id);
  writeStorage(PRODUCTS_KEY, products);
}

export function getOrders(): Order[] {
  return readStorage<Order>(ORDERS_KEY, MOCK_ORDERS);
}

export function getStoreStats(): StoreStats {
  const products = getProducts();
  const orders = getOrders();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const totalSales = products.reduce((sum, p) => sum + p.sales, 0);
  const monthOrders = orders.filter(
    (o) => o.status === "completed" && new Date(o.createdAt) >= monthStart
  );
  const monthRevenue = monthOrders.reduce((sum, o) => sum + o.amount, 0);

  return {
    revenue: totalRevenue,
    products: products.filter((p) => p.status === "active").length,
    sales: totalSales,
    monthRevenue,
  };
}

export function getDiscountCodes(): DiscountCode[] {
  return readStorage<DiscountCode>(DISCOUNTS_KEY, MOCK_DISCOUNTS);
}

export function createDiscountCode(code: DiscountCode): void {
  const codes = getDiscountCodes();
  codes.unshift(code);
  writeStorage(DISCOUNTS_KEY, codes);
}

export function getStorefrontUrl(username: string): string {
  return `https://zoobicon.sh/${username}/store`;
}

export function formatCurrency(amount: number): string {
  if (amount === 0) return "Free";
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
