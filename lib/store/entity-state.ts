import { Signal, WritableSignal } from '@angular/core';

/**
 * TR: Varlık (Entity) kimliği için tip tanımı.
 * String (UUID, GUID) veya Number (Auto-increment ID) olabilir.
 *
 * EN: Type definition for entity ID.
 * Can be String (UUID, GUID) or Number (Auto-increment ID).
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export type EntityId = string | number;

/**
 * TR: Tüm varlıkların uygulaması gereken temel arayüz.
 * Sistemin varlığı takip edebilmesi için en az bir `id` alanına sahip olması gerekir.
 *
 * EN: Base interface that all entities must implement.
 * Must have at least one `id` field for the system to track the entity.
 */
export interface Entity {
  id: EntityId;
}

/**
 * TR: Asenkron işlemlerin yaşam döngüsünü belirten durum tipleri.
 * UI tarafında spinner, hata mesajı veya içerik göstermek için kullanılır.
 *
 * EN: State types specifying the lifecycle of asynchronous operations.
 * Used to show spinner, error message, or content on the UI side.
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * TR: Sıralama yönü (Artan veya Azalan).
 *
 * EN: Sort direction (Ascending or Descending).
 */
export type SortDirection = 'asc' | 'desc';

/**
 * TR: Sıralama yapılandırması.
 * Hangi alana göre ve hangi yönde sıralama yapılacağını belirler.
 *
 * EN: Sort configuration.
 * Determines by which field and in which direction sorting will be performed.
 */
export interface SortConfig {
  field: string;
  direction: SortDirection;
}

/**
 * TR: Dinamik filtreleme parametreleri.
 * Key-Value yapısında her türlü filtre kriterini taşıyabilir.
 *
 * EN: Dynamic filter parameters.
 * Can carry any filter criteria in Key-Value structure.
 */
export interface FilterParams {
  [key: string]: unknown;
}

/**
 * TR: Sayfalandırılmış API yanıtını temsil eden arayüz.
 * Veri dizisiyle birlikte meta verileri (toplam kayıt, sayfa sayısı vb.) içerir.
 *
 * EN: Interface representing a paginated API response.
 * Contains metadata (total records, page count, etc.) along with the data array.
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * TR: Varlık durumunun (State) ham veri yapısı.
 * Veri erişim performansını artırmak için `Map` (O(1) erişim) ve `Array` (Sıralı erişim) kombinasyonu kullanılır.
 *
 * EN: Raw data structure of the entity state.
 * Uses a combination of `Map` (O(1) access) and `Array` (Ordered access) to improve data access performance.
 *
 * @template T - TR: Yönetilen varlık tipi. / EN: Type of the managed entity.
 */
export interface EntityState<T extends Entity> {
  /**
   * TR: ID ile hızlı erişim için varlık haritası.
   *
   * EN: Entity map for fast access by ID.
   */
  entities: Map<EntityId, T>;

  /**
   * TR: Varlıkların görüntüleme sırasını tutan ID listesi.
   *
   * EN: List of IDs holding the display order of entities.
   */
  ids: EntityId[];

  /**
   * TR: Seçili olan tekil varlığın ID'si.
   *
   * EN: ID of the selected single entity.
   */
  selectedId: EntityId | null;

  /**
   * TR: Çoklu seçimlerde seçili varlıkların ID kümesi.
   *
   * EN: Set of IDs of selected entities in multiple selections.
   */
  selectedIds: Set<EntityId>;

  /**
   * TR: Veri yükleme durumu.
   *
   * EN: Data loading state.
   */
  loading: LoadingState;

  /**
   * TR: Varsa hata mesajı.
   *
   * EN: Error message if exists.
   */
  error: string | null;

  /**
   * TR: Mevcut sayfa numarası.
   *
   * EN: Current page number.
   */
  page: number;

  /**
   * TR: Sayfa başına kayıt sayısı.
   *
   * EN: Items per page.
   */
  pageSize: number;

  /**
   * TR: Toplam kayıt sayısı (Backend'den gelen).
   *
   * EN: Total items count (From backend).
   */
  total: number;

  /**
   * TR: Aktif sıralama ayarı.
   *
   * EN: Active sort configuration.
   */
  sort: SortConfig | null;

  /**
   * TR: Aktif filtreler.
   *
   * EN: Active filters.
   */
  filters: FilterParams;

  /**
   * TR: Son veri çekme zamanı (Cache invalidation için).
   *
   * EN: Last fetch timestamp (For cache invalidation).
   */
  lastFetch: number | null;
}

/**
 * TR: Durum verilerini reaktif sinyaller (Signals) olarak dışarı sunan arayüz.
 * Angular Change Detection mekanizmasıyla entegre çalışır.
 *
 * EN: Interface exposing state data as reactive signals.
 * Works integrated with Angular Change Detection mechanism.
 *
 * @template T - TR: Varlık tipi. / EN: Entity type.
 */
export interface EntitySignals<T extends Entity> {
  /**
   * TR: Tüm varlıkları dizi olarak döner.
   *
   * EN: Returns all entities as an array.
   */
  all: Signal<T[]>;

  /**
   * TR: Varlık haritasını döner.
   *
   * EN: Returns the entity map.
   */
  entities: Signal<Map<EntityId, T>>;

  /**
   * TR: ID listesini döner.
   *
   * EN: Returns the list of IDs.
   */
  ids: Signal<EntityId[]>;

  /**
   * TR: Seçili olan varlığı döner.
   *
   * EN: Returns the selected entity.
   */
  selected: Signal<T | null>;

  /**
   * TR: Çoklu seçimdeki varlıkları dizi olarak döner.
   *
   * EN: Returns selected entities in multiple selection as an array.
   */
  selectedItems: Signal<T[]>;

  /**
   * TR: Yüklenmiş varlık sayısını döner.
   *
   * EN: Returns the count of loaded entities.
   */
  count: Signal<number>;

  /**
   * TR: Listenin boş olup olmadığını döner.
   *
   * EN: Returns whether the list is empty.
   */
  isEmpty: Signal<boolean>;

  /**
   * TR: Yükleme durumunu (idle, loading, etc.) döner.
   *
   * EN: Returns the loading state (idle, loading, etc.).
   */
  loading: Signal<LoadingState>;

  /**
   * TR: Yükleme işleminin devam edip etmediğini döner (Boolean).
   *
   * EN: Returns whether the loading process is ongoing (Boolean).
   */
  isLoading: Signal<boolean>;

  /**
   * TR: Hata mesajını döner.
   *
   * EN: Returns the error message.
   */
  error: Signal<string | null>;

  /**
   * TR: Hata olup olmadığını döner.
   *
   * EN: Returns whether there is an error.
   */
  hasError: Signal<boolean>;

  /**
   * TR: Mevcut sayfa numarasını döner.
   *
   * EN: Returns the current page number.
   */
  page: Signal<number>;

  /**
   * TR: Sayfa boyutunu döner.
   *
   * EN: Returns the page size.
   */
  pageSize: Signal<number>;

  /**
   * TR: Toplam kayıt sayısını döner.
   *
   * EN: Returns the total items count.
   */
  total: Signal<number>;

  /**
   * TR: Toplam sayfa sayısını döner.
   *
   * EN: Returns the total number of pages.
   */
  totalPages: Signal<number>;

  /**
   * TR: Sonraki sayfanın olup olmadığını döner.
   *
   * EN: Returns whether there is a next page.
   */
  hasNextPage: Signal<boolean>;

  /**
   * TR: Önceki sayfanın olup olmadığını döner.
   *
   * EN: Returns whether there is a previous page.
   */
  hasPrevPage: Signal<boolean>;

  /**
   * TR: Aktif sıralama bilgisini döner.
   *
   * EN: Returns active sort information.
   */
  sort: Signal<SortConfig | null>;

  /**
   * TR: Aktif filtreleri döner.
   *
   * EN: Returns active filters.
   */
  filters: Signal<FilterParams>;

  /**
   * TR: Verinin bayatlayıp bayatlamadığını (Cache TTL süresinin dolup dolmadığını) döner.
   *
   * EN: Returns whether the data is stale (Cache TTL expired).
   */
  isStale: Signal<boolean>;
}

/**
 * TR: Depo (Store) yapılandırma ayarları.
 * Deponun davranışını özelleştirmek için kullanılır.
 *
 * EN: Store configuration settings.
 * Used to customize the behavior of the store.
 */
export interface StoreConfig<T extends Entity> {
  /**
   * TR: Depo adı (Debug ve Loglama için).
   *
   * EN: Store name (For Debugging and Logging).
   */
  name: string;

  /**
   * TR: Varlıktan ID'yi seçen fonksiyon.
   * Varsayılan olarak `entity.id` kullanılır, ancak özel ID alanları için değiştirilebilir.
   *
   * EN: Function selecting ID from the entity.
   * Defaults to `entity.id`, but can be changed for custom ID fields.
   */
  selectId?: (entity: T) => EntityId;

  /**
   * TR: İstemci tarafı sıralama fonksiyonu (Comparator).
   *
   * EN: Client-side sort function (Comparator).
   */
  sortCompare?: (a: T, b: T) => number;

  /**
   * TR: Varsayılan sayfa boyutu.
   *
   * EN: Default page size.
   */
  defaultPageSize?: number;

  /**
   * TR: Önbellek geçerlilik süresi (milisaniye).
   * Bu süre dolmadan tekrar istek atılırsa, mevcut veri kullanılır.
   *
   * EN: Cache Time-To-Live (milliseconds).
   * If requested again before this time expires, existing data is used.
   */
  cacheTTL?: number;

  /**
   * TR: İyimser güncellemelerin (Optimistic Updates) aktif olup olmadığı.
   * Aktifse, API yanıtı beklenmeden UI güncellenir.
   *
   * EN: Whether optimistic updates are enabled.
   * If enabled, UI is updated without waiting for API response.
   */
  optimistic?: boolean;
}

/**
 * TR: İyimser güncelleme (Optimistic Update) sonucunda dönen kontrol nesnesi.
 * İşlem başarısız olursa geri alma (rollback), başarılı olursa onaylama (confirm) işlemlerini yönetir.
 *
 * EN: Control object returned as a result of an optimistic update.
 * Manages rollback operations if failed, and confirm operations if successful.
 */
export interface OptimisticResult {
  /**
   * TR: Değişiklikleri geri alır (Hata durumunda).
   *
   * EN: Reverts changes (In case of error).
   */
  rollback: () => void;

  /**
   * TR: Değişiklikleri onaylar ve kalıcı hale getirir (Başarı durumunda).
   *
   * EN: Confirms and persists changes (In case of success).
   */
  confirm: () => void;
}

/**
 * TR: Backend API ile iletişim kuran adaptör arayüzü.
 * CRUD işlemlerini standartlaştırır.
 *
 * EN: Adapter interface communicating with the Backend API.
 * Standardizes CRUD operations.
 *
 * @template T - TR: Varlık tipi. / EN: Entity type.
 * @template CreateDto - TR: Oluşturma veri transfer objesi. / EN: Create data transfer object.
 * @template UpdateDto - TR: Güncelleme veri transfer objesi. / EN: Update data transfer object.
 */
export interface EntityApi<T extends Entity, CreateDto = Partial<T>, UpdateDto = Partial<T>> {
  /**
   * TR: Sayfalandırılmış liste çeker.
   *
   * EN: Fetches paginated list.
   */
  fetchAll: (params: FetchParams) => Promise<PaginatedResponse<T>>;

  /**
   * TR: Tek bir kayıt çeker.
   *
   * EN: Fetches a single record.
   */
  fetchOne: (id: EntityId) => Promise<T>;

  /**
   * TR: Yeni kayıt oluşturur.
   *
   * EN: Creates a new record.
   */
  create: (data: CreateDto) => Promise<T>;

  /**
   * TR: Mevcut kaydı günceller.
   *
   * EN: Updates an existing record.
   */
  update: (id: EntityId, data: UpdateDto) => Promise<T>;

  /**
   * TR: Kaydı siler.
   *
   * EN: Deletes the record.
   */
  delete: (id: EntityId) => Promise<void>;
}

/**
 * TR: API veri çekme parametreleri.
 *
 * EN: API fetch parameters.
 */
export interface FetchParams {
  page?: number;
  pageSize?: number;
  sort?: SortConfig;
  filters?: FilterParams;
}

/**
 * TR: Başlangıç durumunu (Initial State) oluşturan fabrika fonksiyonu.
 * Boş haritalar ve varsayılan değerlerle temiz bir state döndürür.
 *
 * EN: Factory function creating the initial state.
 * Returns a clean state with empty maps and default values.
 *
 * @param config - TR: Opsiyonel yapılandırma. / EN: Optional configuration.
 */
export function createInitialState<T extends Entity>(
  config?: Partial<StoreConfig<T>>
): EntityState<T> {
  return {
    entities: new Map(),
    ids: [],
    selectedId: null,
    selectedIds: new Set(),
    loading: 'idle',
    error: null,
    page: 1,
    pageSize: config?.defaultPageSize ?? 10,
    total: 0,
    sort: null,
    filters: {},
    lastFetch: null,
  };
}