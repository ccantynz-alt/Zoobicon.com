import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VPN for Travel & Business — Secure Everywhere | Zoobicon VPN",
  description:
    "Best VPN for New Zealand, Pacific Islands, and global travel. 60+ server locations, 256-bit encryption, zero-log policy, WireGuard protocol, and Oceania-optimised servers. From $3.99/mo.",
  keywords: [
    "best VPN New Zealand",
    "VPN for travel",
    "VPN Pacific Islands",
    "business VPN",
    "WireGuard VPN",
    "no-log VPN",
    "VPN Oceania",
    "secure VPN NZ",
    "travel VPN",
    "VPN Auckland",
    "VPN Australia",
  ],
  openGraph: {
    title: "VPN for Travel & Business — Secure Everywhere | Zoobicon VPN",
    description:
      "Military-grade encryption for travellers and businesses. 60+ locations, zero logs, WireGuard, Oceania-optimised servers. From $3.99/mo.",
    url: "https://zoobicon.com/products/vpn",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/products/vpn" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
