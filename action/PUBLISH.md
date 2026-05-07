# Publishing the GitHub Action to Marketplace

This document is the runbook for getting `zoobicon/zoobicon-action` listed on
the GitHub Marketplace. The Action source lives in the main private repo at
`/action/`; Marketplace requires a **separate public repo** with `action.yml`
at its root.

## Why a separate public repo

The Marketplace listing pulls from the repo where `action.yml` lives. Two
hard requirements that mean we can't list straight from `Zoobicon.com`:

1. The repo must be public.
2. `action.yml` must be at the repository root, not in a subdirectory.

`Zoobicon.com` is private (per CLAUDE.md IP strategy) and `action.yml` lives
in `/action/`. So we create a small public repo dedicated to the Action and
mirror this directory's contents into its root.

## One-time setup (Craig)

### 1. Create the public repo

Go to https://github.com/new and create:

- **Repository name:** `zoobicon-action`
- **Owner:** `ccantynz-alt` (or `zoobicon` if you create the org first)
- **Visibility:** Public
- **Initialize:** leave blank (we'll push initial files)
- **License:** MIT (add via the GitHub UI on first commit)

### 2. Mirror this directory into the new repo

From the Zoobicon.com repo root:

```bash
cd action

# initialise a fresh local repo for the public Action
git init
git checkout -b main
git remote add origin git@github.com:ccantynz-alt/zoobicon-action.git
git add action.yml README.md examples/
git commit -m "feat: initial release of the Zoobicon GitHub Action"
git push -u origin main
```

If you'd rather keep history in sync via subtree, that works too — but a
clean initial commit on the public repo is fine for v0.

### 3. Tag a release

```bash
git tag -a v0.1.0 -m "v0.1.0 — initial release"
git tag -f v1                           # major-version moving tag
git push origin v0.1.0 v1 --force
```

The moving `v1` tag is what users reference in their workflows
(`uses: zoobicon/zoobicon-action@v1`). Repoint it after every minor release.

### 4. Submit to Marketplace

1. On the public repo, go to **Releases** → click the v0.1.0 tag → **Edit
   release**.
2. Tick **"Publish this Action to the GitHub Marketplace"**.
3. Accept the Marketplace developer agreement.
4. Pick **two categories** for the listing:
   - Primary: **Deployment**
   - Secondary: **Continuous integration**
5. Add an icon (we have `branding.icon: zap` in `action.yml`, GitHub uses
   that automatically).
6. Click **Publish release**.

The listing appears at `https://github.com/marketplace/actions/zoobicon`
within a few minutes.

## Verification checklist

After publishing, run through this list:

- [ ] The Marketplace listing renders the README correctly.
- [ ] The "Use latest version" snippet shows `uses: zoobicon/zoobicon-action@v1`.
- [ ] All three example workflows in `examples/` parse without errors when
      pasted into a real repo's `.github/workflows/`.
- [ ] A test run against a sandbox repo returns a working URL.
- [ ] The deploy URL is parsed into `steps.<id>.outputs.url`.
- [ ] The job summary contains the link.

## Updating the Action later

Workflow for shipping a new version:

```bash
# 1. Make the change in /action/ in the main Zoobicon.com repo.
# 2. Copy the change into the public action repo.
# 3. Bump the version in the public repo:
git tag -a v0.2.0 -m "v0.2.0 — describe the change"
git tag -f v1                           # only if backwards-compatible
git push origin v0.2.0 v1 --force
```

Breaking changes go in `v2`, `v3`, etc. Most users will pin to `@v1` and
inherit minor updates automatically.

## CLI version pinning

By default the Action installs `zoobicon@latest` from npm. If a release ever
breaks the Action's contract, users can pin:

```yaml
- uses: zoobicon/zoobicon-action@v1
  with:
    api-key: ${{ secrets.ZOOBICON_API_KEY }}
    cli-version: 0.1.0
```

We should also tag npm dist-tags conservatively so `latest` only moves
forward when both the CLI and the Action agree on the contract.

## Cross-promotion

Once live:

- Add a **"Use the official Action"** section to the CLI README.
- Add a **"Available on GitHub Marketplace"** badge to the main
  zoobicon.com homepage.
- Mention the Action in the comparison pages (`/vs/lovable`, `/vs/bolt`,
  `/vs/v0`) — none of those competitors have a first-party GitHub Action,
  so it's a real differentiator.

That's it. The Action becomes a perpetual top-of-funnel for the platform
and the CLI alike.
