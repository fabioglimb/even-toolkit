/**
 * Persistent storage for Even Hub apps.
 *
 * The Even Hub WebView doesn't persist browser localStorage across app restarts.
 * This module uses the SDK's `bridge.setLocalStorage/getLocalStorage` which DO persist,
 * with browser localStorage as a sync-read cache and fallback for web/dev.
 *
 * Usage:
 *   import { storageSet, storageGetSync, hydrateFromSDK } from 'even-toolkit/storage';
 *
 *   // In main.tsx — hydrate before render:
 *   hydrateFromSDK(['my-app:settings', 'my-app:data']).finally(() => {
 *     createRoot(...).render(<App />);
 *   });
 *
 *   // Read (synchronous):
 *   const data = storageGetSync<MyData>('my-app:data', defaultValue);
 *
 *   // Write (dual-write to localStorage + SDK bridge):
 *   storageSet('my-app:data', data);
 */

/**
 * Get a bridge object that has setLocalStorage/getLocalStorage.
 * Checks window.__evenBridge (our wrapper) first,
 * then tries the raw SDK bridge directly via waitForEvenAppBridge.
 */
function getBridge(): any {
  const bridge = (window as any).__evenBridge;
  if (bridge?.setLocalStorage) return bridge;
  // Also check raw bridge exposed on the wrapper
  if (bridge?.rawBridge?.setLocalStorage) return bridge.rawBridge;
  return null;
}

/**
 * Try to get a raw SDK bridge for hydration (before useGlasses sets window.__evenBridge).
 * Returns null if SDK is not available (web/dev environment).
 */
async function getRawBridgeForHydration(): Promise<any> {
  // If our wrapper is already set, use it
  const existing = getBridge();
  if (existing) return existing;

  // Try to get raw bridge directly from the SDK
  try {
    const { EvenBetterSdk } = await import('@jappyjan/even-better-sdk');
    const raw = await Promise.race([
      EvenBetterSdk.getRawBridge(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
    ]);
    return raw;
  } catch {
    return null;
  }
}

/**
 * Read a JSON value synchronously from browser localStorage.
 * Call `hydrateFromSDK()` at startup to ensure localStorage has the latest SDK data.
 */
export function storageGetSync<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return fallback;
}

/**
 * Write a JSON-serializable value to both localStorage and SDK bridge.
 */
export function storageSet(key: string, value: unknown): void {
  const json = JSON.stringify(value);
  try { localStorage.setItem(key, json); } catch { /* ignore */ }
  const bridge = getBridge();
  if (bridge?.setLocalStorage) {
    bridge.setLocalStorage(key, json).catch(() => {});
  }
}

/**
 * Write a raw string value to both localStorage and SDK bridge.
 * Use for pre-serialized or encrypted values that shouldn't be double-stringified.
 */
export function storageSetRaw(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
  const bridge = getBridge();
  if (bridge?.setLocalStorage) {
    bridge.setLocalStorage(key, value).catch(() => {});
  }
}

/**
 * Remove a key from both localStorage and SDK bridge.
 */
export function storageRemove(key: string): void {
  localStorage.removeItem(key);
  const bridge = getBridge();
  if (bridge?.setLocalStorage) {
    bridge.setLocalStorage(key, '').catch(() => {});
  }
}

/**
 * Hydrate browser localStorage from SDK bridge on app startup.
 * Call once before React renders so `storageGetSync` reads fresh data.
 * Gets the raw SDK bridge directly (doesn't depend on useGlasses).
 *
 * @param keys - All storage keys used by the app
 */
export async function hydrateFromSDK(keys: string[]): Promise<void> {
  const bridge = await getRawBridgeForHydration();
  if (!bridge?.getLocalStorage) return;

  for (const key of keys) {
    try {
      const value = await bridge.getLocalStorage(key);
      if (value && value !== '') {
        localStorage.setItem(key, value);
      }
    } catch { /* ignore */ }
  }
}
