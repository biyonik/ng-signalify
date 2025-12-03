import { signal, computed, Signal, WritableSignal } from '@angular/core';

/**
 * TR: Asenkron validasyon fonksiyonunun tipi.
 * Bir değer alır ve Promise içinde hata mesajı (string) veya null döner.
 *
 * EN: Type of the asynchronous validation function.
 * Takes a value and returns a Promise resolving to an error message (string) or null.
 */
export type AsyncValidateFn<T> = (value: T) => Promise<string | null>;

/**
 * TR: Asenkron validatörün durumunu ve kontrol metodlarını tanımlayan arayüz.
 * Yüklenme durumu (validating), hata mesajı ve manuel tetikleme fonksiyonlarını içerir.
 *
 * EN: Interface defining the state and control methods of the async validator.
 * Includes loading state (validating), error message, and manual trigger functions.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface AsyncValidatorState {
  /**
   * TR: Validasyon işleminin devam edip etmediğini gösteren sinyal.
   * UI'da "Loading..." spinner'ı göstermek için kullanılır.
   *
   * EN: Signal indicating whether the validation process is ongoing.
   * Used to show a "Loading..." spinner in the UI.
   */
  validating: Signal<boolean>;

  /**
   * TR: Validasyon sonucunda oluşan hata mesajı.
   *
   * EN: Error message resulting from the validation.
   */
  error: Signal<string | null>;

  /**
   * TR: Validasyonu başlatan asenkron metod.
   *
   * EN: Async method that triggers validation.
   */
  validate: (value: unknown) => Promise<void>;

  /**
   * TR: Bekleyen validasyon işlemini iptal eder.
   *
   * EN: Cancels the pending validation process.
   */
  cancel: () => void;

  /**
   * TR: Validatör durumunu (hata ve yüklenme) sıfırlar.
   *
   * EN: Resets the validator state (error and loading).
   */
  reset: () => void;
}

/**
 * TR: Gecikmeli (Debounced) ve İptal Edilebilir (Cancellable) asenkron validatör oluşturur.
 * Kullanıcı hızlı yazı yazarken sunucuyu gereksiz isteklerle yormamak için 'debounce' uygular.
 * Yeni bir istek geldiğinde önceki isteği `AbortController` ile iptal eder (Race condition önlemi).
 *
 * EN: Creates a Debounced and Cancellable async validator.
 * Applies 'debounce' to avoid overwhelming the server with unnecessary requests while the user is typing fast.
 * Cancels the previous request using `AbortController` when a new request arrives (Race condition prevention).
 *
 * @param validateFn - TR: Çalıştırılacak asenkron fonksiyon (API isteği vb.). / EN: Async function to execute (API request, etc.).
 * @param debounceMs - TR: Bekleme süresi (milisaniye). Varsayılan: 300ms. / EN: Wait time (milliseconds). Default: 300ms.
 * @returns TR: Yönetilebilir asenkron validatör nesnesi. / EN: Manageable async validator object.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export function createAsyncValidator<T>(
  validateFn: AsyncValidateFn<T>,
  debounceMs = 300
): AsyncValidatorState {
  const validating = signal(false);
  const error = signal<string | null>(null);

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let abortController: AbortController | null = null;

  /**
   * TR: Aktif zamanlayıcıyı ve varsa devam eden API isteğini iptal eder.
   *
   * EN: Cancels the active timer and any ongoing API request.
   */
  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    validating.set(false);
  };

  /**
   * TR: Validatörü temizler.
   *
   * EN: Resets the validator.
   */
  const reset = () => {
    cancel();
    error.set(null);
  };

  /**
   * TR: Doğrulama sürecini başlatır.
   *
   * EN: Starts the validation process.
   */
  const validate = async (value: unknown): Promise<void> => {
    // TR: Önceki bekleyen işlemi iptal et
    // EN: Cancel previous pending operation
    cancel();

    // TR: Boş değerleri atla (valid kabul et veya hata sil)
    // EN: Skip empty values (accept as valid or clear error)
    if (value == null || value === '') {
      error.set(null);
      return;
    }

    // TR: Debounce mekanizması
    // EN: Debounce mechanism
    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        validating.set(true);
        // TR: Yeni bir iptal kontrolcüsü oluştur
        // EN: Create a new abort controller
        abortController = new AbortController();

        try {
          const result = await validateFn(value as T);
          
          // TR: İstek tamamlandı ama arada iptal edildiyse sonucu yoksay
          // EN: If request completed but was aborted in the meantime, ignore result
          if (abortController?.signal.aborted) {
            resolve();
            return;
          }

          error.set(result);
        } catch (e) {
          if (abortController?.signal.aborted) {
            resolve();
            return;
          }
          error.set('Doğrulama sırasında hata oluştu');
        } finally {
          validating.set(false);
          resolve();
        }
      }, debounceMs);
    });
  };

  return { validating, error, validate, cancel, reset };
}

/**
 * TR: Toplu (Batch) asenkron validatör yöneticisi.
 * Birden fazla alanın (örn: username, email, tcKimlik) asenkron kontrollerini tek bir çatı altında toplar.
 * Alan bazlı veya toplu validasyon yapabilir.
 *
 * EN: Batch async validator manager.
 * Centralizes asynchronous checks for multiple fields (e.g., username, email, taxId) under one roof.
 * Can perform field-based or batch validation.
 *
 * @param validators - TR: Alan adı ve doğrulama fonksiyonu eşleşmeleri. / EN: Map of field names and validation functions.
 * @param debounceMs - TR: Gecikme süresi. / EN: Debounce duration.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export function createBatchAsyncValidator(
  validators: Map<string, AsyncValidateFn<unknown>>,
  debounceMs = 300
): {
  validating: Signal<boolean>;
  errors: Signal<Record<string, string | null>>;
  validate: (values: Record<string, unknown>) => Promise<void>;
  validateField: (name: string, value: unknown) => Promise<void>;
  reset: () => void;
} {
  const fieldValidators = new Map<string, AsyncValidatorState>();
  
  // TR: Her alan için ayrı bir validatör instance'ı oluştur
  // EN: Create a separate validator instance for each field
  validators.forEach((fn, name) => {
    fieldValidators.set(name, createAsyncValidator(fn, debounceMs));
  });

  // TR: Herhangi bir alan "yükleniyor" ise genel durum "yükleniyor" olur.
  // EN: If any field is "loading", the overall state becomes "loading".
  const validating = computed(() => {
    for (const v of fieldValidators.values()) {
      if (v.validating()) return true;
    }
    return false;
  });

  // TR: Tüm alanların hatalarını tek bir objede toplar.
  // EN: Aggregates errors from all fields into a single object.
  const errors = computed(() => {
    const result: Record<string, string | null> = {};
    fieldValidators.forEach((v, name) => {
      result[name] = v.error();
    });
    return result;
  });

  /**
   * TR: Verilen tüm değerler için ilgili validatörleri çalıştırır.
   *
   * EN: Runs relevant validators for all provided values.
   */
  const validate = async (values: Record<string, unknown>) => {
    const promises: Promise<void>[] = [];
    fieldValidators.forEach((validator, name) => {
      if (name in values) {
        promises.push(validator.validate(values[name]));
      }
    });
    await Promise.all(promises);
  };

  /**
   * TR: Sadece belirli bir alanı validasyona sokar.
   *
   * EN: Validates only a specific field.
   */
  const validateField = async (name: string, value: unknown) => {
    const validator = fieldValidators.get(name);
    if (validator) {
      await validator.validate(value);
    }
  };

  /**
   * TR: Tüm validatörleri sıfırlar.
   *
   * EN: Resets all validators.
   */
  const reset = () => {
    fieldValidators.forEach((v) => v.reset());
  };

  return { validating, errors, validate, validateField, reset };
}