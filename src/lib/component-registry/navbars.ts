import { registerComponent } from "./index";

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
  const links = ["Features", "Solutions", "Pricing", "Docs"];
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
  const links = ["Work", "About", "Contact"];
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="text-base font-semibold text-gray-900 tracking-tight">Studio</span>
        <div className="flex items-center gap-6">
          {links.map(l => (
            <a key={l} href={\`#\${l.toLowerCase()}\`} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">{l}</a>
          ))}
          <button className="text-sm font-medium text-gray-900 underline underline-offset-4 decoration-gray-300 hover:decoration-gray-900 transition-colors">
            Let&apos;s Talk
          </button>
        </div>
      </div>
    </nav>
  );
}`,
});
