/**
 * Gallery, Contact, Blog, E-commerce, Forms, and Misc components
 * for the Zoobicon Component Registry.
 */
import { registerComponent } from "./index";

// ── GALLERY ──

registerComponent({
  id: "gallery-grid",
  name: "Gallery Grid",
  category: "gallery",
  variant: "grid",
  description: "Clean 3x3 image grid with hover overlay",
  tags: ["gallery", "portfolio", "photos", "images", "showcase", "creative"],
  code: `export default function Gallery() {
  const images = [
    { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", title: "Mountain Vista" },
    { src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop", title: "Starlit Peaks" },
    { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=400&fit=crop", title: "Forest Path" },
    { src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop", title: "Sunlit Canopy" },
    { src: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop", title: "Ocean Shore" },
    { src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop", title: "Golden Valley" },
  ];
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Our Work</h2>
        <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">A selection of our finest projects and creative endeavors.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, i) => (
            <div key={i} className="group relative overflow-hidden rounded-2xl aspect-[3/2] cursor-pointer">
              <img src={img.src} alt={img.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                <span className="text-white font-semibold text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">{img.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── CONTACT ──

registerComponent({
  id: "contact-split",
  name: "Contact Split",
  category: "contact",
  variant: "split",
  description: "Company info left, contact form right",
  tags: ["contact", "form", "email", "phone", "address", "reach", "support"],
  code: `export default function Contact() {
  return (
    <section id="contact" className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Get In Touch</h2>
          <p className="text-lg text-gray-600 mb-8">Have a project in mind? We'd love to hear from you. Send us a message and we'll respond within 24 hours.</p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div><div className="font-semibold text-gray-900">Email</div><div className="text-gray-600">hello@company.com</div></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <div><div className="font-semibold text-gray-900">Phone</div><div className="text-gray-600">+1 (555) 000-0000</div></div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div><div className="font-semibold text-gray-900">Office</div><div className="text-gray-600">123 Innovation Drive, San Francisco, CA 94107</div></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <form className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name</label><input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="John" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label><input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Doe" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="john@company.com" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Message</label><textarea rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" placeholder="Tell us about your project..." /></div>
            <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">Send Message</button>
          </form>
        </div>
      </div>
    </section>
  );
}`,
});

// ── BLOG ──

registerComponent({
  id: "blog-grid",
  name: "Blog Grid",
  category: "blog",
  variant: "grid",
  description: "3-column article card grid with images",
  tags: ["blog", "articles", "news", "posts", "content", "writing", "magazine"],
  code: `export default function Blog() {
  const posts = [
    { img: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&h=400&fit=crop", cat: "Engineering", title: "Building Scalable Systems with Modern Architecture", excerpt: "How we redesigned our infrastructure to handle 10x traffic without breaking a sweat.", date: "Mar 15, 2026", read: "5 min" },
    { img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop", cat: "Product", title: "Introducing Our New AI-Powered Dashboard", excerpt: "A deep dive into the features that make our latest release a game-changer for teams.", date: "Mar 12, 2026", read: "4 min" },
    { img: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop", cat: "Culture", title: "How We Built a Remote-First Culture That Works", excerpt: "Lessons learned from scaling a distributed team across 12 time zones.", date: "Mar 8, 2026", read: "6 min" },
  ];
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Latest from the Blog</h2>
        <p className="text-xl text-gray-600 text-center mb-16">Insights, updates, and stories from our team.</p>
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((p, i) => (
            <article key={i} className="group cursor-pointer">
              <div className="overflow-hidden rounded-2xl mb-4"><img src={p.img} alt={p.title} className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105" /></div>
              <div className="flex items-center gap-3 mb-3"><span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{p.cat}</span><span className="text-xs text-gray-400">{p.date} · {p.read} read</span></div>
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">{p.title}</h3>
              <p className="text-gray-600 leading-relaxed">{p.excerpt}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── E-COMMERCE ──

registerComponent({
  id: "ecommerce-product-grid",
  name: "Product Grid",
  category: "ecommerce",
  variant: "product-grid",
  description: "Product cards with images, prices, and add to cart",
  tags: ["ecommerce", "shop", "store", "products", "buy", "cart", "retail", "fashion"],
  code: `export default function Ecommerce() {
  const products = [
    { img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop", name: "Minimal Watch", price: 249, badge: "New" },
    { img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", name: "Pro Headphones", price: 179, badge: "Best Seller" },
    { img: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop", name: "Sport Sneakers", price: 129, badge: null },
    { img: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop", name: "Classic Sunglasses", price: 89, badge: "Sale" },
  ];
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-4">Featured Products</h2>
        <p className="text-xl text-gray-600 text-center mb-16">Handpicked for quality and style.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p, i) => (
            <div key={i} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="relative overflow-hidden">
                <img src={p.img} alt={p.name} className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105" />
                {p.badge && <span className="absolute top-3 left-3 text-xs font-semibold bg-black text-white px-2.5 py-1 rounded-full">{p.badge}</span>}
              </div>
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 mb-1">{p.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">\${p.price}</span>
                  <button className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">Add to Cart</button>
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

// ── MISC: LOGOS ──

registerComponent({
  id: "misc-logos",
  name: "Partner Logos",
  category: "misc",
  variant: "logos",
  description: "Partner/client logo strip with hover effects",
  tags: ["logos", "partners", "clients", "trusted", "companies", "brands", "social proof"],
  code: `export default function Misc() {
  const logos = ["Acme Corp", "TechFlow", "Innovate", "CloudBase", "DataPrime", "NexGen"];
  return (
    <section className="py-16 px-6 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-sm font-medium text-gray-400 mb-8 uppercase tracking-wider">Trusted by innovative companies worldwide</p>
        <div className="flex flex-wrap items-center justify-center gap-12">
          {logos.map((name, i) => (
            <span key={i} className="text-2xl font-bold text-gray-300 hover:text-gray-500 transition-colors cursor-default">{name}</span>
          ))}
        </div>
      </div>
    </section>
  );
}`,
});

// ── GALLERY: Masonry ──
registerComponent({ id: "gallery-masonry", name: "Gallery Masonry", category: "gallery", variant: "masonry", description: "Pinterest-style masonry layout", tags: ["gallery", "masonry", "pinterest", "portfolio", "creative", "photos"], code: `export default function Gallery() { const images=[{src:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=800&fit=crop",h:"h-80"},{src:"https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=400&fit=crop",h:"h-52"},{src:"https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=600&fit=crop",h:"h-64"},{src:"https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop",h:"h-52"},{src:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=800&fit=crop",h:"h-80"},{src:"https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=500&fit=crop",h:"h-56"}]; return (<section className="py-24 px-6 bg-white"><div className="max-w-7xl mx-auto"><h2 className="text-4xl font-bold text-gray-900 text-center mb-16">Gallery</h2><div className="columns-1 md:columns-2 lg:columns-3 gap-4">{images.map((img,i)=>(<div key={i} className="mb-4 break-inside-avoid group overflow-hidden rounded-xl cursor-pointer"><img src={img.src} alt="" className={\`w-full \${img.h} object-cover transition-transform duration-500 group-hover:scale-105\`} /></div>))}</div></div></section>); }` });

// ── GALLERY: Carousel ──
registerComponent({ id: "gallery-carousel", name: "Gallery Carousel", category: "gallery", variant: "carousel", description: "Horizontal scrolling carousel", tags: ["gallery", "carousel", "slider", "scroll", "showcase"], code: `export default function Gallery() { const images=["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=500&fit=crop","https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop"]; return (<section className="py-24 px-6 bg-gray-50"><div className="max-w-7xl mx-auto"><h2 className="text-4xl font-bold text-gray-900 text-center mb-16">Our Portfolio</h2><div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">{images.map((src,i)=>(<div key={i} className="flex-shrink-0 w-80 snap-center"><img src={src} alt="" className="w-full h-56 object-cover rounded-2xl hover:scale-[1.02] transition-transform" /></div>))}</div></div></section>); }` });

// ── CONTACT: Simple ──
registerComponent({ id: "contact-simple", name: "Contact Simple", category: "contact", variant: "simple", description: "Centered form with minimal fields", tags: ["contact", "form", "simple", "minimal", "email"], code: `export default function Contact() { return (<section className="py-24 px-6 bg-white"><div className="max-w-lg mx-auto text-center"><h2 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h2><p className="text-lg text-gray-600 mb-8">Drop us a line and we'll get back to you within 24 hours.</p><form className="space-y-4 text-left"><input type="text" placeholder="Your name" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" /><input type="email" placeholder="Your email" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500" /><textarea rows={4} placeholder="Your message" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none" /><button type="submit" className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">Send Message</button></form></div></section>); }` });

// ── BLOG: Featured ──
registerComponent({ id: "blog-featured", name: "Blog Featured", category: "blog", variant: "featured", description: "One large featured + 3 small articles", tags: ["blog", "featured", "articles", "news", "editorial"], code: `export default function Blog() { return (<section className="py-24 px-6 bg-white"><div className="max-w-7xl mx-auto"><h2 className="text-4xl font-bold text-gray-900 mb-16">Latest Articles</h2><div className="grid lg:grid-cols-2 gap-8"><div className="group cursor-pointer"><img src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=500&fit=crop" alt="" className="w-full h-72 object-cover rounded-2xl mb-4 group-hover:scale-[1.02] transition-transform" /><span className="text-sm text-indigo-600 font-semibold">Featured</span><h3 className="text-2xl font-bold text-gray-900 mt-1 group-hover:text-indigo-600 transition-colors">The Future of AI-Powered Development</h3><p className="text-gray-600 mt-2">How artificial intelligence is reshaping the way we build software.</p></div><div className="space-y-6">{[{img:"https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&h=150&fit=crop",title:"Understanding Modern Architecture Patterns",cat:"Engineering"},{img:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=150&fit=crop",title:"Building Remote Teams That Actually Work",cat:"Culture"},{img:"https://images.unsplash.com/photo-1551434678-e076c223a692?w=200&h=150&fit=crop",title:"From MVP to Scale: A Practical Guide",cat:"Product"}].map((p,i)=>(<div key={i} className="flex gap-4 group cursor-pointer"><img src={p.img} alt="" className="w-24 h-20 object-cover rounded-xl flex-shrink-0" /><div><span className="text-xs text-indigo-600 font-semibold">{p.cat}</span><h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{p.title}</h4></div></div>))}</div></div></div></section>); }` });

// ── ECOMMERCE: Categories ──
registerComponent({ id: "ecommerce-categories", name: "E-Commerce Categories", category: "ecommerce", variant: "categories", description: "Category cards with images", tags: ["ecommerce", "categories", "shop", "browse", "collections"], code: `export default function Ecommerce() { const cats=[{name:"Electronics",img:"https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop",count:"234 items"},{name:"Fashion",img:"https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",count:"567 items"},{name:"Home & Living",img:"https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=300&fit=crop",count:"189 items"},{name:"Sports",img:"https://images.unsplash.com/photo-1461896836934-bd45ba8c3e7e?w=400&h=300&fit=crop",count:"312 items"}]; return (<section className="py-24 px-6 bg-gray-50"><div className="max-w-7xl mx-auto"><h2 className="text-4xl font-bold text-gray-900 text-center mb-16">Shop by Category</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{cats.map((c,i)=>(<div key={i} className="group relative overflow-hidden rounded-2xl cursor-pointer"><img src={c.img} alt={c.name} className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><div className="absolute bottom-4 left-4"><h3 className="text-xl font-bold text-white">{c.name}</h3><p className="text-sm text-white/70">{c.count}</p></div></div>))}</div></div></section>); }` });

// ── FORM: Waitlist ──
registerComponent({ id: "form-waitlist", name: "Waitlist Form", category: "forms", variant: "waitlist", description: "Email capture with counter", tags: ["waitlist", "early access", "signup", "launch", "beta"], code: `export default function Forms() { return (<section className="py-24 px-6 bg-gradient-to-br from-indigo-600 to-purple-700"><div className="max-w-xl mx-auto text-center"><span className="inline-block text-sm font-semibold text-indigo-200 bg-white/10 px-4 py-1.5 rounded-full mb-6">Early Access</span><h2 className="text-4xl font-bold text-white mb-4">Join the Waitlist</h2><p className="text-lg text-indigo-200 mb-8">Be among the first to try our revolutionary platform. Limited spots available.</p><div className="flex gap-3 max-w-md mx-auto mb-6"><input type="email" placeholder="Enter your email" className="flex-1 px-5 py-4 rounded-xl text-gray-900" /><button className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors">Join</button></div><p className="text-indigo-200 text-sm">🎉 2,847 people already joined</p></div></section>); }` });

// ── MISC: Process Steps ──
registerComponent({ id: "misc-process", name: "Process Steps", category: "misc", variant: "process", description: "Numbered process steps", tags: ["process", "steps", "how it works", "workflow", "methodology"], code: `export default function Misc() { const steps=[{n:"01",title:"Discover",desc:"We learn about your business, goals, and target audience through in-depth research."},{n:"02",title:"Design",desc:"Our team creates wireframes and prototypes that bring your vision to life."},{n:"03",title:"Develop",desc:"We build your solution using modern technology and best practices."},{n:"04",title:"Deploy",desc:"Launch to production with monitoring, analytics, and ongoing support."}]; return (<section className="py-24 px-6 bg-white"><div className="max-w-7xl mx-auto"><h2 className="text-4xl font-bold text-gray-900 text-center mb-16">How It Works</h2><div className="grid md:grid-cols-4 gap-8">{steps.map((s,i)=>(<div key={i} className="text-center group"><div className="text-5xl font-black text-indigo-100 group-hover:text-indigo-200 transition-colors mb-4">{s.n}</div><h3 className="text-xl font-semibold text-gray-900 mb-2">{s.title}</h3><p className="text-gray-600">{s.desc}</p></div>))}</div></div></section>); }` });

// ── MISC: Comparison ──
registerComponent({ id: "misc-comparison", name: "Comparison", category: "misc", variant: "comparison", description: "Without Us vs With Us comparison", tags: ["comparison", "before after", "vs", "benefits", "upgrade"], code: `export default function Misc() { return (<section className="py-24 px-6 bg-gray-50"><div className="max-w-5xl mx-auto"><h2 className="text-4xl font-bold text-gray-900 text-center mb-16">See the Difference</h2><div className="grid md:grid-cols-2 gap-8"><div className="bg-white rounded-2xl p-8 border border-red-100"><h3 className="text-xl font-semibold text-red-600 mb-6">Without Us ❌</h3><ul className="space-y-3">{["Weeks of development time","Inconsistent design quality","No built-in SEO optimization","Manual deployment process","Limited scalability"].map((t,i)=>(<li key={i} className="flex items-center gap-2 text-gray-600"><span className="text-red-400">✕</span>{t}</li>))}</ul></div><div className="bg-white rounded-2xl p-8 border border-emerald-100 ring-2 ring-emerald-200"><h3 className="text-xl font-semibold text-emerald-600 mb-6">With Us ✓</h3><ul className="space-y-3">{["Ready in under 60 seconds","Agency-quality design every time","SEO optimized by default","One-click deployment","Infinite scalability built-in"].map((t,i)=>(<li key={i} className="flex items-center gap-2 text-gray-600"><span className="text-emerald-500">✓</span>{t}</li>))}</ul></div></div></div></section>); }` });

// ── MISC: Video Embed ──
registerComponent({ id: "misc-video", name: "Video Embed", category: "misc", variant: "video", description: "Video thumbnail with play button", tags: ["video", "demo", "tutorial", "watch", "play", "youtube"], code: `export default function Misc() { return (<section className="py-24 px-6 bg-white"><div className="max-w-4xl mx-auto text-center"><h2 className="text-4xl font-bold text-gray-900 mb-4">See It in Action</h2><p className="text-xl text-gray-600 mb-12">Watch how teams are building 10x faster with our platform.</p><div className="relative group cursor-pointer rounded-2xl overflow-hidden shadow-2xl"><img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=675&fit=crop" alt="Video thumbnail" className="w-full aspect-video object-cover" /><div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center"><div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg"><svg className="w-8 h-8 text-indigo-600 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div></div><div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">2:34</div></div></div></section>); }` });

// ── MISC: Countdown ──
registerComponent({ id: "misc-countdown", name: "Countdown Timer", category: "misc", variant: "countdown", description: "Launch countdown with email signup", tags: ["countdown", "launch", "timer", "coming soon", "prelaunch"], code: `export default function Misc() { const units=[{val:"12",label:"Days"},{val:"08",label:"Hours"},{val:"45",label:"Minutes"},{val:"23",label:"Seconds"}]; return (<section className="py-24 px-6 bg-gray-900"><div className="max-w-3xl mx-auto text-center"><span className="inline-block text-sm font-semibold text-indigo-300 bg-indigo-500/20 px-4 py-1.5 rounded-full mb-6">Coming Soon</span><h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Something Big Is Coming</h2><div className="flex justify-center gap-4 mb-12">{units.map((u,i)=>(<div key={i} className="bg-gray-800 rounded-2xl p-6 w-24"><div className="text-3xl font-bold text-white">{u.val}</div><div className="text-sm text-gray-400 mt-1">{u.label}</div></div>))}</div><div className="flex gap-3 max-w-md mx-auto"><input type="email" placeholder="Get notified" className="flex-1 px-5 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500" /><button className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">Notify Me</button></div></div></section>); }` });

// ── MISC: Integrations ──
registerComponent({ id: "misc-integrations", name: "Integrations Grid", category: "misc", variant: "integrations", description: "Works with tool icons grid", tags: ["integrations", "tools", "connect", "api", "plugins", "ecosystem"], code: `export default function Misc() { const tools=["Slack","GitHub","Figma","Notion","Stripe","Zapier","HubSpot","Jira","Linear","Discord","Vercel","AWS"]; return (<section className="py-24 px-6 bg-gray-50"><div className="max-w-4xl mx-auto text-center"><h2 className="text-4xl font-bold text-gray-900 mb-4">Works With Your Stack</h2><p className="text-xl text-gray-600 mb-16">Seamlessly integrates with the tools you already use.</p><div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">{tools.map((t,i)=>(<div key={i} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-center"><span className="text-sm font-semibold text-gray-700">{t}</span></div>))}</div></div></section>); }` });

// ── FORM: Signup ──
registerComponent({ id: "form-signup", name: "Signup Form", category: "forms", variant: "signup", description: "Email + password signup with social login", tags: ["signup", "register", "create account", "auth", "login"], code: `export default function Forms() { return (<section className="py-24 px-6 bg-white"><div className="max-w-md mx-auto"><h2 className="text-3xl font-bold text-gray-900 text-center mb-2">Create your account</h2><p className="text-gray-600 text-center mb-8">Start building in 60 seconds. No credit card required.</p><div className="space-y-3 mb-6"><button className="w-full py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">Continue with Google</button><button className="w-full py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">Continue with GitHub</button></div><div className="flex items-center gap-3 mb-6"><div className="flex-1 h-px bg-gray-200" /><span className="text-sm text-gray-400">or</span><div className="flex-1 h-px bg-gray-200" /></div><form className="space-y-4"><input type="text" placeholder="Full name" className="w-full px-4 py-3 border border-gray-200 rounded-xl" /><input type="email" placeholder="Email address" className="w-full px-4 py-3 border border-gray-200 rounded-xl" /><input type="password" placeholder="Password" className="w-full px-4 py-3 border border-gray-200 rounded-xl" /><button type="submit" className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">Create Account</button></form><p className="text-sm text-gray-400 text-center mt-4">Already have an account? <a href="#" className="text-indigo-600 hover:underline">Sign in</a></p></div></section>); }` });

// ── ECOMMERCE: Featured Product ──
registerComponent({ id: "ecommerce-featured", name: "Featured Product", category: "ecommerce", variant: "featured", description: "Hero product with details", tags: ["ecommerce", "product", "featured", "hero", "detail", "buy"], code: `export default function Ecommerce() { return (<section className="py-24 px-6 bg-white"><div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center"><div><img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop" alt="Product" className="w-full rounded-2xl shadow-lg" /></div><div><span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">New Release</span><h2 className="text-4xl font-bold text-gray-900 mt-4 mb-4">Minimal Classic Watch</h2><div className="flex items-center gap-2 mb-4"><div className="flex text-amber-400">{"★★★★★".split("").map((s,i)=>(<span key={i}>{s}</span>))}</div><span className="text-sm text-gray-500">(128 reviews)</span></div><p className="text-lg text-gray-600 mb-6">Precision craftsmanship meets minimal design. Swiss movement, sapphire crystal, genuine leather strap. Built to last a lifetime.</p><div className="text-3xl font-bold text-gray-900 mb-6">$249 <span className="text-lg text-gray-400 line-through ml-2">$349</span></div><div className="flex gap-4"><button className="flex-1 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors">Add to Cart</button><button className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">♡</button></div></div></div></section>); }` });
