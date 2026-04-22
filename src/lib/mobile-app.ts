/**
 * Mobile App Foundation (#35) — zoobicon.app
 *
 * The mobile app wraps the admin dashboard in a native-feeling shell.
 * Phase 1: Progressive Web App (PWA) — works immediately, no App Store
 * Phase 2: Expo/React Native wrapper for App Store presence
 *
 * PWA gives us:
 *   - Add to home screen (looks like a native app)
 *   - Push notifications
 *   - Offline caching of dashboard data
 *   - Full-screen mode (no browser chrome)
 *
 * This is for Craig to manage everything from his iPhone/iPad:
 *   - Support emails (Claude handled vs needs human)
 *   - New signups
 *   - MRR today
 *   - Site health
 *   - Expiring domains
 *   - Competitor alerts from intelligence system
 */

/**
 * Generate PWA manifest for zoobicon.app
 */
export function generateManifest(): Record<string, unknown> {
  return {
    name: "Zoobicon",
    short_name: "Zoobicon",
    description: "AI Website Builder & Business Platform",
    start_url: "/admin/mobile",
    display: "standalone",
    background_color: "#060e1f",
    theme_color: "#4f46e5",
    orientation: "any",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/screenshot-wide.png", sizes: "1280x720", type: "image/png", form_factor: "wide" },
      { src: "/screenshot-narrow.png", sizes: "720x1280", type: "image/png", form_factor: "narrow" },
    ],
    categories: ["business", "productivity", "utilities"],
    shortcuts: [
      { name: "Dashboard", url: "/admin/mobile", description: "Open dashboard" },
      { name: "Builder", url: "/builder", description: "Build a website" },
      { name: "Domains", url: "/domains", description: "Search domains" },
      { name: "Video", url: "/video-creator", description: "Create a video" },
    ],
  };
}

/**
 * Generate service worker for offline support.
 */
export function generateServiceWorker(): string {
  return `// Zoobicon Service Worker — Offline Support
const CACHE_NAME = 'zoobicon-v1';
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [
  '/',
  '/admin/mobile',
  '/dashboard',
  '/offline',
];

// Install — cache core pages
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache, fallback to network, then offline page
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  // For API calls, always go to network
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For static assets, cache-first
  event.respondWith(
    caches.match(event.request).then((cached) =>
      cached || fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
    )
  );
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Zoobicon', body: 'New notification' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url ? { url: data.url } : undefined,
    })
  );
});

// Notification click — open the URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/admin/mobile';
  event.waitUntil(clients.openWindow(url));
});
`;
}

/**
 * Push notification types for the mobile app.
 */
export const NOTIFICATION_TYPES = {
  NEW_SIGNUP: { title: "New Signup", icon: "user-plus" },
  SUPPORT_TICKET: { title: "Support Ticket", icon: "message-circle" },
  DOMAIN_EXPIRING: { title: "Domain Expiring", icon: "alert-triangle" },
  COMPETITOR_ALERT: { title: "Competitor Alert", icon: "eye" },
  SITE_DOWN: { title: "Site Down", icon: "alert-circle" },
  PAYMENT_RECEIVED: { title: "Payment Received", icon: "dollar-sign" },
  VIDEO_COMPLETE: { title: "Video Ready", icon: "video" },
  SITE_DEPLOYED: { title: "Site Deployed", icon: "rocket" },
};
