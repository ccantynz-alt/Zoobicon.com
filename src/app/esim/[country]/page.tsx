import { Metadata } from "next";

// Countries we target for SEO — each gets a unique page
const COUNTRIES: Record<string, {
  name: string; code: string; region: string; emoji: string;
  networks: string; speed: string; planFrom: string;
  description: string; tips: string[];
}> = {
  "new-zealand": {
    name: "New Zealand", code: "NZ", region: "Oceania", emoji: "🇳🇿",
    networks: "Spark, One NZ (Vodafone), 2degrees", speed: "4G/5G",
    planFrom: "$4.99", description: "Full 4G/5G coverage across both islands. Excellent in Auckland, Wellington, Christchurch, and Queenstown. Rural coverage strong on main highways.",
    tips: ["Activate before landing at Auckland Airport", "5G available in major cities", "Great coverage on tourist routes like Milford Sound road"],
  },
  "australia": {
    name: "Australia", code: "AU", region: "Oceania", emoji: "🇦🇺",
    networks: "Telstra, Optus, Vodafone AU", speed: "4G/5G",
    planFrom: "$4.99", description: "Excellent urban coverage. Telstra has the best rural reach. 5G in Sydney, Melbourne, Brisbane, Perth, Adelaide.",
    tips: ["Telstra network recommended for outback travel", "5G widespread in capital cities", "Consider 10GB+ plan for longer stays"],
  },
  "fiji": {
    name: "Fiji", code: "FJ", region: "Pacific Islands", emoji: "🇫🇯",
    networks: "Vodafone Fiji, Digicel Fiji", speed: "4G",
    planFrom: "$8.99", description: "Good coverage on Viti Levu (main island) and popular resort areas. Limited on outer islands. 4G in Suva and Nadi.",
    tips: ["Activate before leaving NZ/AU", "Coverage best around resorts and towns", "Download offline maps for island hopping"],
  },
  "samoa": {
    name: "Samoa", code: "WS", region: "Pacific Islands", emoji: "🇼🇸",
    networks: "Digicel Samoa, Bluesky", speed: "3G/4G",
    planFrom: "$8.99", description: "4G coverage in Apia and surrounding areas. 3G in rural Upolu and Savai'i. Growing network investment.",
    tips: ["Best coverage in Apia area", "Download content offline for rural areas", "Bluesky network expanding 4G rapidly"],
  },
  "tonga": {
    name: "Tonga", code: "TO", region: "Pacific Islands", emoji: "🇹🇴",
    networks: "Digicel Tonga", speed: "3G/4G",
    planFrom: "$8.99", description: "4G in Nuku'alofa. 3G coverage on main islands. Limited connectivity on outer island groups.",
    tips: ["Activate in NZ/AU before departure", "Main island has best coverage", "Consider offline maps for island groups"],
  },
  "thailand": {
    name: "Thailand", code: "TH", region: "Southeast Asia", emoji: "🇹🇭",
    networks: "AIS, DTAC, TrueMove", speed: "4G/5G",
    planFrom: "$4.99", description: "Excellent nationwide 4G. 5G in Bangkok, Chiang Mai, Phuket, Pattaya. Very affordable data.",
    tips: ["Thailand has some of the cheapest data in the world", "5G widespread in Bangkok", "Coverage good even on islands like Koh Samui"],
  },
  "indonesia": {
    name: "Indonesia", code: "ID", region: "Southeast Asia", emoji: "🇮🇩",
    networks: "Telkomsel, XL Axiata, Indosat", speed: "4G/5G",
    planFrom: "$4.99", description: "Strong 4G in Java, Bali, Sumatra. 5G rolling out in Jakarta. Coverage varies on smaller islands.",
    tips: ["Telkomsel has the widest coverage", "Bali has excellent 4G everywhere", "Consider higher data plan for video calls"],
  },
  "vietnam": {
    name: "Vietnam", code: "VN", region: "Southeast Asia", emoji: "🇻🇳",
    networks: "Viettel, Mobifone, Vinaphone", speed: "4G/5G",
    planFrom: "$4.99", description: "Excellent 4G nationwide. 5G in Hanoi and Ho Chi Minh City. Incredibly affordable data rates.",
    tips: ["Vietnam has amazing 4G coverage even in rural areas", "5G available in major cities", "Data is very cheap — get a larger plan"],
  },
  "philippines": {
    name: "Philippines", code: "PH", region: "Southeast Asia", emoji: "🇵🇭",
    networks: "Globe, Smart, DITO", speed: "4G/5G",
    planFrom: "$4.99", description: "Good 4G in Metro Manila, Cebu, Davao. Coverage varies across 7,000+ islands. 5G expanding in urban areas.",
    tips: ["Coverage best in urban areas", "Island connectivity varies — check coverage maps", "Globe and Smart have widest reach"],
  },
  "japan": {
    name: "Japan", code: "JP", region: "East Asia", emoji: "🇯🇵",
    networks: "NTT Docomo, au (KDDI), SoftBank", speed: "5G",
    planFrom: "$4.99", description: "World-class 5G and 4G everywhere. Shinkansen, subway, rural — Japan has near-perfect coverage nationwide.",
    tips: ["Japan has arguably the best mobile network in the world", "5G in all major cities", "Works underground in subway stations"],
  },
  "united-states": {
    name: "United States", code: "US", region: "North America", emoji: "🇺🇸",
    networks: "T-Mobile, AT&T, Verizon", speed: "5G",
    planFrom: "$4.99", description: "Extensive 5G/4G coverage in urban and suburban areas. Rural coverage improving. Works across all 50 states.",
    tips: ["T-Mobile has the widest 5G coverage", "Consider 10GB+ for longer trips", "Coverage excellent in cities, variable in national parks"],
  },
  "united-kingdom": {
    name: "United Kingdom", code: "GB", region: "Europe", emoji: "🇬🇧",
    networks: "EE, Three, Vodafone UK, O2", speed: "5G",
    planFrom: "$4.99", description: "Strong 5G in London, Manchester, Birmingham, Edinburgh. 4G covers virtually the entire country.",
    tips: ["5G widespread in major cities", "EU roaming may not apply post-Brexit — eSIM avoids this", "EE has best UK coverage"],
  },
};

const COUNTRY_SLUGS = Object.keys(COUNTRIES);

export function generateStaticParams() {
  return COUNTRY_SLUGS.map(country => ({ country }));
}

export function generateMetadata({ params }: { params: { country: string } }): Metadata {
  const data = COUNTRIES[params.country];
  if (!data) return { title: "eSIM Plans | Zoobicon" };
  return {
    title: `eSIM ${data.name} — Instant Data Plans from ${data.planFrom} | Zoobicon`,
    description: `Get instant eSIM data for ${data.name}. ${data.speed} on ${data.networks}. Activate in under 60 seconds. Plans from ${data.planFrom}. No physical SIM needed.`,
    openGraph: {
      title: `eSIM for ${data.name} ${data.emoji} | Zoobicon`,
      description: `Instant ${data.speed} data in ${data.name}. Plans from ${data.planFrom}/trip. Activate via QR code in seconds.`,
      url: `https://zoobicon.com/esim/${params.country}`,
    },
    alternates: { canonical: `https://zoobicon.com/esim/${params.country}` },
  };
}

export default function EsimCountryPage({ params }: { params: { country: string } }) {
  const data = COUNTRIES[params.country];

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a12] text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Country not found</h1>
          <p className="text-white/40">Check our <a href="/products/esim" className="text-cyan-400 underline">full eSIM coverage list</a>.</p>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Zoobicon eSIM — ${data.name}`,
    description: `Instant eSIM data plans for ${data.name}. ${data.speed} coverage on ${data.networks}. From ${data.planFrom}.`,
    url: `https://zoobicon.com/esim/${params.country}`,
    brand: { "@type": "Brand", name: "Zoobicon" },
    offers: { "@type": "Offer", price: data.planFrom.replace("$", ""), priceCurrency: "USD", availability: "https://schema.org/InStock" },
  };

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <nav className="border-b border-white/[0.06] bg-[#0a0a12]/90 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <a href="/" className="text-sm font-bold">Zoobicon</a>
          <div className="flex gap-4 text-xs text-white/40">
            <a href="/products/esim" className="hover:text-white/60">All eSIM Plans</a>
            <a href="/auth/signup" className="text-cyan-400 hover:text-cyan-300">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{data.emoji}</span>
            <div>
              <p className="text-xs text-cyan-400 font-medium uppercase tracking-wider">{data.region}</p>
              <h1 className="text-3xl sm:text-4xl font-bold">eSIM for {data.name}</h1>
            </div>
          </div>
          <p className="text-white/50 max-w-2xl mb-8">{data.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 text-center">
              <div className="text-lg font-bold text-cyan-400">{data.planFrom}</div>
              <div className="text-[10px] text-white/30 mt-1">Plans from</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 text-center">
              <div className="text-lg font-bold text-emerald-400">{data.speed}</div>
              <div className="text-[10px] text-white/30 mt-1">Network speed</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 text-center">
              <div className="text-lg font-bold text-purple-400">&lt;60s</div>
              <div className="text-[10px] text-white/30 mt-1">Activation time</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-4 text-center">
              <div className="text-lg font-bold text-amber-400">QR</div>
              <div className="text-[10px] text-white/30 mt-1">Scan & connect</div>
            </div>
          </div>

          <a href="/auth/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-sm hover:from-cyan-400 hover:to-blue-500 transition-all">
            Get eSIM for {data.name} →
          </a>
        </div>
      </section>

      {/* Networks */}
      <section className="py-12 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold mb-4">Networks in {data.name}</h2>
          <p className="text-sm text-white/50 mb-6">Your Zoobicon eSIM connects to premium local carriers: <span className="text-white/70">{data.networks}</span></p>

          <h3 className="text-lg font-semibold mb-3">Travel Tips</h3>
          <ul className="space-y-2">
            {data.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                <span className="text-cyan-400 mt-0.5">•</span>{tip}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold mb-6">How to get eSIM for {data.name}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Choose a plan", desc: `Select a data plan for ${data.name}. Plans start from ${data.planFrom}.` },
              { step: "2", title: "Scan QR code", desc: "We send you a QR code instantly. Scan it with your phone camera to install the eSIM." },
              { step: "3", title: "Connect", desc: `Your eSIM activates immediately on ${data.speed} networks. Start using data in ${data.name}.` },
            ].map(s => (
              <div key={s.step} className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5 text-center">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-sm font-bold text-cyan-400">{s.step}</span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-white/40">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other countries */}
      <section className="py-12 border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold mb-4">eSIM for other destinations</h2>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_SLUGS.filter(s => s !== params.country).map(slug => {
              const c = COUNTRIES[slug];
              return (
                <a key={slug} href={`/esim/${slug}`} className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/50 hover:text-white hover:border-cyan-500/30 transition-all">
                  {c.emoji} {c.name}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready for {data.name}?</h2>
          <p className="text-white/40 mb-6 text-sm">Get instant {data.speed} data. No SIM card. No store visits. Active in under 60 seconds.</p>
          <a href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-sm hover:from-cyan-400 hover:to-blue-500 transition-all">
            Get eSIM for {data.name} →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[10px] text-white/20">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</div>
          <div className="text-[10px] text-white/20">&copy; 2026 Zoobicon. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
