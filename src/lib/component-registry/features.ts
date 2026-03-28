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
