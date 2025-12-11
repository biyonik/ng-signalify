import {computed, DestroyRef, effect, inject, PLATFORM_ID, signal, WritableSignal} from '@angular/core';
import {
    createInitialState,
    Entity,
    EntityId,
    EntitySignals,
    EntityState,
    FetchParams,
    FilterParams,
    LoadingState,
    OptimisticResult,
    PaginatedResponse,
    SortConfig,
    StoreConfig,
} from './entity-state';
import * as adapter from './entity-adapter';
import {createPagination, PaginationState} from './pagination';
import {isPlatformBrowser} from "@angular/common";

/**
 * TR: Signal tabanlı Varlık Deposu (Entity Store).
 * Genel amaçlı (Generic) CRUD durum yönetimini sağlar.
 * Her varlık servisi (örn: UserService, ProductService) bu sınıftan türetilerek
 * standartlaşmış bir yapı kazanır.
 *
 * EN: Signal-based Entity Store.
 * Provides Generic CRUD state management.
 * Each entity service (e.g., UserService, ProductService) inherits from this class
 * to gain a standardized structure.
 *
 * @template T - TR: Varlık tipi. / EN: Entity type.
 * @template CreateDto - TR: Oluşturma modeli. / EN: Create model.
 * @template UpdateDto - TR: Güncelleme modeli. / EN: Update model.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export abstract class EntityStore<
    T extends Entity,
    CreateDto = Partial<T>,
    UpdateDto = Partial<T>
> {
    /**
     * TR: Aktif yükleme isteğini iptal etmek için kullanılan kontrolcü.
     * Race-condition (Yarış durumu) önlemek için her yeni istekte yenilenir.
     *
     * EN: Controller used to cancel the active loading request.
     * Refreshed on every new request to prevent race-conditions.
     */
    private _loadController: AbortController | null = null;

    /**
     * TR: Depo yapılandırma ayarları (Salt okunur).
     *
     * EN: Store configuration settings (Readonly).
     */
    protected readonly config: Required<StoreConfig<T>>;

    /**
     * TR: Dahili durum sinyali (Writable).
     * Sadece bu sınıf içinden güncellenebilir.
     *
     * EN: Internal state signal (Writable).
     * Can only be updated from within this class.
     */
    protected readonly _state: WritableSignal<EntityState<T>>;

    /**
     * TR: Sayfalama durumu ve yöneticisi.
     *
     * EN: Pagination state and manager.
     */
    public readonly pagination: PaginationState;

    /**
     * TR: Dış dünyaya açılan salt okunur sinyaller.
     * UI bileşenleri bu sinyalleri dinleyerek veriyi görüntüler.
     *
     * EN: Public read-only signals exposed to the outside world.
     * UI components display data by listening to these signals.
     */
    public readonly signals: EntitySignals<T>;

    /**
     * TR: Devam eden refresh promise'i (Race condition önleme).
     *
     * EN: Ongoing refresh promise (Race condition prevention).
     */
    private _refreshPromise: Promise<void> | null = null;

    /**
     * TR: Platform ID (SSR kontrolü için).
     * Abstract class içinde inject() kullanımı Angular 14+ ile mümkündür.
     *
     * EN: Platform ID (For SSR check).
     * Usage of inject() inside abstract class is possible with Angular 14+.
     */
    private readonly platformId: string | Object;

    /**
     * TR: Destroy referansı (cleanup için).
     *
     * EN: Destroy reference (for cleanup).
     */
    private readonly destroyRef: DestroyRef | null;

    /**
     * TR: EntityStore sınıfını başlatır.
     * inject() çağrıları constructor parametre default değerleri olarak yapılmalıdır.
     *
     * EN: Initializes the EntityStore class.
     * inject() calls must be made in constructor parameter default values.
     *
     * @param config - TR: Depo ayarları. / EN: Store settings.
     * @param platformId - TR: Platform ID (SSR için). / EN: Platform ID (for SSR).
     * @param destroyRef - TR: Destroy referansı (opsiyonel). / EN: Destroy reference (optional).
     */
    constructor(
        config: StoreConfig<T>,
        platformId: string | Object = inject(PLATFORM_ID),
        destroyRef: DestroyRef | null = inject(DestroyRef, { optional: true })
    ) {
        // TR: Inject edilen değerleri ata
        // EN: Assign injected values
        this.platformId = platformId;
        this.destroyRef = destroyRef;
        this.config = {
            name: config.name,
            selectId: config.selectId ?? ((e: T) => e.id),
            sortCompare: config.sortCompare ?? (() => 0),
            defaultPageSize: config.defaultPageSize ?? 10,
            cacheTTL: config.cacheTTL ?? 5 * 60 * 1000, // 5 dakika / 5 minutes
            optimistic: config.optimistic ?? true,
            localPagination: config.localPagination ?? false,
            // TR: Persistence varsayılanları
            // EN: Persistence defaults
            persistence: config.persistence ? {
                enabled: config.persistence.enabled,
                key: config.persistence.key ?? `sig_store_${config.name}`,
                storage: config.persistence.storage ?? 'sessionStorage',
                paths: config.persistence.paths ?? ['filters', 'sort', 'pagination']
            }: { enabled: false }
        };

        // 1. Önce kayıtlı durumu yükle (State initialize edilmeden önce!)
        const persistedState = this.loadPersistedState();

        // 2. Başlangıç durumunu oluştur (Varsayılanlar + Kayıtlı Durum)
        const initialState = createInitialState(this.config);

        // TR: Kayıtlı verileri başlangıç state'ine merge et
        // EN: Merge persisted data into initial state
        if (persistedState) {
            if (persistedState.filters) initialState.filters = persistedState.filters;
            if (persistedState.sort) initialState.sort = persistedState.sort;
            // Pagination, store state içinde değil PaginationState içindedir, aşağıda ayarlanır.
        }

        // TR: Başlangıç durumunu oluştur
        // EN: Create initial state
        this._state = signal(initialState);

        const initialPage = persistedState?.pagination?.page ?? 1;
        const initialSize = persistedState?.pagination?.pageSize ?? this.config.defaultPageSize;

        this.pagination = createPagination({
            initialPageSize: initialSize,
        });

        // Sayfa numarasını güncelle (PaginationState sinyali olduğu için set ediyoruz)
        if (initialPage > 1) {
            this.pagination.setPage(initialPage);
        }

        // TR: Public sinyalleri oluştur
        // EN: Create public signals
        this.signals = this.createSignals();

        if (this.config.persistence?.enabled && isPlatformBrowser(this.platformId)) {
            this.setupPersistenceEffect();
        }

        // TR: Cleanup ayarla
        // EN: Setup cleanup
        if (this.destroyRef) {
            this.destroyRef.onDestroy(() => {
                this.cleanup();
            });
        }
    }

    /**
     * TR: Cleanup işlemi - Kaynakları temizler.
     *
     * EN: Cleanup operation - Clears resources.
     */
    private cleanup(): void {
        // TR: Devam eden istekleri iptal et
        // EN: Cancel ongoing requests
        if (this._loadController) {
            this._loadController.abort();
            this._loadController = null;
        }

        // TR: Refresh promise'i temizle
        // EN: Clear refresh promise
        this._refreshPromise = null;
    }

    /**
     * TR: State değişimlerini izler ve storage'a yazar.
     *
     * EN: Watches state changes and writes to storage.
     */
    private setupPersistenceEffect(): void {
        effect(() => {
            const state = this._state();
            const page = this.pagination.page();
            const pageSize = this.pagination.pageSize();
            const paths = this.config.persistence!.paths!;
            const dataToSave: Record<string, any> = {};

            // TR: Sadece konfigürasyonda belirtilen alanları seç
            // EN: Select only fields specified in configuration
            if (paths.includes('filters')) dataToSave['filters'] = state.filters;
            if (paths.includes('sort')) dataToSave['sort'] = state.sort;
            if (paths.includes('selection')) dataToSave['ids'] = state.selectedIds; // Veya adapter'a göre değişir

            if (paths.includes('pagination')) {
                dataToSave['pagination'] = { page, pageSize };
            }

            const storageKey = this.config.persistence!.key!;
            const storage = this.config.persistence!.storage === 'localStorage'
                ? localStorage
                : sessionStorage;

            try {
                storage.setItem(storageKey, JSON.stringify(dataToSave));
            } catch (e) {
                console.warn('ng-signalify: Failed to save state to storage', e);
            }
        });
    }

    /**
     * TR: Depolama alanından geçmiş durumu okur.
     * SSR ortamında güvenli bir şekilde null döner.
     *
     * EN: Reads past state from storage.
     * Safely returns null in SSR environment.
     */
    private loadPersistedState(): any | null {
        if (!this.config.persistence?.enabled || !isPlatformBrowser(this.platformId)) {
            return null;
        }

        const storageKey = this.config.persistence.key!;
        const storage = this.config.persistence.storage === 'localStorage'
            ? localStorage
            : sessionStorage;

        try {
            const raw = storage.getItem(storageKey);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * TR: State üzerinden türetilmiş (computed) sinyalleri oluşturur.
     * Bu sinyaller, durum değiştiğinde otomatik olarak yeniden hesaplanır.
     *
     * EN: Creates computed signals derived from the state.
     * These signals are automatically recalculated when the state changes.
     */
    private createSignals(): EntitySignals<T> {
        const state = this._state;

        const all = computed(() => adapter.selectAllEntities(state()));
        const entities = computed(() => state().entities);
        const ids = computed(() => state().ids);
        const selected = computed(() => adapter.selectSelected(state()));
        const selectedItems = computed(() => adapter.selectSelectedEntities(state()));
        const count = computed(() => state().ids.length);
        const isEmpty = computed(() => state().ids.length === 0);
        const loading = computed(() => state().loading);
        const isLoading = computed(() => state().loading === 'loading');
        const error = computed(() => state().error);
        const hasError = computed(() => state().error !== null);

        // TR: Pagination sinyallerini eşleştir
        // EN: Map pagination signals
        const page = this.pagination.page;
        const pageSize = this.pagination.pageSize;
        const total = this.pagination.total;
        const totalPages = this.pagination.totalPages;
        const hasNextPage = this.pagination.hasNext;
        const hasPrevPage = this.pagination.hasPrev;

        const sort = computed(() => state().sort);
        const filters = computed(() => state().filters);

        // TR: Verinin bayatlama (stale) kontrolü
        // EN: Data staleness check
        const isStale = computed(() => {
            const lastFetch = state().lastFetch;
            if (!lastFetch) return true;
            return Date.now() - lastFetch > this.config.cacheTTL;
        });

        return {
            all,
            entities,
            ids,
            selected,
            selectedItems,
            count,
            isEmpty,
            loading,
            isLoading,
            error,
            hasError,
            page,
            pageSize,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage,
            sort,
            filters,
            isStale,
        };
    }

    // =========================================================================
    // Abstract methods - implement in subclass
    // TR: Alt sınıfların uygulaması gereken soyut metodlar (API Entegrasyonu)
    // EN: Abstract methods to be implemented by subclasses (API Integration)
    // =========================================================================

    /**
     * TR: Tüm kayıtları API'den çeker.
     *
     * EN: Fetches all records from the API.
     */
    protected abstract fetchAll(params: FetchParams): Promise<PaginatedResponse<T>>;

    /**
     * TR: Tek bir kaydı API'den çeker.
     *
     * EN: Fetches a single record from the API.
     */
    protected abstract fetchOne(id: EntityId): Promise<T>;

    /**
     * TR: Yeni kayıt oluşturur.
     *
     * EN: Creates a new record via API.
     */
    protected abstract createOne(data: CreateDto): Promise<T>;

    /**
     * TR: Kaydı günceller.
     *
     * EN: Updates a record via API.
     */
    protected abstract updateOne(id: EntityId, data: UpdateDto): Promise<T>;

    /**
     * TR: Kaydı siler.
     *
     * EN: Deletes a record via API.
     */
    protected abstract deleteOne(id: EntityId): Promise<void>;

    // =========================================================================
    // Public actions
    // TR: Dışarıdan çağrılabilen eylemler
    // EN: Actions callable from outside
    // =========================================================================

    /**
     * TR: Filtre, sıralama ve sayfalama parametrelerine göre verileri yükler.
     * ÖNCEKİ İSTEĞİ İPTAL EDER (Auto-Cancellation).
     *
     * EN: Loads data based on filter, sort, and pagination parameters.
     * CANCELS PREVIOUS REQUEST (Auto-Cancellation).
     */
    async loadAll(params?: Partial<FetchParams>): Promise<void> {
        // TR: 1. Önceki istek devam ediyorsa iptal et!
        // EN: 1. If previous request is pending, cancel it!
        if (this._loadController) {
            this._loadController.abort();
        }

        // TR: 2. Yeni bir kontrolcü oluştur
        // EN: 2. Create a new controller
        this._loadController = new AbortController();
        const signal = this._loadController.signal;

        this.setLoading('loading');
        this.clearError();

        try {
            const fetchParams: FetchParams = {
                page: params?.page ?? this.pagination.page(),
                pageSize: params?.pageSize ?? this.pagination.pageSize(),
                sort: params?.sort ?? this._state().sort ?? undefined,
                filters: params?.filters ?? this._state().filters,
                signal,
            };

            const response = await this.fetchAll(fetchParams);

            // TR: Eğer bu istek iptal edildiyse state'i güncelleme (Safety Check)
            // EN: If this request was aborted, do not update state (Safety Check)
            if (signal.aborted) return;

            this._state.update((s) => ({
                ...adapter.setAll(s, response.data, this.config.selectId),
                loading: 'success',
                lastFetch: Date.now(),
            }));

            this.pagination.setTotal(response.total);
            this.pagination.setPage(response.page);
        } catch (e: any) { // 'any' is needed for DOMException check
            // TR: Hata "AbortError" ise (İptal edildiyse) yoksay
            // EN: If error is "AbortError" (Cancelled), ignore it
            if (e.name === 'AbortError' || signal.aborted) {
                // Log: "Request cancelled - new one incoming"
                return;
            }

            this.setError(e);
        } finally {
            // TR: Kontrolcü temizliği
            // EN: Cleanup controller
            if (this._loadController?.signal === signal) {
                this._loadController = null;
            }
        }
    }

    /**
     * TR: Belirtilen ID'ye sahip kaydı yükler veya günceller (Upsert).
     *
     * EN: Loads or updates (Upsert) the record with the specified ID.
     */
    async loadOne(id: EntityId): Promise<T | null> {
        this.setLoading('loading');
        this.clearError();

        try {
            const entity = await this.fetchOne(id);

            this._state.update((s) => ({
                ...adapter.upsertOne(s, entity, this.config.selectId),
                loading: 'success',
            }));

            return entity;
        } catch (e) {
            this.setError(e);
            return null;
        }
    }

    /**
     * TR: Yeni kayıt oluşturur ve listeye ekler.
     *
     * EN: Creates a new record and adds it to the list.
     */
    async create(data: CreateDto): Promise<T | null> {
        this.setLoading('loading');
        this.clearError();

        try {
            const entity = await this.createOne(data);

            this._state.update((s) => ({
                ...adapter.addOne(s, entity, this.config.selectId),
                loading: 'success',
            }));

            if (this.config.localPagination) {
                this.pagination.setTotal(this.pagination.total() + 1);
            }

            return entity;
        } catch (e) {
            this.setError(e);
            return null;
        }
    }


    /**
     * TR: Mevcut kaydı günceller.
     *
     * EN: Updates an existing record.
     */
    async update(id: EntityId, data: UpdateDto): Promise<T | null> {
        this.setLoading('loading');
        this.clearError();

        try {
            const entity = await this.updateOne(id, data);

            this._state.update((s) => ({
                ...adapter.updateOne(s, id, entity),
                loading: 'success',
            }));

            return entity;
        } catch (e) {
            this.setError(e);
            return null;
        }
    }

    /**
     * TR: Kaydı siler ve listeden çıkarır.
     *
     * EN: Deletes the record and removes it from the list.
     */
    async delete(id: EntityId): Promise<boolean> {
        this.setLoading('loading');
        this.clearError();

        try {
            await this.deleteOne(id);

            this._state.update((s) => ({
                ...adapter.removeOne(s, id),
                loading: 'success',
            }));

            if (this.config.localPagination) {
                this.pagination.setTotal(Math.max(0, this.pagination.total() - 1));
            }

            return true;
        } catch (e) {
            this.setError(e);
            return false;
        }
    }

    /**
     * TR: Birden fazla kaydı aynı anda oluşturur.
     * Kısmi başarı durumunda sadece başarılı olanları state'e ekler.
     *
     * EN: Creates multiple records at once.
     * In case of partial success, only adds successful ones to state.
     *
     * @param items - TR: Oluşturulacak kayıtlar. / EN: Records to create.
     * @returns TR: Başarılı ve başarısız sonuçlar. / EN: Successful and failed results.
     */
    async createMany(items: CreateDto[]): Promise<{ success: T[]; failed: { data: CreateDto; error: string }[] }> {
        if (items.length === 0) {
            return {success: [], failed: []};
        }

        this.setLoading('loading');
        this.clearError();

        const results = await Promise.allSettled(
            items.map(async (data) => {
                const entity = await this.createOne(data);
                return entity;
            })
        );

        const success: T[] = [];
        const failed: { data: CreateDto; error: string }[] = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                success.push(result.value);
            } else {
                failed.push({
                    data: items[index],
                    error: result.reason?.message ?? 'Unknown error',
                });
            }
        });

        // TR: Başarılı olanları toplu ekle (Tek state güncellemesi)
        // EN: Add successful ones in batch (Single state update)
        if (success.length > 0) {
            this._state.update((s) => ({
                ...adapter.addMany(s, success, this.config.selectId),
                loading: failed.length > 0 ? 'error' : 'success',
                error: failed.length > 0
                    ? `${failed.length} kayıt oluşturulamadı`
                    : null,
            }));

            this.pagination.setTotal(this.pagination.total() + success.length);
        } else {
            this.setError(new Error('Tüm oluşturma işlemleri başarısız'));
        }

        return {success, failed};
    }

    /**
     * TR: Birden fazla kaydı aynı anda günceller.
     * Her kayıt için ayrı API çağrısı yapar, sonuçları toplu olarak state'e yansıtır.
     *
     * EN: Updates multiple records at once.
     * Makes separate API call for each record, reflects results to state in batch.
     *
     * @param updates - TR: ID ve güncelleme verisi çiftleri. / EN: ID and update data pairs.
     * @returns TR: Başarılı ve başarısız sonuçlar. / EN: Successful and failed results.
     */
    async updateMany(
        updates: Array<{ id: EntityId; data: UpdateDto }>
    ): Promise<{ success: T[]; failed: { id: EntityId; error: string }[] }> {
        if (updates.length === 0) {
            return {success: [], failed: []};
        }

        this.setLoading('loading');
        this.clearError();

        const results = await Promise.allSettled(
            updates.map(async ({id, data}) => {
                const entity = await this.updateOne(id, data);
                return entity;
            })
        );

        const success: T[] = [];
        const failed: { id: EntityId; error: string }[] = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                success.push(result.value);
            } else {
                failed.push({
                    id: updates[index].id,
                    error: result.reason?.message ?? 'Unknown error',
                });
            }
        });

        // TR: Başarılı olanları toplu güncelle (Tek state güncellemesi)
        // EN: Update successful ones in batch (Single state update)
        if (success.length > 0) {
            this._state.update((s) => {
                let newState = s;
                for (const entity of success) {
                    newState = adapter.upsertOne(newState, entity, this.config.selectId);
                }
                return {
                    ...newState,
                    loading: failed.length > 0 ? 'error' : 'success',
                    error: failed.length > 0
                        ? `${failed.length} kayıt güncellenemedi`
                        : null,
                };
            });
        } else {
            this.setError(new Error('Tüm güncelleme işlemleri başarısız'));
        }

        return {success, failed};
    }

    /**
     * TR: Birden fazla kaydı siler.
     * Kısmi başarı durumunda sadece başarılı olanları state'den kaldırır.
     *
     * EN: Deletes multiple records.
     * In case of partial success, only removes successful ones from state.
     *
     * @returns TR: Başarılı ve başarısız ID'lerin listesi. / EN: List of successful and failed IDs.
     */
    async deleteMany(ids: EntityId[]): Promise<{ success: EntityId[]; failed: EntityId[] }> {
        if (ids.length === 0) {
            return {success: [], failed: []};
        }

        this.setLoading('loading');
        this.clearError();

        const results = await Promise.allSettled(
            ids.map(async (id) => {
                await this.deleteOne(id);
                return id;
            })
        );

        const success: EntityId[] = [];
        const failed: EntityId[] = [];
        const errors: string[] = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                success.push(result.value);
            } else {
                failed.push(ids[index]);
                errors.push(result.reason?.message ?? 'Unknown error');
            }
        });

        // TR: Sadece başarılı olanları state'den kaldır
        // EN: Only remove successful ones from state
        if (success.length > 0) {
            this._state.update((s) => ({
                ...adapter.removeMany(s, success),
                loading: failed.length > 0 ? 'error' : 'success',
                error: failed.length > 0
                    ? `${failed.length} kayıt silinemedi: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`
                    : null,
            }));

            this.pagination.setTotal(Math.max(0, this.pagination.total() - success.length));
        } else {
            // Hiçbiri başarılı olmadı
            this.setError(new Error(`Tüm silme işlemleri başarısız: ${errors[0]}`));
        }

        return {success, failed};
    }

    // =========================================================================
    // Optimistic updates
    // TR: İyimser Güncellemeler (API yanıtı beklenmeden UI güncelleme)
    // EN: Optimistic Updates (Update UI without waiting for API response)
    // =========================================================================

    /**
     * TR: İyimser kayıt oluşturma.
     * Geçici bir ID ile kaydı hemen listeye ekler.
     *
     * EN: Optimistic create.
     * Immediately adds the record to the list with a temporary ID.
     */
    optimisticCreate(data: CreateDto & { id?: EntityId }): OptimisticResult {
        const tempId = data.id ?? `temp-${Date.now()}`;
        const tempEntity = {...data, id: tempId} as unknown as T;

        // Add immediately
        this._state.update((s) => adapter.addOne(s, tempEntity, this.config.selectId));

        return {
            rollback: () => {
                this._state.update((s) => adapter.removeOne(s, tempId));
            },
            confirm: () => {
                // Entity already added, nothing to do or replace temp ID with real ID
            },
        };
    }

    /**
     * TR: İyimser güncelleme.
     * UI'da değişikliği hemen yansıtır, hata olursa eski haline (rollback) döndürür.
     *
     * EN: Optimistic update.
     * Reflects change immediately in UI, rolls back to original state if error occurs.
     */
    optimisticUpdate(id: EntityId, data: UpdateDto): OptimisticResult {
        const original = this._state().entities.get(id);

        if (!original) {
            return {
                rollback: () => {
                }, confirm: () => {
                }
            };
        }

        // Update immediately
        this._state.update((s) => adapter.updateOne(s, id, data as Partial<T>));

        return {
            rollback: () => {
                this._state.update((s) => adapter.updateOne(s, id, original));
            },
            confirm: () => {
                // Already updated
            },
        };
    }

    /**
     * TR: İyimser silme.
     * Kaydı hemen listeden kaldırır.
     *
     * EN: Optimistic delete.
     * Removes the record from the list immediately.
     */
    optimisticDelete(id: EntityId): OptimisticResult {
        const original = this._state().entities.get(id);
        const originalIndex = this._state().ids.indexOf(id);

        if (!original) {
            return {
                rollback: () => {
                }, confirm: () => {
                }
            };
        }

        // Remove immediately
        this._state.update((s) => adapter.removeOne(s, id));

        return {
            rollback: () => {
                // Restore entity at original position
                this._state.update((s) => {
                    const newState = adapter.addOne(s, original, this.config.selectId);
                    // Restore position
                    const ids = [...newState.ids.filter((i) => i !== id)];
                    ids.splice(originalIndex, 0, id);
                    return {...newState, ids};
                });
            },
            confirm: () => {
                // Already removed
            },
        };
    }

    // =========================================================================
    // Selection - TR: Seçim İşlemleri
    // =========================================================================

    /**
     * TR: Tekil seçim yapma.
     *
     * EN: Select single entity.
     */
    select(id: EntityId | null): void {
        this._state.update((s) => adapter.selectOne(s, id));
    }

    /**
     * TR: Seçimi tersine çevirme (Toggle).
     *
     * EN: Toggle selection.
     */
    toggleSelect(id: EntityId): void {
        this._state.update((s) => adapter.toggleSelection(s, id));
    }

    /**
     * TR: Çoklu seçim yapma.
     *
     * EN: Select multiple entities.
     */
    selectMany(ids: EntityId[]): void {
        this._state.update((s) => adapter.selectMany(s, ids));
    }

    /**
     * TR: Tümünü seçme.
     *
     * EN: Select all.
     */
    selectAll(): void {
        this._state.update((s) => adapter.selectAll(s));
    }

    /**
     * TR: Seçimleri temizleme.
     *
     * EN: Clear selection.
     */
    clearSelection(): void {
        this._state.update((s) => adapter.clearSelection(s));
    }

    // =========================================================================
    // Filtering & Sorting - TR: Filtreleme ve Sıralama
    // =========================================================================

    /**
     * TR: Filtreleri uygular ve veriyi yeniden yükler (Sayfa 1'e döner).
     *
     * EN: Applies filters and reloads data (Returns to Page 1).
     */
    async setFilters(filters: FilterParams): Promise<void> {
        this._state.update((s) => ({...s, filters}));
        this.pagination.setPage(1);
        await this.loadAll();
    }

    /**
     * TR: Tek bir filtre kriterini günceller.
     * Değer null ise filtreyi kaldırır.
     *
     * EN: Updates a single filter criterion.
     * Removes filter if value is null.
     */
    async updateFilter(key: string, value: unknown): Promise<void> {
        const newFilters = {...this._state().filters, [key]: value};

        // Remove null/undefined values
        if (value == null) {
            delete newFilters[key];
        }

        await this.setFilters(newFilters);
    }

    /**
     * TR: Tüm filtreleri temizler.
     *
     * EN: Clears all filters.
     */
    async clearFilters(): Promise<void> {
        await this.setFilters({});
    }

    /**
     * TR: Sıralamayı uygular ve veriyi yeniden yükler.
     *
     * EN: Applies sort and reloads data.
     */
    async setSort(sort: SortConfig | null): Promise<void> {
        this._state.update((s) => ({
            ...adapter.sortEntities(s, sort, this.config.sortCompare),
        }));
        await this.loadAll();
    }

    /**
     * TR: Verilen alan için sıralama yönünü değiştirir (ASC -> DESC -> None).
     *
     * EN: Toggles sort direction for the given field (ASC -> DESC -> None).
     */
    async toggleSort(field: string): Promise<void> {
        const current = this._state().sort;

        let newSort: SortConfig | null;

        if (current?.field === field) {
            if (current.direction === 'asc') {
                newSort = {field, direction: 'desc'};
            } else {
                newSort = null; // Remove sort
            }
        } else {
            newSort = {field, direction: 'asc'};
        }

        await this.setSort(newSort);
    }

    // =========================================================================
    // Pagination - TR: Sayfalama Kontrolleri
    // =========================================================================

    /**
     * TR: Belirtilen sayfaya gider.
     *
     * EN: Goes to specified page.
     */
    async goToPage(page: number): Promise<void> {
        this.pagination.setPage(page);
        await this.loadAll();
    }

    /**
     * TR: Sonraki sayfaya gider.
     *
     * EN: Goes to next page.
     */
    async nextPage(): Promise<void> {
        if (this.pagination.hasNext()) {
            this.pagination.nextPage();
            await this.loadAll();
        }
    }

    /**
     * TR: Önceki sayfaya gider.
     *
     * EN: Goes to previous page.
     */
    async prevPage(): Promise<void> {
        if (this.pagination.hasPrev()) {
            this.pagination.prevPage();
            await this.loadAll();
        }
    }

    /**
     * TR: Sayfa boyutunu değiştirir.
     *
     * EN: Changes page size.
     */
    async setPageSize(size: number): Promise<void> {
        this.pagination.setPageSize(size);
        await this.loadAll();
    }

    // =========================================================================
    // Getters - TR: Veri Okuma Metodları
    // =========================================================================

    /**
     * TR: ID'ye göre varlık getirir (Store içinden).
     *
     * EN: Gets entity by ID (from Store).
     */
    getById(id: EntityId): T | undefined {
        return this._state().entities.get(id);
    }

    /**
     * TR: ID listesine göre varlıkları getirir.
     *
     * EN: Gets entities by ID list.
     */
    getByIds(ids: EntityId[]): T[] {
        return adapter.selectByIds(this._state(), ids);
    }

    /**
     * TR: Koşula uyan ilk varlığı bulur.
     *
     * EN: Finds first entity matching the predicate.
     */
    find(predicate: (entity: T) => boolean): T | undefined {
        return adapter.findEntity(this._state(), predicate);
    }

    /**
     * TR: Koşula uyan tüm varlıkları filtreler.
     *
     * EN: Filters all entities matching the predicate.
     */
    filter(predicate: (entity: T) => boolean): T[] {
        return adapter.filterEntities(this._state(), predicate);
    }

    // =========================================================================
    // State management - TR: Durum Yönetimi
    // =========================================================================

    /**
     * TR: Yükleme durumunu günceller.
     *
     * EN: Updates loading state.
     */
    protected setLoading(loading: LoadingState): void {
        this._state.update((s) => ({...s, loading}));
    }

    /**
     * TR: Hata durumunu günceller.
     *
     * EN: Updates error state.
     */
    protected setError(error: unknown): void {
        const message = error instanceof Error ? error.message : 'Bir hata oluştu';
        this._state.update((s) => ({...s, loading: 'error', error: message}));
    }

    /**
     * TR: Hatayı temizler.
     *
     * EN: Clears error.
     */
    clearError(): void {
        this._state.update((s) => ({...s, error: null}));
    }

    /**
     * TR: Depoyu başlangıç haline döndürür.
     *
     * EN: Resets store to initial state.
     */
    reset(): void {
        this._state.set(createInitialState(this.config));
        this.pagination.reset();
    }

    /**
     * TR: Veri bayatlamışsa (Cache TTL dolmuşsa) yeniler.
     * Eşzamanlı çağrıları tek bir request'e birleştirir (Deduplication).
     *
     * EN: Refreshes data if stale (Cache TTL expired).
     * Deduplicates concurrent calls into a single request.
     */
    async refreshIfStale(): Promise<void> {
        if (!this.signals.isStale()) {
            return;
        }

        // TR: Zaten bir refresh devam ediyorsa, ona bağlan
        // EN: If refresh is already in progress, join it
        if (this._refreshPromise) {
            return this._refreshPromise;
        }

        this._refreshPromise = this.loadAll().finally(() => {
            this._refreshPromise = null;
        });

        return this._refreshPromise;
    }

    /**
     * TR: Veriyi zorla yeniler.
     * Eşzamanlı çağrıları tek bir request'e birleştirir (Deduplication).
     *
     * EN: Force refreshes data.
     * Deduplicates concurrent calls into a single request.
     */
    async refresh(): Promise<void> {
        // TR: Zaten bir refresh devam ediyorsa, ona bağlan
        // EN: If refresh is already in progress, join it
        if (this._refreshPromise) {
            return this._refreshPromise;
        }

        this._refreshPromise = this.loadAll().finally(() => {
            this._refreshPromise = null;
        });

        return this._refreshPromise;
    }
}