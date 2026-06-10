import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

/**
 * Stub /auth/login — the real auth flow is being delegated to Crontech
 * SSO (per Rule 31). Until that's wired live, this page exists so
 * legacy redirects don't drop users on a 404. The honest message:
 * "you don't need to sign in to try the builder, just go build".
 */
export default function LoginStub() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      <div className="max-w-lg w-full">
        <div
          className="rounded-2xl border p-7"
          style={{
            background: "var(--paper-elevated)",
            borderColor: "var(--rule)",
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5 text-[11px] font-medium"
            style={{
              background: "rgba(232, 64, 43, 0.14)",
              color: "#c2331f",
            }}
          >
            <Info className="w-3 h-3" />
            Sign-in is being rebuilt
          </div>
          <h1
            className="text-2xl font-bold mb-3 tracking-tight"
            style={{ color: "var(--ink)" }}
          >
            No account needed right now.
          </h1>
          <p
            className="text-[15px] leading-relaxed mb-6"
            style={{ color: "var(--ink-muted)" }}
          >
            We&rsquo;re moving sign-in to our partner platform (Crontech SSO).
            Until that&rsquo;s wired, you can use the AI Builder, AI Video
            Creator and Domain Search without an account. Your prompts and
            saved projects will move across when accounts go live.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              Open the builder
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center text-[13px] font-medium px-5 py-2.5 rounded-full border transition"
              style={{
                color: "var(--ink)",
                borderColor: "var(--rule)",
                background: "var(--paper)",
              }}
            >
              Back to home
            </Link>
          </div>
        </div>
        <p
          className="mt-5 text-[12px] text-center"
          style={{ color: "var(--ink-muted)" }}
        >
          Need to reach a human? <a href="mailto:hello@zoobicon.com" className="underline">hello@zoobicon.com</a>
        </p>
      </div>
    </div>
  );
}
