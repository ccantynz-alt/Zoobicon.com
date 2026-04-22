import { registerComponent } from "./store";

// ── Testimonials: Cards ──
registerComponent({
  id: "testimonials-cards",
  name: "Testimonial Cards",
  category: "testimonials",
  variant: "cards",
  description: "3 testimonial cards with star ratings, avatars, metrics, gradient accents, and aggregate social proof. $100K quality",
  tags: ["modern", "saas", "startup", "business", "agency", "tech", "software", "service", "marketing"],
  code: `export default function Testimonials() {
  const testimonials = [
    {
      quote: "We migrated our entire infrastructure in a weekend. Response times dropped from 800ms to 45ms, and our ops team went from firefighting to innovating.",
      name: "Sarah Chen",
      role: "VP of Engineering",
      company: "Meridian Health",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      metric: "94% faster",
      metricLabel: "response times",
      stars: 5,
      featured: true,
    },
    {
      quote: "The ROI was undeniable within 30 days. We cut our cloud spend by 40% while handling 3x more traffic. The auto-scaling alone paid for the annual plan.",
      name: "James Okafor",
      role: "CTO",
      company: "Paystream",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      metric: "40% less",
      metricLabel: "cloud spend",
      stars: 5,
      featured: false,
    },
    {
      quote: "Our dev team ships 5 releases a day now instead of 2 per week. The CI/CD integration was seamless and the deployment previews changed how we do code review.",
      name: "Priya Sharma",
      role: "Head of Product",
      company: "Canopy Analytics",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg",
      metric: "17x faster",
      metricLabel: "shipping",
      stars: 5,
      featured: false,
    },
  ];
  return (
    <section className="py-28 px-6 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-100/40 rounded-full blur-[100px]" />
      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest mb-3">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Teams Ship Faster With Us</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Join 12,000+ companies that improved their velocity and cut costs.</p>
          {/* Aggregate rating */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}</div>
            <span className="text-sm text-gray-500"><strong className="text-gray-800">4.9/5</strong> from 2,847 reviews</span>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className={\`group relative bg-white rounded-2xl p-8 border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col \${t.featured ? "border-indigo-200 ring-1 ring-indigo-100 shadow-lg shadow-indigo-500/5" : "border-gray-100 shadow-sm"}\`}>
              {t.featured && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 rounded-t-2xl" />}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <svg key={j} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-6 flex-1 text-[15px]">&ldquo;{t.quote}&rdquo;</p>
              {/* Metric highlight */}
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{t.metric}</span>
                <span className="text-sm text-gray-400">{t.metricLabel}</span>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-gray-100 shadow-sm" />
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

// ── Testimonials: Carousel ──
registerComponent({
  id: "testimonials-carousel",
  name: "Carousel Testimonials",
  category: "testimonials",
  variant: "carousel",
  description: "Single testimonial display with previous/next navigation buttons and slide transition",
  tags: ["modern", "saas", "startup", "software", "service", "business", "agency", "product", "tech"],
  code: `export default function Testimonials() {
  const [current, setCurrent] = React.useState(0);
  const testimonials = [
    {
      quote: "We replaced three separate tools with this single platform. Our team saves 12 hours per week on manual reporting alone — that&apos;s 600+ hours a year reinvested into growth.",
      name: "Rachel Kim",
      role: "Director of Operations",
      company: "Apex Logistics",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      metric: "12 hours saved per week",
    },
    {
      quote: "The onboarding was shockingly fast. We had our first campaign live within 48 hours of signing up. Our previous vendor took 6 weeks for the same setup.",
      name: "Marcus Johnson",
      role: "Head of Growth",
      company: "Neon Health",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      metric: "48-hour time to first campaign",
    },
    {
      quote: "Revenue from our landing pages increased 340% in the first quarter. The AI-driven copy suggestions alone justified the entire annual cost within 3 weeks.",
      name: "Elena Vasquez",
      role: "CMO",
      company: "BrightPath Education",
      avatar: "https://randomuser.me/api/portraits/women/55.jpg",
      metric: "340% revenue increase",
    },
    {
      quote: "Our support ticket resolution time dropped from 4 hours to 22 minutes. Customers noticed immediately — our NPS jumped from 31 to 72 in one quarter.",
      name: "David Okonkwo",
      role: "VP Customer Success",
      company: "CloudSync Pro",
      avatar: "https://randomuser.me/api/portraits/men/41.jpg",
      metric: "NPS 31 to 72",
    },
  ];
  const prev = () => setCurrent(current === 0 ? testimonials.length - 1 : current - 1);
  const next = () => setCurrent(current === testimonials.length - 1 ? 0 : current + 1);
  const t = testimonials[current];
  return (
    <section className="py-28 px-6 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-3">What They Say</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Trusted by Industry Leaders</h2>
        </div>
        <div className="relative bg-white rounded-3xl p-10 md:p-14 shadow-lg border border-gray-100">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-violet-100 mb-6">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="currentColor"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="currentColor"/>
          </svg>
          <p className="text-xl md:text-2xl text-gray-800 leading-relaxed mb-8">&ldquo;{t.quote}&rdquo;</p>
          <div className="bg-violet-50 text-violet-700 text-sm font-bold px-4 py-2 rounded-full w-fit mb-6">{t.metric}</div>
          <div className="flex items-center gap-4">
            <img src={t.avatar} alt={t.name} className="w-14 h-14 rounded-full object-cover ring-4 ring-violet-50" />
            <div>
              <div className="font-bold text-gray-900">{t.name}</div>
              <div className="text-sm text-gray-500">{t.role}, {t.company}</div>
            </div>
          </div>
          {/* Navigation buttons */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none px-4 md:-mx-6">
            <button onClick={prev} className="pointer-events-auto w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all" aria-label="Previous testimonial">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={next} className="pointer-events-auto w-12 h-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:scale-110 transition-all" aria-label="Next testimonial">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={\`w-2.5 h-2.5 rounded-full transition-all duration-300 \${i === current ? "bg-violet-600 w-8" : "bg-gray-300 hover:bg-gray-400"}\`} aria-label={\`Go to testimonial \${i + 1}\`} />
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── Testimonials: Video ──
registerComponent({
  id: "testimonials-video",
  name: "Video Testimonials",
  category: "testimonials",
  variant: "video",
  description: "Video testimonial cards with play button overlays, company logos, and quotes",
  tags: ["modern", "saas", "enterprise", "video", "product", "tech", "startup", "agency", "marketing"],
  code: `export default function Testimonials() {
  const testimonials = [
    {
      quote: "Reduced our customer acquisition cost by 62% in the first 90 days.",
      name: "Tanya Brooks",
      role: "VP Marketing",
      company: "Vantage AI",
      avatar: "https://randomuser.me/api/portraits/women/37.jpg",
      thumbnail: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=300&fit=crop&q=80",
      duration: "2:34",
    },
    {
      quote: "Our engineering team deploys 40% more features per sprint since switching.",
      name: "Kofi Asante",
      role: "Engineering Lead",
      company: "Tessera Labs",
      avatar: "https://randomuser.me/api/portraits/men/52.jpg",
      thumbnail: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&h=300&fit=crop&q=80",
      duration: "3:12",
    },
    {
      quote: "We consolidated 7 tools into one platform and saved $2,400/month.",
      name: "Lisa Chen",
      role: "COO",
      company: "Relay Commerce",
      avatar: "https://randomuser.me/api/portraits/women/42.jpg",
      thumbnail: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&h=300&fit=crop&q=80",
      duration: "1:58",
    },
  ];
  return (
    <section className="py-28 px-6 bg-navy-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-cyan-400 uppercase tracking-widest mb-3">Customer Stories</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Hear It From Them</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">Real teams, real results. Watch how leading companies transformed their workflow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="group bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:-translate-y-1">
              {/* Video thumbnail with play button */}
              <div className="relative cursor-pointer">
                <img src={t.thumbnail} alt={\`\${t.name} video testimonial\`} className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#111" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-mono px-2 py-1 rounded">{t.duration}</div>
              </div>
              {/* Quote and attribution */}
              <div className="p-6">
                <p className="text-gray-300 text-sm leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold text-white text-sm">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}, {t.company}</div>
                  </div>
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

// ── Testimonials: Logos ──
registerComponent({
  id: "testimonials-logos",
  name: "Logo Wall Testimonials",
  category: "testimonials",
  variant: "logos",
  description: "Company logo wall with a single featured quote. Trust-building social proof section",
  tags: ["enterprise", "saas", "startup", "b2b", "business", "tech", "software", "corporate", "trust"],
  code: `export default function Testimonials() {
  const logos = [
    { name: "Meridian Health", letters: "MH" },
    { name: "Paystream", letters: "PS" },
    { name: "Canopy Analytics", letters: "CA" },
    { name: "Tessera Labs", letters: "TL" },
    { name: "BrightPath", letters: "BP" },
    { name: "Relay Commerce", letters: "RC" },
    { name: "Apex Logistics", letters: "AL" },
    { name: "Vantage AI", letters: "VA" },
  ];
  return (
    <section className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Logo wall */}
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Trusted by forward-thinking teams at</p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 mb-20">
          {logos.map((l, i) => (
            <div key={i} className="group flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-default">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">{l.letters}</div>
              <span className="text-lg font-semibold text-gray-400 group-hover:text-gray-900 transition-colors">{l.name}</span>
            </div>
          ))}
        </div>
        {/* Featured quote */}
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl p-10 md:p-14 relative">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-indigo-200 mb-6">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" fill="currentColor"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" fill="currentColor"/>
          </svg>
          <p className="text-xl md:text-2xl text-gray-800 leading-relaxed mb-8 font-light">
            &ldquo;We evaluated 12 platforms before choosing this one. Six months later, our conversion rate is up 89%, our team ships 3x faster, and we&apos;ve eliminated 4 separate tool subscriptions. The ROI conversation with our board took exactly one slide.&rdquo;
          </p>
          <div className="flex items-center gap-4">
            <img src="https://randomuser.me/api/portraits/men/36.jpg" alt="Thomas Wright" className="w-14 h-14 rounded-full object-cover ring-4 ring-white" />
            <div>
              <div className="font-bold text-gray-900">Thomas Wright</div>
              <div className="text-sm text-gray-500">CTO, Meridian Health</div>
            </div>
            <div className="ml-auto hidden md:block">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <svg key={n} width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`,
});

// ── Testimonials: Metrics ──
registerComponent({
  id: "testimonials-metrics",
  name: "Metrics Testimonials",
  category: "testimonials",
  variant: "metrics",
  description: "Large metric numbers with supporting quotes, focused on quantifiable outcomes",
  tags: ["saas", "enterprise", "b2b", "data", "analytics", "business", "results", "conversion", "marketing"],
  code: `export default function Testimonials() {
  const results = [
    {
      metric: "340%",
      label: "Revenue Increase",
      quote: "Our landing page conversions tripled in the first quarter. The AI copy suggestions were worth the entire annual cost alone.",
      name: "Elena Vasquez",
      role: "CMO, BrightPath Education",
      avatar: "https://randomuser.me/api/portraits/women/55.jpg",
      color: "from-emerald-400 to-teal-500",
    },
    {
      metric: "12hrs",
      label: "Saved Per Week",
      quote: "We replaced three separate reporting tools. My team reclaimed 12 hours every single week — that adds up to 600+ hours per year.",
      name: "Rachel Kim",
      role: "Director of Ops, Apex Logistics",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      color: "from-blue-400 to-indigo-500",
    },
    {
      metric: "94%",
      label: "Faster Response Times",
      quote: "Response times dropped from 800ms to 45ms after migration. Our ops team went from firefighting to actually innovating.",
      name: "Sarah Chen",
      role: "VP Engineering, Meridian Health",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      color: "from-violet-400 to-purple-500",
    },
    {
      metric: "$2.4K",
      label: "Monthly Savings",
      quote: "Consolidated 7 tools into one platform. That&apos;s $2,400 per month back in the budget — nearly $30K per year.",
      name: "Lisa Chen",
      role: "COO, Relay Commerce",
      avatar: "https://randomuser.me/api/portraits/women/42.jpg",
      color: "from-amber-400 to-orange-500",
    },
  ];
  return (
    <section className="py-28 px-6 bg-navy-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-emerald-400 uppercase tracking-widest mb-3">Proven Results</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Numbers That Speak for Themselves</h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">Real outcomes from real teams — measured, verified, and repeatable.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {results.map((r, i) => (
            <div key={i} className="group bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-6 mb-6">
                <div>
                  <div className={\`text-5xl font-extrabold bg-gradient-to-r \${r.color} bg-clip-text text-transparent\`}>{r.metric}</div>
                  <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-1">{r.label}</div>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">&ldquo;{r.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-5 border-t border-gray-800">
                <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-white text-sm">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.role}</div>
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
