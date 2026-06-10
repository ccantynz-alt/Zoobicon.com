import { redirect } from "next/navigation";

/**
 * The V2 experience was promoted to /builder (2026-06-10). This stub
 * keeps old links/bookmarks working and leaves no dead surface behind.
 */
export default function V2Redirect() {
  redirect("/builder");
}
