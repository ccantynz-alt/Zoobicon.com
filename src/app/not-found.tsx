import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b1530] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="text-[120px] md:text-[160px] font-black tracking-[-0.06em] leading-none mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#7c5aff] to-[#b794ff]">
          404
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
          Page not found
        </h1>
        <p className="text-white/50 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#7c5aff] text-white text-sm font-semibold hover:bg-[#6d3bff] transition-all shadow-[0_0_30px_rgba(124,90,255,0.25)]"
          >
            Back to Home
          </Link>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white/70 bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-all"
          >
            Try the Builder
          </Link>
        </div>
      </div>
    </div>
  );
}
