import { TemplateSnapshot } from "./index";

const navbar = `import React, { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-neutral-50/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="text-lg font-bold text-neutral-900 tracking-tight">
          Alex Mercer
        </a>

        <div className="hidden md:flex items-center gap-8">
          <a href="#work" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Work</a>
          <a href="#about" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">About</a>
          <a href="#skills" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Skills</a>
          <a href="#contact" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Contact</a>
        </div>

        <a href="#contact" className="hidden md:inline-flex px-5 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
          Hire Me
        </a>

        <button onClick={() => setOpen(!open)} className="md:hidden text-neutral-900">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-neutral-50 border-t border-neutral-100 px-6 py-4 space-y-3">
          <a href="#work" className="block text-sm text-neutral-600">Work</a>
          <a href="#about" className="block text-sm text-neutral-600">About</a>
          <a href="#skills" className="block text-sm text-neutral-600">Skills</a>
          <a href="#contact" className="block text-sm text-neutral-600">Contact</a>
        </div>
      )}
    </nav>
  );
}`;

const hero = `import React from "react";

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Available for freelance work
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold text-neutral-900 leading-[1.1] mb-6 tracking-tight">
            I Design & Build
            <span className="block text-emerald-600">Digital Products</span>
          </h1>

          <p className="text-lg text-neutral-500 leading-relaxed mb-8 max-w-md">
            Product designer and front-end developer specializing in SaaS interfaces, design systems, and interactive experiences. 8 years of turning complex problems into elegant solutions.
          </p>

          <div className="flex flex-wrap gap-4">
            <a href="#work" className="px-7 py-3 bg-neutral-900 text-white font-semibold rounded-lg hover:bg-neutral-800 transition-colors">
              View My Work
            </a>
            <a href="#contact" className="px-7 py-3 text-neutral-700 font-semibold rounded-lg border border-neutral-200 hover:border-neutral-400 transition-colors">
              Get in Touch
            </a>
          </div>

          <div className="flex items-center gap-5 mt-10">
            <a href="#" className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 transition-colors">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 transition-colors">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 transition-colors">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 4.932 3.014 9.168 7.404 10.96a.625.625 0 00.134-.395v-1.404c-.607 0-1.58 0-1.806 0-.625 0-1.183-.282-1.46-.804-.312-.588-.364-1.473-1.105-2.027-.233-.18-.057-.39.212-.362.496.136.906.498 1.295 1.03.387.53.567.66 1.218.66.365 0 .926-.023 1.447-.102.27-.616.716-1.185 1.29-1.454C5.33 17.555 3.29 16.45 3.29 12.564c0-1.26.456-2.372 1.27-3.243-.203-.625-.474-1.891.063-2.757 0 0 1.515-.065 3.28 1.282A11.46 11.46 0 0112 7.464a11.46 11.46 0 014.097.382c1.763-1.347 3.275-1.282 3.275-1.282.54.866.27 2.132.066 2.757.817.87 1.271 1.983 1.271 3.243 0 3.894-2.046 4.988-3.998 5.286.5.432.94 1.273.94 2.575v2.8c0 .14.043.277.134.395C21.032 21.12 24 16.894 24 12 24 5.373 18.627 0 12 0z"/></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 transition-colors">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>

        <div className="relative">
          <div className="bg-neutral-100 rounded-2xl p-2">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=700&fit=crop&q=80"
              alt="Professional headshot portrait"
              className="rounded-xl w-full object-cover aspect-[4/5]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}`;

const features = `import React, { useState } from "react";

const PROJECTS = [
  {
    title: "Meridian Dashboard",
    category: "Product Design",
    tags: ["SaaS", "Design System", "React"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=700&h=500&fit=crop&q=80",
    description: "Redesigned the analytics dashboard for a healthcare SaaS platform. Reduced user task completion time by 34% and increased daily active users by 28%.",
  },
  {
    title: "Pulse Mobile App",
    category: "UI/UX Design + Development",
    tags: ["Mobile", "React Native", "HealthTech"],
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=700&h=500&fit=crop&q=80",
    description: "End-to-end design and front-end development for a health tracking app. 200K downloads in the first 6 months with a 4.8-star App Store rating.",
  },
  {
    title: "Forge Design System",
    category: "Design System",
    tags: ["Component Library", "Figma", "Storybook"],
    image: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=700&h=500&fit=crop&q=80",
    description: "Built a comprehensive design system with 120+ components used across 4 products. Cut design-to-dev handoff time by 60%.",
  },
  {
    title: "NovaPay Checkout",
    category: "E-Commerce UX",
    tags: ["Fintech", "Conversion", "A/B Testing"],
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f2?w=700&h=500&fit=crop&q=80",
    description: "Redesigned the checkout flow for a payment processor. Conversion rate improved from 62% to 89% through systematic A/B testing.",
  },
];

const FILTERS = ["All", "Product Design", "UI/UX Design + Development", "Design System", "E-Commerce UX"];

export default function Features() {
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? PROJECTS : PROJECTS.filter(p => p.category === filter);

  return (
    <section id="work" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Selected Work</h2>
          <p className="text-neutral-500 max-w-lg">A curated selection of projects spanning product design, design systems, and front-end development.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={\`px-4 py-2 text-sm rounded-lg transition-colors \${
                filter === f
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }\`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {filtered.map((p, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-xl mb-4">
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full aspect-[7/5] object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {p.tags.map((tag, j) => (
                  <span key={j} className="text-xs bg-neutral-100 text-neutral-600 px-2.5 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-1">{p.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`;

const about = `import React from "react";

const SKILLS = [
  { name: "UI/UX Design", level: 95 },
  { name: "React / Next.js", level: 90 },
  { name: "TypeScript", level: 88 },
  { name: "Design Systems", level: 92 },
  { name: "Figma / Framer", level: 95 },
  { name: "Motion Design", level: 80 },
];

export default function About() {
  return (
    <section id="about" className="py-24 px-6 bg-neutral-50">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-6">About Me</h2>
          <div className="space-y-4 text-neutral-600 leading-relaxed">
            <p>
              I&apos;m Alex Mercer, a product designer and developer based in Portland, OR. For the past 8 years, I&apos;ve helped startups and scale-ups build digital products that people genuinely enjoy using.
            </p>
            <p>
              My approach sits at the intersection of design and engineering. I design in Figma, prototype in Framer, and build production front-ends in React. This means fewer handoff gaps, faster iteration, and pixel-perfect results.
            </p>
            <p>
              Previously, I led design at Stripe (Checkout team) and was the founding designer at two Y Combinator startups. I&apos;ve designed products used by millions and built design systems adopted by teams of 50+.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-10">
            <div className="bg-white rounded-xl p-4 border border-neutral-200 text-center">
              <div className="text-2xl font-extrabold text-neutral-900">8+</div>
              <div className="text-xs text-neutral-500 mt-1">Years Experience</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-neutral-200 text-center">
              <div className="text-2xl font-extrabold text-neutral-900">60+</div>
              <div className="text-xs text-neutral-500 mt-1">Projects Shipped</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-neutral-200 text-center">
              <div className="text-2xl font-extrabold text-neutral-900">12M+</div>
              <div className="text-xs text-neutral-500 mt-1">Users Reached</div>
            </div>
          </div>
        </div>

        <div id="skills">
          <h2 className="text-3xl font-bold text-neutral-900 mb-6">Skills & Tools</h2>
          <div className="space-y-5">
            {SKILLS.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium text-neutral-700">{s.name}</span>
                  <span className="text-sm text-neutral-400">{s.level}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: s.level + "%" }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3 uppercase tracking-wider">Tools I Use Daily</h3>
            <div className="flex flex-wrap gap-2">
              {["Figma", "VS Code", "React", "Next.js", "TypeScript", "Tailwind CSS", "Framer", "Storybook", "GitHub", "Linear", "Vercel", "Notion"].map((tool) => (
                <span key={tool} className="text-xs bg-white border border-neutral-200 text-neutral-600 px-3 py-1.5 rounded-lg">{tool}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`;

const testimonials = `import React from "react";

const TESTIMONIALS = [
  {
    quote: "Alex redesigned our entire checkout flow and conversion went from 62% to 89%. He thinks like a designer and codes like an engineer — rare combo.",
    name: "Rachel Torres",
    role: "Head of Product, NovaPay",
    avatar: "https://randomuser.me/api/portraits/women/26.jpg",
  },
  {
    quote: "The design system Alex built for us is still the foundation of everything we ship two years later. It cut our design-to-dev time by 60% and brought consistency across 4 products.",
    name: "Marcus Webb",
    role: "CTO, Forge Systems",
    avatar: "https://randomuser.me/api/portraits/men/41.jpg",
  },
  {
    quote: "Working with Alex felt like having a senior designer and a senior developer in one person. He delivered the Pulse app from wireframes to App Store in 10 weeks.",
    name: "Sophia Kim",
    role: "Founder, Pulse Health",
    avatar: "https://randomuser.me/api/portraits/women/79.jpg",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-neutral-900 mb-12">What Clients Say</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-neutral-50 border border-neutral-100 rounded-xl p-6">
              <p className="text-neutral-600 leading-relaxed mb-6 text-sm">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-neutral-900 text-sm">{t.name}</div>
                  <div className="text-xs text-neutral-400">{t.role}</div>
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
    <section id="contact" className="py-24 px-6 bg-neutral-900">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Have a Project in Mind?
        </h2>
        <p className="text-lg text-neutral-400 mb-10">
          I&apos;m currently available for freelance projects, contract roles, and consulting engagements. Let&apos;s build something great together.
        </p>

        <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-2xl p-8 text-left">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5">Name</label>
              <input type="text" placeholder="Your name" className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5">Email</label>
              <input type="email" placeholder="you@example.com" className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-neutral-400 mb-1.5">Tell me about your project</label>
            <textarea rows={4} placeholder="What are you looking to build?" className="w-full bg-neutral-700/50 border border-neutral-600 rounded-lg px-4 py-2.5 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-emerald-500 resize-none" />
          </div>
          <button className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 transition-colors">
            Send Message
          </button>
        </div>

        <p className="text-sm text-neutral-500 mt-6">
          Or email me directly at <a href="mailto:hello@alexmercer.dev" className="text-emerald-400 hover:underline">hello@alexmercer.dev</a>
        </p>
      </div>
    </section>
  );
}`;

const footer = `import React from "react";

export default function Footer() {
  return (
    <footer className="bg-neutral-950 border-t border-neutral-800 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-neutral-500">
          &copy; {new Date().getFullYear()} Alex Mercer. Designed & built in Portland, OR.
        </p>
        <div className="flex items-center gap-5 text-sm text-neutral-500">
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
          <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          <a href="#" className="hover:text-white transition-colors">Dribbble</a>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
        </div>
      </div>
    </footer>
  );
}`;

const styles = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

:root {
  --color-primary: #059669;
  --color-primary-light: #10b981;
  --color-bg: #fafafa;
  --color-surface: #ffffff;
  --color-text: #171717;
  --color-text-muted: #737373;
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
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
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

export const portfolioTemplate: TemplateSnapshot = {
  id: "portfolio",
  name: "Developer / Designer Portfolio",
  industry: "portfolio",
  description: "Clean, minimal portfolio with project gallery with filtering, skills section with progress bars, contact form, and professional testimonials.",
  keywords: [
    "portfolio", "personal", "developer", "designer", "freelancer", "resume",
    "cv", "work", "projects", "showcase", "hire me", "freelance", "contractor",
    "web developer", "front end", "full stack", "ux designer", "ui designer",
    "photographer", "illustrator", "creative", "personal website", "personal site",
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
  colors: { primary: "#059669", bg: "#fafafa", text: "#171717" },
};
