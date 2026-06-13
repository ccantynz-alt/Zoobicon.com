# Adding API keys (Craig's 2-minute guide)

You never write code to add an API — you paste a key into Vercel, and the
builder's code (already written) picks it up automatically. Each key stays
**dormant and harmless until you add it**, so there's no rush and nothing
breaks if you skip one.

## How to add any key
1. Go to **vercel.com** → your **Zoobicon** project
2. **Settings → Environment Variables**
3. **Add** → enter the **Name** (exact, from the table below) → paste the **Value** → tick **Production** (and **Preview**) → **Save**
4. **Deployments → ⋯ → Redeploy** (or it applies on the next deploy)

## Keys that raise build quality

| Name | Where to get it | What it does | Priority |
|------|-----------------|--------------|----------|
| `PEXELS_API_KEY` | **pexels.com/api** → "Get Started" (free, instant, no approval) | Distinct, relevant photos in built sites instead of repeats/guesses | ⭐ easy win |
| `UNSPLASH_ACCESS_KEY` | unsplash.com/developers → New Application → copy "Access Key" | Alternative/extra image source | optional |
| *(screenshot/vision)* | Set up via **Vapron** — Claude will hand you a one-line task when ready | Lets the builder *see* a screenshot of the page and fix visual flaws | later |

> The vision/screenshot key is deliberately left for later — Claude will wire it
> through Vapron and tell you exactly what to add when it's time.

## Already set (for reference)
`ANTHROPIC_API_KEY` (the builder's brain) is set — the Art Director + critics
quality upgrade uses this one, so it needs **no** new key.
