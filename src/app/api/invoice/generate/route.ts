import { NextRequest, NextResponse } from "next/server";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
}

interface InvoiceParty {
  name: string;
  email: string;
  address: string;
}

interface InvoiceRequest {
  from: InvoiceParty;
  to: InvoiceParty;
  items: InvoiceItem[];
  invoiceNumber: string;
  dueDate: string;
  notes?: string;
  tax?: number;
}

function generateInvoiceHTML(data: InvoiceRequest): {
  html: string;
  total: number;
} {
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
  const taxRate = data.tax ?? 0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const itemRows = data.items
    .map(
      (item, index) => `
      <tr class="${index % 2 === 0 ? "row-even" : "row-odd"}">
        <td class="item-desc">${escapeHtml(item.description)}</td>
        <td class="item-qty">${item.quantity}</td>
        <td class="item-rate">${formatCurrency(item.rate)}</td>
        <td class="item-amount">${formatCurrency(item.quantity * item.rate)}</td>
      </tr>`
    )
    .join("");

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dueDateFormatted = new Date(data.dueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f2148;
      background: #f0f0f5;
      padding: 40px 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .invoice-header {
      background: linear-gradient(135deg, #0f2148 0%, #16213e 100%);
      color: #ffffff;
      padding: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .invoice-title {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .invoice-title-sub {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      margin-top: 4px;
    }

    .invoice-meta {
      text-align: right;
    }

    .invoice-meta-item {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 4px;
    }

    .invoice-meta-value {
      color: #ffffff;
      font-weight: 600;
    }

    .invoice-number-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 8px;
    }

    .invoice-body {
      padding: 40px;
    }

    .parties {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
      gap: 40px;
    }

    .party {
      flex: 1;
    }

    .party-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #8888aa;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .party-name {
      font-size: 18px;
      font-weight: 700;
      color: #0f2148;
      margin-bottom: 6px;
    }

    .party-detail {
      font-size: 13px;
      color: #555577;
      line-height: 1.6;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    .items-table thead th {
      background: #f8f8fc;
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #8888aa;
      font-weight: 600;
      border-bottom: 2px solid #e8e8f0;
    }

    .items-table thead th:last-child,
    .items-table thead th:nth-child(2),
    .items-table thead th:nth-child(3) {
      text-align: right;
    }

    .items-table td {
      padding: 14px 16px;
      font-size: 14px;
      border-bottom: 1px solid #f0f0f5;
    }

    .item-desc {
      font-weight: 500;
      color: #0f2148;
    }

    .item-qty,
    .item-rate,
    .item-amount {
      text-align: right;
      color: #555577;
    }

    .item-amount {
      font-weight: 600;
      color: #0f2148;
    }

    .row-even {
      background: #ffffff;
    }

    .row-odd {
      background: #fafaff;
    }

    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }

    .totals-box {
      width: 280px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: #555577;
    }

    .totals-row.total {
      border-top: 2px solid #0f2148;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: 700;
      color: #0f2148;
    }

    .notes-section {
      background: #f8f8fc;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }

    .notes-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #8888aa;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .notes-text {
      font-size: 13px;
      color: #555577;
      line-height: 1.6;
    }

    .invoice-footer {
      text-align: center;
      padding: 24px 40px;
      background: #f8f8fc;
      border-top: 1px solid #e8e8f0;
      font-size: 12px;
      color: #8888aa;
    }

    .status-badge {
      display: inline-block;
      background: #e8f5e9;
      color: #2e7d32;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .print-btn {
      display: block;
      max-width: 800px;
      margin: 20px auto;
      padding: 12px 24px;
      background: #0f2148;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .print-btn:hover {
      background: #16213e;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }

      .invoice-container {
        box-shadow: none;
        border-radius: 0;
      }

      .print-btn {
        display: none;
      }
    }

    @media (max-width: 600px) {
      .invoice-header {
        flex-direction: column;
        gap: 20px;
      }

      .invoice-meta {
        text-align: left;
      }

      .parties {
        flex-direction: column;
        gap: 24px;
      }

      .invoice-body {
        padding: 24px;
      }

      .items-table {
        font-size: 12px;
      }

      .items-table td,
      .items-table th {
        padding: 10px 8px;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="invoice-header">
      <div>
        <div class="invoice-title">INVOICE</div>
        <div class="invoice-title-sub">${escapeHtml(data.from.name)}</div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-meta-item">
          Invoice Number: <span class="invoice-meta-value">${escapeHtml(data.invoiceNumber)}</span>
        </div>
        <div class="invoice-meta-item">
          Date: <span class="invoice-meta-value">${today}</span>
        </div>
        <div class="invoice-meta-item">
          Due Date: <span class="invoice-meta-value">${dueDateFormatted}</span>
        </div>
        <div class="invoice-number-badge">${escapeHtml(data.invoiceNumber)}</div>
      </div>
    </div>

    <div class="invoice-body">
      <div class="parties">
        <div class="party">
          <div class="party-label">From</div>
          <div class="party-name">${escapeHtml(data.from.name)}</div>
          <div class="party-detail">${escapeHtml(data.from.email)}</div>
          <div class="party-detail">${escapeHtml(data.from.address).replace(/\n/g, "<br>")}</div>
        </div>
        <div class="party">
          <div class="party-label">Bill To</div>
          <div class="party-name">${escapeHtml(data.to.name)}</div>
          <div class="party-detail">${escapeHtml(data.to.email)}</div>
          <div class="party-detail">${escapeHtml(data.to.address).replace(/\n/g, "<br>")}</div>
        </div>
      </div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-box">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${formatCurrency(subtotal)}</span>
          </div>
          ${
            taxRate > 0
              ? `<div class="totals-row">
            <span>Tax (${taxRate}%)</span>
            <span>${formatCurrency(taxAmount)}</span>
          </div>`
              : ""
          }
          <div class="totals-row total">
            <span>Total</span>
            <span>${formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      ${
        data.notes
          ? `<div class="notes-section">
        <div class="notes-label">Notes</div>
        <div class="notes-text">${escapeHtml(data.notes).replace(/\n/g, "<br>")}</div>
      </div>`
          : ""
      }
    </div>

    <div class="invoice-footer">
      Thank you for your business. Payment is due by ${dueDateFormatted}.
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
</body>
</html>`;

  return { html, total };
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { from, to, items, invoiceNumber, dueDate, notes, tax } =
      body as InvoiceRequest;

    // Validate required fields
    if (!from || !from.name || !from.email || !from.address) {
      return NextResponse.json(
        { error: "Sender (from) details are required: name, email, address" },
        { status: 400 }
      );
    }

    if (!to || !to.name || !to.email || !to.address) {
      return NextResponse.json(
        {
          error: "Recipient (to) details are required: name, email, address",
        },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one invoice item is required" },
        { status: 400 }
      );
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.description || typeof item.description !== "string") {
        return NextResponse.json(
          { error: `Item ${i + 1}: description is required` },
          { status: 400 }
        );
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return NextResponse.json(
          { error: `Item ${i + 1}: quantity must be a positive number` },
          { status: 400 }
        );
      }
      if (typeof item.rate !== "number" || item.rate < 0) {
        return NextResponse.json(
          { error: `Item ${i + 1}: rate must be a non-negative number` },
          { status: 400 }
        );
      }
    }

    if (!invoiceNumber || typeof invoiceNumber !== "string") {
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      );
    }

    if (!dueDate || typeof dueDate !== "string") {
      return NextResponse.json(
        { error: "Due date is required" },
        { status: 400 }
      );
    }

    if (tax !== undefined && (typeof tax !== "number" || tax < 0)) {
      return NextResponse.json(
        { error: "Tax must be a non-negative number (percentage)" },
        { status: 400 }
      );
    }

    const result = generateInvoiceHTML({
      from,
      to,
      items,
      invoiceNumber,
      dueDate,
      notes,
      tax,
    });

    return NextResponse.json({
      html: result.html,
      total: result.total,
    });
  } catch (err) {
    console.error("Invoice generation error:", err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
