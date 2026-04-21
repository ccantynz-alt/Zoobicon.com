import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zoobicon — Upgrading",
  description: "We're making Zoobicon even better. Back shortly.",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#060e1f] text-white flex items-center justify-center">
      <div className="text-center px-6 max-w-lg">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-600 to-stone-700 mx-auto mb-8 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-4">We&apos;re upgrading</h1>
        <p className="text-lg text-white/50 mb-8 leading-relaxed">
          Zoobicon is getting a major upgrade. We&apos;ll be back shortly with
          something incredible. Thanks for your patience.
        </p>
        <div className="flex items-center justify-center gap-2 text-white/30 text-sm">
          <div className="w-2 h-2 rounded-full bg-stone-500 animate-pulse" />
          <span>Upgrade in progress</span>
        </div>
        <p className="text-[10px] text-white/15 mt-16">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</p>
      </div>
    </div>
  );
}
