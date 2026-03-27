/**
 * React Scaffold Component Library
 *
 * Pre-built, production-ready React components for instant preview via Sandpack.
 * Loads in <1 second. AI customizes content, colors, and branding on top.
 *
 * This is Zoobicon's speed advantage: assemble from components, don't generate from scratch.
 */

// ── Types ──

export interface ScaffoldComponent {
  id: string;
  name: string;
  category: string;
  code: string;
}

export interface ScaffoldTemplate {
  id: string;
  name: string;
  industry: string;
  components: string[];
  colors: { primary: string; bg: string; text: string; muted: string };
}

// ── Components ──

const NAV = `function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900">Brand</span>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
          <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
          <a href="#about" className="text-sm text-gray-600 hover:text-gray-900">About</a>
          <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900">Contact</a>
        </div>
        <button className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          Get Started
        </button>
      </div>
    </nav>
  );
}`;

const HERO_SPLIT = `function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            Now Available
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Build Something
            <span className="text-indigo-600"> Extraordinary</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-lg">
            The modern platform that helps you ship faster, scale smarter, and delight your customers at every touchpoint.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-3.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              Start Free Trial
            </button>
            <button className="px-8 py-3.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
              Watch Demo
            </button>
          </div>
          <div className="flex items-center gap-6 mt-8 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">✓ No credit card</span>
            <span className="flex items-center gap-1.5">✓ 14-day trial</span>
            <span className="flex items-center gap-1.5">✓ Cancel anytime</span>
          </div>
        </div>
        <div className="relative">
          <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl p-8 aspect-square flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
              <div className="h-3 bg-gray-100 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-6"></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-indigo-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">99%</div>
                  <div className="text-xs text-gray-500 mt-1">Uptime</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600">2.4x</div>
                  <div className="text-xs text-gray-500 mt-1">Faster</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-amber-600">50K+</div>
                  <div className="text-xs text-gray-500 mt-1">Users</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`;

const FEATURES = `function Features() {
  const features = [
    { icon: "⚡", title: "Lightning Fast", desc: "Built for speed. Every millisecond matters when you're scaling to millions of users." },
    { icon: "🔒", title: "Enterprise Security", desc: "SOC 2 compliant with end-to-end encryption. Your data is always protected." },
    { icon: "📊", title: "Real-time Analytics", desc: "Track every metric that matters with beautiful dashboards and instant insights." },
    { icon: "🔌", title: "Seamless Integrations", desc: "Connect with 200+ tools you already use. One-click setup, zero configuration." },
    { icon: "🤖", title: "AI-Powered", desc: "Intelligent automation that learns from your data and optimizes continuously." },
    { icon: "🌍", title: "Global Scale", desc: "Deploy to 30+ regions worldwide. Low latency for every user, everywhere." },
  ];
  return (
    <section id="features" className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Ship</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Powerful features designed for modern teams who refuse to compromise.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

const TESTIMONIALS = `function Testimonials() {
  const testimonials = [
    { name: "Sarah Chen", role: "CTO, TechFlow", quote: "Reduced our deployment time by 73%. The team can't imagine going back.", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
    { name: "Marcus Johnson", role: "Founder, ScaleUp", quote: "The best investment we made this year. ROI was visible within the first month.", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
    { name: "Emily Park", role: "VP Engineering, DataPrime", quote: "Finally, a platform that actually delivers on its promises. 10/10 would recommend.", avatar: "https://randomuser.me/api/portraits/women/68.jpg" },
  ];
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by Teams Everywhere</h2>
          <p className="text-xl text-gray-600">Join thousands of companies shipping faster.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <p className="text-gray-700 leading-relaxed mb-6">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

const PRICING = `function Pricing() {
  const plans = [
    { name: "Starter", price: "0", period: "Free forever", features: ["5 projects", "1GB storage", "Community support", "Basic analytics"], cta: "Get Started", featured: false },
    { name: "Pro", price: "49", period: "/month", features: ["Unlimited projects", "100GB storage", "Priority support", "Advanced analytics", "Custom domains", "Team collaboration"], cta: "Start Free Trial", featured: true },
    { name: "Enterprise", price: "199", period: "/month", features: ["Everything in Pro", "Unlimited storage", "Dedicated support", "Custom integrations", "SLA guarantee", "SSO & SAML"], cta: "Contact Sales", featured: false },
  ];
  return (
    <section id="pricing" className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">Start free. Scale as you grow. No hidden fees.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((p, i) => (
            <div key={i} className={\`rounded-2xl p-8 \${p.featured ? "bg-indigo-600 text-white ring-4 ring-indigo-200 scale-105" : "bg-white border border-gray-200"}\`}>
              <h3 className={\`text-xl font-semibold mb-2 \${p.featured ? "text-white" : "text-gray-900"}\`}>{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className={\`text-5xl font-bold \${p.featured ? "text-white" : "text-gray-900"}\`}>\${p.price}</span>
                <span className={\`text-sm \${p.featured ? "text-indigo-200" : "text-gray-500"}\`}>{p.period}</span>
              </div>
              <ul className="space-y-3 my-8">
                {p.features.map((f, j) => (
                  <li key={j} className={\`flex items-center gap-2 text-sm \${p.featured ? "text-indigo-100" : "text-gray-600"}\`}>
                    <span className={\`\${p.featured ? "text-indigo-200" : "text-indigo-500"}\`}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button className={\`w-full py-3 rounded-xl font-semibold text-sm transition-colors \${p.featured ? "bg-white text-indigo-600 hover:bg-indigo-50" : "bg-indigo-600 text-white hover:bg-indigo-700"}\`}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

const STATS = `function Stats() {
  const stats = [
    { value: "10M+", label: "Requests per day" },
    { value: "99.99%", label: "Uptime SLA" },
    { value: "150+", label: "Countries served" },
    { value: "50K+", label: "Happy customers" },
  ];
  return (
    <section className="py-20 px-6 bg-indigo-600">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">{s.value}</div>
            <div className="text-indigo-200 text-sm">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}`;

const FAQ = `function FAQ() {
  const [open, setOpen] = React.useState<number | null>(null);
  const faqs = [
    { q: "How does the free trial work?", a: "Start with our free plan — no credit card required. Upgrade to Pro anytime to unlock advanced features. Your data is always preserved." },
    { q: "Can I cancel anytime?", a: "Absolutely. No contracts, no cancellation fees. You can downgrade or cancel your plan at any time from your account settings." },
    { q: "Is my data secure?", a: "Yes. We're SOC 2 Type II certified with end-to-end encryption, regular security audits, and GDPR compliance. Your data never leaves our secure infrastructure." },
    { q: "Do you offer custom enterprise plans?", a: "Yes. Our enterprise plan includes custom integrations, dedicated support, SLA guarantees, and flexible pricing based on your needs. Contact our sales team." },
  ];
  return (
    <section id="faq" className="py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors">
                <span className="font-semibold text-gray-900">{f.q}</span>
                <span className="text-gray-400 text-xl">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <div className="px-6 pb-6 text-gray-600 leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

const CTA = `function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-16">
        <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-indigo-200 mb-8 max-w-2xl mx-auto">Join thousands of teams already shipping faster. Start your free trial today.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
            Start Free Trial
          </button>
          <button className="px-8 py-4 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-400 transition-colors">
            Talk to Sales
          </button>
        </div>
      </div>
    </section>
  );
}`;

const FOOTER = `function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16 px-6">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
        <div>
          <span className="text-xl font-bold text-white">Brand</span>
          <p className="mt-4 text-sm leading-relaxed">Building the future of modern software, one feature at a time.</p>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Product</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">About</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-white mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-sm text-center">
        © {new Date().getFullYear()} Brand. All rights reserved.
      </div>
    </footer>
  );
}`;

// ── Component Registry ──

export const SCAFFOLD_COMPONENTS: ScaffoldComponent[] = [
  { id: "nav", name: "Navigation", category: "nav", code: NAV },
  { id: "hero-split", name: "Hero Split", category: "hero", code: HERO_SPLIT },
  { id: "features", name: "Features Grid", category: "features", code: FEATURES },
  { id: "testimonials", name: "Testimonials", category: "testimonials", code: TESTIMONIALS },
  { id: "pricing", name: "Pricing", category: "pricing", code: PRICING },
  { id: "stats", name: "Stats Bar", category: "stats", code: STATS },
  { id: "faq", name: "FAQ Accordion", category: "faq", code: FAQ },
  { id: "cta", name: "Call to Action", category: "cta", code: CTA },
  { id: "footer", name: "Footer", category: "footer", code: FOOTER },
];

// ── Templates ──

export const SCAFFOLD_TEMPLATES: ScaffoldTemplate[] = [
  {
    id: "saas",
    name: "SaaS Landing Page",
    industry: "saas",
    components: ["nav", "hero-split", "features", "stats", "testimonials", "pricing", "faq", "cta", "footer"],
    colors: { primary: "#4f46e5", bg: "#ffffff", text: "#111827", muted: "#6b7280" },
  },
  {
    id: "agency",
    name: "Agency Website",
    industry: "agency",
    components: ["nav", "hero-split", "features", "stats", "testimonials", "pricing", "cta", "footer"],
    colors: { primary: "#0ea5e9", bg: "#0f172a", text: "#f8fafc", muted: "#94a3b8" },
  },
  {
    id: "startup",
    name: "Startup Landing",
    industry: "startup",
    components: ["nav", "hero-split", "features", "testimonials", "pricing", "faq", "cta", "footer"],
    colors: { primary: "#8b5cf6", bg: "#ffffff", text: "#111827", muted: "#6b7280" },
  },
];

// ── Assembly Functions ──

export function assembleScaffold(template: ScaffoldTemplate): Record<string, string> {
  const components = template.components
    .map(id => SCAFFOLD_COMPONENTS.find(c => c.id === id))
    .filter(Boolean) as ScaffoldComponent[];

  // Build individual component files
  const files: Record<string, string> = {};

  components.forEach(comp => {
    const fileName = `components/${comp.name.replace(/\s+/g, "")}.tsx`;
    files[fileName] = `import React from "react";\n\nexport default ${comp.code}`;
  });

  // Build App.tsx that imports and renders all components
  const imports = components.map(c => {
    const name = c.name.replace(/\s+/g, "");
    return `import ${name} from "./components/${name}";`;
  }).join("\n");

  const renders = components.map(c => {
    const name = c.name.replace(/\s+/g, "");
    return `      <${name} />`;
  }).join("\n");

  files["App.tsx"] = `import React from "react";
${imports}

export default function App() {
  return (
    <div className="min-h-screen bg-white">
${renders}
    </div>
  );
}`;

  return files;
}

export function getScaffoldForIndustry(industry: string): { files: Record<string, string>; template: ScaffoldTemplate } {
  const template = SCAFFOLD_TEMPLATES.find(t => t.industry === industry) || SCAFFOLD_TEMPLATES[0];
  return { files: assembleScaffold(template), template };
}

export function classifyIndustry(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/saas|software|app|platform|dashboard|tool/i.test(lower)) return "saas";
  if (/agency|studio|creative|design|marketing/i.test(lower)) return "agency";
  if (/startup|launch|mvp|product/i.test(lower)) return "startup";
  return "saas"; // default
}
