"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Receipt,
  DollarSign,
  Calendar,
} from "lucide-react";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "NZD", symbol: "$", name: "New Zealand Dollar" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
  { code: "EUR", symbol: "\u20AC", name: "Euro" },
  { code: "GBP", symbol: "\u00A3", name: "British Pound" },
];

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const r = String(Math.floor(Math.random() * 9000) + 1000);
  return `INV-${y}${m}-${r}`;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function dueDateStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Zoobicon Free Invoice Generator",
      applicationCategory: "WebApplication",
      operatingSystem: "Any",
      url: "https://zoobicon.com/tools/invoice-generator",
      description: "Create professional invoices for free. Auto-calculated totals, tax support, multiple currencies, and PDF download. No signup required.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: { "@type": "Organization", name: "Zoobicon", url: "https://zoobicon.com" },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Is this invoice generator completely free?", acceptedAnswer: { "@type": "Answer", text: "Yes, 100% free with no signup, no watermarks, and no limits. Create and download as many invoices as you need." } },
        { "@type": "Question", name: "Can I download invoices as PDF?", acceptedAnswer: { "@type": "Answer", text: "Yes. Click 'Download PDF' and it opens your browser's print dialog pre-configured for PDF. The input form is automatically hidden so your PDF looks clean and professional." } },
        { "@type": "Question", name: "Does it calculate tax automatically?", acceptedAnswer: { "@type": "Answer", text: "Yes. Set your tax rate (default is 15% for NZ GST) and the generator automatically calculates subtotal, tax amount, and total for all line items." } },
        { "@type": "Question", name: "What currencies are supported?", acceptedAnswer: { "@type": "Answer", text: "USD, NZD, AUD, EUR, and GBP. Select your currency and all amounts are displayed with the correct symbol." } },
      ],
    },
  ],
};

export default function InvoiceGeneratorPage() {
  const [bizName, setBizName] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [bizEmail, setBizEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [invoiceNum, setInvoiceNum] = useState(generateInvoiceNumber);
  const [invoiceDate, setInvoiceDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(dueDateStr);
  const [currency, setCurrency] = useState("NZD");
  const [taxRate, setTaxRate] = useState(15);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0 },
  ]);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const currencyObj = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  }, [items]);

  const taxAmount = useMemo(() => subtotal * (taxRate / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const formatCurrency = (amount: number) => {
    return `${currencyObj.symbol}${amount.toFixed(2)}`;
  };

  const addItem = () => {
    setItems(prev => [...prev, { id: crypto.randomUUID(), description: "", quantity: 1, rate: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const faqs = [
    { q: "Is this invoice generator completely free?", a: "Yes, 100% free with no signup, no watermarks, and no limits. Create and download as many invoices as you need. Everything runs in your browser - we never see your data." },
    { q: "Can I download invoices as PDF?", a: "Yes. Click 'Download PDF' and your browser's print dialog opens pre-configured for PDF. The input form is automatically hidden so your PDF looks clean and professional." },
    { q: "Does it calculate tax automatically?", a: "Yes. Set your tax rate (default is 15% for NZ GST) and the generator automatically calculates subtotal, tax amount, and total for all line items. Change it to any rate you need." },
    { q: "What currencies are supported?", a: "USD, NZD, AUD, EUR, and GBP. Select your currency from the dropdown and all amounts display with the correct symbol throughout the invoice." },
  ];

  return (
    <div className="relative z-10 min-h-screen bg-[#0b1530] text-white pt-[72px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-invoice {
            background: white !important;
            color: #111 !important;
            padding: 40px !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .print-invoice * { color: #111 !important; }
          .print-invoice .inv-header { border-bottom: 2px solid #e5e7eb !important; }
          .print-invoice .inv-table th { background: #f3f4f6 !important; color: #374151 !important; }
          .print-invoice .inv-table td { border-bottom: 1px solid #e5e7eb !important; }
          .print-invoice .inv-totals { border-top: 2px solid #e5e7eb !important; }
          .print-invoice .inv-total-final { font-size: 20px !important; font-weight: 700 !important; }
          .print-invoice .inv-notes { border-top: 1px solid #e5e7eb !important; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12 no-print">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-500/10 text-stone-400 text-xs font-medium mb-4">
            <Receipt className="w-3 h-3" /> Free Tool
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Free Invoice Generator
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Create professional invoices in seconds. Auto-calculated totals, tax support, multiple currencies. Download as PDF instantly.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6 no-print">
            {/* Business Info */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-stone-400" />
                Your Business
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                  placeholder="Business name"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-stone-500/40"
                />
                <textarea
                  value={bizAddress}
                  onChange={e => setBizAddress(e.target.value)}
                  placeholder="Address"
                  rows={2}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-stone-500/40 resize-none"
                />
                <input
                  type="email"
                  value={bizEmail}
                  onChange={e => setBizEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-stone-500/40"
                />
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-stone-400" />
                Bill To
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Client name"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-stone-500/40"
                />
                <textarea
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  placeholder="Client address"
                  rows={2}
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-stone-500/40 resize-none"
                />
                <input
                  type="email"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  placeholder="Client email"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-stone-500/40"
                />
              </div>
            </div>

            {/* Invoice Details */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-stone-400" />
                Invoice Details
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Invoice Number</label>
                  <input
                    type="text"
                    value={invoiceNum}
                    onChange={e => setInvoiceNum(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500/40 appearance-none"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={e => setInvoiceDate(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500/40"
                  />
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-stone-400" />
                  Line Items
                </h2>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-500/10 text-stone-400 text-xs hover:bg-stone-500/20 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_70px_90px_90px_32px] gap-2 text-[10px] text-white/40 uppercase tracking-wider px-1">
                  <span>Description</span>
                  <span>Qty</span>
                  <span>Rate</span>
                  <span>Amount</span>
                  <span />
                </div>
                {items.map(item => (
                  <div key={item.id} className="grid grid-cols-[1fr_70px_90px_90px_32px] gap-2 items-center">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateItem(item.id, "description", e.target.value)}
                      placeholder="Description"
                      className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-stone-500/40"
                    />
                    <input
                      type="number"
                      value={item.quantity || ""}
                      onChange={e => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                      min="0"
                      className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-stone-500/40"
                    />
                    <input
                      type="number"
                      value={item.rate || ""}
                      onChange={e => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-stone-500/40"
                    />
                    <div className="text-sm text-right text-white/70 pr-1">
                      {formatCurrency(item.quantity * item.rate)}
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-white/20 hover:text-stone-400 transition-colors disabled:opacity-20"
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.5"
                    className="w-32 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500/40"
                  />
                  <p className="text-[10px] text-white/30 mt-1">Default 15% (NZ GST)</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-sm font-semibold mb-2">Notes / Payment Instructions</h2>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Payment due within 14 days. Bank: ANZ. Account: 01-1234-5678901-00"
                rows={3}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-stone-500/40 resize-none"
              />
            </div>

            <button
              onClick={handlePrint}
              className="w-full py-4 rounded-2xl bg-stone-600 hover:bg-stone-500 text-white font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>

          {/* Live Preview */}
          <div ref={previewRef} className="print-invoice bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 lg:sticky lg:top-8 lg:self-start">
            {/* Header */}
            <div className="inv-header flex justify-between items-start pb-6 mb-6 border-b border-white/[0.06]">
              <div>
                <h2 className="text-2xl font-bold">{bizName || "Your Business"}</h2>
                {bizAddress && (
                  <p className="text-sm text-white/50 mt-1 whitespace-pre-line">{bizAddress}</p>
                )}
                {bizEmail && (
                  <p className="text-sm text-white/50">{bizEmail}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white/20">INVOICE</p>
                <p className="text-sm text-white/50 mt-2">{invoiceNum}</p>
              </div>
            </div>

            {/* Bill To + Dates */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Bill To</p>
                <p className="font-semibold text-sm">{clientName || "Client Name"}</p>
                {clientAddress && (
                  <p className="text-sm text-white/50 whitespace-pre-line">{clientAddress}</p>
                )}
                {clientEmail && (
                  <p className="text-sm text-white/50">{clientEmail}</p>
                )}
              </div>
              <div className="text-right space-y-1">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30">Date</p>
                  <p className="text-sm">{formatDate(invoiceDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/30 mt-2">Due Date</p>
                  <p className="text-sm">{formatDate(dueDate)}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="inv-table w-full text-sm mb-6">
              <thead>
                <tr className="text-left">
                  <th className="py-2 px-3 text-[10px] uppercase tracking-wider text-white/40 bg-white/[0.03] rounded-l-lg">Description</th>
                  <th className="py-2 px-3 text-[10px] uppercase tracking-wider text-white/40 bg-white/[0.03] text-center w-16">Qty</th>
                  <th className="py-2 px-3 text-[10px] uppercase tracking-wider text-white/40 bg-white/[0.03] text-right w-24">Rate</th>
                  <th className="py-2 px-3 text-[10px] uppercase tracking-wider text-white/40 bg-white/[0.03] text-right rounded-r-lg w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-white/[0.04]">
                    <td className="py-3 px-3 text-white/70">{item.description || "—"}</td>
                    <td className="py-3 px-3 text-center text-white/70">{item.quantity}</td>
                    <td className="py-3 px-3 text-right text-white/70">{formatCurrency(item.rate)}</td>
                    <td className="py-3 px-3 text-right font-medium">{formatCurrency(item.quantity * item.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="inv-totals flex flex-col items-end pt-4 border-t border-white/[0.06] space-y-2">
              <div className="flex justify-between w-48 text-sm">
                <span className="text-white/50">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between w-48 text-sm">
                <span className="text-white/50">Tax ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between w-48 text-lg font-bold pt-2 border-t border-white/[0.06] inv-total-final">
                <span>Total ({currency})</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Notes */}
            {notes && (
              <div className="inv-notes mt-8 pt-6 border-t border-white/[0.06]">
                <p className="text-[10px] uppercase tracking-wider text-white/30 mb-1">Notes</p>
                <p className="text-sm text-white/50 whitespace-pre-line">{notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto no-print">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <h3 className="font-semibold text-sm">{faq.q}</h3>
                  {faqOpen === i ? (
                    <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
                  )}
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-sm text-white/50 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center bg-gradient-to-br from-stone-600/10 to-stone-600/10 border border-stone-500/10 rounded-2xl p-10 no-print">
          <h2 className="text-2xl font-bold mb-3">Automate your entire business</h2>
          <p className="text-white/50 mb-6 max-w-lg mx-auto">
            Stop creating invoices manually. Our AI booking and payment system handles scheduling, invoicing, and payments automatically.
          </p>
          <Link
            href="/products/booking"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-600 hover:bg-stone-500 font-semibold transition-colors"
          >
            Try AI Booking System <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center no-print">
          <p className="text-[10px] text-white/15">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</p>
        </div>
      </div>
    </div>
  );
}
