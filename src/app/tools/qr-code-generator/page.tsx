"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import * as QRCode from "qrcode";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Link2,
  Type,
  Mail,
  Phone,
  Wifi,
  ChevronDown,
  Globe,
  Smartphone,
  Palette,
  Shield,
  Zap,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PresetTab = "url" | "text" | "email" | "phone" | "wifi";
type SizeOption = "small" | "medium" | "large";
type ECLevel = "L" | "M" | "Q" | "H";

const SIZE_MAP: Record<SizeOption, number> = { small: 200, medium: 400, large: 800 };

const PRESET_TABS: { id: PresetTab; label: string; icon: typeof Link2 }[] = [
  { id: "url", label: "URL", icon: Link2 },
  { id: "text", label: "Text", icon: Type },
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "wifi", label: "WiFi", icon: Wifi },
];

const EC_LEVELS: { value: ECLevel; label: string; description: string }[] = [
  { value: "L", label: "Low (7%)", description: "Smallest QR code" },
  { value: "M", label: "BookOpen (15%)", description: "Balanced" },
  { value: "Q", label: "Quartile (25%)", description: "Good recovery" },
  { value: "H", label: "High (30%)", description: "Best recovery" },
];

/* ------------------------------------------------------------------ */
/*  JSON-LD structured data                                            */
/* ------------------------------------------------------------------ */

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Zoobicon Free QR Code Generator",
      applicationCategory: "WebApplication",
      operatingSystem: "Any",
      url: "https://zoobicon.com/tools/qr-code-generator",
      description:
        "Free QR code generator — create QR codes for URLs, text, email, phone numbers, and WiFi credentials. Download as PNG instantly.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: {
        "@type": "Organization",
        name: "Zoobicon",
        url: "https://zoobicon.com",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is a QR code?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A QR (Quick Response) code is a two-dimensional barcode that stores information such as URLs, text, contact details, or WiFi credentials. When scanned with a smartphone camera, the encoded information is instantly read and acted upon — opening a website, composing an email, or connecting to a WiFi network.",
          },
        },
        {
          "@type": "Question",
          name: "Is this QR code generator free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, completely free with no signup, no watermark, and no limits. Generate and download as many QR codes as you need in PNG format at up to 800×800 pixels.",
          },
        },
        {
          "@type": "Question",
          name: "What size QR code should I use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "For digital use (websites, emails, presentations), a medium 400×400 QR code works well. For print (flyers, posters, business cards), use the large 800×800 option to ensure the code scans reliably even at a distance.",
          },
        },
        {
          "@type": "Question",
          name: "What is error correction level?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Error correction lets a QR code remain scannable even if part of it is damaged or obscured. Level L recovers 7% of data, M recovers 15%, Q recovers 25%, and H recovers 30%. Higher levels create larger codes but are more resilient — choose H if you plan to add a logo overlay.",
          },
        },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function QRCodeGeneratorPage() {
  /* --- preset / input state --- */
  const [activeTab, setActiveTab] = useState<PresetTab>("url");
  const [textInput, setTextInput] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [wifiSSID, setWifiSSID] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");

  /* --- options --- */
  const [size, setSize] = useState<SizeOption>("medium");
  const [ecLevel, setEcLevel] = useState<ECLevel>("M");
  const [fgColor, setFgColor] = useState("#ffffff");
  const [bgColor, setBgColor] = useState("#060e1f");

  /* --- output --- */
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- Build the raw QR data string based on active tab ---- */
  const buildQrData = useCallback((): string => {
    switch (activeTab) {
      case "url":
      case "text":
        return textInput;
      case "email": {
        const parts = [`mailto:${emailTo}`];
        const params: string[] = [];
        if (emailSubject) params.push(`subject=${encodeURIComponent(emailSubject)}`);
        if (emailBody) params.push(`body=${encodeURIComponent(emailBody)}`);
        if (params.length) parts.push(`?${params.join("&")}`);
        return parts.join("");
      }
      case "phone":
        return `tel:${phoneNumber}`;
      case "wifi":
        return `WIFI:T:${wifiEncryption};S:${wifiSSID};P:${wifiPassword};;`;
      default:
        return textInput;
    }
  }, [activeTab, textInput, emailTo, emailSubject, emailBody, phoneNumber, wifiSSID, wifiPassword, wifiEncryption]);

  /* ---- Generate QR code whenever inputs change (debounced) ---- */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const data = buildQrData();
      if (!data || data === "mailto:" || data === "tel:" || data === "WIFI:T:WPA;S:;P:;;") {
        setQrDataUrl(null);
        return;
      }
      try {
        const url = await QRCode.toDataURL(data, {
          width: SIZE_MAP[size],
          margin: 2,
          errorCorrectionLevel: ecLevel,
          color: { dark: fgColor, light: bgColor },
        });
        setQrDataUrl(url);
      } catch {
        setQrDataUrl(null);
      }
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [buildQrData, size, ecLevel, fgColor, bgColor]);

  /* ---- Actions ---- */
  const downloadPng = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-code-${SIZE_MAP[size]}px.png`;
    a.click();
  };

  const copyToClipboard = async () => {
    if (!qrDataUrl) return;
    try {
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: copy the data URL string */
      await navigator.clipboard.writeText(qrDataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ---- Placeholder text per tab ---- */
  const placeholders: Record<PresetTab, string> = {
    url: "https://zoobicon.com",
    text: "Hello from Zoobicon!",
    email: "",
    phone: "",
    wifi: "",
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative z-10 min-h-screen bg-[#0b1530] text-white pt-[72px]">
        {/* -------- HERO -------- */}
        <header className="pt-16 pb-10 text-center px-4">
          <div className="inline-flex items-center gap-2 bg-stone-500/10 border border-stone-500/20 rounded-full px-4 py-1.5 text-sm text-stone-300 mb-6">
            <QrCode className="w-4 h-4" />
            Free Tool — No Signup Required
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-stone-200 to-stone-200 bg-clip-text text-transparent">
            Free QR Code Generator
          </h1>
          <p className="mt-4 text-gray-400 text-lg max-w-2xl mx-auto">
            Create QR codes for URLs, text, email, phone numbers, and WiFi credentials. Download as PNG instantly — no watermarks, no limits.
          </p>
        </header>

        {/* -------- MAIN TOOL -------- */}
        <main className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* ---- LEFT: Inputs ---- */}
            <div className="space-y-6">
              {/* Preset Tabs */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex flex-wrap gap-1">
                {PRESET_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 min-w-[80px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-stone-600 to-stone-600 text-white shadow-lg"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Input fields card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  {activeTab === "wifi" ? "WiFi Credentials" : activeTab === "email" ? "Email Details" : "Enter Content"}
                </h2>

                {/* URL / Text */}
                {(activeTab === "url" || activeTab === "text") && (
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={placeholders[activeTab]}
                    rows={4}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-stone-500/50 resize-none"
                  />
                )}

                {/* Email */}
                {activeTab === "email" && (
                  <>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="recipient@example.com"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                    />
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Subject (optional)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                    />
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Message body (optional)"
                      rows={3}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-stone-500/50 resize-none"
                    />
                  </>
                )}

                {/* Phone */}
                {activeTab === "phone" && (
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                  />
                )}

                {/* WiFi */}
                {activeTab === "wifi" && (
                  <>
                    <input
                      type="text"
                      value={wifiSSID}
                      onChange={(e) => setWifiSSID(e.target.value)}
                      placeholder="Network name (SSID)"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                    />
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                    />
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Encryption</label>
                      <div className="flex gap-2">
                        {(["WPA", "WEP", "nopass"] as const).map((enc) => (
                          <button
                            key={enc}
                            onClick={() => setWifiEncryption(enc)}
                            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium border transition ${
                              wifiEncryption === enc
                                ? "border-stone-500 bg-stone-500/20 text-stone-300"
                                : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            {enc === "nopass" ? "None" : enc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Options card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Options
                </h2>

                {/* Size */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Size</label>
                  <div className="flex gap-2">
                    {(["small", "medium", "large"] as SizeOption[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium border transition ${
                          size === s
                            ? "border-stone-500 bg-stone-500/20 text-stone-300"
                            : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)} ({SIZE_MAP[s]}px)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Correction */}
                <div>
                  <label className="text-xs text-gray-400 mb-2 block">Error Correction</label>
                  <div className="grid grid-cols-2 gap-2">
                    {EC_LEVELS.map((ec) => (
                      <button
                        key={ec.value}
                        onClick={() => setEcLevel(ec.value)}
                        className={`px-4 py-2.5 rounded-xl text-sm border transition text-left ${
                          ecLevel === ec.value
                            ? "border-stone-500 bg-stone-500/20 text-stone-300"
                            : "border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span className="font-medium">{ec.label}</span>
                        <span className="block text-xs opacity-60">{ec.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Foreground</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-2 block">Background</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-stone-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- RIGHT: QR Preview ---- */}
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px]">
                {qrDataUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrDataUrl}
                      alt="Generated QR Code"
                      className="max-w-full rounded-xl"
                      style={{ width: Math.min(SIZE_MAP[size], 400), height: Math.min(SIZE_MAP[size], 400) }}
                    />
                    <div className="flex gap-3 mt-8 w-full max-w-xs">
                      <button
                        onClick={downloadPng}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-stone-600 to-stone-600 hover:from-stone-500 hover:to-stone-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-stone-500/20"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white font-semibold py-3 rounded-xl transition border border-white/10"
                      >
                        {copied ? <Check className="w-4 h-4 text-stone-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500">
                    <QrCode className="w-20 h-20 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Your QR code will appear here</p>
                    <p className="text-sm mt-1">Start typing on the left to generate</p>
                  </div>
                )}
              </div>

              {/* Feature pills */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Zap, label: "Instant generation" },
                  { icon: Shield, label: "No data stored" },
                  { icon: Globe, label: "Works everywhere" },
                  { icon: Smartphone, label: "Mobile friendly" },
                ].map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={feat.label}
                      className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300"
                    >
                      <Icon className="w-4 h-4 text-stone-400 flex-shrink-0" />
                      {feat.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* -------- FAQ -------- */}
          <section className="mt-24 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {(jsonLd["@graph"][1] as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] }).mainEntity.map(
                (faq, i) => (
                  <details
                    key={i}
                    className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
                  >
                    <summary className="flex items-center justify-between cursor-pointer px-6 py-5 text-left font-medium text-white">
                      {faq.name}
                      <ChevronDown className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" />
                    </summary>
                    <div className="px-6 pb-5 text-gray-400 leading-relaxed">
                      {faq.acceptedAnswer.text}
                    </div>
                  </details>
                )
              )}
            </div>
          </section>

          {/* -------- BOTTOM CTA -------- */}
          <section className="mt-24 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Build more with Zoobicon
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              QR codes are just the start. Explore our full suite of AI-powered tools.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { label: "AI Website Builder", href: "/builder" },
                { label: "eSIM Plans", href: "/products/esim" },
                { label: "Domain Search", href: "/domains" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-stone-500/30 rounded-xl px-6 py-3 text-sm font-medium text-white transition"
                >
                  {link.label}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </section>
        </main>

        {/* -------- FOOTER -------- */}
        <footer className="border-t border-white/10 py-10 text-center text-sm text-gray-500">
          <p className="mb-2">
            &copy; {new Date().getFullYear()} Zoobicon. All rights reserved.
          </p>
          <p>
            <a href="https://zoobicon.com" className="hover:text-white transition">zoobicon.com</a>
            {" · "}
            <a href="https://zoobicon.ai" className="hover:text-white transition">zoobicon.ai</a>
            {" · "}
            <a href="https://zoobicon.io" className="hover:text-white transition">zoobicon.io</a>
            {" · "}
            <a href="https://zoobicon.sh" className="hover:text-white transition">zoobicon.sh</a>
          </p>
        </footer>
      </div>
    </>
  );
}
