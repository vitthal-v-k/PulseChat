/**
 * PulseChat — Web Push Notification Utilities
 *
 * Usage:
 *   import { initPushNotifications } from './pushNotifications';
 *   await initPushNotifications();
 */

const API_BASE = '/api/push';

/**
 * Converts a URL-safe base64 VAPID public key to a Uint8Array
 * as required by the browser's PushManager.subscribe() API.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Fetches the VAPID public key from the backend.
 */
async function getVapidPublicKey() {
  const res = await fetch(`${API_BASE}/vapid-public-key`);
  if (!res.ok) throw new Error('Failed to fetch VAPID public key');
  const data = await res.json();
  return data.publicKey;
}

/**
 * Sends the browser's push subscription object to the backend for storage.
 */
async function saveSubscriptionToServer(subscription) {
  const json = subscription.toJSON();
  await fetch(`${API_BASE}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
    }),
  });
}

/**
 * Main entry point — call this after the user logs in.
 *
 * 1. Registers the service worker
 * 2. Requests notification permission
 * 3. Subscribes the browser to Web Push
 * 4. Sends the subscription to the backend
 *
 * Returns: 'granted' | 'denied' | 'unsupported'
 */
export async function initPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Not supported in this browser');
    return 'unsupported';
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[Push] Permission denied');
      return 'denied';
    }

    // Fetch VAPID key from backend
    const vapidPublicKey = await getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    // Subscribe (reuse existing subscription if already subscribed)
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // Send to backend
    await saveSubscriptionToServer(subscription);
    console.info('[Push] Subscribed successfully');
    return 'granted';
  } catch (err) {
    console.error('[Push] Subscription error:', err);
    return 'denied';
  }
}

/**
 * Unsubscribes this browser from push notifications.
 * Call this on logout.
 */
export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetch(`${API_BASE}/unsubscribe`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
    }
  } catch (err) {
    console.warn('[Push] Unsubscribe error:', err);
  }
}
