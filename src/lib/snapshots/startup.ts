import { TemplateSnapshot } from "./index";

const navbar = `import React, { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">Launchpad</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#problem" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Problem</a>
          <a href="#solution" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Solution</a>
          <a href="#traction" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Traction</a>
          <a href="#team" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Team</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Log In</button>
          <button className="px-5 py-2 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-rose-400 hover:to-orange-400 transition-all shadow-lg shadow-rose-500/25">
            Get Early Access
          </button>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-gray-900">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
          <a href="#problem" className="block text-sm text-gray-600">Problem</a>
          <a href="#solution" className="block text-sm text-gray-600">Solution</a>
          <a href="#traction" className="block text-sm text-gray-600">Traction</a>
          <a href="#team" className="block text-sm text-gray-600">Team</a>
          <button className="w-full mt-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-medium rounded-lg">
            Get Early Access
          </button>
        </div>
      )}
    </nav>
  );
}`;

const hero = `import React, { useState } from "react";

export default function Hero() {
  const [email, setEmail] = useState("");

  return (
    <section className="relative pt-32 pb-24 px-6 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50" />
      <div className="absolute top-20 left-1/3 w-[600px] h-[600px] bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-white/80 border border-rose-200 text-rose-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8 shadow-sm">
          <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
          Backed by Y Combinator (W26)
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
          Stop Wasting Hours on
          <span className="block bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
            Manual Data Entry
          </span>
        </h1>

        <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10">
          Launchpad uses computer vision and LLMs to extract, validate, and route data from any document — invoices, receipts, contracts, forms — with 99.7% accuracy. No templates. No rules. Just intelligence.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your work email"
            className="flex-1 px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent shadow-sm"
          />
          <button className="px-6 py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold rounded-xl hover:from-rose-400 hover:to-orange-400 transition-all shadow-lg shadow-rose-500/25 whitespace-nowrap">
            Get Early Access
          </button>
        </div>

        <p className="text-sm text-gray-400">
          Join 2,847 companies on the waitlist. Free during beta.
        </p>

        <div className="mt-16 relative">
          <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100 p-2 max-w-3xl mx-auto">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&h=500&fit=crop&q=80"
              alt="Launchpad dashboard showing document processing pipeline"
              className="rounded-xl w-full"
            />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-full px-6 py-2 shadow-lg flex items-center gap-3">
            <div className="flex -space-x-2">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="" className="w-7 h-7 rounded-full border-2 border-white" />
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="" className="w-7 h-7 rounded-full border-2 border-white" />
              <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="" className="w-7 h-7 rounded-full border-2 border-white" />
            </div>
            <span className="text-sm text-gray-600 font-medium">2,847 on waitlist</span>
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
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-rose-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "See Everything",
    description: "Computer vision reads any document format — PDFs, photos, handwriting, multi-page contracts. No templates needed.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-orange-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: "Understand Context",
    description: "LLMs understand what each field means, even when labels are missing, abbreviated, or in different languages.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-amber-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Validate Instantly",
    description: "Cross-references extracted data against your existing systems to catch errors before they enter your workflow.",
  },
  {
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-rose-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    title: "Route Automatically",
    description: "Extracted data flows directly to your ERP, CRM, or accounting software via 40+ native integrations.",
  },
];

export default function Features() {
  return (
    <section id="solution" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-rose-500 uppercase tracking-wider">How It Works</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">
            Four Steps to Zero Manual Entry
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Upload any document. Launchpad handles the rest.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="relative group">
              <div className="bg-gray-50 rounded-2xl p-8 h-full border border-gray-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-5">
                  {f.icon}
                </div>
                <div className="text-xs font-bold text-rose-400 mb-2">STEP {i + 1}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
              {i < FEATURES.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 text-gray-300">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

const about = `import React from "react";

export default function About() {
  return (
    <section id="problem" className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <span className="text-sm font-semibold text-rose-500 uppercase tracking-wider">The Problem</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-6">
            $4.7 Trillion Lost to Manual Data Entry Every Year
          </h2>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              Finance teams spend 40% of their time keying data from invoices and receipts. Operations teams manually process 10,000+ documents per month. Healthcare admins transcribe patient forms all day, every day.
            </p>
            <p>
              Legacy OCR tools get it wrong 15-30% of the time. Rules-based automation breaks whenever a vendor changes their invoice format. And hiring more data entry staff doesn&apos;t scale.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="text-3xl font-extrabold text-rose-500">40%</div>
              <div className="text-sm text-gray-500 mt-1">of finance team time on data entry</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="text-3xl font-extrabold text-orange-500">$4.7T</div>
              <div className="text-sm text-gray-500 mt-1">annual cost of manual processes</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="text-3xl font-extrabold text-amber-500">15-30%</div>
              <div className="text-sm text-gray-500 mt-1">error rate with legacy OCR</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="text-3xl font-extrabold text-emerald-500">99.7%</div>
              <div className="text-sm text-gray-500 mt-1">accuracy with Launchpad</div>
            </div>
          </div>
        </div>

        <div>
          <img
            src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=700&h=500&fit=crop&q=80"
            alt="Finance team dealing with stacks of paper documents"
            className="rounded-2xl shadow-xl border border-gray-200"
          />
        </div>
      </div>
    </section>
  );
}`;

const testimonials = `import React from "react";

const TEAM = [
  {
    name: "Sarah Lin",
    role: "CEO & Co-Founder",
    bio: "Former ML Lead at Stripe. Stanford CS PhD. Built document intelligence systems processing $2B+ in transactions.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Jake Morrison",
    role: "CTO & Co-Founder",
    bio: "Ex-Google Brain researcher. 14 published papers on computer vision. Built the OCR system behind Google Lens.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Amira Hassan",
    role: "VP Product",
    bio: "Former Head of Product at Plaid. Scaled from 200 to 8,000 financial institution integrations.",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    name: "Diego Morales",
    role: "VP Engineering",
    bio: "Ex-AWS principal engineer. Designed systems handling 1M+ document processing requests per day.",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
  },
];

export default function Testimonials() {
  return (
    <section id="team" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-rose-500 uppercase tracking-wider">The Team</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">
            Built by People Who&apos;ve Done This Before
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Our founders previously built document intelligence systems at Stripe, Google, AWS, and Plaid.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM.map((t, i) => (
            <div key={i} className="text-center">
              <img
                src={t.avatar}
                alt={t.name}
                className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4 ring-4 ring-gray-100"
              />
              <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
              <div className="text-sm text-rose-500 font-medium mb-3">{t.role}</div>
              <p className="text-sm text-gray-500 leading-relaxed">{t.bio}</p>
            </div>
          ))}
        </div>

        <div id="traction" className="mt-24 bg-gradient-to-br from-rose-50 to-orange-50 rounded-3xl p-12 border border-rose-100">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Traction & Milestones</h3>
            <p className="text-gray-500">Six months from idea to product-market fit signals.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-rose-500">$2.4M</div>
              <div className="text-sm text-gray-500 mt-1">Pre-seed raised</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-orange-500">2,847</div>
              <div className="text-sm text-gray-500 mt-1">Waitlist signups</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-amber-500">18</div>
              <div className="text-sm text-gray-500 mt-1">Design partners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-emerald-500">99.7%</div>
              <div className="text-sm text-gray-500 mt-1">Extraction accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`;

const cta = `import React, { useState } from "react";

export default function CTA() {
  const [email, setEmail] = useState("");

  return (
    <section className="py-24 px-6 bg-gray-900 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
          Join the Document Intelligence Revolution
        </h2>
        <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
          Free during beta. Be among the first to eliminate manual data entry forever. No credit card required.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your work email"
            className="flex-1 px-5 py-3.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
          <button className="px-6 py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-semibold rounded-xl hover:from-rose-400 hover:to-orange-400 transition-all shadow-lg shadow-rose-500/25 whitespace-nowrap">
            Request Access
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            Free during beta
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            SOC 2 compliant
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            No credit card required
          </span>
        </div>
      </div>
    </section>
  );
}`;

const footer = `import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
              </div>
              <span className="text-lg font-bold text-white">Launchpad</span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              AI-powered document intelligence. Extract, validate, and route data from any document with 99.7% accuracy.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Use Cases</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Launchpad, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">Twitter</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">LinkedIn</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors text-sm">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}`;

const styles = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --color-primary: #f43f5e;
  --color-primary-light: #fb7185;
  --color-bg: #fafafa;
  --color-surface: #ffffff;
  --color-text: #111827;
  --color-text-muted: #6b7280;
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
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <Hero />
      <About />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}`;

export const startupTemplate: TemplateSnapshot = {
  id: "startup",
  name: "Startup Landing Page",
  industry: "startup",
  description: "Warm gradient startup landing page with email capture hero, problem/solution sections, how-it-works steps, team section with traction stats, and early access CTA.",
  keywords: [
    "startup", "launch", "mvp", "product", "early access", "beta", "waitlist",
    "funding", "venture", "seed", "pre-seed", "y combinator", "yc",
    "landing page", "coming soon", "launch page", "new product", "new app",
    "innovation", "disrupt", "marketplace", "b2b startup", "b2c startup",
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
  colors: { primary: "#f43f5e", bg: "#fafafa", text: "#111827" },
};
