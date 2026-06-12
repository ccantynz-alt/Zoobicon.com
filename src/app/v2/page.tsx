import { redirect } from "next/navigation";

/**
 * The V2 engine graduated to the real product URL. /builder IS Builder V2
 * now — server-rendered reliability, streaming sections, conversational
 * edits, clean white ZOOBICON BOLD chrome. This route survives only so old
 * links keep working.
 */
export default function V2Redirect() {
  redirect("/builder");
}
