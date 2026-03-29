"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  Copy,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Mail,
  Lock,
  Eye,
  Cookie,
  MapPin,
  CreditCard,
  User,
  BarChart3,
  ArrowRight,
  FileText,
} from "lucide-react";

const DATA_OPTIONS = [
  { id: "email", label: "Email addresses", icon: Mail },
  { id: "name", label: "Names", icon: User },
  { id: "payment", label: "Payment information", icon: CreditCard },
  { id: "cookies", label: "Cookies", icon: Cookie },
  { id: "analytics", label: "Analytics data", icon: BarChart3 },
  { id: "location", label: "Location data", icon: MapPin },
];

function generatePolicy(config: {
  companyName: string;
  websiteUrl: string;
  email: string;
  country: string;
  dataCollected: string[];
  gdpr: boolean;
  ccpa: boolean;
  childrenData: boolean;
}): string {
  const {
    companyName, websiteUrl, email, country,
    dataCollected, gdpr, ccpa, childrenData,
  } = config;
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const name = companyName || "[Your Company Name]";
  const site = websiteUrl || "[Your Website URL]";
  const contactEmail = email || "[your@email.com]";
  const loc = country || "[Your Country]";

  const dataList = dataCollected.length > 0
    ? dataCollected.map(d => {
        const labels: Record<string, string> = {
          email: "Email addresses — collected when you subscribe, register, or contact us",
          name: "Personal names — collected during account registration or form submissions",
          payment: "Payment information — processed securely through third-party payment processors",
          cookies: "Cookies and tracking technologies — used to improve your browsing experience",
          analytics: "Analytics data — including pages visited, time on site, and referral sources",
          location: "Location data — approximate geographic location based on IP address",
        };
        return `  - ${labels[d] || d}`;
      }).join("\n")
    : "  - No specific data types selected";

  let policy = `PRIVACY POLICY
${"=".repeat(60)}

Last updated: ${date}

${name} ("we," "our," or "us") operates ${site} (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.

Please read this Privacy Policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this Privacy Policy, please do not access the Service.


1. INFORMATION WE COLLECT
${"—".repeat(40)}

We may collect the following types of information:

${dataList}

We collect this information when you:
  - Visit our website
  - Create an account or fill out a form
  - Make a purchase or transaction
  - Subscribe to our newsletter
  - Contact us directly


2. HOW WE USE YOUR INFORMATION
${"—".repeat(40)}

We use the information we collect to:
  - Provide, operate, and maintain our Service
  - Improve, personalize, and expand our Service
  - Understand and analyze how you use our Service
  - Develop new products, services, features, and functionality
  - Communicate with you for customer service, updates, and marketing
  - Process transactions and send related information
  - Find and prevent fraud
  - Comply with legal obligations


3. SHARING YOUR INFORMATION
${"—".repeat(40)}

We do not sell your personal information. We may share your information in the following situations:
  - With service providers who assist us in operating our website and conducting business
  - To comply with legal obligations or respond to lawful requests
  - To protect and defend our rights or property
  - With your consent or at your direction
  - In connection with a merger, acquisition, or sale of assets


4. DATA SECURITY
${"—".repeat(40)}

We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.


5. COOKIES AND TRACKING TECHNOLOGIES
${"—".repeat(40)}

${dataCollected.includes("cookies") ? `We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.

Types of cookies we use:
  - Essential cookies — required for the website to function properly
  - Analytics cookies — help us understand how visitors interact with our website
  - Preference cookies — remember your settings and preferences
  - Marketing cookies — used to track visitors across websites for advertising

You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.` : `We may use cookies and similar tracking technologies. You can control cookie preferences through your browser settings.`}


6. THIRD-PARTY SERVICES
${"—".repeat(40)}

Our Service may contain links to third-party websites or services that are not operated by us. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party sites or services. We strongly advise you to review the Privacy Policy of every site you visit.


7. DATA RETENTION
${"—".repeat(40)}

We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, and enforce our policies.

`;

  if (gdpr) {
    policy += `
8. YOUR RIGHTS UNDER GDPR (European Economic Area)
${"—".repeat(40)}

If you are a resident of the European Economic Area (EEA), you have certain data protection rights under the General Data Protection Regulation (GDPR):

  - Right of access — You can request copies of your personal data.
  - Right to rectification — You can request correction of inaccurate or incomplete data.
  - Right to erasure — You can request deletion of your personal data under certain conditions.
  - Right to restrict processing — You can request restriction of processing under certain conditions.
  - Right to data portability — You can request transfer of your data to another organization.
  - Right to object — You can object to processing of your personal data.
  - Rights related to automated decision-making — You have the right not to be subject to decisions based solely on automated processing.

To exercise any of these rights, please contact us at ${contactEmail}. We will respond to your request within 30 days.

Legal basis for processing:
  - Your consent
  - Performance of a contract
  - Compliance with a legal obligation
  - Our legitimate interests

`;
  }

  if (ccpa) {
    policy += `
${gdpr ? "9" : "8"}. YOUR RIGHTS UNDER CCPA (California)
${"—".repeat(40)}

If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA):

  - Right to know — You can request disclosure of the categories and specific pieces of personal information we have collected.
  - Right to delete — You can request deletion of your personal information.
  - Right to opt-out — You can opt out of the sale of your personal information. Note: We do not sell personal information.
  - Right to non-discrimination — We will not discriminate against you for exercising your CCPA rights.

To exercise your rights, contact us at ${contactEmail}. We will verify your identity before processing your request and respond within 45 days.

`;
  }

  if (childrenData) {
    const sectionNum = 8 + (gdpr ? 1 : 0) + (ccpa ? 1 : 0);
    policy += `
${sectionNum}. CHILDREN'S PRIVACY
${"—".repeat(40)}

Our Service is not directed to anyone under the age of 13 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your Child has provided us with personal data, please contact us at ${contactEmail}. If we become aware that we have collected personal data from children without verification of parental consent, we take steps to remove that information from our servers.

`;
  }

  const lastSection = 8 + (gdpr ? 1 : 0) + (ccpa ? 1 : 0) + (childrenData ? 1 : 0);

  policy += `
${lastSection}. CHANGES TO THIS PRIVACY POLICY
${"—".repeat(40)}

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.


${lastSection + 1}. CONTACT US
${"—".repeat(40)}

If you have any questions about this Privacy Policy, please contact us:

  Company: ${name}
  Website: ${site}
  Email: ${contactEmail}
  Country: ${loc}

${"=".repeat(60)}
Generated by Zoobicon Privacy Policy Generator
https://zoobicon.com/tools/privacy-policy-generator
`;

  return policy;
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Zoobicon Free Privacy Policy Generator",
      applicationCategory: "WebApplication",
      operatingSystem: "Any",
      url: "https://zoobicon.com/tools/privacy-policy-generator",
      description: "Generate a complete, legally-informed privacy policy for your website in seconds. Supports GDPR and CCPA compliance. Free, no signup required.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      creator: { "@type": "Organization", name: "Zoobicon", url: "https://zoobicon.com" },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        { "@type": "Question", name: "Is this privacy policy generator free?", acceptedAnswer: { "@type": "Answer", text: "Yes, completely free with no signup or account required. Generate as many privacy policies as you need. The generated policy is yours to use however you wish." } },
        { "@type": "Question", name: "Is the generated privacy policy legally valid?", acceptedAnswer: { "@type": "Answer", text: "Our generator creates a comprehensive privacy policy template based on common legal requirements including GDPR and CCPA provisions. However, we recommend having a qualified attorney review the policy for your specific jurisdiction and business needs." } },
        { "@type": "Question", name: "Does it support GDPR and CCPA?", acceptedAnswer: { "@type": "Answer", text: "Yes. You can toggle GDPR compliance (for EU/EEA visitors), CCPA compliance (for California residents), and children's data protection. Each toggle adds the appropriate legal sections and user rights to your policy." } },
        { "@type": "Question", name: "Can I customize the privacy policy?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. Enter your company details, select which types of data you collect, enable relevant compliance options, and the generator produces a tailored policy. You can then copy or download it and make additional edits as needed." } },
      ],
    },
  ],
};

export default function PrivacyPolicyGeneratorPage() {
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [dataCollected, setDataCollected] = useState<string[]>(["cookies", "analytics"]);
  const [gdpr, setGdpr] = useState(false);
  const [ccpa, setCcpa] = useState(false);
  const [childrenData, setChildrenData] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const policy = useMemo(() => {
    if (!generated) return "";
    return generatePolicy({ companyName, websiteUrl, email, country, dataCollected, gdpr, ccpa, childrenData });
  }, [generated, companyName, websiteUrl, email, country, dataCollected, gdpr, ccpa, childrenData]);

  const toggleData = (id: string) => {
    setDataCollected(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    setGenerated(true);
    setTimeout(() => {
      document.getElementById("policy-preview")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(policy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([policy], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `privacy-policy-${companyName.toLowerCase().replace(/\s+/g, "-") || "website"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const faqs = [
    { q: "Is this privacy policy generator free?", a: "Yes, completely free with no signup or account required. Generate as many privacy policies as you need. The generated policy is yours to use on any website." },
    { q: "Is the generated privacy policy legally valid?", a: "Our generator creates a comprehensive privacy policy template based on common legal requirements including GDPR and CCPA provisions. We recommend having a qualified attorney review the policy for your specific jurisdiction and business needs." },
    { q: "Does it support GDPR and CCPA?", a: "Yes. Toggle GDPR compliance for EU/EEA visitors, CCPA compliance for California residents, and children's data protection. Each toggle adds the appropriate legal sections and user rights to your generated policy." },
    { q: "Can I customize the generated policy?", a: "Absolutely. Enter your company details, select which types of data you collect, enable relevant compliance options, and the generator produces a tailored policy. Copy or download it and make any additional edits you need." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a14] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-indigo-400">Zoo</span>bicon
          </Link>
          <Link href="/tools" className="text-sm text-white/50 hover:text-white transition-colors">
            All Tools
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium mb-4">
            <Shield className="w-3 h-3" /> Free Tool
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Free Privacy Policy Generator
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            Generate a complete, professionally written privacy policy for your website in seconds.
            Supports GDPR, CCPA, and children&apos;s data compliance.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            {/* Company Info */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                Company Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="Acme Inc."
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Website URL</label>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Contact Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="privacy@example.com"
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="New Zealand"
                    className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
              </div>
            </div>

            {/* Data Collected */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" />
                Data You Collect
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {DATA_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const active = dataCollected.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => toggleData(opt.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all ${
                        active
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                          : "bg-white/[0.02] border-white/[0.06] text-white/50 hover:border-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{opt.label}</span>
                      {active && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Compliance Toggles */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-400" />
                Compliance Options
              </h2>
              <div className="space-y-4">
                {[
                  { label: "GDPR Compliance", desc: "Required if you have visitors from the EU/EEA", value: gdpr, set: setGdpr },
                  { label: "CCPA Compliance", desc: "Required if you have visitors from California", value: ccpa, set: setCcpa },
                  { label: "Children's Data", desc: "Add COPPA-related children's privacy section", value: childrenData, set: setChildrenData },
                ].map(toggle => (
                  <div key={toggle.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{toggle.label}</p>
                      <p className="text-xs text-white/40">{toggle.desc}</p>
                    </div>
                    <button
                      onClick={() => toggle.set(!toggle.value)}
                      className={`w-12 h-7 rounded-full transition-colors relative ${
                        toggle.value ? "bg-indigo-500" : "bg-white/10"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                          toggle.value ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Generate Privacy Policy
            </button>
          </div>

          {/* Preview */}
          <div id="policy-preview">
            {!generated ? (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 h-full flex flex-col items-center justify-center text-center min-h-[400px]">
                <Shield className="w-12 h-12 text-white/10 mb-4" />
                <p className="text-white/30 text-lg mb-2">Your privacy policy will appear here</p>
                <p className="text-white/20 text-sm">Fill in your details and click Generate</p>
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                  <h2 className="font-semibold text-sm">Generated Privacy Policy</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-xs transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-xs transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download .txt
                    </button>
                  </div>
                </div>
                <pre className="p-6 text-xs text-white/70 whitespace-pre-wrap max-h-[700px] overflow-y-auto leading-relaxed font-mono">
                  {policy}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <h3 className="font-semibold text-sm">{faq.q}</h3>
                  {faqOpen === i ? (
                    <ChevronUp className="w-4 h-4 text-white/40 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
                  )}
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-sm text-white/50 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/10 rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-3">Need a website to go with that policy?</h2>
          <p className="text-white/50 mb-6 max-w-lg mx-auto">
            Build a complete, professional website with AI in under 60 seconds. Privacy policy included.
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold transition-colors"
          >
            Try the AI Website Builder <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-white/15">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</p>
        </div>
      </div>
    </div>
  );
}
