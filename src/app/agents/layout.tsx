import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zoobicon Agents — Open-Source AI Agent Framework",
  description:
    "Build autonomous AI agents that discover tasks, execute them, and self-heal. Free and open-source. npm install @zoobicon/agents",
  openGraph: {
    title: "Zoobicon Agents — Open-Source AI Agent Framework",
    description:
      "Build autonomous AI agents in 10 lines of code. Free, MIT licensed.",
  },
};

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
