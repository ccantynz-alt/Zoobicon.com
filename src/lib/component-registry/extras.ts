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
