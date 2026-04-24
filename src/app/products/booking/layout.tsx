import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Booking & Scheduling Software — Online Appointment System | Zoobicon",
  description:
    "Accept online bookings 24/7. AI-powered scheduling, automatic reminders, payment collection, and calendar sync. No-show rate drops 80%. Start free.",
  keywords: [
    "online booking system",
    "appointment scheduling software",
    "booking app",
    "online scheduler",
    "cal.com alternative",
  ],
  openGraph: {
    title: "AI Booking & Scheduling Software — Online Appointment System | Zoobicon",
    description:
      "Accept online bookings 24/7. AI-powered scheduling, automatic reminders, payment collection, and calendar sync. No-show rate drops 80%. Start free.",
    url: "https://zoobicon.com/products/booking",
    siteName: "Zoobicon",
    images: [{ url: "https://zoobicon.com/og-image.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@zoobicon",
    title: "AI Booking & Scheduling Software — Online Appointment System | Zoobicon",
    description:
      "Accept online bookings 24/7. AI-powered scheduling, automatic reminders, payment collection, and calendar sync. No-show rate drops 80%. Start free.",
    images: ["https://zoobicon.com/og-image.png"],
  },
  alternates: { canonical: "https://zoobicon.com/products/booking" },
  robots: "index, follow",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
