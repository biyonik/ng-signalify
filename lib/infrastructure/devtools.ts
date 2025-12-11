import { signal, computed, Signal, effect } from '@angular/core';

/**
 * TR: Desteklenen log seviyeleri.
 * - debug: Geliştirici detayları.
 * - info: Genel bilgilendirme.
 * - warn: Uyarılar (Hata olmayan potansiyel sorunlar).
 * - error: Kritik hatalar.
 *
 * EN: Supported log levels.
 * - debug: Developer details.
 * - info: General information.
 * - warn: Warnings (Non-error potential issues).
 * - error: Critical errors.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * TR: Log kaydı yapısı.
 * Her kaydın benzersiz bir ID'si, zaman damgası, kategorisi ve mesajı vardır.
 * Hata durumunda yığın izi (Stack Trace) de tutulur.
 *
 * EN: Log entry structure.
 * Each entry has a unique ID, timestamp, category, and message.
 * Stack trace is also kept in case of error.
 */
export interface LogEntry {
  id: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  timestamp: number;
  stack?: string;
}

/**
 * TR: Geliştirici araçları (DevTools) yapılandırması.
 * Log seviyesi, maksimum kayıt sayısı ve performans izleme ayarlarını yönetir.
 *
 * EN: DevTools configuration.
 * Manages log level, maximum entries, and performance tracking settings.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface DevToolsConfig {
  /**
   * TR: DevTools aktif mi?
   *
   * EN: Is DevTools enabled?
   */
  enabled?: boolean;

  /**
   * TR: Minimum log seviyesi.
   *
   * EN: Minimum log level.
   */
  logLevel?: LogLevel;

  /**
   * TR: Tutulacak maksimum log sayısı (Hafıza yönetimi için).
   *
   * EN: Maximum log entries to keep (For memory management).
   */
  maxEntries?: number;

  /**
   * TR: Tarayıcı konsoluna da çıktı verilsin mi?
   *
   * EN: Log to browser console as well?
   */
  consoleOutput?: boolean;

  /**
   * TR: Performans takibi (Timing) yapılsın mı?
   *
   * EN: Track performance (Timing)?
   */
  trackPerformance?: boolean;

  /**
   * TR: Sinyal değişiklikleri izlensin mi?
   *
   * EN: Track signal changes?
   */
  trackSignals?: boolean;
}

/**
 * TR: Performans ölçüm kaydı.
 * Bir işlemin başlangıç, bitiş ve süresini (duration) tutar.
 *
 * EN: Performance measurement entry.
 * Holds start, end, and duration of an operation.
 */
export interface PerformanceEntry {
  id: number;
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  category: string;
  meta?: Record<string, unknown>;
}

/**
 * TR: Sinyal izleme kaydı.
 * Bir sinyalin eski ve yeni değerini, değişim zamanını ve kaynağını tutar.
 *
 * EN: Signal tracking entry.
 * Holds old and new values, change time, and source of a signal.
 */
export interface SignalTrackEntry {
  id: string;
  name: string;
  value: unknown;
  previousValue: unknown;
  timestamp: number;
  source?: string;
}

/**
 * TR: Sinyal tabanlı uygulamalar için Hata Ayıklama ve İzleme Aracı.
 * Loglama, performans profili çıkarma ve sinyal akışını izleme özelliklerini tek merkezde toplar.
 * Angular Signals ile tamamen entegre çalışır.
 *
 * EN: Debugging and Monitoring Tool for signal-based applications.
 * Centralizes logging, performance profiling, and signal flow tracking features.
 * Fully integrated with Angular Signals.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class DevTools {
  private config: Required<DevToolsConfig>;
  private logIdCounter = 0;
  private perfIdCounter = 0;

  private logs = signal<LogEntry[]>([]);
  private perfEntries = signal<PerformanceEntry[]>([]);
  private signalTracks = signal<SignalTrackEntry[]>([]);
  private activeTimers = new Map<string, number>();

  /**
   * TR: Seçilen log seviyesine göre filtrelenmiş loglar (Computed Signal).
   * UI'da sadece istenen seviyedeki mesajları göstermek için kullanılır.
   *
   * EN: Logs filtered by selected log level (Computed Signal).
   * Used to display only messages of the desired level in the UI.
   */
  readonly filteredLogs = computed(() => {
    const levelPriority: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    const minLevel = levelPriority[this.config.logLevel];
    return this.logs().filter((log) => levelPriority[log.level] >= minLevel);
  });

  readonly errorCount = computed(() => this.logs().filter((l) => l.level === 'error').length);
  readonly warnCount = computed(() => this.logs().filter((l) => l.level === 'warn').length);

  /**
   * TR: Ortalama işlem süresi (Performans analizi için).
   *
   * EN: Average operation duration (For performance analysis).
   */
  readonly avgPerformance = computed(() => {
    const entries = this.perfEntries();
    if (entries.length === 0) return 0;
    return entries.reduce((sum, e) => sum + e.duration, 0) / entries.length;
  });

  constructor(config: DevToolsConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      logLevel: config.logLevel ?? 'debug',
      maxEntries: config.maxEntries ?? 1000,
      consoleOutput: config.consoleOutput ?? true,
      trackPerformance: config.trackPerformance ?? true,
      trackSignals: config.trackSignals ?? true,
    };

    // TR: Browser console üzerinden erişim için window objesine ekle
    // EN: Expose to window object for access via browser console
    if (typeof window !== 'undefined' && this.config.enabled) {
      (window as unknown as { __SIGNAL_DEVTOOLS__: DevTools }).__SIGNAL_DEVTOOLS__ = this;
    }
  }

  // Logging Methods

  debug(category: string, message: string, data?: unknown): void {
    this.log('debug', category, message, data);
  }

  info(category: string, message: string, data?: unknown): void {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: unknown): void {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, data?: unknown): void {
    this.log('error', category, message, data);
  }

  /**
   * TR: Merkezi loglama fonksiyonu.
   * Logu hafızaya (State) ekler ve ayara göre konsola basar.
   * Maksimum kayıt sayısını kontrol eder ve eski kayıtları siler (Circular Buffer mantığı).
   *
   * EN: Central logging function.
   * Adds log to memory (State) and prints to console based on settings.
   * Checks max entry count and deletes old entries (Circular Buffer logic).
   */
  private log(level: LogLevel, category: string, message: string, data?: unknown): void {
    if (!this.config.enabled) return;

    const entry: LogEntry = {
      id: ++this.logIdCounter,
      level,
      category,
      message,
      data,
      timestamp: Date.now(),
      stack: level === 'error' ? new Error().stack : undefined,
    };

    this.logs.update((logs) => {
      const newLogs = [...logs, entry];
      if (newLogs.length > this.config.maxEntries) {
        return newLogs.slice(-this.config.maxEntries);
      }
      return newLogs;
    });

    if (this.config.consoleOutput) {
      const consoleMethod = level === 'debug' ? 'log' : level;
      const prefix = `[${category}]`;
      if (data !== undefined) {
        console[consoleMethod](prefix, message, data);
      } else {
        console[consoleMethod](prefix, message);
      }
    }
  }

  clearLogs(): void {
    this.logs.set([]);
  }

  getLogs(): Signal<LogEntry[]> {
    return this.logs.asReadonly();
  }

  /**
   * TR: Logları JSON formatında dışa aktarır.
   * Hata raporlama sistemlerine göndermek için kullanılabilir.
   *
   * EN: Exports logs in JSON format.
   * Can be used to send to error reporting systems.
   */
  exportLogs(): string {
    return JSON.stringify(this.logs(), null, 2);
  }

  // Performance Tracking

  /**
   * TR: Performans zamanlayıcısını başlatır.
   * `performance.now()` kullanarak yüksek hassasiyetli ölçüm yapar.
   *
   * EN: Starts performance timer.
   * Performs high-precision measurement using `performance.now()`.
   */
  startTimer(name: string, category = 'general'): void {
    if (!this.config.enabled || !this.config.trackPerformance) return;
    this.activeTimers.set(`${category}:${name}`, performance.now());
  }

  /**
   * TR: Performans zamanlayıcısını durdurur ve sonucu kaydeder.
   * 100ms üzerindeki işlemleri otomatik olarak uyarır (Slow Operation Warning).
   *
   * EN: Stops performance timer and records the result.
   * Automatically warns about operations over 100ms (Slow Operation Warning).
   */
  endTimer(name: string, category = 'general', meta?: Record<string, unknown>): number {
    if (!this.config.enabled || !this.config.trackPerformance) return 0;

    const key = `${category}:${name}`;
    const startTime = this.activeTimers.get(key);
    
    if (startTime === undefined) {
      this.warn('DevTools', `Timer "${name}" was never started`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.activeTimers.delete(key);

    const entry: PerformanceEntry = {
      id: ++this.perfIdCounter,
      name,
      duration,
      startTime,
      endTime,
      category,
      meta,
    };

    this.perfEntries.update((entries) => {
      const newEntries = [...entries, entry];
      if (newEntries.length > this.config.maxEntries) {
        return newEntries.slice(-this.config.maxEntries);
      }
      return newEntries;
    });

    if (duration > 100) {
      this.warn('Performance', `Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * TR: Asenkron bir fonksiyonun süresini ölçer (Wrapper).
   *
   * EN: Measures the duration of an async function (Wrapper).
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    category = 'async'
  ): Promise<T> {
    this.startTimer(name, category);
    try {
      return await fn();
    } finally {
      this.endTimer(name, category);
    }
  }

  /**
   * TR: Senkron bir fonksiyonun süresini ölçer.
   *
   * EN: Measures the duration of a sync function.
   */
  measureSync<T>(name: string, fn: () => T, category = 'sync'): T {
    this.startTimer(name, category);
    try {
      return fn();
    } finally {
      this.endTimer(name, category);
    }
  }

  getPerformanceEntries(): Signal<PerformanceEntry[]> {
    return this.perfEntries.asReadonly();
  }

  getSlowOperations(threshold = 100): PerformanceEntry[] {
    return this.perfEntries().filter((e) => e.duration > threshold);
  }

  clearPerformance(): void {
    this.perfEntries.set([]);
  }

  // Signal Tracking

  /**
   * TR: Belirtilen sinyali izler ve değişiklikleri kaydeder.
   * ÖNEMLI: Component destroy edildiğinde dönen cleanup fonksiyonunu mutlaka çağırın!
   * Polling veya Effect kullanarak değer değişimlerini yakalar.
   *
   * EN: Tracks the specified signal and records changes.
   * IMPORTANT: Call the returned cleanup function when component is destroyed!
   * Captures value changes using Polling or Effect.
   *
   * @example
   * // Component içinde kullanım / Usage in component
   * private cleanupFn?: () => void;
   *
   * ngOnInit() {
   *   this.cleanupFn = devTools.trackSignal(this.mySignal, 'mySignal');
   * }
   *
   * ngOnDestroy() {
   *   this.cleanupFn?.();  // ✅ Bellek sızıntısını önlemek için mutlaka çağırın / Must call to prevent memory leak
   * }
   */
  trackSignal<T>(sig: Signal<T>, name: string, source?: string): () => void {
    if (!this.config.enabled || !this.config.trackSignals) {
      return () => {};
    }

    let previousValue = sig();
    const id = `${name}-${Date.now()}`;

    // Record initial value
    this.signalTracks.update((tracks) => [
      ...tracks,
      {
        id,
        name,
        value: previousValue,
        previousValue: undefined,
        timestamp: Date.now(),
        source,
      },
    ]);

    // Polling simulation for tracking (Effect would be used in real app)
    const interval = setInterval(() => {
      const currentValue = sig();
      if (currentValue !== previousValue) {
        this.signalTracks.update((tracks) => {
          const newTracks = [
            ...tracks,
            {
              id,
              name,
              value: currentValue,
              previousValue,
              timestamp: Date.now(),
              source,
            },
          ];
          if (newTracks.length > this.config.maxEntries) {
            return newTracks.slice(-this.config.maxEntries);
          }
          return newTracks;
        });

        this.debug('Signal', `${name} changed`, { from: previousValue, to: currentValue });
        previousValue = currentValue;
      }
    }, 50);

    return () => clearInterval(interval);
  }

  getSignalTracks(): Signal<SignalTrackEntry[]> {
    return this.signalTracks.asReadonly();
  }

  clearSignalTracks(): void {
    this.signalTracks.set([]);
  }

  // Utilities

  createLogger(category: string) {
    return {
      debug: (message: string, data?: unknown) => this.debug(category, message, data),
      info: (message: string, data?: unknown) => this.info(category, message, data),
      warn: (message: string, data?: unknown) => this.warn(category, message, data),
      error: (message: string, data?: unknown) => this.error(category, message, data),
    };
  }

  /**
   * TR: Tüm durumu (Logs, Performance, Signals) debug için dışa aktarır.
   *
   * EN: Dumps the entire state (Logs, Performance, Signals) for debugging.
   */
  dumpState(): Record<string, unknown> {
    return {
      logs: this.logs(),
      performance: this.perfEntries(),
      signals: this.signalTracks(),
      config: this.config,
      stats: {
        totalLogs: this.logs().length,
        errors: this.errorCount(),
        warnings: this.warnCount(),
        avgPerformance: this.avgPerformance(),
      },
    };
  }

  clearAll(): void {
    this.clearLogs();
    this.clearPerformance();
    this.clearSignalTracks();
  }
}

/** Global devtools instance */
let globalDevTools: DevTools | null = null;

export function getDevTools(config?: DevToolsConfig): DevTools {
  if (!globalDevTools) {
    globalDevTools = new DevTools(config);
  }
  return globalDevTools;
}

/**
 * TR: Metodları otomatik olarak debug loglarına ekleyen Decorator.
 * Metod çağrıldığında parametreleri, bittiğinde sonucu loglar ve süresini ölçer.
 *
 * EN: Decorator that automatically adds methods to debug logs.
 * Logs parameters when method is called, result when finished, and measures duration.
 */
export function Debug(category?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cat = category ?? (target as object).constructor.name;

    descriptor.value = function (...args: unknown[]) {
      const devTools = getDevTools();
      devTools.debug(cat, `${propertyKey} called`, { args });
      devTools.startTimer(propertyKey, cat);

      try {
        const result = originalMethod.apply(this, args);

        if (result instanceof Promise) {
          return result
            .then((res) => {
              devTools.endTimer(propertyKey, cat);
              devTools.debug(cat, `${propertyKey} completed`, { result: res });
              return res;
            })
            .catch((err) => {
              devTools.endTimer(propertyKey, cat);
              devTools.error(cat, `${propertyKey} failed`, { error: err });
              throw err;
            });
        }

        devTools.endTimer(propertyKey, cat);
        devTools.debug(cat, `${propertyKey} completed`, { result });
        return result;
      } catch (err) {
        devTools.endTimer(propertyKey, cat);
        devTools.error(cat, `${propertyKey} failed`, { error: err });
        throw err;
      }
    };

    return descriptor;
  };
}

/**
 * TR: Sadece performans ölçümü yapan Decorator.
 *
 * EN: Decorator that only performs performance measurement.
 */
export function Measure(category?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cat = category ?? 'method';

    descriptor.value = function (...args: unknown[]) {
      const devTools = getDevTools();
      return devTools.measureSync(propertyKey, () => originalMethod.apply(this, args), cat);
    };

    return descriptor;
  };
}

/**
 * TR: Assertion (İddia) yardımcısı.
 * Koşul sağlanmazsa hata fırlatır ve loglar.
 *
 * EN: Assertion helper.
 * Throws error and logs if condition is not met.
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    const devTools = getDevTools();
    devTools.error('Assert', message);
    throw new Error(`Assertion failed: ${message}`);
  }
}

/**
 * TR: Sadece geliştirme ortamında çalışan uyarı fonksiyonu.
 * Production ortamında (NODE_ENV=production) çalışmaz.
 *
 * EN: Warning function working only in development environment.
 * Does not run in production environment (NODE_ENV=production).
 */
export function devWarn(message: string, data?: unknown): void {
  if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production') {
    return;
  }
  getDevTools().warn('Dev', message, data);
}

/**
 * TR: Geliştirme ortamında nesneyi dondurur (Immutability check).
 * Hatalı mutasyonları yakalamak için kullanılır.
 *
 * EN: Freezes object in development environment (Immutability check).
 * Used to catch accidental mutations.
 */
export function deepFreeze<T>(obj: T): T {
  if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production') {
    return obj;
  }

  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    const value = (obj as Record<string, unknown>)[prop];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  });

  return obj;
}