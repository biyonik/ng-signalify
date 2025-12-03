import { signal, computed, Signal, WritableSignal } from '@angular/core';

/**
 * TR: Sayfalama durumunu ve yönetim fonksiyonlarını barındıran arayüz.
 * Angular Signals tabanlıdır; sayfa değişimleri, toplam kayıt sayısı güncellemeleri
 * ve hesaplanan değerler (başlangıç/bitiş indeksleri) anlık olarak UI'a yansır.
 *
 * EN: Interface holding the pagination state and management functions.
 * Based on Angular Signals; page changes, total record updates,
 * and computed values (start/end indexes) are reflected to the UI instantly.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface PaginationState {
  /**
   * TR: Mevcut sayfa numarası (1'den başlar).
   *
   * EN: Current page number (Starts from 1).
   */
  page: Signal<number>;

  /**
   * TR: Sayfa başına gösterilen kayıt sayısı.
   *
   * EN: Number of records displayed per page.
   */
  pageSize: Signal<number>;

  /**
   * TR: Toplam kayıt sayısı.
   *
   * EN: Total number of records.
   */
  total: Signal<number>;

  /**
   * TR: Toplam sayfa sayısı (Computed).
   *
   * EN: Total number of pages (Computed).
   */
  totalPages: Signal<number>;

  /**
   * TR: Sonraki sayfanın olup olmadığını belirtir.
   *
   * EN: Indicates if there is a next page.
   */
  hasNext: Signal<boolean>;

  /**
   * TR: Önceki sayfanın olup olmadığını belirtir.
   *
   * EN: Indicates if there is a previous page.
   */
  hasPrev: Signal<boolean>;

  /**
   * TR: Mevcut sayfadaki ilk kaydın veri setindeki indeksi (0 tabanlı).
   * API çağrıları için 'offset' olarak kullanılabilir.
   *
   * EN: Index of the first record on the current page within the dataset (0-based).
   * Can be used as 'offset' for API calls.
   */
  startIndex: Signal<number>;

  /**
   * TR: Mevcut sayfadaki son kaydın veri setindeki indeksi.
   *
   * EN: Index of the last record on the current page within the dataset.
   */
  endIndex: Signal<number>;

  /**
   * TR: UI üzerinde gösterilecek sayfa numaraları dizisi (Örn: [1, 2, 3, 4, 5]).
   * "Sliding Window" mantığıyla hesaplanır.
   *
   * EN: Array of page numbers to display on the UI (E.g., [1, 2, 3, 4, 5]).
   * Calculated using "Sliding Window" logic.
   */
  pageRange: Signal<number[]>;

  /**
   * TR: Belirtilen sayfaya gider. Sınır kontrollerini yapar.
   *
   * EN: Goes to the specified page. Performs boundary checks.
   */
  setPage: (page: number) => void;

  /**
   * TR: Sayfa boyutunu değiştirir ve sayfayı 1'e sıfırlar.
   *
   * EN: Changes the page size and resets the page to 1.
   */
  setPageSize: (size: number) => void;

  /**
   * TR: Toplam kayıt sayısını günceller.
   * Eğer mevcut sayfa yeni toplamın dışında kalırsa, son sayfaya çeker.
   *
   * EN: Updates the total record count.
   * If the current page falls out of the new total, pulls back to the last page.
   */
  setTotal: (total: number) => void;

  /**
   * TR: Bir sonraki sayfaya geçer.
   *
   * EN: Moves to the next page.
   */
  nextPage: () => void;

  /**
   * TR: Bir önceki sayfaya geçer.
   *
   * EN: Moves to the previous page.
   */
  prevPage: () => void;

  /**
   * TR: İlk sayfaya (1) döner.
   *
   * EN: Returns to the first page (1).
   */
  firstPage: () => void;

  /**
   * TR: Son sayfaya gider.
   *
   * EN: Goes to the last page.
   */
  lastPage: () => void;

  /**
   * TR: Sayfalamayı başlangıç ayarlarına döndürür.
   *
   * EN: Resets pagination to initial settings.
   */
  reset: () => void;
}

/**
 * TR: Sayfalama başlangıç yapılandırması.
 * Varsayılan sayfa, boyut ve UI üzerinde görünecek maksimum buton sayısını belirler.
 *
 * EN: Pagination initial configuration.
 * Determines default page, size, and maximum number of buttons to appear on UI.
 */
export interface PaginationOptions {
  /**
   * TR: Başlangıç sayfası. Varsayılan: 1.
   *
   * EN: Initial page. Default: 1.
   */
  initialPage?: number;

  /**
   * TR: Başlangıç sayfa boyutu. Varsayılan: 10.
   *
   * EN: Initial page size. Default: 10.
   */
  initialPageSize?: number;

  /**
   * TR: Kullanıcıya sunulacak sayfa boyutu seçenekleri (Dropdown için).
   *
   * EN: Page size options to present to the user (for Dropdown).
   */
  pageSizeOptions?: number[];

  /**
   * TR: Sayfalama çubuğunda gösterilecek maksimum sayfa butonu sayısı.
   * Varsayılan: 5.
   *
   * EN: Maximum number of page buttons to display in the pagination bar.
   * Default: 5.
   */
  maxPageButtons?: number;
}

/**
 * TR: Reaktif sayfalama mantığını oluşturan fabrika fonksiyonu.
 * Sayfa hesaplamaları, sınır kontrolleri ve dinamik aralık (range) oluşturma işlemlerini kapsar.
 *
 * EN: Factory function creating reactive pagination logic.
 * Covers page calculations, boundary checks, and dynamic range generation operations.
 *
 * @param options - TR: Yapılandırma seçenekleri. / EN: Configuration options.
 * @returns TR: Yönetilebilir sayfalama durumu. / EN: Manageable pagination state.
 */
export function createPagination(options: PaginationOptions = {}): PaginationState {
  const {
    initialPage = 1,
    initialPageSize = 10,
    maxPageButtons = 5,
  } = options;

  const page = signal(initialPage);
  const pageSize = signal(initialPageSize);
  const total = signal(0);

  // TR: Toplam sayfa sayısı hesaplama (Yukarı yuvarlama)
  // EN: Total page count calculation (Ceiling)
  const totalPages = computed(() => {
    const t = total();
    const ps = pageSize();
    return ps > 0 ? Math.ceil(t / ps) : 0;
  });

  const hasNext = computed(() => page() < totalPages());
  const hasPrev = computed(() => page() > 1);

  // TR: Veri dilimleme (slice) için başlangıç indeksi
  // EN: Start index for data slicing
  const startIndex = computed(() => {
    return (page() - 1) * pageSize();
  });

  // TR: Veri dilimleme için bitiş indeksi
  // EN: End index for data slicing
  const endIndex = computed(() => {
    return Math.min(startIndex() + pageSize(), total());
  });

  /**
   * TR: UI'da gösterilecek sayfa numaralarını hesaplayan akıllı algoritma.
   * Aktif sayfa ortada kalacak şekilde kayan bir pencere (Sliding Window) oluşturur.
   * Örn: Toplam 20 sayfa, Aktif 10, Max 5 -> [8, 9, 10, 11, 12] gösterir.
   *
   * EN: Smart algorithm calculating page numbers to display in UI.
   * Creates a sliding window keeping the active page in the middle.
   * E.g., Total 20 pages, Active 10, Max 5 -> shows [8, 9, 10, 11, 12].
   */
  const pageRange = computed(() => {
    const current = page();
    const totalP = totalPages();
    const maxButtons = maxPageButtons;

    // TR: Toplam sayfa limiti aşmıyorsa hepsini göster
    // EN: Show all if total page count does not exceed limit
    if (totalP <= maxButtons) {
      return Array.from({ length: totalP }, (_, i) => i + 1);
    }

    // TR: Ortalamaya göre başlangıç ve bitişi hesapla
    // EN: Calculate start and end based on centering
    const half = Math.floor(maxButtons / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(totalP, start + maxButtons - 1);

    // TR: Eğer sona yaklaştıysak başlangıcı geri çek
    // EN: If near the end, pull back the start
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  const setPage = (p: number) => {
    // TR: Min 1 ve Max TotalPages arasında sınırla (Clamp)
    // EN: Clamp between Min 1 and Max TotalPages
    const newPage = Math.max(1, Math.min(p, totalPages() || 1));
    page.set(newPage);
  };

  const setPageSize = (size: number) => {
    pageSize.set(size);
    // TR: Boyut değişince sayfa yapısı bozulacağı için başa dön
    // EN: Return to start as page structure breaks when size changes
    page.set(1);
  };

  const setTotal = (t: number) => {
    total.set(t);
    // TR: Mevcut sayfa yeni sınırların dışında kaldıysa düzelt
    // EN: Correct if current page is out of new bounds
    const maxPage = Math.ceil(t / pageSize()) || 1;
    if (page() > maxPage) {
      page.set(maxPage);
    }
  };

  const nextPage = () => {
    if (hasNext()) {
      page.update((p) => p + 1);
    }
  };

  const prevPage = () => {
    if (hasPrev()) {
      page.update((p) => p - 1);
    }
  };

  const firstPage = () => {
    page.set(1);
  };

  const lastPage = () => {
    page.set(totalPages());
  };

  const reset = () => {
    page.set(initialPage);
    total.set(0);
  };

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext,
    hasPrev,
    startIndex,
    endIndex,
    pageRange,
    setPage,
    setPageSize,
    setTotal,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,
  };
}

/**
 * TR: Gösterim amaçlı özet sayfa bilgisi.
 * "1 - 10 / 50" gibi ifadeler oluşturmak için kullanılır.
 *
 * EN: Summary page info for display purposes.
 * Used to create expressions like "1 - 10 / 50".
 */
export interface PageInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
}

/**
 * TR: Sayfalama durumundan özet bilgi üreten yardımcı fonksiyon.
 * İndeksleri insan tarafından okunabilir (1-based) formata çevirir.
 *
 * EN: Helper function generating summary info from pagination state.
 * Converts indexes to human-readable (1-based) format.
 *
 * @param pagination - TR: Sayfalama durumu. / EN: Pagination state.
 * @returns TR: Hesaplanan sayfa bilgisi sinyali. / EN: Computed page info signal.
 */
export function getPageInfo(pagination: PaginationState): Signal<PageInfo> {
  return computed(() => ({
    page: pagination.page(),
    pageSize: pagination.pageSize(),
    total: pagination.total(),
    totalPages: pagination.totalPages(),
    // TR: Veri varsa +1 ekle (0-based -> 1-based), yoksa 0
    // EN: Add +1 if data exists (0-based -> 1-based), else 0
    from: pagination.total() > 0 ? pagination.startIndex() + 1 : 0,
    to: pagination.endIndex(),
  }));
}

/**
 * TR: Sayfa bilgisini verilen şablona göre metne dönüştürür.
 * Varsayılan Şablon: "{from}-{to} / {total}".
 *
 * EN: Formats page info into text based on the provided template.
 * Default Template: "{from}-{to} / {total}".
 *
 * @param info - TR: Sayfa bilgisi. / EN: Page info.
 * @param template - TR: Format şablonu. / EN: Format template.
 */
export function formatPageInfo(info: PageInfo, template?: string): string {
  const t = template ?? '{from}-{to} / {total}';
  return t
    .replace('{from}', String(info.from))
    .replace('{to}', String(info.to))
    .replace('{total}', String(info.total))
    .replace('{page}', String(info.page))
    .replace('{totalPages}', String(info.totalPages));
}