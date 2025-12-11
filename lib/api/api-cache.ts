import { signal, Signal } from '@angular/core';
import { hasLocalStorage } from '../utils/platform.utils';

/**
 * TR: Önbellek girişinin yapısını tanımlayan arayüz.
 * Veri, oluşturulma zamanı, son kullanma tarihi ve opsiyonel ETag bilgisini içerir.
 *
 * EN: Interface defining the structure of a cache entry.
 * Includes data, creation timestamp, expiration time, and optional ETag info.
 *
 * @template T - TR: Önbelleğe alınan veri tipi. / EN: Type of cached data.
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  etag?: string;
}

/**
 * TR: Önbellek yapılandırma ayarları.
 * Varsayılan süre (TTL), maksimum kayıt sayısı ve kalıcılık (Persistence) ayarlarını yönetir.
 *
 * EN: Cache configuration settings.
 * Manages default TTL, max entries, and persistence settings.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface CacheConfig {
  /**
   * TR: Varsayılan geçerlilik süresi (milisaniye).
   *
   * EN: Default time-to-live (milliseconds).
   */
  defaultTTL?: number;

  /**
   * TR: Önbellekte tutulacak maksimum kayıt sayısı.
   * Limit aşılırsa en eski kayıtlar silinir.
   *
   * EN: Maximum number of entries to keep in cache.
   * If exceeded, oldest entries are evicted.
   */
  maxEntries?: number;

  /**
   * TR: LocalStorage anahtarları için ön ek (Namespace).
   *
   * EN: Prefix for LocalStorage keys (Namespace).
   */
  storagePrefix?: string;

  /**
   * TR: Verilerin tarayıcı kapatıldığında da saklanıp saklanmayacağı (LocalStorage kullanımı).
   *
   * EN: Whether data should persist after browser close (Use LocalStorage).
   */
  persistent?: boolean;
}

/**
 * TR: Önbellek performans istatistikleri.
 * İsabet (Hit) ve ıskalama (Miss) oranlarını takip etmek için kullanılır.
 *
 * EN: Cache performance statistics.
 * Used to track Hit and Miss rates.
 */
export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  size: number;
}

/**
 * TR: API yanıtlarını ve verileri yöneten Gelişmiş Önbellek Sistemi.
 * Bellek içi (In-Memory) ve Kalıcı (Persistent) depolama özelliklerine sahiptir.
 * Kapasite dolduğunda en eski veriyi silme (Eviction Policy) stratejisi uygular.
 *
 * EN: Advanced Cache System managing API responses and data.
 * Features both In-Memory and Persistent storage capabilities.
 * Applies an eviction policy (deleting oldest data) when capacity is reached.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private config: Required<CacheConfig>;
  private stats = signal<CacheStats>({
    hits: 0,
    misses: 0,
    entries: 0,
    size: 0,
  });

  /**
   * TR: ApiCache sınıfını başlatır.
   *
   * EN: Initializes the ApiCache class.
   *
   * @param config - TR: Önbellek ayarları. / EN: Cache settings.
   */
  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL ?? 5 * 60 * 1000, // 5 dakika / 5 minutes
      maxEntries: config.maxEntries ?? 100,
      storagePrefix: config.storagePrefix ?? 'api_cache_',
      persistent: config.persistent ?? false,
    };

    // TR: Kalıcı mod açıksa depolamadan yükle
    // EN: Load from storage if persistent mode is on
    if (this.config.persistent) {
      this.loadFromStorage();
    }
  }

  /**
   * TR: Önbellekten veri getirir.
   * Süresi dolmuşsa (Expired) otomatik olarak siler ve null döner.
   * İstatistikleri günceller (Hit/Miss).
   *
   * EN: Retrieves data from cache.
   * Automatically deletes and returns null if expired.
   * Updates statistics (Hit/Miss).
   *
   * @param key - TR: Veri anahtarı. / EN: Data key.
   * @returns TR: Veri veya null. / EN: Data or null.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.updateStats({ misses: this.stats().misses + 1 });
      return null;
    }

    // TR: Süre kontrolü
    // EN: Expiration check
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.updateStats({ misses: this.stats().misses + 1 });
      return null;
    }

    this.updateStats({ hits: this.stats().hits + 1 });
    return entry.data;
  }

  /**
   * TR: Veriyi önbelleğe kaydeder.
   * Kapasite doluysa yer açmak için en eski kaydı siler.
   *
   * EN: Saves data to cache.
   * Deletes the oldest entry to make space if capacity is full.
   *
   * @param key - TR: Anahtar. / EN: Key.
   * @param data - TR: Veri. / EN: Data.
   * @param ttl - TR: Özel geçerlilik süresi (Opsiyonel). / EN: Custom TTL (Optional).
   * @param etag - TR: ETag başlığı (Opsiyonel). / EN: ETag header (Optional).
   */
  set<T>(key: string, data: T, ttl?: number, etag?: string): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl ?? this.config.defaultTTL);

    // TR: Kapasite kontrolü ve tahliye (Eviction)
    // EN: Capacity check and eviction
    if (this.cache.size >= this.config.maxEntries && !this.cache.has(key)) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp,
      expiresAt,
      etag,
    };

    this.cache.set(key, entry);
    this.updateStats({ entries: this.cache.size });

    // TR: Kalıcı depolama
    // EN: Persistent storage
    if (this.config.persistent) {
      this.saveToStorage(key, entry);
    }
  }

  /**
   * TR: Anahtarın varlığını ve geçerliliğini kontrol eder.
   * Süresi dolmuşsa siler ve false döner.
   *
   * EN: Checks existence and validity of the key.
   * Deletes and returns false if expired.
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }
    return true;
  }

  /**
   * TR: Belirtilen anahtarı siler.
   *
   * EN: Deletes the specified key.
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats({ entries: this.cache.size });
      if (this.config.persistent) {
        this.removeFromStorage(key);
      }
    }
    return deleted;
  }

  /**
   * TR: Tüm önbelleği temizler.
   *
   * EN: Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
    this.updateStats({ entries: 0, hits: 0, misses: 0 });
    if (this.config.persistent) {
      this.clearStorage();
    }
  }

  /**
   * TR: Süresi dolmuş tüm kayıtları temizler (Garbage Collection).
   *
   * EN: Clears all expired entries (Garbage Collection).
   */
  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleared++;
      }
    }

    this.updateStats({ entries: this.cache.size });
    return cleared;
  }

  /**
   * TR: İlgili anahtar için ETag bilgisini getirir (HTTP 304 kontrolü için).
   *
   * EN: Gets ETag info for the key (For HTTP 304 check).
   */
  getETag(key: string): string | undefined {
    return this.cache.get(key)?.etag;
  }

  /**
   * TR: Önbellek istatistiklerini reaktif sinyal olarak döndürür.
   *
   * EN: Returns cache statistics as a reactive signal.
   */
  getStats(): Signal<CacheStats> {
    return this.stats.asReadonly();
  }

  /**
   * TR: Tüm kayıtlı anahtarları listeler.
   *
   * EN: Lists all stored keys.
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * TR: Regex desenine uyan anahtarları geçersiz kılar (Invalidate).
   *
   * EN: Invalidates keys matching the Regex pattern.
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.delete(key);
        invalidated++;
      }
    }
    return invalidated;
  }

  /**
   * TR: Belirli bir ön ek ile başlayan anahtarları siler.
   * Örn: 'users:' ile başlayan her şeyi sil.
   *
   * EN: Deletes keys starting with a specific prefix.
   * E.g., delete everything starting with 'users:'.
   */
  invalidatePrefix(prefix: string): number {
    return this.invalidatePattern(new RegExp(`^${prefix}`));
  }

  // Private methods

  /**
   * TR: En eski kaydı bulup siler (LRU benzeri strateji).
   *
   * EN: Finds and deletes the oldest entry (LRU-like strategy).
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  private updateStats(partial: Partial<CacheStats>): void {
    this.stats.update((s) => ({ ...s, ...partial }));
  }

  private loadFromStorage(): void {
    if (!hasLocalStorage()) return;

    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(this.config.storagePrefix)
      );

      for (const storageKey of keys) {
        const key = storageKey.replace(this.config.storagePrefix, '');
        const raw = localStorage.getItem(storageKey);
        
        if (raw) {
          const entry = JSON.parse(raw) as CacheEntry<unknown>;
          
          // Skip expired entries
          if (Date.now() <= entry.expiresAt) {
            this.cache.set(key, entry);
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      }

      this.updateStats({ entries: this.cache.size });
    } catch (e) {
      console.warn('Failed to load cache from storage:', e);
    }
  }

  /**
   * TR: LocalStorage'dan süresi dolmuş kayıtları temizler.
   *
   * EN: Clears expired entries from LocalStorage.
   */
  private clearExpiredFromStorage(): number {
    if (!hasLocalStorage()) return 0;

    const now = Date.now();
    let cleared = 0;

    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(this.config.storagePrefix)
      );

      for (const storageKey of keys) {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const entry = JSON.parse(raw) as CacheEntry<unknown>;
            if (now > entry.expiresAt) {
              localStorage.removeItem(storageKey);
              const key = storageKey.replace(this.config.storagePrefix, '');
              this.cache.delete(key);
              cleared++;
            }
          }
        } catch {
          localStorage.removeItem(storageKey);
          cleared++;
        }
      }
    } catch (e) {
      console.warn('Failed to clear expired from storage:', e);
    }

    if (cleared > 0) {
      this.updateStats({ entries: this.cache.size });
    }

    return cleared;
  }

  /**
   * TR: LocalStorage'dan en eski kayıtları siler (LRU).
   *
   * EN: Evicts oldest entries from LocalStorage (LRU).
   *
   * @param fraction - TR: Silinecek oran (0-1 arası). / EN: Fraction to evict (0-1).
   */
  private evictOldestFromStorage(fraction: number): number {
    if (!hasLocalStorage()) return 0;

    try {
      const entries: Array<{ key: string; timestamp: number }> = [];
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(this.config.storagePrefix)
      );

      for (const storageKey of keys) {
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            const entry = JSON.parse(raw) as CacheEntry<unknown>;
            entries.push({ key: storageKey, timestamp: entry.timestamp });
          }
        } catch {
          entries.push({ key: storageKey, timestamp: 0 });
        }
      }

      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Belirtilen oranı sil
      const toEvict = Math.max(1, Math.floor(entries.length * fraction));
      let evicted = 0;

      for (let i = 0; i < toEvict && i < entries.length; i++) {
        const storageKey = entries[i].key;
        localStorage.removeItem(storageKey);
        
        // In-memory cache'den de sil
        const key = storageKey.replace(this.config.storagePrefix, '');
        this.cache.delete(key);
        evicted++;
      }

      if (evicted > 0) {
        this.updateStats({ entries: this.cache.size });
      }

      return evicted;
    } catch (e) {
      console.warn('Failed to evict from storage:', e);
      return 0;
    }
  }

  /**
   * TR: Veriyi LocalStorage'a kaydeder.
   * Kota aşımında (QuotaExceededError) eski kayıtları temizleyip tekrar dener.
   *
   * EN: Saves data to LocalStorage.
   * On quota exceeded (QuotaExceededError), clears old entries and retries.
   */
  private saveToStorage<T>(key: string, entry: CacheEntry<T>): void {
    if (!hasLocalStorage()) return;

    const storageKey = this.config.storagePrefix + key;
    const data = JSON.stringify(entry);

    try {
      localStorage.setItem(storageKey, data);
    } catch (e) {
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
        console.warn('Storage quota exceeded, attempting cleanup...');
        
        this.clearExpiredFromStorage();
        
        try {
          localStorage.setItem(storageKey, data);
          return; 
        } catch {
          // Hala yer yok, daha agresif temizlik yap
        }

        this.evictOldestFromStorage(0.25);
        
        try {
          localStorage.setItem(storageKey, data);
          return; // Başarılı
        } catch {
          // Son çare: bu namespace'deki tüm cache'i temizle
          console.warn('Storage still full, clearing all cache entries');
          this.clearStorage();
          
          try {
            localStorage.setItem(storageKey, data);
          } catch {
            console.error('Storage quota exceeded, cache will not persist');
          }
        }
      } else {
        console.warn('Failed to save cache to storage:', e);
      }
    }
  }

  private removeFromStorage(key: string): void {
    if (!hasLocalStorage()) return;

    try {
      localStorage.removeItem(this.config.storagePrefix + key);
    } catch (e) {
      console.warn('Failed to remove cache from storage:', e);
    }
  }

  private clearStorage(): void {
    if (!hasLocalStorage()) return;

    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(this.config.storagePrefix)
      );
      keys.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Failed to clear cache storage:', e);
    }
  }
}

/**
 * TR: URL ve parametrelerden benzersiz bir önbellek anahtarı üretir.
 * Parametreleri alfabetik sıralayarak tutarlılık sağlar.
 *
 * EN: Generates a unique cache key from URL and parameters.
 * Sorts parameters alphabetically to ensure consistency.
 */
export function createCacheKey(
  url: string,
  params?: Record<string, unknown>
): string {
  let key = url;
  
  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params)
      .sort()
      .map((k) => `${k}=${JSON.stringify(params[k])}`)
      .join('&');
    key += `?${sortedParams}`;
  }
  
  return key;
}

/**
 * TR: Metod sonuçlarını önbelleğe alan Decorator.
 * Sınıf metodlarının üzerine eklenerek (Annotation), sonucun otomatik cachelenmesini sağlar.
 *
 * EN: Decorator caching method results.
 * Added over class methods (Annotation), enabling automatic caching of the result.
 *
 * @param ttl - TR: Geçerlilik süresi. / EN: Time to live.
 */
export function Cached(ttl?: number) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    // TR: Her metod için izole bir cache instance'ı
    // EN: Isolated cache instance for each method
    const cache = new ApiCache({ defaultTTL: ttl });

    descriptor.value = async function (...args: unknown[]) {
      const key = `${propertyKey}:${JSON.stringify(args)}`;
      
      const cached = cache.get(key);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}

/** Singleton cache instance */
let globalCache: ApiCache | null = null;

/**
 * TR: Global, paylaşılan önbellek örneğini getirir veya oluşturur (Singleton).
 *
 * EN: Gets or creates the global, shared cache instance (Singleton).
 */
export function getGlobalCache(config?: CacheConfig): ApiCache {
  if (!globalCache) {
    globalCache = new ApiCache(config);
  }
  return globalCache;
}