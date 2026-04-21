// PDF Generator — invoice + arbitrary HTML rendering.
//
// Strategy: we render premium HTML (Bible Law 5: $100K agency quality) and
// then convert via Cloudflare Browser Rendering API when the token is set.
// In the absence of a renderer token we fall back to returning the HTML
// buffer with X-PDF-Mode: html-fallback so the caller can still display or
// print it. Production should set CLOUDFLARE_BROWSER_RENDERING_TOKEN and
// CLOUDFLARE_ACCOUNT_ID, or alternatively pipe through Puppeteer.

export interface InvoiceParty {
  name: string;
  email: string;
  address: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  number: string;
  issueDate: string;
  dueDate: string;
  from: InvoiceParty;
  to: InvoiceParty;
  items: InvoiceLineItem[];
  subtotal: number;
  tax?: number;
  total: number;
  currency: string;
  notes?: string;
}

export interface PdfRenderResult {
  buffer: Buffer;
  contentType: "application/pdf" | "text/html";
  mode: "pdf" | "html-fallback";
}

const FOUR_DOMAIN_SIGNATURE =
  "zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot; zoobicon.sh";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function renderInvoiceHTML(invoice: Invoice): string {
  const currency = invoice.currency || "USD";
  const itemsRows = invoice.items
    .map(
      (item) => `
        <tr>
          <td class="desc">${escapeHtml(item.description)}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${formatMoney(item.unitPrice, currency)}</td>
          <td class="num">${formatMoney(item.total, currency)}</td>
        </tr>`,
    )
    .join("");

  const taxRow =
    typeof invoice.tax === "number"
      ? `<tr><td>Tax</td><td class="num">${formatMoney(invoice.tax, currency)}</td></tr>`
      : "";

  const notesBlock = invoice.notes
    ? `<div class="notes"><h3>Notes</h3><p>${escapeHtml(invoice.notes)}</p></div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Invoice ${escapeHtml(invoice.number)}</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #f5f5f7; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { max-width: 820px; margin: 32px auto; padding: 56px; background: #ffffff; box-shadow: 0 30px 80px -20px rgba(15,23,42,.25); border-radius: 20px; position: relative; overflow: hidden; }
  .page::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 8px; background: linear-gradient(90deg,#6366f1,#8b5cf6,#ec4899,#f59e0b); }
  .brand { display: flex; align-items: center; justify-content: space-between; margin-bottom: 48px; }
  .logo { display: flex; align-items: center; gap: 14px; }
  .logo-mark { width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg,#6366f1,#ec4899); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 22px; letter-spacing: -0.5px; box-shadow: 0 10px 30px -10px rgba(99,102,241,.55); }
  .logo-text { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 36px; font-weight: 800; letter-spacing: -1.2px; margin: 0; background: linear-gradient(90deg,#0f172a,#6366f1); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .doc-title .meta { margin-top: 6px; color: #64748b; font-size: 13px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 40px; }
  .party { padding: 20px; border: 1px solid #e2e8f0; border-radius: 14px; background: #fafbff; }
  .party h3 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1.4px; color: #6366f1; font-weight: 700; }
  .party .name { font-weight: 700; font-size: 15px; }
  .party .line { color: #475569; font-size: 13px; line-height: 1.55; white-space: pre-line; }
  table.items { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 28px; }
  table.items thead th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; padding: 12px 14px; background: #f1f5f9; }
  table.items thead th:first-child { border-top-left-radius: 10px; }
  table.items thead th:last-child { border-top-right-radius: 10px; text-align: right; }
  table.items thead th.num { text-align: right; }
  table.items tbody td { padding: 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
  table.items tbody td.num { text-align: right; font-variant-numeric: tabular-nums; }
  table.items tbody td.desc { font-weight: 500; color: #0f172a; }
  .summary { display: flex; justify-content: flex-end; margin-bottom: 36px; }
  .summary table { min-width: 280px; }
  .summary td { padding: 8px 0; font-size: 14px; color: #475569; }
  .summary td.num { text-align: right; font-variant-numeric: tabular-nums; color: #0f172a; }
  .summary tr.total td { padding-top: 16px; border-top: 2px solid #0f172a; font-size: 18px; font-weight: 800; color: #0f172a; }
  .pay { padding: 20px 24px; border-radius: 14px; background: linear-gradient(135deg,#eef2ff,#fdf2f8); border: 1px solid #e0e7ff; margin-bottom: 28px; }
  .pay h3 { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1.2px; color: #6366f1; font-weight: 700; }
  .pay p { margin: 0; font-size: 13px; color: #334155; line-height: 1.6; }
  .notes { padding: 18px 22px; border-radius: 12px; background: #f8fafc; border: 1px solid #e2e8f0; margin-bottom: 28px; }
  .notes h3 { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1.2px; color: #64748b; font-weight: 700; }
  .notes p { margin: 0; font-size: 13px; color: #334155; line-height: 1.6; }
  footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; letter-spacing: 0.4px; }
  footer .sig { font-weight: 600; color: #334155; margin-bottom: 4px; }
</style>
</head>
<body>
  <div class="page">
    <div class="brand">
      <div class="logo">
        <div class="logo-mark">Z</div>
        <div class="logo-text">Zoobicon</div>
      </div>
      <div class="doc-title">
        <h1>INVOICE</h1>
        <div class="meta">No. <strong>${escapeHtml(invoice.number)}</strong></div>
        <div class="meta">Issued ${escapeHtml(invoice.issueDate)} &middot; Due ${escapeHtml(invoice.dueDate)}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h3>From</h3>
        <div class="name">${escapeHtml(invoice.from.name)}</div>
        <div class="line">${escapeHtml(invoice.from.email)}</div>
        <div class="line">${escapeHtml(invoice.from.address)}</div>
      </div>
      <div class="party">
        <h3>Billed To</h3>
        <div class="name">${escapeHtml(invoice.to.name)}</div>
        <div class="line">${escapeHtml(invoice.to.email)}</div>
        <div class="line">${escapeHtml(invoice.to.address)}</div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="num">Qty</th>
          <th class="num">Unit Price</th>
          <th class="num">Amount</th>
        </tr>
      </thead>
      <tbody>${itemsRows}</tbody>
    </table>

    <div class="summary">
      <table>
        <tr><td>Subtotal</td><td class="num">${formatMoney(invoice.subtotal, currency)}</td></tr>
        ${taxRow}
        <tr class="total"><td>Total</td><td class="num">${formatMoney(invoice.total, currency)}</td></tr>
      </table>
    </div>

    <div class="pay">
      <h3>Payment Instructions</h3>
      <p>Please remit payment by <strong>${escapeHtml(invoice.dueDate)}</strong>. Pay online via your Zoobicon account billing portal, or contact <strong>${escapeHtml(invoice.from.email)}</strong> for wire details. Reference invoice <strong>${escapeHtml(invoice.number)}</strong> on all payments.</p>
    </div>

    ${notesBlock}

    <footer>
      <div class="sig">Thank you for choosing Zoobicon</div>
      <div>${FOUR_DOMAIN_SIGNATURE}</div>
    </footer>
  </div>
</body>
</html>`;
}

interface CloudflareRenderResponse {
  success?: boolean;
  result?: string;
  errors?: Array<{ message: string }>;
}

export async function htmlToPdfBuffer(html: string): Promise<PdfRenderResult> {
  const token = process.env.CLOUDFLARE_BROWSER_RENDERING_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (token && accountId) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/pdf`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ html }),
        },
      );

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/pdf")) {
          const arrayBuffer = await response.arrayBuffer();
          return {
            buffer: Buffer.from(arrayBuffer),
            contentType: "application/pdf",
            mode: "pdf",
          };
        }
        // Some Cloudflare endpoints wrap in JSON with base64.
        const json = (await response.json()) as CloudflareRenderResponse;
        if (json.success && typeof json.result === "string") {
          return {
            buffer: Buffer.from(json.result, "base64"),
            contentType: "application/pdf",
            mode: "pdf",
          };
        }
      }
      console.warn(
        "[pdf-generator] Cloudflare Browser Rendering returned non-OK; falling back to HTML.",
      );
    } catch (err) {
      console.warn(
        "[pdf-generator] Cloudflare Browser Rendering threw; falling back to HTML.",
        err,
      );
    }
  }

  return {
    buffer: Buffer.from(html, "utf8"),
    contentType: "text/html",
    mode: "html-fallback",
  };
}

export async function renderInvoicePdf(invoice: Invoice): Promise<PdfRenderResult> {
  const html = renderInvoiceHTML(invoice);
  return htmlToPdfBuffer(html);
}
