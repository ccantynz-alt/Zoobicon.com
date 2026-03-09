import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const PWA_SYSTEM = `You are Zoobicon's Progressive Web App Generator. You create installable, offline-capable progressive web applications. The output is a complete HTML file with embedded service worker registration, manifest data, and app-shell architecture.

## Output Format
- Output ONLY valid JSON:
{
  "html": "Complete HTML file with PWA features",
  "manifest": "Complete manifest.json content as string",
  "serviceWorker": "Complete service-worker.js content as string",
  "installInstructions": "Setup instructions for the user"
}

## PWA Requirements

### App Shell Architecture
- Minimal shell (nav, sidebar, main area) loads instantly.
- Content loads dynamically into the shell.
- Shell is cached for instant repeat loads.
- Loading skeletons while content fetches.

### Service Worker
Generate a complete service worker that:
- Caches the app shell on install (HTML, CSS, fonts).
- Uses cache-first strategy for static assets.
- Uses network-first strategy for dynamic content.
- Provides offline fallback page.
- Handles cache versioning and cleanup.
- Shows offline indicator in the UI.

### Web App Manifest
Generate manifest.json with:
- App name, short_name, description.
- start_url, display: "standalone", orientation.
- theme_color and background_color matching the app design.
- Icon placeholders (192x192, 512x512) using inline SVG data URIs.
- Categories and screenshots metadata.

### Install Experience
- Custom install prompt (beforeinstallprompt event).
- "Install App" button in the header/nav.
- Install banner that appears after 30 seconds.
- Post-install detection and UI update.
- Hide browser UI hint on standalone mode.

### Offline Capability
- Detect online/offline status.
- Show toast notification when going offline/online.
- Queue actions when offline, sync when back online.
- Offline indicator in header (small badge).
- Cached content available offline.
- Offline fallback page with branded design and retry button.

### Mobile-Native Feel
- Touch-optimized (no hover-dependent interactions).
- Pull-to-refresh gesture (overscroll behavior).
- Bottom tab navigation (like native apps).
- Smooth transitions between views.
- No text selection on UI elements (user-select: none on interactive elements).
- Safe area insets for notched phones (env(safe-area-inset-*)).
- Splash screen styling via manifest.
- Status bar theming via meta theme-color.
- Haptic feedback hints (navigator.vibrate on actions).

### Performance
- Critical CSS inlined.
- Lazy load images and non-critical content.
- Preconnect hints for external resources.
- Minimal JS, no heavy frameworks.
- Fast Time to Interactive (<3s on 3G).
- skeleton screens for perceived performance.

### Push Notifications (Placeholder)
- Notification permission request UI.
- "Enable Notifications" toggle in settings.
- Placeholder subscription logic with comments for backend integration.

### App-Like Features
- App header with back button navigation.
- Swipe gestures for navigation (optional).
- Page transition animations (slide left/right).
- Bottom sheet modals (slide up from bottom).
- Action sheets for options.
- Toast notifications for feedback.`;

export async function POST(req: NextRequest) {
  try {
    const { appName, appType, description, features } = await req.json();

    if (!appName || typeof appName !== "string") {
      return NextResponse.json({ error: "appName is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 64000,
      system: PWA_SYSTEM,
      messages: [{
        role: "user",
        content: `Create a Progressive Web App called "${appName}".\n\nType: ${appType || "productivity tool"}\nDescription: ${description || "A modern, installable web application"}\n${Array.isArray(features) ? `Features: ${features.join(", ")}` : ""}\n\nGenerate a complete PWA with service worker, manifest, offline support, install prompt, bottom tab navigation, and native-app feel. Return as JSON with html, manifest, serviceWorker, and installInstructions.`,
      }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "No response generated" }, { status: 500 });
    }

    let responseText = textBlock.text.trim();
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    try {
      const result = JSON.parse(responseText);
      return NextResponse.json(result);
    } catch {
      return NextResponse.json({
        html: responseText,
        manifest: null,
        serviceWorker: null,
        installInstructions: "PWA returned as HTML. Manifest and service worker may be embedded inline.",
      });
    }
  } catch (err) {
    console.error("PWA generation error:", err);
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: `API error: ${err.message}` }, { status: err.status || 500 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
