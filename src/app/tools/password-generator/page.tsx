"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Shield,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Lock,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  Zap,
} from "lucide-react";

/* ─── Password generation (client-side, crypto-safe) ─── */

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?/~`",
};

function generatePassword(
  length: number,
  options: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean }
): string {
  let charset = "";
  if (options.uppercase) charset += CHARSETS.uppercase;
  if (options.lowercase) charset += CHARSETS.lowercase;
  if (options.numbers) charset += CHARSETS.numbers;
  if (options.symbols) charset += CHARSETS.symbols;

  if (!charset) charset = CHARSETS.lowercase; // fallback

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  // Ensure at least one char from each enabled set
  const required: string[] = [];
  if (options.uppercase) required.push(CHARSETS.uppercase);
  if (options.lowercase) required.push(CHARSETS.lowercase);
  if (options.numbers) required.push(CHARSETS.numbers);
  if (options.symbols) required.push(CHARSETS.symbols);

  const chars = password.split("");
  const posArray = new Uint32Array(required.length);
  crypto.getRandomValues(posArray);
  const valArray = new Uint32Array(required.length);
  crypto.getRandomValues(valArray);

  required.forEach((set, i) => {
    const pos = posArray[i] % length;
    chars[pos] = set[valArray[i] % set.length];
  });

  return chars.join("");
}

/* ─── Strength calculator ─── */

type Strength = "weak" | "medium" | "strong" | "very strong";

function getStrength(
  length: number,
  options: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean }
): { label: Strength; score: number; color: string; bg: string } {
  let poolSize = 0;
  if (options.uppercase) poolSize += 26;
  if (options.lowercase) poolSize += 26;
  if (options.numbers) poolSize += 10;
  if (options.symbols) poolSize += 29;
  if (poolSize === 0) poolSize = 26;

  const entropy = length * Math.log2(poolSize);

  if (entropy < 36) return { label: "weak", score: 25, color: "text-stone-400", bg: "bg-stone-500" };
  if (entropy < 60) return { label: "medium", score: 50, color: "text-stone-400", bg: "bg-stone-500" };
  if (entropy < 80) return { label: "strong", score: 75, color: "text-stone-400", bg: "bg-stone-500" };
  return { label: "very strong", score: 100, color: "text-stone-400", bg: "bg-stone-400" };
}

/* ─── JSON-LD ─── */

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Zoobicon Free Password Generator",
      applicationCategory: "SecurityApplication",
      operatingSystem: "Any",
      url: "https://zoobicon.com/tools/password-generator",
      description:
        "Generate strong, random passwords instantly. Uses cryptographically secure randomness. Free, no signup, no data leaves your browser.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: { "@type": "Organization", name: "Zoobicon", url: "https://zoobicon.com" },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does this password generator work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "This tool uses your browser's built-in cryptographic random number generator (crypto.getRandomValues) to create passwords. No data is sent to any server — everything happens locally on your device.",
          },
        },
        {
          "@type": "Question",
          name: "How long should my password be?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We recommend at least 16 characters for most accounts and 20+ characters for sensitive accounts like banking or email. Longer passwords with mixed character types are exponentially harder to crack.",
          },
        },
        {
          "@type": "Question",
          name: "Is it safe to generate passwords in a browser?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, when the generator runs entirely client-side like ours. Your passwords are never transmitted over the internet. We use the Web Crypto API which provides cryptographically secure random values.",
          },
        },
        {
          "@type": "Question",
          name: "Should I use a different password for every account?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absolutely. Reusing passwords means a single breach can compromise all your accounts. Use a unique, strong password for every account and store them in a password manager.",
          },
        },
      ],
    },
  ],
};

/* ─── Component ─── */

export default function PasswordGeneratorPage() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showPasswords, setShowPasswords] = useState(true);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const generate = useCallback(() => {
    const list: string[] = [];
    for (let i = 0; i < 5; i++) {
      list.push(generatePassword(length, options));
    }
    setPasswords(list);
    setCopiedIdx(null);
  }, [length, options]);

  useEffect(() => {
    generate();
  }, [generate]);

  const copyToClipboard = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  const toggleOption = (key: keyof typeof options) => {
    const next = { ...options, [key]: !options[key] };
    // At least one must be on
    if (!next.uppercase && !next.lowercase && !next.numbers && !next.symbols) return;
    setOptions(next);
  };

  const strength = getStrength(length, options);

  const faqs = jsonLd["@graph"][1].mainEntity as Array<{
    "@type": string;
    name: string;
    acceptedAnswer: { "@type": string; text: string };
  }>;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#060e1f] text-white">
        {/* Nav */}
        <nav className="border-b border-white/10 bg-[#060e1f]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <Shield className="w-7 h-7 text-stone-400" />
              <span>Zoobicon</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/tools"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                All Tools
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm bg-stone-500 hover:bg-stone-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <header className="pt-16 pb-10 text-center px-4">
          <div className="inline-flex items-center gap-2 bg-stone-500/10 border border-stone-500/20 rounded-full px-4 py-1.5 mb-6">
            <Lock className="w-4 h-4 text-stone-400" />
            <span className="text-sm text-stone-300 font-medium">
              100% Client-Side &middot; No Data Leaves Your Browser
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            Free Password Generator
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Generate cryptographically secure passwords instantly. Customize length,
            character types, and generate multiple passwords at once.
          </p>
        </header>

        {/* Main */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 space-y-8">
          {/* Primary password card */}
          <div className="bg-[#0f2148] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            {/* Top password display */}
            <div className="relative group">
              <div className="bg-[#060e1f] border border-white/10 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-3">
                <code className="flex-1 text-lg sm:text-xl font-mono break-all select-all text-stone-100">
                  {passwords[0]
                    ? showPasswords
                      ? passwords[0]
                      : "•".repeat(passwords[0].length)
                    : ""}
                </code>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title={showPasswords ? "Hide passwords" : "Show passwords"}
                  >
                    {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => passwords[0] && copyToClipboard(passwords[0], 0)}
                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Copy to clipboard"
                  >
                    {copiedIdx === 0 ? (
                      <Check className="w-5 h-5 text-stone-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              {copiedIdx === 0 && (
                <span className="absolute -top-8 right-2 text-sm text-stone-400 font-medium animate-fade-in">
                  Copied!
                </span>
              )}
            </div>

            {/* Strength bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Password Strength</span>
                <span className={`font-semibold capitalize ${strength.color}`}>
                  {strength.label}
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${strength.bg}`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            </div>

            {/* Length slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-stone-400" />
                  Length
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={8}
                    max={128}
                    value={length}
                    onChange={(e) => {
                      const v = Math.max(8, Math.min(128, Number(e.target.value) || 8));
                      setLength(v);
                    }}
                    className="w-16 bg-[#060e1f] border border-white/10 rounded-lg px-2 py-1 text-center text-sm text-white focus:outline-none focus:border-stone-500"
                  />
                  <span className="text-sm text-gray-500">chars</span>
                </div>
              </div>
              <input
                type="range"
                min={8}
                max={128}
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full accent-stone-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>8</span>
                <span>32</span>
                <span>64</span>
                <span>96</span>
                <span>128</span>
              </div>
            </div>

            {/* Character type toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(
                [
                  { key: "uppercase", label: "A-Z", desc: "Uppercase" },
                  { key: "lowercase", label: "a-z", desc: "Lowercase" },
                  { key: "numbers", label: "0-9", desc: "Numbers" },
                  { key: "symbols", label: "!@#", desc: "Symbols" },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  onClick={() => toggleOption(item.key)}
                  className={`rounded-xl border p-3 text-center transition-all ${
                    options[item.key]
                      ? "border-stone-500/50 bg-stone-500/10 text-white"
                      : "border-white/10 bg-[#060e1f] text-gray-500 hover:border-white/20"
                  }`}
                >
                  <span className="block text-lg font-mono font-bold">{item.label}</span>
                  <span className="block text-xs mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>

            {/* Regenerate button */}
            <button
              onClick={generate}
              className="w-full flex items-center justify-center gap-2 bg-stone-500 hover:bg-stone-400 text-black font-bold py-3.5 rounded-xl transition-colors text-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Generate New Passwords
            </button>
          </div>

          {/* Additional passwords */}
          <div className="bg-[#0f2148] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-stone-400" />
              5 Generated Passwords
            </h2>
            <div className="space-y-3">
              {passwords.map((pw, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[#060e1f] border border-white/10 rounded-xl px-4 py-3 group"
                >
                  <span className="text-xs text-gray-600 font-mono w-5 shrink-0">
                    {i + 1}.
                  </span>
                  <code className="flex-1 font-mono text-sm sm:text-base break-all select-all text-gray-200">
                    {showPasswords ? pw : "•".repeat(pw.length)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(pw, i)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors shrink-0"
                    title="Copy"
                  >
                    {copiedIdx === i ? (
                      <Check className="w-4 h-4 text-stone-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  {copiedIdx === i && (
                    <span className="text-xs text-stone-400 font-medium shrink-0">Copied!</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Password strength tips */}
          <div className="bg-[#0f2148] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-stone-400" />
              Password Strength Tips
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: <ShieldCheck className="w-5 h-5 text-stone-400" />,
                  title: "Use 16+ characters",
                  text: "Every extra character exponentially increases the time needed to crack your password. 16 is the modern minimum for sensitive accounts.",
                },
                {
                  icon: <RefreshCw className="w-5 h-5 text-stone-400" />,
                  title: "Unique per account",
                  text: "Never reuse passwords. If one service is breached, attackers try those credentials everywhere else automatically.",
                },
                {
                  icon: <Lock className="w-5 h-5 text-stone-400" />,
                  title: "Use a password manager",
                  text: "You cannot remember 50+ unique passwords. Use a password manager like 1Password, Bitwarden, or Apple Keychain.",
                },
                {
                  icon: <AlertTriangle className="w-5 h-5 text-stone-400" />,
                  title: "Enable 2FA everywhere",
                  text: "A strong password plus two-factor authentication makes your accounts virtually impenetrable to remote attacks.",
                },
              ].map((tip, i) => (
                <div
                  key={i}
                  className="bg-[#060e1f] border border-white/10 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    {tip.icon}
                    {tip.title}
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-[#0f2148] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="border border-white/10 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-medium text-sm sm:text-base pr-4">{faq.name}</span>
                    {faqOpen === i ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                  </button>
                  {faqOpen === i && (
                    <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">
                      {faq.acceptedAnswer.text}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* VPN CTA */}
          <div className="bg-gradient-to-br from-stone-500/10 to-stone-500/10 border border-stone-500/20 rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <ShieldCheck className="w-12 h-12 text-stone-400 mx-auto" />
            <h2 className="text-2xl font-bold">Protect Your Passwords with a VPN</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              A strong password is step one. Encrypting your internet connection is step two.
              Prevent attackers from intercepting your passwords on public Wi-Fi.
            </p>
            <Link
              href="/products/vpn"
              className="inline-flex items-center gap-2 bg-stone-500 hover:bg-stone-400 text-black font-bold px-6 py-3 rounded-xl transition-colors"
            >
              <Shield className="w-5 h-5" />
              Explore Zoobicon VPN
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 py-10 text-center text-sm text-gray-500">
          <div className="max-w-6xl mx-auto px-4 space-y-3">
            <p className="font-medium text-gray-400">
              zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot; zoobicon.sh
            </p>
            <p>&copy; {new Date().getFullYear()} Zoobicon. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
