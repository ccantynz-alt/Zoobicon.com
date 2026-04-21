import { TemplateSnapshot } from "./index";

const navbar = `import React, { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span className="text-lg font-bold text-white tracking-tight">Velocita</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</a>
          <a href="#pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</a>
          <a href="#testimonials" className="text-sm text-slate-400 hover:text-white transition-colors">Customers</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">Sign In</button>
          <button className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25">
            Start Free Trial
          </button>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-white">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-navy-950/95 backdrop-blur-xl border-t border-white/5 px-6 py-4 space-y-3">
          <a href="#features" className="block text-sm text-slate-300 hover:text-white">Features</a>
          <a href="#how-it-works" className="block text-sm text-slate-300 hover:text-white">How It Works</a>
          <a href="#pricing" className="block text-sm text-slate-300 hover:text-white">Pricing</a>
          <a href="#testimonials" className="block text-sm text-slate-300 hover:text-white">Customers</a>
          <button className="w-full mt-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-lg">
            Start Free Trial
          </button>
        </div>
      )}
    </nav>
  );
}`;

const hero = `import React from "react";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
            Now in Public Beta
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
            Ship Products
            <span className="block bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              10x Faster
            </span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
            Velocita replaces your entire DevOps stack with one intelligent platform. Automated CI/CD, real-time monitoring, and AI-powered incident response — all in a single dashboard.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25">
              Start Free — No Card Required
            </button>
            <button className="group px-8 py-3.5 bg-white/5 text-white font-semibold rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" className="text-violet-400"><path d="M8 5v14l11-7z"/></svg>
              Watch Demo
            </button>
          </div>

          <div className="flex items-center gap-6 mt-8 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              14-day free trial
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              SOC 2 certified
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              99.99% SLA
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="relative bg-slate-900/50 border border-white/10 rounded-2xl p-1 shadow-2xl shadow-violet-500/10">
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=80"
              alt="Dashboard analytics showing real-time deployment metrics"
              className="rounded-xl w-full"
            />
            <div className="absolute -bottom-6 -left-6 bg-slate-900 border border-white/10 rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Deploy Successful</div>
                  <div className="text-xs text-slate-400">Production • 1.2s build time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`;

const features = `import React from "react";

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-violet-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Instant Deployments",
    description: "Push to deploy in under 2 seconds. Zero-downtime rolling updates with automatic rollback on failure. 73% faster than traditional CI/CD pipelines.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop&q=80",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Enterprise Security",
    description: "SOC 2 Type II certified. End-to-end encryption, network isolation, and automated vulnerability scanning. Your infrastructure is locked down by default.",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=400&h=300&fit=crop&q=80",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-cyan-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Real-Time Observability",
    description: "Unified logs, metrics, and traces in one dashboard. AI-powered anomaly detection catches issues 12 minutes before they affect users.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&q=80",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-amber-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "AI Incident Response",
    description: "Automated root cause analysis resolves 68% of incidents without human intervention. Mean time to recovery dropped from 47 minutes to 4 minutes.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop&q=80",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: "Global Edge Network",
    description: "Deploy to 42 edge locations worldwide. Average response time under 50ms from any continent. Automatic geo-routing for optimal performance.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop&q=80",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-rose-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: "200+ Integrations",
    description: "Connect your entire stack in one click. GitHub, GitLab, Slack, PagerDuty, Datadog, and 194 more. Bi-directional sync keeps everything in lockstep.",
    image: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=400&h=300&fit=crop&q=80",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-violet-400 uppercase tracking-wider">Features</span>
          <h2 className="text-4xl font-bold text-white mt-3 mb-4">
            Everything You Need to Ship with Confidence
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            One platform replaces your CI/CD, monitoring, incident management, and infrastructure tooling.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-violet-500/30 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={f.image}
                  alt={f.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/50 to-transparent" />
              </div>
              <div className="p-6">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

const about = `import React from "react";

const STEPS = [
  {
    step: "01",
    title: "Connect Your Repository",
    description: "Link your GitHub, GitLab, or Bitbucket repo. Velocita auto-detects your framework, build tools, and environment variables.",
  },
  {
    step: "02",
    title: "Push to Deploy",
    description: "Every git push triggers an automated build pipeline. Preview deployments for every pull request — production deploys on merge to main.",
  },
  {
    step: "03",
    title: "Monitor & Optimize",
    description: "Real-time dashboards show latency, errors, and throughput. AI surfaces optimization opportunities and auto-scales based on traffic patterns.",
  },
];

export default function About() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-slate-900/30">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-sm font-semibold text-violet-400 uppercase tracking-wider">How It Works</span>
          <h2 className="text-4xl font-bold text-white mt-3 mb-6">
            From Code to Production in Three Steps
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            No YAML files. No infrastructure diagrams. No DevOps hire. Connect your repo and Velocita handles everything else.
          </p>

          <div className="space-y-8">
            {STEPS.map((s, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-violet-400">{s.step}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=700&h=500&fit=crop&q=80"
            alt="Code editor showing deployment pipeline configuration"
            className="rounded-2xl border border-white/10 shadow-2xl"
          />
          <div className="absolute -top-4 -right-4 bg-slate-900 border border-white/10 rounded-xl p-4 shadow-xl">
            <div className="text-2xl font-bold text-white">1.2s</div>
            <div className="text-xs text-slate-400">Avg build time</div>
          </div>
        </div>
      </div>
    </section>
  );
}`;

const testimonials = `import React from "react";

const TESTIMONIALS = [
  {
    quote: "Reduced our deployment frequency from weekly to 50+ times per day. Velocita removed every bottleneck in our pipeline.",
    name: "Priya Sharma",
    role: "VP Engineering, Nexora",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    metric: "50x more deploys per week",
  },
  {
    quote: "We cut our AWS bill by 41% after switching to Velocita. The AI auto-scaling alone paid for the entire subscription in the first month.",
    name: "James Mitchell",
    role: "CTO, ScaleGrid",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    metric: "41% infrastructure cost reduction",
  },
  {
    quote: "Our MTTR went from 47 minutes to under 4. The AI incident response caught a database connection leak at 3am that would have taken our team hours.",
    name: "Elena Rodriguez",
    role: "SRE Lead, DataVault",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    metric: "91% faster incident resolution",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-violet-400 uppercase tracking-wider">Customers</span>
          <h2 className="text-4xl font-bold text-white mt-3 mb-4">
            Trusted by Engineering Teams at Scale
          </h2>
          <p className="text-lg text-slate-400">
            Over 2,400 companies ship faster with Velocita.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="bg-slate-900/50 border border-white/5 rounded-2xl p-8 hover:border-violet-500/20 transition-colors"
            >
              <div className="inline-block bg-violet-500/10 text-violet-300 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                {t.metric}
              </div>
              <p className="text-slate-300 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10" />
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

const cta = `import React from "react";

export default function CTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-indigo-700" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-16 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Stop Managing Infrastructure. Start Shipping.
          </h2>
          <p className="text-lg text-violet-200 mb-8 max-w-2xl mx-auto">
            Join 2,400+ engineering teams who deploy with confidence. Free 14-day trial — no credit card, no sales call, no commitment.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-8 py-4 bg-white text-violet-700 font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-lg">
              Start Your Free Trial
            </button>
            <button className="px-8 py-4 bg-violet-500/30 text-white font-semibold rounded-xl border border-white/20 hover:bg-violet-500/40 transition-colors">
              Schedule a Demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}`;

const footer = `import React from "react";

export default function Footer() {
  return (
    <footer className="bg-navy-950 border-t border-white/5 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <span className="text-lg font-bold text-white">Velocita</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs mb-6">
              The modern DevOps platform for teams that ship fast. Automated deployments, monitoring, and incident response in one dashboard.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Changelog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Press Kit</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Security</a></li>
              <li><a href="#" className="text-slate-400 hover:text-white transition-colors">GDPR</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">&copy; {new Date().getFullYear()} Velocita, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}`;

const styles = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --color-primary: #7c3aed;
  --color-primary-light: #8b5cf6;
  --color-bg: #0f0d1a;
  --color-surface: #1a1725;
  --color-text: #f8fafc;
  --color-text-muted: #94a3b8;
  --color-border: rgba(255, 255, 255, 0.06);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
}

html {
  scroll-behavior: smooth;
}`;

const app = `import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import About from "./components/About";
import Testimonials from "./components/Testimonials";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import "./styles.css";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0f0d1a] text-white">
      <Navbar />
      <Hero />
      <Features />
      <About />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}`;

export const saasTemplate: TemplateSnapshot = {
  id: "saas",
  name: "SaaS Landing Page",
  industry: "saas",
  description: "Dark-themed SaaS product landing page with gradient hero, feature grid with images, step-by-step how-it-works, customer testimonials with metrics, and bold CTA.",
  keywords: [
    "saas", "software", "app", "platform", "dashboard", "tool", "api", "cloud",
    "devops", "developer", "startup", "product", "b2b", "analytics", "automation",
    "monitoring", "deployment", "infrastructure", "data", "tech", "ai", "machine learning",
    "cybersecurity", "security", "fintech", "payments", "crm", "erp",
  ],
  files: {
    "App.tsx": app,
    "components/Navbar.tsx": navbar,
    "components/Hero.tsx": hero,
    "components/Features.tsx": features,
    "components/About.tsx": about,
    "components/Testimonials.tsx": testimonials,
    "components/CTA.tsx": cta,
    "components/Footer.tsx": footer,
    "styles.css": styles,
  },
  colors: { primary: "#7c3aed", bg: "#0f0d1a", text: "#f8fafc" },
};
