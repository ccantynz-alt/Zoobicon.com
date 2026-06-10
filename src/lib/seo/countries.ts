/**
 * Country catalog for /ai-website-builder-in/[country] programmatic SEO.
 *
 * Phase 3 of the global SEO campaign. The competitor catalog
 * (competitors.ts) targets high-intent buy-side queries. The niche
 * catalog (niches.ts) targets long-tail industry queries. This
 * catalog targets the international SEO surface: anyone searching
 * "AI website builder {country}" or "AI website builder NZ" or
 * the equivalent in regional English.
 *
 * Why country pages matter for an AI builder: regional SEO is the
 * single highest-leverage international channel. A Brazilian SaaS
 * founder searching "construtor de sites com IA Brasil" should
 * land on a page that speaks to Brazilian payment methods, currency
 * pricing, hosting latency, and TLD options.
 *
 * Honesty rule: every regional claim has to hold up. If we say
 * "Stripe Brazil supported" that has to be true at click time.
 */

export interface Country {
  slug: string;
  /** ISO-style display name */
  name: string;
  /** Country emoji flag */
  flag: string;
  /** Primary spoken language for marketing tone */
  language: string;
  /** Primary currency */
  currency: string;
  /** Currency symbol */
  currencySymbol: string;
  /** Localized starting price string for hero */
  pricingNote: string;
  /** Country code top-level domain */
  ccTLD: string;
  /** Hero tagline */
  tagline: string;
  /** Meta description sentence */
  metaPitch: string;
  /** What makes this market distinctive — drives the "Why Zoobicon for {country}" section */
  marketContext: string[];
  /** Payment methods that work locally (via Stripe through Vapron) */
  paymentMethods: string[];
  /** Niches especially popular in this market (slug refs into niches.ts) */
  popularNiches: string[];
  /** Vapron-suggested hosting region for low latency */
  hostingRegion: string;
  /** FAQ entries — both for users AND for FAQPage JSON-LD */
  faqs: Array<{ q: string; a: string }>;
}

// ────────────────────────────────────────────────────────────────────
// Catalog — 20 countries covering the major English-speaking
// markets + EU + LATAM + key Asia-Pacific and Middle-East surfaces.
// ────────────────────────────────────────────────────────────────────

const countries: Country[] = [
  {
    slug: "us",
    name: "United States",
    flag: "🇺🇸",
    language: "English",
    currency: "USD",
    currencySymbol: "$",
    pricingNote: "$49/mo Starter · 1 custom domain included",
    ccTLD: ".com",
    tagline: "The AI website builder for American businesses.",
    metaPitch: "AI website builder for the US market. Stripe USD checkout, .com domain registration via Vapron, hosting in iad1. Restaurants, SaaS, real-estate, agencies.",
    marketContext: [
      "Stripe USD billing — the default for any US business",
      "Vercel iad1 hosting region via Vapron — sub-50ms latency from the East Coast",
      ".com domain registration is the default expectation; .ai and .io are widely accepted",
      "Pricing displayed in USD; receipts auto-issued for tax season",
    ],
    paymentMethods: ["Stripe (cards, ACH, Apple Pay, Google Pay)", "Stripe Link", "Buy Now Pay Later (Affirm, Klarna)"],
    popularNiches: ["saas-startups", "restaurants", "real-estate-agents", "lawyers", "ecommerce-stores", "consultants"],
    hostingRegion: "iad1 (Northern Virginia)",
    faqs: [
      {
        q: "Does Zoobicon work for US businesses?",
        a: "Yes — Zoobicon is built on Stripe USD by default, hosts customer sites through Vapron's iad1 region for sub-50ms East Coast latency, and ships .com domain registration through the same checkout. Most niche templates (restaurants, SaaS, real estate, law firms) target the US market by default.",
      },
      {
        q: "Can I claim Zoobicon as a business expense on my US taxes?",
        a: "Subscription costs to software services are typically deductible business expenses. Zoobicon ships proper receipts via the Stripe portal; consult your CPA for specifics to your situation.",
      },
      {
        q: "Does the generated site work with US payment processors beyond Stripe?",
        a: "The generated site emits standard data-driven checkout CTAs. While Stripe through Vapron is the default, the React codebase is yours — wire up Square, Authorize.Net, or PayPal if your business already runs on one of them.",
      },
    ],
  },
  {
    slug: "uk",
    name: "United Kingdom",
    flag: "🇬🇧",
    language: "British English",
    currency: "GBP",
    currencySymbol: "£",
    pricingNote: "£39/mo Starter · 1 custom domain included",
    ccTLD: ".co.uk",
    tagline: "The AI website builder built for British businesses.",
    metaPitch: "AI website builder for UK businesses. Stripe GBP, .co.uk and .uk domains via Vapron, hosting in lhr1. Tailored for restaurants, SaaS, agencies, professional services.",
    marketContext: [
      "Stripe GBP billing with VAT-compliant receipts",
      "Vercel lhr1 (London) hosting region via Vapron",
      ".co.uk is the most-trusted UK TLD; .uk and .com both widely accepted",
      "Cookie consent + GDPR-aligned footer copy generated by default",
    ],
    paymentMethods: ["Stripe (cards, Apple Pay, Google Pay)", "BACS direct debit", "Klarna"],
    popularNiches: ["saas-startups", "lawyers", "accountants", "restaurants", "consultants"],
    hostingRegion: "lhr1 (London)",
    faqs: [
      {
        q: "Is Zoobicon GDPR-compliant for UK businesses?",
        a: "The generated site ships with GDPR-aligned cookie consent and footer copy by default. Zoobicon itself processes minimal personal data (Stripe handles billing PII). Review your own use case against ICO guidance; the platform meets the structural baseline.",
      },
      {
        q: "Can I register a .co.uk domain through Zoobicon?",
        a: "Yes — .co.uk and .uk are registered via Vapron's API at deploy time. Standard registration fees apply (typically £7-15/yr depending on TLD).",
      },
      {
        q: "Where will my customer site be hosted?",
        a: "By default, Vapron hosts UK customer sites in their London (lhr1) region for sub-30ms latency across the UK.",
      },
    ],
  },
  {
    slug: "ca",
    name: "Canada",
    flag: "🇨🇦",
    language: "English / French",
    currency: "CAD",
    currencySymbol: "$",
    pricingNote: "$65 CAD/mo Starter · 1 custom domain included",
    ccTLD: ".ca",
    tagline: "The AI website builder for Canadian businesses.",
    metaPitch: "AI website builder for Canada. Stripe CAD, .ca domains via Vapron, hosting in Toronto. Tailored for restaurants, SaaS, real-estate, professional services.",
    marketContext: [
      "Stripe CAD billing with GST/HST/QST tax handling",
      "Vercel yyz1 (Toronto) hosting region via Vapron for low cross-Canada latency",
      ".ca registration through CIRA's registry partners",
      "Bilingual (EN/FR) site generation available for Quebec compliance",
    ],
    paymentMethods: ["Stripe (cards, Interac, Apple Pay)", "Stripe Link"],
    popularNiches: ["real-estate-agents", "saas-startups", "restaurants", "fitness-trainers"],
    hostingRegion: "yyz1 (Toronto)",
    faqs: [
      {
        q: "Can Zoobicon generate a bilingual EN/FR site for Quebec?",
        a: "The generated site supports a French copy variant — describe what you want in both languages and the Copywriter agent produces the EN and FR versions. Auto-toggle UI is on the roadmap.",
      },
      {
        q: "Can I register a .ca domain?",
        a: "Yes — .ca registration via Vapron goes through CIRA's accredited registrar partners. Note that .ca requires Canadian presence (citizen, resident, or registered Canadian business) per CIRA rules.",
      },
    ],
  },
  {
    slug: "au",
    name: "Australia",
    flag: "🇦🇺",
    language: "Australian English",
    currency: "AUD",
    currencySymbol: "$",
    pricingNote: "$75 AUD/mo Starter · 1 custom domain included",
    ccTLD: ".com.au",
    tagline: "The AI website builder built for Aussie businesses.",
    metaPitch: "AI website builder for Australia. Stripe AUD, .com.au domains via Vapron, hosting in syd1. Tailored for restaurants, agencies, trades, professional services.",
    marketContext: [
      "Stripe AUD billing with GST-compliant receipts",
      "Vercel syd1 (Sydney) hosting region via Vapron for sub-30ms across AU",
      ".com.au is the trust signal — requires ABN/ACN per auDA rules",
      "Afterpay + Zip BNPL widely expected by Aussie consumers",
    ],
    paymentMethods: ["Stripe (cards, Apple Pay)", "Afterpay", "Zip", "POLi"],
    popularNiches: ["restaurants", "fitness-trainers", "real-estate-agents", "freelancers", "cafes-and-coffee-shops"],
    hostingRegion: "syd1 (Sydney)",
    faqs: [
      {
        q: "Can I register a .com.au domain through Zoobicon?",
        a: "Yes — .com.au registration through Vapron requires a valid ABN, ACN, or registered business name per auDA rules. The deploy flow checks this before completing registration.",
      },
      {
        q: "Will Australian customers see Afterpay and Zip on my site?",
        a: "Yes — when you wire Stripe through Vapron's billing layer, Stripe's Afterpay/Zip surfaces appear automatically for Australian shoppers at checkout.",
      },
    ],
  },
  {
    slug: "nz",
    name: "New Zealand",
    flag: "🇳🇿",
    language: "New Zealand English",
    currency: "NZD",
    currencySymbol: "$",
    pricingNote: "$79 NZD/mo Starter · 1 custom domain included",
    ccTLD: ".co.nz",
    tagline: "The AI website builder built in Aotearoa, for Kiwi businesses.",
    metaPitch: "AI website builder for New Zealand. Stripe NZD, .co.nz and .nz domains via Vapron, hosting in syd1. Built by a Kiwi team for Kiwi businesses.",
    marketContext: [
      "Built in New Zealand — Zoobicon's HQ is in Aotearoa",
      "Stripe NZD billing with GST-compliant receipts",
      "Vercel syd1 (Sydney) hosting via Vapron — sub-50ms across NZ",
      ".co.nz and .nz both widely accepted; .kiwi available for cultural identity",
    ],
    paymentMethods: ["Stripe (cards, Apple Pay)", "Afterpay", "Laybuy", "POLi"],
    popularNiches: ["cafes-and-coffee-shops", "restaurants", "freelancers", "real-estate-agents", "yoga-studios"],
    hostingRegion: "syd1 (Sydney — primary AU/NZ)",
    faqs: [
      {
        q: "Is Zoobicon built in New Zealand?",
        a: "Yes — Zoobicon's founding team is based in Aotearoa New Zealand. Local support hours align with Kiwi business hours, and we ship NZ-aware defaults (GST receipts, NZD pricing, .co.nz TLD support).",
      },
      {
        q: "Can I register a .co.nz domain?",
        a: "Yes — .co.nz, .nz, and .kiwi registrations are handled through Vapron's API at deploy time. Standard NZ registry fees apply.",
      },
    ],
  },
  {
    slug: "ie",
    name: "Ireland",
    flag: "🇮🇪",
    language: "English (Hiberno-English)",
    currency: "EUR",
    currencySymbol: "€",
    pricingNote: "€45/mo Starter · 1 custom domain included",
    ccTLD: ".ie",
    tagline: "The AI website builder for Irish businesses.",
    metaPitch: "AI website builder for Ireland. Stripe EUR, .ie domains via Vapron, hosting in dub1. EU-compliant, GDPR-ready out of the box.",
    marketContext: [
      "Stripe EUR billing with VAT-compliant Irish receipts",
      "Vercel dub1 (Dublin) hosting region via Vapron",
      ".ie registration through IEDR's accredited registrars",
      "GDPR cookie consent shipped by default",
    ],
    paymentMethods: ["Stripe (cards, Apple Pay, Google Pay)", "SEPA direct debit", "Klarna"],
    popularNiches: ["restaurants", "lawyers", "accountants", "saas-startups", "freelancers"],
    hostingRegion: "dub1 (Dublin)",
    faqs: [
      {
        q: "Can I register a .ie domain?",
        a: "Yes — .ie registration through Vapron requires proof of Irish connection (resident, business, organization) per IEDR rules. The deploy flow checks before completing.",
      },
      {
        q: "Is the generated site GDPR-compliant for the EU?",
        a: "The site ships with GDPR-aligned cookie consent, ePrivacy-ready tracking opt-in, and DPA-friendly footer copy by default. Review your specific data processing against the DPC's guidance.",
      },
    ],
  },
  {
    slug: "de",
    name: "Germany",
    flag: "🇩🇪",
    language: "German / English",
    currency: "EUR",
    currencySymbol: "€",
    pricingNote: "€45/mo Starter · 1 custom domain included",
    ccTLD: ".de",
    tagline: "Der KI-Website-Builder für deutsche Unternehmen.",
    metaPitch: "AI website builder for Germany. Stripe EUR, .de domains via Vapron, hosting in fra1. GDPR-strict mode + Impressum copy by default.",
    marketContext: [
      "Stripe EUR billing with VAT receipts that meet German Finanzamt requirements",
      "Vercel fra1 (Frankfurt) hosting region via Vapron",
      ".de is by far the most-trusted German TLD",
      "GDPR-strict cookie banner + auto-generated Impressum scaffold",
    ],
    paymentMethods: ["Stripe (Sofort, Giropay, SEPA, cards)", "Klarna", "PayPal"],
    popularNiches: ["saas-startups", "consultants", "accountants", "lawyers", "freelancers"],
    hostingRegion: "fra1 (Frankfurt)",
    faqs: [
      {
        q: "Does the generated site include an Impressum?",
        a: "Yes — German market sites ship with an Impressum scaffold by default. You'll need to fill in your specific business details; the structure meets §5 TMG requirements.",
      },
      {
        q: "Welche Zahlungsmethoden funktionieren in Deutschland?",
        a: "Über Stripe (via Vapron) unterstützen wir Sofort, Giropay, SEPA-Lastschrift, Kreditkarten, Apple Pay und Google Pay. Klarna und PayPal über separate Integrationen.",
      },
    ],
  },
  {
    slug: "fr",
    name: "France",
    flag: "🇫🇷",
    language: "Français / English",
    currency: "EUR",
    currencySymbol: "€",
    pricingNote: "€45/mois Starter · 1 domaine personnalisé inclus",
    ccTLD: ".fr",
    tagline: "Le constructeur de sites web IA pour les entreprises françaises.",
    metaPitch: "Constructeur de sites web IA pour la France. Stripe EUR, domaines .fr via Vapron, hébergement à Paris (cdg1). Mentions légales + RGPD prêtes.",
    marketContext: [
      "Stripe EUR billing with TVA receipts",
      "Vercel cdg1 (Paris) hosting region via Vapron",
      ".fr through AFNIC's accredited registrars",
      "RGPD cookie banner + Mentions légales scaffold by default",
    ],
    paymentMethods: ["Stripe (cards, Apple Pay, SEPA)", "Klarna", "PayPal"],
    popularNiches: ["restaurants", "cafes-and-coffee-shops", "saas-startups", "consultants", "freelancers"],
    hostingRegion: "cdg1 (Paris)",
    faqs: [
      {
        q: "Le site généré est-il conforme au RGPD ?",
        a: "Oui — bandeau cookies RGPD-conforme et scaffold Mentions légales générés par défaut. Vérifiez votre cas d'usage spécifique contre les recommandations de la CNIL.",
      },
      {
        q: "Puis-je enregistrer un domaine .fr ?",
        a: "Oui — l'enregistrement .fr passe par les registrars accrédités AFNIC via Vapron. Tarifs standards (typiquement 8-15€/an).",
      },
    ],
  },
  {
    slug: "es",
    name: "Spain",
    flag: "🇪🇸",
    language: "Español / English",
    currency: "EUR",
    currencySymbol: "€",
    pricingNote: "€45/mes Starter · 1 dominio personalizado incluido",
    ccTLD: ".es",
    tagline: "El creador de sitios web con IA para empresas españolas.",
    metaPitch: "Creador de sitios web con IA para España. Stripe EUR, dominios .es vía Vapron, hosting en mad1. Aviso legal + RGPD por defecto.",
    marketContext: [
      "Stripe EUR billing with IVA receipts",
      "Vercel mad1 (Madrid) hosting region via Vapron",
      ".es through Red.es's accredited registrars",
      "RGPD + LSSI-CE-compliant footer scaffold",
    ],
    paymentMethods: ["Stripe (cards, Bizum, Apple Pay)", "Klarna", "PayPal"],
    popularNiches: ["restaurants", "cafes-and-coffee-shops", "fitness-trainers", "yoga-studios", "freelancers"],
    hostingRegion: "mad1 (Madrid)",
    faqs: [
      {
        q: "¿El sitio generado cumple con el RGPD y la LSSI-CE?",
        a: "Sí — banner de cookies RGPD-conforme, scaffold de Aviso Legal, y políticas de privacidad LSSI-CE por defecto. Revise su caso específico contra las guías de la AEPD.",
      },
    ],
  },
  {
    slug: "it",
    name: "Italy",
    flag: "🇮🇹",
    language: "Italiano / English",
    currency: "EUR",
    currencySymbol: "€",
    pricingNote: "€45/mese Starter · 1 dominio personalizzato incluso",
    ccTLD: ".it",
    tagline: "Il creatore di siti web con IA per aziende italiane.",
    metaPitch: "Creatore di siti web con IA per l'Italia. Stripe EUR, domini .it via Vapron, hosting a Milano (mxp1). GDPR-conforme dal primo deploy.",
    marketContext: [
      "Stripe EUR billing with IVA-compliant receipts (richiesta fattura elettronica)",
      "Vercel mxp1 (Milan) hosting region via Vapron",
      ".it through Registro.it's accredited registrars",
      "GDPR cookie banner + Cookie Policy scaffold",
    ],
    paymentMethods: ["Stripe (cards, Apple Pay)", "Klarna", "Satispay", "PayPal"],
    popularNiches: ["restaurants", "cafes-and-coffee-shops", "hotels-and-bnbs", "freelancers"],
    hostingRegion: "mxp1 (Milan)",
    faqs: [
      {
        q: "Posso ricevere la fattura elettronica per Zoobicon?",
        a: "Le ricevute Stripe sono disponibili dal portale di fatturazione. Per la fatturazione elettronica italiana specifica (SdI), il flusso richiede integrazione esterna — è sul roadmap.",
      },
    ],
  },
  {
    slug: "nl",
    name: "Netherlands",
    flag: "🇳🇱",
    language: "Nederlands / English",
    currency: "EUR",
    currencySymbol: "€",
    pricingNote: "€45/mo Starter · 1 custom domain included",
    ccTLD: ".nl",
    tagline: "De AI website builder voor Nederlandse bedrijven.",
    metaPitch: "AI website builder voor Nederland. Stripe EUR met iDEAL, .nl domeinen via Vapron, hosting in Amsterdam (ams1). AVG-compliant standaard.",
    marketContext: [
      "Stripe EUR billing with BTW-compliant receipts",
      "Vercel ams1 (Amsterdam) hosting via Vapron",
      "iDEAL is essentially required for Dutch ecommerce",
      ".nl is the trusted Dutch TLD; .com still widely accepted",
    ],
    paymentMethods: ["Stripe (iDEAL, Bancontact, cards, Apple Pay)", "Klarna"],
    popularNiches: ["restaurants", "cafes-and-coffee-shops", "saas-startups", "freelancers"],
    hostingRegion: "ams1 (Amsterdam)",
    faqs: [
      {
        q: "Werkt iDEAL met Zoobicon?",
        a: "Ja — Stripe via Vapron ondersteunt iDEAL standaard voor Nederlandse klanten. iDEAL verschijnt automatisch in de checkout voor Nederlandse shoppers.",
      },
    ],
  },
  {
    slug: "se",
    name: "Sweden",
    flag: "🇸🇪",
    language: "Svenska / English",
    currency: "SEK",
    currencySymbol: "kr",
    pricingNote: "499 kr/mo Starter · 1 custom domain included",
    ccTLD: ".se",
    tagline: "AI-webbplatsbyggaren för svenska företag.",
    metaPitch: "AI website builder for Sweden. Stripe SEK with Swish, .se domains via Vapron, hosting in arn1. GDPR + Swedish consumer law compliant.",
    marketContext: [
      "Stripe SEK billing with moms-compliant receipts",
      "Vercel arn1 (Stockholm) hosting via Vapron",
      "Klarna originated in Sweden — widely expected at checkout",
      ".se through The Swedish Internet Foundation",
    ],
    paymentMethods: ["Stripe (Swish, Klarna, cards, Apple Pay)"],
    popularNiches: ["cafes-and-coffee-shops", "restaurants", "saas-startups", "freelancers"],
    hostingRegion: "arn1 (Stockholm)",
    faqs: [
      {
        q: "Stödjer Zoobicon Swish?",
        a: "Ja — Stripe via Vapron stödjer Swish som standard för svenska kunder. Swish visas automatiskt i checkouten.",
      },
    ],
  },
  {
    slug: "br",
    name: "Brazil",
    flag: "🇧🇷",
    language: "Português / English",
    currency: "BRL",
    currencySymbol: "R$",
    pricingNote: "R$249/mês Starter · 1 domínio personalizado incluído",
    ccTLD: ".com.br",
    tagline: "O construtor de sites com IA para empresas brasileiras.",
    metaPitch: "Construtor de sites com IA para o Brasil. Stripe BRL com PIX, domínios .com.br via Vapron, hospedagem em São Paulo (gru1). LGPD-conforme.",
    marketContext: [
      "Stripe BRL billing with NF-e–compatible receipts",
      "Vercel gru1 (São Paulo) hosting via Vapron",
      "PIX is essentially required — most Brazilian shoppers prefer it over cards",
      ".com.br through Registro.br",
      "LGPD cookie consent shipped by default",
    ],
    paymentMethods: ["Stripe (PIX, cards, Boleto)", "Mercado Pago"],
    popularNiches: ["ecommerce-stores", "restaurants", "saas-startups", "freelancers", "fitness-trainers"],
    hostingRegion: "gru1 (São Paulo)",
    faqs: [
      {
        q: "O Zoobicon funciona com PIX?",
        a: "Sim — Stripe via Vapron suporta PIX como método de pagamento padrão para clientes brasileiros. PIX aparece automaticamente no checkout.",
      },
      {
        q: "Posso registrar um domínio .com.br?",
        a: "Sim — registro .com.br via Vapron passa pelo Registro.br. Requer CPF ou CNPJ brasileiro conforme as regras do registro.",
      },
    ],
  },
  {
    slug: "mx",
    name: "Mexico",
    flag: "🇲🇽",
    language: "Español / English",
    currency: "MXN",
    currencySymbol: "$",
    pricingNote: "$899 MXN/mes Starter · 1 dominio personalizado incluido",
    ccTLD: ".mx",
    tagline: "El creador de sitios web con IA para empresas mexicanas.",
    metaPitch: "Creador de sitios web con IA para México. Stripe MXN con OXXO, dominios .com.mx vía Vapron, hosting en Querétaro (qro1). LFPDPPP-conforme.",
    marketContext: [
      "Stripe MXN billing with CFDI-compatible receipts (factura)",
      "Vercel qro1 (Querétaro) hosting region via Vapron",
      "OXXO cash payments are essential for Mexican ecommerce",
      ".com.mx and .mx through NIC México",
    ],
    paymentMethods: ["Stripe (OXXO, cards, SPEI, Apple Pay)", "Mercado Pago"],
    popularNiches: ["restaurants", "ecommerce-stores", "saas-startups", "freelancers"],
    hostingRegion: "qro1 (Querétaro)",
    faqs: [
      {
        q: "¿Funciona con OXXO?",
        a: "Sí — Stripe vía Vapron soporta pagos OXXO por defecto para clientes mexicanos. OXXO aparece automáticamente en el checkout para compradores en México.",
      },
    ],
  },
  {
    slug: "in",
    name: "India",
    flag: "🇮🇳",
    language: "English / Hindi",
    currency: "INR",
    currencySymbol: "₹",
    pricingNote: "₹3,999/mo Starter · 1 custom domain included",
    ccTLD: ".in",
    tagline: "The AI website builder for Indian businesses.",
    metaPitch: "AI website builder for India. Stripe INR with UPI, .in domains via Vapron, hosting in bom1. Built for India's mobile-first commerce.",
    marketContext: [
      "Stripe INR billing with GST-compliant receipts",
      "Vercel bom1 (Mumbai) hosting region via Vapron",
      "UPI is the dominant payment rail — essential for Indian ecommerce",
      ".in and .co.in through NIXI's accredited registrars",
      "Mobile-first rendering — Indian audiences are predominantly mobile",
    ],
    paymentMethods: ["Stripe (UPI, cards, Net Banking, wallets)", "Razorpay"],
    popularNiches: ["saas-startups", "ecommerce-stores", "consultants", "freelancers", "coaches"],
    hostingRegion: "bom1 (Mumbai)",
    faqs: [
      {
        q: "Does Zoobicon support UPI payments?",
        a: "Yes — Stripe via Vapron supports UPI as a default payment method for Indian customers. UPI appears automatically in checkout for Indian shoppers.",
      },
      {
        q: "Can I register a .in domain?",
        a: "Yes — .in and .co.in registration through Vapron goes via NIXI's accredited registrar partners. Standard NIXI fees apply.",
      },
    ],
  },
  {
    slug: "sg",
    name: "Singapore",
    flag: "🇸🇬",
    language: "English / Mandarin / Bahasa",
    currency: "SGD",
    currencySymbol: "$",
    pricingNote: "$65 SGD/mo Starter · 1 custom domain included",
    ccTLD: ".sg",
    tagline: "The AI website builder for Singaporean businesses.",
    metaPitch: "AI website builder for Singapore. Stripe SGD with PayNow, .sg domains via Vapron, hosting in sin1. Built for Singapore's enterprise + SME market.",
    marketContext: [
      "Stripe SGD billing with GST-inclusive receipts",
      "Vercel sin1 (Singapore) hosting region via Vapron",
      "PayNow is essential for Singaporean consumers",
      ".sg through SGNIC's accredited registrars",
    ],
    paymentMethods: ["Stripe (PayNow, cards, Apple Pay, Grab Pay)", "GrabPay"],
    popularNiches: ["saas-startups", "consultants", "restaurants", "ecommerce-stores"],
    hostingRegion: "sin1 (Singapore)",
    faqs: [
      {
        q: "Does Zoobicon support PayNow?",
        a: "Yes — Stripe via Vapron supports PayNow as a default payment method for Singaporean customers. PayNow appears automatically in checkout for SG shoppers.",
      },
    ],
  },
  {
    slug: "ae",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    language: "English / Arabic",
    currency: "AED",
    currencySymbol: "د.إ",
    pricingNote: "AED 179/mo Starter · 1 custom domain included",
    ccTLD: ".ae",
    tagline: "The AI website builder for businesses across the Emirates.",
    metaPitch: "AI website builder for the UAE. Stripe AED with cards, .ae domains via Vapron, hosting in fra1 (low-latency to MENA). Built for Dubai's startup market.",
    marketContext: [
      "Stripe AED billing with VAT-compliant receipts",
      "Vercel fra1 (Frankfurt) hosting via Vapron — sub-100ms to UAE",
      ".ae through TDRA's accredited registrars; .com.ae for commerce",
      "Bilingual EN/AR site generation supported",
    ],
    paymentMethods: ["Stripe (cards, Apple Pay)", "Tabby (BNPL)", "Tamara (BNPL)"],
    popularNiches: ["saas-startups", "consultants", "restaurants", "real-estate-agents", "ecommerce-stores"],
    hostingRegion: "fra1 (Frankfurt — primary MENA edge)",
    faqs: [
      {
        q: "Can Zoobicon generate a bilingual EN/AR site?",
        a: "The generated site supports an Arabic copy variant. Describe what you want in both languages and the Copywriter agent produces EN + AR. RTL layout support is on the roadmap; for now, AR content renders LTR.",
      },
    ],
  },
  {
    slug: "za",
    name: "South Africa",
    flag: "🇿🇦",
    language: "English",
    currency: "ZAR",
    currencySymbol: "R",
    pricingNote: "R899/mo Starter · 1 custom domain included",
    ccTLD: ".co.za",
    tagline: "The AI website builder for South African businesses.",
    metaPitch: "AI website builder for South Africa. Stripe ZAR, .co.za domains via Vapron, hosting in cpt1. POPIA-aligned cookie banner by default.",
    marketContext: [
      "Stripe ZAR billing with VAT-compliant receipts",
      "Vercel cpt1 (Cape Town) hosting region via Vapron",
      ".co.za through ZACR",
      "POPIA-aligned cookie banner + privacy policy scaffold",
    ],
    paymentMethods: ["Stripe (cards, Apple Pay)", "Yoco", "Ozow"],
    popularNiches: ["saas-startups", "consultants", "restaurants", "freelancers"],
    hostingRegion: "cpt1 (Cape Town)",
    faqs: [
      {
        q: "Is the generated site POPIA-compliant?",
        a: "The site ships with POPIA-aligned cookie consent and privacy policy scaffold by default. Review your specific data processing against the Information Regulator's guidance.",
      },
    ],
  },
  {
    slug: "jp",
    name: "Japan",
    flag: "🇯🇵",
    language: "日本語 / English",
    currency: "JPY",
    currencySymbol: "¥",
    pricingNote: "¥7,500/月 Starter · 1 custom domain included",
    ccTLD: ".jp",
    tagline: "日本のビジネスのためのAIウェブサイトビルダー。",
    metaPitch: "AI website builder for Japan. Stripe JPY with Konbini + Pay-easy, .jp domains via Vapron, hosting in hnd1. Built for Japan's mobile-first commerce.",
    marketContext: [
      "Stripe JPY billing with Japanese consumption-tax-compliant receipts",
      "Vercel hnd1 (Tokyo) hosting region via Vapron",
      "Konbini (convenience-store) payments are essential",
      ".jp and .co.jp through JPRS's accredited registrars",
      "Mobile-first rendering — Japanese audiences are predominantly mobile",
    ],
    paymentMethods: ["Stripe (Konbini, Pay-easy, cards, Apple Pay)", "PayPay"],
    popularNiches: ["restaurants", "cafes-and-coffee-shops", "ecommerce-stores", "saas-startups"],
    hostingRegion: "hnd1 (Tokyo)",
    faqs: [
      {
        q: "Konbini決済に対応していますか？",
        a: "はい、VapronのStripe統合により、日本のお客様にはKonbini（コンビニ）決済とPay-easyがデフォルトで利用可能です。チェックアウト時に自動的に表示されます。",
      },
    ],
  },
  {
    slug: "kr",
    name: "South Korea",
    flag: "🇰🇷",
    language: "한국어 / English",
    currency: "KRW",
    currencySymbol: "₩",
    pricingNote: "₩69,000/월 Starter · 1 custom domain included",
    ccTLD: ".kr",
    tagline: "한국 기업을 위한 AI 웹사이트 빌더.",
    metaPitch: "AI website builder for South Korea. Stripe KRW, .kr domains via Vapron, hosting in icn1. Built for Korea's mobile-commerce + KakaoTalk culture.",
    marketContext: [
      "Stripe KRW billing with VAT-compliant receipts",
      "Vercel icn1 (Seoul) hosting region via Vapron",
      ".kr and .co.kr through KISA's accredited registrars",
      "KakaoPay + Naver Pay widely expected",
    ],
    paymentMethods: ["Stripe (cards, Apple Pay)", "KakaoPay", "Naver Pay"],
    popularNiches: ["saas-startups", "ecommerce-stores", "restaurants", "cafes-and-coffee-shops"],
    hostingRegion: "icn1 (Seoul)",
    faqs: [
      {
        q: "Zoobicon은 카카오페이를 지원합니까?",
        a: "Stripe via Vapron의 직접 카카오페이 통합은 로드맵에 있습니다. 현재로서는 별도의 카카오페이 가맹점 계정을 통해 통합할 수 있으며, 생성된 React 코드베이스에 직접 배선됩니다.",
      },
    ],
  },
];

export const COUNTRIES: Country[] = countries;

export function getCountry(slug: string): Country | undefined {
  return COUNTRIES.find((c) => c.slug === slug);
}
