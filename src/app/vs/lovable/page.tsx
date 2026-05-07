import type { Metadata } from "next";
import ComparisonPage from "@/components/ComparisonPage";
import { COMPARISONS } from "@/lib/comparison-data";

const data = COMPARISONS.lovable;

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
  alternates: { canonical: `/vs/${data.slug}` },
  openGraph: {
    title: data.metaTitle,
    description: data.metaDescription,
    url: `https://zoobicon.com/vs/${data.slug}`,
    type: "article",
  },
};

export default function Page() {
  return <ComparisonPage data={data} />;
}
