import Link from "next/link";
import {
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import BackgroundEffects from "@/components/BackgroundEffects";

export const metadata: Metadata = {
  title: "Acceptable Use Policy — Zoobicon",
  description:
    "Zoobicon Acceptable Use Policy — guidelines for what you can and cannot generate or do on our AI website builder platform.",
  openGraph: {
    title: "Acceptable Use Policy — Zoobicon",
    description: "Guidelines for acceptable use of the Zoobicon AI website builder platform.",
    url: "https://zoobicon.com/acceptable-use",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/acceptable-use" },
  robots: { index: false, follow: true },
};

export default function AcceptableUsePage() {
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
        <h1 className="text-4xl font-black mb-2">Acceptable Use Policy</h1>
        <p className="text-sm text-white/60 mb-12">Last updated: March 25, 2026</p>

        <div className="prose prose-invert max-w-none space-y-10 text-white/70 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Purpose</h2>
            <p>
              This Acceptable Use Policy (&ldquo;AUP&rdquo;) governs your use of all Zoobicon services,
              including the AI website builder, generators, hosting, API, and marketplace. By using
              any Zoobicon service, you agree to comply with this policy. Violations may result in
              content removal, account suspension, or permanent termination.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Prohibited Content</h2>
            <p>You may not use Zoobicon to generate, host, distribute, or promote:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong className="text-white">Malware or malicious code</strong> — viruses, trojans, ransomware,
                cryptominers, keyloggers, or any software designed to damage or gain unauthorized access to systems
              </li>
              <li>
                <strong className="text-white">Phishing or fraud</strong> — sites designed to impersonate other
                businesses, collect credentials deceptively, or facilitate financial fraud
              </li>
              <li>
                <strong className="text-white">Hate speech or incitement to violence</strong> — content targeting
                individuals or groups based on race, ethnicity, religion, gender, sexual orientation, disability,
                or national origin
              </li>
              <li>
                <strong className="text-white">Child sexual abuse material (CSAM)</strong> — any sexually explicit
                content involving minors. We report all instances to NCMEC and law enforcement.
              </li>
              <li>
                <strong className="text-white">Harassment or doxxing</strong> — content targeting specific individuals
                with threats, stalking, or publication of private information
              </li>
              <li>
                <strong className="text-white">Illegal activities</strong> — content promoting or facilitating
                illegal drug sales, weapons trafficking, human trafficking, or other criminal activity
              </li>
              <li>
                <strong className="text-white">Non-consensual intimate imagery</strong> — sexually explicit
                content shared without the consent of the depicted individual(s)
              </li>
              <li>
                <strong className="text-white">Spam or deceptive content</strong> — sites created solely for
                link farming, SEO manipulation, or misleading search engines
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Prohibited Uses</h2>
            <p>You may not:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong className="text-white">Scrape or crawl</strong> the Platform systematically to extract
                data, templates, or AI-generated output for use outside of Zoobicon
              </li>
              <li>
                <strong className="text-white">Reverse engineer</strong> the AI pipeline, models, prompts,
                or any proprietary Zoobicon technology
              </li>
              <li>
                <strong className="text-white">Resell or white-label</strong> Zoobicon services without an
                active Agency plan or explicit written permission
              </li>
              <li>
                <strong className="text-white">Circumvent rate limits</strong> by creating multiple free accounts,
                using automated tools, or exploiting API vulnerabilities
              </li>
              <li>
                <strong className="text-white">Impersonate Zoobicon</strong> or falsely claim affiliation with
                Zoobicon, its employees, or partners
              </li>
              <li>
                <strong className="text-white">Interfere with service availability</strong> through DDoS attacks,
                resource abuse, or any activity that degrades the experience for other users
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Content Ownership</h2>
            <p>
              <strong className="text-white">You own what you generate.</strong> Content created using
              Zoobicon&rsquo;s AI tools belongs to you. You may use, modify, publish, and commercialize
              your generated websites, code, and content without restriction, subject to applicable
              copyright law.
            </p>
            <p className="mt-3">
              Zoobicon retains no ownership claim over AI-generated output. However, we retain the
              right to use anonymized, aggregated data to improve our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. AI-Generated Content Disclaimer</h2>
            <p>
              AI-generated output may contain errors, inaccuracies, or content that inadvertently
              resembles existing copyrighted work. You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Reviewing all generated content before publishing</li>
              <li>Verifying the accuracy of any claims, statistics, or legal language</li>
              <li>Ensuring generated content does not infringe on third-party intellectual property</li>
              <li>Complying with industry-specific regulations applicable to your content</li>
            </ul>
            <p className="mt-3">
              Zoobicon provides AI tools &ldquo;as is&rdquo; and does not guarantee that generated output
              is free from errors or suitable for any particular purpose. Human review is always
              recommended.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Rate Limits and Fair Use</h2>
            <p>
              To ensure fair access for all users, Zoobicon enforces usage limits based on your plan:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong className="text-white">Free tier:</strong> Limited builds per month, 10 API requests/minute</li>
              <li><strong className="text-white">Creator ($19/mo):</strong> Higher build limits, priority queue</li>
              <li><strong className="text-white">Pro ($49/mo):</strong> 60 API requests/minute, advanced features</li>
              <li><strong className="text-white">Agency ($99/mo):</strong> 600 API requests/minute, white-label, bulk generation</li>
            </ul>
            <p className="mt-3">
              Automated or excessive usage beyond your plan&rsquo;s limits may result in throttling,
              temporary suspension, or a request to upgrade. We reserve the right to adjust limits
              as needed to maintain platform stability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Account Termination</h2>
            <p>
              We reserve the right to suspend or permanently terminate accounts that violate this
              policy. Depending on the severity of the violation:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong className="text-white">First offense (minor):</strong> Warning and content removal</li>
              <li><strong className="text-white">Repeat offenses:</strong> Temporary account suspension (7&ndash;30 days)</li>
              <li><strong className="text-white">Severe violations</strong> (CSAM, malware, phishing): Immediate permanent ban and law enforcement referral</li>
            </ul>
            <p className="mt-3">
              If your account is terminated for an AUP violation, you may not create a new account.
              Refund eligibility for terminated accounts is at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Reporting Violations</h2>
            <p>
              If you encounter content hosted on Zoobicon that violates this policy, please report it
              immediately:
            </p>
            <div className="mt-3 p-4 rounded-xl border border-white/[0.10] bg-white/[0.05]">
              <p>
                Email:{" "}
                <a href="mailto:support@zoobicon.com" className="text-brand-400 hover:text-brand-300 underline">
                  support@zoobicon.com
                </a>
              </p>
              <p className="mt-1 text-xs text-white/50">
                Include the URL of the offending content and a description of the violation.
              </p>
            </div>
            <p className="mt-3">
              We investigate all reports within 24 hours and take action where warranted. Reports can
              be submitted anonymously.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Acceptable Use Policy from time to time. Material changes will be
              communicated via email or a notice on the Platform at least 14 days before taking
              effect. Continued use of Zoobicon after the effective date constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Contact</h2>
            <p>Questions about this policy? Reach out:</p>
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
