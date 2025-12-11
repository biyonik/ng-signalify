import { TestBed } from '@angular/core/testing';
import { OfflineQueue } from './offline-queue';
import { EnvironmentInjector } from '@angular/core';

describe('OfflineQueue (Expert)', () => {
    let queue: OfflineQueue;
    let mockExecutor: jest.Mock;
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
        // 1. LocalStorage Mock
        mockStorage = {};
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key) => mockStorage[key] || null),
                setItem: jest.fn((key, val) => { mockStorage[key] = val; }),
                removeItem: jest.fn((key) => { delete mockStorage[key]; }),
                clear: jest.fn(() => { mockStorage = {}; })
            },
            writable: true
        });

        // 2. Navigator Mock (Online durumu için)
        Object.defineProperty(window, 'navigator', {
            value: { onLine: true },
            writable: true
        });

        // 3. Executor
        mockExecutor = jest.fn();

        // 4. TestBed & Injection Context
        TestBed.configureTestingModule({});
        const injector = TestBed.inject(EnvironmentInjector);

        // Class'ı injection context içinde başlatıyoruz
        queue = injector.runInContext(() => {
            return new OfflineQueue(mockExecutor, {
                storageKey: 'test_queue',
                autoProcess: false // <--- DÜZELTME: Otomatik işlemeyi kapattık, kontrol bizde.
            });
        });
    });

    it('should enqueue requests when offline', () => {
        // Priority zorunlu olduğu için ekliyoruz
        const request = {
            url: '/api/test',
            method: 'POST',
            priority: 0
        };

        queue.enqueue(request);

        // Signal değerini okumak için () kullandık
        expect(queue.getPendingCount()()).toBe(1);
        expect(window.localStorage.setItem).toHaveBeenCalled();

        const stored = JSON.parse(mockStorage['test_queue']);
        expect(stored).toHaveLength(1);
        expect(stored[0].url).toBe('/api/test');
    });

    it('should process queue when process() is called', async () => {
        mockExecutor.mockResolvedValue({ ok: true });

        queue.enqueue({ url: '/1', method: 'POST', priority: 0 });
        queue.enqueue({ url: '/2', method: 'POST', priority: 0 });

        await queue.process();

        expect(mockExecutor).toHaveBeenCalledTimes(2);
        expect(queue.getPendingCount()()).toBe(0);
        expect(queue.isEmpty()()).toBe(true);
    });

    it('should handle failed processing (Retry Logic)', async () => {
        // Senaryo: İstek atılırken hata oluşsun ve o an internet kopsun.
        // Bu sayede "Retry count artsın ama işlem dursun (Pending kalsın)" durumunu test edebiliriz.

        mockExecutor.mockImplementation(async () => {
            // 1. İnterneti kes (Process döngüsünü kırmak için)
            window.dispatchEvent(new Event('offline'));
            // 2. Hata fırlat
            throw new Error('Network Error');
        });

        queue.enqueue({ url: '/fail', method: 'POST', priority: 0 });

        await queue.process();

        // Hata aldığı için retry artmalı ama offline olduğu için silinmemeli
        expect(queue.getPendingCount()()).toBe(1);

        const stored = JSON.parse(mockStorage['test_queue']);
        // İlk deneme yapıldı (retries: 0 -> 1 oldu)
        expect(stored[0].retries).toBe(1);

        // Executor sadece 1 kere çağrılmış olmalı (Döngü kırıldı)
        expect(mockExecutor).toHaveBeenCalledTimes(1);
    });

    it('should load initial state from storage', () => {
        // Storage'ı önceden doldur
        mockStorage['test_queue'] = JSON.stringify([
            { id: 'old', url: '/old', method: 'GET', priority: 0, createdAt: Date.now(), retries: 0 }
        ]);

        const injector = TestBed.inject(EnvironmentInjector);
        const newQueue = injector.runInContext(() =>
            new OfflineQueue(mockExecutor, {
                storageKey: 'test_queue',
                autoProcess: false
            })
        );

        expect(newQueue.getPendingCount()()).toBe(1);
    });
});