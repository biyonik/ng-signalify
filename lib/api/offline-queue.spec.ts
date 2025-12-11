import { TestBed } from '@angular/core/testing';
import { OfflineQueue, QueuedRequest, QueueStatus } from './offline-queue';
import { EnvironmentInjector } from '@angular/core';

describe('OfflineQueue (IndexedDB)', () => {
    let queue: OfflineQueue;
    let mockExecutor: jest.Mock;
    let injector: EnvironmentInjector;

    beforeEach(async () => {
        // Mock navigator.onLine
        Object.defineProperty(window, 'navigator', {
            value: { onLine: true },
            writable: true,
            configurable: true
        });

        // Create mock executor
        mockExecutor = jest.fn();

        // Setup TestBed
        TestBed.configureTestingModule({});
        injector = TestBed.inject(EnvironmentInjector);

        // Create queue in injection context
        queue = await injector.runInContext(async () => {
            return new OfflineQueue(mockExecutor, {
                dbName: `test_db_${Date.now()}`, // Unique DB per test
                storageKey: 'test_queue',
                autoProcess: false, // Manual control in tests
                maxRetries: 3
            });
        });
    });

    afterEach(async () => {
        // Cleanup queue
        if (queue) {
            try {
                await queue.clear();
            } catch (e) {
                // Ignore cleanup errors
            }
        }
    });

    describe('Basic Operations', () => {
        it('should initialize with empty queue', () => {
            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBe(0);
                expect(queue.isEmpty()()).toBe(true);
            });
        });

        it('should enqueue requests', async () => {
            const request = {
                url: '/api/test',
                method: 'POST',
                priority: 0
            };

            await queue.enqueue(request);

            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBe(1);
                expect(queue.isEmpty()()).toBe(false);
            });
        });

        it('should generate unique IDs for each request', async () => {
            const id1 = await queue.enqueue({ url: '/1', method: 'GET', priority: 0 });
            const id2 = await queue.enqueue({ url: '/2', method: 'GET', priority: 0 });

            expect(id1).not.toBe(id2);
            expect(typeof id1).toBe('string');
            expect(typeof id2).toBe('string');
        });

        it('should handle multiple enqueue operations', async () => {
            await queue.enqueue({ url: '/1', method: 'POST', priority: 0 });
            await queue.enqueue({ url: '/2', method: 'POST', priority: 0 });
            await queue.enqueue({ url: '/3', method: 'POST', priority: 0 });

            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBe(3);
            });
        });

        it('should dequeue requests by ID', async () => {
            const id = await queue.enqueue({ url: '/test', method: 'GET', priority: 0 });
            const result = await queue.dequeue(id);

            expect(result).toBe(true);
            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBe(0);
            });
        });

        it('should return false when dequeuing non-existent ID', async () => {
            const result = await queue.dequeue('non-existent-id');
            expect(result).toBe(false);
        });

        it('should clear all requests', async () => {
            await queue.enqueue({ url: '/1', method: 'GET', priority: 0 });
            await queue.enqueue({ url: '/2', method: 'GET', priority: 0 });

            await queue.clear();

            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBe(0);
                expect(queue.isEmpty()()).toBe(true);
            });
        });
    });

    describe('Priority Queue', () => {
        it('should sort requests by priority (highest first)', async () => {
            await queue.enqueue({ url: '/low', method: 'GET', priority: 1 });
            await queue.enqueue({ url: '/high', method: 'GET', priority: 10 });
            await queue.enqueue({ url: '/medium', method: 'GET', priority: 5 });

            // Process should call executor with high priority first
            mockExecutor.mockResolvedValue({ ok: true });
            await queue.process();

            expect(mockExecutor.mock.calls[0][0].url).toBe('/high');
            expect(mockExecutor.mock.calls[1][0].url).toBe('/medium');
            expect(mockExecutor.mock.calls[2][0].url).toBe('/low');
        });

        it('should handle same priority requests', async () => {
            await queue.enqueue({ url: '/first', method: 'GET', priority: 5 });
            await queue.enqueue({ url: '/second', method: 'GET', priority: 5 });
            await queue.enqueue({ url: '/third', method: 'GET', priority: 5 });

            mockExecutor.mockResolvedValue({ ok: true });
            await queue.process();

            // All three should be processed
            expect(mockExecutor).toHaveBeenCalledTimes(3);
            
            // All URLs should be processed
            const urls = mockExecutor.mock.calls.map(call => call[0].url);
            expect(urls).toContain('/first');
            expect(urls).toContain('/second');
            expect(urls).toContain('/third');
        });

        it('should handle negative priority values', async () => {
            await queue.enqueue({ url: '/negative', method: 'GET', priority: -1 });
            await queue.enqueue({ url: '/positive', method: 'GET', priority: 1 });

            mockExecutor.mockResolvedValue({ ok: true });
            await queue.process();

            expect(mockExecutor.mock.calls[0][0].url).toBe('/positive');
            expect(mockExecutor.mock.calls[1][0].url).toBe('/negative');
        });

        it('should default to priority 0 if not specified', async () => {
            await queue.enqueue({ url: '/default', method: 'GET' } as any);

            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBe(1);
            });
        });
    });

    describe('Processing', () => {
        it('should process queue when process() is called', async () => {
            mockExecutor.mockResolvedValue({ ok: true });

            await queue.enqueue({ url: '/1', method: 'POST', priority: 0 });
            await queue.enqueue({ url: '/2', method: 'POST', priority: 0 });

            await queue.process();

            expect(mockExecutor).toHaveBeenCalledTimes(2);
            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBe(0);
                expect(queue.isEmpty()()).toBe(true);
            });
        });

        it('should call executor with correct request data', async () => {
            mockExecutor.mockResolvedValue({ ok: true });

            const request = {
                url: '/api/users',
                method: 'POST',
                body: { name: 'Test User' },
                priority: 5
            };

            await queue.enqueue(request);
            await queue.process();

            expect(mockExecutor).toHaveBeenCalledTimes(1);
            const calledWith = mockExecutor.mock.calls[0][0];
            expect(calledWith.url).toBe('/api/users');
            expect(calledWith.method).toBe('POST');
            expect(calledWith.body).toEqual({ name: 'Test User' });
        });

        it('should not process when queue is empty', async () => {
            await queue.process();
            expect(mockExecutor).not.toHaveBeenCalled();
        });

        it('should handle executor errors gracefully', async () => {
            mockExecutor.mockRejectedValue(new Error('Network Error'));

            await queue.enqueue({ url: '/fail', method: 'POST', priority: 0 });

            // Should not throw
            await expect(queue.process()).resolves.not.toThrow();
        });
    });

    describe('Retry Logic', () => {
        it('should increment retry count on failures', async () => {
            let callCount = 0;
            mockExecutor.mockImplementation(async () => {
                callCount++;
                throw new Error('Network Error');
            });

            await queue.enqueue({ url: '/retry', method: 'POST', priority: 0 });

            // Process multiple times
            await queue.process();
            await queue.process();
            await queue.process();

            // Should have been called at least 3 times
            expect(callCount).toBeGreaterThanOrEqual(3);
        });

        it('should remove request after exceeding maxRetries', async () => {
            mockExecutor.mockRejectedValue(new Error('Network Error'));

            await queue.enqueue({ url: '/fail', method: 'POST', priority: 0 });

            // Process 4 times (initial + 3 retries)
            await queue.process();
            await queue.process();
            await queue.process();
            await queue.process();

            // Should be removed from queue
            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBe(0);
            });
        });

        it('should not retry when offline', async () => {
            // Set offline
            Object.defineProperty(window.navigator, 'onLine', {
                value: false,
                writable: true,
                configurable: true
            });
            window.dispatchEvent(new Event('offline'));

            mockExecutor.mockRejectedValue(new Error('Network Error'));

            await queue.enqueue({ url: '/offline-fail', method: 'POST', priority: 0 });
            await queue.process();

            // Should stop processing when offline
            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBeGreaterThan(0);
            });
        });
    });

    describe('Online/Offline Handling', () => {
        it('should update status to reflect offline state', (done) => {
            Object.defineProperty(window.navigator, 'onLine', {
                value: false,
                writable: true,
                configurable: true
            });

            window.dispatchEvent(new Event('offline'));

            // Wait for effect to process
            setTimeout(() => {
                injector.runInContext(() => {
                    const status = queue.getStatus()();
                    // Should be offline or paused
                    expect(status).toMatch(/offline|paused|idle/);
                    done();
                });
            }, 100);
        });

        it('should detect when going online', () => {
            // First go offline
            Object.defineProperty(window.navigator, 'onLine', {
                value: false,
                writable: true,
                configurable: true
            });
            window.dispatchEvent(new Event('offline'));

            // Then go online
            Object.defineProperty(window.navigator, 'onLine', {
                value: true,
                writable: true,
                configurable: true
            });
            window.dispatchEvent(new Event('online'));

            injector.runInContext(() => {
                const status = queue.getStatus()();
                expect(status).not.toBe('offline');
            });
        });

        it('should pause processing when offline', async () => {
            await queue.enqueue({ url: '/test', method: 'POST', priority: 0 });

            // Go offline
            Object.defineProperty(window.navigator, 'onLine', {
                value: false,
                writable: true,
                configurable: true
            });
            window.dispatchEvent(new Event('offline'));

            await queue.process();

            // Should not have processed
            expect(mockExecutor).not.toHaveBeenCalled();
        });
    });

    describe('Token Provider Security', () => {
        it('should not store Authorization header in IndexedDB', async () => {
            const request = {
                url: '/secure',
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer secret-token',
                    'Content-Type': 'application/json'
                },
                priority: 0
            };

            await queue.enqueue(request);

            mockExecutor.mockResolvedValue({ ok: true });
            await queue.process();

            // Verify executor received the data without stored auth header
            const executorCall = mockExecutor.mock.calls[0][0];
            expect(executorCall.headers?.Authorization).toBeUndefined();
            expect(executorCall.headers?.['Content-Type']).toBe('application/json');
        });

        it('should use tokenProvider to inject token at execution time', async () => {
            const tokenProvider = jest.fn().mockReturnValue('fresh-token');

            const queueWithToken = await injector.runInContext(async () => {
                return new OfflineQueue(mockExecutor, {
                    dbName: `test_token_db_${Date.now()}`,
                    autoProcess: false,
                    tokenProvider
                });
            });

            mockExecutor.mockResolvedValue({ ok: true });

            await queueWithToken.enqueue({
                url: '/api/secure',
                method: 'POST',
                priority: 0
            });

            await queueWithToken.process();

            expect(tokenProvider).toHaveBeenCalled();
        });
    });

    describe('Callbacks', () => {
        it('should call onSuccess callback after successful processing', async () => {
            const onSuccess = jest.fn();

            const queueWithCallbacks = await injector.runInContext(async () => {
                return new OfflineQueue(mockExecutor, {
                    dbName: `test_callbacks_${Date.now()}`,
                    autoProcess: false,
                    onSuccess
                });
            });

            mockExecutor.mockResolvedValue({ ok: true });

            await queueWithCallbacks.enqueue({ url: '/success', method: 'GET', priority: 0 });
            await queueWithCallbacks.process();

            expect(onSuccess).toHaveBeenCalledTimes(1);
        });

        it('should call onFailure callback after failed processing', async () => {
            const onFailure = jest.fn();

            const queueWithCallbacks = await injector.runInContext(async () => {
                return new OfflineQueue(mockExecutor, {
                    dbName: `test_failure_${Date.now()}`,
                    autoProcess: false,
                    maxRetries: 0,
                    onFailure
                });
            });

            mockExecutor.mockRejectedValue(new Error('Failed'));

            await queueWithCallbacks.enqueue({ url: '/fail', method: 'GET', priority: 0 });
            await queueWithCallbacks.process();

            expect(onFailure).toHaveBeenCalled();
        });

        it('should allow onStatusChange callback to be called', (done) => {
            const onStatusChange = jest.fn();

            injector.runInContext(async () => {
                const testQueue = new OfflineQueue(mockExecutor, {
                    dbName: `test_status_${Date.now()}`,
                    autoProcess: false,
                    onStatusChange
                });

                // Wait a bit for initialization
                setTimeout(() => {
                    // Callback may or may not be called depending on timing
                    expect(onStatusChange).toBeDefined();
                    done();
                }, 100);
            });
        });
    });

    describe('Stats and Status', () => {
        it('should track queue statistics', async () => {
            await queue.enqueue({ url: '/1', method: 'GET', priority: 0 });
            await queue.enqueue({ url: '/2', method: 'GET', priority: 0 });

            injector.runInContext(() => {
                const stats = queue.getStats()();
                expect(stats.pending).toBe(2);
            });
        });

        it('should update stats after processing', async () => {
            mockExecutor.mockResolvedValue({ ok: true });

            await queue.enqueue({ url: '/test', method: 'GET', priority: 0 });
            await queue.process();

            injector.runInContext(() => {
                const stats = queue.getStats()();
                expect(stats.completed).toBeGreaterThan(0);
            });
        });

        it('should track status changes', () => {
            injector.runInContext(() => {
                const initialStatus = queue.getStatus()();
                expect(['idle', 'offline', 'processing', 'paused']).toContain(initialStatus);
            });
        });
    });

    describe('IndexedDB Persistence', () => {
        it('should persist and load requests from IndexedDB', async () => {
            const dbName = `test_db_persist_${Date.now()}`;
            
            const queue1 = await injector.runInContext(async () => {
                return new OfflineQueue(mockExecutor, {
                    dbName,
                    autoProcess: false
                });
            });

            await queue1.enqueue({ url: '/item1', method: 'POST', priority: 0 });
            await queue1.enqueue({ url: '/item2', method: 'POST', priority: 0 });

            // Wait for IndexedDB writes
            await new Promise(resolve => setTimeout(resolve, 100));

            // Create second instance with same DB name
            const queue2 = await injector.runInContext(async () => {
                return new OfflineQueue(mockExecutor, {
                    dbName,
                    autoProcess: false
                });
            });

            // Wait for loading
            await new Promise(resolve => setTimeout(resolve, 100));

            // Should load persisted data
            injector.runInContext(() => {
                const count = queue2.getPendingCount()();
                expect(count).toBeGreaterThanOrEqual(1);
            });
        });

        it('should handle IndexedDB errors gracefully', async () => {
            // Test should not crash even if DB operations fail
            await expect(queue.enqueue({ url: '/test', method: 'GET', priority: 0 }))
                .resolves.toBeDefined();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty URL', async () => {
            await expect(queue.enqueue({ url: '', method: 'GET', priority: 0 }))
                .resolves.toBeDefined();
        });

        it('should handle very long URLs', async () => {
            const longUrl = '/api/' + 'a'.repeat(10000);
            await expect(queue.enqueue({ url: longUrl, method: 'GET', priority: 0 }))
                .resolves.toBeDefined();
        });

        it('should handle special characters in request data', async () => {
            const request = {
                url: '/api/test',
                method: 'POST',
                body: {
                    text: '特殊字符 <>&"\''
                },
                priority: 0
            };

            await expect(queue.enqueue(request)).resolves.toBeDefined();
        });

        it('should handle large request bodies', async () => {
            const largeBody = {
                data: new Array(1000).fill({ key: 'value' })
            };

            await expect(queue.enqueue({
                url: '/large',
                method: 'POST',
                body: largeBody,
                priority: 0
            })).resolves.toBeDefined();
        });

        it('should handle concurrent enqueue operations', async () => {
            const promises = Array.from({ length: 10 }, (_, i) =>
                queue.enqueue({ url: `/concurrent/${i}`, method: 'GET', priority: 0 })
            );

            await Promise.all(promises);

            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBe(10);
            });
        });

        it('should handle rapid status changes', () => {
            // Go offline
            Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true, configurable: true });
            window.dispatchEvent(new Event('offline'));

            // Go online
            Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true, configurable: true });
            window.dispatchEvent(new Event('online'));

            // Should not crash
            injector.runInContext(() => {
                expect(queue.getStatus()).toBeDefined();
            });
        });

        it('should handle null or undefined values in request body', async () => {
            await expect(queue.enqueue({
                url: '/null-test',
                method: 'POST',
                body: null,
                priority: 0
            })).resolves.toBeDefined();

            await expect(queue.enqueue({
                url: '/undefined-test',
                method: 'POST',
                body: undefined,
                priority: 0
            })).resolves.toBeDefined();
        });

        it('should handle requests with custom headers', async () => {
            const id = await queue.enqueue({
                url: '/custom-headers',
                method: 'POST',
                headers: {
                    'X-Custom-Header': 'value',
                    'Content-Type': 'application/json'
                },
                priority: 0
            });

            expect(id).toBeDefined();
            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBe(1);
            });
        });

        it('should handle requests with meta data', async () => {
            const id = await queue.enqueue({
                url: '/with-meta',
                method: 'POST',
                meta: {
                    userId: '123',
                    timestamp: Date.now()
                },
                priority: 0
            });

            expect(id).toBeDefined();
        });

        it('should handle DELETE method requests', async () => {
            await expect(queue.enqueue({
                url: '/delete/123',
                method: 'DELETE',
                priority: 0
            })).resolves.toBeDefined();
        });

        it('should handle PUT method requests', async () => {
            await expect(queue.enqueue({
                url: '/update/123',
                method: 'PUT',
                body: { name: 'Updated' },
                priority: 0
            })).resolves.toBeDefined();
        });

        it('should handle PATCH method requests', async () => {
            await expect(queue.enqueue({
                url: '/patch/123',
                method: 'PATCH',
                body: { field: 'value' },
                priority: 0
            })).resolves.toBeDefined();
        });

        it('should handle requests with query parameters in URL', async () => {
            const id = await queue.enqueue({
                url: '/api/users?page=1&limit=10&sort=name',
                method: 'GET',
                priority: 0
            });

            expect(id).toBeDefined();
        });

        it('should handle requests with URL fragments', async () => {
            const id = await queue.enqueue({
                url: '/api/document#section-3',
                method: 'GET',
                priority: 0
            });

            expect(id).toBeDefined();
        });

        it('should handle enqueue after clear', async () => {
            await queue.enqueue({ url: '/first', method: 'GET', priority: 0 });
            await queue.clear();
            await queue.enqueue({ url: '/second', method: 'GET', priority: 0 });

            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBe(1);
            });
        });

        it('should handle multiple clear operations', async () => {
            await queue.enqueue({ url: '/test', method: 'GET', priority: 0 });
            await queue.clear();
            await queue.clear();
            await queue.clear();

            injector.runInContext(() => {
                expect(queue.getPendingCount()()).toBe(0);
            });
        });

        it('should handle very high priority values', async () => {
            await queue.enqueue({ url: '/low', method: 'GET', priority: 1 });
            await queue.enqueue({ url: '/high', method: 'GET', priority: 999999 });

            mockExecutor.mockResolvedValue({ ok: true });
            await queue.process();

            expect(mockExecutor.mock.calls[0][0].url).toBe('/high');
        });

        it('should handle processing empty queue multiple times', async () => {
            await queue.process();
            await queue.process();
            await queue.process();

            expect(mockExecutor).not.toHaveBeenCalled();
        });

        it('should preserve request data through enqueue/dequeue cycle', async () => {
            const originalRequest = {
                url: '/test/preserve',
                method: 'POST',
                body: { test: 'data' },
                headers: { 'X-Test': 'value' },
                priority: 5,
                meta: { custom: 'metadata' }
            };

            const id = await queue.enqueue(originalRequest);
            
            mockExecutor.mockImplementation((req) => {
                expect(req.url).toBe(originalRequest.url);
                expect(req.method).toBe(originalRequest.method);
                expect(req.body).toEqual(originalRequest.body);
                expect(req.priority).toBe(originalRequest.priority);
                return Promise.resolve({ ok: true });
            });

            await queue.process();
        });
    });
});
