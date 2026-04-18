import type { Metadata } from "next";
import ChatClient from "./ChatClient";

export const metadata: Metadata = {
  title: "Chat — Zoobicon",
  description: "Private Claude chat workspace.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return <ChatClient />;
}
