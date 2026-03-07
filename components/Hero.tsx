import PromptBuilder from "./PromptBuilder";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden grid-bg">
      {/* Radial glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8 text-xs text-violet-300 font-mono border border-violet-500/20">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          AI-Powered Website Builder — Now in Early Access
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 leading-none">
          Build websites
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient glow-text">
            from the future.
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
          Describe what you want. Zoobicon&apos;s AI builds it — instantly.
          <br className="hidden md:block" />
          No code. No design skills. Just imagination.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <a
            href="#builder"
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-cyan-500 animate-gradient text-white font-semibold px-8 py-4 rounded-xl hover:opacity-90 transition-opacity text-base"
          >
            ✦ Start Building Free
          </a>
          <a
            href="#features"
            className="flex items-center gap-2 glass border border-white/10 hover:border-violet-500/40 text-slate-300 hover:text-white font-medium px-8 py-4 rounded-xl transition-all text-base"
          >
            See Features →
          </a>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">∞</span>
            <span>Possibilities</span>
          </div>
          <div className="w-px h-10 bg-white/10 hidden sm:block" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">&lt; 30s</span>
            <span>Build Time</span>
          </div>
          <div className="w-px h-10 bg-white/10 hidden sm:block" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">100%</span>
            <span>AI-Powered</span>
          </div>
          <div className="w-px h-10 bg-white/10 hidden sm:block" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-white">1-Click</span>
            <span>Deploy</span>
          </div>
        </div>
      </div>

      {/* Prompt builder section */}
      <PromptBuilder />
    </section>
  );
}
