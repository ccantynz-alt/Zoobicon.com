import { TemplateSnapshot } from "./index";

const navbar = `import React, { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-950/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12" />
          </svg>
          <div>
            <span className="text-xl font-bold text-white tracking-tight font-serif">Ember & Oak</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <a href="#menu" className="text-sm text-stone-400 hover:text-amber-400 transition-colors tracking-wide uppercase">Menu</a>
          <a href="#about" className="text-sm text-stone-400 hover:text-amber-400 transition-colors tracking-wide uppercase">Story</a>
          <a href="#chef" className="text-sm text-stone-400 hover:text-amber-400 transition-colors tracking-wide uppercase">Chef</a>
          <a href="#reviews" className="text-sm text-stone-400 hover:text-amber-400 transition-colors tracking-wide uppercase">Reviews</a>
        </div>

        <a href="#reserve" className="hidden md:inline-flex px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-full hover:bg-amber-500 transition-colors tracking-wide uppercase">
          Reserve a Table
        </a>

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
        <div className="md:hidden bg-stone-950/95 backdrop-blur-xl px-6 py-4 space-y-3 border-t border-white/5">
          <a href="#menu" className="block text-sm text-stone-300 uppercase tracking-wide">Menu</a>
          <a href="#about" className="block text-sm text-stone-300 uppercase tracking-wide">Story</a>
          <a href="#chef" className="block text-sm text-stone-300 uppercase tracking-wide">Chef</a>
          <a href="#reviews" className="block text-sm text-stone-300 uppercase tracking-wide">Reviews</a>
          <a href="#reserve" className="block w-full text-center mt-2 px-6 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-full uppercase tracking-wide">
            Reserve a Table
          </a>
        </div>
      )}
    </nav>
  );
}`;

const hero = `import React from "react";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&h=900&fit=crop&q=80"
          alt="Elegantly plated fine dining dish with herb garnish"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-stone-950/30" />
      </div>

      <div className="relative text-center px-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-3 text-amber-400 text-sm uppercase tracking-[0.3em] mb-8">
          <span className="w-12 h-px bg-amber-500" />
          Est. 2018 &middot; San Francisco
          <span className="w-12 h-px bg-amber-500" />
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white leading-[1.05] mb-6">
          Tables Worth
          <br />
          <span className="text-amber-400 italic">Traveling For</span>
        </h1>

        <p className="text-lg text-stone-300 leading-relaxed max-w-xl mx-auto mb-10">
          Wood-fired cuisine that celebrates California produce and Pacific Rim influences.
          Michelin-starred chef. Sustainably sourced. Unforgettable.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <a href="#reserve" className="px-8 py-4 bg-amber-600 text-white font-semibold rounded-full hover:bg-amber-500 transition-colors uppercase tracking-wider text-sm">
            Reserve Your Table
          </a>
          <a href="#menu" className="px-8 py-4 text-white font-semibold rounded-full border-2 border-white/30 hover:border-white/60 transition-colors uppercase tracking-wider text-sm">
            View the Menu
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" className="text-white/40">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    </section>
  );
}`;

const features = `import React from "react";

const DISHES = [
  {
    name: "Wagyu Tataki",
    description: "A5 Wagyu, ponzu gel, shiso, crispy garlic, microgreens",
    price: "$42",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop&q=80",
    tag: "Chef's Pick",
  },
  {
    name: "Halibut Crudo",
    description: "Citrus-cured halibut, yuzu kosho, radish, edible flowers",
    price: "$28",
    image: "https://images.unsplash.com/photo-1535140728325-a4d3707eee61?w=400&h=400&fit=crop&q=80",
    tag: null,
  },
  {
    name: "Oak-Smoked Duck",
    description: "Duck breast, cherry mostarda, sunchoke puree, hazelnut",
    price: "$52",
    image: "https://images.unsplash.com/photo-1432139509613-5c4255a1d197?w=400&h=400&fit=crop&q=80",
    tag: "Signature",
  },
  {
    name: "Miso-Glazed Black Cod",
    description: "48-hour marinated cod, dashi broth, baby bok choy, sesame",
    price: "$48",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=400&fit=crop&q=80",
    tag: null,
  },
  {
    name: "Wild Mushroom Risotto",
    description: "Carnaroli rice, porcini, chanterelle, truffle oil, parmesan",
    price: "$34",
    image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=400&fit=crop&q=80",
    tag: "Vegetarian",
  },
  {
    name: "Yuzu Panna Cotta",
    description: "Yuzu cream, passion fruit, toasted coconut, mango sorbet",
    price: "$18",
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop&q=80",
    tag: null,
  },
];

export default function Features() {
  return (
    <section id="menu" className="py-24 px-6 bg-stone-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 text-amber-400 text-sm uppercase tracking-[0.2em] mb-4">
            <span className="w-8 h-px bg-amber-500" />
            Seasonal Highlights
            <span className="w-8 h-px bg-amber-500" />
          </div>
          <h2 className="text-4xl font-serif font-bold text-white">
            From Our Kitchen
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DISHES.map((d, i) => (
            <div key={i} className="group bg-stone-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-amber-500/20 transition-all">
              <div className="relative h-56 overflow-hidden">
                <img
                  src={d.image}
                  alt={d.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {d.tag && (
                  <span className="absolute top-4 left-4 bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {d.tag}
                  </span>
                )}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-serif font-bold text-white">{d.name}</h3>
                  <span className="text-amber-400 font-bold">{d.price}</span>
                </div>
                <p className="text-sm text-stone-400">{d.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a href="#" className="inline-flex items-center gap-2 text-amber-400 font-semibold hover:text-amber-300 transition-colors uppercase tracking-wider text-sm">
            View Full Menu
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"/></svg>
          </a>
        </div>
      </div>
    </section>
  );
}`;

const about = `import React from "react";

export default function About() {
  return (
    <section id="about" className="py-24 px-6 bg-stone-900">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=700&h=500&fit=crop&q=80"
            alt="Chef preparing dishes in an open kitchen with wood fire"
            className="rounded-2xl"
          />
          <div className="absolute -bottom-6 -right-6 bg-amber-600 text-white rounded-xl p-6 shadow-xl hidden md:block">
            <div className="text-3xl font-serif font-bold">1 Star</div>
            <div className="text-sm text-amber-200">Michelin Guide 2025</div>
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-3 text-amber-400 text-sm uppercase tracking-[0.2em] mb-4">
            <span className="w-8 h-px bg-amber-500" />
            Our Story
          </div>
          <h2 className="text-4xl font-serif font-bold text-white mb-6">
            Where Fire Meets Finesse
          </h2>
          <div className="space-y-4 text-stone-300 leading-relaxed">
            <p>
              Ember & Oak was born from Chef Hana Yoshida&apos;s vision of a restaurant where Japanese precision meets Californian abundance. After a decade at three-starred kitchens in Tokyo and Copenhagen, she returned to San Francisco to build something entirely her own.
            </p>
            <p>
              Every dish starts at our custom-built white oak hearth. We source directly from 14 farms within 50 miles, receive daily catches from Half Moon Bay fishermen, and forage seasonal ingredients from the Marin headlands.
            </p>
            <p>
              The result: bold, elemental flavors presented with exacting detail. No shortcuts. No compromises. Just honest food, made extraordinary.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-white/10">
            <div>
              <div className="text-3xl font-serif font-bold text-amber-400">14</div>
              <div className="text-xs text-stone-400 mt-1 uppercase tracking-wider">Partner Farms</div>
            </div>
            <div>
              <div className="text-3xl font-serif font-bold text-amber-400">4.9</div>
              <div className="text-xs text-stone-400 mt-1 uppercase tracking-wider">Google Rating</div>
            </div>
            <div>
              <div className="text-3xl font-serif font-bold text-amber-400">7</div>
              <div className="text-xs text-stone-400 mt-1 uppercase tracking-wider">Years Open</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`;

const testimonials = `import React from "react";

const REVIEWS = [
  {
    quote: "The Wagyu Tataki alone is worth the two-month wait for a reservation. This is the best restaurant to open in San Francisco in the last decade.",
    name: "Michael Thornton",
    source: "San Francisco Chronicle",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    rating: 5,
  },
  {
    quote: "We celebrated our anniversary here and it was perfect from start to finish. The sommelier paired every course with wines we never would have discovered on our own.",
    name: "Grace & Daniel Park",
    source: "Verified Diners",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    rating: 5,
  },
  {
    quote: "Chef Yoshida is doing something truly special with wood-fire cooking. The miso-glazed cod melts in your mouth. Easily the best meal I've had this year.",
    name: "Alessandro Ricci",
    source: "James Beard Foundation",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section id="reviews" className="py-24 px-6 bg-stone-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 text-amber-400 text-sm uppercase tracking-[0.2em] mb-4">
            <span className="w-8 h-px bg-amber-500" />
            Guest Reviews
            <span className="w-8 h-px bg-amber-500" />
          </div>
          <h2 className="text-4xl font-serif font-bold text-white">
            Every Seat Tells a Story
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {REVIEWS.map((r, i) => (
            <div key={i} className="bg-stone-900/50 border border-white/5 rounded-2xl p-8">
              <div className="flex gap-1 mb-4">
                {[...Array(r.rating)].map((_, j) => (
                  <svg key={j} width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-amber-400">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-stone-300 leading-relaxed mb-6 font-serif italic">&ldquo;{r.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <img src={r.avatar} alt={r.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-white text-sm">{r.name}</div>
                  <div className="text-xs text-stone-500">{r.source}</div>
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
    <section id="reserve" className="py-24 px-6 bg-stone-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&h=600&fit=crop&q=80"
          alt="Restaurant interior with warm lighting"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-3 text-amber-400 text-sm uppercase tracking-[0.2em] mb-6">
          <span className="w-8 h-px bg-amber-500" />
          Reservations
          <span className="w-8 h-px bg-amber-500" />
        </div>

        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
          Your Table Is Waiting
        </h2>
        <p className="text-lg text-stone-300 mb-4">
          Dinner service: Tuesday &ndash; Saturday, 5:30 PM &ndash; 10:00 PM
        </p>
        <p className="text-stone-400 mb-10">
          415-555-0182 &middot; 742 Valencia Street, San Francisco, CA 94110
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <a href="#" className="px-8 py-4 bg-amber-600 text-white font-semibold rounded-full hover:bg-amber-500 transition-colors uppercase tracking-wider text-sm">
            Book on OpenTable
          </a>
          <a href="tel:4155550182" className="px-8 py-4 text-white font-semibold rounded-full border-2 border-white/20 hover:border-white/40 transition-colors uppercase tracking-wider text-sm">
            Call Us
          </a>
        </div>
      </div>
    </section>
  );
}`;

const footer = `import React from "react";

export default function Footer() {
  return (
    <footer className="bg-stone-950 border-t border-white/5 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-10">
          <div>
            <h4 className="text-amber-400 font-serif font-bold text-lg mb-4">Ember & Oak</h4>
            <p className="text-sm text-stone-400 leading-relaxed">
              Wood-fired fine dining in the heart of San Francisco&apos;s Mission District.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Hours</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>Tuesday &ndash; Thursday: 5:30 &ndash; 9:30 PM</li>
              <li>Friday &ndash; Saturday: 5:30 &ndash; 10:00 PM</li>
              <li>Sunday &ndash; Monday: Closed</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>742 Valencia St, San Francisco, CA 94110</li>
              <li>415-555-0182</li>
              <li>hello@emberandoak.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-stone-500">&copy; {new Date().getFullYear()} Ember & Oak. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-stone-500 hover:text-amber-400 transition-colors text-sm">Instagram</a>
            <a href="#" className="text-stone-500 hover:text-amber-400 transition-colors text-sm">Yelp</a>
            <a href="#" className="text-stone-500 hover:text-amber-400 transition-colors text-sm">OpenTable</a>
          </div>
        </div>
      </div>
    </footer>
  );
}`;

const styles = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600;1,700&display=swap');

:root {
  --color-primary: #d97706;
  --color-primary-light: #f59e0b;
  --color-bg: #0c0a09;
  --color-surface: #1c1917;
  --color-text: #fafaf9;
  --color-text-muted: #a8a29e;
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

.font-serif {
  font-family: 'Playfair Display', Georgia, serif;
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
    <div className="min-h-screen bg-stone-950 text-stone-100">
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

export const restaurantTemplate: TemplateSnapshot = {
  id: "restaurant",
  name: "Restaurant / Fine Dining",
  industry: "restaurant",
  description: "Warm, elegant restaurant website with full-bleed hero, menu highlights with pricing, chef story, guest reviews, and reservation CTA.",
  keywords: [
    "restaurant", "cafe", "food", "menu", "dining", "chef", "pizza", "sushi",
    "bar", "bistro", "bakery", "catering", "kitchen", "grill", "steakhouse",
    "seafood", "vegan", "organic", "farm to table", "wine", "cocktails",
    "brunch", "coffee shop", "deli", "taco", "ramen", "thai", "indian",
    "italian", "french", "mexican", "japanese", "fine dining",
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
  colors: { primary: "#d97706", bg: "#0c0a09", text: "#fafaf9" },
};
