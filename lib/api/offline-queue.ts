import {computed, effect, Signal, signal} from '@angular/core';

/**
 * TR: Kuyruğa alınan isteğin veri yapısı.
 * İsteğin yeniden oluşturulması için gerekli tüm HTTP bilgilerini (URL, Method, Body)
 * ve yönetimsel verileri (Öncelik, Deneme Sayısı) içerir.
 *
 * EN: Data structure of the queued request.
 * Contains all HTTP information (URL, Method, Body) required to reconstruct the request
 * and administrative data (Priority, Retry Count).
 */
export interface QueuedRequest {
    id: string;
    method: string;
    url: string;
    body?: unknown;
    headers?: Record<string, string>;
    /**
     * TR: Oluşturulma zamanı (Sıralama için).
     *
     * EN: Creation time (For sorting).
     */
    createdAt: number;
    /**
     * TR: Şu ana kadar yapılan başarısız deneme sayısı.
     *
     * EN: Number of failed attempts so far.
     */
    retries: number;
    /**
     * TR: İşlem önceliği (Yüksek sayı = Yüksek öncelik).
     *
     * EN: Processing priority (Higher number = Higher priority).
     */
    priority: number;
    /**
     * TR: İsteğe eklenen özel meta veriler.
     *
     * EN: Custom metadata attached to the request.
     */
    meta?: Record<string, unknown>;
}

/**
 * TR: Kuyruk yöneticisinin anlık durumu.
 *
 * EN: Instant status of the queue manager.
 */
export type QueueStatus = 'idle' | 'processing' | 'paused' | 'offline';

/**
 * TR: Çevrimdışı kuyruk yapılandırması.
 * Depolama anahtarı, yeniden deneme politikaları ve işleme stratejilerini (FIFO/Priority) belirler.
 *
 * EN: Offline queue configuration.
 * Determines storage key, retry policies, and processing strategies (FIFO/Priority).
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface OfflineQueueConfig {
    /**
     * TR: LocalStorage anahtarı. Varsayılan: 'offline_queue'.
     *
     * EN: LocalStorage key. Default: 'offline_queue'.
     */
    storageKey?: string;

    /**
     * TR: İstek başına maksimum yeniden deneme sayısı.
     *
     * EN: Maximum retries per request.
     */
    maxRetries?: number;

    /**
     * TR: İlk giren ilk çıkar (FIFO) mantığı kullanılsın mı?
     * False ise `priority` değerine göre sıralama yapılır.
     *
     * EN: Whether to use First-In-First-Out (FIFO) logic.
     * If false, sorting is done based on `priority` value.
     */
    fifo?: boolean;

    /**
     * TR: İnternet bağlantısı geldiğinde otomatik işleme başlasın mı?
     *
     * EN: Whether to start processing automatically when internet connection is restored.
     */
    autoProcess?: boolean;

    /**
     * TR: Başarılı işlem sonrası tetiklenen callback.
     *
     * EN: Callback triggered after successful operation.
     */
    onSuccess?: (request: QueuedRequest, response: unknown) => void;

    /**
     * TR: Başarısız işlem sonrası tetiklenen callback.
     *
     * EN: Callback triggered after failed operation.
     */
    onFailure?: (request: QueuedRequest, error: unknown) => void;

    /**
     * TR: Durum değişikliğinde tetiklenen callback.
     *
     * EN: Callback triggered on status change.
     */
    onStatusChange?: (status: QueueStatus) => void;
}

/**
 * TR: Kuyruk istatistikleri.
 * UI tarafında senkronizasyon durumu göstermek için kullanılır (Örn: "3 istek kuyrukta").
 *
 * EN: Queue statistics.
 * Used to show synchronization status on the UI side (E.g., "3 requests in queue").
 */
export interface QueueStats {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
}

/**
 * TR: Çevrimdışı İstek Kuyruğu Yöneticisi.
 * İnternet bağlantısı olmadığında istekleri yakalar, LocalStorage'da saklar ve
 * bağlantı sağlandığında (Backoff stratejisiyle) sunucuya iletir.
 * "Store-and-Forward" mimarisini uygular.
 *
 * EN: Offline Request Queue Manager.
 * Captures requests when there is no internet connection, stores them in LocalStorage,
 * and forwards them to the server (with Backoff strategy) when connection is restored.
 * Implements "Store-and-Forward" architecture.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class OfflineQueue {
    private queue = signal<QueuedRequest[]>([]);
    private status = signal<QueueStatus>('idle');
    private stats = signal<QueueStats>({
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
    });

    private config: Required<OfflineQueueConfig>;
    private isOnline = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);
    private processingIds = new Set<string>();

    /**
     * TR: OfflineQueue sınıfını başlatır.
     * Tarayıcı online/offline olaylarını dinler ve otomatik senkronizasyonu yönetir.
     *
     * EN: Initializes the OfflineQueue class.
     * Listens to browser online/offline events and manages automatic synchronization.
     *
     * @param executor - TR: İsteği gerçekten sunucuya ileten fonksiyon (fetch, axios vb.). / EN: Function that actually forwards the request to the server (fetch, axios, etc.).
     * @param config - TR: Kuyruk ayarları. / EN: Queue settings.
     */
    constructor(
        private executor: (request: QueuedRequest) => Promise<unknown>,
        config: OfflineQueueConfig = {}
    ) {
        this.config = {
            storageKey: config.storageKey ?? 'offline_queue',
            maxRetries: config.maxRetries ?? 3,
            fifo: config.fifo ?? true,
            autoProcess: config.autoProcess ?? true,
            onSuccess: config.onSuccess ?? (() => {
            }),
            onFailure: config.onFailure ?? (() => {
            }),
            onStatusChange: config.onStatusChange ?? (() => {
            }),
        };

        // Load persisted queue
        this.loadFromStorage();

        // Listen for online/offline events
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => this.handleOffline());
        }

        // TR: Online durumuna göre kuyruk durumunu güncelle (Effect)
        // EN: Update queue status based on online state (Effect)


        effect(() => {
            queueMicrotask(() => {
                if (!this.isOnline()) {
                    this.setStatus('offline');
                } else if (this.status() === 'offline') {
                    this.setStatus('idle');
                    if (this.config.autoProcess) {
                        this.process();
                    }
                }
            });
        });
    }


    /**
     * TR: İsteği kuyruğa ekler ve kalıcı hafızaya yazar.
     * Öncelik ayarlarına göre kuyruğu yeniden sıralar.
     *
     * EN: Adds the request to the queue and writes to persistent storage.
     * Resorts the queue based on priority settings.
     *
     * @param request - TR: Kuyruklanacak istek verisi. / EN: Request data to be queued.
     * @returns TR: Oluşturulan istek ID'si. / EN: Generated request ID.
     */
    enqueue(request: Omit<QueuedRequest, 'id' | 'createdAt' | 'retries'>): string {
        const id = this.generateId();

        const queuedRequest: QueuedRequest = {
            ...request,
            id,
            createdAt: Date.now(),
            retries: 0,
            priority: request.priority ?? 0,
        };

        this.queue.update((q) => {
            const newQueue = [...q, queuedRequest];

            // TR: FIFO değilse önceliğe göre sırala (Yüksek öncelik üstte)
            // EN: Sort by priority if not FIFO (Higher priority on top)
            if (!this.config.fifo) {
                newQueue.sort((a, b) => {
                    if (a.priority !== b.priority) {
                        return b.priority - a.priority;
                    }
                    return a.createdAt - b.createdAt;
                });
            }

            return newQueue;
        });

        this.updateStats();
        this.saveToStorage();

        // Auto process if online
        if (this.isOnline() && this.config.autoProcess && this.status() === 'idle') {
            this.process();
        }

        return id;
    }

    /**
     * TR: İsteği kuyruktan çıkarır.
     *
     * EN: Removes the request from the queue.
     */
    dequeue(id: string): boolean {
        const found = this.queue().some((r) => r.id === id);

        if (found) {
            this.queue.update((q) => q.filter((r) => r.id !== id));
            this.updateStats();
            this.saveToStorage();
        }

        return found;
    }

    /**
     * TR: Kuyruktaki istekleri işlemeye başlar (Boşaltma / Drain).
     * Sırayla (Sequential) işler, bağlantı koparsa durur.
     *
     * EN: Starts processing requests in the queue (Drain).
     * Processes sequentially, stops if connection is lost.
     */
    async process(): Promise<void> {
        if (this.status() === 'processing' || this.status() === 'paused') {
            return;
        }

        if (!this.isOnline()) {
            this.setStatus('offline');
            return;
        }

        const pending = this.queue().filter((r) => !this.processingIds.has(r.id));

        if (pending.length === 0) {
            this.setStatus('idle');
            return;
        }

        this.setStatus('processing');

        for (const request of pending) {
            // TR: Döngü sırasında bağlantı koparsa dur
            // EN: Stop if connection is lost during loop
            if (this.status() === 'paused' || !this.isOnline()) {
                break;
            }

            await this.processRequest(request);
        }

        // Check if more requests to process
        const remaining = this.queue().filter((r) => !this.processingIds.has(r.id));

        if (remaining.length > 0 && this.isOnline() && this.status() !== 'paused') {
            await this.process(); // Recursive drain
        } else {
            this.setStatus('idle');
        }
    }

    /**
     * TR: Tek bir isteği işlemeye çalışır.
     * Başarılı olursa kuyruktan siler, başarısız olursa 'retries' sayısını artırır.
     * Max deneme sayısına ulaşan istekler kuyruktan atılır (Dead Letter).
     *
     * EN: Attempts to process a single request.
     * Deletes from queue if successful, increments 'retries' count if failed.
     * Requests reaching max retry count are dropped (Dead Letter).
     */
    private async processRequest(request: QueuedRequest): Promise<void> {
        this.processingIds.add(request.id);
        this.updateStats();

        try {
            const response = await this.executor(request);

            // Success - remove from queue
            this.dequeue(request.id);
            this.stats.update((s) => ({...s, completed: s.completed + 1}));
            this.config.onSuccess(request, response);
        } catch (error) {
            // Failure - retry or remove
            const updatedRequest = {...request, retries: request.retries + 1};

            if (updatedRequest.retries >= this.config.maxRetries) {
                // Max retries reached - remove from queue
                this.dequeue(request.id);
                this.stats.update((s) => ({...s, failed: s.failed + 1}));
                this.config.onFailure(request, error);
            } else {
                // Update retry count
                this.queue.update((q) =>
                    q.map((r) => (r.id === request.id ? updatedRequest : r))
                );
                this.saveToStorage();
            }
        } finally {
            this.processingIds.delete(request.id);
            this.updateStats();
        }
    }

    /**
     * TR: İşlemeyi geçici olarak durdurur.
     *
     * EN: Temporarily pauses processing.
     */
    pause(): void {
        if (this.status() === 'processing') {
            this.setStatus('paused');
        }
    }

    /**
     * TR: İşlemeyi tekrar başlatır.
     *
     * EN: Resumes processing.
     */
    resume(): void {
        if (this.status() === 'paused') {
            this.setStatus('idle');
            this.process();
        }
    }

    /**
     * TR: Kuyruğu tamamen temizler (Storage dahil).
     *
     * EN: Clears the queue completely (Including Storage).
     */
    clear(): void {
        this.queue.set([]);
        this.processingIds.clear();
        this.updateStats();
        this.saveToStorage();
    }

    // ... Getters ...

    getStatus(): Signal<QueueStatus> {
        return this.status.asReadonly();
    }

    getQueue(): Signal<QueuedRequest[]> {
        return this.queue.asReadonly();
    }

    getStats(): Signal<QueueStats> {
        return this.stats.asReadonly();
    }

    getOnlineStatus(): Signal<boolean> {
        return this.isOnline.asReadonly();
    }

    getPendingCount(): Signal<number> {
        return computed(() => this.queue().length);
    }

    isEmpty(): Signal<boolean> {
        return computed(() => this.queue().length === 0);
    }

    // Private methods

    private handleOnline(): void {
        this.isOnline.set(true);
    }

    private handleOffline(): void {
        this.isOnline.set(false);
    }

    private setStatus(status: QueueStatus): void {
        if (this.status() !== status) {
            this.status.set(status);
            this.config.onStatusChange(status);
        }
    }

    private updateStats(): void {
        this.stats.update((s) => ({
            ...s,
            pending: this.queue().length,
            processing: this.processingIds.size,
        }));
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private loadFromStorage(): void {
        if (typeof localStorage === 'undefined') return;

        try {
            const raw = localStorage.getItem(this.config.storageKey);
            if (raw) {
                const data = JSON.parse(raw) as QueuedRequest[];
                this.queue.set(data);
                this.updateStats();
            }
        } catch (e) {
            console.warn('Failed to load offline queue from storage:', e);
        }
    }

    private saveToStorage(): void {
        if (typeof localStorage === 'undefined') return;

        try {
            localStorage.setItem(this.config.storageKey, JSON.stringify(this.queue()));
        } catch (e) {
            console.warn('Failed to save offline queue to storage:', e);
        }
    }
}

/**
 * TR: Standart `fetch` fonksiyonunu sarmalayarak (Wrapper) çevrimdışı yeteneği kazandırır.
 * İnternet yoksa veya istek başarısız olursa (Network Error), isteği otomatik olarak kuyruğa atar.
 * Bu durumda "202 Accepted" (İşleme alındı) durum kodlu yapay bir yanıt döner.
 *
 * EN: Wraps the standard `fetch` function to provide offline capability.
 * If offline or request fails (Network Error), automatically queues the request.
 * In this case, returns a synthetic response with status code "202 Accepted".
 *
 * @param queue - TR: Kullanılacak kuyruk örneği. / EN: Queue instance to use.
 * @param options - TR: Hangi metodların kuyruklanacağı ayarı. / EN: Setting for which methods to queue.
 */
export function createOfflineFetch(
    queue: OfflineQueue,
    options: {
        queueMethods?: string[];
        isOfflineError?: (error: unknown) => boolean;
    } = {}
) {
    const {
        queueMethods = ['POST', 'PUT', 'PATCH', 'DELETE'],
        isOfflineError = (e) => e instanceof TypeError && (e as TypeError).message === 'Failed to fetch',
    } = options;

    return async function offlineFetch(
        url: string,
        init?: RequestInit
    ): Promise<Response> {
        const method = init?.method ?? 'GET';
        const shouldQueue = queueMethods.includes(method.toUpperCase());

        try {
            return await fetch(url, init);
        } catch (error) {
            if (shouldQueue && isOfflineError(error)) {
                // Queue the request
                queue.enqueue({
                    method,
                    url,
                    body: init?.body ? JSON.parse(init.body as string) : undefined,
                    headers: init?.headers as Record<string, string>,
                    priority: 0,
                });

                // TR: Yapay başarılı yanıt döndür (Background Sync mantığı)
                // EN: Return synthetic success response (Background Sync logic)
                return new Response(JSON.stringify({queued: true}), {
                    status: 202,
                    headers: {'Content-Type': 'application/json'},
                });
            }
            throw error;
        }
    };
}

/**
 * TR: Çevrimdışı/Çevrimiçi durumunu takip eden hook/fonksiyon.
 *
 * EN: Hook/function tracking Offline/Online status.
 */
export function useOnlineStatus(): Signal<boolean> {
    const isOnline = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);

    if (typeof window !== 'undefined') {
        window.addEventListener('online', () => isOnline.set(true));
        window.addEventListener('offline', () => isOnline.set(false));
    }

    return isOnline.asReadonly();
}