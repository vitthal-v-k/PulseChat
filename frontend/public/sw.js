/**
 * PulseChat Service Worker
 * Handles:
 *  1. App shell caching (offline support)
 *  2. Web Push notifications
 *  3. Notification click navigation
 */

const CACHE_NAME = 'pulsechat-v1';
const SHELL_ASSETS = ['/', '/index.html', '/logo.svg', '/favicon.svg'];

// ─── Install: cache app shell ───────────────────────────────────────────────
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

// ─── Fetch: network-first for API, cache-first for shell ─────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept API or WebSocket requests
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Update cache with fresh response for GET requests
        if (event.request.method === 'GET' && response.ok) {
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
