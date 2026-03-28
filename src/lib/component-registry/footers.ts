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
