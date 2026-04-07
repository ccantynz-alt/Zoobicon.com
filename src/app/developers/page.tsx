import Link from "next/link";
import { Code, Key, Zap, Shield, ArrowRight, Check } from "lucide-react";

export const metadata = {
  title: "Developers — Zoobicon API",
  description:
    "Real domains. Real video. Real websites. One API key. Build production apps on the Zoobicon platform API.",
};

type Endpoint = {
  method: "GET" | "POST";
  path: string;
  description: string;
  snippet: string;
};

const endpoints: Endpoint[] = [
  { method: "POST", path: "/api/v1/sites", description: "Generate a complete React site from a single prompt.", snippet: `{ "prompt": "saas landing for a dog walking app" }` },
  { method: "POST", path: "/api/v1/generate", description: "Lower-level generation endpoint with model + agent control.", snippet: `{ "prompt": "...", "model": "claude-opus-4-6" }` },
  { method: "POST", path: "/api/v1/deploy", description: "Deploy a generated site to a live zoobicon.sh subdomain.", snippet: `{ "siteId": "abc123", "slug": "my-site" }` },
  { method: "POST", path: "/api/v1/video/generate", description: "Produce a talking-avatar video from a script. Fish Speech + OmniHuman.", snippet: `{ "script": "Hello world" }` },
  { method: "POST", path: "/api/v1/transcribe", description: "Speech-to-text transcription with speaker diarization.", snippet: `{ "audioUrl": "https://..." }` },
  { method: "GET", path: "/api/v1/status", description: "Health check, quota usage and rate-limit headers.", snippet: `// returns { ok, plan, used, limit }` },
  { method: "POST", path: "/api/v1/storage/upload", description: "Upload a file to managed object storage.", snippet: `multipart/form-data: file=@image.png` },
  { method: "GET", path: "/api/v1/storage/buckets", description: "List your project's storage buckets and usage.", snippet: `// returns Bucket[]` },
  { method: "GET", path: "/api/v1/esim/plans", description: "List available eSIM data plans across 190+ countries.", snippet: `?country=JP` },
  { method: "POST", path: "/api/v1/esim/purchase", description: "Purchase and provision an eSIM for a customer.", snippet: `{ "planId": "jp-5gb" }` },
  { method: "GET", path: "/api/v1/esim/usage", description: "Real-time data usage for an active eSIM.", snippet: `?iccid=89014...` },
  { method: "POST", path: "/api/v1/esim/topup", description: "Add data to an existing active eSIM.", snippet: `{ "iccid": "...", "gb": 5 }` },
  { method: "GET", path: "/api/v1/vpn/plans", description: "List WireGuard VPN plans and regions.", snippet: `// returns Plan[]` },
  { method: "POST", path: "/api/v1/vpn/provision", description: "Provision a WireGuard VPN config for a customer.", snippet: `{ "region": "us-west" }` },
  { method: "GET", path: "/api/v1/vpn/status", description: "Connection status and bandwidth usage.", snippet: `?sessionId=...` },
  { method: "GET", path: "/api/v1/booking/services", description: "List bookable services for a calendar account.", snippet: `// returns Service[]` },
  { method: "GET", path: "/api/v1/booking/availability", description: "Open time slots for a service over a date range.", snippet: `?serviceId=...&from=2026-04-10` },
  { method: "POST", path: "/api/v1/booking/appointments", description: "Create a booking and trigger confirmation email.", snippet: `{ "serviceId": "...", "start": "..." }` },
  { method: "POST", path: "/api/v1/wordpress/generate", description: "Generate WordPress post content from a brief.", snippet: `{ "topic": "...", "tone": "expert" }` },
  { method: "POST", path: "/api/v1/wordpress/seo", description: "Audit and rewrite a page for on-page SEO.", snippet: `{ "url": "..." }` },
  { method: "POST", path: "/api/v1/wordpress/site-audit", description: "Full crawl-based site audit with prioritized fixes.", snippet: `{ "domain": "example.com" }` },
  { method: "POST", path: "/api/v1/wordpress/translate", description: "Translate content into 50+ languages with tone preservation.", snippet: `{ "text": "...", "to": "ja" }` },
];

const limits = [
  { plan: "Free", quota: "100 requests / day", price: "$0" },
  { plan: "Pro", quota: "10,000 requests / day", price: "$49 / mo" },
  { plan: "Agency", quota: "100,000 requests / day", price: "$299 / mo" },
  { plan: "Enterprise", quota: "Unlimited + dedicated capacity", price: "Custom" },
];

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  const styles =
    method === "GET"
      ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
      : "bg-violet-500/10 text-violet-300 ring-violet-500/30";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-mono font-semibold ring-1 ${styles}`}>
      {method}
    </span>
  );
}

export default function DevelopersPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-violet-600/20 via-fuchsia-500/10 to-emerald-500/20 animate-pulse" />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.25),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-6 pt-32 pb-24 sm:pt-40 sm:pb-32">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Public API v1 — production ready
          </div>
          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
            Build with{" "}
            <span className="bg-gradient-to-br from-violet-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
              Zoobicon
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-zinc-300 sm:text-xl">
            Real domains. Real video. Real websites. One API key. The same infrastructure that powers Zoobicon.com — exposed to your code in a single REST surface.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/pricing" className="group inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.4)]">
              <Key className="h-4 w-4" />
              Get API key
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#quickstart" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10">
              <Code className="h-4 w-4" />
              Read docs
            </a>
          </div>
        </div>
      </section>

      {/* QUICK START */}
      <section id="quickstart" className="border-t border-white/5 py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-violet-300">Quick start</p>
              <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">Generate a site in one curl.</h2>
              <p className="mt-5 max-w-md text-zinc-400">Send a prompt, get back a fully-built React site object with files, dependencies and a deploy URL. Average response: 28 seconds end-to-end.</p>
              <ul className="mt-8 space-y-3 text-sm text-zinc-300">
                {[
                  "HMAC bearer auth — no OAuth dance",
                  "JSON in, JSON out — no SDK required",
                  "Streaming SSE available on every endpoint",
                  "99.95% uptime SLA on Pro and above",
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-emerald-500/30 blur-xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  </div>
                  <span className="font-mono text-[11px] text-zinc-500">POST /api/v1/sites</span>
                </div>
                <pre className="overflow-x-auto px-5 py-5 text-[13px] leading-relaxed">
                  <code className="font-mono">
                    <span className="text-zinc-500">{"# Generate a complete React site\n"}</span>
                    <span className="text-emerald-300">curl</span>
                    {" -X "}
                    <span className="text-violet-300">POST</span>
                    {" https://zoobicon.com/api/v1/sites \\\n"}
                    {"  -H "}
                    <span className="text-emerald-300">{'"Authorization: Bearer zbk_live_••••••"'}</span>
                    {" \\\n"}
                    {"  -H "}
                    <span className="text-emerald-300">{'"Content-Type: application/json"'}</span>
                    {" \\\n"}
                    {"  -d "}
                    <span className="text-emerald-300">{"'{\n"}</span>
                    <span className="text-violet-300">{'    "prompt"'}</span>
                    <span className="text-emerald-300">{': "saas landing for a dog walking app",\n'}</span>
                    <span className="text-violet-300">{'    "deploy"'}</span>
                    <span className="text-emerald-300">{": true\n  }'"}</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ENDPOINTS */}
      <section id="endpoints" className="border-t border-white/5 py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-emerald-300">Endpoints</p>
              <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{endpoints.length} production endpoints. Live today.</h2>
            </div>
            <p className="hidden max-w-xs text-sm text-zinc-400 sm:block">Each endpoint is rate-limited per key, signed with HMAC-SHA256 and returns standard JSON.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {endpoints.map((ep) => (
              <div key={ep.path} className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04] hover:shadow-[0_20px_60px_-20px_rgba(139,92,246,0.4)]">
                <div className="flex items-center gap-2">
                  <MethodBadge method={ep.method} />
                  <code className="truncate font-mono text-[12px] text-zinc-300">{ep.path}</code>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{ep.description}</p>
                <div className="mt-4 max-h-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:max-h-32 group-hover:opacity-100">
                  <pre className="rounded-md border border-white/5 bg-zinc-950 px-3 py-2 font-mono text-[11px] leading-relaxed text-emerald-300">{ep.snippet}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING STRIP */}
      <section className="border-t border-white/5 py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/15 via-fuchsia-500/10 to-emerald-500/15 p-10 sm:p-14">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent_50%)]" />
            <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-emerald-300">Usage pricing</p>
                <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">Pay only for what you call.</h2>
                <p className="mt-4 max-w-lg text-zinc-300">Bulk pricing kicks in at scale. Annual contracts get up to 60% off list. No idle minimums.</p>
              </div>
              <div className="grid w-full grid-cols-2 gap-4 lg:w-auto lg:grid-cols-4">
                {[
                  { label: "per site", price: "$0.10" },
                  { label: "per video", price: "$0.50" },
                  { label: "per domain check", price: "$0.05" },
                  { label: "per email send", price: "$0.01" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-zinc-950/60 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20">
                    <div className="font-mono text-2xl font-semibold tracking-tight text-white">{item.price}</div>
                    <div className="mt-1 text-xs text-zinc-400">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AUTH */}
      <section className="border-t border-white/5 py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-violet-300">
                <Shield className="h-4 w-4" /> Authentication
              </p>
              <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">Stateless HMAC bearer keys.</h2>
              <p className="mt-5 text-zinc-400">
                Every API key starts with{" "}
                <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px] text-violet-200">zbk_live_</code>{" "}
                and is verified with HMAC-SHA256 on every request. No database lookup, no shared session, no cold-start latency. Rotate keys instantly from your dashboard.
              </p>
              <ul className="mt-8 space-y-3 text-sm text-zinc-300">
                {[
                  "Per-key scopes (read, write, admin)",
                  "Per-key rate limits and quotas",
                  "Per-key webhook signing secrets",
                  "Instant rotation, zero downtime",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/30 to-violet-500/30 blur-xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                <div className="border-b border-white/5 bg-white/[0.02] px-4 py-3 font-mono text-[11px] text-zinc-500">Authorization header</div>
                <pre className="overflow-x-auto px-5 py-5 text-[13px] leading-relaxed">
                  <code className="font-mono">
                    <span className="text-zinc-500">{"# Every request signs with your key\n"}</span>
                    <span className="text-violet-300">Authorization</span>
                    {": "}
                    <span className="text-emerald-300">Bearer zbk_live_a3f9c2e8b1d4...</span>
                    {"\n"}
                    <span className="text-violet-300">Content-Type</span>
                    {": "}
                    <span className="text-emerald-300">application/json</span>
                    {"\n"}
                    <span className="text-violet-300">X-Zoobicon-Signature</span>
                    {": "}
                    <span className="text-emerald-300">sha256=••••••</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RATE LIMITS */}
      <section className="border-t border-white/5 py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-emerald-300">
              <Zap className="h-4 w-4" /> Rate limits
            </p>
            <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">Built for scale from request one.</h2>
          </div>
          <div className="mt-12 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/[0.04]">
                <tr className="text-xs uppercase tracking-wider text-zinc-400">
                  <th className="px-6 py-4 font-medium">Plan</th>
                  <th className="px-6 py-4 font-medium">Rate limit</th>
                  <th className="px-6 py-4 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {limits.map((row) => (
                  <tr key={row.plan} className="bg-white/[0.01] transition-colors hover:bg-white/[0.04]">
                    <td className="px-6 py-5 font-semibold text-white">{row.plan}</td>
                    <td className="px-6 py-5 text-zinc-300">{row.quota}</td>
                    <td className="px-6 py-5 text-right font-mono text-zinc-300">{row.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="border-t border-white/5 py-32">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">Start building today.</h2>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-zinc-400">Free key, 100 requests a day, no credit card. Upgrade when your traffic does.</p>
          <div className="mt-10 flex justify-center">
            <Link href="/pricing" className="group inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3.5 text-sm font-semibold text-zinc-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-zinc-100 hover:shadow-[0_10px_40px_-10px_rgba(255,255,255,0.4)]">
              <Key className="h-4 w-4" />
              Get your API key
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <p className="mt-8 font-mono text-[11px] text-zinc-600">zoobicon.com · zoobicon.ai · zoobicon.io · zoobicon.sh</p>
        </div>
      </section>
    </main>
  );
}
