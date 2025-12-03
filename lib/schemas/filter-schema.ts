import { signal, computed, Signal } from '@angular/core';
import { IField, FieldValue } from '../fields';

/**
 * TR: Aktif bir filtre kriterini temsil eden arayüz.
 * Kullanıcı arayüzünde (genellikle "Chip" veya "Badge" olarak) seçili filtreleri listelemek için kullanılır.
 * Örn: { key: 'status', label: 'Durum', value: 'Aktif' }
 *
 * EN: Interface representing an active filter criterion.
 * Used to list selected filters in the user interface (usually as "Chip" or "Badge").
 * E.g., { key: 'status', label: 'Status', value: 'Active' }
 */
export interface FilterItem {
  /**
   * TR: Alanın benzersiz anahtarı.
   *
   * EN: Unique key of the field.
   */
  key: string;

  /**
   * TR: Alanın görünen adı (Etiket).
   *
   * EN: Display name of the field (Label).
   */
  label: string;

  /**
   * TR: Değerin okunabilir string karşılığı (Preview).
   *
   * EN: Readable string representation of the value (Preview).
   */
  value: string;
}

/**
 * TR: Filtreleme mekanizmasının reaktif durumunu yöneten arayüz.
 * Form yapısından farklı olarak, sadece "dolu" değerlere odaklanır ve
 * URL parametreleri (Query Params) ile çift yönlü senkronizasyon yetenekleri sunar.
 *
 * EN: Interface managing the reactive state of the filtering mechanism.
 * Unlike the form structure, it focuses only on "populated" values and
 * offers bidirectional synchronization capabilities with URL parameters (Query Params).
 *
 * @template T - TR: Filtre veri tipi. / EN: Filter data type.
 */
export interface FilterState<T extends Record<string, unknown>> {
  /**
   * TR: Filtre alanlarının durum haritası.
   *
   * EN: State map of filter fields.
   */
  fields: { [K in keyof T]: FieldValue<T[K]> };

  /**
   * TR: Sadece değeri olan (boş olmayan) alanları içeren hesaplanmış sinyal.
   * API istekleri gönderilirken bu obje kullanılır.
   *
   * EN: Computed signal containing only fields with values (non-empty).
   * This object is used when sending API requests.
   */
  values: Signal<Partial<T>>;

  /**
   * TR: UI'da gösterilecek aktif filtrelerin listesi.
   * Alanların `filterPreview` metodunu kullanarak değerleri insanlar için okunabilir hale getirir.
   *
   * EN: List of active filters to be displayed in the UI.
   * Makes values human-readable using the `filterPreview` method of the fields.
   */
  activeFilters: Signal<FilterItem[]>;

  /**
   * TR: Aktif filtre sayısı.
   *
   * EN: Number of active filters.
   */
  count: Signal<number>;

  /**
   * TR: Hiçbir filtrenin seçili olup olmadığını belirtir.
   *
   * EN: Indicates whether no filters are selected.
   */
  isEmpty: Signal<boolean>;

  /**
   * TR: Belirli bir filtreyi temizler (değerini null yapar).
   *
   * EN: Clears a specific filter (sets its value to null).
   */
  remove: (key: string) => void;

  /**
   * TR: Tüm filtreleri temizler.
   *
   * EN: Clears all filters.
   */
  clear: () => void;

  /**
   * TR: URL Query parametrelerinden gelen string değerleri filtre alanlarına yükler.
   * Her alanın `fromImport` metodunu kullanarak tip dönüşümü yapar.
   *
   * EN: Loads string values from URL Query parameters into filter fields.
   * Performs type conversion using each field's `fromImport` method.
   */
  loadFromParams: (params: Record<string, string>) => void;

  /**
   * TR: Mevcut filtre değerlerini URL Query parametrelerine uygun string objesine dönüştürür.
   *
   * EN: Converts current filter values into a string object suitable for URL Query parameters.
   */
  toParams: () => Record<string, string>;
}

/**
 * TR: Dinamik filtreleme yapısını yöneten ana sınıf.
 * Standart FormSchema'dan farklı olarak; validasyon yerine veri dönüşümü (Serialization)
 * ve boş değerlerin elenmesi (Pruning) konularına odaklanmıştır.
 * Liste sayfaları ve raporlama ekranları için optimize edilmiştir.
 *
 * EN: Main class managing the dynamic filtering structure.
 * Unlike standard FormSchema; it focuses on data transformation (Serialization)
 * and pruning of empty values rather than validation.
 * Optimized for list pages and reporting screens.
 *
 * @template T - TR: Filtre veri yapısı. / EN: Filter data structure.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class FilterSchema<T extends Record<string, unknown>> {
  private fieldMap: Map<string, IField<unknown>>;

  /**
   * TR: FilterSchema sınıfını başlatır.
   *
   * EN: Initializes the FilterSchema class.
   *
   * @param fields - TR: Filtre alanları listesi. / EN: List of filter fields.
   */
  constructor(private fields: IField<unknown>[]) {
    this.fieldMap = new Map(fields.map((f) => [f.name, f]));
  }

  /**
   * TR: Reaktif filtre durumunu (FilterState) oluşturur.
   * Angular Signals kullanarak filtrelerin değişimini, parametre senkronizasyonunu ve
   * önizleme (badge) listesinin otomatik güncellenmesini sağlar.
   *
   * EN: Creates the reactive filter state (FilterState).
   * Uses Angular Signals to ensure automatic updates of filter changes, parameter synchronization,
   * and the preview (badge) list.
   *
   * @param initial - TR: Başlangıç değerleri. / EN: Initial values.
   * @returns TR: Yönetilebilir filtre durumu. / EN: Manageable filter state.
   */
  createFilter(initial: Partial<T> = {}): FilterState<T> {
    // TR: Alan değerlerini oluştur (Signal wrappers)
    // EN: Create field values (Signal wrappers)
    const fieldEntries = this.fields.map((field) => {
      const initValue = initial[field.name as keyof T] ?? null;
      return [field.name, field.createValue(initValue)] as const;
    });

    const fields = Object.fromEntries(fieldEntries) as FilterState<T>['fields'];

    // TR: Sadece dolu olan değerleri filtreleyip döndüren computed sinyal.
    // EN: Computed signal filtering and returning only populated values.
    const values = computed(() => {
      const result: Partial<T> = {};
      for (const [name, fv] of Object.entries(fields)) {
        const val = (fv as FieldValue<unknown>).value();
        // TR: Null, undefined veya boş string ise dahil etme
        // EN: Do not include if null, undefined, or empty string
        if (val != null && val !== '') {
          result[name as keyof T] = val as T[keyof T];
        }
      }
      return result;
    });

    // TR: Aktif filtreleri (Chips/Badges) hesaplayan computed sinyal.
    // EN: Computed signal calculating active filters (Chips/Badges).
    const activeFilters = computed(() => {
      const items: FilterItem[] = [];
      for (const [name, fv] of Object.entries(fields)) {
        const val = (fv as FieldValue<unknown>).value();
        if (val == null || val === '') continue;

        const field = this.fieldMap.get(name);
        if (!field) continue;

        // TR: Alanın kendi formatlayıcısını (filterPreview) kullan
        // EN: Use the field's own formatter (filterPreview)
        const preview = field.filterPreview(val);
        if (preview) {
          items.push({ key: name, label: field.label, value: preview });
        }
      }
      return items;
    });

    // TR: Filtre sayısı
    // EN: Filter count
    const count = computed(() => activeFilters().length);

    // TR: Filtre boş mu
    // EN: Is filter empty
    const isEmpty = computed(() => count() === 0);

    // TR: Tek bir filtreyi kaldırma aksiyonu.
    // EN: Action to remove a single filter.
    const remove = (key: string) => {
      const fv = fields[key as keyof T];
      if (fv) {
        (fv as FieldValue<unknown>).value.set(null);
      }
    };

    // TR: Tüm filtreleri temizleme aksiyonu.
    // EN: Action to clear all filters.
    const clear = () => {
      for (const fv of Object.values(fields)) {
        (fv as FieldValue<unknown>).value.set(null);
      }
    };

    // TR: URL parametrelerinden filtreleri doldurma.
    // EN: Populate filters from URL parameters.
    const loadFromParams = (params: Record<string, string>) => {
      for (const [name, fv] of Object.entries(fields)) {
        const paramValue = params[name];
        if (paramValue != null) {
          const field = this.fieldMap.get(name);
          if (field) {
            // TR: String parametreyi doğru tipe (Date, Number vb.) dönüştür.
            // EN: Convert string parameter to correct type (Date, Number, etc.).
            const parsed = field.fromImport(paramValue);
            (fv as FieldValue<unknown>).value.set(parsed);
          }
        }
      }
    };

    // TR: Mevcut değerleri URL parametre formatına dönüştürme.
    // EN: Convert current values to URL parameter format.
    const toParams = (): Record<string, string> => {
      const result: Record<string, string> = {};
      const currentValues = values();
      for (const [key, val] of Object.entries(currentValues)) {
        if (val != null) {
          result[key] = String(val);
        }
      }
      return result;
    };

    return { fields, values, activeFilters, count, isEmpty, remove, clear, loadFromParams, toParams };
  }

  /**
   * TR: İsimle alan tanımını getirir.
   *
   * EN: Gets the field definition by name.
   */
  getField(name: string): IField<unknown> | undefined {
    return this.fieldMap.get(name);
  }
}