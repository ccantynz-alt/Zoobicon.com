import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dictation App — Voice to Text",
  description: "Voice dictation with browser speech recognition and Whisper API support",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
