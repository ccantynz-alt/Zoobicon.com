import Link from "next/link";
import {
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import BackgroundEffects from "@/components/BackgroundEffects";

export const metadata: Metadata = {
  title: "DMCA Policy — Zoobicon",
  description:
    "Zoobicon DMCA Policy — how to file a copyright infringement claim, counter-notification process, and designated DMCA agent information.",
  openGraph: {
    title: "DMCA Policy — Zoobicon",
    description: "How to file a DMCA takedown request for content hosted on Zoobicon.",
    url: "https://zoobicon.com/dmca",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/dmca" },
  robots: { index: false, follow: true },
};

export default function DMCAPage() {
  return (
    <div className="relative min-h-screen text-[#e8e8ec]">
      <BackgroundEffects preset="minimal" />
      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#0b1530]/80 backdrop-blur-2xl">
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
        <h1 className="text-4xl font-black mb-2">DMCA Policy</h1>
        <p className="text-sm text-white/60 mb-12">Last updated: March 25, 2026</p>

        <div className="prose prose-invert max-w-none space-y-10 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Overview</h2>
            <p>
              Zoobicon respects the intellectual property rights of others and expects its users to do
              the same. In accordance with the Digital Millennium Copyright Act of 1998 (&ldquo;DMCA&rdquo;),
              17 U.S.C. &sect; 512, we will respond expeditiously to claims of copyright infringement
              committed using the Zoobicon platform (zoobicon.com, zoobicon.ai, zoobicon.io, zoobicon.sh).
            </p>
            <p className="mt-3">
              Because Zoobicon uses AI to generate content, it is possible that generated output may
              inadvertently resemble copyrighted material. If you believe content hosted on our
              platform infringes your copyright, please follow the procedures below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Filing a DMCA Takedown Notice</h2>
            <p>
              To file a copyright infringement claim, send a written notice to our designated DMCA
              agent (see Section 5 below) that includes <strong className="text-white">all</strong> of
              the following:
            </p>
            <ol className="list-decimal list-inside space-y-2 mt-3">
              <li>
                A <strong className="text-white">physical or electronic signature</strong> of the
                copyright owner or a person authorized to act on their behalf.
              </li>
              <li>
                <strong className="text-white">Identification of the copyrighted work</strong> claimed
                to have been infringed. If multiple works are involved, a representative list.
              </li>
              <li>
                <strong className="text-white">Identification of the infringing material</strong> and
                its location on the Zoobicon platform (URL or other specific information sufficient
                to locate it).
              </li>
              <li>
                Your <strong className="text-white">contact information</strong>: name, mailing address,
                telephone number, and email address.
              </li>
              <li>
                A statement that you have a{" "}
                <strong className="text-white">good faith belief</strong> that use of the material in
                the manner complained of is not authorized by the copyright owner, its agent, or the law.
              </li>
              <li>
                A statement, made <strong className="text-white">under penalty of perjury</strong>,
                that the information in the notification is accurate, and that you are the copyright
                owner or are authorized to act on behalf of the owner.
              </li>
            </ol>
            <p className="mt-3">
              <strong className="text-white">Important:</strong> Knowingly submitting a false DMCA
              notice may result in liability for damages, including costs and attorney&rsquo;s fees,
              under Section 512(f) of the DMCA.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Counter-Notification Process</h2>
            <p>
              If you believe your content was removed or disabled by mistake or misidentification,
              you may file a counter-notification with our DMCA agent containing:
            </p>
            <ol className="list-decimal list-inside space-y-2 mt-3">
              <li>Your <strong className="text-white">physical or electronic signature</strong>.</li>
              <li>
                <strong className="text-white">Identification of the material</strong> that was removed
                or disabled and the location where it appeared before removal.
              </li>
              <li>
                A statement <strong className="text-white">under penalty of perjury</strong> that you
                have a good faith belief the material was removed or disabled as a result of mistake
                or misidentification.
              </li>
              <li>
                Your <strong className="text-white">name, address, and telephone number</strong>, and
                a statement that you consent to the jurisdiction of the federal court in your judicial
                district (or in Delaware if you are outside the United States), and that you will
                accept service of process from the person who provided the original DMCA notice.
              </li>
            </ol>
            <p className="mt-3">
              Upon receiving a valid counter-notification, we will forward it to the original
              complainant. If the complainant does not file a court action within{" "}
              <strong className="text-white">10&ndash;14 business days</strong>, we will restore the
              removed content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Repeat Infringer Policy</h2>
            <p>
              Zoobicon maintains a <strong className="text-white">repeat infringer policy</strong> in
              accordance with the DMCA. Users who are the subject of three or more valid DMCA
              takedown notices may have their account permanently terminated at our discretion. We
              track takedown notices on a per-account basis.
            </p>
            <p className="mt-3">
              In cases of egregious or willful infringement, we reserve the right to terminate an
              account after a single valid notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Designated DMCA Agent</h2>
            <p>All DMCA notices and counter-notifications should be sent to:</p>
            <div className="mt-3 p-4 rounded-xl border border-white/[0.10] bg-white/[0.05] space-y-1">
              <p className="font-semibold text-white">Zoobicon DMCA Agent</p>
              <p>
                Email:{" "}
                <a href="mailto:dmca@zoobicon.com" className="text-brand-400 hover:text-brand-300 underline">
                  dmca@zoobicon.com
                </a>
              </p>
              <p className="text-xs text-white/50 mt-2">
                For fastest processing, please use email. We aim to respond to all DMCA notices
                within 48 hours.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Good Faith Requirement</h2>
            <p>
              All DMCA takedown notices and counter-notifications must be submitted in good faith.
              Misuse of the DMCA process — including filing false claims to harass competitors,
              remove legitimate content, or gain an unfair advantage — will not be tolerated.
            </p>
            <p className="mt-3">
              Under 17 U.S.C. &sect; 512(f), any person who knowingly materially misrepresents
              that material is infringing, or that material was removed by mistake, may be subject
              to liability for damages. We reserve the right to report abuse of the DMCA process
              to the appropriate authorities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. AI-Generated Content Notice</h2>
            <p>
              Zoobicon uses artificial intelligence to generate website content. While our AI models
              are designed to create original output, there is an inherent possibility that generated
              content may resemble existing copyrighted works. We take this seriously and will
              promptly investigate and address any valid infringement claims involving AI-generated
              content hosted on our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this DMCA Policy from time to time. Changes will be posted on this page
              with an updated &ldquo;Last updated&rdquo; date.
            </p>
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
