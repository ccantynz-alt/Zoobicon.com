export default function Footer() {
  return (
    <footer className="border-t border-white/5 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">
            Z
          </div>
          <span className="text-white font-semibold">Zoobicon</span>
          <span className="text-slate-600 text-sm">— The AI website builder from the future.</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <a href="/privacy" className="hover:text-slate-300 transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-slate-300 transition-colors">Terms</a>
          <a
            href="https://github.com/ccantynz-alt/Zoobicon.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300 transition-colors"
          >
            GitHub
          </a>
        </div>
        <p className="text-xs text-slate-600">
          Built with AI. Designed for the future. © {new Date().getFullYear()} Zoobicon.
        </p>
      </div>
    </footer>
  );
}