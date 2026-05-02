# Zoobicon — official GitHub Action

> Generate AI-built websites and full-stack apps, then deploy them to
> `<slug>.zoobicon.sh` — directly from any GitHub workflow.

[![Marketplace](https://img.shields.io/badge/GitHub%20Marketplace-zoobicon-purple?logo=github)](https://github.com/marketplace/actions/zoobicon)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

The same engine as [zoobicon.com](https://zoobicon.com) — the 100-name domain
finder, the React/Tailwind builder, and the one-click deploy pipeline — wrapped
as a composite action.

```yaml
- uses: zoobicon/zoobicon-action@v1
  with:
    api-key: ${{ secrets.ZOOBICON_API_KEY }}
    path: ./build
```

## Quick start

1. Sign up at [zoobicon.com](https://zoobicon.com) and create an API key at
   [zoobicon.com/admin/api-keys](https://zoobicon.com/admin/api-keys).
2. Add it to your repo as a secret named `ZOOBICON_API_KEY`
   (Settings → Secrets and variables → Actions).
3. Drop one of the snippets below into `.github/workflows/`.
4. Push.

## Inputs

| Input          | Required                              | Default  | Purpose |
| -------------- | ------------------------------------- | -------- | ------- |
| `api-key`      | yes                                   | —        | Your `zbk_live_…` token. Always pass via secret. |
| `mode`         | no                                    | `deploy` | `deploy` (ship `path`), `generate` (AI-build then ship), or `new` (AI-build, no deploy). |
| `path`         | no                                    | `.`      | Directory to deploy / write generated files to. |
| `prompt`       | yes when `mode=generate` or `mode=new` | —        | Natural-language description of the site to build. |
| `slug`         | no                                    | —        | Custom subdomain (e.g. `my-app` → `my-app.zoobicon.sh`). |
| `site-name`    | no                                    | —        | Friendly name shown in your Zoobicon dashboard. |
| `cli-version`  | no                                    | `latest` | npm dist-tag or version of the `zoobicon` CLI. Pin for reproducible builds. |

## Outputs

| Output | Description |
| ------ | ----------- |
| `url`  | Live URL (e.g. `https://my-app.zoobicon.sh`). |
| `slug` | The assigned subdomain slug. |

## Recipes

### 1. Deploy your build directory on every push to main

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build the site
        run: npm ci && npm run build
      - name: Deploy to Zoobicon
        uses: zoobicon/zoobicon-action@v1
        with:
          api-key: ${{ secrets.ZOOBICON_API_KEY }}
          path: ./build
          slug: my-app
```

### 2. Preview every PR on a unique subdomain

```yaml
name: PR preview
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - id: deploy
        uses: zoobicon/zoobicon-action@v1
        with:
          api-key: ${{ secrets.ZOOBICON_API_KEY }}
          path: ./build
          slug: pr-${{ github.event.number }}
      - uses: marocchino/sticky-pull-request-comment@v2
        with:
          message: |
            🔗 Preview deployed: ${{ steps.deploy.outputs.url }}
```

### 3. Auto-generate a marketing site from your README

The killer use case. The Action's `generate` mode reads a prompt, AI-builds a
full marketing site, and deploys it on every push.

```yaml
name: Marketing site
on:
  push:
    branches: [main]
    paths: [README.md]

jobs:
  build-and-ship:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Read README into a prompt
        id: prompt
        run: |
          {
            echo "prompt<<EOF"
            head -n 60 README.md
            echo "EOF"
          } >> "$GITHUB_OUTPUT"
      - uses: zoobicon/zoobicon-action@v1
        with:
          api-key: ${{ secrets.ZOOBICON_API_KEY }}
          mode: generate
          prompt: ${{ steps.prompt.outputs.prompt }}
          slug: ${{ github.event.repository.name }}-docs
```

### 4. Build only, commit the React source back into the repo

```yaml
- uses: zoobicon/zoobicon-action@v1
  with:
    api-key: ${{ secrets.ZOOBICON_API_KEY }}
    mode: new
    prompt: "AI scheduling tool for dentists"
    path: ./generated
```

After this step the workspace contains a complete React + Tailwind project at
`./generated/`. Combine with `peter-evans/create-pull-request` to open a PR with
the generated files for review before deploy.

## Pricing

The Action itself is free. Usage is billed against your Zoobicon plan:

- **Free** — generate + deploy with a small "Built with Zoobicon" badge.
- **Pro** ($49/mo) — no badge, custom domains, full feature set.
- **Agency** ($299/mo) — bulk generations, white-label, agency dashboard.

See [zoobicon.com/pricing](https://zoobicon.com/pricing) for the full
breakdown.

## How it works

This is a [composite action](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action) — no Docker, no per-run image pull. It:

1. Sets up Node 20 via `actions/setup-node`.
2. Installs the [`zoobicon` CLI](https://www.npmjs.com/package/zoobicon)
   from npm at the version you pin.
3. Runs the right CLI command for your chosen `mode`.
4. Parses the deploy URL out of the CLI's stdout and exposes it as a
   step output + a job summary.

If you want lower-level control, install the CLI yourself and skip this
action — the Action is just a tested wrapper around the same commands you
could run by hand.

## Source

Open-source on GitHub (this repo). Issues and PRs welcome.

The Action is MIT-licensed; the Zoobicon platform itself is proprietary and
billed via your account at zoobicon.com.

— Built by the Zoobicon team.
