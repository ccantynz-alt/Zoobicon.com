import type { Metadata } from "next";
import AdminShell from "./AdminShell";

export const metadata: Metadata = {
  title: "Admin Dashboard | Zoobicon",
  description:
    "Zoobicon administration panel. Manage users, monitor system health, configure integrations, and review platform analytics.",
  openGraph: {
    title: "Admin Dashboard | Zoobicon",
    description: "Zoobicon administration panel. Manage users, monitor system health, and configure integrations.",
    url: "https://zoobicon.com/admin",
    siteName: "Zoobicon",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
