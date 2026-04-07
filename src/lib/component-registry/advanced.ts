/**
 * Advanced Components for the Zoobicon Component Registry
 * 20 cutting-edge 2026/2027 pattern components — $100K agency quality
 */
import { registerComponent } from "./index";

// ── 1. Hero: Parallax ──
registerComponent({
  id: "hero-parallax",
  name: "Parallax Scrolling Hero",
  category: "hero",
  variant: "parallax",
  description: "Parallax scrolling hero with layered elements moving at different speeds. Premium depth effect.",
  tags: ["parallax", "scroll", "depth", "premium", "saas", "agency", "modern", "animated"],
  code: `export default function Hero() {
  const [scrollY, setScrollY] = React.useState(0);
  React.useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Layer 1: Far background orbs */}
      <div className="absolute inset-0 pointer-events-none" style={{ transform: \`translateY(\${scrollY * 0.1}px)\` }}>
        <div className="absolute top-20 left-[10%] w-96 h-96 bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-[15%] w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>
      {/* Layer 2: Mid grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ transform: \`translateY(\${scrollY * 0.25}px)\`, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none' stroke='%23fff' stroke-width='.5'/%3E%3C/svg%3E\")" }} />
      {/* Layer 3: Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center" style={{ transform: \`translateY(\${scrollY * 0.4}px)\` }}>
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-xs font-semibold border rounded-full bg-white/5 text-violet-300 border-violet-500/20 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          Introducing Parallax Engine v3
        </div>
        <h1 className="max-w-4xl text-5xl font-extrabold leading-tight tracking-tight text-white md:text-7xl lg:text-8xl">
          Build Experiences
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">That Move People</span>
        </h1>
        <p className="max-w-xl mt-6 text-lg leading-relaxed text-slate-400">
          Create immersive, scroll-driven interfaces that captivate your audience. Depth, motion, and purpose — all in one platform.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <button className="px-8 py-4 text-sm font-bold text-white rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:shadow-xl hover:shadow-violet-500/25 transition-all duration-300">
            Start Building Free
          </button>
          <button className="px-8 py-4 text-sm font-semibold border rounded-2xl text-slate-300 border-slate-700 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all">
            View Demos
          </button>
        </div>
      </div>
      {/* Layer 4: Foreground floating shapes */}
      <div className="absolute inset-0 pointer-events-none" style={{ transform: \`translateY(\${scrollY * 0.6}px)\` }}>
        <div className="absolute bottom-32 left-[20%] w-4 h-4 border border-cyan-500/30 rotate-45" />
        <div className="absolute bottom-48 right-[25%] w-6 h-6 border border-violet-500/20 rounded-full" />
        <div className="absolute bottom-64 left-[60%] w-3 h-3 bg-emerald-500/20 rounded-full" />
      </div>
    </section>
  );
}`,
});

// ── 2. Hero: 3D Card ──
registerComponent({
  id: "hero-3d-card",
  name: "3D Perspective Card Hero",
  category: "hero",
  variant: "3d-card",
  description: "Hero with a 3D perspective card that tilts on mouse movement via CSS transforms.",
  tags: ["3d", "interactive", "tilt", "perspective", "saas", "tech", "product", "modern"],
  code: `export default function Hero() {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    cardRef.current.style.transform = \`perspective(1000px) rotateY(\${x * 20}deg) rotateX(\${-y * 20}deg) scale3d(1.02, 1.02, 1.02)\`;
  };
  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)";
  };
  return (
    <section className="relative min-h-screen bg-gray-950 flex items-center justify-center px-6 py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_70%)]" />
      <div className="relative z-10 grid max-w-6xl gap-16 mx-auto lg:grid-cols-2 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-indigo-300 border rounded-full bg-indigo-500/10 border-indigo-500/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            Interactive 3D Experience
          </div>
          <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white lg:text-7xl">
            Your Product,
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">In Three Dimensions</span>
          </h1>
          <p className="max-w-md mt-6 text-lg leading-relaxed text-gray-400">
            Showcase your product with interactive depth. Cards that respond to movement create unforgettable first impressions.
          </p>
          <div className="flex flex-wrap gap-4 mt-10">
            <button className="px-8 py-4 text-sm font-bold text-white rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:shadow-lg hover:shadow-indigo-500/25 transition-all">Get Started</button>
            <button className="px-8 py-4 text-sm font-semibold border rounded-2xl text-gray-300 border-gray-700 hover:bg-white/5 transition-all">Learn More</button>
          </div>
        </div>
        <div className="hidden lg:flex justify-center" style={{ perspective: "1000px" }}>
          <div ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} className="relative w-full max-w-md p-8 transition-transform duration-200 ease-out border bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border-gray-700/50 shadow-2xl" style={{ transformStyle: "preserve-3d" }}>
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-indigo-500/20 via-transparent to-cyan-500/20 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
                </div>
                <div>
                  <div className="font-bold text-white">Analytics Pro</div>
                  <div className="text-xs text-gray-400">Real-time insights</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[{ label: "Revenue", value: "$48.2K", change: "+12.5%" }, { label: "Users", value: "2,847", change: "+8.3%" }, { label: "Conversion", value: "3.24%", change: "+2.1%" }, { label: "Sessions", value: "18.9K", change: "+15.7%" }].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-xs text-gray-500 mb-1">{s.label}</div>
                    <div className="text-lg font-bold text-white">{s.value}</div>
                    <div className="text-xs text-emerald-400 mt-1">{s.change}</div>
                  </div>
                ))}
              </div>
              <div className="h-20 rounded-xl bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-white/5 flex items-end px-3 pb-2 gap-1">
                {[40,65,45,80,60,90,70,85,55,75,95,80].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-indigo-500 to-cyan-400" style={{ height: \`\${h}%\` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── 3. Features: Accordion ──
registerComponent({
  id: "features-accordion",
  name: "Accordion Features",
  category: "features",
  variant: "accordion",
  description: "Expandable accordion features with smooth height animation. Clean and interactive.",
  tags: ["accordion", "expandable", "interactive", "clean", "saas", "product", "features"],
  code: `export default function Features() {
  const [openIndex, setOpenIndex] = React.useState(0);
  const items = [
    { title: "Automated Workflows", desc: "Set up complex workflows in minutes. Our visual builder lets you connect any service, trigger actions on events, and automate repetitive tasks without writing a single line of code.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { title: "Real-Time Collaboration", desc: "Work together seamlessly with your entire team. See changes in real-time, leave contextual comments, and resolve conflicts automatically. Built for distributed teams.", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
    { title: "Advanced Analytics", desc: "Understand every metric that matters. Custom dashboards, cohort analysis, funnel tracking, and predictive models — all updated in real-time with zero configuration.", icon: "M18 20V10M12 20V4M6 20v-6" },
    { title: "Enterprise Security", desc: "SOC 2 Type II certified with end-to-end encryption, SSO via SAML/OIDC, role-based access control, and complete audit logs. Your data never leaves your region.", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
    { title: "Global Edge Network", desc: "Deploy to 300+ edge locations worldwide. Sub-50ms latency for every user, automatic failover, and intelligent routing. Your app feels local, everywhere.", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" },
  ];
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-violet-700 bg-violet-50 rounded-full border border-violet-100">Built for Scale</div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight md:text-5xl">Everything you need to ship faster</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Five core capabilities that eliminate busywork and let your team focus on what matters.</p>
        </div>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className={\`rounded-2xl border transition-all duration-300 \${openIndex === i ? "border-violet-200 bg-violet-50/50 shadow-lg shadow-violet-100/50" : "border-gray-200 bg-white hover:border-gray-300"}\`}>
              <button onClick={() => setOpenIndex(openIndex === i ? -1 : i)} className="flex items-center justify-between w-full p-6 text-left">
                <div className="flex items-center gap-4">
                  <div className={\`flex items-center justify-center w-10 h-10 rounded-xl transition-colors \${openIndex === i ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"}\`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
                  </div>
                  <span className={\`text-lg font-semibold \${openIndex === i ? "text-violet-900" : "text-gray-900"}\`}>{item.title}</span>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={\`transition-transform duration-300 \${openIndex === i ? "rotate-180 text-violet-600" : "text-gray-400"}\`}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <div className={\`overflow-hidden transition-all duration-300 \${openIndex === i ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}\`}>
                <p className="px-6 pb-6 pl-20 text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── 4. Features: Hover Cards ──
registerComponent({
  id: "features-hover-cards",
  name: "Hover Reveal Feature Cards",
  category: "features",
  variant: "hover-cards",
  description: "Feature cards that expand and reveal more content on hover with smooth transitions.",
  tags: ["hover", "cards", "interactive", "reveal", "saas", "agency", "modern", "premium"],
  code: `export default function Features() {
  const features = [
    { title: "Smart Automation", desc: "Automate repetitive workflows with AI-powered triggers that learn from your patterns.", extended: "Reduce manual work by 80%. Our ML models analyze your usage and suggest automations automatically.", icon: "M13 10V3L4 14h7v7l9-11h-7z", gradient: "from-amber-500 to-orange-600" },
    { title: "Team Workspaces", desc: "Organize projects, share resources, and collaborate in real-time across your entire organization.", extended: "Unlimited workspaces with granular permissions. Integrate with Slack, Teams, and 200+ tools.", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", gradient: "from-violet-500 to-purple-600" },
    { title: "Data Pipeline", desc: "Connect any data source, transform in real-time, and deliver insights to every dashboard.", extended: "Process 10M+ events per second. Schema validation, dead-letter queues, and automatic retries built in.", icon: "M22 12h-4l-3 9L9 3l-3 9H2", gradient: "from-cyan-500 to-blue-600" },
    { title: "Edge Compute", desc: "Run serverless functions at 300+ edge locations. Sub-50ms response times globally.", extended: "Auto-scaling from 0 to 1M requests. Pay only for compute you use. No cold starts.", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z", gradient: "from-emerald-500 to-teal-600" },
    { title: "Observability", desc: "Full-stack monitoring with traces, metrics, and logs unified in a single pane of glass.", extended: "AI-powered anomaly detection, SLO tracking, and automated incident response. 99.99% uptime.", icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z", gradient: "from-rose-500 to-pink-600" },
    { title: "Compliance", desc: "SOC 2, HIPAA, GDPR, and ISO 27001 compliance built into every layer of the platform.", extended: "Automated audit trails, data residency controls, and configurable retention policies.", icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", gradient: "from-indigo-500 to-blue-600" },
  ];
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-gray-600 bg-white rounded-full border border-gray-200 shadow-sm">Platform Capabilities</div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight md:text-5xl">Hover to discover more</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Six pillars that power the most ambitious engineering teams in the world.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div key={i} className="group relative p-8 bg-white rounded-2xl border border-gray-200 hover:border-transparent hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 hover:-translate-y-1 overflow-hidden">
              <div className={\`absolute inset-0 bg-gradient-to-br \${f.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500\`} />
              <div className={\`relative z-10 flex items-center justify-center w-12 h-12 mb-6 rounded-2xl bg-gradient-to-br \${f.gradient} text-white shadow-lg\`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
              </div>
              <h3 className="relative z-10 text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
              <p className="relative z-10 text-gray-500 leading-relaxed mb-0 group-hover:mb-3 transition-all duration-300">{f.desc}</p>
              <div className="relative z-10 max-h-0 overflow-hidden opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-500">
                <p className="text-sm text-gray-400 leading-relaxed pt-2 border-t border-gray-100">{f.extended}</p>
              </div>
              <div className="relative z-10 mt-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                <span className={\`text-sm font-semibold bg-gradient-to-r \${f.gradient} bg-clip-text text-transparent\`}>Learn more &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── 5. Testimonials: Carousel ──
registerComponent({
  id: "testimonials-carousel",
  name: "Auto-Scrolling Testimonial Carousel",
  category: "testimonials",
  variant: "carousel",
  description: "Auto-scrolling testimonial carousel with pause on hover and dot navigation.",
  tags: ["carousel", "auto-scroll", "testimonials", "social-proof", "saas", "agency", "modern"],
  code: `export default function Testimonials() {
  const [active, setActive] = React.useState(0);
  const testimonials = [
    { name: "Sarah Chen", role: "CTO at Meridian Labs", quote: "We migrated our entire infrastructure in 3 days. The automation tools saved our team 400+ engineering hours in the first quarter alone.", avatar: "women/44", rating: 5 },
    { name: "Marcus Rivera", role: "VP Engineering at Forge", quote: "The observability suite caught a critical memory leak before it hit production. That single incident saved us an estimated $200K in downtime.", avatar: "men/32", rating: 5 },
    { name: "Aisha Patel", role: "Head of Platform at Quantum", quote: "Our deployment frequency went from weekly to 50+ times per day. The developer experience is genuinely transformative.", avatar: "women/68", rating: 5 },
    { name: "James Whitfield", role: "CEO at Stratos Cloud", quote: "Consolidating our toolchain onto one platform cut our infrastructure costs by 40% while improving reliability across the board.", avatar: "men/52", rating: 5 },
  ];
  React.useEffect(() => {
    const timer = setInterval(() => setActive(a => (a + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);
  const t = testimonials[active];
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-xs font-semibold text-cyan-300 bg-cyan-500/10 rounded-full border border-cyan-500/20">Trusted by Industry Leaders</div>
        <h2 className="text-4xl font-extrabold text-white tracking-tight md:text-5xl mb-16">What our customers say</h2>
        <div className="relative" onMouseEnter={() => {}} onMouseLeave={() => {}}>
          <div className="absolute -inset-4 bg-gradient-to-br from-violet-500/10 to-cyan-500/10 rounded-3xl blur-2xl" />
          <div className="relative p-10 md:p-14 bg-slate-900/80 backdrop-blur-sm rounded-3xl border border-slate-800">
            <div className="flex justify-center gap-1 mb-8">
              {Array.from({ length: t.rating }).map((_, i) => (
                <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
            </div>
            <blockquote className="text-xl md:text-2xl text-white leading-relaxed font-medium mb-8 max-w-2xl mx-auto">
              &ldquo;{t.quote}&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <img src={\`https://randomuser.me/api/portraits/\${t.avatar}.jpg\`} alt={t.name} className="w-12 h-12 rounded-full border-2 border-slate-700 object-cover" />
              <div className="text-left">
                <div className="font-semibold text-white">{t.name}</div>
                <div className="text-sm text-slate-400">{t.role}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-3 mt-8">
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className={\`w-3 h-3 rounded-full transition-all duration-300 \${active === i ? "bg-cyan-400 w-8" : "bg-slate-600 hover:bg-slate-500"}\`} />
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── 6. Testimonials: Metrics ──
registerComponent({
  id: "testimonials-metrics",
  name: "Testimonials with Metrics",
  category: "testimonials",
  variant: "metrics",
  description: "Testimonials paired with large metric numbers — 98% satisfaction, 4.9/5, 50K+ users.",
  tags: ["metrics", "numbers", "social-proof", "enterprise", "b2b", "saas", "trust"],
  code: `export default function Testimonials() {
  const metrics = [
    { value: "98%", label: "Customer satisfaction", desc: "Based on 12,000+ quarterly surveys" },
    { value: "4.9/5", label: "Average rating", desc: "Across G2, Capterra, and TrustRadius" },
    { value: "50K+", label: "Active teams", desc: "From startups to Fortune 500" },
    { value: "99.99%", label: "Uptime SLA", desc: "Guaranteed with financial credits" },
  ];
  const quotes = [
    { name: "Elena Rodriguez", role: "Director of Engineering, Apex Corp", text: "The platform paid for itself in the first week. Our deployment pipeline went from 45 minutes to under 3.", avatar: "women/33" },
    { name: "David Kim", role: "CTO, NovaTech Solutions", text: "We evaluated 12 platforms before choosing this one. Nothing else came close on reliability and developer experience.", avatar: "men/45" },
  ];
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100">Proven Results</div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight md:text-5xl">Numbers that speak for themselves</h2>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-16 md:grid-cols-4">
          {metrics.map((m, i) => (
            <div key={i} className="p-6 text-center rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">{m.value}</div>
              <div className="text-sm font-semibold text-gray-900 mb-1">{m.label}</div>
              <div className="text-xs text-gray-400">{m.desc}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {quotes.map((q, i) => (
            <div key={i} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6">&ldquo;{q.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <img src={\`https://randomuser.me/api/portraits/\${q.avatar}.jpg\`} alt={q.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{q.name}</div>
                  <div className="text-xs text-gray-400">{q.role}</div>
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

// ── 7. Pricing: Toggle ──
registerComponent({
  id: "pricing-toggle",
  name: "Monthly/Annual Toggle Pricing",
  category: "pricing",
  variant: "toggle",
  description: "Monthly/Annual toggle pricing with savings badge and animated switch.",
  tags: ["pricing", "toggle", "annual", "monthly", "saas", "subscription", "plans"],
  code: `export default function Pricing() {
  const [annual, setAnnual] = React.useState(true);
  const plans = [
    { name: "Starter", desc: "For individuals and small projects", monthly: 19, annual: 15, features: ["5 projects", "10GB storage", "Basic analytics", "Email support", "API access"], cta: "Start Free Trial", popular: false },
    { name: "Pro", desc: "For growing teams that need more", monthly: 49, annual: 39, features: ["Unlimited projects", "100GB storage", "Advanced analytics", "Priority support", "API access", "Custom domains", "Team collaboration"], cta: "Start Free Trial", popular: true },
    { name: "Enterprise", desc: "For organizations at scale", monthly: 149, annual: 119, features: ["Everything in Pro", "Unlimited storage", "Custom analytics", "24/7 phone support", "Dedicated CSM", "SSO & SAML", "SLA guarantee", "Custom integrations"], cta: "Contact Sales", popular: false },
  ];
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-violet-700 bg-violet-50 rounded-full border border-violet-100">Simple Pricing</div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight md:text-5xl">Plans that grow with you</h2>
          <p className="mt-4 text-lg text-gray-500">Start free. Upgrade when you need to. No hidden fees.</p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={\`text-sm font-medium \${!annual ? "text-gray-900" : "text-gray-400"}\`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className="relative w-14 h-7 rounded-full bg-violet-600 transition-colors p-1">
              <div className={\`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 \${annual ? "translate-x-7" : "translate-x-0"}\`} />
            </button>
            <span className={\`text-sm font-medium \${annual ? "text-gray-900" : "text-gray-400"}\`}>Annual</span>
            {annual && <span className="px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">Save 20%</span>}
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-3 items-start">
          {plans.map((plan, i) => (
            <div key={i} className={\`relative p-8 rounded-3xl border transition-all duration-300 hover:-translate-y-1 \${plan.popular ? "bg-white border-violet-200 shadow-xl shadow-violet-100/50 ring-2 ring-violet-600" : "bg-white border-gray-200 hover:shadow-lg"}\`}>
              {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full shadow-lg">Most Popular</div>}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-gray-500 mb-6">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-5xl font-extrabold text-gray-900">${annual ? plan.annual : plan.monthly}</span>
                <span className="text-gray-400">/mo</span>
              </div>
              <button className={\`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 \${plan.popular ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-violet-500/25" : "bg-gray-100 text-gray-900 hover:bg-gray-200"}\`}>
                {plan.cta}
              </button>
              <ul className="mt-8 space-y-3">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-center gap-3 text-sm text-gray-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={plan.popular ? "#7c3aed" : "#10b981"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
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

// ── 8. Stats: Gradient ──
registerComponent({
  id: "stats-gradient",
  name: "Gradient Stats Section",
  category: "stats",
  variant: "gradient",
  description: "Stats section with gradient backgrounds, large numbers, and subtle hover animations.",
  tags: ["stats", "gradient", "numbers", "metrics", "enterprise", "saas", "trust"],
  code: `export default function Stats() {
  const stats = [
    { value: "10M+", label: "API Requests Daily", desc: "Processed with 99.99% reliability", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { value: "150+", label: "Countries Served", desc: "Edge nodes on every continent", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" },
    { value: "4.9/5", label: "Customer Rating", desc: "Based on 8,400+ verified reviews", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" },
    { value: "< 50ms", label: "Avg Response Time", desc: "P99 latency across all regions", icon: "M12 2v10l4.24 4.24" },
  ];
  return (
    <section className="relative py-24 px-6 overflow-hidden bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.1),transparent_60%)]" />
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-white tracking-tight md:text-5xl">Built for performance at any scale</h2>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">Infrastructure that grows with your ambition. No compromises.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="group relative p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-violet-500/30 transition-all duration-500 hover:-translate-y-1">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/0 to-cyan-500/0 group-hover:from-violet-500/5 group-hover:to-cyan-500/5 transition-all duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-center w-12 h-12 mb-6 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/20">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400"><path d={s.icon} /></svg>
                </div>
                <div className="text-4xl font-extrabold text-white mb-2 tracking-tight">{s.value}</div>
                <div className="text-sm font-semibold text-slate-300 mb-1">{s.label}</div>
                <div className="text-xs text-slate-500">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── 9. CTA: Newsletter ──
registerComponent({
  id: "cta-newsletter",
  name: "Newsletter Signup CTA",
  category: "cta",
  variant: "newsletter",
  description: "Newsletter signup CTA with email input, social proof, and subscriber count.",
  tags: ["newsletter", "email", "signup", "cta", "marketing", "content", "blog"],
  code: `export default function Cta() {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="relative p-12 md:p-16 rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-white/80 bg-white/10 rounded-full border border-white/20 backdrop-blur-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
              Weekly Insights
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">Stay ahead of the curve</h2>
            <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">Join 50,000+ founders, engineers, and product leaders who get our weekly breakdown of trends, tools, and tactics.</p>
            {submitted ? (
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                <span className="text-white font-semibold">You&apos;re in! Check your inbox.</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 text-sm" />
                <button onClick={() => email && setSubmitted(true)} className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-xl hover:bg-white/90 transition-colors text-sm whitespace-nowrap shadow-lg">
                  Subscribe Free
                </button>
              </div>
            )}
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="flex -space-x-2">
                {[11,26,44,52,68].map(n => (
                  <img key={n} src={\`https://randomuser.me/api/portraits/\${n % 2 === 0 ? "women" : "men"}/\${n}.jpg\`} alt="" className="w-7 h-7 rounded-full border-2 border-indigo-600 object-cover" />
                ))}
              </div>
              <span className="text-sm text-white/60">Joined by teams at Stripe, Vercel, Linear</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── 10. CTA: App Download ──
registerComponent({
  id: "cta-app-download",
  name: "App Download CTA",
  category: "cta",
  variant: "app-download",
  description: "App download CTA with phone mockup, App Store and Play Store badges.",
  tags: ["app", "download", "mobile", "ios", "android", "cta", "product"],
  code: `export default function Cta() {
  return (
    <section className="py-24 px-6 bg-gray-950 overflow-hidden">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-cyan-300 bg-cyan-500/10 rounded-full border border-cyan-500/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
            Available on iOS &amp; Android
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6">
            Your entire workflow,
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">in your pocket</span>
          </h2>
          <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-lg">
            Manage projects, review dashboards, approve requests, and stay connected with your team — all from your phone. Real-time sync, offline support, biometric auth.
          </p>
          <div className="flex flex-wrap gap-4 mb-10">
            <button className="flex items-center gap-3 px-6 py-3.5 bg-white rounded-xl hover:bg-gray-100 transition-colors group">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#000"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <div className="text-left">
                <div className="text-[10px] text-gray-500 leading-none">Download on the</div>
                <div className="text-sm font-semibold text-gray-900 leading-tight">App Store</div>
              </div>
            </button>
            <button className="flex items-center gap-3 px-6 py-3.5 bg-white rounded-xl hover:bg-gray-100 transition-colors group">
              <svg width="20" height="22" viewBox="0 0 20 22" fill="none"><path d="M1 1l10 10L1 21" fill="#4285F4"/><path d="M1 1l10 10 5-5.5L5.5 0" fill="#34A853"/><path d="M1 21l10-10 5 5.5L5.5 22" fill="#EA4335"/><path d="M16 5.5L11 11l5 5.5 3.5-5.5L16 5.5z" fill="#FBBC05"/></svg>
              <div className="text-left">
                <div className="text-[10px] text-gray-500 leading-none">Get it on</div>
                <div className="text-sm font-semibold text-gray-900 leading-tight">Google Play</div>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg> Free to download</span>
            <span className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg> No ads</span>
            <span className="flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg> Offline mode</span>
          </div>
        </div>
        <div className="relative hidden lg:flex justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-full blur-[100px]" />
          <div className="relative w-72 h-[580px] bg-gray-900 rounded-[3rem] border-4 border-gray-800 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-950 rounded-b-2xl" />
            <div className="p-6 pt-10">
              <div className="flex items-center justify-between mb-6">
                <div className="text-white font-bold text-lg">Dashboard</div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500" />
              </div>
              <div className="space-y-3 mb-6">
                {[{ label: "Revenue", value: "$48.2K", pct: 75, color: "from-cyan-500 to-blue-500" }, { label: "Users", value: "2,847", pct: 60, color: "from-violet-500 to-purple-500" }, { label: "Growth", value: "+23%", pct: 85, color: "from-emerald-500 to-teal-500" }].map((m, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-400">{m.label}</span>
                      <span className="text-white font-bold">{m.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className={\`h-full rounded-full bg-gradient-to-r \${m.color}\`} style={{ width: \`\${m.pct}%\` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-32 rounded-2xl bg-white/5 border border-white/5 flex items-end px-3 pb-3 gap-1.5">
                {[30,50,35,70,45,80,55,75,40,65,90,70].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-cyan-500 to-emerald-400 opacity-80" style={{ height: \`\${h}%\` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── 11. Footer: SaaS ──
registerComponent({
  id: "footer-saas",
  name: "Modern SaaS Footer",
  category: "footer",
  variant: "saas",
  description: "Modern SaaS footer with gradient top border, newsletter input, social links, and legal.",
  tags: ["footer", "saas", "modern", "newsletter", "social", "startup", "tech"],
  code: `export default function Footer() {
  const columns = [
    { title: "Product", links: ["Features", "Pricing", "Changelog", "Integrations", "API Docs"] },
    { title: "Company", links: ["About", "Blog", "Careers", "Press", "Partners"] },
    { title: "Resources", links: ["Documentation", "Guides", "Templates", "Community", "Status"] },
    { title: "Legal", links: ["Privacy", "Terms", "Security", "GDPR", "Cookies"] },
  ];
  return (
    <footer className="relative bg-gray-950 pt-px">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="grid gap-12 lg:grid-cols-6 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
              </div>
              <span className="text-white font-bold text-lg">Acme</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-xs">The modern platform for teams that ship fast. Build, deploy, and scale without the complexity.</p>
            <div className="flex items-center gap-3">
              {["M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z", "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z", "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"].map((path, i) => (
                <a key={i} href="#" className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-violet-500/30 transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
                </a>
              ))}
            </div>
          </div>
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link, li) => (
                  <li key={li}><a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">&copy; 2026 Acme Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-500">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}`,
});

// ── 12. Footer: Mega ──
registerComponent({
  id: "footer-mega",
  name: "Mega Footer",
  category: "footer",
  variant: "mega",
  description: "Mega footer with 5-6 columns, company info, product links, resources, legal, and contact.",
  tags: ["footer", "mega", "enterprise", "corporate", "comprehensive", "large"],
  code: `export default function Footer() {
  const sections = [
    { title: "Platform", links: ["Website Builder", "Hosting", "Domains", "Email", "Analytics", "CRM", "Invoicing"] },
    { title: "Solutions", links: ["Startups", "Agencies", "Enterprise", "E-commerce", "SaaS", "Non-profit"] },
    { title: "Developers", links: ["API Reference", "SDKs", "Webhooks", "CLI Tools", "Open Source", "Status Page"] },
    { title: "Resources", links: ["Blog", "Guides", "Templates", "Community", "Podcast", "Newsletter"] },
    { title: "Company", links: ["About Us", "Careers", "Press Kit", "Contact", "Partners"] },
  ];
  return (
    <footer className="bg-gray-950 pt-20 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-10 lg:grid-cols-7 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <span className="text-xl font-bold text-white">Acme Platform</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">Everything you need to build, launch, and grow your business online. One platform, zero complexity.</p>
            <div className="space-y-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>
                hello@acmeplatform.com
              </div>
              <div className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                San Francisco, CA
              </div>
            </div>
          </div>
          {sections.map((s, i) => (
            <div key={i}>
              <h4 className="text-sm font-semibold text-white mb-4 tracking-wide uppercase">{s.title}</h4>
              <ul className="space-y-2.5">
                {s.links.map((link, li) => (
                  <li key={li}><a href="#" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-gray-600">&copy; 2026 Acme Platform, Inc. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"].map((link, i) => (
                <a key={i} href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">{link}</a>
              ))}
            </div>
            <div className="flex items-center gap-4">
              {["M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5", "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z", "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"].map((path, i) => (
                <a key={i} href="#" className="text-gray-600 hover:text-white transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}`,
});

// ── 13. About: Team ──
registerComponent({
  id: "about-team",
  name: "Team Section",
  category: "about",
  variant: "team",
  description: "Team section with member cards, roles, photo placeholders, social links, and hover effects.",
  tags: ["team", "about", "people", "culture", "company", "agency", "startup"],
  code: `export default function About() {
  const team = [
    { name: "Alexandra Chen", role: "CEO & Co-founder", bio: "Previously VP Engineering at Stripe. Stanford CS.", avatar: "women/44", socials: ["twitter", "linkedin"] },
    { name: "Marcus Rivera", role: "CTO & Co-founder", bio: "Ex-Google, built infra serving 1B+ requests/day.", avatar: "men/32", socials: ["twitter", "github"] },
    { name: "Priya Sharma", role: "VP of Product", bio: "Former product lead at Notion. Shipped to 30M+ users.", avatar: "women/68", socials: ["twitter", "linkedin"] },
    { name: "James Whitfield", role: "VP of Engineering", bio: "Built and scaled platform teams at Datadog and Cloudflare.", avatar: "men/52", socials: ["github", "linkedin"] },
    { name: "Sarah Kim", role: "Head of Design", bio: "Design systems at Figma. RISD alumni.", avatar: "women/33", socials: ["twitter", "dribbble"] },
    { name: "David Okafor", role: "Head of Sales", bio: "Scaled ARR from $0 to $50M at two previous startups.", avatar: "men/45", socials: ["twitter", "linkedin"] },
  ];
  const socialIcons: Record<string, string> = {
    twitter: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5",
    linkedin: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z",
    github: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77",
    dribbble: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z",
  };
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-violet-700 bg-violet-50 rounded-full border border-violet-100">Our Team</div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight md:text-5xl">Meet the people behind the product</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">A team of operators, engineers, and designers who have built and scaled some of the most impactful products in tech.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {team.map((m, i) => (
            <div key={i} className="group relative p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-100/50 hover:border-violet-100 transition-all duration-500 hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-4">
                <img src={\`https://randomuser.me/api/portraits/\${m.avatar}.jpg\`} alt={m.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm group-hover:shadow-md transition-shadow" />
                <div>
                  <h3 className="font-bold text-gray-900">{m.name}</h3>
                  <p className="text-sm text-violet-600 font-medium">{m.role}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{m.bio}</p>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                {m.socials.map((s, si) => (
                  <a key={si} href="#" className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-400 hover:bg-violet-100 hover:text-violet-600 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={socialIcons[s] || ""} /></svg>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── 14. About: Timeline ──
registerComponent({
  id: "about-timeline",
  name: "Company Timeline",
  category: "about",
  variant: "timeline",
  description: "Company timeline with alternating left/right events, dates, icons, and connecting line.",
  tags: ["timeline", "history", "about", "company", "milestones", "story"],
  code: `export default function About() {
  const events = [
    { year: "2021", title: "Founded in San Francisco", desc: "Two engineers left Stripe with a vision: make infrastructure invisible. First commit pushed from a coffee shop on Valencia Street.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { year: "2022", title: "Seed Round — $4.2M", desc: "Led by Sequoia. First 100 customers onboarded. Launched API v1 with 99.95% uptime from day one.", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z" },
    { year: "2023", title: "Series A — $28M", desc: "Expanded to 15 countries. Launched enterprise tier. Processed first 1 billion API requests.", icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" },
    { year: "2024", title: "10,000 Teams", desc: "Crossed 10,000 paying teams. Opened offices in London and Singapore. Launched partner ecosystem.", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" },
    { year: "2025", title: "Series B — $120M", desc: "Valued at $1.2B. AI-powered automation suite launched. 50,000+ developers on the platform.", icon: "M18 20V10M12 20V4M6 20v-6" },
    { year: "2026", title: "Global Expansion", desc: "Edge network in 150+ countries. 10M+ API requests daily. Named in Forbes Cloud 100.", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  ];
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-full border border-indigo-100">Our Journey</div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight md:text-5xl">From idea to industry leader</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">Six years of building, learning, and scaling — one milestone at a time.</p>
        </div>
        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-200 via-violet-300 to-indigo-200 hidden md:block" />
          <div className="space-y-12">
            {events.map((e, i) => (
              <div key={i} className={\`relative flex flex-col md:flex-row items-center gap-8 \${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}\`}>
                <div className={\`flex-1 \${i % 2 === 0 ? "md:text-right" : "md:text-left"}\`}>
                  <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all duration-300">
                    <div className="text-sm font-bold text-indigo-600 mb-2">{e.year}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{e.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{e.desc}</p>
                  </div>
                </div>
                <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={e.icon} /></svg>
                </div>
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

// ── 15. Process: Steps ──
registerComponent({
  id: "process-steps",
  name: "How It Works Process Steps",
  category: "misc",
  variant: "process-steps",
  description: "How-it-works process with numbered steps, icons, connecting arrows, and descriptions.",
  tags: ["process", "steps", "how-it-works", "flow", "onboarding", "saas", "product"],
  code: `export default function Misc() {
  const steps = [
    { num: "01", title: "Describe your vision", desc: "Tell us about your business, your audience, and your goals. Our AI analyzes thousands of successful sites in your industry.", icon: "M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z", color: "from-violet-500 to-indigo-600" },
    { num: "02", title: "AI builds your site", desc: "Watch as our engine assembles 100+ premium components, customized with your brand, copy, and imagery. Full site in under 30 seconds.", icon: "M13 10V3L4 14h7v7l9-11h-7z", color: "from-cyan-500 to-blue-600" },
    { num: "03", title: "Customize everything", desc: "Fine-tune every section with our visual editor. Change colors, swap components, edit copy — all in real-time with instant preview.", icon: "M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z", color: "from-emerald-500 to-teal-600" },
    { num: "04", title: "Launch and grow", desc: "Deploy to production in one click. Custom domain, SSL, analytics, and SEO — all handled automatically. Start getting traffic in minutes.", icon: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z", color: "from-amber-500 to-orange-600" },
  ];
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full border border-gray-200">How It Works</div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight md:text-5xl">Four steps to your perfect site</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">No code, no design skills, no weeks of waiting. Just describe what you want and watch it come to life.</p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={i} className="relative group">
              {i < steps.length - 1 && (
                <div className="absolute top-12 left-[calc(50%+2rem)] right-0 h-px bg-gradient-to-r from-gray-200 to-transparent hidden lg:block" />
              )}
              <div className="relative p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-100/50 hover:border-gray-200 transition-all duration-500 hover:-translate-y-1 text-center">
                <div className={\`inline-flex items-center justify-center w-14 h-14 mb-6 rounded-2xl bg-gradient-to-br \${s.color} text-white shadow-lg\`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
                </div>
                <div className="text-xs font-bold text-gray-300 mb-2 tracking-widest">{s.num}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── 16. Integrations Grid ──
registerComponent({
  id: "integrations-grid",
  name: "Integration Partners Grid",
  category: "misc",
  variant: "integrations",
  description: "Integration/partner logo grid with category filters, hover tooltips, and status badges.",
  tags: ["integrations", "partners", "logos", "ecosystem", "api", "saas", "enterprise"],
  code: `export default function Misc() {
  const [filter, setFilter] = React.useState("all");
  const categories = ["all", "analytics", "payments", "communication", "storage", "auth"];
  const integrations = [
    { name: "Stripe", cat: "payments", desc: "Payment processing", color: "#635bff" },
    { name: "Slack", cat: "communication", desc: "Team messaging", color: "#4A154B" },
    { name: "Google Analytics", cat: "analytics", desc: "Web analytics", color: "#E37400" },
    { name: "AWS S3", cat: "storage", desc: "Cloud storage", color: "#FF9900" },
    { name: "Auth0", cat: "auth", desc: "Authentication", color: "#EB5424" },
    { name: "Twilio", cat: "communication", desc: "SMS & Voice", color: "#F22F46" },
    { name: "Mixpanel", cat: "analytics", desc: "Product analytics", color: "#7856FF" },
    { name: "PayPal", cat: "payments", desc: "Payment gateway", color: "#003087" },
    { name: "Supabase", cat: "storage", desc: "Backend-as-a-service", color: "#3ECF8E" },
    { name: "Okta", cat: "auth", desc: "Identity management", color: "#007DC1" },
    { name: "SendGrid", cat: "communication", desc: "Email delivery", color: "#1A82E2" },
    { name: "Amplitude", cat: "analytics", desc: "Behavioral analytics", color: "#1E61E0" },
  ];
  const filtered = filter === "all" ? integrations : integrations.filter(i => i.cat === filter);
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-indigo-700 bg-indigo-50 rounded-full border border-indigo-100">Ecosystem</div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight md:text-5xl">Connects to everything you use</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">200+ integrations and growing. Connect your existing stack in minutes.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} className={\`px-4 py-2 text-sm font-medium rounded-full transition-all \${filter === cat ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600"}\`}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((integ, i) => (
            <div key={i} className="group relative p-6 bg-white rounded-2xl border border-gray-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/30 transition-all duration-300 hover:-translate-y-1 text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-xl border border-gray-100 group-hover:border-transparent group-hover:shadow-md transition-all" style={{ backgroundColor: integ.color + "10" }}>
                <span className="text-lg font-bold" style={{ color: integ.color }}>{integ.name.charAt(0)}</span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">{integ.name}</h4>
              <p className="text-xs text-gray-400">{integ.desc}</p>
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400" title="Active" />
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <button className="px-6 py-3 text-sm font-semibold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">View All 200+ Integrations</button>
        </div>
      </div>
    </section>
  );
}`,
});

// ── 17. Dashboard Preview ──
registerComponent({
  id: "dashboard-preview",
  name: "Product Dashboard Preview",
  category: "misc",
  variant: "dashboard",
  description: "Product dashboard preview section with feature callouts and annotated UI mockup.",
  tags: ["dashboard", "product", "preview", "saas", "app", "tech", "demo", "showcase"],
  code: `export default function Misc() {
  const features = [
    { title: "Real-time metrics", desc: "See every KPI update live as events flow through your pipeline." },
    { title: "Custom dashboards", desc: "Drag-and-drop widgets to build the exact view your team needs." },
    { title: "Smart alerts", desc: "AI-powered anomaly detection warns you before issues become incidents." },
  ];
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-violet-700 bg-violet-50 rounded-full border border-violet-100">Product Tour</div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight md:text-5xl">See the dashboard in action</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">One pane of glass for your entire operation. Built for teams who need answers, not dashboards.</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-br from-violet-100/50 to-indigo-100/50 rounded-3xl blur-2xl" />
          <div className="relative rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-3 text-xs text-gray-400 font-mono">app.acmeplatform.com/dashboard</span>
            </div>
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Overview</h3>
                  <p className="text-sm text-gray-400">Last 30 days</p>
                </div>
                <div className="flex gap-2">
                  {["1D", "7D", "30D", "90D"].map((p, i) => (
                    <button key={i} className={\`px-3 py-1.5 text-xs font-medium rounded-lg \${i === 2 ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-600"}\`}>{p}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[{ label: "Total Revenue", value: "$284,921", change: "+23.5%", up: true }, { label: "Active Users", value: "18,472", change: "+12.1%", up: true }, { label: "Conversion Rate", value: "3.24%", change: "+0.8%", up: true }, { label: "Avg. Session", value: "4m 32s", change: "-0.3%", up: false }].map((m, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-xs text-gray-400 mb-1">{m.label}</div>
                    <div className="text-xl font-bold text-gray-900">{m.value}</div>
                    <div className={\`text-xs mt-1 \${m.up ? "text-emerald-600" : "text-red-500"}\`}>{m.change}</div>
                  </div>
                ))}
              </div>
              <div className="h-48 rounded-xl bg-gradient-to-b from-violet-50 to-white border border-gray-100 flex items-end px-4 pb-4 gap-2">
                {[25,40,35,55,45,70,50,65,80,60,75,90,70,85,65,80,95,75,88,72,82,68,78,92].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-500 to-indigo-400 opacity-70 hover:opacity-100 transition-opacity" style={{ height: \`\${h}%\` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3 mt-12">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-violet-100 text-violet-600 shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1">{f.title}</h4>
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

// ── 18. Screenshots Showcase ──
registerComponent({
  id: "screenshots-showcase",
  name: "Product Screenshots Showcase",
  category: "misc",
  variant: "screenshots",
  description: "Product screenshots in browser frames with tab navigation and descriptions.",
  tags: ["screenshots", "product", "showcase", "demo", "preview", "saas", "app"],
  code: `export default function Misc() {
  const [activeTab, setActiveTab] = React.useState(0);
  const screens = [
    { tab: "Dashboard", title: "Complete visibility at a glance", desc: "Monitor all your key metrics, active projects, and team activity from a single unified dashboard.", metrics: [{ label: "Revenue", value: "$128K" }, { label: "Growth", value: "+34%" }, { label: "Users", value: "8.2K" }], barHeights: [45,65,55,80,60,75,90,70,85,65,78,92] },
    { tab: "Analytics", title: "Deep insights, zero complexity", desc: "Cohort analysis, funnel tracking, and predictive models — all visualized in beautiful, interactive charts.", metrics: [{ label: "Conversions", value: "3.2%" }, { label: "Retention", value: "89%" }, { label: "NPS", value: "72" }], barHeights: [30,50,40,70,55,85,60,75,90,65,80,95] },
    { tab: "Workflows", title: "Automate everything", desc: "Visual workflow builder with 200+ triggers and actions. Connect any service in minutes, not weeks.", metrics: [{ label: "Active", value: "847" }, { label: "Runs/day", value: "12K" }, { label: "Saved", value: "340h" }], barHeights: [60,40,70,50,80,45,75,55,85,65,90,70] },
  ];
  const s = screens[activeTab];
  return (
    <section className="py-24 px-6 bg-gray-950">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-cyan-300 bg-cyan-500/10 rounded-full border border-cyan-500/20">Platform Preview</div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight md:text-5xl">Powerful yet intuitive</h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">Explore the interfaces your team will use every day. Designed for clarity, built for speed.</p>
        </div>
        <div className="flex justify-center gap-2 mb-8">
          {screens.map((sc, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={\`px-5 py-2.5 text-sm font-medium rounded-xl transition-all \${activeTab === i ? "bg-white text-gray-900 shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"}\`}>
              {sc.tab}
            </button>
          ))}
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-3xl blur-2xl" />
          <div className="relative rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <div className="ml-4 flex-1 h-7 rounded-lg bg-gray-800 flex items-center px-3">
                <span className="text-xs text-gray-500 font-mono">app.acmeplatform.com/{s.tab.toLowerCase()}</span>
              </div>
            </div>
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400">{s.desc}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {s.metrics.map((m, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                    <div className="text-2xl font-bold text-white">{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="h-40 rounded-xl bg-white/5 border border-white/5 flex items-end px-4 pb-4 gap-2">
                {s.barHeights.map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-cyan-500 to-violet-500 opacity-60 hover:opacity-100 transition-opacity" style={{ height: \`\${h}%\` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── 19. Video Section ──
registerComponent({
  id: "video-section",
  name: "Video Section with Play Overlay",
  category: "misc",
  variant: "video",
  description: "Video section with embedded video frame, play button overlay, and description.",
  tags: ["video", "demo", "product", "showcase", "youtube", "media", "content"],
  code: `export default function Misc() {
  const [playing, setPlaying] = React.useState(false);
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-xs font-semibold text-rose-700 bg-rose-50 rounded-full border border-rose-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Watch Demo
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight md:text-5xl">See it in action</h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">A 3-minute walkthrough of everything the platform can do. From setup to deployment — no cuts, no tricks.</p>
        </div>
        <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-300/30 border border-gray-200 group cursor-pointer" onClick={() => setPlaying(!playing)}>
          <div className="absolute -inset-1 bg-gradient-to-br from-violet-200/50 to-rose-200/50 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {playing ? (
            <div className="relative aspect-video bg-gray-950">
              <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="Product Demo" />
            </div>
          ) : (
            <div className="relative aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.1),transparent_70%)]" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300 shadow-2xl">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <p className="text-white font-semibold text-lg">Watch the 3-minute demo</p>
                <p className="text-gray-400 text-sm mt-1">No signup required</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div className="h-full w-0 bg-gradient-to-r from-violet-500 to-rose-500 group-hover:w-8 transition-all duration-700" />
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-8 mt-12 text-center">
          {[{ value: "3 min", label: "Watch time" }, { value: "47K+", label: "Views" }, { value: "4.9/5", label: "Viewer rating" }].map((s, i) => (
            <div key={i}>
              <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── 20. Countdown Launch ──
registerComponent({
  id: "countdown-launch",
  name: "Product Launch Countdown",
  category: "misc",
  variant: "countdown",
  description: "Product launch countdown with days/hours/minutes/seconds, email signup, and social proof.",
  tags: ["countdown", "launch", "coming-soon", "waitlist", "landing", "product", "timer"],
  code: `export default function Misc() {
  const [email, setEmail] = React.useState("");
  const [joined, setJoined] = React.useState(false);
  const [time, setTime] = React.useState({ days: 14, hours: 8, minutes: 42, seconds: 17 });
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => {
        let { days, hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; days--; }
        if (days < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const units = [
    { value: time.days, label: "Days" },
    { value: time.hours, label: "Hours" },
    { value: time.minutes, label: "Minutes" },
    { value: time.seconds, label: "Seconds" },
  ];
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden bg-gradient-to-b from-gray-950 via-violet-950/30 to-gray-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(6,182,212,0.08),transparent_60%)]" />
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-xs font-semibold text-violet-300 bg-violet-500/10 rounded-full border border-violet-500/20 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          Something Big is Coming
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6">
          The Future of
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Building Software</span>
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed mb-12 max-w-xl mx-auto">
          We are building something that will fundamentally change how teams create, deploy, and scale applications. Join the waitlist to be first in line.
        </p>
        <div className="flex justify-center gap-4 md:gap-6 mb-12">
          {units.map((u, i) => (
            <div key={i} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-20 md:w-24 p-4 md:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="text-3xl md:text-4xl font-extrabold text-white tabular-nums">{String(u.value).padStart(2, "0")}</div>
                <div className="text-xs text-gray-500 mt-2 uppercase tracking-widest">{u.label}</div>
              </div>
            </div>
          ))}
        </div>
        {joined ? (
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
            <span className="text-emerald-300 font-semibold">You&apos;re on the list! We&apos;ll notify you at launch.</span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="flex-1 px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-sm" />
            <button onClick={() => email && setJoined(true)} className="px-8 py-4 bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all text-sm whitespace-nowrap">
              Join Waitlist
            </button>
          </div>
        )}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="flex -space-x-2">
            {[11,26,44,52,68].map(n => (
              <img key={n} src={\`https://randomuser.me/api/portraits/\${n % 2 === 0 ? "women" : "men"}/\${n}.jpg\`} alt="" className="w-7 h-7 rounded-full border-2 border-gray-950 object-cover" />
            ))}
          </div>
          <span className="text-sm text-gray-500"><strong className="text-gray-300">2,847</strong> people already waiting</span>
        </div>
      </div>
    </section>
  );
}`,
});
