import {signal, Signal, WritableSignal} from '@angular/core';

/**
 * TR: Asenkron validasyon sonucu.
 * Hata varsa string mesaj, yoksa null döner.
 *
 * EN: Async validation result.
 * Returns string message if error exists, null otherwise.
 */
export type AsyncValidationResult = string;

/**
 * TR: Validasyon fonksiyonu tipi.
 * İptal sinyali (AbortSignal) ile birlikte çalışır.
 *
 * EN: Validation function type.
 * Works with AbortSignal.
 */
export type AsyncValidatorFn<T> = (value: T, signal: AbortSignal) => Promise<AsyncValidationResult>;

/**
 * TR: Asenkron Validasyon Yöneticisi.
 * Debounce (Gecikme) ve Cancellation (İptal) işlemlerini otomatik yönetir.
 * Angular Signals ile tam uyumlu çalışır.
 *
 * EN: Async Validation Manager.
 * Automatically manages Debounce and Cancellation operations.
 * Works fully compatible with Angular Signals.
 *
 * @template T - TR: Doğrulanacak değerin tipi. / EN: Type of the value to validate.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 */
export class AsyncValidator<T = unknown> {
    private readonly _loading = signal(false);
    private readonly _error = signal<string>('');

    private _timeoutId: any = null;
    private _abortController: AbortController | null = null;

    /**
     * TR: Sınıfı başlatır.
     *
     * EN: Initializes the class.
     *
     * @param validatorFn - TR: Doğrulama mantığını içeren fonksiyon. / EN: Function containing validation logic.
     * @param debounceTime - TR: İstek öncesi bekleme süresi (ms). / EN: Wait time before request (ms).
     */
    constructor(
        private validatorFn: AsyncValidatorFn<T>,
        private debounceTime: number = 300
    ) {}

    /**
     * TR: Değeri doğrular.
     * Önceki isteği iptal eder, belirtilen süre kadar bekler ve yeni isteği atar.
     *
     * EN: Validates the value.
     * Cancels previous request, waits for specified time, and sends new request.
     */
    validate(value: T): void {
        // 1. Bekleyen zamanlayıcıyı iptal et (Debounce)
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
        }

        // 2. Devam eden isteği iptal et (Cancellation)
        if (this._abortController) {
            this._abortController.abort();
        }

        // 3. Değer boşsa işlemi durdur ve resetle
        if (value === null || value === undefined || value === '') {
            this.reset();
            return;
        }

        // 4. Yeni zamanlayıcı başlat
        this._timeoutId = setTimeout(async () => {
            this._loading.set(true);

            // Yeni kontrolcü oluştur
            this._abortController = new AbortController();
            const signal = this._abortController.signal;

            try {
                const result = await this.validatorFn(value, signal);

                // İstek iptal edilmediyse sonucu işle
                if (!signal.aborted) {
                    this._error.set(result);
                    this._loading.set(false);
                }
            } catch (error: any) {
                // Abort hatası değilse genel hata ver
                if (error.name !== 'AbortError' && !signal.aborted) {
                    console.error('Async validation error:', error);
                    // Opsiyonel: Sunucu hatasını validasyon hatası olarak göster
                    // this._error.set('Doğrulama yapılamadı');
                    this._loading.set(false);
                }
            } finally {
                if (this._abortController?.signal === signal) {
                    this._abortController = null;
                }
            }
        }, this.debounceTime);
    }

    /**
     * TR: Değeri doğrular ve sonucu Promise olarak döner.
     * Debounce'u BY-PASS eder, anında validasyon yapar.
     * Form submit sırasında validateAll() tarafından kullanılır.
     *
     * EN: Validates the value and returns result as Promise.
     * BY-PASSES debounce, validates immediately.
     * Used by validateAll() during form submission.
     *
     * @returns TR: Hata mesajı veya boş string. / EN: Error message or empty string.
     */
    async validateAsync(value: T): Promise<string> {
        // 1. Bekleyen zamanlayıcıyı iptal et
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }

        // 2. Devam eden isteği iptal et
        if (this._abortController) {
            this._abortController.abort();
        }

        // 3. Değer boşsa hata yok
        if (value === null || value === undefined || value === '') {
            this._error.set('');
            this._loading.set(false);
            return '';
        }

        // 4. Yeni kontrolcü oluştur ve hemen çalıştır (debounce yok!)
        this._loading.set(true);
        this._abortController = new AbortController();
        const signal = this._abortController.signal;

        try {
            const result = await this.validatorFn(value, signal);

            if (!signal.aborted) {
                this._error.set(result);
                this._loading.set(false);
            }

            return result;
        } catch (error: any) {
            if (error.name !== 'AbortError' && !signal.aborted) {
                console.error('Async validation error:', error);
                this._loading.set(false);
            }
            return '';
        } finally {
            if (this._abortController?.signal === signal) {
                this._abortController = null;
            }
        }
    }

    /**
     * TR: Validasyon durumunu sıfırlar.
     *
     * EN: Resets validation state.
     */
    reset(): void {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
        this._loading.set(false);
        this._error.set('');
    }

    // --- Getters ---

    /**
     * TR: Validasyonun devam edip etmediği.
     *
     * EN: Whether validation is in progress.
     */
    get loading(): Signal<boolean> {
        return this._loading.asReadonly();
    }

    /**
     * TR: Mevcut hata mesajı.
     *
     * EN: Current error message.
     */
    get error(): Signal<string> {
        return this._error.asReadonly();
    }
}