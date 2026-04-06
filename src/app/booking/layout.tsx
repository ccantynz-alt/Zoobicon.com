import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Booking & Scheduling — Online Appointments | Zoobicon",
  description:
    "Accept online bookings and manage appointments with AI. Intake forms, reminder emails, Google Calendar sync, and cancellation policies. Replace Calendly for free.",
  openGraph: {
    title: "AI Booking & Scheduling — Online Appointments | Zoobicon",
    description:
      "Accept online bookings and manage appointments with AI. Intake forms, reminder emails, and calendar sync.",
    url: "https://zoobicon.com/booking",
    siteName: "Zoobicon",
    type: "website",
  },
  alternates: { canonical: "https://zoobicon.com/booking" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
