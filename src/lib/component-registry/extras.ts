import { registerComponent } from "./index";

// ── Pricing: Three Tier ──
registerComponent({
  id: "pricing-three-tier",
  name: "Three Tier Pricing",
  category: "pricing",
  variant: "three-tier",
  description: "3-column pricing with featured middle tier, checkmark features, and clear CTAs",
  tags: ["saas", "startup", "business", "software", "platform", "service", "tech", "agency", "modern"],
  code: `export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "0",
      period: "Free forever",
      desc: "For individuals and side projects",
      features: ["3 active projects", "1GB storage", "Community support", "Basic analytics", "Custom subdomain"],
      cta: "Get Started Free",
      featured: false,
    },
    {
      name: "Professional",
      price: "49",
      period: "/month",
      desc: "For growing teams that need more",
      features: ["Unlimited projects", "100GB storage", "Priority support", "Advanced analytics", "Custom domains", "Team collaboration", "API access", "SSO integration"],
      cta: "Start 14-Day Trial",
      featured: true,
    },
    {
      name: "Enterprise",
      price: "199",
      period: "/month",
      desc: "For organizations at scale",
      features: ["Everything in Pro", "Unlimited storage", "Dedicated account manager", "Custom integrations", "99.99% SLA", "SOC 2 compliance", "Priority phone support"],
      cta: "Contact Sales",
      featured: false,
    },
  ];
  return (
    <section id="pricing" className="py-28 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Plans That Scale With You</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Start free. Upgrade when you need more power. No hidden fees, cancel anytime.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((p, i) => (
            <div key={i} className={\`rounded-2xl p-8 transition-shadow duration-300 \${p.featured ? "bg-gray-900 text-white ring-2 ring-indigo-500 shadow-2xl shadow-indigo-500/10 md:-mt-4 md:mb-[-16px] md:py-12" : "bg-white border border-gray-200 hover:shadow-lg"}\`}>
              <h3 className={\`text-lg font-bold mb-1 \${p.featured ? "text-white" : "text-gray-900"}\`}>{p.name}</h3>
              <p className={\`text-sm mb-5 \${p.featured ? "text-gray-400" : "text-gray-500"}\`}>{p.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={\`text-5xl font-extrabold \${p.featured ? "text-white" : "text-gray-900"}\`}>{"$"}{p.price}</span>
                <span className={\`text-sm \${p.featured ? "text-gray-400" : "text-gray-500"}\`}>{p.period}</span>
              </div>
              <button className={\`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 \${p.featured ? "bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/30" : "bg-gray-900 text-white hover:bg-gray-800"}\`}>
                {p.cta}
              </button>
              <ul className="mt-8 space-y-3">
                {p.features.map((f, j) => (
                  <li key={j} className={\`flex items-start gap-2.5 text-sm \${p.featured ? "text-gray-300" : "text-gray-600"}\`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={p.featured ? "#818cf8" : "#6366f1"} strokeWidth="2.5" strokeLinecap="round" className="mt-0.5 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
  description: "Expandable Q&A with smooth toggle, covers common SaaS questions",
  tags: ["saas", "startup", "business", "software", "platform", "service", "tech", "agency", "modern", "restaurant", "food", "creative"],
  code: `export default function Faq() {
  const [open, setOpen] = React.useState<number | null>(0);
  const faqs = [
    {
      q: "How does the free trial work?",
      a: "Sign up with just your email — no credit card required. You get full access to all Professional features for 14 days. At the end, choose to upgrade or continue on our free Starter plan with no data loss.",
    },
    {
      q: "Can I switch plans at any time?",
      a: "Absolutely. Upgrade, downgrade, or cancel from your account settings at any time. When upgrading, you only pay the prorated difference. When downgrading, the remaining credit is applied to future billing.",
    },
    {
      q: "What kind of support do you offer?",
      a: "Starter plans get community forum access. Professional plans include priority email support with a 4-hour response time. Enterprise plans include a dedicated account manager and priority phone support.",
    },
    {
      q: "Is my data secure and compliant?",
      a: "Yes. We are SOC 2 Type II certified and GDPR compliant. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We conduct quarterly penetration tests and publish the results to enterprise customers.",
    },
    {
      q: "Do you offer custom enterprise contracts?",
      a: "Yes. Our Enterprise plan includes custom SLAs, dedicated infrastructure, priority support, and flexible payment terms. Contact our sales team for a tailored proposal based on your organization's needs.",
    },
  ];
  return (
    <section id="faq" className="py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Common Questions</h2>
          <p className="text-lg text-gray-500">Everything you need to know. Can&apos;t find what you&apos;re looking for? <a href="#contact" className="text-indigo-600 underline underline-offset-4">Reach out</a>.</p>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-shadow hover:shadow-sm">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left"
                aria-expanded={open === i}
              >
                <span className="font-semibold text-gray-900 pr-4">{f.q}</span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={\`text-gray-400 transition-transform duration-200 flex-shrink-0 \${open === i ? "rotate-180" : ""}\`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-6 text-gray-500 leading-relaxed text-sm -mt-1">
                  {f.a}
                </div>
              )}
            </div>
          ))}
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
  description: "Rounded gradient card with dual action buttons and compelling copy",
  tags: ["modern", "saas", "startup", "business", "agency", "tech", "software", "service", "marketing", "platform", "creative", "restaurant"],
  code: `export default function Cta() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 p-16 md:p-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/15 rounded-full blur-3xl" />
        <div className="relative text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            Ready to Build Something
            <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent"> Remarkable?</span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Join 12,000+ teams who shipped faster, scaled smarter, and stopped worrying about infrastructure. Your 14-day trial starts now.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-10 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-colors text-sm shadow-xl">
              Start Free Trial
            </button>
            <button className="px-10 py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10 text-sm">
              Schedule a Demo
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-6">No credit card required &middot; Cancel anytime &middot; Full access for 14 days</p>
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
  description: "Simple side-by-side comparison of free and pro plans with feature lists",
  tags: ["saas", "startup", "business", "software", "platform", "service", "tech", "minimal", "clean"],
  code: `export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "0",
      period: "forever",
      desc: "Everything you need to get started",
      features: ["5 projects", "1GB storage", "Community support", "Basic analytics", "Email notifications"],
      cta: "Get Started Free",
      dark: false,
    },
    {
      name: "Pro",
      price: "29",
      period: "/month",
      desc: "For professionals who need more power",
      features: ["Unlimited projects", "50GB storage", "Priority support", "Advanced analytics", "Custom domains", "Team collaboration", "API access", "White-label exports"],
      cta: "Upgrade to Pro",
      dark: true,
    },
  ];
  return (
    <section id="pricing" className="py-28 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Simple Pricing</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">One Free Plan. One Pro Plan.</h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">No tiers to decode. Pick free or pro. Upgrade when you are ready.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((p, i) => (
            <div key={i} className={\`rounded-2xl p-10 transition-all duration-300 \${p.dark ? "bg-gray-900 text-white shadow-2xl shadow-gray-900/20 hover:shadow-3xl" : "bg-white border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg"}\`}>
              <h3 className={\`text-xl font-bold mb-2 \${p.dark ? "text-white" : "text-gray-900"}\`}>{p.name}</h3>
              <p className={\`text-sm mb-6 \${p.dark ? "text-gray-400" : "text-gray-500"}\`}>{p.desc}</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className={\`text-6xl font-extrabold \${p.dark ? "text-white" : "text-gray-900"}\`}>{"$"}{p.price}</span>
                <span className={\`text-sm \${p.dark ? "text-gray-400" : "text-gray-500"}\`}>{p.period}</span>
              </div>
              <button className={\`w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 \${p.dark ? "bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/25" : "bg-gray-100 text-gray-900 hover:bg-gray-200"}\`}>
                {p.cta}
              </button>
              <ul className="mt-8 space-y-3">
                {p.features.map((f, j) => (
                  <li key={j} className={\`flex items-center gap-3 text-sm \${p.dark ? "text-gray-300" : "text-gray-600"}\`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={p.dark ? "#818cf8" : "#6366f1"} strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
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
  description: "Monthly/annual toggle with savings badge and three tiers",
  tags: ["saas", "startup", "business", "software", "platform", "service", "tech", "modern", "agency"],
  code: `export default function Pricing() {
  const [annual, setAnnual] = React.useState(false);
  const plans = [
    { name: "Starter", mo: 19, yr: 15, features: ["5 projects", "2GB storage", "Email support", "Basic analytics"] },
    { name: "Growth", mo: 49, yr: 39, features: ["25 projects", "20GB storage", "Priority support", "Advanced analytics", "Custom domains", "Team seats (5)"], featured: true },
    { name: "Scale", mo: 99, yr: 79, features: ["Unlimited projects", "100GB storage", "Dedicated support", "Enterprise analytics", "SSO", "Unlimited seats", "SLA"] },
  ];
  return (
    <section id="pricing" className="py-28 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Invest in Growth</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">Choose monthly flexibility or save up to 20% with annual billing.</p>
          <div className="inline-flex items-center gap-4 bg-white rounded-full p-1.5 border border-gray-200 shadow-sm">
            <button onClick={() => setAnnual(false)} className={\`px-6 py-2.5 rounded-full text-sm font-semibold transition-all \${!annual ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}\`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={\`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 \${annual ? "bg-gray-900 text-white shadow-md" : "text-gray-500 hover:text-gray-700"}\`}>
              Annual
              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">SAVE 20%</span>
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {plans.map((p, i) => {
            const price = annual ? p.yr : p.mo;
            return (
              <div key={i} className={\`rounded-2xl p-8 transition-all duration-300 \${p.featured ? "bg-gray-900 text-white ring-2 ring-indigo-500 shadow-2xl md:-mt-4 md:pb-12 md:pt-12" : "bg-white border border-gray-200 hover:shadow-lg"}\`}>
                {p.featured && <span className="inline-block text-[10px] font-bold bg-indigo-500 text-white px-3 py-1 rounded-full uppercase tracking-wider mb-4">Most Popular</span>}
                <h3 className={\`text-lg font-bold mb-4 \${p.featured ? "text-white" : "text-gray-900"}\`}>{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={\`text-5xl font-extrabold \${p.featured ? "text-white" : "text-gray-900"}\`}>{"$"}{price}</span>
                  <span className={\`text-sm \${p.featured ? "text-gray-400" : "text-gray-500"}\`}>/mo</span>
                </div>
                <button className={\`w-full py-3.5 rounded-xl font-bold text-sm transition-all \${p.featured ? "bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/30" : "bg-gray-900 text-white hover:bg-gray-800"}\`}>
                  Start Free Trial
                </button>
                <ul className="mt-8 space-y-3">
                  {p.features.map((f, j) => (
                    <li key={j} className={\`flex items-center gap-2.5 text-sm \${p.featured ? "text-gray-300" : "text-gray-600"}\`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={p.featured ? "#818cf8" : "#6366f1"} strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
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
  description: "Feature comparison table with checkmarks across plan tiers",
  tags: ["saas", "startup", "business", "software", "platform", "service", "tech", "agency", "enterprise"],
  code: `export default function Pricing() {
  const plans = ["Free", "Pro", "Business"];
  const features = [
    { name: "Projects", values: ["3", "Unlimited", "Unlimited"] },
    { name: "Storage", values: ["1GB", "50GB", "500GB"] },
    { name: "Team members", values: ["1", "10", "Unlimited"] },
    { name: "Custom domains", values: [false, true, true] },
    { name: "API access", values: [false, true, true] },
    { name: "Advanced analytics", values: [false, true, true] },
    { name: "Priority support", values: [false, false, true] },
    { name: "SSO / SAML", values: [false, false, true] },
    { name: "SLA guarantee", values: [false, false, true] },
    { name: "Dedicated account manager", values: [false, false, true] },
  ];
  const prices = ["$0", "$49", "$149"];
  const periods = ["forever", "/month", "/month"];
  return (
    <section id="pricing" className="py-28 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Compare Plans</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Find Your Perfect Fit</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Every feature, every plan, side by side. No surprises.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="pb-6 pr-4 text-sm text-gray-500 font-medium w-1/4">Features</th>
                {plans.map((p, i) => (
                  <th key={i} className="pb-6 px-4 text-center">
                    <div className="text-lg font-bold text-gray-900">{p}</div>
                    <div className="flex items-baseline justify-center gap-0.5 mt-1">
                      <span className="text-3xl font-extrabold text-gray-900">{prices[i]}</span>
                      <span className="text-sm text-gray-400">{periods[i]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((f, i) => (
                <tr key={i} className={\`border-b border-gray-100 \${i % 2 === 0 ? "bg-gray-50/50" : ""}\`}>
                  <td className="py-4 pr-4 text-sm font-medium text-gray-700">{f.name}</td>
                  {f.values.map((v, j) => (
                    <td key={j} className="py-4 px-4 text-center text-sm">
                      {typeof v === "boolean" ? (
                        v ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" className="mx-auto"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" className="mx-auto"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        )
                      ) : (
                        <span className="font-semibold text-gray-900">{v}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-3 gap-6 mt-8 max-w-3xl mx-auto ml-auto" style={{marginLeft: "25%"}}>
          {plans.map((p, i) => (
            <button key={i} className={\`py-3 rounded-xl font-bold text-sm transition-all \${i === 1 ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/25" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}\`}>
              {i === 0 ? "Start Free" : i === 1 ? "Upgrade to Pro" : "Contact Sales"}
            </button>
          ))}
        </div>
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
