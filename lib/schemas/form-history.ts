import { signal, computed, Signal, WritableSignal } from '@angular/core';

/**
 * TR: Zaman damgası ve etiket bilgisiyle birlikte kaydedilmiş bir geçmiş durumu.
 * Her bir geri alma adımı (step) bu yapıda tutulur.
 *
 * EN: A history state recorded with a timestamp and label information.
 * Each undo step is stored in this structure.
 *
 * @template T - TR: Durum verisinin tipi. / EN: Type of the state data.
 */
export interface HistoryEntry<T> {
  /**
   * TR: O andaki durum verisi (Snapshot).
   *
   * EN: State data at that moment (Snapshot).
   */
  state: T;

  /**
   * TR: Kaydın oluşturulduğu zaman (Unix timestamp).
   *
   * EN: Time the record was created (Unix timestamp).
   */
  timestamp: number;

  /**
   * TR: Kayda verilen özel isim (Örn: "Taslak Kaydedildi").
   * Checkpoint işlemleri için kullanılır.
   *
   * EN: Special name given to the record (E.g., "Draft Saved").
   * Used for checkpoint operations.
   */
  label?: string;
}

/**
 * TR: Form tarihçesini yöneten API arayüzü.
 * Geçmiş (Past) ve Gelecek (Future) yığınlarını yöneterek zamanda ileri-geri gitmeyi sağlar.
 * Angular Signals tabanlı olduğu için UI güncellemeleri otomatiktir.
 *
 * EN: API interface managing the form history.
 * Enables moving back and forth in time by managing Past and Future stacks.
 * UI updates are automatic as it is based on Angular Signals.
 *
 * @template T - TR: Form verisinin tipi. / EN: Type of the form data.
 */
export interface FormHistory<T> {
  /**
   * TR: Geri alma işleminin mümkün olup olmadığını (Geçmişte kayıt var mı?) belirtir.
   *
   * EN: Indicates if undo operation is possible (Is there a record in the past?).
   */
  canUndo: Signal<boolean>;

  /**
   * TR: Yineleme işleminin mümkün olup olmadığını (Gelecekte kayıt var mı?) belirtir.
   *
   * EN: Indicates if redo operation is possible (Is there a record in the future?).
   */
  canRedo: Signal<boolean>;

  /**
   * TR: Geçmiş yığınındaki kayıt sayısı.
   *
   * EN: Number of records in the past stack.
   */
  pastCount: Signal<number>;

  /**
   * TR: Gelecek yığınındaki kayıt sayısı.
   *
   * EN: Number of records in the future stack.
   */
  futureCount: Signal<number>;

  /**
   * TR: Mevcut durumun etiketi (varsa).
   *
   * EN: Label of the current state (if any).
   */
  currentLabel: Signal<string | undefined>;

  /**
   * TR: Son değişikliği geri alır.
   * Mevcut durumu geleceğe (future) atar, geçmişten (past) bir öncekini getirir.
   *
   * EN: Undoes the last change.
   * Moves the current state to future, brings the previous one from past.
   */
  undo: () => T | undefined;

  /**
   * TR: Geri alınan değişikliği tekrar uygular.
   * Mevcut durumu geçmişe (past) atar, gelecekten (future) bir sonrakini getirir.
   *
   * EN: Redoes the undone change.
   * Moves the current state to past, brings the next one from future.
   */
  redo: () => T | undefined;

  /**
   * TR: Yeni bir durumu tarihçeye ekler.
   * Debounce süresi tanımlıysa, hızlı değişiklikleri bekletip tek seferde kaydeder.
   *
   * EN: Pushes a new state to history.
   * If debounce time is defined, waits for rapid changes and saves them at once.
   */
  push: (state: T, label?: string) => void;

  /**
   * TR: Mevcut duruma bir isim (etiket) vererek onu bir kontrol noktası yapar.
   *
   * EN: Marks the current state as a checkpoint by giving it a name (label).
   */
  checkpoint: (label: string) => void;

  /**
   * TR: Belirli bir etikete sahip duruma doğrudan atlar.
   * Aradaki tüm adımları uygun şekilde geçmiş veya gelecek yığınına taşır.
   *
   * EN: Jumps directly to a state with a specific label.
   * Moves all intermediate steps to the past or future stack appropriately.
   */
  goToCheckpoint: (label: string) => T | undefined;

  /**
   * TR: Tüm geçmiş ve gelecek kayıtlarındaki etiketli noktaları listeler.
   *
   * EN: Lists labeled points in all past and future records.
   */
  getCheckpoints: () => string[];

  /**
   * TR: Tüm tarihçeyi temizler (Sadece mevcut durum kalır).
   *
   * EN: Clears all history (Only current state remains).
   */
  clear: () => void;

  /**
   * TR: Anlık durumu döndürür.
   *
   * EN: Returns the current state.
   */
  current: () => T | undefined;
}

/**
 * TR: Tarihçe yapılandırma seçenekleri.
 * Hafıza yönetimi için maksimum boyut ve performans için debounce ayarı içerir.
 *
 * EN: History configuration options.
 * Includes max size for memory management and debounce setting for performance.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface FormHistoryOptions {
  /**
   * TR: Saklanacak maksimum geçmiş adım sayısı.
   * Varsayılan: 50. Limit aşılırsa en eski kayıt silinir.
   *
   * EN: Maximum number of history steps to keep.
   * Default: 50. If limit is exceeded, the oldest record is deleted.
   */
  maxSize?: number;

  /**
   * TR: Kayıt ekleme sıklığını sınırlayan gecikme süresi (ms).
   * Kullanıcı hızlı yazarken her tuş vuruşunu kaydetmemek için kullanılır.
   *
   * EN: Delay time (ms) limiting the frequency of adding records.
   * Used to avoid recording every keystroke while the user is typing fast.
   */
  debounceMs?: number;
}

/**
 * TR: Form durumunun zaman çizelgesini (Timeline) yöneten fabrika fonksiyonu.
 * İmmutable (değişmez) veri yapısı prensibiyle çalışır; her değişiklikte durumun kopyası saklanır.
 * Checkpoint mekanizması sayesinde karmaşık formlarda "Kaydedilen son duruma dön" özelliği sunar.
 *
 * EN: Factory function managing the timeline of the form state.
 * Works on the principle of immutable data structure; a copy of the state is stored on every change.
 * Offers "Revert to last saved state" feature in complex forms thanks to Checkpoint mechanism.
 *
 * @param initialState - TR: Başlangıç durumu. / EN: Initial state.
 * @param options - TR: Ayarlar. / EN: Options.
 * @returns TR: Yönetilebilir tarihçe nesnesi. / EN: Manageable history object.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export function createFormHistory<T>(
  initialState: T,
  options: FormHistoryOptions = {}
): FormHistory<T> {
  const { maxSize = 50, debounceMs = 0 } = options;

  const past = signal<HistoryEntry<T>[]>([]);
  const future = signal<HistoryEntry<T>[]>([]);
  const currentEntry = signal<HistoryEntry<T>>({
    state: initialState,
    timestamp: Date.now(),
  });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingState: T | null = null;

  const canUndo = computed(() => past().length > 0);
  const canRedo = computed(() => future().length > 0);
  const pastCount = computed(() => past().length);
  const futureCount = computed(() => future().length);
  const currentLabel = computed(() => currentEntry().label);

  /**
   * TR: Yeni bir durumu tarihçeye ekler (Public API).
   * Debounce ayarına göre ya hemen ekler ya da beklemeye alır.
   *
   * EN: Pushes a new state to history (Public API).
   * Either adds immediately or queues it based on debounce setting.
   */
  const push = (state: T, label?: string) => {
    // Debounce if configured
    if (debounceMs > 0) {
      pendingState = state;
      
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        if (pendingState !== null) {
          doPush(pendingState, label);
          pendingState = null;
        }
      }, debounceMs);
    } else {
      doPush(state, label);
    }
  };

  /**
   * TR: Gerçek ekleme işlemini yapan dahili fonksiyon.
   * Mevcut durumu geçmişe atar, yeni durumu set eder ve geleceği (Future) temizler.
   * Yeni bir dal (branch) oluştuğu için Redo geçmişi silinir.
   *
   * EN: Internal function performing the actual push operation.
   * Moves current state to past, sets new state, and clears Future.
   * Redo history is cleared as a new branch is created.
   */
  const doPush = (state: T, label?: string) => {
    // Move current to past
    past.update((p) => {
      const newPast = [...p, currentEntry()];
      // Trim if exceeds max size
      if (newPast.length > maxSize) {
        return newPast.slice(-maxSize);
      }
      return newPast;
    });

    // Set new current
    currentEntry.set({
      state,
      timestamp: Date.now(),
      label,
    });

    // Clear future (new branch)
    future.set([]);
  };

  /**
   * TR: Geri alma işlemini gerçekleştirir.
   *
   * EN: Performs the undo operation.
   */
  const undo = (): T | undefined => {
    const pastList = past();
    if (pastList.length === 0) return undefined;

    // Move current to future
    future.update((f) => [currentEntry(), ...f]);

    // Pop from past
    const lastPast = pastList[pastList.length - 1];
    past.set(pastList.slice(0, -1));
    currentEntry.set(lastPast);

    return lastPast.state;
  };

  /**
   * TR: Yineleme işlemini gerçekleştirir.
   *
   * EN: Performs the redo operation.
   */
  const redo = (): T | undefined => {
    const futureList = future();
    if (futureList.length === 0) return undefined;

    // Move current to past
    past.update((p) => [...p, currentEntry()]);

    // Pop from future
    const [nextFuture, ...rest] = futureList;
    future.set(rest);
    currentEntry.set(nextFuture);

    return nextFuture.state;
  };

  /**
   * TR: Mevcut duruma bir etiket atar.
   *
   * EN: Assigns a label to the current state.
   */
  const checkpoint = (label: string) => {
    currentEntry.update((entry) => ({
      ...entry,
      label,
    }));
  };

  /**
   * TR: İsimlendirilmiş bir duruma zaman yolculuğu yapar.
   * Hedef geçmişteyse aradakileri geleceğe, gelecekteyse aradakileri geçmişe taşıyarak veri kaybını önler.
   *
   * EN: Time travels to a named state.
   * Prevents data loss by moving intermediate states to future if target is in past, or to past if target is in future.
   */
  const goToCheckpoint = (label: string): T | undefined => {
    // Search in past
    const pastList = past();
    const pastIndex = pastList.findIndex((e) => e.label === label);
    
    if (pastIndex !== -1) {
      // Move everything after pastIndex to future
      const newFuture = [...pastList.slice(pastIndex + 1), currentEntry(), ...future()];
      future.set(newFuture);

      // Set checkpoint as current
      const checkpointEntry = pastList[pastIndex];
      currentEntry.set(checkpointEntry);

      // Trim past
      past.set(pastList.slice(0, pastIndex));

      return checkpointEntry.state;
    }

    // Search in current
    if (currentEntry().label === label) {
      return currentEntry().state;
    }

    // Search in future
    const futureList = future();
    const futureIndex = futureList.findIndex((e) => e.label === label);
    
    if (futureIndex !== -1) {
      // Move everything before futureIndex to past
      const newPast = [...past(), currentEntry(), ...futureList.slice(0, futureIndex)];
      past.set(newPast.slice(-maxSize));

      // Set checkpoint as current
      const checkpointEntry = futureList[futureIndex];
      currentEntry.set(checkpointEntry);

      // Trim future
      future.set(futureList.slice(futureIndex + 1));

      return checkpointEntry.state;
    }

    return undefined;
  };

  /**
   * TR: Tüm kayıtlı kontrol noktası isimlerini getirir.
   *
   * EN: Gets all recorded checkpoint names.
   */
  const getCheckpoints = (): string[] => {
    const checkpoints: string[] = [];
    
    for (const entry of past()) {
      if (entry.label) checkpoints.push(entry.label);
    }
    
    const currentLabelValue = currentEntry().label;
    if (currentLabelValue) {
      checkpoints.push(currentLabelValue);
    }
    
    for (const entry of future()) {
      if (entry.label) checkpoints.push(entry.label);
    }
    
    return checkpoints;
  };

  const clear = () => {
    past.set([]);
    future.set([]);
    currentEntry.set({
      state: currentEntry().state,
      timestamp: Date.now(),
    });
  };

  const current = (): T | undefined => {
    return currentEntry().state;
  };

  return {
    canUndo,
    canRedo,
    pastCount,
    futureCount,
    currentLabel,
    undo,
    redo,
    push,
    checkpoint,
    goToCheckpoint,
    getCheckpoints,
    clear,
    current,
  };
}

/**
 * TR: Durum anlık görüntüsü (Snapshot) almak için derin kopyalama yardımcısı.
 * Referans tipli verilerin (Object, Array, Date) geçmişte değişmesini engeller.
 * JSON.parse/stringify yönteminden daha güvenlidir (Date objelerini korur).
 *
 * EN: Deep clone helper to take state snapshot.
 * Prevents reference type data (Object, Array, Date) from changing in history.
 * Safer than JSON.parse/stringify method (Preserves Date objects).
 *
 * @param obj - TR: Kopyalanacak nesne. / EN: Object to clone.
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Map) {
    const clonedMap = new Map();
    obj.forEach((value, key) => {
      clonedMap.set(deepClone(key), deepClone(value));
    });
    return clonedMap as unknown as T;
  }

  if (obj instanceof Set) {
    const clonedSet = new Set();
    obj.forEach((value) => {
      clonedSet.add(deepClone(value));
    });
    return clonedSet as unknown as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}