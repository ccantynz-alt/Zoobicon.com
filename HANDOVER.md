# Handover — Dictation Desktop App

## Repository
`ccantynz-alt/Dictation-App` — [github.com/ccantynz-alt/Dictation-App](https://github.com/ccantynz-alt/Dictation-App)

## What Is This
A standalone **Electron desktop app** for voice-to-text dictation. Originally built as part of Zoobicon, extracted to its own repo for independent distribution.

---

## Tech Stack
- **Electron 33** — desktop runtime
- **electron-builder 25** — packaging (Windows .exe, macOS .dmg, Linux AppImage)
- **Browser Speech API** — free, real-time speech recognition (no API key needed)
- **OpenAI Whisper API** — optional higher-accuracy transcription (requires API key)
- **Single HTML file** — entire UI is in `index.html` (no framework, no build step for the app itself)

## Files
```
main.js          — Electron main process (window, tray, global shortcuts)
preload.js       — Context bridge (exposes electronAPI to renderer)
index.html       — Complete UI + all JavaScript (~690 lines)
package.json     — Dependencies + electron-builder config
.github/workflows/build.yml — CI/CD (builds for Win/Mac/Linux)
```

## Features
- **Dual engine**: Browser Speech (free) or OpenAI Whisper API
- **3 mic modes**: Toggle, Push-to-Talk, Always On
- **Voice commands**: "period", "new line", "comma", "question mark", "exclamation mark", "colon", "semicolon", "open/close quote", "open/close parenthesis", "dash", "hyphen", "ellipsis", "tab", "space"
- **Auto-capitalize** sentences
- **Audio level visualization** (frequency bar)
- **Session timer** + word/char count
- **Undo last segment** (per-dictation-chunk undo)
- **Copy to clipboard** / **Download as .txt** / **Clear all**
- **System tray** — minimize to tray, right-click menu
- **Global shortcuts**: F9 toggle mic from anywhere, Ctrl+Shift+D show/hide window
- **In-app shortcuts**: F2 toggle mic, mouse wheel click toggle
- **16 languages** supported
- **Persistent settings** via localStorage (engine, mode, language, font size, preferences)
- **Auto-save text** every 2 seconds
- **Frameless window** with custom title bar (Windows title bar overlay)

## How to Build

### Local (if Windows Developer Mode is enabled or running as Admin)
```bash
npm install
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"   # PowerShell — skip code signing
npm run build:win
# Output: dist/Dictation Setup *.exe + dist/win-unpacked/Dictation.exe
```

### Via GitHub Actions (recommended — avoids local build issues)
Push to `main` branch → Actions tab → download artifacts:
- `windows-build` — installer .exe
- `mac-build` — .dmg
- `linux-build` — AppImage

### Known Build Issue on Windows
electron-builder downloads `winCodeSign` which contains macOS symlinks. Windows requires **Developer Mode** or **Admin privileges** to create symlinks. Fix:
1. **Enable Developer Mode**: Settings → System → For developers → Developer Mode ON
2. **Or** set `CSC_IDENTITY_AUTO_DISCOVERY=false` env var before building
3. **Or** use GitHub Actions (builds in cloud, no local issues)

## Build Targets (from `package.json`)
```
npm run build:win    → NSIS installer (.exe) + portable (.exe)
npm run build:mac    → DMG
npm run build:linux  → AppImage
npm run start        → Run in dev mode (no packaging)
```

## GitHub Actions Workflow
`.github/workflows/build.yml` triggers on:
- Push to `main` branch
- Git tags matching `v*` (creates GitHub Release with artifacts)
- Manual dispatch (`workflow_dispatch`)

Builds all 3 platforms in parallel. Tagged pushes auto-create GitHub Releases with downloadable installers.

## Architecture Notes
- **No external dependencies at runtime** — the app is a single HTML file with inline CSS and JS
- **Context isolation enabled** — `preload.js` exposes only `onToggleMic` and `platform` via `contextBridge`
- **No Node integration** — renderer process runs in sandboxed browser context
- **Tray integration** — closing the window hides to tray (quit via tray menu or Ctrl+Q)
- **Whisper mode** records 5-second chunks via `MediaRecorder`, sends to OpenAI API every 6 seconds
- **Browser mode** uses `SpeechRecognition` continuous mode with `interimResults` for real-time feedback

## Relationship to Zoobicon
- Zoobicon has a `/dictation` page with the same functionality (web-based, no Electron)
- This repo is the standalone desktop version, completely independent
- No shared code or dependencies between the two
