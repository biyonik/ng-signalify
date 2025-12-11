import {
  isBrowser,
  isServer,
  hasIndexedDB,
  hasLocalStorage,
  hasSessionStorage,
  hasWebSocket,
  getWindow,
  getDocument,
  onBrowser,
  onServer
} from './platform.utils';

describe('Platform Utilities', () => {
  describe('isBrowser', () => {
    it('should return true in browser environment', () => {
      expect(isBrowser()).toBe(true);
    });
  });

  describe('isServer', () => {
    it('should return false in browser environment', () => {
      expect(isServer()).toBe(false);
    });
  });

  describe('hasIndexedDB', () => {
    it('should detect IndexedDB availability', () => {
      const result = hasIndexedDB();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('hasLocalStorage', () => {
    it('should detect localStorage availability', () => {
      const result = hasLocalStorage();
      expect(typeof result).toBe('boolean');
    });

    it('should return true when localStorage is available', () => {
      // In jsdom test environment, localStorage should be available
      expect(hasLocalStorage()).toBe(true);
    });
  });

  describe('hasSessionStorage', () => {
    it('should detect sessionStorage availability', () => {
      const result = hasSessionStorage();
      expect(typeof result).toBe('boolean');
    });

    it('should return true when sessionStorage is available', () => {
      // In jsdom test environment, sessionStorage should be available
      expect(hasSessionStorage()).toBe(true);
    });
  });

  describe('hasWebSocket', () => {
    it('should detect WebSocket availability', () => {
      const result = hasWebSocket();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getWindow', () => {
    it('should return window object in browser', () => {
      const win = getWindow();
      expect(win).toBeDefined();
    });
  });

  describe('getDocument', () => {
    it('should return document object in browser', () => {
      const doc = getDocument();
      expect(doc).toBeDefined();
    });
  });

  describe('onBrowser', () => {
    it('should execute callback in browser', () => {
      const result = onBrowser(() => 'browser');
      expect(result).toBe('browser');
    });

    it('should return value from callback', () => {
      const result = onBrowser(() => 42);
      expect(result).toBe(42);
    });
  });

  describe('onServer', () => {
    it('should not execute callback in browser', () => {
      const result = onServer(() => 'server');
      expect(result).toBeUndefined();
    });
  });
});
