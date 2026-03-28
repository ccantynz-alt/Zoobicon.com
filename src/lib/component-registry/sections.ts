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
