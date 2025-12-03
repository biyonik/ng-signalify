import { signal, Signal, WritableSignal } from '@angular/core';

/**
 * TR: Sinyal değişikliklerini izleyen ajan (Spy) arayüzü.
 * Bir sinyalin aldığı tüm değerleri, çağrılma sayısını ve ilk/son değerlerini takip eder.
 *
 * EN: Agent (Spy) interface tracking signal changes.
 * Tracks all values received by a signal, call count, and first/last values.
 *
 * @template T - TR: Takip edilen değerin tipi. / EN: Type of the tracked value.
 */
export interface SignalSpy<T> {
  /**
   * TR: Kaydedilen tüm değerler dizisi.
   *
   * EN: Array of all recorded values.
   */
  values: T[];

  /**
   * TR: Değerin kaç kez değiştiği.
   *
   * EN: How many times the value has changed.
   */
  callCount: number;

  /**
   * TR: En son alınan değer.
   *
   * EN: The last received value.
   */
  lastValue: T | undefined;

  /**
   * TR: İlk alınan değer.
   *
   * EN: The first received value.
   */
  firstValue: T | undefined;

  /**
   * TR: Sinyalin belirli bir değeri alıp almadığını kontrol eder.
   * Derin eşitlik (Deep Equality) kontrolü yapar.
   *
   * EN: Checks if the signal has received a specific value.
   * Performs Deep Equality check.
   */
  wasCalledWith: (value: T) => boolean;

  /**
   * TR: Kayıtları temizler.
   *
   * EN: Clears records.
   */
  clear: () => void;

  /**
   * TR: İzlemeyi durdurur.
   *
   * EN: Stops tracking.
   */
  destroy: () => void;
}

/**
 * TR: Mevcut bir sinyali izlemek için casus (Spy) oluşturur.
 * Test ortamında `effect` kullanımı bazen karmaşık olabileceğinden,
 * basit bir polling mekanizması ile değişiklikleri yakalar.
 *
 * EN: Creates a spy to track an existing signal.
 * Since using `effect` in test environment can be complex sometimes,
 * captures changes with a simple polling mechanism.
 *
 * @param sig - TR: İzlenecek sinyal. / EN: Signal to track.
 * @returns TR: Sinyal casusu. / EN: Signal spy.
 */
export function spyOnSignal<T>(sig: Signal<T>): SignalSpy<T> {
  const values: T[] = [];
  let destroyed = false;

  // Record initial value
  values.push(sig());

  // TR: Gerçek Angular ortamında effect() gerekir, burada polling ile simüle ediyoruz
  // EN: Requires effect() in real Angular context, simulating with polling here
  const interval = setInterval(() => {
    if (destroyed) return;
    const current = sig();
    if (values.length === 0 || values[values.length - 1] !== current) {
      values.push(current);
    }
  }, 10);

  return {
    get values() {
      return [...values];
    },
    get callCount() {
      return values.length;
    },
    get lastValue() {
      return values[values.length - 1];
    },
    get firstValue() {
      return values[0];
    },
    wasCalledWith(value: T) {
      return values.some((v) => deepEqual(v, value));
    },
    clear() {
      values.length = 0;
    },
    destroy() {
      destroyed = true;
      clearInterval(interval);
    },
  };
}

/**
 * TR: Casus yeteneklerine sahip sahte (Mock) bir sinyal oluşturur.
 * `set` ve `update` metodlarını override ederek her değişikliği kaydeder.
 *
 * EN: Creates a mock signal with spy capabilities.
 * Overrides `set` and `update` methods to record every change.
 */
export function createMockSignal<T>(initialValue: T): WritableSignal<T> & SignalSpy<T> {
  const values: T[] = [initialValue];
  const sig = signal(initialValue);

  const mockSignal = Object.assign(sig, {
    get values() {
      return [...values];
    },
    get callCount() {
      return values.length;
    },
    get lastValue() {
      return values[values.length - 1];
    },
    get firstValue() {
      return values[0];
    },
    wasCalledWith(value: T) {
      return values.some((v) => deepEqual(v, value));
    },
    clear() {
      values.length = 0;
      values.push(sig());
    },
    destroy() {},
  });

  // Override set to track values
  const originalSet = sig.set.bind(sig);
  sig.set = (value: T) => {
    values.push(value);
    originalSet(value);
  };

  const originalUpdate = sig.update.bind(sig);
  sig.update = (fn: (value: T) => T) => {
    originalUpdate(fn);
    values.push(sig());
  };

  return mockSignal as WritableSignal<T> & SignalSpy<T>;
}

/**
 * TR: Bir sinyalin belirli bir koşulu sağlamasını bekler (Async Test).
 * Asenkron işlemlerin sonucunu test etmek için kullanılır.
 *
 * EN: Waits for a signal to satisfy a specific condition (Async Test).
 * Used to test the result of asynchronous operations.
 *
 * @param sig - TR: İzlenecek sinyal. / EN: Signal to watch.
 * @param predicate - TR: Koşul fonksiyonu. / EN: Predicate function.
 * @param timeout - TR: Zaman aşımı süresi (ms). / EN: Timeout duration (ms).
 */
export async function waitForSignal<T>(
  sig: Signal<T>,
  predicate: (value: T) => boolean,
  timeout = 5000
): Promise<T> {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      const value = sig();
      if (predicate(value)) {
        resolve(value);
        return;
      }

      if (Date.now() - start > timeout) {
        reject(new Error(`Signal timeout: condition not met within ${timeout}ms`));
        return;
      }

      setTimeout(check, 10);
    };

    check();
  });
}

/**
 * TR: Bir sinyalin belirli bir değere eşit olmasını bekler.
 *
 * EN: Waits for a signal to equal a specific value.
 */
export function waitForValue<T>(sig: Signal<T>, value: T, timeout = 5000): Promise<T> {
  return waitForSignal(sig, (v) => deepEqual(v, value), timeout);
}

/**
 * TR: Testler için sahte HTTP İstemcisi.
 * Jest Mock fonksiyonlarını kullanır (eğer ortamda varsa).
 *
 * EN: Mock HTTP Client for tests.
 * Uses Jest Mock functions (if available in the environment).
 */
export interface MockHttpClient {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
  mockResponse: <T>(method: string, response: T) => void;
  mockError: (method: string, error: Error) => void;
  reset: () => void;
}

/**
 * TR: Mock HTTP İstemcisi oluşturur.
 * Jest ortamında değilse basit bir mock implementasyonu sağlar.
 *
 * EN: Creates a Mock HTTP Client.
 * Provides a simple mock implementation if not in Jest environment.
 */
export function createMockHttpClient(): MockHttpClient {
  const createMockFn = () => {
    if (typeof jest !== 'undefined') {
      return jest.fn();
    }
    // Fallback for non-Jest environments
    const calls: unknown[][] = [];
    const fn = (...args: unknown[]) => {
      calls.push(args);
      return fn._mockReturnValue;
    };
    fn.mockResolvedValue = (value: unknown) => {
      fn._mockReturnValue = Promise.resolve(value);
      return fn;
    };
    fn.mockRejectedValue = (error: unknown) => {
      fn._mockReturnValue = Promise.reject(error);
      return fn;
    };
    fn.mockClear = () => {
      calls.length = 0;
    };
    fn._mockReturnValue = Promise.resolve(undefined);
    fn.mock = { calls };
    return fn;
  };

  const methods = {
    get: createMockFn(),
    post: createMockFn(),
    put: createMockFn(),
    patch: createMockFn(),
    delete: createMockFn(),
  };

  return {
    ...methods,
    mockResponse<T>(method: string, response: T) {
      const m = methods[method as keyof typeof methods];
      if (m) {
        m.mockResolvedValue({ data: response, status: 200, ok: true });
      }
    },
    mockError(method: string, error: Error) {
      const m = methods[method as keyof typeof methods];
      if (m) {
        m.mockRejectedValue(error);
      }
    },
    reset() {
      Object.values(methods).forEach((m) => m.mockClear());
    },
  };
}

/**
 * TR: Varlık testleri için Mock Store.
 *
 * EN: Mock Store for entity tests.
 */
export function createMockEntityStore<T extends { id: string | number }>(
  initialEntities: T[] = []
) {
  const entities = signal<T[]>(initialEntities);
  const loading = signal(false);
  const error = signal<string | null>(null);

  return {
    entities: entities.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),

    // Actions
    setEntities: (data: T[]) => entities.set(data),
    addEntity: (entity: T) => entities.update((e) => [...e, entity]),
    updateEntity: (id: T['id'], data: Partial<T>) =>
      entities.update((e) => e.map((item) => (item.id === id ? { ...item, ...data } : item))),
    removeEntity: (id: T['id']) => entities.update((e) => e.filter((item) => item.id !== id)),
    setLoading: (value: boolean) => loading.set(value),
    setError: (value: string | null) => error.set(value),
    reset: () => {
      entities.set(initialEntities);
      loading.set(false);
      error.set(null);
    },
  };
}

/**
 * TR: Form test yardımcıları.
 *
 * EN: Form test helpers.
 */
export interface FormTestHelper<T extends Record<string, unknown>> {
  setValue: (field: keyof T, value: unknown) => void;
  setValues: (values: Partial<T>) => void;
  submit: () => Promise<void>;
  reset: () => void;
  getErrors: () => Record<string, string | null>;
  isValid: () => boolean;
  isDirty: () => boolean;
}

/**
 * TR: Karmaşık form yapısını test etmek için basitleştirilmiş bir arayüz oluşturur.
 *
 * EN: Creates a simplified interface for testing complex form structure.
 */
export function createFormTestHelper<T extends Record<string, unknown>>(
  form: {
    fields: Record<keyof T, { value: WritableSignal<unknown>; error: Signal<string | null> }>;
    signals: { valid: Signal<boolean>; dirty: Signal<boolean> };
    validateAll: () => Promise<boolean>;
    reset: () => void;
  }
): FormTestHelper<T> {
  return {
    setValue(field, value) {
      form.fields[field]?.value.set(value);
    },
    setValues(values) {
      for (const [key, value] of Object.entries(values)) {
        form.fields[key as keyof T]?.value.set(value);
      }
    },
    async submit() {
      await form.validateAll();
    },
    reset() {
      form.reset();
    },
    getErrors() {
      const errors: Record<string, string | null> = {};
      for (const [key, field] of Object.entries(form.fields)) {
        errors[key] = (field as { error: Signal<string | null> }).error();
      }
      return errors;
    },
    isValid() {
      return form.signals.valid();
    },
    isDirty() {
      return form.signals.dirty();
    },
  };
}

/**
 * TR: Belirli bir koşul gerçekleşene kadar bekleyen yardımcı fonksiyon.
 *
 * EN: Helper function waiting until a specific condition is met.
 */
export async function waitFor(
  condition: () => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options;
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      if (condition()) {
        resolve();
        return;
      }

      if (Date.now() - start > timeout) {
        reject(new Error(`Timeout: condition not met within ${timeout}ms`));
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
}

/**
 * TR: Bekleyen tüm Promise'lerin tamamlanmasını sağlar (Event Loop'u boşaltır).
 *
 * EN: Ensures all pending Promises are completed (Flushes the Event Loop).
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * TR: Sahte zamanlayıcılar (Fake Timers).
 * `setTimeout` ve `Date.now` fonksiyonlarını override ederek zamanı manipüle etmeyi sağlar.
 * `advanceTimersByTime` ile zamanı ileri sarabilirsiniz.
 *
 * EN: Fake Timers.
 * Allows manipulating time by overriding `setTimeout` and `Date.now` functions.
 * You can fast-forward time with `advanceTimersByTime`.
 */
export function useFakeTimers() {
  let currentTime = Date.now();
  const timers: Array<{ callback: () => void; time: number; id: number }> = [];
  let nextId = 1;

  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const originalDateNow = Date.now;

  // Override
  (globalThis as unknown as { setTimeout: typeof setTimeout }).setTimeout = ((
    callback: () => void,
    delay: number
  ) => {
    const id = nextId++;
    timers.push({ callback, time: currentTime + delay, id });
    return id;
  }) as typeof setTimeout;

  (globalThis as unknown as { clearTimeout: typeof clearTimeout }).clearTimeout = ((id: number) => {
    const index = timers.findIndex((t) => t.id === id);
    if (index >= 0) timers.splice(index, 1);
  }) as typeof clearTimeout;

  Date.now = () => currentTime;

  return {
    advanceTimersByTime(ms: number) {
      currentTime += ms;
      const due = timers.filter((t) => t.time <= currentTime);
      due.forEach((t) => {
        t.callback();
        const index = timers.indexOf(t);
        if (index >= 0) timers.splice(index, 1);
      });
    },
    runAllTimers() {
      while (timers.length > 0) {
        const next = timers.reduce((min, t) => (t.time < min.time ? t : min));
        currentTime = next.time;
        next.callback();
        timers.splice(timers.indexOf(next), 1);
      }
    },
    restore() {
      (globalThis as unknown as { setTimeout: typeof setTimeout }).setTimeout = originalSetTimeout;
      (globalThis as unknown as { clearTimeout: typeof clearTimeout }).clearTimeout = originalClearTimeout;
      Date.now = originalDateNow;
    },
  };
}

/**
 * TR: Nesnelerin derinlemesine eşitliğini kontrol eder (Recursive).
 *
 * EN: Checks deep equality of objects (Recursive).
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }

  return false;
}

/**
 * TR: Test verisi üreticileri.
 * Rastgele string, sayı, e-posta ve tarih üretir.
 *
 * EN: Test data generators.
 * Generates random string, number, email, and date.
 */
export const testData = {
  string(length = 10): string {
    return Math.random().toString(36).substring(2, 2 + length);
  },

  number(min = 0, max = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  email(): string {
    return `${this.string(8)}@${this.string(5)}.com`;
  },

  date(start = new Date(2020, 0, 1), end = new Date()): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },

  array<T>(generator: () => T, count: number): T[] {
    return Array.from({ length: count }, generator);
  },

  user(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: this.number(1, 10000),
      name: `User ${this.string(5)}`,
      email: this.email(),
      createdAt: this.date().toISOString(),
      ...overrides,
    };
  },
};