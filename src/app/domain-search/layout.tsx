import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Domain Search — Find Available Domains Instantly | Zoobicon",
  description:
    "The smartest domain search engine. Check availability across .com, .ai, .io, .sh, .co and 8 more extensions instantly. Powered by real registry data, not DNS guessing.",
};

export default function DomainSearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
