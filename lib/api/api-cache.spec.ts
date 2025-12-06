import { ApiCache } from './api-cache';

describe('ApiCache (Infrastructure)', () => {
    let cache: ApiCache;

    beforeEach(() => {
        // Testler hızlı çalışsın diye TTL'i kısa tutuyoruz (varsayılanı ezerek)
        cache = new ApiCache({
            defaultTTL: 1000, // 1 saniye
            maxEntries: 50
        });
    });

    it('should store and retrieve values', () => {
        const key = 'user_1';
        const data = { name: 'Ahmet' };

        cache.set(key, data);
        const result = cache.get(key);

        expect(result).toEqual(data);
        expect(cache.has(key)).toBe(true);
    });

    it('should return null for non-existent keys', () => {
        expect(cache.get('olmayan_key')).toBeNull();
    });

    it('should expire items after TTL', (done) => {
        const key = 'short_lived';
        // 100ms ömürlü veri
        cache.set(key, 'value', 100);

        // Hemen kontrol et
        expect(cache.get(key)).toBe('value');

        // 150ms sonra kontrol et (Süresi dolmuş olmalı)
        setTimeout(() => {
            expect(cache.get(key)).toBeNull();
            done(); // Asenkron test bitti
        }, 150);
    });

    it('should clear all cache', () => {
        cache.set('k1', 'v1');
        cache.set('k2', 'v2');

        cache.clear();

        expect(cache.has('k1')).toBe(false);
        expect(cache.getStats()().entries).toBe(0);
    });

    it('should remove specific item', () => {
        cache.set('k1', 'v1');
        cache.delete('k1');
        expect(cache.has('k1')).toBe(false);
    });
});