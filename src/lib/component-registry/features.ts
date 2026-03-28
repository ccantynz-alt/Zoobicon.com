import { registerComponent } from "./index";

// ── Features: Icon Grid ──
registerComponent({
  id: "features-icon-grid",
  name: "Icon Grid Features",
  category: "features",
  variant: "icon-grid",
  description: "3x2 grid with gradient icon backgrounds and hover lift effects",
  tags: ["modern", "saas", "startup", "software", "platform", "service", "business", "agency", "marketing"],
  code: `export default function Features() {
  const features = [
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
      title: "Blazing Fast Performance",
      desc: "Sub-50ms response times with edge computing. Your users get instant results no matter where they are on the planet.",
      gradient: "from-amber-400 to-orange-500",
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
      title: "Bank-Grade Security",
      desc: "SOC 2 Type II certified with AES-256 encryption, SSO, and role-based access control built in from day one.",
      gradient: "from-emerald-400 to-teal-500",
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>,
      title: "Global CDN Built In",
      desc: "Automatic edge caching across 300+ locations. Static assets, API responses, and dynamic content — all accelerated.",
      gradient: "from-blue-400 to-indigo-500",
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>,
      title: "Real-Time Analytics",
      desc: "Track conversions, user journeys, and revenue metrics with zero-delay dashboards. Make decisions with live data.",
      gradient: "from-violet-400 to-purple-500",
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
      title: "Team Collaboration",
      desc: "Real-time editing, threaded comments, and approval workflows. Ship faster with your entire team on the same page.",
      gradient: "from-pink-400 to-rose-500",
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14H4z"/></svg>,
      title: "AI-Powered Insights",
      desc: "Machine learning models analyze your data 24/7, surfacing anomalies and opportunities you would have missed.",
      gradient: "from-cyan-400 to-blue-500",
    },
  ];
  return (
    <section id="features" className="py-28 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Capabilities</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Everything You Need to Scale</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Powerful tools designed for teams that move fast and refuse to compromise on quality.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="group bg-white rounded-2xl p-8 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={\`w-12 h-12 rounded-xl bg-gradient-to-br \${f.gradient} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform\`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 leading-relaxed text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── Features: Alternating Rows ──
registerComponent({
  id: "features-alternating",
  name: "Alternating Features",
  category: "features",
  variant: "alternating",
  description: "Alternating image-text rows for storytelling. Great for product showcases and explanations",
  tags: ["product", "storytelling", "service", "agency", "creative", "portfolio", "restaurant", "food", "warm", "photography"],
  code: `export default function Features() {
  const features = [
    {
      title: "Design That Converts",
      desc: "Every pixel is intentional. Our data-driven design approach combines aesthetics with conversion psychology to turn visitors into customers.",
      img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&q=80",
      stats: [{ value: "3.2x", label: "Higher conversions" }, { value: "47%", label: "More engagement" }],
    },
    {
      title: "Analytics You Actually Use",
      desc: "No more drowning in data. See exactly which pages drive revenue, which campaigns convert, and what to double down on next.",
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80",
      stats: [{ value: "24/7", label: "Real-time monitoring" }, { value: "150+", label: "Tracked metrics" }],
    },
    {
      title: "Scale Without Limits",
      desc: "From 100 visitors to 10 million. Our infrastructure automatically scales to meet demand, so you never worry about traffic spikes.",
      img: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop&q=80",
      stats: [{ value: "99.99%", label: "Uptime guarantee" }, { value: "<50ms", label: "Response time" }],
    },
  ];
  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">Why Us</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Built for Results, Not Vanity</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">We obsess over the details so you can focus on what matters — growing your business.</p>
        </div>
        <div className="space-y-24">
          {features.map((f, i) => (
            <div key={i} className={\`grid lg:grid-cols-2 gap-16 items-center \${i % 2 === 1 ? "lg:direction-rtl" : ""}\`}>
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-8 text-lg">{f.desc}</p>
                <div className="flex gap-8">
                  {f.stats.map((s, j) => (
                    <div key={j}>
                      <div className="text-3xl font-extrabold text-violet-600">{s.value}</div>
                      <div className="text-sm text-gray-400 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img src={f.img} alt={f.title} className="w-full h-80 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── Features: Dark Cards ──
registerComponent({
  id: "features-cards-dark",
  name: "Dark Card Features",
  category: "features",
  variant: "cards-dark",
  description: "Dark themed cards with colored top borders. Perfect for tech, cyber, and developer products",
  tags: ["dark", "tech", "cyber", "developer", "saas", "software", "hacker", "security", "api"],
  code: `export default function Features() {
  const features = [
    {
      title: "Threat Detection",
      desc: "ML-powered anomaly detection identifies zero-day threats in real-time. 99.7% accuracy with near-zero false positives.",
      color: "bg-red-500",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    },
    {
      title: "Encrypted Pipeline",
      desc: "End-to-end AES-256 encryption for data at rest and in transit. FIPS 140-2 validated cryptographic modules.",
      color: "bg-emerald-500",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    },
    {
      title: "Compliance Automation",
      desc: "Auto-generate audit reports for SOC 2, HIPAA, GDPR, and ISO 27001. Stay compliant without the manual overhead.",
      color: "bg-blue-500",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    },
    {
      title: "Incident Response",
      desc: "Automated playbooks trigger within 200ms of detection. Isolate, contain, and remediate without human intervention.",
      color: "bg-amber-500",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    },
    {
      title: "API Security Gateway",
      desc: "Rate limiting, request validation, and bot detection at the edge. Block malicious traffic before it touches your origin.",
      color: "bg-violet-500",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    },
    {
      title: "24/7 SOC Team",
      desc: "Our security operations center monitors your infrastructure around the clock. Human experts + AI triage = fastest response times.",
      color: "bg-cyan-500",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    },
  ];
  return (
    <section id="features" className="py-28 px-6 bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-3">Platform</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Defense-in-Depth Security</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">Multiple layers of protection that work together to keep your infrastructure secure at every level.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="group bg-gray-900 rounded-xl p-7 border border-gray-800 hover:border-gray-700 transition-all duration-300 relative overflow-hidden">
              <div className={\`absolute top-0 left-0 right-0 h-0.5 \${f.color}\`} />
              <div className="text-gray-400 mb-4 group-hover:text-white transition-colors">{f.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── Features: Tabs ──
registerComponent({
  id: "features-tabs",
  name: "Tabbed Features",
  category: "features",
  variant: "tabs",
  description: "Tabbed interface switching between feature sets with icon, description, and image per tab",
  tags: ["saas", "software", "platform", "product", "tech", "startup", "dashboard", "app", "enterprise"],
  code: `export default function Features() {
  const [activeTab, setActiveTab] = React.useState(0);
  const tabs = [
    {
      label: "Workflow Automation",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>,
      title: "Eliminate Repetitive Work Forever",
      desc: "Build visual automation pipelines in minutes. Connect 200+ tools, set triggers, and let your workflows run on autopilot while your team focuses on creative strategy.",
      bullets: ["Visual drag-and-drop builder", "200+ integrations out of the box", "Conditional branching and loops", "Error handling with auto-retry"],
      img: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=700&h=440&fit=crop&q=80",
    },
    {
      label: "Team Analytics",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>,
      title: "Insights That Drive Real Decisions",
      desc: "Real-time dashboards surface the metrics that matter. Track team velocity, project health, and resource utilization without drowning in spreadsheets.",
      bullets: ["Live KPI dashboards", "Custom report builder", "Scheduled email digests", "Anomaly detection alerts"],
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&h=440&fit=crop&q=80",
    },
    {
      label: "Security & Compliance",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      title: "Enterprise Security Without the Complexity",
      desc: "SOC 2 and GDPR compliant out of the box. Role-based access, audit trails, and encrypted data at rest give your security team peace of mind.",
      bullets: ["SOC 2 Type II certified", "SAML SSO and SCIM provisioning", "Full audit log with 1-year retention", "Data residency controls"],
      img: "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=700&h=440&fit=crop&q=80",
    },
  ];
  const t = tabs[activeTab];
  return (
    <section id="features" className="py-28 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Platform</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">One Platform, Zero Compromise</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Everything your team needs to move faster, stay aligned, and deliver exceptional work.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={\`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 \${i === activeTab ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}\`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">{t.title}</h3>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">{t.desc}</p>
            <ul className="space-y-3">
              {t.bullets.map((b, j) => (
                <li key={j} className="flex items-center gap-3 text-gray-700">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-blue-600 flex-shrink-0"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <img src={t.img} alt={t.title} className="w-full h-[340px] object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Features: Bento Grid ──
registerComponent({
  id: "features-bento",
  name: "Bento Grid Features",
  category: "features",
  variant: "bento",
  description: "Apple-style bento grid with mixed card sizes, gradients, and visual hierarchy",
  tags: ["modern", "apple", "creative", "design", "premium", "startup", "saas", "portfolio", "agency"],
  code: `export default function Features() {
  return (
    <section id="features" className="py-28 px-6 bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-violet-400 uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Designed for What Comes Next</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">A new generation of tools built for teams that refuse to settle for yesterday&apos;s solutions.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Large card spans 2 columns */}
          <div className="group lg:col-span-2 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-10 relative overflow-hidden min-h-[300px] flex flex-col justify-end hover:shadow-2xl hover:shadow-violet-600/20 transition-all duration-500">
            <div className="absolute top-6 right-6 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Lightning-Fast Processing</h3>
              <p className="text-violet-200 leading-relaxed max-w-lg">Process millions of records in seconds with our distributed compute engine. Benchmarked at 47x faster than legacy solutions across every data type.</p>
            </div>
          </div>
          {/* Tall card */}
          <div className="group bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-violet-500/50 transition-all duration-300 flex flex-col justify-between min-h-[300px]">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Zero-Trust Security</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Every request authenticated, every action logged. End-to-end encryption with hardware-backed key management and automated compliance reporting.</p>
            </div>
          </div>
          {/* Standard card */}
          <div className="group bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-amber-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">99.99% Uptime SLA</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Multi-region active-active deployment with automatic failover. Your service stays online even during infrastructure incidents.</p>
          </div>
          {/* Standard card */}
          <div className="group bg-gray-900 rounded-3xl p-8 border border-gray-800 hover:border-cyan-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Global Edge Network</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Serve content from 300+ edge locations worldwide. Sub-30ms latency for 95% of the global population regardless of origin server location.</p>
          </div>
          {/* Standard card */}
          <div className="group bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-800 hover:border-rose-500/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Collaborative Workspaces</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Real-time multiplayer editing with presence indicators, threaded comments, and role-based permissions that scale from startup to enterprise.</p>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Features: Timeline ──
registerComponent({
  id: "features-timeline",
  name: "Timeline Features",
  category: "features",
  variant: "timeline",
  description: "Vertical timeline with alternating left/right cards connected by a center line",
  tags: ["process", "steps", "storytelling", "agency", "service", "consulting", "onboarding", "saas", "product"],
  code: `export default function Features() {
  const steps = [
    {
      step: "01",
      title: "Connect Your Data Sources",
      desc: "Link your existing tools in minutes. We integrate with 150+ platforms including Salesforce, HubSpot, Stripe, and Google Analytics — no engineering required.",
      color: "bg-blue-500",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
    },
    {
      step: "02",
      title: "AI Maps Your Customer Journey",
      desc: "Our machine learning engine automatically identifies friction points, drop-off moments, and hidden conversion opportunities across your entire funnel.",
      color: "bg-violet-500",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m16.36-5.36l-4.24 4.24M9.88 14.12L5.64 18.36m12.72 0l-4.24-4.24M9.88 9.88L5.64 5.64"/></svg>,
    },
    {
      step: "03",
      title: "Get Actionable Recommendations",
      desc: "Receive prioritized, specific suggestions — not vague advice. Each recommendation includes estimated revenue impact and implementation difficulty.",
      color: "bg-emerald-500",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>,
    },
    {
      step: "04",
      title: "Implement with One Click",
      desc: "Apply optimizations directly from the dashboard. A/B tests deploy automatically, copy changes push live, and layout adjustments render in real-time.",
      color: "bg-amber-500",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 14a1 1 0 01-.78-1.63l9.9-10.2a.5.5 0 01.86.46l-1.92 6.02A1 1 0 0013 10h7a1 1 0 01.78 1.63l-9.9 10.2a.5.5 0 01-.86-.46l1.92-6.02A1 1 0 0011 14H4z"/></svg>,
    },
    {
      step: "05",
      title: "Measure, Learn, Repeat",
      desc: "Track the impact of every change with statistically significant results. The system learns from outcomes and refines its next recommendations automatically.",
      color: "bg-rose-500",
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    },
  ];
  return (
    <section id="features" className="py-28 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">From Data to Revenue in 5 Steps</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">A proven optimization loop that compounds results month over month.</p>
        </div>
        <div className="relative">
          {/* Center line */}
          <div className="absolute left-1/2 transform -translate-x-px top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block" />
          <div className="space-y-12">
            {steps.map((s, i) => (
              <div key={i} className={\`relative flex flex-col md:flex-row items-center gap-8 \${i % 2 === 1 ? "md:flex-row-reverse" : ""}\`}>
                {/* Content card */}
                <div className={\`flex-1 \${i % 2 === 1 ? "md:text-right" : ""}\`}>
                  <div className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className={\`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-3 \${s.color.replace("bg-", "text-")}\`}>
                      <span>Step {s.step}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
                    <p className="text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
                {/* Center dot */}
                <div className={\`relative z-10 w-12 h-12 rounded-full \${s.color} flex items-center justify-center text-white shadow-lg flex-shrink-0\`}>
                  {s.icon}
                </div>
                {/* Spacer for alternating side */}
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Features: Comparison ──
registerComponent({
  id: "features-comparison",
  name: "Comparison Features",
  category: "features",
  variant: "comparison",
  description: "Before/after or old way vs new way comparison with check/cross icons",
  tags: ["saas", "marketing", "conversion", "landing", "startup", "software", "product", "business"],
  code: `export default function Features() {
  const comparisons = [
    { feature: "Setup time", old: "2-3 weeks of engineering", better: "5-minute guided wizard" },
    { feature: "Data integration", old: "Custom API work per source", better: "150+ pre-built connectors" },
    { feature: "Reporting", old: "Manual spreadsheet exports", better: "Real-time live dashboards" },
    { feature: "Team onboarding", old: "Weeks of training sessions", better: "Intuitive — productive day one" },
    { feature: "Scaling", old: "Re-architect at every stage", better: "Auto-scales to 10M+ records" },
    { feature: "Support", old: "Email tickets, 48h response", better: "Live chat, avg 4-minute response" },
    { feature: "Security", old: "DIY compliance, ongoing audits", better: "SOC 2 + GDPR built in" },
    { feature: "Cost", old: "$5K-15K/month enterprise contracts", better: "Starts at $49/month" },
  ];
  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-emerald-600 uppercase tracking-widest mb-3">Why Switch</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">The Old Way vs. The Better Way</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">See exactly what changes when you stop wrestling with legacy tools and start using a platform built for how teams actually work.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
            <div className="p-5 font-semibold text-gray-500 text-sm uppercase tracking-wider">Feature</div>
            <div className="p-5 font-semibold text-red-400 text-sm uppercase tracking-wider text-center">Legacy Tools</div>
            <div className="p-5 font-semibold text-emerald-600 text-sm uppercase tracking-wider text-center">With Us</div>
          </div>
          {/* Rows */}
          {comparisons.map((c, i) => (
            <div key={i} className={\`grid grid-cols-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors\`}>
              <div className="p-5 font-medium text-gray-900 text-sm flex items-center">{c.feature}</div>
              <div className="p-5 text-sm text-gray-400 text-center flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                <span>{c.old}</span>
              </div>
              <div className="p-5 text-sm text-gray-700 text-center flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                <span className="font-medium">{c.better}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <button className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/25">Start Your Free Trial</button>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Features: Numbered Steps ──
registerComponent({
  id: "features-numbered",
  name: "Numbered Steps Features",
  category: "features",
  variant: "numbered",
  description: "Numbered steps with connecting vertical line, progress indicator style",
  tags: ["process", "steps", "onboarding", "how-it-works", "saas", "service", "agency", "consulting", "startup"],
  code: `export default function Features() {
  const steps = [
    {
      num: "01",
      title: "Describe Your Vision",
      desc: "Tell us what you&apos;re building in plain English. Our AI understands context, industry terminology, and design intent — no technical specifications needed.",
      detail: "Average time: 30 seconds",
    },
    {
      num: "02",
      title: "AI Architects Your Solution",
      desc: "Seven specialized AI agents collaborate in real-time: strategy, branding, copywriting, architecture, development, SEO, and animation — each an expert in their domain.",
      detail: "7 agents, 95 seconds",
    },
    {
      num: "03",
      title: "Review and Refine",
      desc: "Preview your site across desktop, tablet, and mobile. Use the visual editor to adjust colors, swap sections, edit copy, or ask the AI for specific changes in natural language.",
      detail: "Unlimited revisions",
    },
    {
      num: "04",
      title: "Deploy to the World",
      desc: "One click deploys to a global CDN with automatic SSL, custom domain support, and built-in analytics. Your site is live, fast, and secure in under 5 seconds.",
      detail: "300+ edge locations",
    },
  ];
  return (
    <section id="features" className="py-28 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Four Steps to Launch</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">From idea to live website in under two minutes. No code, no templates, no compromises.</p>
        </div>
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-indigo-500 via-violet-500 to-fuchsia-500 hidden md:block" />
          <div className="space-y-12">
            {steps.map((s, i) => (
              <div key={i} className="group flex gap-8 items-start">
                {/* Number circle */}
                <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white font-bold text-sm">{s.num}</span>
                </div>
                {/* Content */}
                <div className="flex-1 pb-2">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{s.title}</h3>
                  <p className="text-gray-500 leading-relaxed mb-3">{s.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {s.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}`,
});
