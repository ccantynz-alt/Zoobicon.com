import Link from "next/link";
import { Metadata } from "next";
import {
  QrCode, Lock, Type, Palette, Braces, FileText,
  Tags, FileCode, Receipt, Sparkles, Globe, Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Free Online Tools | Zoobicon",
  description: "Free tools for developers, marketers, and business owners. QR code generator, password generator, color palette generator, invoice generator, and more.",
};

const TOOLS = [
  { name: "AI Business Name Generator", desc: "AI generates names + instant domain check", href: "/tools/business-name-generator", icon: Sparkles, color: "from-stone-500 to-stone-600" },
  { name: "QR Code Generator", desc: "Generate QR codes for URLs, WiFi, email, phone", href: "/tools/qr-code-generator", icon: QrCode, color: "from-stone-500 to-stone-600" },
  { name: "Password Generator", desc: "Secure random passwords with strength meter", href: "/tools/password-generator", icon: Lock, color: "from-stone-500 to-stone-600" },
  { name: "Word Counter", desc: "Count words, characters, reading time, top keywords", href: "/tools/word-counter", icon: Type, color: "from-stone-500 to-stone-600" },
  { name: "Color Palette Generator", desc: "Random palettes with harmony modes and export", href: "/tools/color-palette-generator", icon: Palette, color: "from-stone-500 to-stone-600" },
  { name: "JSON Formatter", desc: "Format, validate, and minify JSON", href: "/tools/json-formatter", icon: Braces, color: "from-stone-500 to-stone-600" },
  { name: "Privacy Policy Generator", desc: "GDPR/CCPA compliant privacy policy in seconds", href: "/tools/privacy-policy-generator", icon: FileText, color: "from-stone-500 to-stone-600" },
  { name: "Meta Tag Generator", desc: "SEO meta tags with Google and social previews", href: "/tools/meta-tag-generator", icon: Tags, color: "from-stone-500 to-stone-600" },
  { name: "Invoice Generator", desc: "Professional invoices with tax calculation", href: "/tools/invoice-generator", icon: Receipt, color: "from-stone-500 to-stone-600" },
  { name: "Robots.txt Generator", desc: "Control search engine and AI bot crawling", href: "/tools/robots-txt-generator", icon: FileCode, color: "from-slate-500 to-gray-600" },
  { name: "Domain Search", desc: "Check availability across 13 extensions instantly", href: "/domains", icon: Globe, color: "from-stone-500 to-stone-600" },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-[#060e1f] text-white">
      <nav className="border-b border-white/[0.06] bg-[#0a0a12]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold">Zoobicon</span>
          </Link>
          <Link href="/auth/signup" className="text-xs text-brand-400 hover:text-brand-300">Get Started</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Free Online Tools</h1>
          <p className="text-white/40 max-w-lg mx-auto">No signup required. No ads. No limits. Just tools that work.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(tool => (
            <Link key={tool.href} href={tool.href} className="group rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 hover:border-white/[0.15] hover:bg-white/[0.04] transition-all">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
                <tool.icon className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-semibold mb-1 group-hover:text-white transition-colors">{tool.name}</h2>
              <p className="text-xs text-white/40">{tool.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-[10px] text-white/15">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</p>
        </div>
      </div>
    </div>
  );
}
