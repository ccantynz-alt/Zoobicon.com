import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: "🤖",
    title: "AI-Driven Building",
    description:
      "Generate full websites from natural language prompts. Just describe your vision and watch it come to life instantly.",
    gradient: "from-violet-600 to-purple-400",
  },
  {
    icon: "🌐",
    title: "Futuristic UI",
    description:
      "A sleek, 2040-inspired interface designed for creators who demand the extraordinary. Every pixel crafted with intent.",
    gradient: "from-cyan-600 to-blue-400",
  },
  {
    icon: "⚡",
    title: "React + TypeScript",
    description:
      "Modern, type-safe component architecture that scales with your ambitions. Built on the most trusted frontend stack.",
    gradient: "from-orange-500 to-pink-400",
  },
  {
    icon: "🚀",
    title: "One-Click Deploy",
    description:
      "Ship to production instantly via Vercel. Your website goes from concept to live URL in seconds.",
    gradient: "from-emerald-600 to-teal-400",
  },
  {
    icon: "🎨",
    title: "Smart Theming",
    description:
      "AI-powered color palettes and typography that match your brand — automatically. Design intelligence built in.",
    gradient: "from-rose-600 to-pink-400",
  },
  {
    icon: "🔒",
    title: "Enterprise Ready",
    description:
      "Built-in security, performance optimization, and accessibility. Production-grade from day one.",
    gradient: "from-amber-500 to-yellow-400",
  },
];

export default function Features() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <p className="text-xs text-violet-400 font-mono uppercase tracking-widest mb-4">
          ✦ Why Zoobicon
        </p>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Everything you need.{" "}
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Nothing you don&apos;t.
          </span>
        </h2>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Zoobicon combines cutting-edge AI with a developer-first workflow to
          make building websites effortless.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}
