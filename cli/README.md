# `zoobicon` — CLI for the Zoobicon AI website builder

> Generate, deploy, and manage AI-built websites from your terminal.
> Same engine as [zoobicon.com](https://zoobicon.com) — the 100-name domain
> finder, the React/Tailwind builder, and the one-click deploy pipeline.

```bash
npm i -g zoobicon
zoobicon login
zoobicon new "AI email client for legal teams"
zoobicon deploy
```

## Install

```bash
# globally (recommended)
npm i -g zoobicon

# or run without installing
npx zoobicon --help
```

Requires Node 20+.

## Authentication

The CLI talks to your Zoobicon account through a personal API key. Create one
at [zoobicon.com/admin/api-keys](https://zoobicon.com/admin/api-keys), then:

```bash
zoobicon login
```

Paste the key when prompted. It's saved to `~/.zoobicon/credentials` with
`0600` permissions. To swap keys: `zoobicon login --key zbk_live_…`. To sign
out: `zoobicon login --logout`.

You can also pass the key inline for CI:

```bash
ZOOBICON_API_KEY=zbk_live_… zoobicon deploy ./build
```

## Commands

### `zoobicon new <prompt>`

Generates a complete React + Tailwind site from a natural-language prompt and
writes the files to a local directory. Streams real-time progress as components
finish.

```bash
zoobicon new "sustainable fashion marketplace for outdoor adventurers"
zoobicon new "dog training app" --out ./my-site --force
```

Options:

| Flag | Description |
| --- | --- |
| `-o, --out <dir>` | Output directory (default: `./zoobicon-<slug>`) |
| `--force` | Overwrite the output directory if it already exists |

### `zoobicon deploy [path]`

Deploys a directory to `<slug>.zoobicon.sh` with free SSL + global CDN.

```bash
zoobicon deploy                  # deploy the current directory
zoobicon deploy ./my-site        # deploy a specific directory
zoobicon deploy --slug my-brand  # use a custom subdomain
```

Options:

| Flag | Description |
| --- | --- |
| `--slug <slug>` | Custom subdomain slug (defaults to a generated one) |
| `--name <name>` | Friendly site name shown in your dashboard |

`node_modules`, `.git`, `dist`, `build`, `.next`, `.vercel`, and any `.env*`
files are excluded automatically. Files larger than 1 MB are skipped to keep
the deploy payload tight.

### `zoobicon domains <description>`

AI-generates domain names and checks `.com` availability against the live
registry. Same engine as [zoobicon.com/domain-finder](https://zoobicon.com/domain-finder),
including AI brand-quality scoring and language-safety flags.

```bash
zoobicon domains "AI email client for legal teams"
zoobicon domains "sustainable fashion brand" --count 100 --word 1 --length short --type real
zoobicon domains "developer tooling" --tlds com,io,dev
```

Options:

| Flag | Description |
| --- | --- |
| `-c, --count <n>` | How many names to generate (5–100, default 25) |
| `--word <1\|2\|either>` | Force single-word, two-word, or either |
| `--length <short\|any>` | `short` = ≤6 chars (Notion/Stripe/Loom tier) |
| `--type <real\|invented\|either>` | Real dictionary words vs invented brands |
| `--tlds <list>` | Comma-separated TLDs (default: `com`) |

### `zoobicon list`

Lists your deployed sites with status and URL.

```bash
zoobicon list
zoobicon ls   # alias
```

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `ZOOBICON_API_KEY` | (none) | API key. Overrides `~/.zoobicon/credentials`. |
| `ZOOBICON_API` | `https://zoobicon.com` | Override the API host (staging, self-hosted). |
| `ZOOBICON_DEBUG` | (unset) | Print full stack traces on errors. |

## CI / scripting

The CLI is fully scriptable — every command exits non-zero on failure and
emits machine-readable URLs for the success case. Example GitHub Actions step:

```yaml
- name: Deploy preview to Zoobicon
  env:
    ZOOBICON_API_KEY: ${{ secrets.ZOOBICON_API_KEY }}
  run: |
    npm i -g zoobicon
    zoobicon deploy ./build --slug pr-${{ github.event.number }}
```

## Source

Open-source on GitHub:
[ccantynz-alt/Zoobicon.com](https://github.com/ccantynz-alt/Zoobicon.com/tree/main/cli)

The CLI is MIT-licensed; the platform itself is proprietary.

Built by the Zoobicon team. Issues and PRs welcome.
