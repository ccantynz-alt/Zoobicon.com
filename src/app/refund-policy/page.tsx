import Link from "next/link";
import {
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import BackgroundEffects from "@/components/BackgroundEffects";

export const metadata: Metadata = {
  title: "Refund Policy — Zoobicon",
  description:
    "Zoobicon Refund Policy — 14-day money-back guarantee on all paid plans. Learn how to request a refund and our refund terms.",
  openGraph: {
    title: "Refund Policy — Zoobicon",
    description: "14-day money-back guarantee on all paid plans. Zoobicon refund terms and conditions.",
    url: "https://zoobicon.com/refund-policy",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/refund-policy" },
  robots: { index: false, follow: true },
};

export default function RefundPolicyPage() {
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
        <h1 className="text-4xl font-black mb-2">Refund Policy</h1>
        <p className="text-sm text-white/60 mb-12">Last updated: March 25, 2026</p>

        <div className="prose prose-invert max-w-none space-y-10 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. 14-Day Money-Back Guarantee</h2>
            <p>
              All paid Zoobicon plans — Creator ($19/mo), Pro ($49/mo), and Agency ($99/mo) — come
              with a <strong className="text-white">14-day money-back guarantee</strong>. If you are
              not satisfied with your subscription for any reason, you may request a full refund
              within 14 days of your initial purchase or most recent renewal.
            </p>
            <p className="mt-3">
              No questions asked. We want you to feel confident trying Zoobicon, and this guarantee
              ensures you can do so risk-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How to Request a Refund</h2>
            <p>To request a refund, email us at:</p>
            <div className="mt-3 p-4 rounded-xl border border-white/[0.10] bg-white/[0.05]">
              <p>
                <a href="mailto:support@zoobicon.com" className="text-brand-400 hover:text-brand-300 underline">
                  support@zoobicon.com
                </a>
              </p>
            </div>
            <p className="mt-3">Include the following in your request:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Your account email address</li>
              <li>The plan you subscribed to</li>
              <li>The date of purchase</li>
              <li>Reason for the refund (optional, but helps us improve)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Refund Processing</h2>
            <p>
              Once your refund request is approved, we will process the refund within{" "}
              <strong className="text-white">5&ndash;10 business days</strong>. The refund will be
              issued to the original payment method used at checkout (via Stripe). Depending on your
              bank or card issuer, it may take an additional 3&ndash;5 business days for the refund
              to appear on your statement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. After the 14-Day Window</h2>
            <p>
              Refund requests made after the 14-day guarantee period are handled at our sole
              discretion. We may issue a full or partial refund depending on the circumstances, such
              as extended service outages or billing errors. We are under no obligation to grant
              refunds after the 14-day window, but we will review each case fairly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Free Tier</h2>
            <p>
              The Zoobicon free tier does not involve any payment. As such, no refund applies to free
              tier usage. If you were incorrectly charged while on the free tier, please contact us
              immediately and we will resolve the issue.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Partial Month Refunds</h2>
            <p>
              If you cancel your subscription partway through a billing cycle and are eligible for a
              refund under the 14-day guarantee, we will issue a{" "}
              <strong className="text-white">prorated refund</strong> for the unused portion of the
              billing period. After the 14-day window, cancellations take effect at the end of the
              current billing cycle, and no partial refund is issued.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Marketplace Add-Ons</h2>
            <p>
              Marketplace add-on purchases are refundable within{" "}
              <strong className="text-white">7 days</strong> of purchase, provided the add-on has not
              been activated or applied to a project. Once an add-on has been used (e.g., applied to
              a generated site, consumed credits), it is no longer eligible for a refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Enterprise Plans</h2>
            <p>
              Enterprise plan refunds are governed by the terms of the individual enterprise
              agreement. If you are on an Enterprise plan and need to discuss billing, please contact
              your account manager or email us at{" "}
              <a href="mailto:enterprise@zoobicon.com" className="text-brand-400 hover:text-brand-300 underline">
                enterprise@zoobicon.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Chargebacks</h2>
            <p>
              If you believe a charge is incorrect, please contact us before initiating a chargeback
              with your bank. We resolve most billing issues within 24 hours. Fraudulent chargebacks
              may result in account termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Contact Us</h2>
            <p>For any billing questions or refund requests:</p>
            <div className="mt-3 p-4 rounded-xl border border-white/[0.10] bg-white/[0.05] space-y-1">
              <p className="font-semibold text-white">Zoobicon</p>
              <p>
                Email:{" "}
                <a href="mailto:support@zoobicon.com" className="text-brand-400 hover:text-brand-300 underline">
                  support@zoobicon.com
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
