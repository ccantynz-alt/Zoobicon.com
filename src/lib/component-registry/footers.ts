import { registerComponent } from "./index";

// ── Footer: Four Column ──
registerComponent({
  id: "footer-four-column",
  name: "Four Column Footer",
  category: "footer",
  variant: "four-column",
  description: "Full footer with 4 link columns, newsletter signup, social icons, and legal links",
  tags: ["modern", "saas", "startup", "business", "agency", "tech", "software", "service", "marketing", "platform"],
  code: `export default function Footer() {
  const columns = [
    { title: "Product", links: ["Features", "Pricing", "Integrations", "Changelog", "API Docs"] },
    { title: "Company", links: ["About Us", "Blog", "Careers", "Press Kit", "Partners"] },
    { title: "Resources", links: ["Documentation", "Guides", "Community", "Templates", "Status"] },
  ];
  return (
    <footer className="bg-gray-950 text-gray-400 pt-20 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
              </div>
              <span className="text-lg font-bold text-white">Acme</span>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-sm">
              Building the tools that modern teams need to ship faster, scale smarter, and stay ahead of the competition.
            </p>
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-3">Stay Updated</p>
              <div className="flex gap-2 max-w-sm">
                <input type="email" placeholder="you@company.com" className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                <button className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-colors whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
            <div className="flex gap-4">
              {[
                <svg key="tw" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
                <svg key="gh" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>,
                <svg key="li" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
              ].map((icon, i) => (
                <a key={i} href="#" className="text-gray-500 hover:text-white transition-colors">{icon}</a>
              ))}
            </div>
          </div>
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="font-semibold text-white text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">&copy; {new Date().getFullYear()} Acme Inc. All rights reserved.</p>
          <div className="flex gap-6 text-xs">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}`,
});

// ── Footer: Minimal Dark ──
registerComponent({
  id: "footer-minimal-dark",
  name: "Minimal Dark Footer",
  category: "footer",
  variant: "minimal-dark",
  description: "Simple centered dark footer, ideal for minimal or portfolio sites",
  tags: ["minimal", "clean", "portfolio", "creative", "designer", "simple", "elegant", "dark", "restaurant", "warm"],
  code: `export default function Footer() {
  return (
    <footer className="bg-gray-950 py-12 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
          </div>
          <span className="text-sm font-semibold text-white">Studio</span>
        </div>
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          {["Home", "Work", "About", "Blog", "Contact"].map(l => (
            <a key={l} href="#" className="text-sm text-gray-400 hover:text-white transition-colors">{l}</a>
          ))}
        </div>
        <div className="flex justify-center gap-5 mb-8">
          {[
            <svg key="tw" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
            <svg key="ig" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
            <svg key="dr" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.81zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-2.09-1.86-4.83-2.99-7.83-2.99-.46 0-.91.03-1.36.09zm10.14 3.266c-.22.3-1.9 2.49-5.66 4.012.22.45.44.908.64 1.372.07.16.14.32.205.48 3.39-.427 6.753.26 7.09.33-.02-2.335-.846-4.482-2.27-6.2z"/></svg>,
          ].map((icon, i) => (
            <a key={i} href="#" className="text-gray-500 hover:text-white transition-colors">{icon}</a>
          ))}
        </div>
        <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Studio. Crafted with care.</p>
      </div>
    </footer>
  );
}`,
});

// ── Footer: Mega Enterprise ──
registerComponent({
  id: "footer-mega-enterprise",
  name: "Mega Enterprise Footer",
  category: "footer",
  variant: "mega-enterprise",
  description: "Premium enterprise footer with gradient accent, 5 columns, trust badges, newsletter, and compliance indicators",
  tags: ["enterprise", "saas", "platform", "tech", "corporate", "agency", "software", "business", "marketing", "startup"],
  code: `export default function Footer() {
  const columns = [
    { title: "Platform", links: [{ name: "AI Builder", badge: "New" }, { name: "Templates" }, { name: "Components" }, { name: "Integrations" }, { name: "API Reference" }] },
    { title: "Solutions", links: [{ name: "Startups" }, { name: "Enterprise" }, { name: "Agencies" }, { name: "E-commerce" }, { name: "SaaS" }] },
    { title: "Resources", links: [{ name: "Documentation" }, { name: "Blog" }, { name: "Guides & Tutorials" }, { name: "Changelog", badge: "Updated" }, { name: "Community Forum" }] },
    { title: "Company", links: [{ name: "About Us" }, { name: "Careers", badge: "Hiring" }, { name: "Press" }, { name: "Contact" }, { name: "Brand Assets" }] },
    { title: "Legal", links: [{ name: "Privacy Policy" }, { name: "Terms of Service" }, { name: "Cookie Policy" }, { name: "Security" }, { name: "GDPR" }] },
  ];
  return (
    <footer className="relative bg-gray-950 text-gray-400 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-8">
        <div className="grid lg:grid-cols-7 gap-12 mb-16">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Nexus</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">The platform that empowers teams to build, deploy, and scale digital experiences at the speed of thought.</p>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Get the latest updates</p>
              <div className="flex gap-2 max-w-sm">
                <input type="email" placeholder="name@company.com" className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all" />
                <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40">Subscribe</button>
              </div>
              <p className="text-[11px] text-gray-600">No spam. Unsubscribe anytime.</p>
            </div>
            <div className="flex gap-4 pt-2">
              {[
                { label: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                { label: "GitHub", path: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" },
                { label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
              ].map(({ label, path }) => (
                <a key={label} href="#" aria-label={label} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d={path}/></svg>
                </a>
              ))}
            </div>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-white text-sm mb-5">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(l => (
                  <li key={l.name}>
                    <a href="#" className="text-sm hover:text-white transition-colors inline-flex items-center gap-2">
                      {l.name}
                      {l.badge && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{l.badge}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.06] pt-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All systems operational
              </div>
              <div className="flex items-center gap-4">
                {["SOC 2", "GDPR", "ISO 27001"].map(cert => (
                  <span key={cert} className="text-[10px] font-medium text-gray-500 border border-white/[0.06] rounded-md px-2 py-1">{cert}</span>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Nexus Technologies, Inc. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}`,
});

// ── Footer: App Download CTA ──
registerComponent({
  id: "footer-app-download",
  name: "App Download Footer",
  category: "footer",
  variant: "app-download",
  description: "Modern footer with prominent app download buttons, stats grid, and feature highlights — ideal for mobile-first products",
  tags: ["mobile", "app", "startup", "tech", "fitness", "health", "fintech", "social", "modern", "gaming"],
  code: `export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-6">
        <div className="py-16 border-b border-white/[0.06]">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">Available on iOS & Android</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                Take your workspace<br/>everywhere you go
              </h3>
              <p className="text-gray-400 mb-8 max-w-md leading-relaxed">
                Stay connected with your team, manage projects on the move, and never miss a deadline. Rated 4.9 stars by 50,000+ users.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#" className="inline-flex items-center gap-3 px-5 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  <div className="text-left"><div className="text-[10px] font-medium opacity-60">Download on the</div><div className="text-sm font-semibold -mt-0.5">App Store</div></div>
                </a>
                <a href="#" className="inline-flex items-center gap-3 px-5 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-colors">
                  <svg width="20" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
                  <div className="text-left"><div className="text-[10px] font-medium opacity-60">Get it on</div><div className="text-sm font-semibold -mt-0.5">Google Play</div></div>
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: "4.9★", label: "App Store Rating" },
                { num: "50K+", label: "Active Users" },
                { num: "99.9%", label: "Uptime" },
                { num: "<100ms", label: "Response Time" },
              ].map(s => (
                <div key={s.label} className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
                  <div className="text-xl font-bold text-white">{s.num}</div>
                  <div className="text-[11px] text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
            </div>
            <span className="text-sm font-semibold text-white">Momentum</span>
          </div>
          <div className="flex flex-wrap gap-6 text-xs">
            {["Privacy", "Terms", "Security", "Status", "Contact"].map(l => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Momentum Labs</p>
        </div>
      </div>
    </footer>
  );
}`,
});

// ── Footer: Luxury Minimal ──
registerComponent({
  id: "footer-luxury-minimal",
  name: "Luxury Minimal Footer",
  category: "footer",
  variant: "luxury-minimal",
  description: "Refined, spacious footer with elegant typography and understated luxury — for premium brands, fashion, architecture, and design studios",
  tags: ["luxury", "premium", "fashion", "architecture", "design", "studio", "real-estate", "hotel", "restaurant", "elegant", "minimal", "clean", "creative"],
  code: `export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-gray-400">
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <div className="grid md:grid-cols-2 gap-16 mb-20">
          <div>
            <h3 className="text-4xl md:text-5xl font-light text-white leading-tight tracking-tight mb-6">
              Let's create something<br/><em className="font-serif italic text-gray-300">extraordinary</em> together.
            </h3>
            <a href="#" className="inline-flex items-center gap-3 text-sm text-white border-b border-white/30 pb-1 hover:border-white transition-colors group">
              Start a conversation
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </a>
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-[3px] mb-6">Navigate</h4>
              <ul className="space-y-3">
                {["Collections", "About", "Process", "Journal", "Contact"].map(l => (
                  <li key={l}><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-[3px] mb-6">Connect</h4>
              <ul className="space-y-3">
                {["Instagram", "Pinterest", "LinkedIn", "Behance", "Dribbble"].map(l => (
                  <li key={l}><a href="#" className="text-sm text-gray-300 hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.06] pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-2xl font-light text-white tracking-[0.2em] uppercase">Maison</span>
          <div className="flex items-center gap-8 text-xs text-gray-600">
            <span>New York</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>London</span>
            <span className="w-1 h-1 rounded-full bg-gray-700" />
            <span>Tokyo</span>
          </div>
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}`,
});

// ── Footer: SaaS Gradient ──
registerComponent({
  id: "footer-saas-gradient",
  name: "SaaS Gradient Footer",
  category: "footer",
  variant: "saas-gradient",
  description: "Modern SaaS footer with gradient CTA banner, product links, social proof avatars, and status indicator — inspired by Linear and Vercel",
  tags: ["saas", "startup", "tech", "software", "platform", "ai", "developer", "api", "modern", "gradient"],
  code: `export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative py-16 mb-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="relative text-center px-6">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready to build something incredible?</h3>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">Join 25,000+ teams already shipping faster. Start free — no credit card required.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="#" className="px-8 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-xl shadow-black/20">Get Started Free</a>
              <a href="#" className="px-8 py-3.5 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm">Book a Demo</a>
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16">
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              </div>
              <span className="text-lg font-bold text-white">Velocity</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">Ship products 10x faster with AI-powered development tools designed for modern engineering teams.</p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-gray-950 bg-gradient-to-br from-gray-600 to-gray-700" style={{ zIndex: 4 - i }} />
                ))}
              </div>
              <div className="text-xs"><span className="text-white font-semibold">25,000+</span> teams trust us</div>
            </div>
          </div>
          {[
            { title: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap", "API"] },
            { title: "Developers", links: ["Documentation", "SDKs", "CLI Tools", "Open Source", "Status"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Partners", "Contact"] },
          ].map(col => (
            <div key={col.title}>
              <h4 className="font-semibold text-white text-sm mb-5">{col.title}</h4>
              <ul className="space-y-3">{col.links.map(l => (<li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>))}</ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/[0.06] py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-gray-500">Operational</span></div>
            <span className="text-gray-800">|</span>
            <span className="text-xs text-gray-600">99.99% uptime SLA</span>
          </div>
          <div className="flex gap-6 text-xs">{["Privacy", "Terms", "Security", "DPA"].map(l => (<a key={l} href="#" className="hover:text-white transition-colors">{l}</a>))}</div>
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Velocity, Inc.</p>
        </div>
      </div>
    </footer>
  );
}`,
});

// ── Footer: Agency Portfolio ──
registerComponent({
  id: "footer-agency-portfolio",
  name: "Agency Portfolio Footer",
  category: "footer",
  variant: "agency-portfolio",
  description: "Bold, statement-making footer for agencies and creative studios with large typography, project stats, and contact CTA",
  tags: ["agency", "creative", "design", "studio", "portfolio", "branding", "consulting", "marketing", "bold", "modern"],
  code: `export default function Footer() {
  const [hoveredLink, setHoveredLink] = React.useState(null);
  return (
    <footer className="bg-[#0c0c0c] text-gray-400 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 pt-24">
        <div className="mb-20">
          <p className="text-sm font-medium text-indigo-400 uppercase tracking-[4px] mb-8">Have a project in mind?</p>
          <a href="#" className="group block">
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.9] tracking-tight hover:text-indigo-400 transition-colors duration-500">
              Let's talk
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="inline-block ml-4 -mt-2 group-hover:translate-x-3 group-hover:-translate-y-1 transition-transform duration-500"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
            </h2>
          </a>
        </div>
        <div className="grid md:grid-cols-3 gap-12 py-16 border-t border-white/[0.06]">
          <div className="space-y-6">
            <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-[3px]">Quick Links</h4>
            <ul className="space-y-3">
              {["Work", "Services", "About", "Careers", "Contact"].map((l, i) => (
                <li key={l}>
                  <a href="#" className="text-lg text-gray-300 hover:text-white transition-colors inline-flex items-center gap-3" onMouseEnter={() => setHoveredLink(i)} onMouseLeave={() => setHoveredLink(null)}>
                    <span className={\`w-0 h-px bg-white transition-all duration-300 \${hoveredLink === i ? "w-6" : ""}\`} />
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-[3px]">Get in Touch</h4>
            <a href="mailto:hello@studio.com" className="block text-lg text-white hover:text-indigo-400 transition-colors">hello@studio.com</a>
            <p className="text-sm leading-relaxed">We partner with ambitious brands — from startups finding their voice to enterprises ready for a complete transformation.</p>
          </div>
          <div className="space-y-6">
            <h4 className="text-[11px] font-medium text-gray-500 uppercase tracking-[3px]">By the Numbers</h4>
            <div className="grid grid-cols-2 gap-6">
              {[
                { num: "200+", label: "Projects Shipped" },
                { num: "50+", label: "Global Clients" },
                { num: "12", label: "Years in Business" },
                { num: "98%", label: "Client Retention" },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-white">{s.num}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.06] py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold text-white tracking-wide">STUDIO</span>
          <div className="flex gap-6">{["Instagram", "Dribbble", "Behance", "LinkedIn"].map(l => (<a key={l} href="#" className="text-xs hover:text-white transition-colors">{l}</a>))}</div>
          <p className="text-xs text-gray-600">&copy; {new Date().getFullYear()} Studio Creative Inc.</p>
        </div>
      </div>
    </footer>
  );
}`,
});
