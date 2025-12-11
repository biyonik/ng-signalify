/**
 * Platform detection utilities for SSR compatibility
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */

/**
 * Check if code is running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if code is running in server environment (Node.js/SSR)
 */
export function isServer(): boolean {
  return !isBrowser();
}

/**
 * Check if IndexedDB is available
 */
export function hasIndexedDB(): boolean {
  return isBrowser() && 'indexedDB' in window;
}

/**
 * Check if localStorage is available
 */
export function hasLocalStorage(): boolean {
  if (!isBrowser()) return false;
  
  try {
    const testKey = '__sig_test__';
    window.localStorage.setItem(testKey, 'test');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if sessionStorage is available
 */
export function hasSessionStorage(): boolean {
  if (!isBrowser()) return false;
  
  try {
    const testKey = '__sig_test__';
    window.sessionStorage.setItem(testKey, 'test');
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if WebSocket is available
 */
export function hasWebSocket(): boolean {
  return isBrowser() && 'WebSocket' in window;
}

/**
 * Get safe window object (returns undefined in SSR)
 */
export function getWindow(): Window | undefined {
  return isBrowser() ? window : undefined;
}

/**
 * Get safe document object (returns undefined in SSR)
 */
export function getDocument(): Document | undefined {
  return isBrowser() ? document : undefined;
}

/**
 * Execute callback only in browser environment
 */
export function onBrowser<T>(callback: () => T): T | undefined {
  return isBrowser() ? callback() : undefined;
}

/**
 * Execute callback only in server environment
 */
export function onServer<T>(callback: () => T): T | undefined {
  return isServer() ? callback() : undefined;
}
