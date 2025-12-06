import { retryWithBackoff, CircuitBreaker } from './retry-handler';

describe('RetryHandler & Strategies', () => {
    // Retry testleri için Real Timers kullanıyoruz (Promise zincirini kırmamak için)

    describe('retryWithBackoff', () => {
        it('should resolve immediately if successful', async () => {
            const mockFn = jest.fn().mockResolvedValue('success');

            const result = await retryWithBackoff(mockFn, { maxRetries: 3 });

            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should retry specified times and fail', async () => {
            const mockFn = jest.fn().mockRejectedValue(new Error('Network Error'));

            const promise = retryWithBackoff(mockFn, {
                maxRetries: 3,
                initialDelay: 5, // Çok hızlı çalışsın
                backoffMultiplier: 1,
                // KRİTİK DÜZELTME: Jenerik hataların da tekrar denenmesini sağlıyoruz
                shouldRetry: () => true
            });

            // 1 İlk + 3 Tekrar = 4 Çağrı
            await expect(promise).rejects.toThrow('Network Error');
            expect(mockFn).toHaveBeenCalledTimes(4);
        });

        it('should succeed after N retries', async () => {
            const mockFn = jest.fn()
                .mockRejectedValueOnce(new Error('Fail 1'))
                .mockRejectedValueOnce(new Error('Fail 2'))
                .mockResolvedValue('Success');

            const result = await retryWithBackoff(mockFn, {
                maxRetries: 3,
                initialDelay: 5,
                backoffMultiplier: 1,
                shouldRetry: () => true // KRİTİK DÜZELTME
            });

            expect(result).toBe('Success');
            expect(mockFn).toHaveBeenCalledTimes(3); // 2 Hata + 1 Başarı
        });
    });

    describe('CircuitBreaker', () => {
        // CircuitBreaker zaman aşımı kontrolleri için Fake Timers şart
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should open circuit after threshold failures', async () => {
            const breaker = new CircuitBreaker({
                failureThreshold: 3,
                resetTimeout: 5000
            });

            const mockFn = jest.fn().mockRejectedValue(new Error('Fail'));

            // 3 Kez Hata Alalım
            try { await breaker.execute(mockFn); } catch {}
            try { await breaker.execute(mockFn); } catch {}
            try { await breaker.execute(mockFn); } catch {}

            // Devre AÇIK (OPEN) olmalı
            // DÜZELTME: Signal değerini okumak için () ekledik
            expect(breaker.getState()()).toBe('open');

            // 4. İstek -> Mock fonksiyonu çağırmadan direkt hata fırlatmalı
            await expect(breaker.execute(mockFn)).rejects.toThrow(/Circuit breaker is open/);

            // Toplam 3 çağrı yapılmış olmalı (4. çağrı engellendi)
            expect(mockFn).toHaveBeenCalledTimes(3);
        });

        it('should attempt reset (Half-Open) after timeout', async () => {
            const breaker = new CircuitBreaker({
                failureThreshold: 1,
                successThreshold: 1, // Tek başarıda kapansın
                resetTimeout: 1000
            });

            // 1. Fail -> Open
            try { await breaker.execute(jest.fn().mockRejectedValue('Fail')); } catch {}

            expect(breaker.getState()()).toBe('open');

            // 2. Zamanı ileri sar (Timeout doldu)
            jest.advanceTimersByTime(1100);

            // 3. Başarılı İstek (Half-Open -> Closed)
            const successFn = jest.fn().mockResolvedValue('Success');
            await breaker.execute(successFn);

            // Başarılı olduğu için Closed'a dönmeli
            expect(breaker.getState()()).toBe('closed');
        });
    });
});