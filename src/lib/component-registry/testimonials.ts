import { registerComponent } from "./index";

// ── Testimonials: Cards ──
registerComponent({
  id: "testimonials-cards",
  name: "Testimonial Cards",
  category: "testimonials",
  variant: "cards",
  description: "3 testimonial cards with star ratings, avatars, company names, and specific metrics",
  tags: ["modern", "saas", "startup", "business", "agency", "tech", "software", "service", "marketing"],
  code: `export default function Testimonials() {
  const testimonials = [
    {
      quote: "We migrated our entire infrastructure in a weekend. Response times dropped from 800ms to 45ms, and our ops team went from firefighting to innovating.",
      name: "Sarah Chen",
      role: "VP of Engineering",
      company: "Meridian Health",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      metric: "94% faster response times",
      stars: 5,
    },
    {
      quote: "The ROI was undeniable within 30 days. We cut our cloud spend by 40% while handling 3x more traffic. The auto-scaling alone paid for the annual plan.",
      name: "James Okafor",
      role: "CTO",
      company: "Paystream",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      metric: "40% cost reduction",
      stars: 5,
    },
    {
      quote: "Our dev team ships 5 releases a day now instead of 2 per week. The CI/CD integration was seamless and the deployment previews changed how we do code review.",
      name: "Priya Sharma",
      role: "Head of Product",
      company: "Canopy Analytics",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      metric: "17x faster shipping",
      stars: 5,
    },
  ];
  return (
    <section className="py-28 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Teams Ship Faster With Us</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Join 12,000+ companies that improved their velocity and cut costs.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <svg key={j} width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 flex-1">&ldquo;{t.quote}&rdquo;</p>
              <div className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full w-fit mb-5">{t.metric}</div>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-white" />
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}, {t.company}</div>
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

// ── Testimonials: Large Quote ──
registerComponent({
  id: "testimonials-quote",
  name: "Large Quote Testimonial",
  category: "testimonials",
  variant: "quote",
  description: "Single large quote with navigation dots, ideal for impactful single-testimonial layouts",
  tags: ["elegant", "minimal", "portfolio", "creative", "restaurant", "warm", "food", "luxury", "hotel", "event"],
  code: `export default function Testimonials() {
  const [active, setActive] = React.useState(0);
  const testimonials = [
    {
      quote: "From the moment we walked in, every detail was intentional. The seasonal tasting menu was an experience — not just a meal. We drove two hours and would happily do it again.",
      name: "Alexandra Reeves",
      role: "Food Critic, The Chronicle",
      avatar: "https://randomuser.me/api/portraits/women/26.jpg",
    },
    {
      quote: "They turned our rebrand from a three-month nightmare into a three-week triumph. The final identity was so strong our board approved it unanimously on first review.",
      name: "Daniel Nguyen",
      role: "CEO, Luminary Group",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    },
    {
      quote: "Working with this team felt effortless. They understood our vision better than we could articulate it ourselves. The result exceeded every expectation we had.",
      name: "Maria Torres",
      role: "Founder, Casa Verde",
      avatar: "https://randomuser.me/api/portraits/women/57.jpg",
    },
  ];
  const t = testimonials[active];
  return (
    <section className="py-28 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-8 text-gray-200">
          <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="currentColor"/>
          <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="currentColor"/>
        </svg>
        <p className="text-2xl md:text-3xl text-gray-800 leading-relaxed font-light mb-10 italic">
          &ldquo;{t.quote}&rdquo;
        </p>
        <div className="flex items-center justify-center gap-4 mb-8">
          <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-full object-cover ring-4 ring-gray-100" />
          <div className="text-left">
            <div className="font-semibold text-gray-900">{t.name}</div>
            <div className="text-sm text-gray-500">{t.role}</div>
          </div>
        </div>
        <div className="flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={\`w-2.5 h-2.5 rounded-full transition-all duration-300 \${i === active ? "bg-gray-900 w-8" : "bg-gray-300 hover:bg-gray-400"}\`}
              aria-label={\`Show testimonial \${i + 1}\`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}`,
});
