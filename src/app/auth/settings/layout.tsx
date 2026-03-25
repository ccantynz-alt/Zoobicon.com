import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings | Zoobicon",
  description:
    "Manage your Zoobicon account settings. Update your profile, change password, manage connected accounts, and configure notification preferences.",
  openGraph: {
    title: "Account Settings | Zoobicon",
    description: "Manage your Zoobicon account settings, profile, and connected accounts.",
    url: "https://zoobicon.com/auth/settings",
    siteName: "Zoobicon",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
