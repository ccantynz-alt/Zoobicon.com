import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, Quote, Star, TrendingUp } from "lucide-react";
import { getIndustry, getAllIndustrySlugs, type IndustryData } from "@/lib/industry-seo";

interface Props {
  params: Promise<{ industry: string }>;
}

export async function generateStaticParams() {
  return getAllIndustrySlugs().map((industry) => ({ industry }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { industry: slug } = await params;
  const data = getIndustry(slug);
  if (!data) return {};

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `https://zoobicon.com/for/${data.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: data.metaTitle,
      description: data.metaDescription,
    },
    alternates: {
      canonical: `https://zoobicon.com/for/${data.slug}`,
    },
    keywords: data.keywords,
  };
}

export default async function IndustryPage({ params }: Props) {
  const { industry: slug } = await params;
  const data = getIndustry(slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: data.metaTitle,
            description: data.metaDescription,
            url: `https://zoobicon.com/for/${data.slug}`,
            isPartOf: { "@type": "WebSite", name: "Zoobicon", url: "https://zoobicon.com" },
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "https://zoobicon.com" },
                { "@type": "ListItem", position: 2, name: "Industries", item: "https://zoobicon.com/for" },
                { "@type": "ListItem", position: 3, name: data.name, item: `https://zoobicon.com/for/${data.slug}` },
              ],
            },
            mainEntity: {
              "@type": "SoftwareApplication",
              name: `Zoobicon for ${data.name}`,
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "AggregateOffer",
                lowPrice: "0",
                highPrice: "99",
                priceCurrency: "USD",
              },
            },
          }),
        }}
      />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-slate-300 mb-6">
            <Star className="w-4 h-4 text-yellow-400" /> Built for {data.name}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {data.headline}
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto mb-4">
            {data.subheadline}
          </p>
          <p className="text-base text-slate-500 max-w-2xl mx-auto mb-10">
            {data.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/builder?generator=${data.generatorType}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg text-white transition-all"
              style={{ backgroundColor: data.primaryColor }}
            >
              {data.ctaText} <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-lg text-white hover:bg-white/10 transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-16 px-4 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">The Problem with {data.name} Websites</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {data.painPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                <span className="text-red-400 font-bold text-lg mt-0.5">✕</span>
                <p className="text-slate-300">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How Zoobicon Solves It</h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Purpose-built AI generation for {data.name.toLowerCase()}. Every section, every feature, every word — optimized for your industry.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {data.features.map((feature, i) => (
              <div key={i} className="p-6 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-white/20 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${data.primaryColor}20` }}>
                    <Check className="w-4 h-4" style={{ color: data.primaryColor }} />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto text-center">
          <Quote className="w-10 h-10 text-slate-600 mx-auto mb-6" />
          <blockquote className="text-xl md:text-2xl font-medium mb-6 leading-relaxed">
            &ldquo;{data.testimonial.quote}&rdquo;
          </blockquote>
          <div className="mb-4">
            <p className="font-semibold">{data.testimonial.name}</p>
            <p className="text-sm text-slate-400">{data.testimonial.role}, {data.testimonial.company}</p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-sm text-emerald-400">
            <TrendingUp className="w-4 h-4" />
            {data.testimonial.metric}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Build Your {data.name} Website?</h2>
          <p className="text-slate-400 mb-8">Start free. No credit card required. Your website in 60 seconds.</p>
          <Link
            href={`/builder?generator=${data.generatorType}`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg text-white transition-all"
            style={{ backgroundColor: data.primaryColor }}
          >
            {data.ctaText} <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-slate-500 mt-4">
            Join thousands of {data.name.toLowerCase()} businesses building with AI
          </p>
        </div>
      </section>
    </div>
  );
}
