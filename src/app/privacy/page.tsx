import Link from "next/link";
import { Zap } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 86400; // Revalidate once per day

export const metadata: Metadata = {
  title: "Privacy Policy - Zoobicon",
  description: "Zoobicon Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0d1525] text-[#f0f0f2]">
      {/* Nav */}
      <nav className="border-b border-white/[0.08] bg-[#0d1525]/80 backdrop-blur-2xl">
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
        <h1 className="text-4xl font-black mb-2">Privacy Policy</h1>
        <p className="text-sm text-white/60 mb-12">Last updated: March 6, 2026</p>

        <div className="prose prose-invert max-w-none space-y-10 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Introduction</h2>
            <p>
              Zoobicon (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates zoobicon.com, zoobicon.ai, zoobicon.io, and
              zoobicon.sh (collectively, the &ldquo;Platform&rdquo;). This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our Platform and services.
            </p>
            <p className="mt-3">
              By using our Platform, you agree to the collection and use of information in accordance
              with this policy. If you do not agree, please discontinue use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Information We Collect</h2>
            <h3 className="text-base font-semibold text-white/80 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>Account registration details (name, email address, password)</li>
              <li>Profile information and preferences</li>
              <li>Content you create using our AI tools</li>
              <li>Support requests and communications</li>
              <li>Business information for agency or enterprise accounts</li>
            </ul>
            <h3 className="text-base font-semibold text-white/80 mb-2">2.2 Payment Information</h3>
            <p>
              We use <strong className="text-white">Stripe</strong> to process all payments. We do not
              collect, store, or have access to your full credit card number, CVV, or banking credentials.
              Stripe processes and stores your payment information in accordance with their own privacy
              policy and PCI DSS standards. By making a purchase, you also agree to{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 underline"
              >
                Stripe&apos;s Privacy Policy
              </a>.
              We may receive limited non-sensitive payment details such as the last four digits of
              your card, card brand, billing country, and transaction status.
            </p>
            <h3 className="text-base font-semibold text-white/80 mt-4 mb-2">2.3 Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>IP address and approximate location</li>
              <li>Browser type and version</li>
              <li>Device identifiers and operating system</li>
              <li>Pages visited and features used (usage data)</li>
              <li>Referring URLs and session duration</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To create and manage your account</li>
              <li>To process payments and prevent fraud via Stripe</li>
              <li>To deliver and improve our AI-powered services</li>
              <li>To send transactional emails (receipts, password resets, account notices)</li>
              <li>To send marketing communications (you may opt out at any time)</li>
              <li>To comply with legal obligations</li>
              <li>To analyze usage trends and improve the Platform</li>
              <li>To detect and prevent abuse, fraud, or security incidents</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Sharing Your Information</h2>
            <p>We do not sell your personal information. We may share it with:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong className="text-white">Stripe</strong> — payment processing and fraud prevention
              </li>
              <li>
                <strong className="text-white">Service providers</strong> — hosting, analytics, email
                delivery, and customer support tools, bound by confidentiality obligations
              </li>
              <li>
                <strong className="text-white">Legal authorities</strong> — when required by law, court
                order, or to protect our rights and users&apos; safety
              </li>
              <li>
                <strong className="text-white">Business transfers</strong> — in the event of a merger,
                acquisition, or sale of assets, your data may be transferred as part of that transaction
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Cookies</h2>
            <p>
              We use cookies and similar technologies to operate the Platform, remember your preferences,
              and understand how you use our services. You can control cookies through your browser settings.
              Disabling cookies may limit some functionality of the Platform.
            </p>
            <p className="mt-3">We use:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><strong className="text-white">Essential cookies</strong> — required for authentication and security</li>
              <li><strong className="text-white">Analytics cookies</strong> — to understand Platform usage</li>
              <li><strong className="text-white">Preference cookies</strong> — to remember your settings</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide
              you services. You may request deletion of your account and associated data at any time by
              contacting us at{" "}
              <a href="mailto:privacy@zoobicon.com" className="text-brand-400 hover:text-brand-300 underline">
                privacy@zoobicon.com
              </a>. We may retain certain data as required by law or for legitimate business purposes
              such as fraud prevention and financial recordkeeping.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict our processing of your data</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time (where processing is based on consent)</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@zoobicon.com" className="text-brand-400 hover:text-brand-300 underline">
                privacy@zoobicon.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Security</h2>
            <p>
              We implement industry-standard technical and organizational measures to protect your
              information, including encryption in transit (TLS) and at rest, access controls, and
              regular security reviews. However, no method of transmission or storage is 100% secure,
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Children&apos;s Privacy</h2>
            <p>
              Our Platform is not directed to children under 13 (or under 16 in the EU). We do not
              knowingly collect personal information from children. If you believe we have inadvertently
              collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own.
              We take steps to ensure appropriate safeguards are in place for such transfers in
              accordance with applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material
              changes by email or via a prominent notice on the Platform. The &ldquo;Last updated&rdquo; date at
              the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at:</p>
            <div className="mt-3 p-4 rounded-xl border border-white/[0.10] bg-white/[0.05] space-y-1">
              <p className="font-semibold text-white">Zoobicon</p>
              <p>
                Email:{" "}
                <a href="mailto:privacy@zoobicon.com" className="text-brand-400 hover:text-brand-300 underline">
                  privacy@zoobicon.com
                </a>
              </p>
              <p>Website: zoobicon.com</p>
            </div>
          </section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-white/[0.10] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">&copy; 2026 Zoobicon. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-white/60 hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-white/40 hover:text-white/60 transition-colors">Terms of Service</Link>
            <Link href="/" className="text-xs text-white/40 hover:text-white/60 transition-colors">Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
