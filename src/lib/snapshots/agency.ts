import { TemplateSnapshot } from "./index";

const navbar = `import React, { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Nocturn Studio</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#work" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Work</a>
          <a href="#services" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Services</a>
          <a href="#about" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">About</a>
          <a href="#testimonials" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Clients</a>
        </div>

        <a href="#contact" className="hidden md:inline-flex px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
          Start a Project
        </a>

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
          <a href="#work" className="block text-sm font-medium text-gray-600 hover:text-gray-900">Work</a>
          <a href="#services" className="block text-sm font-medium text-gray-600 hover:text-gray-900">Services</a>
          <a href="#about" className="block text-sm font-medium text-gray-600 hover:text-gray-900">About</a>
          <a href="#testimonials" className="block text-sm font-medium text-gray-600 hover:text-gray-900">Clients</a>
          <a href="#contact" className="block w-full text-center mt-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full">
            Start a Project
          </a>
        </div>
      )}
    </nav>
  );
}`;

const hero = `import React from "react";

export default function Hero() {
  return (
    <section className="pt-36 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 bg-amber-400 rounded-full" />
            Accepting new projects for Q2 2026
          </div>

          <h1 className="text-6xl lg:text-8xl font-extrabold text-gray-900 leading-[0.95] tracking-tight mb-8">
            We Design
            <br />
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Brands That
            </span>
            <br />
            People Remember
          </h1>

          <p className="text-xl text-gray-500 leading-relaxed max-w-2xl mb-10">
            Nocturn is a brand design studio that transforms ambitious companies into household names.
            We combine strategy, design, and technology to create identities that command attention.
          </p>

          <div className="flex flex-wrap gap-4">
            <a href="#work" className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-colors">
              View Our Work
            </a>
            <a href="#contact" className="group px-8 py-4 text-gray-700 font-semibold rounded-full border-2 border-gray-200 hover:border-gray-900 transition-colors flex items-center gap-2">
              Let&apos;s Talk
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"/></svg>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-gray-100">
          <div>
            <div className="text-4xl font-extrabold text-gray-900">147</div>
            <div className="text-sm text-gray-500 mt-1">Projects delivered</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-gray-900">12</div>
            <div className="text-sm text-gray-500 mt-1">Years in business</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-gray-900">94%</div>
            <div className="text-sm text-gray-500 mt-1">Client retention rate</div>
          </div>
          <div>
            <div className="text-4xl font-extrabold text-gray-900">23</div>
            <div className="text-sm text-gray-500 mt-1">Design awards won</div>
          </div>
        </div>
      </div>
    </section>
  );
}`;

const features = `import React from "react";

const PROJECTS = [
  {
    title: "Meridian Health",
    category: "Brand Identity + Website",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&h=450&fit=crop&q=80",
    description: "Complete rebrand for a healthcare network serving 2M+ patients. 340% increase in online appointment bookings.",
  },
  {
    title: "Forge Capital",
    category: "Brand Strategy + Digital",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=450&fit=crop&q=80",
    description: "Positioned a mid-market PE firm as a top-tier brand. Assets under management grew 67% post-rebrand.",
  },
  {
    title: "Kinetic Fitness",
    category: "Brand Identity + App Design",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=450&fit=crop&q=80",
    description: "Created a fitness brand that resonates with Gen Z. App downloads hit 500K in first 90 days.",
  },
  {
    title: "Bloom Botanicals",
    category: "Packaging + E-Commerce",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=450&fit=crop&q=80",
    description: "DTC skincare brand from concept to shelf. Sold out initial run within 48 hours of launch.",
  },
];

export default function Features() {
  return (
    <section id="work" className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16">
          <div>
            <span className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Selected Work</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-3">
              Projects That Moved the Needle
            </h2>
          </div>
          <a href="#contact" className="mt-4 md:mt-0 text-sm font-semibold text-gray-900 flex items-center gap-1 hover:gap-2 transition-all">
            See all projects
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"/></svg>
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {PROJECTS.map((p, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl mb-5">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
              </div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{p.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{p.category}</p>
                  <p className="text-sm text-gray-600 max-w-md">{p.description}</p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center group-hover:border-gray-900 group-hover:bg-gray-900 transition-all">
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-white transition-colors -rotate-45">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"/>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

const about = `import React from "react";

const SERVICES = [
  {
    number: "01",
    title: "Brand Strategy",
    description: "Market research, competitive audit, positioning, brand architecture, naming, and messaging framework.",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-amber-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Visual Identity",
    description: "Logo design, color system, typography, iconography, illustration style, and comprehensive brand guidelines.",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-amber-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Digital Design",
    description: "Website design, web applications, mobile apps, design systems, and interactive prototypes.",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-amber-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Development",
    description: "Front-end development, headless CMS integration, e-commerce builds, and performance optimization.",
    icon: (
      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-amber-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
];

export default function About() {
  return (
    <section id="services" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-16">
          <span className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Services</span>
          <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">
            End-to-End Brand Building
          </h2>
          <p className="text-lg text-gray-500">
            From first strategy session to final pixel. We handle every stage of bringing a brand to life.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {SERVICES.map((s, i) => (
            <div key={i} className="group p-8 rounded-2xl border-2 border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                  {s.icon}
                </div>
                <span className="text-sm font-mono text-gray-300 group-hover:text-amber-400 transition-colors">{s.number}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

const testimonials = `import React from "react";

const TESTIMONIALS = [
  {
    quote: "Nocturn took our outdated brand and turned it into something our entire team rallied behind. New client inquiries increased 280% in the first quarter after launch.",
    name: "David Okafor",
    role: "CEO, Meridian Health",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
  },
  {
    quote: "They don't just make things pretty — they think strategically. Our rebrand directly contributed to closing a $12M funding round because investors finally understood our story.",
    name: "Lena Vasquez",
    role: "Founder, Kinetic Fitness",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    quote: "Best design investment we've made. The brand guidelines are so thorough that our internal team can now produce on-brand content without any external help.",
    name: "Robert Kim",
    role: "CMO, Forge Capital",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-6 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Client Feedback</span>
          <h2 className="text-4xl font-bold text-white mt-3">
            What Our Clients Say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-8">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="text-amber-400">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-300 leading-relaxed mb-8">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-xs text-gray-400">{t.role}</div>
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
    <section id="contact" className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
          Let&apos;s Build Something
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent"> Worth Remembering</span>
        </h2>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          We take on 4-6 projects per quarter to ensure every client gets our full attention. Tell us about yours.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="mailto:hello@nocturnstudio.com" className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 transition-colors">
            hello@nocturnstudio.com
          </a>
          <a href="#" className="px-8 py-4 text-gray-700 font-semibold rounded-full border-2 border-gray-200 hover:border-gray-900 transition-colors">
            Book a Call
          </a>
        </div>
      </div>
    </section>
  );
}`;

const footer = `import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-sm font-bold text-gray-900">Nocturn Studio</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-400">
          <a href="#" className="hover:text-gray-900 transition-colors">Instagram</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Dribbble</a>
          <a href="#" className="hover:text-gray-900 transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-gray-900 transition-colors">Twitter</a>
        </div>

        <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Nocturn Studio. All rights reserved.</p>
      </div>
    </footer>
  );
}`;

const styles = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --color-primary: #f59e0b;
  --color-primary-light: #fbbf24;
  --color-bg: #ffffff;
  --color-surface: #f9fafb;
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
      <Features />
      <About />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}`;

export const agencyTemplate: TemplateSnapshot = {
  id: "agency",
  name: "Agency / Design Studio",
  industry: "agency",
  description: "Clean, bold agency website with large typography, portfolio grid, services breakdown, dark testimonials section, and elegant CTA.",
  keywords: [
    "agency", "studio", "creative", "design", "marketing", "branding", "brand",
    "web design", "digital agency", "advertising", "consulting", "freelance",
    "graphic design", "ui ux", "production", "media", "content", "social media",
    "pr", "public relations", "communications",
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
  colors: { primary: "#f59e0b", bg: "#ffffff", text: "#111827" },
};
