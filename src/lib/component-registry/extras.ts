import { registerComponent } from "./store";

// ── Pricing: Three Tier ──
registerComponent({
  id: "pricing-three-tier",
  name: "Three Tier Pricing",
  category: "pricing",
  variant: "three-tier",
  description: "Premium 3-column pricing with glass morphism featured tier, gradient accents, social proof, and trust badges",
  tags: ["saas", "startup", "business", "software", "platform", "service", "tech", "agency", "modern"],
  code: `export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "0",
      period: "Free forever",
      desc: "Everything you need to validate your idea",
      features: ["3 active projects", "1GB cloud storage", "Community support", "Core analytics dashboard", "Custom subdomain", "SSL included"],
      cta: "Get Started Free",
      featured: false,
      badge: null,
    },
    {
      name: "Professional",
      price: "49",
      period: "/month",
      desc: "For teams shipping at startup speed",
      features: ["Unlimited projects", "100GB cloud storage", "Priority support (4hr SLA)", "Advanced analytics + exports", "Custom domains + SSL", "Team collaboration (10 seats)", "Full API access", "SSO integration", "Webhook automations"],
      cta: "Start 14-Day Free Trial",
      featured: true,
      badge: "Most Popular",
    },
    {
      name: "Enterprise",
      price: "199",
      period: "/month",
      desc: "For organizations that demand the best",
      features: ["Everything in Professional", "Unlimited storage", "Dedicated account manager", "Custom integrations + SLA", "99.99% uptime guarantee", "SOC 2 Type II certified", "Priority phone support", "Custom contracts"],
      cta: "Talk to Sales",
      featured: false,
      badge: null,
    },
  ];
  return (
    <section id="pricing" className="py-32 px-6 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-sm font-semibold text-indigo-700">Simple, transparent pricing</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-5 tracking-tight">Plans That Scale With You</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">Start free. Upgrade when you need more power. No hidden fees, no surprises, cancel anytime.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-start">
          {plans.map((p, i) => (
            <div key={i} className={\`group relative rounded-3xl transition-all duration-500 \${p.featured ? "bg-gray-900 text-white md:-mt-6 md:mb-[-24px] ring-2 ring-indigo-500/50 shadow-2xl shadow-indigo-500/10" : "bg-white border border-gray-200/80 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5"}\`}>
              {p.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/30">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {p.badge}
                  </span>
                </div>
              )}
              <div className={\`p-10 \${p.featured ? "pt-12" : "pt-10"}\`}>
                <h3 className={\`text-lg font-bold mb-1.5 \${p.featured ? "text-white" : "text-gray-900"}\`}>{p.name}</h3>
                <p className={\`text-sm mb-6 \${p.featured ? "text-gray-400" : "text-gray-500"}\`}>{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={\`text-6xl font-extrabold tracking-tight \${p.featured ? "text-white" : "text-gray-900"}\`}>{"$"}{p.price}</span>
                  <span className={\`text-sm font-medium \${p.featured ? "text-gray-400" : "text-gray-500"}\`}>{p.period}</span>
                </div>
                {p.featured && <p className="text-xs text-indigo-400 mb-6">Billed monthly &middot; Save 20% annually</p>}
                {!p.featured && <div className="mb-6" />}
                <button className={\`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 \${p.featured ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5" : "bg-gray-900 text-white hover:bg-gray-800 hover:-translate-y-0.5"}\`}>
                  {p.cta}
                </button>
                <div className={\`mt-8 pt-8 border-t \${p.featured ? "border-white/10" : "border-gray-100"}\`}>
                  <p className={\`text-xs font-semibold uppercase tracking-wider mb-4 \${p.featured ? "text-gray-500" : "text-gray-400"}\`}>{i === 2 ? "Everything in Pro, plus:" : "What's included:"}</p>
                  <ul className="space-y-3.5">
                    {p.features.map((f, j) => (
                      <li key={j} className={\`flex items-start gap-3 text-sm \${p.featured ? "text-gray-300" : "text-gray-600"}\`}>
                        <div className={\`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 \${p.featured ? "bg-indigo-500/20" : "bg-indigo-50"}\`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={p.featured ? "#a5b4fc" : "#6366f1"} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center mt-16 gap-6">
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> SOC 2 Certified</span>
            <span className="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> GDPR Compliant</span>
            <span className="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg> 99.9% Uptime</span>
          </div>
          <p className="text-sm text-gray-400">Trusted by 12,000+ teams worldwide &middot; No credit card required to start</p>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Stats: Gradient ──
registerComponent({
  id: "stats-gradient",
  name: "Gradient Stats",
  category: "stats",
  variant: "gradient",
  description: "Bold numbers on gradient background with supporting labels",
  tags: ["modern", "saas", "startup", "tech", "business", "agency", "software", "platform", "dark", "cyber"],
  code: `export default function Stats() {
  const stats = [
    { value: "12K+", label: "Active Companies", desc: "across 40+ countries" },
    { value: "99.99%", label: "Uptime SLA", desc: "since January 2023" },
    { value: "4.2M", label: "API Calls / Day", desc: "avg. response 38ms" },
    { value: "$2.1B", label: "Revenue Processed", desc: "for our customers" },
  ];
  return (
    <section className="py-20 px-6 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRWMGgydjM0aDM0djJIMzZ6TTAgMzRWMGgydjM0aDM0djJIMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
      <div className="relative max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <div key={i} className="text-center">
            <div className="text-4xl md:text-5xl font-extrabold text-white mb-1 tracking-tight">{s.value}</div>
            <div className="text-white/90 font-semibold text-sm mb-1">{s.label}</div>
            <div className="text-white/50 text-xs">{s.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}`,
});

// ── FAQ: Accordion ──
registerComponent({
  id: "faq-accordion",
  name: "FAQ Accordion",
  category: "faq",
  variant: "accordion",
  description: "Premium expandable FAQ with numbered items, smooth animations, gradient accents, and support CTA",
  tags: ["saas", "startup", "business", "software", "platform", "service", "tech", "agency", "modern", "restaurant", "food", "creative"],
  code: `export default function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);
  const faqs = [
    {
      q: "How does the free trial work?",
      a: "Sign up with just your email — no credit card required. You get full access to all Professional features for 14 days. At the end, choose to upgrade or continue on our free Starter plan. All your data and settings are preserved, so you never lose work.",
    },
    {
      q: "Can I change or cancel my plan anytime?",
      a: "Absolutely. Upgrade, downgrade, or cancel from your account settings in two clicks. When upgrading, you only pay the prorated difference. When downgrading, remaining credit applies to future billing. We believe in earning your business every month.",
    },
    {
      q: "What kind of support can I expect?",
      a: "Starter plans include community forum access and our comprehensive knowledge base. Professional plans include priority email support with a guaranteed 4-hour response time during business hours. Enterprise plans include a dedicated account manager and priority phone support.",
    },
    {
      q: "How do you handle data security and compliance?",
      a: "Security is foundational, not an afterthought. We are SOC 2 Type II certified and GDPR compliant. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We run quarterly penetration tests by independent auditors and maintain 99.99% uptime SLA for enterprise customers.",
    },
    {
      q: "Do you offer custom enterprise contracts?",
      a: "Yes. Our Enterprise plan includes custom SLAs, dedicated infrastructure, priority support, and flexible payment terms including annual billing. Contact our sales team for a tailored proposal. Most enterprise contracts are finalized within 5 business days.",
    },
    {
      q: "What happens to my data if I cancel?",
      a: "Your data remains accessible for 30 days after cancellation. During this period, you can export everything or reactivate your account with all data intact. After 30 days, data is permanently deleted from our servers and backups per our data retention policy.",
    },
  ];
  return (
    <section id="faq" className="py-32 px-6 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
            <span className="text-sm font-semibold text-indigo-700">Got questions?</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-5 tracking-tight">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">Everything you need to know about getting started. Can&apos;t find what you&apos;re looking for? <a href="#contact" className="text-indigo-600 font-semibold hover:text-indigo-500 underline underline-offset-4 decoration-indigo-300 transition-colors">Talk to our team</a>.</p>
        </div>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className={\`rounded-2xl overflow-hidden transition-all duration-300 \${open === i ? "bg-white shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-100" : "bg-white/60 border border-gray-200/80 hover:bg-white hover:shadow-md"}\`}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center gap-5 p-6 md:p-7 text-left group"
                aria-expanded={open === i}
              >
                <span className={\`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-colors duration-300 \${open === i ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"}\`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={\`font-semibold text-base flex-1 transition-colors \${open === i ? "text-gray-900" : "text-gray-700"}\`}>{f.q}</span>
                <div className={\`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 \${open === i ? "bg-indigo-100 rotate-180" : "bg-gray-100 group-hover:bg-indigo-50"}\`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={open === i ? "#4f46e5" : "#9ca3af"} strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </button>
              {open === i && (
                <div className="px-6 md:px-7 pb-7 pl-[4.75rem]">
                  <p className="text-gray-500 leading-relaxed text-[15px]">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 px-8 py-6 rounded-2xl bg-gray-900">
            <div className="text-left">
              <p className="text-white font-bold text-sm">Still have questions?</p>
              <p className="text-gray-400 text-sm">Our team typically responds within 2 hours.</p>
            </div>
            <button className="px-6 py-3 bg-white text-gray-900 font-bold text-sm rounded-xl hover:bg-gray-100 transition-colors whitespace-nowrap">Contact Support</button>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── CTA: Gradient Card ──
registerComponent({
  id: "cta-gradient-card",
  name: "Gradient CTA Card",
  category: "cta",
  variant: "gradient-card",
  description: "Premium gradient CTA with animated glow, social proof avatars, dual buttons, and trust signals",
  tags: ["modern", "saas", "startup", "business", "agency", "tech", "software", "service", "marketing", "platform", "creative", "restaurant"],
  code: `export default function Cta() {
  const avatars = [
    { initials: "AK", bg: "bg-blue-500" },
    { initials: "MR", bg: "bg-emerald-500" },
    { initials: "SL", bg: "bg-violet-500" },
    { initials: "JD", bg: "bg-amber-500" },
    { initials: "TC", bg: "bg-rose-500" },
  ];
  return (
    <section className="py-28 px-6">
      <div className="max-w-6xl mx-auto relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 p-12 md:p-20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "6s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-400/5 rounded-full blur-[120px]" />
        <div className="relative text-center">
          <div className="flex justify-center mb-8">
            <div className="flex -space-x-3">
              {avatars.map((a, i) => (
                <div key={i} className={\`w-10 h-10 rounded-full \${a.bg} flex items-center justify-center text-white text-xs font-bold ring-2 ring-gray-900\`}>{a.initials}</div>
              ))}
            </div>
            <div className="ml-4 text-left">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(s => <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
              </div>
              <p className="text-gray-400 text-xs mt-0.5">Loved by 12,000+ teams</p>
            </div>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
            Ready to Build Something
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent"> Remarkable?</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of teams who shipped faster, scaled smarter, and stopped worrying about infrastructure. Your free trial starts now.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="group px-10 py-4 bg-white text-gray-900 font-bold rounded-2xl hover:bg-gray-50 transition-all text-sm shadow-xl shadow-white/10 hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5 flex items-center gap-2">
              Start Free Trial
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button className="px-10 py-4 bg-white/5 text-white font-semibold rounded-2xl hover:bg-white/10 transition-all backdrop-blur-sm border border-white/10 text-sm hover:-translate-y-0.5">
              Schedule a Demo
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> No credit card required</span>
            <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> 14-day full access</span>
            <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Cancel anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Pricing: Two Tier ──
registerComponent({
  id: "pricing-two-tier",
  name: "Two Tier Pricing",
  category: "pricing",
  variant: "two-tier",
  description: "Premium side-by-side free/pro comparison with gradient pro card, hover lift, and conversion-focused layout",
  tags: ["saas", "startup", "business", "software", "platform", "service", "tech", "minimal", "clean"],
  code: `export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "0",
      period: "forever",
      desc: "Everything you need to validate your idea and get started",
      features: ["5 active projects", "1GB cloud storage", "Community support", "Core analytics", "Email notifications", "Custom subdomain"],
      cta: "Get Started Free",
      dark: false,
      badge: null,
    },
    {
      name: "Pro",
      price: "29",
      period: "/month",
      desc: "Unlock the full platform. Built for professionals who ship.",
      features: ["Unlimited projects", "50GB cloud storage", "Priority support (4hr SLA)", "Advanced analytics + exports", "Custom domains + SSL", "Team collaboration (10 seats)", "Full API access", "White-label exports"],
      cta: "Start 14-Day Free Trial",
      dark: true,
      badge: "Recommended",
    },
  ];
  return (
    <section id="pricing" className="py-32 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
            <span className="text-sm font-semibold text-indigo-700">Simple, honest pricing</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-5 tracking-tight">One Free Plan. One Pro Plan.</h2>
          <p className="text-xl text-gray-500 max-w-xl mx-auto">No tiers to decode, no hidden fees. Pick free or pro. Upgrade when you&apos;re ready.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((p, i) => (
            <div key={i} className={\`group relative rounded-3xl transition-all duration-500 hover:-translate-y-1 \${p.dark ? "bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 text-white shadow-2xl shadow-gray-900/20 ring-1 ring-white/10" : "bg-white border-2 border-gray-200 hover:border-indigo-200 hover:shadow-xl"}\`}>
              {p.badge && (
                <div className="absolute -top-3.5 right-8">
                  <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/30">{p.badge}</span>
                </div>
              )}
              <div className="p-10 md:p-12">
                <h3 className={\`text-xl font-bold mb-2 \${p.dark ? "text-white" : "text-gray-900"}\`}>{p.name}</h3>
                <p className={\`text-sm mb-8 leading-relaxed \${p.dark ? "text-gray-400" : "text-gray-500"}\`}>{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={\`text-6xl font-extrabold tracking-tight \${p.dark ? "text-white" : "text-gray-900"}\`}>{"$"}{p.price}</span>
                  <span className={\`text-sm font-medium \${p.dark ? "text-gray-400" : "text-gray-500"}\`}>{p.period}</span>
                </div>
                {p.dark && <p className="text-xs text-indigo-400 mb-8">Billed monthly &middot; Save 20% on annual</p>}
                {!p.dark && <div className="mb-8" />}
                <button className={\`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 \${p.dark ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 shadow-lg shadow-indigo-500/30 hover:shadow-xl" : "bg-gray-900 text-white hover:bg-gray-800"}\`}>
                  {p.cta}
                </button>
                <div className={\`mt-10 pt-8 border-t \${p.dark ? "border-white/10" : "border-gray-100"}\`}>
                  <p className={\`text-xs font-semibold uppercase tracking-wider mb-5 \${p.dark ? "text-gray-500" : "text-gray-400"}\`}>What&apos;s included:</p>
                  <ul className="space-y-4">
                    {p.features.map((f, j) => (
                      <li key={j} className={\`flex items-center gap-3 text-sm \${p.dark ? "text-gray-300" : "text-gray-600"}\`}>
                        <div className={\`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center \${p.dark ? "bg-indigo-500/20" : "bg-indigo-50"}\`}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={p.dark ? "#a5b4fc" : "#6366f1"} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-10">No credit card required &middot; Cancel anytime &middot; Trusted by 12,000+ teams</p>
      </div>
    </section>
  );
}`,
});

// ── Pricing: Toggle ──
registerComponent({
  id: "pricing-toggle",
  name: "Toggle Pricing",
  category: "pricing",
  variant: "toggle",
  description: "Premium monthly/annual toggle with animated savings badge, glass featured tier, and gradient accents",
  tags: ["saas", "startup", "business", "software", "platform", "service", "tech", "modern", "agency"],
  code: `export default function Pricing() {
  const [annual, setAnnual] = React.useState(false);
  const plans = [
    { name: "Starter", desc: "For individuals getting started", mo: 19, yr: 15, features: ["5 projects", "2GB storage", "Email support", "Core analytics", "Custom subdomain"], cta: "Start Free" },
    { name: "Growth", desc: "For teams scaling fast", mo: 49, yr: 39, features: ["25 projects", "20GB storage", "Priority support (4hr)", "Advanced analytics", "Custom domains + SSL", "Team seats (5)", "API access", "Webhooks"], featured: true, cta: "Start 14-Day Trial" },
    { name: "Scale", desc: "For organizations at scale", mo: 99, yr: 79, features: ["Unlimited projects", "100GB storage", "Dedicated support", "Enterprise analytics", "SSO / SAML", "Unlimited seats", "99.99% SLA", "Custom contracts"], cta: "Contact Sales" },
  ];
  return (
    <section id="pricing" className="py-32 px-6 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
            <span className="text-sm font-semibold text-indigo-700">Transparent pricing</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-5 tracking-tight">Invest in Growth</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">Choose monthly flexibility or save with annual billing. No hidden fees.</p>
          <div className="inline-flex items-center bg-white rounded-2xl p-1.5 border border-gray-200 shadow-sm">
            <button onClick={() => setAnnual(false)} className={\`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 \${!annual ? "bg-gray-900 text-white shadow-lg" : "text-gray-500 hover:text-gray-700"}\`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={\`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2.5 \${annual ? "bg-gray-900 text-white shadow-lg" : "text-gray-500 hover:text-gray-700"}\`}>
              Annual
              <span className={\`text-[10px] px-2.5 py-1 rounded-full font-bold transition-all \${annual ? "bg-emerald-400 text-emerald-950" : "bg-emerald-100 text-emerald-700"}\`}>-20%</span>
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto items-start">
          {plans.map((p, i) => {
            const price = annual ? p.yr : p.mo;
            return (
              <div key={i} className={\`group relative rounded-3xl transition-all duration-500 hover:-translate-y-1 \${p.featured ? "bg-gray-900 text-white md:-mt-6 md:mb-[-24px] ring-2 ring-indigo-500/50 shadow-2xl shadow-indigo-500/10" : "bg-white border border-gray-200/80 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5"}\`}>
                {p.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-500/30">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      Most Popular
                    </span>
                  </div>
                )}
                <div className={\`p-10 \${p.featured ? "pt-12" : ""}\`}>
                  <h3 className={\`text-lg font-bold mb-1 \${p.featured ? "text-white" : "text-gray-900"}\`}>{p.name}</h3>
                  <p className={\`text-sm mb-6 \${p.featured ? "text-gray-400" : "text-gray-500"}\`}>{p.desc}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={\`text-6xl font-extrabold tracking-tight \${p.featured ? "text-white" : "text-gray-900"}\`}>{"$"}{price}</span>
                    <span className={\`text-sm font-medium \${p.featured ? "text-gray-400" : "text-gray-500"}\`}>/mo</span>
                  </div>
                  {annual && <p className={\`text-xs mb-6 \${p.featured ? "text-emerald-400" : "text-emerald-600"}\`}>{"$"}{(price * 12)} billed annually (save {"$"}{(p.mo - p.yr) * 12}/yr)</p>}
                  {!annual && <div className="mb-6" />}
                  <button className={\`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 \${p.featured ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 shadow-lg shadow-indigo-500/30 hover:shadow-xl" : "bg-gray-900 text-white hover:bg-gray-800"}\`}>
                    {p.cta}
                  </button>
                  <div className={\`mt-8 pt-8 border-t \${p.featured ? "border-white/10" : "border-gray-100"}\`}>
                    <ul className="space-y-3.5">
                      {p.features.map((f, j) => (
                        <li key={j} className={\`flex items-center gap-3 text-sm \${p.featured ? "text-gray-300" : "text-gray-600"}\`}>
                          <div className={\`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center \${p.featured ? "bg-indigo-500/20" : "bg-indigo-50"}\`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={p.featured ? "#a5b4fc" : "#6366f1"} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-sm text-gray-400 mt-14">All plans include SSL, 99.9% uptime, and GDPR compliance &middot; No credit card required</p>
      </div>
    </section>
  );
}`,
});

// ── Pricing: Enterprise ──
registerComponent({
  id: "pricing-enterprise",
  name: "Enterprise Pricing",
  category: "pricing",
  variant: "enterprise",
  description: "Enterprise-focused pricing with custom quote CTA and feature highlights",
  tags: ["enterprise", "business", "agency", "software", "platform", "saas", "tech", "corporate"],
  code: `export default function Pricing() {
  const features = [
    { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title: "SOC 2 & GDPR", desc: "Fully compliant infrastructure with annual audits" },
    { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", title: "Unlimited Seats", desc: "Entire organization access with SSO and SCIM" },
    { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "99.99% Uptime SLA", desc: "Guaranteed availability with dedicated infrastructure" },
    { icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", title: "Dedicated Support", desc: "Named account manager with direct phone line" },
    { icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", title: "Custom Integrations", desc: "Dedicated engineering support for custom workflows" },
    { icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", title: "Advanced Reporting", desc: "Custom dashboards, data exports, and audit logs" },
  ];
  return (
    <section id="pricing" className="py-28 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Enterprise</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Built for Organizations at Scale</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Custom pricing tailored to your team size, compliance needs, and growth trajectory.</p>
        </div>
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 rounded-3xl p-12 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {features.map((f, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon}/></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm mb-1">{f.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-white/10">
              <button className="px-10 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors text-sm shadow-xl">
                Contact Sales
              </button>
              <button className="px-10 py-4 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-sm border border-white/20">
                Download Security Whitepaper
              </button>
              <span className="text-gray-500 text-sm">Custom contracts available</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Pricing: Comparison Table ──
registerComponent({
  id: "pricing-comparison",
  name: "Comparison Table Pricing",
  category: "pricing",
  variant: "comparison",
  description: "Premium feature comparison table with highlighted Pro column, category grouping, and gradient CTA row",
  tags: ["saas", "startup", "business", "software", "platform", "service", "tech", "agency", "enterprise"],
  code: `export default function Pricing() {
  const plans = [
    { name: "Free", price: "$0", period: "forever", cta: "Start Free", highlighted: false },
    { name: "Pro", price: "$49", period: "/month", cta: "Start Trial", highlighted: true },
    { name: "Business", price: "$149", period: "/month", cta: "Contact Sales", highlighted: false },
  ];
  const sections = [
    { category: "Core", features: [
      { name: "Projects", values: ["3", "Unlimited", "Unlimited"] },
      { name: "Cloud storage", values: ["1GB", "50GB", "500GB"] },
      { name: "Team members", values: ["1", "10", "Unlimited"] },
      { name: "File uploads", values: ["10MB max", "100MB max", "No limit"] },
    ]},
    { category: "Features", features: [
      { name: "Custom domains", values: [false, true, true] },
      { name: "API access", values: [false, true, true] },
      { name: "Advanced analytics", values: [false, true, true] },
      { name: "Webhooks & integrations", values: [false, true, true] },
      { name: "White-label exports", values: [false, false, true] },
    ]},
    { category: "Security & Support", features: [
      { name: "SSL encryption", values: [true, true, true] },
      { name: "Priority support", values: [false, true, true] },
      { name: "SSO / SAML", values: [false, false, true] },
      { name: "99.99% SLA", values: [false, false, true] },
      { name: "Dedicated account manager", values: [false, false, true] },
    ]},
  ];
  return (
    <section id="pricing" className="py-32 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
            <span className="text-sm font-semibold text-indigo-700">Compare all features</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-5 tracking-tight">Find Your Perfect Fit</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">Every feature, every plan, side by side. No surprises, no hidden costs.</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-6 text-sm text-gray-500 font-medium w-1/4 border-b border-gray-200">Features</th>
                {plans.map((p, i) => (
                  <th key={i} className={\`p-6 text-center border-b border-gray-200 \${p.highlighted ? "bg-indigo-50/50" : ""}\`}>
                    {p.highlighted && <span className="inline-block text-[10px] font-bold bg-indigo-600 text-white px-3 py-1 rounded-full uppercase tracking-wider mb-3">Recommended</span>}
                    <div className={\`text-lg font-bold \${p.highlighted ? "text-indigo-900" : "text-gray-900"}\`}>{p.name}</div>
                    <div className="flex items-baseline justify-center gap-0.5 mt-1">
                      <span className={\`text-3xl font-extrabold \${p.highlighted ? "text-indigo-900" : "text-gray-900"}\`}>{p.price}</span>
                      <span className="text-sm text-gray-400">{p.period}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map((section, si) => (
                <React.Fragment key={si}>
                  <tr><td colSpan={4} className="px-6 pt-6 pb-3 text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-50/50 border-b border-gray-100">{section.category}</td></tr>
                  {section.features.map((f, fi) => (
                    <tr key={fi} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-gray-700">{f.name}</td>
                      {f.values.map((v, j) => (
                        <td key={j} className={\`py-4 px-6 text-center text-sm \${plans[j].highlighted ? "bg-indigo-50/30" : ""}\`}>
                          {typeof v === "boolean" ? (
                            v ? (
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mx-auto"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mx-auto"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
                            )
                          ) : (
                            <span className="font-semibold text-gray-900">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          <div className="grid grid-cols-4 bg-gray-50 border-t border-gray-200">
            <div className="p-6" />
            {plans.map((p, i) => (
              <div key={i} className={\`p-6 text-center \${p.highlighted ? "bg-indigo-50/50" : ""}\`}>
                <button className={\`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 \${p.highlighted ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25" : "bg-gray-900 text-white hover:bg-gray-800"}\`}>
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-sm text-gray-400 mt-10">All plans include SSL encryption and GDPR compliance &middot; Cancel anytime</p>
      </div>
    </section>
  );
}`,
});

// ── About Section ──
registerComponent({
  id: "about-split",
  name: "Split About Section",
  category: "about",
  variant: "split",
  description: "Two-column about section with image and text side by side",
  tags: ["modern", "saas", "startup", "business", "agency", "service", "restaurant", "food", "creative", "portfolio", "warm"],
  code: `export default function About() {
  return (
    <section id="about" className="py-28 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl -z-10" />
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=500&fit=crop&q=80"
            alt="Team collaborating"
            className="rounded-2xl shadow-xl w-full h-auto object-cover"
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">About Us</p>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6 leading-tight">We Build Tools That Teams Actually Love Using</h2>
          <p className="text-gray-500 leading-relaxed mb-6">
            Founded in 2021 by a team of engineers who were tired of duct-taping tools together. We believed there had to be a better way to ship software — one platform, not fifteen.
          </p>
          <p className="text-gray-500 leading-relaxed mb-8">
            Today, over 12,000 companies trust us with their most critical workflows. Our team of 85 across San Francisco, London, and Singapore ships improvements every single day.
          </p>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-extrabold text-indigo-600">85</div>
              <div className="text-sm text-gray-500 mt-1">Team members</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-indigo-600">12K+</div>
              <div className="text-sm text-gray-500 mt-1">Companies</div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-indigo-600">3</div>
              <div className="text-sm text-gray-500 mt-1">Global offices</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Stats: Cards ──
registerComponent({
  id: "stats-cards",
  name: "Stats Cards",
  category: "stats",
  variant: "cards",
  description: "Individual stat cards with icons, large numbers, and subtle hover lift",
  tags: ["modern", "saas", "startup", "tech", "business", "agency", "software", "platform", "clean", "corporate"],
  code: `export default function Stats() {
  const stats = [
    { value: "2.4M+", label: "Requests Handled Daily", desc: "Peak throughput: 48K/sec", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { value: "99.97%", label: "Uptime This Year", desc: "Monitored every 30 seconds", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
    { value: "38ms", label: "Avg. Response Time", desc: "p99 under 120ms globally", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { value: "140+", label: "Countries Served", desc: "Edge nodes on 6 continents", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  ];
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">By the Numbers</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900">Infrastructure You Can Trust</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={i} className="group bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon}/></svg>
              </div>
              <div className="text-4xl font-extrabold text-gray-900 mb-1">{s.value}</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">{s.label}</div>
              <div className="text-xs text-gray-400">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── Stats: Counters (Dark) ──
registerComponent({
  id: "stats-counters",
  name: "Counter Stats",
  category: "stats",
  variant: "counters",
  description: "Large animated-feel counters on dark background with glow accents",
  tags: ["modern", "dark", "saas", "startup", "tech", "cyber", "software", "platform", "bold", "agency"],
  code: `export default function Stats() {
  const stats = [
    { value: "500K+", label: "Developers Trust Us", suffix: "" },
    { value: "12B", label: "API Calls Last Year", suffix: "+" },
    { value: "4.9", label: "Average Rating", suffix: "/5" },
    { value: "50", label: "Data Center Regions", suffix: "+" },
  ];
  return (
    <section className="py-28 px-6 bg-gray-950 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-3">Platform Scale</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white">Numbers That Speak for Themselves</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {stats.map((s, i) => (
            <div key={i} className="text-center group">
              <div className="text-6xl md:text-7xl font-black text-white mb-3 tracking-tight group-hover:text-indigo-400 transition-colors duration-300">
                {s.value}<span className="text-indigo-500">{s.suffix}</span>
              </div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">{s.label}</div>
              <div className="mt-4 mx-auto w-12 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── Stats: Dark Strip ──
registerComponent({
  id: "stats-dark-strip",
  name: "Dark Strip Stats",
  category: "stats",
  variant: "dark-strip",
  description: "Thin horizontal dark strip with 4 inline stats separated by dividers",
  tags: ["minimal", "dark", "saas", "startup", "tech", "business", "software", "compact", "clean", "modern"],
  code: `export default function Stats() {
  const stats = [
    { value: "10K+", label: "Customers" },
    { value: "99.9%", label: "Uptime" },
    { value: "24/7", label: "Support" },
    { value: "150+", label: "Integrations" },
  ];
  return (
    <section className="bg-gray-900 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-y-4">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-3 px-8">
              <span className="text-2xl md:text-3xl font-extrabold text-white">{s.value}</span>
              <span className="text-sm text-gray-400 font-medium">{s.label}</span>
            </div>
            {i < stats.length - 1 && <div className="hidden sm:block w-px h-8 bg-gray-700" />}
          </div>
        ))}
      </div>
    </section>
  );
}`,
});

// ── FAQ: Two Column ──
registerComponent({
  id: "faq-two-column",
  name: "Two Column FAQ",
  category: "faq",
  variant: "two-column",
  description: "Questions and answers split across two columns for dense layouts",
  tags: ["saas", "startup", "business", "software", "platform", "service", "tech", "agency", "modern", "clean"],
  code: `export default function Faq() {
  const faqs = [
    { q: "What happens after my trial ends?", a: "Your account automatically switches to the free Starter plan. No charges, no data loss. Upgrade any time to unlock premium features again." },
    { q: "Can I import data from another platform?", a: "Yes. We support CSV, JSON, and direct API imports from over 30 platforms including Airtable, Notion, and Google Sheets. Our migration team assists Enterprise customers." },
    { q: "How does team billing work?", a: "Each workspace has one billing owner. Team members are added at no extra cost on Pro. Business plans include per-seat pricing above 25 members." },
    { q: "Do you offer refunds?", a: "We offer a full refund within the first 30 days, no questions asked. After 30 days, you can cancel anytime and retain access until the end of your billing cycle." },
    { q: "Is there an API rate limit?", a: "Free plans: 100 requests/minute. Pro plans: 1,000 requests/minute. Business plans: 10,000 requests/minute. Need more? Contact us for custom limits." },
    { q: "Where is my data stored?", a: "Data is stored in AWS data centers across US-East, EU-West, and AP-Southeast. Enterprise customers can choose their region. All data is encrypted at rest and in transit." },
  ];
  const half = Math.ceil(faqs.length / 2);
  const left = faqs.slice(0, half);
  const right = faqs.slice(half);
  return (
    <section id="faq" className="py-28 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Got Questions? We Have Answers.</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">If you can&apos;t find what you need, our support team responds within 4 hours on business days.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {[left, right].map((col, ci) => (
            <div key={ci} className="space-y-6">
              {col.map((f, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-200 hover:shadow-md transition-all duration-300">
                  <h3 className="font-bold text-gray-900 mb-2 flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mt-0.5">{ci * half + i + 1}</span>
                    {f.q}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed ml-9">{f.a}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── FAQ: Search ──
registerComponent({
  id: "faq-search",
  name: "Searchable FAQ",
  category: "faq",
  variant: "search",
  description: "FAQ with search input at top to filter questions in real time",
  tags: ["saas", "startup", "business", "software", "platform", "service", "tech", "agency", "modern", "interactive"],
  code: `export default function Faq() {
  const [query, setQuery] = React.useState("");
  const faqs = [
    { q: "How do I reset my password?", a: "Click your avatar in the top-right corner, select Settings, then Security. You can reset your password there or use the forgot-password link on the login page." },
    { q: "Can I use my own custom domain?", a: "Yes. On Pro and Business plans, navigate to Settings > Domains. Add your domain and update your DNS records. We handle SSL automatically — no configuration needed." },
    { q: "What payment methods do you accept?", a: "We accept all major credit and debit cards (Visa, Mastercard, Amex), PayPal, and wire transfers for annual Enterprise contracts." },
    { q: "How do I cancel my subscription?", a: "Go to Settings > Billing > Cancel Plan. Your access continues until the end of the current billing period. All your data remains available on the free Starter plan." },
    { q: "Is there a mobile app?", a: "Our web app is fully responsive and works great on mobile browsers. Native iOS and Android apps are on our roadmap for Q3 2026." },
    { q: "Do you offer educational discounts?", a: "Yes! Students and educators get 50% off any paid plan. Verify your .edu email at checkout or contact support with proof of enrollment." },
    { q: "How does version history work?", a: "Every save creates a snapshot. Pro plans keep 30 days of history, Business plans keep unlimited history. You can preview and restore any previous version with one click." },
    { q: "Can I export my data?", a: "Absolutely. Go to Settings > Data > Export. You can download everything as JSON or CSV at any time. Your data is always yours — no lock-in." },
  ];
  const filtered = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(query.toLowerCase()) ||
      f.a.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <section id="faq" className="py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Help Center</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-500">Search below or <a href="#contact" className="text-indigo-600 underline underline-offset-4 hover:text-indigo-500">contact our team</a> directly.</p>
        </div>
        <div className="relative mb-10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" className="absolute left-4 top-1/2 -translate-y-1/2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search questions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-sm"
          />
        </div>
        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-medium mb-1">No matching questions found</p>
              <p className="text-sm">Try a different search term or <a href="#contact" className="text-indigo-600 underline underline-offset-4">ask us directly</a>.</p>
            </div>
          )}
          {filtered.map((f, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-indigo-200 hover:shadow-md transition-all duration-300">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {f.q}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed ml-[30px]">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── CTA: Split ──
registerComponent({
  id: "cta-split",
  name: "CTA Split",
  category: "cta",
  variant: "split",
  description: "Premium split CTA with gradient background, email capture, and trust signals",
  tags: ["cta", "newsletter", "signup", "subscribe"],
  code: `export default function CTA() {
  return (
    <section className="py-28 px-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRWMGgydjM0aDM0djJIMzZ6TTAgMzRWMGgydjM0aDM0djJIMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative">
        <div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight tracking-tight">Ready to Transform Your Workflow?</h2>
          <p className="text-xl text-indigo-200 mb-8 leading-relaxed">Join 10,000+ teams who ship faster, build smarter, and scale without limits.</p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {["AK","MR","SL","JD"].map((n,i)=>(
                <div key={i} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-600">{n}</div>
              ))}
            </div>
            <div className="text-indigo-200 text-sm"><span className="text-white font-semibold">4.9/5</span> from 2,000+ reviews</div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <p className="text-white font-bold text-lg mb-6">Start building for free</p>
          <div className="space-y-4">
            <input type="email" placeholder="Enter your work email" className="w-full px-5 py-4 rounded-xl text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-300 outline-none" />
            <button className="w-full px-8 py-4 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg shadow-black/10 hover:shadow-xl text-sm">
              Get Started Free
            </button>
          </div>
          <p className="text-indigo-300 text-xs mt-4 text-center">No credit card required &middot; Setup in 2 minutes</p>
        </div>
      </div>
    </section>
  );
}`,
});

// ── CTA: Newsletter ──
registerComponent({
  id: "cta-newsletter",
  name: "CTA Newsletter",
  category: "cta",
  variant: "newsletter",
  description: "Premium newsletter CTA with subscriber count, email input, and social proof",
  tags: ["newsletter", "email", "subscribe", "updates"],
  code: `export default function CTA() {
  return (
    <section className="py-28 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-indigo-700">15,000+ subscribers</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">Stay in the Loop</h2>
        <p className="text-lg text-gray-500 mb-10 leading-relaxed">Weekly insights on product development, AI, and startup growth. Read by founders and engineers at top companies.</p>
        <div className="flex gap-3 max-w-lg mx-auto mb-4">
          <input type="email" placeholder="you@company.com" className="flex-1 px-5 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 outline-none transition-all" />
          <button className="px-8 py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl text-sm whitespace-nowrap">Subscribe</button>
        </div>
        <p className="text-sm text-gray-400">No spam, ever. Unsubscribe in one click.</p>
      </div>
    </section>
  );
}`,
});

// ── CTA: Banner ──
registerComponent({
  id: "cta-banner",
  name: "CTA Banner",
  category: "cta",
  variant: "banner",
  description: "Premium full-width gradient banner with countdown urgency and glow effect",
  tags: ["cta", "banner", "promo", "launch", "offer"],
  code: `export default function CTA() {
  return (
    <section className="py-20 px-6 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-indigo-400/10 rounded-full blur-[80px]" />
      <div className="max-w-4xl mx-auto text-center relative">
        <span className="inline-flex items-center gap-2 text-sm font-bold text-purple-200 bg-white/10 backdrop-blur-sm px-5 py-2 rounded-full mb-6 border border-white/10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Limited Time Offer
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">Get 3 Months Free When You Sign Up Today</h2>
        <p className="text-lg text-purple-200 mb-8 max-w-2xl mx-auto">Join now and lock in our best price. This offer expires at the end of the month.</p>
        <button className="group px-10 py-4 bg-white text-purple-700 font-bold rounded-2xl hover:bg-purple-50 transition-all shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-0.5 text-sm flex items-center gap-2 mx-auto">
          Claim Free Trial
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </section>
  );
}`,
});

// ── Footer: Mega ──
registerComponent({
  id: "footer-mega",
  name: "Footer Mega",
  category: "footer",
  variant: "mega",
  description: "Premium 5-column footer with gradient newsletter CTA, status indicator, trust badges, and social links",
  tags: ["footer", "links", "newsletter", "social", "enterprise"],
  code: `export default function Footer() {
  const links = {
    Product: ["Features", "Pricing", "Integrations", "API", "Changelog", "Status"],
    Company: ["About", "Blog", "Careers", "Press", "Partners"],
    Resources: ["Documentation", "Guides", "Templates", "Community", "Webinars"],
    Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR", "Security"],
  };
  return (
    <footer className="bg-gray-950 text-gray-400 pt-20 pb-8 px-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      <div className="max-w-7xl mx-auto relative">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">B</div>
              <span className="text-xl font-bold text-white">Brand</span>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-sm">Building the future of modern software. Trusted by 12,000+ teams worldwide.</p>
            <div className="flex gap-2 mb-6">
              <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:border-indigo-500 outline-none transition-colors" />
              <button className="px-5 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-500 transition-colors">Subscribe</button>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </div>
          </div>
          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-semibold text-white text-sm mb-5">{title}</h4>
              <ul className="space-y-3">
                {items.map((item, i) => (
                  <li key={i}><a href="#" className="text-sm hover:text-white transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} Brand. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs">
            <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> SOC 2</span>
            <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> GDPR</span>
            <span className="flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> ISO 27001</span>
          </div>
        </div>
      </div>
    </footer>
  );
}`,
});

// ── Footer: Centered ──
registerComponent({
  id: "footer-centered",
  name: "Footer Centered",
  category: "footer",
  variant: "centered",
  description: "Premium centered footer with gradient logo, social icons, and elegant link row",
  tags: ["footer", "minimal", "centered", "clean"],
  code: `export default function Footer() {
  const socialIcons = [
    { label: "Twitter", path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
    { label: "GitHub", path: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" },
    { label: "LinkedIn", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" },
  ];
  return (
    <footer className="bg-white border-t border-gray-100 py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">B</div>
          <span className="text-xl font-bold text-gray-900">Brand</span>
        </div>
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          {["Features", "Pricing", "About", "Blog", "Docs", "Support"].map((link, i) => (
            <a key={i} href="#" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">{link}</a>
          ))}
        </div>
        <div className="flex justify-center gap-4 mb-8">
          {socialIcons.map((s, i) => (
            <a key={i} href="#" aria-label={s.label} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.path}/></svg>
            </a>
          ))}
        </div>
        <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Brand. All rights reserved.</p>
      </div>
    </footer>
  );
}`,
});

// ── About: Team ──
registerComponent({
  id: "about-team",
  name: "About Team",
  category: "about",
  variant: "team",
  description: "Premium team grid with role badges, social links, and hover effects",
  tags: ["about", "team", "people", "staff", "founders"],
  code: `export default function About() {
  const team = [
    { name: "Sarah Chen", role: "CEO & Co-founder", bio: "Previously VP Eng at Stripe. Stanford CS.", initials: "SC", color: "from-violet-500 to-purple-600" },
    { name: "Marcus Johnson", role: "CTO & Co-founder", bio: "Ex-Google Staff Engineer. Built systems at scale.", initials: "MJ", color: "from-blue-500 to-indigo-600" },
    { name: "Emily Park", role: "Head of Design", bio: "Led design at Figma. 15 years in product design.", initials: "EP", color: "from-pink-500 to-rose-600" },
    { name: "David Kim", role: "Engineering Lead", bio: "Open source contributor. Prev. Meta and Vercel.", initials: "DK", color: "from-emerald-500 to-teal-600" },
  ];
  return (
    <section id="team" className="py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-6">
            <span className="text-sm font-semibold text-indigo-700">Our team</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-5 tracking-tight">Meet the People Behind the Product</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">Passionate builders from the world&apos;s best companies, united by a mission to make software accessible to everyone.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((t, i) => (
            <div key={i} className="group text-center">
              <div className="relative mb-6 mx-auto w-40 h-40">
                <div className={\`w-full h-full rounded-3xl bg-gradient-to-br \${t.color} flex items-center justify-center text-white text-3xl font-bold transition-all duration-500 group-hover:rounded-[2rem] group-hover:shadow-xl group-hover:scale-105\`}>
                  {t.initials}
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">{t.name}</h3>
              <p className="text-indigo-600 text-sm font-semibold mb-2">{t.role}</p>
              <p className="text-gray-500 text-sm leading-relaxed">{t.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── About: Mission ──
registerComponent({
  id: "about-mission",
  name: "About Mission",
  category: "about",
  variant: "mission",
  description: "Premium mission/vision/values with gradient icon cards and large typography",
  tags: ["about", "mission", "vision", "values", "purpose"],
  code: `export default function About() {
  const cards = [
    { icon: "M13 10V3L4 14h7v7l9-11h-7z", title: "Our Mission", text: "To democratize software creation. We believe every business deserves world-class technology — regardless of technical expertise or budget.", color: "from-indigo-500 to-violet-600" },
    { icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", title: "Our Vision", text: "A world where anyone can bring ideas to life in minutes, not months. Where the gap between imagination and execution disappears entirely.", color: "from-emerald-500 to-teal-600" },
    { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title: "Our Values", text: "Quality over quantity. Transparency over secrecy. Speed without sacrifice. We earn trust by being honest about what works and what doesn&apos;t.", color: "from-amber-500 to-orange-600" },
  ];
  return (
    <section className="py-32 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">What Drives Us</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((c, i) => (
            <div key={i} className="group bg-white rounded-3xl p-10 border border-gray-200/80 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 hover:-translate-y-1">
              <div className={\`w-14 h-14 rounded-2xl bg-gradient-to-br \${c.color} flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform duration-300\`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon}/></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{c.title}</h3>
              <p className="text-gray-500 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ══════════════════════════════════════════════════════════════════
// NEXT-GEN COMPONENTS — Cutting-edge 2026/2027 patterns
// Bento grids, scroll animations, text reveals, spotlights, marquees
// These are what separate a $100K site from a $200K+ site
// ══════════════════════════════════════════════════════════════════

// ── Features: Bento Grid ──
registerComponent({
  id: "features-bento-grid",
  name: "Bento Grid Features",
  category: "features",
  variant: "bento-grid",
  description: "Asymmetric bento grid layout with mixed-size feature cards, hover animations, and gradient accents. The gold standard for modern SaaS",
  tags: ["bento", "grid", "modern", "saas", "tech", "startup", "platform", "advanced", "premium", "cutting-edge", "ai", "software"],
  code: `export default function Features() {
  const features = [
    { title: "AI-Powered Analytics", desc: "Real-time insights powered by machine learning. Predict trends before they happen.", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", span: "col-span-2 row-span-2", accent: "from-violet-500 to-indigo-500" },
    { title: "Lightning Fast", desc: "Sub-millisecond response times globally.", icon: "M13 10V3L4 14h7v7l9-11h-7z", span: "col-span-1", accent: "from-amber-500 to-orange-500" },
    { title: "Enterprise Security", desc: "SOC 2 Type II certified. Zero-trust architecture.", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", span: "col-span-1", accent: "from-emerald-500 to-teal-500" },
    { title: "Smart Automation", desc: "Set it and forget it. Workflows that learn and adapt to your patterns.", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", span: "col-span-1 row-span-2", accent: "from-cyan-500 to-blue-500" },
    { title: "Seamless Integrations", desc: "Connect with 200+ tools your team already uses.", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1", span: "col-span-2", accent: "from-rose-500 to-pink-500" },
  ];
  return (
    <section className="py-24 px-6 bg-gray-950" id="features">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/5 text-gray-300 text-xs font-semibold px-4 py-1.5 rounded-full border border-white/10 mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Platform Features
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Everything you need.
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Nothing you don&apos;t.</span>
          </h2>
        </div>
        <div className="grid grid-cols-3 auto-rows-[minmax(180px,auto)] gap-4">
          {features.map(f => (
            <div key={f.title} className={\`group relative \${f.span} bg-white/[0.03] rounded-2xl border border-white/[0.06] p-8 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-500 overflow-hidden\`}>
              {/* Hover gradient glow */}
              <div className={\`absolute inset-0 bg-gradient-to-br \${f.accent} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 rounded-2xl\`} />
              {/* Top accent line */}
              <div className={\`absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent \${f.accent.replace("from-", "via-").split(" ")[0]} to-transparent opacity-0 group-hover:opacity-40 transition-opacity duration-500\`} />
              <div className="relative">
                <div className={\`w-12 h-12 rounded-xl bg-gradient-to-br \${f.accent} bg-opacity-10 flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300\`} style={{ background: \`linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))\` }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon}/></svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text transition-all duration-300" style={{ WebkitBackgroundClip: "text" }}>{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── Hero: Animated Text Reveal ──
registerComponent({
  id: "hero-text-reveal",
  name: "Animated Text Reveal Hero",
  category: "hero",
  variant: "text-reveal",
  description: "Words fade in one-by-one with blur-to-sharp transitions. The most premium hero pattern in 2026. Jaw-dropping first impression",
  tags: ["animated", "text-reveal", "premium", "luxury", "saas", "tech", "startup", "ai", "modern", "cutting-edge", "motion", "advanced"],
  code: `export default function Hero() {
  const [revealed, setRevealed] = React.useState(0);
  const words = ["Build", "something", "people", "actually", "love."];
  const subWords = ["The", "AI-powered", "platform", "that", "turns", "your", "vision", "into", "reality."];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setRevealed(prev => {
        if (prev >= words.length + subWords.length + 3) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 120);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16 overflow-hidden bg-gray-950">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-violet-600/15 to-transparent rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "4s" }} />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-l from-cyan-600/10 to-transparent rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "6s" }} />

      {/* Dot grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative text-center max-w-5xl mx-auto">
        {/* Badge */}
        <div className={\`inline-flex items-center gap-2 bg-white/5 text-gray-400 text-xs font-medium px-4 py-2 rounded-full border border-white/10 mb-12 transition-all duration-700 \${revealed > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}\`}>
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          Now available worldwide
        </div>

        {/* Main headline — word by word reveal */}
        <h1 className="text-6xl md:text-8xl font-extrabold leading-[1.05] tracking-tight mb-8">
          {words.map((word, i) => (
            <span key={i} className={\`inline-block mr-[0.3em] transition-all duration-700 \${revealed > i + 1 ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-6 blur-sm"}\`}>
              {i === words.length - 1 ? (
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">{word}</span>
              ) : (
                <span className="text-white">{word}</span>
              )}
            </span>
          ))}
        </h1>

        {/* Sub-headline — word by word */}
        <p className="text-xl md:text-2xl font-light leading-relaxed mb-12 max-w-2xl mx-auto">
          {subWords.map((word, i) => (
            <span key={i} className={\`inline-block mr-[0.25em] transition-all duration-500 \${revealed > i + words.length + 1 ? "opacity-100 translate-y-0 text-gray-400" : "opacity-0 translate-y-3 text-gray-600"}\`}>
              {word}
            </span>
          ))}
        </p>

        {/* CTAs */}
        <div className={\`flex flex-wrap justify-center gap-4 mb-16 transition-all duration-700 delay-300 \${revealed > words.length + subWords.length ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}\`}>
          <button className="group relative px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:shadow-2xl hover:shadow-white/10 hover:-translate-y-0.5 transition-all text-sm overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">
              Get Started Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </span>
          </button>
          <button className="px-8 py-4 bg-white/5 text-gray-300 font-semibold rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm backdrop-blur-sm">
            Watch Demo
          </button>
        </div>

        {/* Social proof */}
        <div className={\`flex items-center justify-center gap-6 transition-all duration-700 delay-500 \${revealed > words.length + subWords.length + 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}\`}>
          <div className="flex -space-x-2">
            {[11, 26, 44, 52, 68].map(n => (
              <img key={n} src={\`https://randomuser.me/api/portraits/\${n % 2 === 0 ? "women" : "men"}/\${n}.jpg\`} alt="" className="w-8 h-8 rounded-full border-2 border-gray-950 object-cover" />
            ))}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FBBF24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">Loved by <strong className="text-gray-300">25,000+</strong> teams</span>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Misc: Logo Marquee / Ticker ──
registerComponent({
  id: "logos-marquee",
  name: "Logo Marquee Ticker",
  category: "misc",
  variant: "marquee",
  description: "Infinite scrolling logo ticker with smooth CSS animation. Grayscale logos that colorize on hover. Used by every premium SaaS site",
  tags: ["logos", "marquee", "ticker", "clients", "partners", "trust", "social-proof", "saas", "tech", "startup", "modern"],
  code: `export default function LogoMarquee() {
  const logos = ["Stripe", "Notion", "Linear", "Vercel", "Figma", "Slack", "GitHub", "Shopify", "Twilio", "Datadog"];
  return (
    <section className="py-16 bg-white border-y border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-8">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-gray-400 font-medium">Trusted by industry leaders</p>
      </div>
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
        {/* Scrolling track */}
        <div className="flex animate-marquee" style={{ animationDuration: "30s", animationTimingFunction: "linear", animationIterationCount: "infinite" }}>
          {[...logos, ...logos].map((name, i) => (
            <div key={i} className="flex-shrink-0 mx-10 flex items-center justify-center group cursor-default">
              <div className="flex items-center gap-2 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <span className="text-sm font-bold text-gray-400 group-hover:text-gray-700 transition-colors">{name.charAt(0)}</span>
                </div>
                <span className="text-base font-semibold text-gray-400 group-hover:text-gray-800 transition-colors whitespace-nowrap">{name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{\`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      \`}</style>
    </section>
  );
}`,
});

// ── Features: Spotlight Cards ──
registerComponent({
  id: "features-spotlight-cards",
  name: "Spotlight Card Features",
  category: "features",
  variant: "spotlight-cards",
  description: "Cards with cursor-tracking gradient spotlight effect on hover. Premium interactive feel that competitors can't match",
  tags: ["spotlight", "interactive", "cards", "premium", "saas", "tech", "ai", "modern", "cutting-edge", "advanced", "hover", "glow"],
  code: `export default function Features() {
  const cardRef = React.useRef([]);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0, active: -1 });

  const handleMouseMove = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: index });
  };

  const features = [
    { title: "Intelligent Routing", desc: "AI analyzes every request and routes it to the optimal server in under 10ms. Zero config, zero latency.", icon: "M13 10V3L4 14h7v7l9-11h-7z", color: "violet" },
    { title: "Adaptive Scaling", desc: "From 10 to 10 million requests. Infrastructure that scales itself based on real-time demand patterns.", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", color: "cyan" },
    { title: "Predictive Caching", desc: "ML models predict what users need next and pre-cache it. 94% cache hit rate out of the box.", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "emerald" },
    { title: "Zero-Trust Security", desc: "Every request verified. Every connection encrypted. Every access logged. Enterprise-grade by default.", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", color: "amber" },
    { title: "Real-Time Sync", desc: "Changes propagate globally in under 50ms. Conflict resolution that actually works.", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4", color: "rose" },
    { title: "Deep Observability", desc: "Traces, metrics, and logs unified in one view. Find the needle in the haystack in seconds.", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", color: "fuchsia" },
  ];

  const colorMap = { violet: "139,92,246", cyan: "6,182,212", emerald: "16,185,129", amber: "245,158,11", rose: "244,63,94", fuchsia: "217,70,239" };

  return (
    <section className="py-24 px-6 bg-gray-950" id="features">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Built for the
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"> future</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Every feature designed to give you an unfair advantage.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={() => setMousePos(p => ({ ...p, active: -1 }))}
              className="group relative bg-white/[0.02] rounded-2xl border border-white/[0.06] p-8 hover:border-white/10 transition-all duration-300 overflow-hidden cursor-default"
            >
              {/* Spotlight gradient - follows cursor */}
              {mousePos.active === i && (
                <div
                  className="absolute pointer-events-none w-[300px] h-[300px] rounded-full opacity-20 transition-opacity"
                  style={{
                    background: \`radial-gradient(circle, rgba(\${colorMap[f.color]},0.15) 0%, transparent 70%)\`,
                    left: mousePos.x - 150,
                    top: mousePos.y - 150,
                  }}
                />
              )}
              <div className="relative">
                <div className={\`w-10 h-10 rounded-lg bg-\${f.color}-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300\`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={\`rgb(\${colorMap[f.color]})\`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon}/></svg>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── Stats: Scroll-Animated Counter ──
registerComponent({
  id: "stats-animated-counter",
  name: "Scroll-Animated Stats Counter",
  category: "stats",
  variant: "animated-counter",
  description: "Stats that count up with spring animation when they scroll into view. Numbers roll to their final value. Premium interactive feel",
  tags: ["stats", "counter", "animated", "scroll", "numbers", "traction", "social-proof", "saas", "tech", "startup", "modern", "premium"],
  code: `export default function Stats() {
  const [visible, setVisible] = React.useState(false);
  const [counts, setCounts] = React.useState([0, 0, 0, 0]);
  const ref = React.useRef(null);

  const stats = [
    { target: 50000, label: "Active Users", suffix: "+", prefix: "", color: "from-violet-400 to-indigo-400" },
    { target: 99.9, label: "Uptime SLA", suffix: "%", prefix: "", color: "from-emerald-400 to-teal-400", decimals: 1 },
    { target: 2.4, label: "Revenue Processed", suffix: "B", prefix: "$", color: "from-amber-400 to-orange-400", decimals: 1 },
    { target: 150, label: "Countries Served", suffix: "+", prefix: "", color: "from-cyan-400 to-blue-400" },
  ];

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) {
          setVisible(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  React.useEffect(() => {
    if (!visible) return;
    const duration = 2000;
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for spring-like feel
      const eased = 1 - Math.pow(1 - progress, 3);
      setCounts(stats.map(s => {
        const val = s.target * eased;
        return s.decimals ? parseFloat(val.toFixed(s.decimals)) : Math.floor(val);
      }));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [visible]);

  return (
    <section ref={ref} className="relative py-24 px-6 bg-gray-950 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06),transparent_60%)]" />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Numbers that
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"> speak</span>
          </h2>
          <p className="text-gray-500">Trusted by the world&apos;s most ambitious companies</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <div key={s.label} className="group relative bg-white/[0.02] rounded-2xl border border-white/[0.06] p-8 text-center hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
              {/* Top accent */}
              <div className={\`absolute top-0 left-6 right-6 h-px bg-gradient-to-r \${s.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500\`} />
              <div className={\`text-4xl md:text-5xl font-extrabold bg-gradient-to-r \${s.color} bg-clip-text text-transparent mb-2 tabular-nums tracking-tight\`}>
                {s.prefix}{visible ? counts[i] : 0}{s.suffix}
              </div>
              <div className="text-sm text-gray-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── CTA: Gradient Border Card ──
registerComponent({
  id: "cta-gradient-border",
  name: "Gradient Border CTA",
  category: "cta",
  variant: "gradient-border",
  description: "CTA card with animated rotating gradient border. Eye-catching shimmer effect that draws attention. Premium conversion driver",
  tags: ["cta", "gradient", "border", "animated", "premium", "saas", "tech", "startup", "modern", "conversion", "advanced", "cutting-edge"],
  code: `export default function CTA() {
  return (
    <section className="py-24 px-6 bg-gray-950">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-2xl p-px overflow-hidden">
          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-2xl" style={{
            background: "conic-gradient(from var(--angle, 0deg), #7c3aed, #06b6d4, #10b981, #f59e0b, #ef4444, #7c3aed)",
            animation: "rotate-gradient 4s linear infinite",
          }} />

          {/* Inner card */}
          <div className="relative bg-gray-950 rounded-[15px] p-12 md:p-16 text-center">
            {/* Background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.08),transparent_60%)] rounded-[15px]" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 text-xs font-semibold px-4 py-1.5 rounded-full border border-violet-500/20 mb-8">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Limited Time &mdash; 3 months free
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                Ready to build the
                <br />
                <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">future?</span>
              </h2>
              <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
                Join 25,000+ teams who ship faster, scale effortlessly, and sleep better at night. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="group px-10 py-4 bg-white text-gray-900 font-bold rounded-xl hover:shadow-2xl hover:shadow-white/10 hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2">
                  Start Building Free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
                <button className="px-10 py-4 bg-white/5 text-gray-300 font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-all text-sm">
                  Talk to Sales
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-6">No credit card &middot; 14-day free trial &middot; Cancel anytime</p>
            </div>
          </div>
        </div>
      </div>
      <style>{\`
        @property --angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes rotate-gradient {
          to { --angle: 360deg; }
        }
      \`}</style>
    </section>
  );
}`,
});
