import {computed, effect, Signal, signal} from '@angular/core';
import {openDB, DBSchema, IDBPDatabase} from 'idb';

/**
 * TR: IndexedDB veritabanı şeması.
 * Kuyruk isteklerini ve indekslerini tanımlar.
 *
 * EN: IndexedDB database schema.
 * Defines queue requests and indexes.
 */
interface OfflineDB extends DBSchema {
    requests: {
        key: string;
        value: QueuedRequest;
        indexes: { 'by-priority': number };
    };
}

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
 * Veritabanı adı, güvenlik politikaları (Token Provider) ve yeniden deneme ayarlarını içerir.
 *
 * EN: Offline queue configuration.
 * Includes database name, security policies (Token Provider), and retry settings.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface OfflineQueueConfig {
    /**
     * TR: IndexedDB veritabanı adı. Varsayılan: 'ng-signalify-db'.
     *
     * EN: IndexedDB database name. Default: 'ng-signalify-db'.
     */
    dbName?: string;

    /**
     * TR: IndexedDB storage anahtarı.
     *
     * EN: IndexedDB storage key.
     */
    storageKey?: string;

    /**
     * TR: İstek başına maksimum yeniden deneme sayısı.
     *
     * EN: Maximum retries per request.
     */
    maxRetries?: number;

    /**
     * TR: İnternet bağlantısı geldiğinde otomatik işleme başlasın mı?
     *
     * EN: Whether to start processing automatically when internet connection is restored.
     */
    autoProcess?: boolean;

    /**
     * TR: İstek işlenmeden hemen önce güncel token'ı sağlayan fonksiyon.
     * Güvenlik için token veritabanında saklanmaz, buradan dinamik alınır.
     *
     * EN: Function providing the current token just before request processing.
     * For security, token is not stored in DB, retrieved dynamically from here.
     */
    tokenProvider?: () => string | Promise<string>;

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
 * UI tarafında senkronizasyon durumu göstermek için kullanılır.
 *
 * EN: Queue statistics.
 * Used to show synchronization status on the UI side.
 */
export interface QueueStats {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
}

/**
 * TR: Çevrimdışı İstek Kuyruğu Yöneticisi (IndexedDB Destekli).
 * İnternet bağlantısı olmadığında istekleri yakalar, IndexedDB'de güvenli bir şekilde saklar.
 * "Store-and-Forward" mimarisini uygular ve token güvenliğini sağlar.
 *
 * EN: Offline Request Queue Manager (IndexedDB Supported).
 * Captures requests when offline, securely stores them in IndexedDB.
 * Implements "Store-and-Forward" architecture and ensures token security.
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
    private dbPromise: Promise<IDBPDatabase<OfflineDB>>;

    /**
     * TR: OfflineQueue sınıfını başlatır.
     * Tarayıcı online/offline olaylarını dinler ve IndexedDB bağlantısını kurar.
     *
     * EN: Initializes the OfflineQueue class.
     * Listens to browser online/offline events and establishes IndexedDB connection.
     *
     * @param executor - TR: İsteği gerçekten sunucuya ileten fonksiyon. / EN: Function that actually forwards the request to the server.
     * @param config - TR: Kuyruk ayarları. / EN: Queue settings.
     */
    constructor(
        private executor: (request: QueuedRequest) => Promise<unknown>,
        config: OfflineQueueConfig = {}
    ) {
        this.config = {
            dbName: config.dbName ?? 'ng-signalify-db',
            storageKey: config.storageKey ?? 'ng-signalify-queue',
            maxRetries: config.maxRetries ?? 3,
            autoProcess: config.autoProcess ?? true,
            tokenProvider: config.tokenProvider ?? (() => ''),
            onSuccess: config.onSuccess ?? (() => {}),
            onFailure: config.onFailure ?? (() => {}),
            onStatusChange: config.onStatusChange ?? (() => {}),
        };

        // TR: Veritabanını başlat (Schema Upgrade dahil)
        // EN: Initialize database (Including Schema Upgrade)
        this.dbPromise = openDB<OfflineDB>(this.config.dbName, 1, {
            upgrade(db) {
                const store = db.createObjectStore('requests', { keyPath: 'id' });
                store.createIndex('by-priority', 'priority');
            },
        });

        // TR: Kayıtlı kuyruğu yükle
        // EN: Load persisted queue
        this.loadFromStorage();

        // Listen for online/offline events
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.handleOnline());
            window.addEventListener('offline', () => this.handleOffline());
        }

        // TR: Online durumuna göre kuyruk durumunu güncelle (Effect)
        // EN: Update queue status based on online state (Effect)
        effect(() => {
            // TR: Microtask kullanarak change detection döngüsünü kırma
            // EN: Breaking change detection loop using Microtask
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
     * TR: İsteği kuyruğa ekler ve IndexedDB'ye yazar.
     * GÜVENLİK: Authorization header'ını veritabanına yazmadan önce temizler.
     *
     * EN: Adds the request to the queue and writes to IndexedDB.
     * SECURITY: Cleans the Authorization header before writing to the database.
     *
     * @param request - TR: Kuyruklanacak istek verisi. / EN: Request data to be queued.
     * @returns TR: Oluşturulan istek ID'si. / EN: Generated request ID.
     */
    async enqueue(request: Omit<QueuedRequest, 'id' | 'createdAt' | 'retries'>): Promise<string> {
        const id = this.generateId();

        // TR: Güvenlik için Auth header'ı temizle
        // EN: Clean Auth header for security
        const safeHeaders = { ...request.headers };
        if (safeHeaders['Authorization']) {
            delete safeHeaders['Authorization'];
        }

        const queuedRequest: QueuedRequest = {
            ...request,
            headers: safeHeaders,
            id,
            createdAt: Date.now(),
            retries: 0,
            priority: request.priority ?? 0,
        };

        // TR: Veritabanına asenkron yaz
        // EN: Write asynchronously to database
        const db = await this.dbPromise;
        await db.put('requests', queuedRequest);

        // TR: UI state'i güncelle
        // EN: Update UI state
        this.queue.update((q) => {
            const newQueue = [...q, queuedRequest];
            return newQueue.sort((a, b) => b.priority - a.priority);
        });

        this.updateStats();

        // Auto process if online
        if (this.isOnline() && this.config.autoProcess && this.status() === 'idle') {
            this.process();
        }

        return id;
    }

    /**
     * TR: İsteği kuyruktan ve veritabanından çıkarır.
     *
     * EN: Removes the request from the queue and database.
     */
    async dequeue(id: string): Promise<boolean> {
        const db = await this.dbPromise;
        const exists = (await db.get('requests', id)) !== undefined;

        if (exists) {
            await db.delete('requests', id);
            this.queue.update((q) => q.filter((r) => r.id !== id));
            this.updateStats();
        }

        return exists;
    }

    /**
     * TR: Kuyruktaki istekleri işlemeye başlar (Boşaltma / Drain).
     * IndexedDB'den önceliğe göre veri çeker ve işler.
     *
     * EN: Starts processing requests in the queue (Drain).
     * Fetches data from IndexedDB by priority and processes it.
     */
    async process(): Promise<void> {
        if (this.status() === 'processing' || this.status() === 'paused') {
            return;
        }

        if (!this.isOnline()) {
            this.setStatus('offline');
            return;
        }

        this.setStatus('processing');

        const db = await this.dbPromise;

        // TR: İşlem tutarlılığı için Transaction başlat
        // EN: Start Transaction for process consistency
        const tx = db.transaction('requests', 'readwrite');
        const index = tx.store.index('by-priority');

        // TR: Tüm bekleyen işleri al ve önceliğe göre sırala (IndexedDB varsayılan artan sıralar)
        // EN: Get all pending jobs and sort by priority (IndexedDB defaults to ascending)
        let pendingRequests = await index.getAll();
        pendingRequests = pendingRequests.reverse();

        if (pendingRequests.length === 0) {
            this.setStatus('idle');
            return;
        }

        for (const request of pendingRequests) {
            // TR: Döngü sırasında bağlantı koparsa dur
            // EN: Stop if connection is lost during loop
            if (this.status() === 'paused' || !this.isOnline()) {
                break;
            }

            // TR: Zaten işleniyorsa atla
            // EN: Skip if already processing
            if (this.processingIds.has(request.id)) {
                continue;
            }

            await this.processRequest(request, db);
        }

        this.setStatus('idle');
    }

    /**
     * TR: Tek bir isteği işlemeye çalışır.
     * Token Provider'dan taze token alır ve isteğe enjekte eder.
     *
     * EN: Attempts to process a single request.
     * Gets fresh token from Token Provider and injects into request.
     */
    private async processRequest(request: QueuedRequest, db: IDBPDatabase<OfflineDB>): Promise<void> {
        this.processingIds.add(request.id);
        this.updateStats();

        try {
            // TR: Güvenlik Adımı: Güncel token'ı al
            // EN: Security Step: Get fresh token
            const token = await Promise.resolve(this.config.tokenProvider());

            // TR: İsteği zenginleştir (Token Injection)
            // EN: Enrich request (Token Injection)
            const enrichedRequest = {
                ...request,
                headers: {
                    ...request.headers,
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            };

            const response = await this.executor(enrichedRequest);

            // TR: Başarılı - DB'den ve State'den sil
            // EN: Success - Remove from DB and State
            await db.delete('requests', request.id);
            this.queue.update(q => q.filter(r => r.id !== request.id));

            this.stats.update((s) => ({...s, completed: s.completed + 1}));
            this.config.onSuccess(request, response);

        } catch (error) {
            // TR: Hata Yönetimi - Yeniden dene veya sil
            // EN: Error Handling - Retry or delete
            const nextRetries = request.retries + 1;

            // TR: Kritik hata kontrolü
            // 4xx hatalar (408 Request Timeout hariç) kalıcı hatalardır ve retry edilmemeli.
            // 408 ağ kaynaklı olabilir, retry edilebilir.
            // 5xx hatalar sunucu kaynaklı olup retry edilebilir.
            //
            // EN: Critical error check
            // 4xx errors (except 408 Request Timeout) are permanent and should not be retried.
            // 408 can be network-related, retryable.
            // 5xx errors are server-side and can be retried.
            let isFatalError = false;
            if (error instanceof Response) {
                const status = error.status;
                // TR: 4xx hatalar (400-499) fatal, ancak 408 (Request Timeout) hariç
                // EN: 4xx errors (400-499) are fatal, except 408 (Request Timeout)
                isFatalError = status >= 400 && status < 500 && status !== 408;
            }

            if (nextRetries >= this.config.maxRetries || isFatalError) {
                // TR: Maksimum deneme veya kritik hata - Kuyruktan at (Dead Letter)
                // EN: Max retries or critical error - Drop from queue (Dead Letter)
                await db.delete('requests', request.id);
                this.queue.update(q => q.filter(r => r.id !== request.id));

                this.stats.update((s) => ({...s, failed: s.failed + 1}));
                this.config.onFailure(request, error);
            } else {
                // TR: Retry sayısını güncelle ve DB'ye yaz
                // EN: Update retry count and write to DB
                const updatedRequest = { ...request, retries: nextRetries };
                await db.put('requests', updatedRequest);

                // TR: UI State güncelle (Sadece değişen kaydı)
                // EN: Update UI State (Only the changed record)
                this.queue.update(q => q.map(r => r.id === request.id ? updatedRequest : r));
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
     * TR: Kuyruğu tamamen temizler (DB ve Memory).
     *
     * EN: Clears the queue completely (DB and Memory).
     */
    async clear(): Promise<void> {
        const db = await this.dbPromise;
        await db.clear('requests');

        this.queue.set([]);
        this.processingIds.clear();
        this.updateStats();
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

    /**
     * TR: Başlangıçta veritabanından mevcut kayıtları yükler.
     *
     * EN: Loads existing records from database on startup.
     */
    private async loadFromStorage(): Promise<void> {
        if (typeof indexedDB === 'undefined') return;

        try {
            const db = await this.dbPromise;
            const all = await db.getAll('requests');
            // TR: Önceliğe göre sıralı yükle
            // EN: Load sorted by priority
            this.queue.set(all.sort((a, b) => b.priority - a.priority));
            this.updateStats();
        } catch (e) {
            console.warn('Failed to load offline queue from IDB:', e);
        }
    }
}

/**
 * TR: Standart `fetch` fonksiyonunu sarmalayarak (Wrapper) çevrimdışı yeteneği kazandırır.
 * İnternet yoksa veya istek başarısız olursa (Network Error), isteği otomatik olarak kuyruğa atar.
 *
 * EN: Wraps the standard `fetch` function to provide offline capability.
 * If offline or request fails (Network Error), automatically queues the request.
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
                await queue.enqueue({
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