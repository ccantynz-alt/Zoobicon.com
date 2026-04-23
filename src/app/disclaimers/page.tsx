import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal Disclaimers | Zoobicon",
  description: "Legal disclaimers, trademark notices, comparison accuracy statements, and liability limitations for Zoobicon products and services.",
  robots: { index: true, follow: true },
};

export default function DisclaimersPage() {
  return (
    <div className="min-h-screen text-white">
      <nav className="border-b border-white/[0.06] bg-[#0b1530]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="text-sm font-bold">Zoobicon</Link>
          <div className="flex gap-4 text-xs text-white/40">
            <Link href="/privacy" className="hover:text-white/60">Privacy</Link>
            <Link href="/terms" className="hover:text-white/60">Terms</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Legal Disclaimers</h1>
        <p className="text-sm text-white/40 mb-12">Last updated: March 2026</p>

        <div className="space-y-12 text-sm text-white/60 leading-relaxed">

          {/* 1. General */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. General Disclaimer</h2>
            <p className="mb-3">
              The information provided on zoobicon.com, zoobicon.ai, zoobicon.io, zoobicon.sh, and zoobicon.app
              (collectively, the &quot;Platform&quot;) is for general informational purposes only. While we strive to keep
              information accurate and up to date, we make no representations or warranties of any kind, express or
              implied, about the completeness, accuracy, reliability, suitability, or availability of the Platform or
              the information, products, services, or related graphics contained on the Platform.
            </p>
            <p>
              Any reliance you place on such information is strictly at your own risk. In no event will Zoobicon be
              liable for any loss or damage including, without limitation, indirect or consequential loss or damage,
              arising from the use of the Platform.
            </p>
          </section>

          {/* 2. Competitor Comparisons */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Product Comparisons & Competitor Information</h2>
            <p className="mb-3">
              Our product pages may include comparison tables and references to third-party products and services.
              These comparisons are provided for informational purposes to help users make informed decisions.
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li>All comparison data is based on publicly available information at the time of writing.</li>
              <li>Features, pricing, and availability of third-party products may change without notice.</li>
              <li>We make reasonable efforts to ensure accuracy but cannot guarantee that third-party information is current or complete.</li>
              <li>Comparisons reflect our good-faith understanding and are not intended to disparage any company or product.</li>
              <li>We encourage users to verify current features and pricing directly with the respective providers before making purchasing decisions.</li>
            </ul>
            <p>
              If you represent a company mentioned in our comparisons and believe any information is inaccurate,
              please contact us at <a href="mailto:legal@zoobicon.com" className="text-brand-400 underline">legal@zoobicon.com</a> and
              we will promptly review and correct any errors.
            </p>
          </section>

          {/* 3. Trademarks */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Trademark Notice</h2>
            <p className="mb-3">
              All product names, logos, brands, trademarks, and registered trademarks mentioned on the Platform are
              the property of their respective owners. The use of any trademark on the Platform does not imply any
              affiliation with, endorsement by, or sponsorship by the trademark owner.
            </p>
            <p className="mb-3">Specifically, the following are trademarks of their respective owners:</p>
            <ul className="list-disc pl-5 space-y-1 mb-3">
              <li>Calendly is a trademark of Calendly LLC.</li>
              <li>Acuity Scheduling is a trademark of Squarespace, Inc.</li>
              <li>NordVPN is a trademark of Nord Security.</li>
              <li>Surfshark is a trademark of Surfshark B.V.</li>
              <li>ExpressVPN is a trademark of Kape Technologies PLC.</li>
              <li>ProtonVPN is a trademark of Proton AG.</li>
              <li>Airalo is a trademark of Airalo AG.</li>
              <li>Holafly is a trademark of Holafly S.L.</li>
              <li>Otter.ai is a trademark of Otter.ai, Inc.</li>
              <li>Rev is a trademark of Rev.com, Inc.</li>
              <li>Descript is a trademark of Descript, Inc.</li>
              <li>Dropbox is a trademark of Dropbox, Inc.</li>
              <li>Google Drive is a trademark of Google LLC.</li>
              <li>iCloud is a trademark of Apple Inc.</li>
              <li>Stripe is a trademark of Stripe, Inc.</li>
              <li>Starlink is a trademark of Space Exploration Technologies Corp.</li>
              <li>SimplyBook.me is a trademark of SimplyBook.me Ltd.</li>
              <li>Fresha is a trademark of Fresha.com SV Ltd.</li>
            </ul>
            <p>
              &quot;Zoobicon&quot; and the Zoobicon logo are trademarks of Zoobicon. All rights reserved.
            </p>
          </section>

          {/* 4. Service Availability */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Service Availability & Third-Party Providers</h2>
            <p className="mb-3">
              Certain Zoobicon products and services rely on third-party infrastructure providers. The availability,
              performance, and coverage of these services depend on the respective third-party providers and are
              subject to their own terms of service and limitations.
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li><strong className="text-white/80">eSIM services:</strong> Coverage, network speeds, and availability vary by country and are determined by local mobile network operators. Quoted speeds (4G, 5G) represent the network technology available and do not guarantee specific throughput rates.</li>
              <li><strong className="text-white/80">VPN services:</strong> Connection speeds depend on server load, distance, and local internet conditions. Server locations and counts may change.</li>
              <li><strong className="text-white/80">Transcription services:</strong> Accuracy rates are approximate and depend on audio quality, language, accent, background noise, and other factors. Quoted accuracy (95%+) represents typical performance under good conditions.</li>
              <li><strong className="text-white/80">Cloud storage:</strong> Data durability figures represent the design targets of our storage infrastructure. No storage system can guarantee zero data loss under all circumstances.</li>
              <li><strong className="text-white/80">Booking & scheduling:</strong> Calendar synchronisation depends on third-party calendar providers (Google, Microsoft). AI features provide suggestions and predictions that should not be solely relied upon for business decisions.</li>
            </ul>
            <p>
              We are not responsible for outages, disruptions, or limitations caused by third-party providers, internet
              service providers, or force majeure events.
            </p>
          </section>

          {/* 5. AI */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Artificial Intelligence Disclaimer</h2>
            <p className="mb-3">
              Zoobicon uses artificial intelligence throughout the Platform, including but not limited to: website
              generation, content creation, transcription, booking suggestions, plan recommendations, and customer
              support.
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-3">
              <li>AI-generated content may contain errors, inaccuracies, or inappropriate content. Users should review all AI-generated output before publishing or relying upon it.</li>
              <li>AI recommendations (e.g., eSIM plan suggestions, booking time suggestions, no-show predictions) are probabilistic estimates, not guarantees.</li>
              <li>AI transcriptions should be reviewed for accuracy before use in legal, medical, or other professional contexts.</li>
              <li>We do not guarantee that AI-generated websites, content, or code will be free from errors, security vulnerabilities, or intellectual property concerns.</li>
            </ul>
          </section>

          {/* 6. Pricing */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Pricing Disclaimer</h2>
            <p className="mb-3">
              All prices displayed on the Platform are in United States Dollars (USD) unless otherwise stated.
              Prices are subject to change without notice. Applicable taxes, surcharges, and currency conversion
              fees may apply depending on your location and payment method.
            </p>
            <p>
              Promotional pricing, free trials, and introductory offers are subject to specific terms and may be
              modified or discontinued at any time. Current pricing is always available on our
              {" "}<Link href="/pricing" className="text-brand-400 underline">pricing page</Link>.
            </p>
          </section>

          {/* 7. Earnings */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. No Earnings or Results Guarantee</h2>
            <p>
              Any references to potential revenue, savings, or business outcomes on the Platform are for
              illustrative purposes only. Individual results vary based on numerous factors including but not
              limited to industry, location, market conditions, and individual effort. We do not guarantee any
              specific financial outcomes from the use of our products or services.
            </p>
          </section>

          {/* 8. Links */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. External Links</h2>
            <p>
              The Platform may contain links to external websites that are not provided or maintained by Zoobicon.
              We have no control over the content, privacy policies, or practices of third-party websites and
              accept no responsibility for them. Inclusion of any link does not imply endorsement, approval, or
              control by Zoobicon.
            </p>
          </section>

          {/* 9. Limitation of Liability */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, Zoobicon shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues,
              whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible
              losses resulting from your use of the Platform or any products or services offered through it.
            </p>
          </section>

          {/* 10. Governing Law */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Governing Law</h2>
            <p>
              These disclaimers and any disputes arising from the use of the Platform shall be governed by and
              construed in accordance with the laws of New Zealand, without regard to conflict of law principles.
              Any legal proceedings shall be subject to the exclusive jurisdiction of the courts of New Zealand.
            </p>
          </section>

          {/* 11. Contact */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contact</h2>
            <p>
              If you have questions about these disclaimers or believe any information on the Platform is inaccurate,
              please contact us at <a href="mailto:legal@zoobicon.com" className="text-brand-400 underline">legal@zoobicon.com</a>.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-white/20">zoobicon.com &middot; zoobicon.ai &middot; zoobicon.io &middot; zoobicon.sh</div>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-xs text-white/30 hover:text-white/50">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-white/30 hover:text-white/50">Terms of Service</Link>
            <Link href="/refund-policy" className="text-xs text-white/30 hover:text-white/50">Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
