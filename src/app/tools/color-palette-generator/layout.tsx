import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Color Palette Generator — AI Colour Scheme Tool | Zoobicon",
  description: "Generate beautiful color palettes with harmony modes — complementary, analogous, triadic, and more. Export hex codes for your design or website.",
  openGraph: {
    title: "Free Color Palette Generator — AI Colour Scheme Tool",
    description: "Generate beautiful color palettes with harmony modes — complementary, analogous, triadic, and more. Export hex codes for your design or website.",
    url: "https://zoobicon.com/tools/color-palette-generator",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "Free Color Palette Generator — AI Colour Scheme Tool | Zoobicon",
    description: "Generate beautiful color palettes with harmony modes — complementary, analogous, triadic, and more. Export hex codes for your design or website.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/tools/color-palette-generator" },
  keywords: [
    "color palette generator", "colour scheme generator", "hex color picker",
    "design color tool", "brand colors",
  ],
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
