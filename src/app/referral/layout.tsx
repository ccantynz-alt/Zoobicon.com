import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Referral Program — Earn Free Builds | Zoobicon",
  description:
    "Give friends 5 free builds, get 5 free builds. Share your referral link and earn credits for every signup. Compounding rewards for Zoobicon creators.",
  openGraph: {
    title: "Referral Program — Earn Free Builds | Zoobicon",
    description:
      "Give friends 5 free builds, get 5 free builds. Share your referral link and earn credits.",
    url: "https://zoobicon.com/referral",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/referral" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
