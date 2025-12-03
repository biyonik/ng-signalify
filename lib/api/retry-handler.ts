import { signal, Signal } from '@angular/core';

/**
 * TR: Yeniden deneme (Retry) mekanizması için yapılandırma.
 * Deneme sayısı, gecikme süreleri ve hangi durumlarda tekrar deneneceğini belirler.
 *
 * EN: Configuration for the Retry mechanism.
 * Defines retry attempts, delay times, and under which conditions to retry.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface RetryConfig {
  /**
   * TR: Maksimum yeniden deneme sayısı.
   *
   * EN: Maximum retry attempts.
   */
  maxRetries?: number;

  /**
   * TR: İlk deneme öncesi bekleme süresi (ms).
   *
   * EN: Initial delay before first retry (ms).
   */
  initialDelay?: number;

  /**
   * TR: Maksimum bekleme süresi (ms).
   *
   * EN: Maximum delay time (ms).
   */
  maxDelay?: number;

  /**
   * TR: Her denemede sürenin ne kadar artacağı (Çarpan).
   * Örn: 2 ise (1s, 2s, 4s, 8s...).
   *
   * EN: Backoff multiplier for delay increase.
   * E.g., if 2 (1s, 2s, 4s, 8s...).
   */
  backoffMultiplier?: number;

  /**
   * TR: Bekleme süresine rastgelelik (Jitter) eklenip eklenmeyeceği.
   * "Thundering Herd" problemini önlemek için önerilir.
   *
   * EN: Whether to add random jitter to delay.
   * Recommended to prevent "Thundering Herd" problem.
   */
  jitter?: boolean;

  /**
   * TR: Hangi HTTP durum kodlarında tekrar deneme yapılacağı.
   *
   * EN: HTTP status codes to retry on.
   */
  retryableStatuses?: number[];

  /**
   * TR: Özel yeniden deneme koşulu (Fonksiyon).
   *
   * EN: Custom retry condition (Function).
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;

  /**
   * TR: Her denemede çalışacak geri çağırım fonksiyonu (Loglama vb.).
   *
   * EN: Callback function to execute on each retry (Logging, etc.).
   */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

/**
 * TR: Yeniden deneme sürecinin anlık durumunu tutan nesne.
 * UI'da "Yeniden bağlanıyor (2/5)..." gibi geri bildirimler için kullanılır.
 *
 * EN: Object holding the instant state of the retry process.
 * Used for UI feedback like "Reconnecting (2/5)...".
 */
export interface RetryState {
  attempt: Signal<number>;
  isRetrying: Signal<boolean>;
  lastError: Signal<unknown>;
  nextRetryAt: Signal<Date | null>;
}

/**
 * TR: Varsayılan olarak tekrar denenebilir HTTP hata kodları.
 * 408: Request Timeout
 * 429: Too Many Requests
 * 500: Internal Server Error
 * 502: Bad Gateway
 * 503: Service Unavailable
 * 504: Gateway Timeout
 */
const DEFAULT_RETRYABLE_STATUSES = [408, 429, 500, 502, 503, 504];

/**
 * TR: Üstel geri çekilme (Exponential Backoff) stratejisiyle bir işlemi tekrar dener.
 * Ağ hataları veya geçici sunucu kesintilerinde işlemin başarı şansını artırır.
 *
 * EN: Retries an operation using Exponential Backoff strategy.
 * Increases success rate during network errors or temporary server outages.
 *
 * @param fn - TR: Çalıştırılacak asenkron fonksiyon. / EN: Async function to execute.
 * @param config - TR: Retry ayarları. / EN: Retry settings.
 * @returns TR: İşlem sonucu (Promise). / EN: Operation result (Promise).
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    jitter = true,
    retryableStatuses = DEFAULT_RETRYABLE_STATUSES,
    shouldRetry,
    onRetry,
  } = config;

  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // TR: Tekrar denenebilir mi kontrol et
      // EN: Check if retryable
      const canRetry = attempt < maxRetries && isRetryable(error, attempt, {
        retryableStatuses,
        shouldRetry,
      });

      if (!canRetry) {
        throw error;
      }

      // TR: Gecikme süresini hesapla
      // EN: Calculate delay
      const delay = calculateDelay(attempt, {
        initialDelay,
        maxDelay,
        backoffMultiplier,
        jitter,
      });

      // TR: Retry callback'ini tetikle
      // EN: Trigger retry callback
      onRetry?.(error, attempt + 1, delay);

      // TR: Bekle
      // EN: Wait
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * TR: Reaktif (Signal tabanlı) bir retry yöneticisi oluşturur.
 * İşlemi iptal etme (cancel) yeteneği ve durum takibi sağlar.
 *
 * EN: Creates a reactive (Signal-based) retry handler.
 * Provides cancellation capability and state tracking.
 */
export function createRetryHandler<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): RetryState & { execute: () => Promise<T>; cancel: () => void } {
  const attempt = signal(0);
  const isRetrying = signal(false);
  const lastError = signal<unknown>(null);
  const nextRetryAt = signal<Date | null>(null);

  let cancelled = false;
  let currentTimeout: ReturnType<typeof setTimeout> | null = null;

  const execute = async (): Promise<T> => {
    cancelled = false;
    attempt.set(0);
    isRetrying.set(false);
    lastError.set(null);
    nextRetryAt.set(null);

    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      jitter = true,
      retryableStatuses = DEFAULT_RETRYABLE_STATUSES,
      shouldRetry,
      onRetry,
    } = config;

    let error: unknown;

    for (let i = 0; i <= maxRetries && !cancelled; i++) {
      attempt.set(i);

      try {
        const result = await fn();
        isRetrying.set(false);
        nextRetryAt.set(null);
        return result;
      } catch (e) {
        error = e;
        lastError.set(e);

        const canRetry = i < maxRetries && isRetryable(e, i, {
          retryableStatuses,
          shouldRetry,
        });

        if (!canRetry || cancelled) {
          break;
        }

        const delay = calculateDelay(i, {
          initialDelay,
          maxDelay,
          backoffMultiplier,
          jitter,
        });

        isRetrying.set(true);
        nextRetryAt.set(new Date(Date.now() + delay));
        onRetry?.(e, i + 1, delay);

        await new Promise<void>((resolve) => {
          currentTimeout = setTimeout(resolve, delay);
        });
      }
    }

    isRetrying.set(false);
    nextRetryAt.set(null);
    throw error;
  };

  const cancel = () => {
    cancelled = true;
    if (currentTimeout) {
      clearTimeout(currentTimeout);
      currentTimeout = null;
    }
    isRetrying.set(false);
    nextRetryAt.set(null);
  };

  return {
    attempt,
    isRetrying,
    lastError,
    nextRetryAt,
    execute,
    cancel,
  };
}

/**
 * TR: Hatanın tekrar denemeye uygun olup olmadığını belirler.
 * Ağ hataları ve belirlenen HTTP durum kodları için true döner.
 *
 * EN: Determines if the error is suitable for retry.
 * Returns true for network errors and specified HTTP status codes.
 */
function isRetryable(
  error: unknown,
  attempt: number,
  config: {
    retryableStatuses: number[];
    shouldRetry?: (error: unknown, attempt: number) => boolean;
  }
): boolean {
  if (config.shouldRetry) {
    return config.shouldRetry(error, attempt);
  }

  // Network error (fetch failed)
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return true;
  }

  // Status code check
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: number }).status;
    return config.retryableStatuses.includes(status);
  }

  return false;
}

/**
 * TR: Üstel gecikme süresini hesaplar.
 * Opsiyonel olarak Jitter (rastgelelik) ekler.
 *
 * EN: Calculates exponential delay duration.
 * Optionally adds Jitter (randomness).
 */
function calculateDelay(
  attempt: number,
  config: {
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
  }
): number {
  let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  delay = Math.min(delay, config.maxDelay);

  if (config.jitter) {
    // TR: %0-50 arası rastgele sapma ekle
    // EN: Add random deviation between 0-50%
    delay = delay * (1 + Math.random() * 0.5);
  }

  return Math.round(delay);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * TR: Sınıf metodlarına otomatik retry özelliği ekleyen Decorator.
 *
 * EN: Decorator adding automatic retry capability to class methods.
 */
export function Retry(config?: RetryConfig) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return retryWithBackoff(() => originalMethod.apply(this, args), config);
    };

    return descriptor;
  };
}

/**
 * TR: Devre Kesici (Circuit Breaker) durumları.
 * - Closed: Sistem normal, istekler geçiyor.
 * - Open: Hata eşiği aşıldı, istekler engelleniyor.
 * - Half-Open: Deneme süresi, sınırlı sayıda istek geçiyor.
 *
 * EN: Circuit Breaker states.
 * - Closed: System normal, requests passing.
 * - Open: Failure threshold exceeded, requests blocked.
 * - Half-Open: Probation period, limited requests passing.
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * TR: Devre Kesici yapılandırması.
 *
 * EN: Circuit Breaker configuration.
 */
export interface CircuitBreakerConfig {
  failureThreshold?: number;
  successThreshold?: number;
  resetTimeout?: number;
  onStateChange?: (state: CircuitState) => void;
}

/**
 * TR: Devre Kesici (Circuit Breaker) Deseni.
 * Hata veren bir servise sürekli istek atılmasını önleyerek sistemin toparlanmasına zaman tanır.
 *
 * EN: Circuit Breaker Pattern.
 * Prevents repeated calls to a failing service, allowing the system time to recover.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class CircuitBreaker {
  private state = signal<CircuitState>('closed');
  private failures = 0;
  private successes = 0;
  private lastFailure: number | null = null;
  private config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig = {}) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      successThreshold: config.successThreshold ?? 2,
      resetTimeout: config.resetTimeout ?? 30000,
      onStateChange: config.onStateChange ?? (() => {}),
    };
  }

  getState(): Signal<CircuitState> {
    return this.state.asReadonly();
  }

  /**
   * TR: Fonksiyonu devre kesici mantığıyla çalıştırır.
   * Devre açıksa (Open) hemen hata fırlatır.
   *
   * EN: Executes the function with circuit breaker logic.
   * Throws error immediately if circuit is open.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const currentState = this.state();

    // Check if circuit is open
    if (currentState === 'open') {
      // Check timeout for half-open transition
      if (this.lastFailure && Date.now() - this.lastFailure >= this.config.resetTimeout) {
        this.setState('half-open');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  open(): void {
    this.setState('open');
    this.lastFailure = Date.now();
  }

  close(): void {
    this.reset();
  }

  reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = null;
    this.setState('closed');
  }

  private onSuccess(): void {
    const currentState = this.state();

    if (currentState === 'half-open') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.reset();
      }
    } else {
      this.failures = 0;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();

    const currentState = this.state();

    if (currentState === 'half-open') {
      this.setState('open');
    } else if (this.failures >= this.config.failureThreshold) {
      this.setState('open');
    }
  }

  private setState(state: CircuitState): void {
    if (this.state() !== state) {
      this.state.set(state);
      this.config.onStateChange(state);
    }
  }
}