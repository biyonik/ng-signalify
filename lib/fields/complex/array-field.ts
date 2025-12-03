import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig, FieldValue, IField } from '../field.interface';

/**
 * TR: Dizi (Array) tipindeki alanlar için yapılandırma seçenekleri.
 * Minimum/maksimum kayıt sayısı, kullanıcı arayüzü etiketleri ve sıralama (reorder) özelliklerini yönetir.
 *
 * EN: Configuration options for Array type fields.
 * Manages minimum/maximum record counts, user interface labels, and sorting (reorder) features.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface ArrayFieldConfig extends FieldConfig {
  /**
   * TR: Dizide bulunması gereken minimum öğe sayısı.
   *
   * EN: Minimum number of items required in the array.
   */
  min?: number;

  /**
   * TR: Diziye eklenebilecek maksimum öğe sayısı.
   *
   * EN: Maximum number of items allowed in the array.
   */
  max?: number;

  /**
   * TR: "Ekle" butonu için özel etiket (Örn: "Yeni Adres Ekle").
   *
   * EN: Custom label for the "Add" button (E.g., "Add New Address").
   */
  addLabel?: string;

  /**
   * TR: "Sil" butonu için özel etiket.
   *
   * EN: Custom label for the "Remove" button.
   */
  removeLabel?: string;

  /**
   * TR: Kayıtların sürükle-bırak ile yeniden sıralanabilir olup olmadığı.
   *
   * EN: Whether records can be reordered via drag-and-drop.
   */
  sortable?: boolean;
}

/**
 * TR: Dizi içindeki tek bir satırın (Item) durumunu temsil eder.
 * Her satırın benzersiz bir ID'si, alt alan değerleri (Fields) ve kendi validasyon durumu vardır.
 *
 * EN: Represents the state of a single row (Item) within the array.
 * Each row has a unique ID, sub-field values (Fields), and its own validation status.
 */
export interface ArrayItemState {
  /**
   * TR: Satırın benzersiz kimliği (UI döngüleri ve trackBy için).
   *
   * EN: Unique identifier of the row (for UI loops and trackBy).
   */
  id: string;

  /**
   * TR: Satır içindeki alt alanların değer nesneleri.
   *
   * EN: Value objects of the sub-fields within the row.
   */
  fields: Record<string, FieldValue<unknown>>;

  /**
   * TR: Satırın geçerlilik durumu (Tüm alt alanlar geçerliyse true).
   *
   * EN: Validity status of the row (True if all sub-fields are valid).
   */
  valid: Signal<boolean>;

  /**
   * TR: Satır içindeki alanlara ait hata mesajları.
   *
   * EN: Error messages belonging to the fields within the row.
   */
  errors: Signal<Record<string, string | null>>;
}

/**
 * TR: Tüm dizi alanının reaktif durumunu ve yönetim fonksiyonlarını içeren arayüz.
 * UI bileşenleri bu arayüz üzerinden diziye ekleme, çıkarma ve okuma yapar.
 *
 * EN: Interface containing the reactive state and management functions of the entire array field.
 * UI components add, remove, and read from the array via this interface.
 */
export interface ArrayFieldState {
  /**
   * TR: Mevcut satırların (Items) listesini tutan sinyal.
   *
   * EN: Signal holding the list of current rows (Items).
   */
  items: WritableSignal<ArrayItemState[]>;

  /**
   * TR: Tüm satırların saf veri (JSON) hallerini içeren hesaplanmış sinyal.
   * Form submit edilirken bu değer kullanılır.
   *
   * EN: Computed signal containing the raw data (JSON) of all rows.
   * This value is used when the form is submitted.
   */
  values: Signal<Record<string, unknown>[]>;

  /**
   * TR: Tüm dizinin genel geçerlilik durumu.
   *
   * EN: Overall validity status of the entire array.
   */
  valid: Signal<boolean>;

  /**
   * TR: Mevcut kayıt sayısı.
   *
   * EN: Current record count.
   */
  count: Signal<number>;

  /**
   * TR: Yeni kayıt eklenip eklenemeyeceği (Max limit kontrolü).
   *
   * EN: Whether a new record can be added (Max limit check).
   */
  canAdd: Signal<boolean>;

  /**
   * TR: Kayıt silinip silinemeyeceği (Min limit kontrolü).
   *
   * EN: Whether a record can be removed (Min limit check).
   */
  canRemove: Signal<boolean>;

  /**
   * TR: Diziye yeni bir satır ekler.
   *
   * EN: Adds a new row to the array.
   */
  add: (initial?: Record<string, unknown>) => void;

  /**
   * TR: Belirtilen ID'ye sahip satırı siler.
   *
   * EN: Removes the row with the specified ID.
   */
  remove: (id: string) => void;

  /**
   * TR: Satırların sırasını değiştirir.
   *
   * EN: Changes the order of the rows.
   */
  move: (fromIndex: number, toIndex: number) => void;

  /**
   * TR: Diziyi temizler veya minimum sayıya sıfırlar.
   *
   * EN: Clears the array or resets to the minimum count.
   */
  clear: () => void;
}

/**
 * TR: Tekrarlayan veri yapılarını (Repeater/Collection) yöneten alan sınıfı.
 * İçerisinde başka alan tanımları (itemFields) barındırır.
 * Dinamik form satırları, fatura kalemleri veya adres listeleri gibi yapılar için kullanılır.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class managing repeating data structures (Repeater/Collection).
 * Contains other field definitions (itemFields) within it.
 * Used for structures like dynamic form rows, invoice items, or address lists.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class ArrayField extends BaseField<Record<string, unknown>[]> {
  /**
   * TR: ArrayField sınıfını başlatır.
   *
   * EN: Initializes the ArrayField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param itemFields - TR: Her bir satırda bulunacak alanların tanımı (Şema). / EN: Definition of fields to be present in each row (Schema).
   * @param config - TR: Dizi yapılandırması. / EN: Array configuration.
   */
  constructor(
    name: string,
    label: string,
    public readonly itemFields: IField<unknown>[],
    public override config: ArrayFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Dizi ve içeriği için dinamik Zod şeması oluşturur.
   * Önce `itemFields` içindeki her alanın şemasını birleştirerek bir nesne (Object) şeması oluşturur.
   * Sonra bu nesne şemasından bir dizi (Array) şeması türetir ve limitleri (Min/Max) uygular.
   *
   * EN: Creates a dynamic Zod schema for the array and its content.
   * First creates an object schema by combining the schema of each field in `itemFields`.
   * Then derives an Array schema from this object schema and applies limits (Min/Max).
   *
   * @returns TR: Array Zod şeması. / EN: Array Zod schema.
   */
  schema(): z.ZodType<Record<string, unknown>[]> {
    // TR: Her item için schema oluştur
    // EN: Create schema for each item
    const itemShape: z.ZodRawShape = {};
    for (const field of this.itemFields) {
      itemShape[field.name] = field.schema();
    }
    const itemSchema = z.object(itemShape);

    let arraySchema = z.array(itemSchema);

    if (this.config.min != null) {
      arraySchema = arraySchema.min(this.config.min, `En az ${this.config.min} kayıt olmalı`);
    }
    if (this.config.max != null) {
      arraySchema = arraySchema.max(this.config.max, `En fazla ${this.config.max} kayıt olabilir`);
    }
    if (this.config.required) {
      arraySchema = arraySchema.min(1, `${this.label} zorunludur`);
    }

    return arraySchema as unknown as z.ZodType<Record<string, unknown>[]>;
  }

  /**
   * TR: UI'da özet gösterimi sağlar.
   * İçeriğin detayını değil, toplam kayıt sayısını döner.
   *
   * EN: Provides summary display in UI.
   * Returns the total record count, not the content detail.
   */
  override present(value: Record<string, unknown>[] | null): string {
    if (!value || value.length === 0) return '-';
    return `${value.length} kayıt`;
  }

  /**
   * TR: Dışa aktarım için veriyi JSON string'e çevirir.
   *
   * EN: Converts data to JSON string for export.
   */
  override toExport(value: Record<string, unknown>[] | null): string | null {
    if (!value) return null;
    return JSON.stringify(value);
  }

  /**
   * TR: Dış kaynaktan gelen veriyi (Import) işler.
   * JSON string veya doğrudan Array nesnesi kabul eder.
   *
   * EN: Processes data from an external source (Import).
   * Accepts JSON string or direct Array object.
   */
  override fromImport(raw: unknown): Record<string, unknown>[] | null {
    if (raw == null || raw === '') return null;

    // JSON string
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return null;
      }
    }

    // Array
    if (Array.isArray(raw)) return raw as Record<string, unknown>[];

    return null;
  }

  /**
   * TR: Dizinin reaktif durum yönetimini (State Management) başlatır.
   * Angular Signals kullanarak listeyi, validasyonu ve CRUD işlemlerini yöneten bir API (ArrayFieldState) döndürür.
   * Bu metod, dinamik formun "Controller" mantığıdır.
   *
   * EN: Initializes the reactive state management of the array.
   * Returns an API (ArrayFieldState) managing the list, validation, and CRUD operations using Angular Signals.
   * This method is the "Controller" logic of the dynamic form.
   *
   * @param initial - TR: Başlangıç verisi. / EN: Initial data.
   * @returns TR: Dizi durum nesnesi. / EN: Array state object.
   */
  createArrayState(initial: Record<string, unknown>[] = []): ArrayFieldState {
    const items = signal<ArrayItemState[]>(
      initial.map((data) => this.createItem(data))
    );

    // TR: Item'ların anlık değerlerini toplayıp tek bir dizi olarak sunar
    // EN: Aggregates instant values of items and presents as a single array
    const values = computed(() =>
      items().map((item) => {
        const result: Record<string, unknown> = {};
        for (const [name, fv] of Object.entries(item.fields)) {
          result[name] = fv.value();
        }
        return result;
      })
    );

    // TR: Tüm item'lar geçerliyse dizi geçerlidir
    // EN: Array is valid if all items are valid
    const valid = computed(() => items().every((item) => item.valid()));

    const count = computed(() => items().length);

    // TR: Max sınır kontrolü
    // EN: Max limit check
    const canAdd = computed(() => {
      if (this.config.max == null) return true;
      return count() < this.config.max;
    });

    // TR: Min sınır kontrolü
    // EN: Min limit check
    const canRemove = computed(() => {
      const min = this.config.min ?? 0;
      return count() > min;
    });

    // TR: Ekleme fonksiyonu
    // EN: Add function
    const add = (initial: Record<string, unknown> = {}) => {
      if (!canAdd()) return;
      items.update((arr) => [...arr, this.createItem(initial)]);
    };

    // TR: Silme fonksiyonu
    // EN: Remove function
    const remove = (id: string) => {
      if (!canRemove()) return;
      items.update((arr) => arr.filter((item) => item.id !== id));
    };

    // TR: Sıralama fonksiyonu
    // EN: Reorder function
    const move = (fromIndex: number, toIndex: number) => {
      items.update((arr) => {
        const result = [...arr];
        const [removed] = result.splice(fromIndex, 1);
        result.splice(toIndex, 0, removed);
        return result;
      });
    };

    // TR: Temizleme fonksiyonu
    // EN: Clear function
    const clear = () => {
      const min = this.config.min ?? 0;
      if (min > 0) {
        // TR: Min kadar boş item bırak
        // EN: Leave empty items up to min
        items.set(Array.from({ length: min }, () => this.createItem()));
      } else {
        items.set([]);
      }
    };

    return { items, values, valid, count, canAdd, canRemove, add, remove, move, clear };
  }

  /**
   * TR: Yeni bir satır (Item) oluşturur ve içindeki alanları başlatır.
   * Her satıra rastgele bir ID atar ve alt alanların reaktif değerlerini (createValue) oluşturur.
   *
   * EN: Creates a new row (Item) and initializes the fields within it.
   * Assigns a random ID to each row and creates reactive values (createValue) for sub-fields.
   */
  private createItem(data: Record<string, unknown> = {}): ArrayItemState {
    const id = Math.random().toString(36).substring(2, 15);

    const fields: Record<string, FieldValue<unknown>> = {};
    for (const field of this.itemFields) {
      const initial = data[field.name] ?? null;
      fields[field.name] = field.createValue(initial);
    }

    const valid = computed(() =>
      Object.values(fields).every((fv) => fv.valid())
    );

    const errors = computed(() => {
      const result: Record<string, string | null> = {};
      for (const [name, fv] of Object.entries(fields)) {
        result[name] = fv.error();
      }
      return result;
    });

    return { id, fields, valid, errors };
  }

  /**
   * TR: Dizi içinde kullanılan alt alan tanımlarını döndürür.
   *
   * EN: Returns the sub-field definitions used in the array.
   */
  getItemFields(): IField<unknown>[] {
    return this.itemFields;
  }
}