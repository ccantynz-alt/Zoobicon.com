import { registerComponent } from "./store";

// ── Navbar: Transparent Glass ──
registerComponent({
  id: "navbar-transparent",
  name: "Transparent Glass Navbar",
  category: "navbar",
  variant: "transparent",
  description: "Glass morphism navbar with backdrop-blur, ideal for light backgrounds",
  tags: ["clean", "modern", "light", "agency", "portfolio", "creative", "restaurant", "food", "warm"],
  code: `export default function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const links = ["Features", "About", "Pricing", "Contact"];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">Acme</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l} href={\`#\${l.toLowerCase()}\`} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">{l}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Log in</a>
          <button className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors shadow-sm">
            Get Started
          </button>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600" aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-4 space-y-3">
          {links.map(l => (
            <a key={l} href={\`#\${l.toLowerCase()}\`} className="block text-sm font-medium text-gray-700 py-2">{l}</a>
          ))}
          <button className="w-full px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full mt-2">Get Started</button>
        </div>
      )}
    </nav>
  );
}`,
});

// ── Navbar: Dark ──
registerComponent({
  id: "navbar-dark",
  name: "Dark Navbar",
  category: "navbar",
  variant: "dark",
  description: "Dark background navbar with neon accent CTA, ideal for tech/SaaS/cybersecurity",
  tags: ["dark", "tech", "saas", "cyber", "software", "startup", "developer", "hacker"],
  code: `export default function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const links = ["Features", "Pricing", "FAQ", "Contact"];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Nexus</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l} href={\`#\${l.toLowerCase()}\`} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Sign in</a>
          <button className="px-5 py-2 bg-gradient-to-r from-emerald-400 to-cyan-400 text-gray-950 text-sm font-bold rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-emerald-400/20">
            Start Free
          </button>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-400" aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 px-6 py-4 space-y-3">
          {links.map(l => (
            <a key={l} href={\`#\${l.toLowerCase()}\`} className="block text-sm font-medium text-gray-300 py-2">{l}</a>
          ))}
          <button className="w-full px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-cyan-400 text-gray-950 text-sm font-bold rounded-full mt-2">Start Free</button>
        </div>
      )}
    </nav>
  );
}`,
});

// ── Navbar: Minimal ──
registerComponent({
  id: "navbar-minimal",
  name: "Minimal Navbar",
  category: "navbar",
  variant: "minimal",
  description: "Ultra-clean minimal navbar, just logo and links with subtle CTA",
  tags: ["minimal", "clean", "portfolio", "designer", "creative", "elegant", "simple"],
  code: `export default function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const links = ["Features", "About", "Contact"];

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-500 \${scrolled ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]" : "bg-white"}\`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-gray-900 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">S</span>
          </div>
          <span className="text-base font-semibold text-gray-900 tracking-tight">Studio</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l} href={\`#\${l.toLowerCase()}\`} className="relative text-sm text-gray-400 hover:text-gray-900 transition-colors duration-300 py-1 group">
              {l}
              <span className="absolute bottom-0 left-0 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <div className="w-px h-4 bg-gray-200" />
          <button className="group text-sm font-medium text-gray-900 flex items-center gap-2 hover:gap-3 transition-all duration-300">
            Let&apos;s Talk
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-400" aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="16" y2="17"/></svg>
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-50 px-6 py-6 space-y-4">
          {links.map(l => (
            <a key={l} href={\`#\${l.toLowerCase()}\`} className="block text-sm text-gray-500 hover:text-gray-900 py-1 transition-colors">{l}</a>
          ))}
          <div className="pt-2 border-t border-gray-50">
            <button className="text-sm font-medium text-gray-900">Let&apos;s Talk &rarr;</button>
          </div>
        </div>
      )}
    </nav>
  );
}`,
});

// ── Navbar: Centered ──
registerComponent({
  id: "navbar-centered",
  name: "Centered Logo Navbar",
  category: "navbar",
  variant: "centered",
  description: "Logo centered with navigation links split evenly on both sides",
  tags: ["centered", "elegant", "fashion", "beauty", "luxury", "brand", "magazine", "editorial", "creative"],
  code: `export default function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const leftLinks = ["Features", "About"];
  const rightLinks = ["Pricing", "Contact"];

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-500 \${scrolled ? "bg-white/95 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.03)]" : "bg-white"}\`}>
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="hidden md:flex items-center gap-10 flex-1 justify-end">
          {leftLinks.map(l => (
            <a key={l} href={\`#\${l.toLowerCase()}\`} className="group relative text-[11px] font-medium text-gray-400 hover:text-gray-900 transition-colors duration-300 tracking-[0.2em] uppercase py-1">
              {l}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-500 ease-out" />
            </a>
          ))}
        </div>
        <div className="flex items-center justify-center md:mx-16 flex-shrink-0">
          <span className="text-xl font-light text-gray-900 tracking-[0.25em] uppercase" style={{ fontFamily: "Georgia, serif" }}>Maison</span>
        </div>
        <div className="hidden md:flex items-center gap-10 flex-1">
          {rightLinks.map(l => (
            <a key={l} href={\`#\${l.toLowerCase()}\`} className="group relative text-[11px] font-medium text-gray-400 hover:text-gray-900 transition-colors duration-300 tracking-[0.2em] uppercase py-1">
              {l}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gray-900 group-hover:w-full transition-all duration-500 ease-out" />
            </a>
          ))}
          <div className="ml-auto">
            <button className="group px-6 py-2 bg-gray-900 text-white text-[11px] font-medium tracking-[0.15em] uppercase rounded-none hover:bg-gray-800 transition-all duration-300 flex items-center gap-2">
              Shop Now
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-400" aria-label="Toggle menu">
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="16" y2="17"/></svg>
          )}
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-white px-6 py-8 space-y-1 border-t border-gray-50">
          {[...leftLinks, ...rightLinks].map(l => (
            <a key={l} href={\`#\${l.toLowerCase()}\`} className="block text-[11px] font-medium text-gray-500 hover:text-gray-900 py-3 uppercase tracking-[0.2em] border-b border-gray-50 transition-colors">{l}</a>
          ))}
          <div className="pt-6">
            <button className="w-full px-6 py-3 bg-gray-900 text-white text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-gray-800 transition-colors">Shop Now</button>
          </div>
        </div>
      )}
    </nav>
  );
}`,
});

// ── Navbar: Mega Menu ──
registerComponent({
  id: "navbar-mega",
  name: "Mega Menu Navbar",
  category: "navbar",
  variant: "mega",
  description: "Enterprise navbar with expandable mega dropdown showing categorized links",
  tags: ["enterprise", "saas", "platform", "business", "corporate", "software", "marketplace", "ecommerce"],
  code: `export default function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [megaOpen, setMegaOpen] = React.useState(false);
  const products = [
    { name: "Analytics", desc: "Real-time metrics dashboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { name: "Automation", desc: "Workflow orchestration engine", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
    { name: "Security", desc: "Zero-trust access controls", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    { name: "Integrations", desc: "Connect 200+ tools instantly", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
  ];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          </div>
          <span className="text-lg font-bold text-gray-900">Platform</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="relative">
            <button onClick={() => setMegaOpen(!megaOpen)} className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Products
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={\`transition-transform \${megaOpen ? "rotate-180" : ""}\`}><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>
          <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
          <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
          <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Sign in</a>
          <button className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
            Get Started
          </button>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600" aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      {megaOpen && (
        <div className="hidden md:block absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-xl">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-4 gap-6">
              {products.map(p => (
                <a key={p.name} href={\`#\${p.name.toLowerCase()}\`} className="group flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={p.icon}/></svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
          {products.map(p => (
            <a key={p.name} href={\`#\${p.name.toLowerCase()}\`} className="block text-sm font-medium text-gray-700 py-2">{p.name} &mdash; {p.desc}</a>
          ))}
          <a href="#pricing" className="block text-sm font-medium text-gray-700 py-2">Pricing</a>
          <a href="#faq" className="block text-sm font-medium text-gray-700 py-2">FAQ</a>
          <button className="w-full px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg mt-2">Get Started</button>
        </div>
      )}
    </nav>
  );
}`,
});

// ── Navbar: Sticky (shrinks on scroll) ──
registerComponent({
  id: "navbar-sticky",
  name: "Sticky Shrinking Navbar",
  category: "navbar",
  variant: "sticky",
  description: "Transparent at top, shrinks and gains background on scroll. Great for landing pages",
  tags: ["sticky", "scroll", "landing", "marketing", "saas", "startup", "modern", "dynamic"],
  code: `export default function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const links = ["Features", "About", "Pricing", "FAQ"];

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={\`fixed top-0 left-0 right-0 z-50 transition-all duration-300 \${scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm h-14" : "bg-transparent h-20"}\`}>
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={\`rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center transition-all duration-300 \${scrolled ? "w-7 h-7" : "w-9 h-9"}\`}>
            <svg width={scrolled ? "13" : "16"} height={scrolled ? "13" : "16"} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span className={\`font-bold tracking-tight transition-all duration-300 \${scrolled ? "text-base text-gray-900" : "text-lg text-white"}\`}>Launchpad</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l} href={\`#\${l.toLowerCase().replace(/ /g, "-")}\`} className={\`text-sm font-medium transition-colors \${scrolled ? "text-gray-600 hover:text-gray-900" : "text-white/80 hover:text-white"}\`}>{l}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <a href="#" className={\`text-sm font-medium transition-colors \${scrolled ? "text-gray-600 hover:text-gray-900" : "text-white/80 hover:text-white"}\`}>Log in</a>
          <button className={\`px-5 py-2 text-sm font-semibold rounded-full transition-all \${scrolled ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-white text-gray-900 hover:bg-gray-100"}\`}>
            Try Free
          </button>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className={\`md:hidden p-2 \${scrolled ? "text-gray-600" : "text-white"}\`} aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 px-6 py-4 space-y-3">
          {links.map(l => (
            <a key={l} href={\`#\${l.toLowerCase().replace(/ /g, "-")}\`} className="block text-sm font-medium text-gray-700 py-2">{l}</a>
          ))}
          <button className="w-full px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full mt-2">Try Free</button>
        </div>
      )}
    </nav>
  );
}`,
});

// ── Navbar: Colored ──
registerComponent({
  id: "navbar-colored",
  name: "Colored Background Navbar",
  category: "navbar",
  variant: "colored",
  description: "Solid vibrant indigo/purple background navbar with white text. Bold and confident",
  tags: ["colored", "bold", "vibrant", "education", "nonprofit", "community", "event", "conference", "health", "wellness"],
  code: `export default function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const links = ["Features", "About", "Pricing", "Contact"];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-indigo-600">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Uplift</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l} href={\`#\${l.toLowerCase().replace(/ /g, "-")}\`} className="text-sm font-medium text-indigo-100 hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <a href="#" className="text-sm font-medium text-indigo-100 hover:text-white transition-colors">Sign in</a>
          <button className="px-5 py-2 bg-white text-indigo-600 text-sm font-bold rounded-full hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20">
            Donate Now
          </button>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-indigo-100" aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      {mobileOpen && (
        <div className="md:hidden bg-indigo-700 border-t border-indigo-500/30 px-6 py-4 space-y-3">
          {links.map(l => (
            <a key={l} href={\`#\${l.toLowerCase().replace(/ /g, "-")}\`} className="block text-sm font-medium text-indigo-100 py-2">{l}</a>
          ))}
          <button className="w-full px-5 py-2.5 bg-white text-indigo-600 text-sm font-bold rounded-full mt-2">Donate Now</button>
        </div>
      )}
    </nav>
  );
}`,
});

// ── Navbar: Glass Morphism ──
registerComponent({
  id: "navbar-glass",
  name: "Glass Morphism Navbar",
  category: "navbar",
  variant: "glass",
  description: "Heavy frosted glass effect with luminous border. Premium, futuristic feel",
  tags: ["glass", "frosted", "premium", "luxury", "fintech", "crypto", "web3", "futuristic", "dark", "modern"],
  code: `export default function Navbar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const links = ["Features", "Pricing", "About", "FAQ"];
  return (
    <nav className="fixed top-4 left-4 right-4 z-50">
      <div className="max-w-7xl mx-auto bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/20">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Prism</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <a key={l} href={\`#\${l.toLowerCase()}\`} className="text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-all">{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Log in</a>
            <button className="px-5 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25">
              Launch App
            </button>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-white/60" aria-label="Toggle menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-white/10 px-6 py-4 space-y-2">
            {links.map(l => (
              <a key={l} href={\`#\${l.toLowerCase()}\`} className="block text-sm font-medium text-white/70 py-2 hover:text-white transition-colors">{l}</a>
            ))}
            <button className="w-full px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-bold rounded-xl mt-2">Launch App</button>
          </div>
        )}
      </div>
    </nav>
  );
}`,
});
