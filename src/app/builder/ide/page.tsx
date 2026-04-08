"use client";

import dynamic from "next/dynamic";

const IdeClient = dynamic(() => import("./IdeClient"), { ssr: false });

export default function Page() {
  return <IdeClient />;
}
