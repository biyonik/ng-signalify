import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { z } from 'zod';

/**
 * TR: Tekrarlayıcı içindeki tek bir öğenin durumu.
 * Verinin kendisiyle birlikte hata, etkileşim (touched) ve görünüm (collapsed) durumlarını da taşır.
 *
 * EN: State of a single item within the repeater.
 * Carries error, interaction (touched), and view (collapsed) states along with the data itself.
 *
 * @template T - TR: Öğe verisinin tipi. / EN: Type of item data.
 */
export interface RepeaterItem<T = Record<string, unknown>> {
  /**
   * TR: Öğenin benzersiz kimliği (UI takibi için).
   *
   * EN: Unique identifier of the item (for UI tracking).
   */
  id: string;

  /**
   * TR: Öğenin asıl verisi.
   *
   * EN: Actual data of the item.
   */
  data: T;

  /**
   * TR: Öğeye ait validasyon hataları (Alan bazlı).
   *
   * EN: Validation errors belonging to the item (Field-based).
   */
  errors: Record<string, string | null>;

  /**
   * TR: Öğeyle etkileşime girilip girilmediği.
   *
   * EN: Whether the item has been interacted with.
   */
  touched: boolean;

  /**
   * TR: Öğenin arayüzde kapalı (collapsed) olup olmadığı.
   *
   * EN: Whether the item is collapsed in the UI.
   */
  collapsed: boolean;
}

/**
 * TR: Tekrarlayıcı yapılandırma seçenekleri.
 * Sınırlar (Min/Max), varsayılan değerler ve davranışsal özellikleri (Sıralama, Silme onayı) belirler.
 *
 * EN: Repeater configuration options.
 * Determines limits (Min/Max), default values, and behavioral features (Sorting, Delete confirmation).
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface RepeaterConfig<T> {
  /**
   * TR: Minimum öğe sayısı.
   *
   * EN: Minimum number of items.
   */
  min?: number;

  /**
   * TR: Maksimum öğe sayısı.
   *
   * EN: Maximum number of items.
   */
  max?: number;

  /**
   * TR: Yeni öğe eklenirken kullanılacak varsayılan veri üreteci.
   *
   * EN: Default data generator to use when adding a new item.
   */
  defaultItem?: () => T;

  /**
   * TR: Öğe verisini doğrulamak için Zod şeması.
   *
   * EN: Zod schema to validate item data.
   */
  schema?: z.ZodSchema<T>;

  /**
   * TR: Sıralamaya izin ver (Drag & Drop için).
   *
   * EN: Allow reordering (for Drag & Drop).
   */
  sortable?: boolean;

  /**
   * TR: Öğelerin açılıp kapanabilir (accordion) olması.
   *
   * EN: Whether items are collapsible (accordion).
   */
  collapsible?: boolean;

  /**
   * TR: Silme işlemi öncesi onay gerekip gerekmediği.
   *
   * EN: Whether confirmation is required before deletion.
   */
  confirmDelete?: boolean;

  /**
   * TR: Dinamik öğe başlığı oluşturucu (Örn: "Ürün 1: Laptop").
   *
   * EN: Dynamic item label generator (E.g., "Product 1: Laptop").
   */
  itemLabel?: (item: T, index: number) => string;
}

/**
 * TR: Tekrarlayıcı durumu ve yönetim API'si.
 * CRUD işlemleri, validasyon, sıralama ve durum takibi (State Tracking) sağlar.
 *
 * EN: Repeater state and management API.
 * Provides CRUD operations, validation, sorting, and state tracking.
 *
 * @template T - TR: Veri tipi. / EN: Data type.
 */
export interface RepeaterState<T> {
  items: Signal<RepeaterItem<T>[]>;
  count: Signal<number>;
  isEmpty: Signal<boolean>;
  canAdd: Signal<boolean>;
  canRemove: Signal<boolean>;
  isValid: Signal<boolean>;
  hasErrors: Signal<boolean>;
  values: Signal<T[]>;

  add: (data?: Partial<T>, index?: number) => string;
  remove: (id: string) => boolean;
  update: (id: string, data: Partial<T>) => void;
  move: (fromIndex: number, toIndex: number) => void;
  duplicate: (id: string) => string | null;
  clear: () => void;
  reset: (items?: T[]) => void;
  validateItem: (id: string) => boolean;
  validateAll: () => boolean;
  touchItem: (id: string) => void;
  touchAll: () => void;
  toggleCollapse: (id: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
  getItem: (id: string) => RepeaterItem<T> | undefined;
  getIndex: (id: string) => number;
}

/**
 * TR: Dinamik liste/tekrarlayıcı (Repeater) yapısını oluşturan fabrika fonksiyonu.
 * Angular Signals tabanlıdır; listeye yapılan ekleme/çıkarma/güncelleme işlemleri anlık olarak UI'a yansır.
 *
 * EN: Factory function creating dynamic list/repeater structure.
 * Signal-based; additions/removals/updates to the list are instantly reflected in the UI.
 *
 * @param initialItems - TR: Başlangıç verileri. / EN: Initial items.
 * @param config - TR: Ayarlar. / EN: Configuration.
 * @returns TR: Tekrarlayıcı durumu. / EN: Repeater state.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export function createRepeater<T extends Record<string, unknown>>(
  initialItems: T[] = [],
  config: RepeaterConfig<T> = {}
): RepeaterState<T> {
  const {
    min = 0,
    max = Infinity,
    defaultItem = () => ({} as T),
    schema,
    sortable = true,
    collapsible = false,
  } = config;

  const generateId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'item-';
    for (let i = 0; i < 12; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  // Initialize items
  const createItem = (data: T, touched = false): RepeaterItem<T> => ({
    id: generateId(),
    data,
    errors: {},
    touched,
    collapsed: false,
  });

  const items = signal<RepeaterItem<T>[]>(
    initialItems.map((data) => createItem(data))
  );

  // Computed values
  const count = computed(() => items().length);
  const isEmpty = computed(() => items().length === 0);
  const canAdd = computed(() => items().length < max);
  const canRemove = computed(() => items().length > min);

  // TR: Tüm listenin geçerlilik durumu
  // EN: Overall list validity status
  const isValid = computed(() => {
    if (!schema) return true;
    return items().every((item) => {
      // TR: Dokunulmamışsa geçerli say (Pristine)
      // EN: Consider valid if not touched (Pristine)
      if (!item.touched) return true;
      const result = schema.safeParse(item.data);
      return result.success;
    });
  });

  const hasErrors = computed(() => {
    return items().some((item) =>
      Object.values(item.errors).some((e) => e !== null)
    );
  });

  // TR: Sadece veri kısmını (id ve metadatadan arınmış) döndürür
  // EN: Returns only the data part (stripped of id and metadata)
  const values = computed(() => items().map((item) => item.data));

  // Actions

  /**
   * TR: Yeni öğe ekler.
   * Limit kontrolü yapar ve belirtilen indekse (veya sona) ekler.
   *
   * EN: Adds a new item.
   * Checks limit and adds to specified index (or end).
   */
  const add = (data?: Partial<T>, index?: number): string => {
    if (!canAdd()) return '';

    const newItem = createItem({ ...defaultItem(), ...data } as T);

    items.update((list) => {
      if (index !== undefined && index >= 0 && index <= list.length) {
        const newList = [...list];
        newList.splice(index, 0, newItem);
        return newList;
      }
      return [...list, newItem];
    });

    return newItem.id;
  };

  /**
   * TR: Öğeyi siler.
   * Minimum limit kontrolü yapar.
   *
   * EN: Removes the item.
   * Checks minimum limit.
   */
  const remove = (id: string): boolean => {
    if (!canRemove()) return false;

    const exists = items().some((item) => item.id === id);
    if (!exists) return false;

    items.update((list) => list.filter((item) => item.id !== id));
    return true;
  };

  /**
   * TR: Öğe verisini günceller (Immutable Update).
   *
   * EN: Updates item data (Immutable Update).
   */
  const update = (id: string, data: Partial<T>) => {
    items.update((list) =>
      list.map((item) =>
        item.id === id
          ? { ...item, data: { ...item.data, ...data } }
          : item
      )
    );
  };

  /**
   * TR: Öğeyi listede başka bir konuma taşır (Drag & Drop için).
   *
   * EN: Moves item to another position in the list (for Drag & Drop).
   */
  const move = (fromIndex: number, toIndex: number) => {
    if (!sortable) return;

    items.update((list) => {
      if (
        fromIndex < 0 ||
        fromIndex >= list.length ||
        toIndex < 0 ||
        toIndex >= list.length
      ) {
        return list;
      }

      const newList = [...list];
      const [removed] = newList.splice(fromIndex, 1);
      newList.splice(toIndex, 0, removed);
      return newList;
    });
  };

  /**
   * TR: Mevcut bir öğeyi kopyalarak çoğaltır.
   *
   * EN: Duplicates an existing item by copying it.
   */
  const duplicate = (id: string): string | null => {
    if (!canAdd()) return null;

    const item = items().find((i) => i.id === id);
    if (!item) return null;

    const newItem = createItem({ ...item.data });
    const index = items().findIndex((i) => i.id === id);

    items.update((list) => {
      const newList = [...list];
      newList.splice(index + 1, 0, newItem);
      return newList;
    });

    return newItem.id;
  };

  const clear = () => {
    // Keep minimum items
    if (min > 0) {
      const emptyItems = Array.from({ length: min }, () =>
        createItem(defaultItem())
      );
      items.set(emptyItems);
    } else {
      items.set([]);
    }
  };

  const reset = (newItems?: T[]) => {
    const resetItems = newItems ?? initialItems;
    items.set(resetItems.map((data) => createItem(data)));
  };

  /**
   * TR: Tek bir öğeyi şemaya göre doğrular ve hatalarını günceller.
   *
   * EN: Validates a single item against schema and updates its errors.
   */
  const validateItem = (id: string): boolean => {
    if (!schema) return true;

    const item = items().find((i) => i.id === id);
    if (!item) return false;

    const result = schema.safeParse(item.data);

    if (result.success) {
      items.update((list) =>
        list.map((i) =>
          i.id === id ? { ...i, errors: {} } : i
        )
      );
      return true;
    }

    const errors: Record<string, string | null> = {};
    for (const error of result.error.errors) {
      const path = error.path.join('.');
      errors[path] = error.message;
    }

    items.update((list) =>
      list.map((i) =>
        i.id === id ? { ...i, errors } : i
      )
    );

    return false;
  };

  const validateAll = (): boolean => {
    touchAll();
    let allValid = true;

    for (const item of items()) {
      if (!validateItem(item.id)) {
        allValid = false;
      }
    }

    return allValid;
  };

  const touchItem = (id: string) => {
    items.update((list) =>
      list.map((item) =>
        item.id === id ? { ...item, touched: true } : item
      )
    );
  };

  const touchAll = () => {
    items.update((list) =>
      list.map((item) => ({ ...item, touched: true }))
    );
  };

  const toggleCollapse = (id: string) => {
    if (!collapsible) return;

    items.update((list) =>
      list.map((item) =>
        item.id === id ? { ...item, collapsed: !item.collapsed } : item
      )
    );
  };

  const collapseAll = () => {
    if (!collapsible) return;

    items.update((list) =>
      list.map((item) => ({ ...item, collapsed: true }))
    );
  };

  const expandAll = () => {
    items.update((list) =>
      list.map((item) => ({ ...item, collapsed: false }))
    );
  };

  const getItem = (id: string): RepeaterItem<T> | undefined => {
    return items().find((item) => item.id === id);
  };

  const getIndex = (id: string): number => {
    return items().findIndex((item) => item.id === id);
  };

  // TR: Min sayıya ulaşana kadar otomatik öğe ekle
  // EN: Automatically add items until min count is reached
  if (items().length < min) {
    const needed = min - items().length;
    for (let i = 0; i < needed; i++) {
      add();
    }
  }

  return {
    items: items.asReadonly(),
    count,
    isEmpty,
    canAdd,
    canRemove,
    isValid,
    hasErrors,
    values,
    add,
    remove,
    update,
    move,
    duplicate,
    clear,
    reset,
    validateItem,
    validateAll,
    touchItem,
    touchAll,
    toggleCollapse,
    collapseAll,
    expandAll,
    getItem,
    getIndex,
  };
}

/**
 * TR: İç içe geçmiş (Nested) tekrarlayıcı yapılandırması.
 * Ebeveyn (Parent) ve Çocuk (Child) yapılandırmalarını birleştirir.
 *
 * EN: Nested repeater configuration.
 * Combines Parent and Child configurations.
 */
export interface NestedRepeaterConfig<T, C> extends RepeaterConfig<T> {
  childConfig: RepeaterConfig<C>;
  childKey: keyof T;
}

/**
 * TR: İç içe tekrarlayıcı oluşturur (Recursive Repeater).
 * Her ebeveyn öğesi için dinamik olarak bir çocuk tekrarlayıcı oluşturur ve bunları bir Map'te saklar.
 *
 * EN: Creates nested repeater (Recursive Repeater).
 * Dynamically creates a child repeater for each parent item and stores them in a Map.
 */
export function createNestedRepeater<
  T extends Record<string, unknown>,
  C extends Record<string, unknown>
>(
  initialItems: (T & { [K in keyof T]: T[K] extends C[] ? C[] : T[K] })[] = [],
  config: NestedRepeaterConfig<T, C>
) {
  const { childConfig, childKey, ...parentConfig } = config;

  const parent = createRepeater<T>(initialItems, parentConfig);
  // TR: ID -> ChildRepeater eşleşmesi
  // EN: ID -> ChildRepeater map
  const childRepeaters = new Map<string, RepeaterState<C>>();

  /**
   * TR: Bir ebeveyn öğesine ait çocuk tekrarlayıcıyı getirir veya oluşturur (Lazy Initialization).
   *
   * EN: Gets or creates (Lazy Initialization) the child repeater for a parent item.
   */
  const getChildRepeater = (parentId: string): RepeaterState<C> | undefined => {
    if (!childRepeaters.has(parentId)) {
      const parentItem = parent.getItem(parentId);
      if (parentItem) {
        const childData = (parentItem.data[childKey] as C[]) ?? [];
        const childRepeater = createRepeater<C>(childData, childConfig);
        childRepeaters.set(parentId, childRepeater);
      }
    }
    return childRepeaters.get(parentId);
  };

  // Override parent add to create child repeater
  const originalAdd = parent.add;
  const add = (data?: Partial<T>, index?: number): string => {
    const id = originalAdd(data, index);
    if (id) {
      getChildRepeater(id);
    }
    return id;
  };

  // Override parent remove to cleanup child repeater
  const originalRemove = parent.remove;
  const remove = (id: string): boolean => {
    const result = originalRemove(id);
    if (result) {
      childRepeaters.delete(id);
    }
    return result;
  };

  /**
   * TR: Ebeveyn ve çocuk verilerini birleştirerek tam veri yapısını döndürür.
   *
   * EN: Merges parent and child data and returns the full data structure.
   */
  const getAllValues = (): T[] => {
    return parent.items().map((item) => {
      const childRepeater = childRepeaters.get(item.id);
      return {
        ...item.data,
        [childKey]: childRepeater?.values() ?? [],
      } as T;
    });
  };

  return {
    parent: { ...parent, add, remove },
    getChildRepeater,
    getAllValues,
  };
}

/**
 * TR: Sürükle-Bırak (Drag & Drop) işlemleri için yardımcı durum yöneticisi.
 * Hangi öğenin sürüklendiğini ve nereye bırakılacağını takip eder.
 *
 * EN: Helper state manager for Drag & Drop operations.
 * Tracks which item is being dragged and where it will be dropped.
 */
export interface DragState {
  dragging: Signal<string | null>;
  dragOver: Signal<string | null>;
  startDrag: (id: string) => void;
  enterDrag: (id: string) => void;
  endDrag: () => void;
  drop: (repeater: RepeaterState<unknown>) => void;
}

export function createDragState(): DragState {
  const dragging = signal<string | null>(null);
  const dragOver = signal<string | null>(null);

  const startDrag = (id: string) => {
    dragging.set(id);
  };

  const enterDrag = (id: string) => {
    if (dragging() && dragging() !== id) {
      dragOver.set(id);
    }
  };

  const endDrag = () => {
    dragging.set(null);
    dragOver.set(null);
  };

  const drop = (repeater: RepeaterState<unknown>) => {
    const fromId = dragging();
    const toId = dragOver();

    if (fromId && toId && fromId !== toId) {
      const fromIndex = repeater.getIndex(fromId);
      const toIndex = repeater.getIndex(toId);
      repeater.move(fromIndex, toIndex);
    }

    endDrag();
  };

  return {
    dragging: dragging.asReadonly(),
    dragOver: dragOver.asReadonly(),
    startDrag,
    enterDrag,
    endDrag,
    drop,
  };
}