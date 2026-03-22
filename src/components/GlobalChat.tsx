"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const BusinessChat = dynamic(() => import("./BusinessChat"), { ssr: false });

/** Renders the floating business chat on non-builder pages */
export default function GlobalChat() {
  const pathname = usePathname();

  // Don't show on builder (has its own UI), recording mode, or admin pages
  if (
    pathname === "/builder" ||
    pathname?.startsWith("/edit/") ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }

  return <BusinessChat />;
}
