interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

export default function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: FeatureCardProps) {
  return (
    <div className="glass rounded-2xl p-6 card-hover border border-white/5">
      <div
        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
