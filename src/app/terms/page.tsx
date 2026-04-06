import Link from "next/link";
import {
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import BackgroundEffects from "@/components/BackgroundEffects";

export const revalidate = 86400; // Revalidate once per day

export const metadata: Metadata = {
  title: "Terms of Service — Zoobicon",
  description:
    "Zoobicon Terms of Service — the rules and conditions for using our AI website builder platform. Usage policies, intellectual property, and account terms.",
  openGraph: {
    title: "Terms of Service — Zoobicon",
    description: "Terms and conditions for using the Zoobicon AI website builder platform.",
    url: "https://zoobicon.com/terms",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/terms" },
};

export default function TermsPage() {
  return (
    <div className="relative min-h-screen bg-[#0a0a12] text-[#e8e8ec]">
      <BackgroundEffects preset="minimal" />
      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur-2xl">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Zoobicon</span>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black mb-2">Terms of Service</h1>
        <p className="text-sm text-white/60 mb-12">Last updated: March 6, 2026</p>

        <div className="prose prose-invert max-w-none space-y-10 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using any Zoobicon platform — including zoobicon.com, zoobicon.ai,
              zoobicon.io, and zoobicon.sh (collectively, the &ldquo;Platform&rdquo;) — you agree to be bound
              by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to all of these Terms, you
              may not access or use the Platform.
            </p>
            <p className="mt-3">
              These Terms apply to all visitors, users, and customers. Additional terms may apply
              for specific products or services, and such additional terms are incorporated herein
              by reference.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Description of Services</h2>
            <p>Zoobicon provides AI-powered digital creation tools and services, including but not limited to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>AI Website Builder — automated website generation and hosting</li>
              <li>SEO Campaign Agent — autonomous search engine optimization services</li>
              <li>AI Video Creator — AI-generated video content for social platforms</li>
              <li>AI Email Support — automated customer support tooling</li>
              <li>Domain Registration — domain name registration and management</li>
              <li>Marketplace — add-ons, templates, and third-party integrations</li>
              <li>Developer API — programmatic access to Zoobicon services</li>
            </ul>
            <p className="mt-3">
              We reserve the right to modify, suspend, or discontinue any service at any time with
              reasonable notice where practicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Account Registration</h2>
            <p>
              To access certain features, you must create an account. You agree to provide accurate,
              current, and complete information and to keep your account information updated. You are
              responsible for maintaining the confidentiality of your credentials and for all activity
              that occurs under your account. Notify us immediately of any unauthorized access at{" "}
              <a href="mailto:support@zoobicon.com" className="text-brand-400 hover:text-brand-300 underline">
                support@zoobicon.com
              </a>.
            </p>
            <p className="mt-3">
              You must be at least 18 years of age (or the age of majority in your jurisdiction) to
              create an account and use paid services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Payments and Billing</h2>
            <h3 className="text-base font-semibold text-white/80 mb-2">4.1 Payment Processing</h3>
            <p>
              All payments are processed securely by <strong className="text-white">Stripe</strong>,
              our third-party payment processor. By providing payment information, you authorize Stripe
              to charge your payment method for all fees associated with your selected plan or
              purchases. You also agree to{" "}
              <a
                href="https://stripe.com/legal/ssa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 underline"
              >
                Stripe&apos;s Terms of Service
              </a>.
            </p>
            <h3 className="text-base font-semibold text-white/80 mt-4 mb-2">4.2 Subscription Plans</h3>
            <p>
              Paid subscriptions are billed on a recurring basis (monthly or annually, depending on
              your selection). Subscriptions automatically renew unless cancelled before the renewal date.
              You can cancel at any time from your account settings.
            </p>
            <h3 className="text-base font-semibold text-white/80 mt-4 mb-2">4.3 Price Changes</h3>
            <p>
              We reserve the right to change our pricing. We will give you at least 30 days&apos; advance
              notice of any price changes before they take effect.
            </p>
            <h3 className="text-base font-semibold text-white/80 mt-4 mb-2">4.4 Taxes</h3>
            <p>
              Prices shown may exclude applicable taxes. You are responsible for all taxes associated
              with your use of the Platform, except for taxes on Zoobicon&apos;s income.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Refund Policy</h2>
            <p>
              Subscription fees are generally non-refundable except where required by applicable law.
              If you believe you were charged in error, please contact us within 7 days of the charge
              at{" "}
              <a href="mailto:billing@zoobicon.com" className="text-brand-400 hover:text-brand-300 underline">
                billing@zoobicon.com
              </a>. We review refund requests on a case-by-case basis and may issue refunds at our
              sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Acceptable Use</h2>
            <p>You agree not to use the Platform to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Violate any applicable law, regulation, or third-party rights</li>
              <li>Generate, distribute, or promote illegal, harmful, or abusive content</li>
              <li>Infringe intellectual property rights of others</li>
              <li>Distribute malware, spam, or phishing content</li>
              <li>Attempt to gain unauthorized access to systems or accounts</li>
              <li>Reverse-engineer, scrape, or systematically extract Platform data</li>
              <li>Interfere with the operation or availability of the Platform</li>
              <li>Impersonate any person or entity</li>
              <li>Use AI-generated content to deceive or defraud others</li>
            </ul>
            <p className="mt-3">
              Violation of these terms may result in immediate suspension or termination of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Intellectual Property</h2>
            <h3 className="text-base font-semibold text-white/80 mb-2">7.1 Zoobicon IP</h3>
            <p>
              All Platform software, designs, trademarks, and content created by Zoobicon are our
              exclusive property. Nothing in these Terms grants you ownership of any Zoobicon IP.
            </p>
            <h3 className="text-base font-semibold text-white/80 mt-4 mb-2">7.2 Your Content</h3>
            <p>
              You retain ownership of content you create using the Platform. By using the Platform,
              you grant Zoobicon a limited, non-exclusive, royalty-free license to host, process,
              and display your content solely to provide the services to you.
            </p>
            <h3 className="text-base font-semibold text-white/80 mt-4 mb-2">7.3 AI-Generated Output</h3>
            <p>
              You are responsible for ensuring that your use of AI-generated output complies with
              applicable laws, including copyright laws. Zoobicon does not warrant that AI-generated
              content is free from third-party claims.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Third-Party Services</h2>
            <p>
              The Platform integrates with third-party services including Stripe for payments, and
              others for hosting, analytics, and AI infrastructure. Your use of third-party services
              is subject to their respective terms and privacy policies. We are not responsible for
              the practices or content of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Disclaimer of Warranties</h2>
            <p>
              THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
              FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM
              WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT AI-GENERATED CONTENT WILL BE ACCURATE
              OR COMPLETE.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ZOOBICON SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
              REVENUE, DATA, OR BUSINESS, ARISING FROM YOUR USE OF THE PLATFORM, EVEN IF ADVISED
              OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-3">
              OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE OF
              THE PLATFORM SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO US IN THE
              THREE MONTHS PRECEDING THE CLAIM, OR (B) $50.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Zoobicon and its officers, directors,
              employees, and agents from any claims, damages, losses, or expenses (including
              reasonable attorneys&apos; fees) arising from your use of the Platform, your violation
              of these Terms, or your violation of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Termination</h2>
            <p>
              We may suspend or terminate your access to the Platform at any time for violation of
              these Terms or for any other reason, with or without notice. Upon termination, your
              right to use the Platform ceases immediately. You may terminate your account at any
              time via your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the
              State of Delaware, United States, without regard to its conflict of law provisions.
              Any disputes shall be resolved in the courts of Delaware, and you consent to personal
              jurisdiction therein.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">14. Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms at any time. We will notify you of material
              changes via email or a notice on the Platform at least 14 days before the new terms
              take effect. Continued use of the Platform after the effective date constitutes
              acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">15. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us:</p>
            <div className="mt-3 p-4 rounded-xl border border-white/[0.10] bg-white/[0.05] space-y-1">
              <p className="font-semibold text-white">Zoobicon</p>
              <p>
                Email:{" "}
                <a href="mailto:legal@zoobicon.com" className="text-brand-400 hover:text-brand-300 underline">
                  legal@zoobicon.com
                </a>
              </p>
              <p>Website: zoobicon.com</p>
            </div>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-white/[0.10] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/60">&copy; 2026 Zoobicon. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-white/60 hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-white/60 hover:text-white/60 transition-colors">Terms of Service</Link>
            <Link href="/" className="text-xs text-white/60 hover:text-white/60 transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
