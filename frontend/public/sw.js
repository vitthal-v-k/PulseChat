/**
 * PulseChat Service Worker
 * Handles:
 *  1. App shell caching (offline support)
 *  2. Web Push notifications
 *  3. Notification click navigation
 */

const CACHE_NAME = 'pulsechat-v6';
const SHELL_ASSETS = ['/logo.svg', '/favicon.svg'];

// ─── Install: cache app assets ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate: clean old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch: network-first for all requests, fallback to cache ────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API or WebSocket requests
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) return;

  // For HTML page navigation, ALWAYS go to network first so users get latest code
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache hashed assets only
        if (event.request.method === 'GET' && response.ok && url.pathname.startsWith('/assets/')) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ─── Push: show notification when a push arrives ─────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'PulseChat', body: 'You have a new message', chatId: null, icon: '/logo.svg' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/logo.svg',
      badge: '/favicon.svg',
      tag: `chat-${data.chatId}`,       // collapses multiple notifs per chat
      renotify: true,
      vibrate: [200, 100, 200],
      data: { chatId: data.chatId, url: data.chatId ? `/?chat=${data.chatId}` : '/' },
    })
  );
});

// ─── Notification click: focus or open the app ───────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // If the app is already open, focus it
        const existing = windowClients.find((c) => c.url.includes(self.location.origin));
        if (existing) {
          existing.focus();
          existing.navigate(targetUrl);
          return;
        }
        // Otherwise open a new tab
        return clients.openWindow(targetUrl);
      })
  );
});
