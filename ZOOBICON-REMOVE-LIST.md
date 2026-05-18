# Zoobicon — Remove List (Delegate to Crontech)

> **Locked: 2026-05-17. Authoritative migration spec.**
>
> Craig's directive: Zoobicon becomes a pure AI Builder + AI Video Creator.
> Every piece of infrastructure (auth, hosting, DB, email, payments, CDN,
> storage, custom domains, SMS, cron, rate limiting, analytics, audit logs,
> support inbox, background-infra agents) is delegated to Crontech via the
> public API. The customer sees Zoobicon. Zoobicon talks to Crontech. One
> bill, one login, one support surface.
>
> **This doc supersedes prior architecture decisions in CLAUDE.md** where
> they conflict — specifically Rule 7 (email-only Mailgun → email-only
> Crontech) and the implicit assumption that Zoobicon owns its hosting +
> auth + DB infrastructure. See the new Rule 31 added to CLAUDE.md.

---

## ONE-LINE GOAL

Zoobicon becomes a pure AI Builder + AI Video Creator. Every piece of
infrastructure (auth, hosting, DB, email, payments, CDN, storage, custom
domains, SMS, cron, rate limiting, analytics, audit logs, support inbox,
background-infra agents) is delegated to Crontech via the public API. The
customer sees Zoobicon. Zoobicon talks to Crontech. One bill, one login,
one support surface.

---

## CRITICAL GATING PRECONDITIONS

**Before ANY destructive deletion happens, every item below must be
verified live in Crontech production. This list is the safety gate.**

- [ ] Crontech SSO endpoint `/auth/sso?to=zoobicon` is live + returning signed tokens
- [ ] Crontech billing API can accept usage meters from Zoobicon and produces invoices
- [ ] Crontech BLK-030 email endpoint at `https://api.crontech.ai/api/v1/email` is live + Mailgun-shape compatible
- [ ] Crontech scaffolding API at `https://api.crontech.ai/api/v1/builder` accepts PageLayout JSON and returns deployable URLs
- [ ] Crontech Edge Runtime is live and serving `<slug>.crontech.app` URLs
- [ ] Crontech Custom Domains + Let's Encrypt auto-issuance is functional
- [ ] Crontech CDN (PR #436) is shipped, not just expected
- [ ] Crontech BLK-018 Object Storage is live + S3-compatible at `https://storage.crontech.ai`
- [ ] Crontech BLK-031/032/033 SMS/Voice/Verify is live + Twilio-shape compatible
- [ ] Crontech BLK-024 Privacy Analytics + BLK-027 RUM endpoints are live
- [ ] Crontech BLK-CRON accepts HMAC-signed outbound webhook registration via tRPC
- [ ] Crontech Support tRPC procedures are live
- [ ] A Crontech tenant API key (`CRONTECH_API_KEY`) is issued to Zoobicon
- [ ] Crontech billing line items are configured to match Zoobicon plan tiers
  (Starter $49 / Pro $129 / Agency $299 / White-label $499)

**Without these, deletion is platform-suicide.** Until each is checked,
the corresponding Zoobicon module STAYS LIVE.

---

## 1. AUTH — REMOVE EVERYTHING. USE CRONTECH SSO.

### API routes to delete
- `/api/auth/signup`
- `/api/auth/login`
- `/api/auth/verify-email`
- `/api/auth/resend-verification`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/auth/change-password`
- `/api/auth/oauth/google`
- `/api/auth/callback/google`
- `/api/auth/oauth/github`
- `/api/auth/callback/github`
- `/api/auth/diagnose`
- `/api/auth/admin-diagnostic`
- `/api/auth/admin-recover`

### Pages to delete
- `/auth/login`
- `/auth/signup`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/verify-email`
- `/auth/callback`
- `/auth/settings`
- `/admin-recover`

### Lib modules to delete
- `src/lib/auth-guard.ts`
- `src/lib/admin-auth.ts`
- `src/lib/mcp-auth.ts`
- `src/lib/jwt-verify.ts`
- `src/lib/password.ts`
- `src/lib/password-vault.ts`
- `src/lib/resetToken.ts`
- `src/lib/apiKey.ts`
- `src/lib/api-keys.ts`
- `src/lib/safe-redirect.ts`

### Database tables to migrate (do not drop until migration verified)
- `users` — Crontech now owns user identity. Keep a thin `zoobicon_user_profile` table keyed by `crontech_user_id` for Zoobicon-specific profile fields only (style preferences, brand assets, default voice/tone).

### Env vars to remove
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- `JWT_SECRET`
- `RESET_TOKEN_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### Env var to ADD
- `CRONTECH_API_KEY` — the tenant API key Zoobicon uses to talk to Crontech.

### Replacement
Crontech SSO. Zoobicon hits `/auth/sso?to=zoobicon` on Crontech, receives a signed token, verifies signature, sets local session cookie.

---

## 2. PAYMENTS / BILLING — REVERSED 2026-05-17 — STRIPE STAYS.

Craig (May 17): *"Sorry Stripe we need to keep because people still need to purchase the AI builder section from us."*

**This section is reversed.** Stripe stays in Zoobicon for direct AI Builder purchases (subscription tiers + domain checkout + video credit packs). The original "delegate billing to Crontech" plan only makes sense once Crontech billing supports SaaS subscriptions for non-Crontech products — until then, customers pay Zoobicon directly via Stripe.

### KEEP (was previously marked for deletion)
- `/api/billing/checkout/create`
- `/api/billing/portal`
- `/api/billing/upgrade`
- `/api/stripe/webhook`
- `/api/stripe/checkout`
- `src/lib/stripe.ts`
- `src/lib/billing-plans.ts`
- `src/lib/user-plan.ts`
- Env vars: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_*_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`

### Still REMOVE (only Stripe Connect for agency reseller payouts — Crontech handles unified empire billing for agency tiers)
- `/api/agency/connect/onboard`
- `/api/agency/connect/payout`
- `/api/agency/billing`
- `src/lib/stripe-connect.ts`

### Replacement (partial — agency tier only)
For agency white-label tier ($499/mo), reseller payouts route through Crontech's unified empire billing. For all other tiers (Starter $49, Pro $129, Agency $299 single-tenant), customers pay Zoobicon directly via Stripe.

---

## 3. EMAIL INFRASTRUCTURE — REMOVE EVERYTHING. USE CRONTECH BLK-030.

### API routes to delete
- `/api/email/send`
- `/api/email/inbox`
- `/api/email/inbound`
- `/api/email/setup`
- `/api/email/dns-check`
- `/api/email/domains`
- `/api/email/mailboxes`
- `/api/email/events`
- `/api/email/analytics`
- `/api/email/ai-support`
- `/api/email/support`
- `/api/email/polish`
- `/api/email/knowledge`
- `/api/email-marketing`
- `/api/email-marketing/subscribe`

### Pages to delete
- `/email-marketing`
- `/email-support`

### Lib modules to delete
- `src/lib/mailgun.ts`
- `src/lib/mailgun-client.ts`
- `src/lib/email-service.ts`
- `src/lib/email-template.ts`
- `src/lib/email-validator.ts`
- `src/lib/email-notifications.ts`
- `src/lib/email-marketing.ts`
- `src/lib/imap-provider.ts`
- `src/lib/zoobicon-mail.ts`

### Database tables to migrate
- `email_domains`, `email_mailboxes`, `email_inbound`, `email_outbound`, `email_events` — Crontech owns these. Drop from Zoobicon after migration.

### Env vars to remove
- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`

### Cloudflare Email Routing for zoobicon.com
- Keep for receiving mail to `hello@` / `support@` / `billing@` Zoho inboxes (Craig-owned).
- For platform-generated email (customer welcome, transactional, marketing campaigns, support auto-reply): route through Crontech BLK-030.

### Replacement
Crontech BLK-030. Mailgun-shape compatible. Change base URL from `https://api.mailgun.net/v3/{domain}` to `https://api.crontech.ai/api/v1/email`. Existing Mailgun SDK code works unchanged.

---

## 4. HOSTING + DEPLOY — REMOVE EVERYTHING. USE CRONTECH SCAFFOLDING.

### API routes to delete
- `/api/hosting/deploy`
- `/api/hosting/serve/[slug]`
- `/api/hosting/sites/[siteId]/code`
- `/api/hosting/dns`
- `/api/hosting/ssl`
- `/api/deploy/vercel`

### Pages to delete
- `/hosting`
- `/hosting/dashboard`

### Lib modules to delete
- `src/lib/cloudflare.ts`
- `src/lib/vercel-deploy.ts`
- `src/lib/crontech-adapter.ts` (rebuild as a thin client of Crontech scaffolding API)
- `src/lib/webcontainers-adapter.ts`
- `src/lib/webcontainers-preview.ts`
- `src/lib/supabase-detect.ts`
- `src/lib/supabase-provision.ts`
- `src/lib/supabase-provisioner.ts`

### Brand domains to remove
- `zoobicon.sh` — customer sites deploy to `<username>.crontech.app` instead.

### Database tables to migrate
- `sites`, `deployments`, `custom_domains`, `dns_records` — Crontech owns these (BLK-009 git-push + BLK-017 edge runtime + BLK-Custom-Domains).

### Env vars to remove
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_ORG_ID`

### Replacement
Crontech scaffolding API at `https://api.crontech.ai/api/v1/builder` + Crontech Edge Runtime + Crontech Custom Domains + Crontech Let's Encrypt auto-issuance. Every generated site deploys to Crontech infra; Zoobicon passes the catalog-validated PageLayout JSON to Crontech, gets back a live URL.

---

## 5. CDN / EDGE / RATE LIMITING — REMOVE EVERYTHING. USE CRONTECH.

### API routes to refactor (keep route, change origin)
- `/api/components/[id]` — origin moves to Crontech CDN
- `/api/components/registry` — same

### Lib modules to delete
- `src/lib/rateLimit.ts`
- `src/lib/rateLimitConfig.ts`
- `src/lib/resilience.ts`

### Cloudflare CDN dependency
- Cloudflare-fronted `*.zoobicon.sh` wildcard SSL/CDN — REMOVE. Replace with Crontech CDN (PR #436, 80-90% expected hit rate, mounted before WAF + DDoS).

### Replacement
Crontech CDN handles all caching, Crontech DDoS Shield handles per-tenant rate limiting (Pro+ can customise via `/dashboard/security/ddos`).

---

## 6. STORAGE — REMOVE EVERYTHING. USE CRONTECH BLK-018.

### API routes to delete
- `/api/v1/storage`

### Lib modules to delete
- `src/lib/storage.ts`
- `src/lib/storage-s3.ts`
- `src/lib/storage-provider.ts`
- `src/lib/site-storage.ts`

### Env vars to remove
- `B2_KEY_ID`
- `B2_APP_KEY`

### Replacement
Crontech Object Storage (BLK-018) — S3-shape compatible, $0 egress. Change base URL from B2 endpoint to `https://storage.crontech.ai`. SigV4 supported. Presigned PUT for direct uploads, listObjects, getObject, deleteObject all wire-compatible.

---

## 7. SMS / VOICE / VERIFY / DISCORD / SLACK — REMOVE. USE CRONTECH.

### Lib modules to delete
- `src/lib/twilio-sms.ts`
- `src/lib/discord-bot.ts`
- `src/lib/slack-bot.ts`
- `src/lib/web-push.ts`
- `src/lib/messaging.ts`

### Env vars to remove
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `DISCORD_BOT_TOKEN`
- `SLACK_BOT_TOKEN`

### Replacement
Crontech BLK-031/032/033 (multi-vendor SMS + Voice + Verify). Twilio-shape compatible. Change base URL from `https://api.twilio.com` to `https://api.crontech.ai`. AccountSid + AuthToken become a Crontech API key.

---

## 8. eSIM / VPN — REMOVE PROVIDERS, KEEP MARKETING PAGES.

### API routes to delete
- `/api/v1/esim`
- `/api/v1/vpn`

### Lib modules to delete
- `src/lib/esim-provider.ts`
- `src/lib/vpn-provider.ts`

### Pages to KEEP for SEO (but disable purchase flow)
- `/esim`
- `/esim/[country]` (50 country pages)

### Env vars to remove from Zoobicon
(move to Crontech if Crontech wants the revenue stream, otherwise sunset entirely)
- `CELITECH_API_KEY`
- `WIREGUARD_API_URL`
- `WIREGUARD_API_KEY`

### Replacement
eSIM and VPN are not core to "AI Builder platform" positioning. Either move the products to Crontech entirely or sunset. **Recommend sunset** unless they're actively generating revenue.

---

## 9. BOOKING ENGINE — REMOVE. SUNSET OR MIGRATE.

### API routes to delete
- `/api/booking`
- `/api/booking/availability`
- `/api/booking/cancel`
- `/api/booking/create`
- `/api/calendar/*`
- `/api/v1/booking`

### Pages to delete (or keep as marketing landing only)
- `/booking`

### Lib modules to delete
- `src/lib/booking-engine.ts`
- `src/lib/booking-provider.ts`
- `src/lib/booking.ts`
- `src/lib/calendar-scheduler.ts`

### Env vars to remove
- `CALCOM_API_URL`
- `CALCOM_API_KEY`

### Rationale
Booking is not an AI Builder feature. If kept, it should be a generated-site component (the builder produces a site that includes booking), not a Zoobicon-platform feature.

---

## 10. CRM + INVOICING + EMAIL MARKETING + CONTRACTS — REMOVE OR SCOPE

### API routes — DELETE these (not AI Builder scope)
- `/api/crm`
- `/api/crm/contacts`
- `/api/crm/generate`
- `/api/invoicing/*`
- `/api/contracts/analyze`
- `/api/contracts/generate`
- `/api/contracts/sign`
- `/api/email-marketing`
- `/api/email-marketing/subscribe`

### Pages to delete (these dilute the AI Builder positioning)
- `/crm`
- `/invoicing`
- `/content-calendar`
- `/content-writer`

### Rationale
CRM, invoicing, contracts, email marketing — all of these are their own product categories. If kept, they confuse the brand. Either:
(a) move them into Crontech as platform features, or
(b) sunset entirely.

**Recommendation: sunset.** Zoobicon is "AI Builder + AI Video," nothing else.

---

## 11. SUPPORT INBOX + KNOWLEDGE BASE — REMOVE. USE CRONTECH SUPPORT.

### API routes to delete
- `/api/email/support`
- `/api/email/ai-support`
- `/api/email/knowledge`

### Pages to delete
- `/admin/support`
- `/admin/support/knowledge`
- `/knowledge-base`

### Database tables to migrate
- `support_tickets`
- `support_sessions`
- `support_messages`
- `support_usage`
- `knowledge_base`

### Replacement
Crontech Support (existing tRPC procedures + admin dashboards).

---

## 12. ANALYTICS — REMOVE. USE CRONTECH PRIVACY ANALYTICS + RUM.

### API routes to delete
- `/api/admin/analytics`

### Pages to delete
- `/analytics`

### Lib modules to delete
- `src/lib/analytics-engine.ts`
- `src/lib/customer-segmentation.ts`
- `src/lib/lead-scoring.ts`

### Database tables to migrate
- `site_analytics`

### Replacement
Crontech BLK-024 Privacy Analytics + BLK-027 RUM. Every generated site auto-instrumented. `/dashboard/insights/pulse` shows Core Web Vitals + per-page views with no cookies + DNT respected.

---

## 13. CRON JOBS — REMOVE VERCEL CRONS. USE CRONTECH BLK-CRON.

### Vercel cron entries to remove from `vercel.json`
- All 14 cron jobs (warmup, domain-crawl, agents, intel-health, full-health, self-heal, seo-agent, intel-competitors, intel-technology, intel-cron, daily-comeback, flywheel-consolidate, prebuild-factory, auto-pilot)

### Keep the `/api/cron/*` HTTP endpoints
They'll be HIT BY Crontech BLK-CRON on the same schedule. Crontech provides:
- HMAC-signed outbound webhooks (your endpoint verifies the signature)
- Per-tenant quotas
- Dashboard at `/dashboard/automate/cron` showing run history
- Auto-retries with exponential backoff

### Lib modules to delete
- `src/lib/cron-scheduler.ts` (replaced by Crontech scheduler)
- `src/lib/job-queue.ts` (replaced by Crontech BLK-CRON)

### Env vars to remove
- `CRON_SECRET` (replaced by Crontech HMAC signature verification)

### Action
Register each of the 14 cron jobs in Crontech via tRPC `customerCron.create()` pointing to `https://zoobicon.com/api/cron/{job}` with the HMAC secret Crontech issues. Then remove the schedule entries from `vercel.json`.

---

## 14. AUDIT LOGS + HEALTH MONITOR + USAGE TRACKING — REMOVE.

### API routes to delete
- `/api/admin/health` (or repurpose as Zoobicon-only AI pipeline health)

### Pages to delete
- `/admin/health`
- `/admin/operations`
- `/admin/usage`

### Lib modules to delete
- `src/lib/audit-log.ts`
- `src/lib/audit-middleware.ts`

### Database tables to migrate
- `usage_tracking` → Crontech billing usage meter

### Replacement
Crontech provides platform-wide audit log + observability + per-tenant usage tracking. Zoobicon-specific pipeline health (AI provider status, slot-cache hit rate, build queue depth) stays in Zoobicon.

---

## 15. BACKGROUND AGENTS — KEEP BUILDER ONES, REMOVE INFRA ONES.

You haven't enumerated all 22, but the principle:

### KEEP (builder/AI/content specific)
- Support responder (uses Crontech BLK-030 to send replies)
- SEO auto-fix (about the user's site content)
- Market crawler (intelligence for the builder)
- Content/copy critics (B9 multi-judge panel)
- Few-shot pattern miner (B27 flywheel consolidation)
- Self-healing of AI providers (B29 quarantine of bad LLMs)
- Domain crawler (intelligence)
- Slot-fill cache pre-warmer (B23 prebuild factory)

### REMOVE (infrastructure-related, Crontech now covers)
- Site monitor (Crontech RUM does this)
- Performance guardian (Crontech RUM + DDoS)
- Health-checker for hosting / DNS / SSL (Crontech provides)
- Any "is the API key still valid" rotators (Crontech AI Gateway handles)

Paste the full 22-agent list to a follow-up message and the remove/keep will be exhaustive.

---

## 16. PUBLIC API v1 — REMOVE. CRONTECH OFFERS THE SAME SURFACES.

### API routes to delete
- `/api/v1/booking`
- `/api/v1/esim`
- `/api/v1/vpn`
- `/api/v1/storage`
- `/api/v1/video`

### Lib modules to delete
- `src/lib/v1-auth.ts`

### Replacement
Zoobicon doesn't need a public API of its own — its customers use the Zoobicon UI for site/video generation, then Crontech's public API for runtime operations on deployed sites (storage, email, SMS, etc.). If a third party wants to programmatically generate Zoobicon sites, they hit Crontech's `/api/v1/builder/*` directly.

---

## 17. DOMAIN STRATEGY — CONSOLIDATE

### KEEP
- `zoobicon.com` — primary AI Builder + Video product
- `zoobicon.ai` — AI brand identity
- `zoobicon.app` — mobile admin (Zoobicon-specific)

### REMOVE / RECONSIDER
- `zoobicon.sh` — customer hosting domain. REMOVE. Customer sites move to `<username>.crontech.app`.
- `zoobicon.io` — developer / public API. RECONSIDER. If Crontech owns the public API, redirect `zoobicon.io` to `docs.crontech.ai`. Otherwise sunset.

### Cloudflare zone for zoobicon.sh
REMOVE (no longer needed).

---

## 18. ENVIRONMENT VARIABLES — SUMMARY OF REMOVALS

### DELETE from Vercel and from `src/env.ts`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_OAUTH_CLIENT_ID`
- `GITHUB_OAUTH_CLIENT_SECRET`
- `JWT_SECRET`
- `RESET_TOKEN_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NOTIFICATION_EMAIL`
- `MAILGUN_API_KEY`
- `MAILGUN_DOMAIN`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_ORG_ID`
- `B2_KEY_ID`
- `B2_APP_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `DISCORD_BOT_TOKEN`
- `SLACK_BOT_TOKEN`
- `CELITECH_API_KEY`
- `WIREGUARD_API_URL`
- `WIREGUARD_API_KEY`
- `CALCOM_API_URL`
- `CALCOM_API_KEY`
- `UPSTASH_REDIS_REST_URL` (Crontech provides caching)
- `UPSTASH_REDIS_REST_TOKEN`
- `QSTASH_TOKEN` (Crontech BLK-CRON replaces)
- `CRON_SECRET` (Crontech HMAC replaces)
- `OPENSRS_API_KEY` (KEEP for domain registration revenue stream)
- `OPENSRS_RESELLER_USER` (KEEP)
- `OPENSRS_ENV` (KEEP)

### ADD
- `CRONTECH_API_KEY` — tenant API key for talking to Crontech

### KEEP (Zoobicon-specific) — INCLUDING STRIPE (reversed §2)
- `STRIPE_SECRET_KEY` — direct AI Builder purchases
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_CREATOR_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_AGENCY_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY` (and `_2..20`)
- `OPENAI_API_KEY` (and `_2..20`)
- `GOOGLE_AI_API_KEY` (and `_2..20`)
- `GROQ_API_KEY` (and `_2..20`)
- `SELFHOSTED_LLM_URL` + `_KEY`
- `REPLICATE_API_TOKEN`
- `ELEVENLABS_API_KEY`
- `DEEPGRAM_API_KEY`
- `FAL_KEY`
- `HEYGEN_API_KEY` (if still tolerated as fallback)
- `DATABASE_URL` (Neon for Zoobicon's own app data only)
- `GATE_TEST_API_URL` + `KEY`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_ENV`
- `VERCEL_ENV`

---

## 19. DATABASE — TABLES TO MIGRATE OR DROP

### DROP (Crontech owns them)
- `users` (replace with thin `zoobicon_user_profile` keyed by `crontech_user_id`)
- `sites`
- `deployments`
- `custom_domains`
- `dns_records`
- `email_domains`
- `email_mailboxes`
- `email_inbound`
- `email_outbound`
- `email_events`
- `support_tickets`
- `support_sessions`
- `support_messages`
- `support_usage`
- `knowledge_base`
- `usage_tracking`
- `site_analytics`
- `site_data` (form submissions, bookings)
- `site_users` (auth on generated sites — Crontech BLK-009 deploys auto-include auth via Crontech if needed)

### KEEP (Zoobicon-specific)
- `projects` (saved builds)
- `project_versions`
- `project_messages`
- `builds` (telemetry)
- `build_quotas`
- `slot_cache` (B19)
- `flywheel_events` (B26b)
- `flywheel_successful_builds` (B26)
- `flywheel_memories` (B27)
- `self_healing_actions` (B29)
- `bulk_jobs`
- `video_batches`
- `agencies`
- `agency_members`
- `agency_clients`
- `agency_client_sites`
- `agency_generations`
- `registered_domains` (revenue stream, KEEP)
- `collab_rooms`
- `collab_participants`
- `collab_code_sync`

---

## 20. POSITIONING — REWRITE THE ONE-LINE PITCH

### OLD pitch
> "Zoobicon is a white-label AI platform that bundles AI website builder, AI video creator, real domain registration, hosting, email, CRM, and 75+ other products into one login and one bill."

### NEW pitch
> "Zoobicon is the AI Builder for sites and videos. Real domains in the same flow. Built on Crontech infrastructure — hosting, email, SMS, analytics, CDN, custom domains, and observability all included via your one Crontech account."

The 5-vendors-consolidated story now becomes the EMPIRE story:

> "Zoobicon for the build. Gluecron for the git. Crontech for the infrastructure. AlecRae for the email. GateTest for the gate. One account across the empire."

---

## 21. PRICING TIERS — REFRAME

### OLD tiers (Zoobicon owns infra)
- Starter $49: Site + domain + email (3 mailboxes) + SSL
- Pro $129: + AI auto-reply + SEO monitor
- Agency $299: + AI video + 5 sites + priority support
- White-label $499: Full platform reseller licence

### NEW tiers (Crontech bundled underneath)
- **Starter $49**: AI Builder (50 generations/mo) + bundled Crontech Free (hosting + 100MB CDN + 1 replica + email + custom domain)
- **Pro $129**: + AI auto-reply + SEO monitor + bundled Crontech Pro (10GB CDN + 10 replicas + Pro DDoS + private networking)
- **Agency $299**: + AI Video Creator + 5 sites + bundled Crontech Pro (everything above + agency multi-tenant)
- **White-label $499**: Full reseller + bundled Crontech Enterprise (unlimited CDN + unlimited replicas + dedicated support)

Customer sees one Zoobicon bill. Zoobicon meters usage to Crontech. Crontech invoices Zoobicon at wholesale rate. Margin captured by Zoobicon.

---

## 22. DEPLOYMENT CHECKLIST — UPDATED

### Pre-deploy (Craig)
- [ ] Set `CRONTECH_API_KEY` in Vercel
- [ ] Set `OPENAI_API_KEY` + `GOOGLE_AI_API_KEY` (failover, still Zoobicon-side)
- [ ] Set `ANTHROPIC_API_KEY`
- [ ] Set `REPLICATE_API_TOKEN`
- [ ] Set `OPENSRS_API_KEY` + `RESELLER_USER` (kept revenue stream)
- [ ] `DATABASE_URL` (Neon for Zoobicon's own data only)

### Post-deploy (one-time)
- [ ] Visit `/api/db/init` — provision only Zoobicon-specific tables
- [ ] Register 14 cron jobs in Crontech BLK-CRON pointing to `https://zoobicon.com/api/cron/{job}`
- [ ] Configure Crontech SSO callback at `https://zoobicon.com/auth/callback`
- [ ] Test end-to-end: sign up via Crontech → land on Zoobicon → SSO works
- [ ] Test usage metering: build a site → confirm Crontech receives the meter
- [ ] Remove Vercel cron entries from `vercel.json`
- [ ] Remove all 35+ deleted env vars from Vercel project settings
- [ ] Configure Crontech billing line items to match Zoobicon plan tiers
- [ ] Update Cloudflare: remove `zoobicon.sh` zone, keep `.com`/`.ai`/`.app`/`.io`

### Verify Crontech-hosted surfaces (do these still work via SSO?)
- [ ] `https://crontech.ai/dashboard/comms/email-analytics` for email stats
- [ ] `https://crontech.ai/dashboard/network/cdn` for CDN stats
- [ ] `https://crontech.ai/dashboard/network/domains` for custom domains
- [ ] `https://crontech.ai/dashboard/settings/billing` for billing

---

## 23. THE ARCHITECTURAL INNOVATIONS — ALL KEEP

The 6 architectural innovations stay in Zoobicon. These are Zoobicon's moat. None of them touch infrastructure — they're all about how the AI generates output:

1. **Slot-Locked Composition** — KEEP
2. **Predictive Pre-Generation** — KEEP (can leverage Crontech AI Gateway semantic cache as a deeper layer)
3. **Component-Graph Builds** — KEEP
4. **Hot-Swap Live Component Upgrades** — KEEP, but delivery routes through Crontech CDN for $0 egress
5. **Multi-Judge Panel Critique** — KEEP
6. **Build-Output Caching** — KEEP, with optional second-tier via Crontech AI Gateway semantic cache

---

## SUMMARY — WHAT ZOOBICON BECOMES

- Files deleted: ~150+ (auth + billing + email + hosting + cdn + storage + sms + booking + crm + invoicing + support + analytics + cron lib)
- API routes deleted: ~90+ (all infrastructure-domain endpoints)
- Pages deleted: ~20+ (auth flows, hosting dashboard, CRM, invoicing, analytics, support, knowledge base)
- Database tables dropped: ~20 (users → thin profile, all infra tables)
- Env vars removed: 35+ (all infrastructure provider keys)
- Lines of code estimated removed: 30,000-50,000 (most of `/lib` + `/api/*` infrastructure paths)

### What's left in Zoobicon
- AI Builder (slot-locked composition, component registry, video pipeline)
- 6 architectural innovations
- Domain registration (revenue stream via OpenSRS)
- Marketing pages (industry SEO, country SEO, generators, comparison)
- Builder UI (Sandpack, Monaco, panels, editor)
- Background agents (builder-specific only)
- Flywheel (memories, successful builds, pattern mining)
- Multi-LLM routing for generation specifically
- Agency white-label tier
- Mobile admin

### What Zoobicon talks to Crontech for
- Auth (SSO)
- Hosting + CDN (every deployed site)
- DB (the customer's app data — separate from Zoobicon's own)
- Email (every send — Mailgun-shape compatible)
- SMS / Voice / Verify (every comm)
- Custom domains + TLS
- Object storage
- Cron jobs
- Analytics + RUM
- Audit logs
- Billing (unified invoice)
- Rate limiting + DDoS protection
- Edge runtime for deployed sites

### The result
Zoobicon ships features faster (no infra to maintain), Crontech captures every Zoobicon customer as a tenant (revenue capture), unified bill, single SSO, single support, single dashboard for everything-not-builder. Zoobicon focuses on its actual moat: making the AI generate things that cannot break.

---

## MIGRATION GATE — DO NOT DELETE WITHOUT THESE

Repeated from the top because it's that important: **NOTHING in this list gets deleted from Zoobicon until the corresponding Crontech endpoint is verified live in production.** Each Crontech endpoint must:

1. Be reachable at the documented URL
2. Return the documented response shape
3. Be tested by Zoobicon staging hitting it end-to-end
4. Have a documented rollback path

The deletion order should be:

1. **Tier A — already-replaced or trivially Crontech-shaped** (CDN, storage, SMS, audit logs) — lowest risk, do first.
2. **Tier B — replaceable with feature flag** (email, analytics, cron) — flip flag, watch metrics for 7 days, then delete.
3. **Tier C — touches money or auth** (Stripe, auth, billing) — never delete the day of Crontech go-live. Run dual-stack for 30 days minimum so any Crontech bug is recoverable without losing customers.
4. **Tier D — strategic sunset** (CRM, invoicing, contracts, email marketing, booking, eSIM, VPN) — these aren't even Crontech migrations. Make a separate "product sunset" decision per product, with customer notification + 60 day deprecation runway if any customers depend on them.

If Crontech ships only some of the endpoints, Zoobicon stays on Mailgun/Stripe/etc for the ones that aren't ready. **Partial migration is OK. Half-migration with broken Zoobicon is not.**
