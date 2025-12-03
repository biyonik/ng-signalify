import { signal, computed, Signal, WritableSignal } from '@angular/core';
import {
  Entity,
  EntityId,
  EntityState,
  EntitySignals,
  StoreConfig,
  FetchParams,
  PaginatedResponse,
  FilterParams,
  SortConfig,
  LoadingState,
  OptimisticResult,
  createInitialState,
} from './entity-state';
import * as adapter from './entity-adapter';
import { createPagination, PaginationState } from './pagination';

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
   * TR: EntityStore sınıfını başlatır.
   *
   * EN: Initializes the EntityStore class.
   *
   * @param config - TR: Depo ayarları. / EN: Store settings.
   */
  constructor(config: StoreConfig<T>) {
    this.config = {
      name: config.name,
      selectId: config.selectId ?? ((e: T) => e.id),
      sortCompare: config.sortCompare ?? (() => 0),
      defaultPageSize: config.defaultPageSize ?? 10,
      cacheTTL: config.cacheTTL ?? 5 * 60 * 1000, // 5 dakika / 5 minutes
      optimistic: config.optimistic ?? true,
    };

    // TR: Başlangıç durumunu oluştur
    // EN: Create initial state
    this._state = signal(createInitialState(this.config));

    // TR: Sayfalamayı başlat
    // EN: Initialize pagination
    this.pagination = createPagination({
      initialPageSize: this.config.defaultPageSize,
    });

    // TR: Public sinyalleri oluştur
    // EN: Create public signals
    this.signals = this.createSignals();
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
   * API çağrısı başarılı olursa state güncellenir, başarısız olursa hata set edilir.
   *
   * EN: Loads data based on filter, sort, and pagination parameters.
   * If API call is successful, updates state; otherwise, sets error.
   */
  async loadAll(params?: Partial<FetchParams>): Promise<void> {
    this.setLoading('loading');
    this.clearError();

    try {
      // TR: Mevcut parametrelerle yeni parametreleri birleştir
      // EN: Merge current parameters with new parameters
      const fetchParams: FetchParams = {
        page: params?.page ?? this.pagination.page(),
        pageSize: params?.pageSize ?? this.pagination.pageSize(),
        sort: params?.sort ?? this._state().sort ?? undefined,
        filters: params?.filters ?? this._state().filters,
      };

      const response = await this.fetchAll(fetchParams);

      this._state.update((s) => ({
        ...adapter.setAll(s, response.data, this.config.selectId),
        loading: 'success',
        lastFetch: Date.now(),
      }));

      // TR: Sayfalama bilgisini güncelle
      // EN: Update pagination info
      this.pagination.setTotal(response.total);
      this.pagination.setPage(response.page);
    } catch (e) {
      this.setError(e);
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

      // TR: Toplam sayısını artır
      // EN: Increase total count
      this.pagination.setTotal(this.pagination.total() + 1);

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

      // TR: Toplam sayısını azalt
      // EN: Decrease total count
      this.pagination.setTotal(Math.max(0, this.pagination.total() - 1));

      return true;
    } catch (e) {
      this.setError(e);
      return false;
    }
  }

  /**
   * TR: Birden fazla kaydı siler.
   *
   * EN: Deletes multiple records.
   */
  async deleteMany(ids: EntityId[]): Promise<boolean> {
    this.setLoading('loading');
    this.clearError();

    try {
      await Promise.all(ids.map((id) => this.deleteOne(id)));
      
      this._state.update((s) => ({
        ...adapter.removeMany(s, ids),
        loading: 'success',
      }));

      this.pagination.setTotal(Math.max(0, this.pagination.total() - ids.length));

      return true;
    } catch (e) {
      this.setError(e);
      return false;
    }
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
    const tempEntity = { ...data, id: tempId } as unknown as T;

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
      return { rollback: () => {}, confirm: () => {} };
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
      return { rollback: () => {}, confirm: () => {} };
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
          return { ...newState, ids };
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
    this._state.update((s) => ({ ...s, filters }));
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
    const newFilters = { ...this._state().filters, [key]: value };
    
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
        newSort = { field, direction: 'desc' };
      } else {
        newSort = null; // Remove sort
      }
    } else {
      newSort = { field, direction: 'asc' };
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
    this._state.update((s) => ({ ...s, loading }));
  }

  /**
   * TR: Hata durumunu günceller.
   *
   * EN: Updates error state.
   */
  protected setError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Bir hata oluştu';
    this._state.update((s) => ({ ...s, loading: 'error', error: message }));
  }

  /**
   * TR: Hatayı temizler.
   *
   * EN: Clears error.
   */
  clearError(): void {
    this._state.update((s) => ({ ...s, error: null }));
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
   *
   * EN: Refreshes data if stale (Cache TTL expired).
   */
  async refreshIfStale(): Promise<void> {
    if (this.signals.isStale()) {
      await this.loadAll();
    }
  }

  /**
   * TR: Veriyi zorla yeniler.
   *
   * EN: Force refreshes data.
   */
  async refresh(): Promise<void> {
    await this.loadAll();
  }
}