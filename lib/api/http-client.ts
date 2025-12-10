import {signal, Signal} from '@angular/core';

/**
 * TR: Desteklenen HTTP metodları.
 *
 * EN: Supported HTTP methods.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * TR: İstek yapılandırma seçenekleri.
 * Başlıklar, parametreler, body, zaman aşımı ve önbellek ayarlarını içerir.
 * `AbortSignal` ile istek iptali (cancellation) desteklenir.
 *
 * EN: Request configuration options.
 * Includes headers, parameters, body, timeout, and cache settings.
 * Supports request cancellation via `AbortSignal`.
 */
export interface RequestConfig {
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    timeout?: number;
    retries?: number;
    cache?: boolean;
    cacheTTL?: number;
    signal?: AbortSignal;
}

/**
 * TR: Standartlaştırılmış API yanıt zarfı (Wrapper).
 * Sunucudan gelen veriyi, durum kodunu ve başlıkları kapsar.
 *
 * EN: Standardized API response wrapper.
 * Encapsulates the data, status code, and headers received from the server.
 *
 * @template T - TR: Yanıt verisinin tipi. / EN: Type of the response data.
 */
export interface ApiResponse<T> {
    data: T;
    status: number;
    headers: Headers;
    ok: boolean;
}

/**
 * TR: Standartlaştırılmış API hatası.
 * HTTP durum kodu, hata mesajı ve varsa backend'den dönen detayları içerir.
 *
 * EN: Standardized API error.
 * Includes HTTP status code, error message, and any details returned from the backend.
 */
export interface ApiError {
    message: string;
    status: number;
    code?: string;
    details?: unknown;
}

/**
 * TR: İstek bağlamı (Context).
 * İstek metodu ve yolu gibi temel bilgileri içerir.
 *
 * EN: Request context.
 * Contains basic information like request method and path.
 */
export interface RequestContext {
    method: HttpMethod;
    path: string;
}

/**
 * TR: HTTP İstemcisi yapılandırması.
 * Temel URL, SSR URL'i ve yaşam döngüsü kancalarını (Interceptors) tanımlar.
 *
 * EN: HTTP Client configuration.
 * Defines base URL, SSR URL, and lifecycle hooks (Interceptors).
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface HttpClientConfig {
    /**
     * TR: İstemci tarafı (Browser) için temel URL.
     * Örn: '/api'
     *
     * EN: Base URL for client side (Browser).
     * E.g., '/api'
     */
    baseUrl: string;

    /**
     * TR: Sunucu tarafı (SSR) için kök URL.
     * Node.js ortamında relative path çalışmadığı için gereklidir.
     * Örn: 'http://localhost:3000/api' veya 'http://backend-service:8080'
     *
     * EN: Root URL for server side (SSR).
     * Required because relative paths do not work in Node.js environment.
     * E.g., 'http://localhost:3000/api' or 'http://backend-service:8080'
     */
    serverBaseUrl?: string;

    defaultHeaders?: Record<string, string>;
    timeout?: number;
    retries?: number;

    /**
     * TR: İstek gönderilmeden önce çalışır (Token ekleme vb. için).
     *
     * EN: Executes before the request is sent (For adding tokens, etc.).
     */
    onRequest?: (config: RequestConfig | Promise<RequestConfig>, context: RequestContext) => RequestConfig | Promise<RequestConfig>;

    /**
     * TR: Yanıt geldikten sonra çalışır (Loglama veya veri işleme için).
     *
     * EN: Executes after the response is received (For logging or data processing).
     */
    onResponse?: <T>(response: ApiResponse<T>) => ApiResponse<T> | Promise<ApiResponse<T>>;

    /**
     * TR: Hata durumunda çalışır (Global hata yönetimi/Toast mesajı için).
     *
     * EN: Executes on error (For global error handling/Toast messages).
     */
    onError?: (error: ApiError) => void;

    /**
     * TR: Çalışma platformu sunucu mu? (Provider tarafından otomatik set edilir).
     *
     * EN: Is the execution platform server? (Automatically set by the Provider).
     */
    isServer?: boolean;
}

/**
 * TR: Reaktif istek durumu.
 * Bir isteğin yüklenme, veri ve hata durumlarını Sinyaller (Signals) ile takip eder.
 *
 * EN: Reactive request state.
 * Tracks the loading, data, and error states of a request using Signals.
 */
export interface RequestState<T> {
    data: Signal<T | null>;
    loading: Signal<boolean>;
    error: Signal<ApiError | null>;
    execute: () => Promise<T>;
    reset: () => void;
}

/**
 * TR: Tip güvenli, SSR uyumlu ve genişletilebilir HTTP İstemcisi.
 * `fetch` API üzerine kuruludur. Otomatik JSON parse, modern timeout yönetimi ve
 * Interceptor desteği sunar.
 *
 * EN: Type-safe, SSR compatible, and extensible HTTP Client.
 * Built on top of `fetch` API. Offers automatic JSON parsing, modern timeout management,
 * and Interceptor support.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class HttpClient {
    private config: HttpClientConfig;

    constructor(config: HttpClientConfig) {
        this.config = {
            timeout: 30000,
            retries: 0,
            ...config,
            defaultHeaders: {
                'Content-Type': 'application/json',
                ...(config.defaultHeaders ?? {})
            }
        };
    }

    /** GET request */
    async get<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('GET', path, config);
    }

    /** POST request */
    async post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('POST', path, {...config, body});
    }

    /** PUT request */
    async put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('PUT', path, {...config, body});
    }

    /** PATCH request */
    async patch<T>(path: string, body?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('PATCH', path, {...config, body});
    }

    /** DELETE request */
    async delete<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
        return this.request<T>('DELETE', path, config);
    }

    /**
     * TR: Tüm HTTP metodlarının kullandığı çekirdek istek fonksiyonu.
     * 1. Interceptor'ları çalıştırır.
     * 2. URL çözümlemesini (SSR/Browser) yapar.
     * 3. Modern Timeout (AbortSignal.timeout) kullanır (Zone.js dostu).
     * 4. İsteği atar ve yanıtı işler.
     *
     * EN: Core request method used by all HTTP methods.
     * 1. Executes Interceptors.
     * 2. Performs URL resolution (SSR/Browser).
     * 3. Uses Modern Timeout (AbortSignal.timeout) (Zone.js friendly).
     * 4. Sends request and processes response.
     */
    private async request<T>(
        method: HttpMethod,
        path: string,
        config: RequestConfig = {}
    ): Promise<ApiResponse<T>> {

        const context: RequestContext = { method, path };

        // Apply request interceptor
        let finalConfig = config;
        if (this.config.onRequest) {
            finalConfig = await this.config.onRequest(config, context);
        }

        // TR: URL ve Query parametrelerini hazırla (SSR desteği ile)
        // EN: Prepare URL and Query parameters (with SSR support)
        const url = this.buildUrl(path, finalConfig.params);

        // Build headers
        const headers = new Headers({
            ...this.config.defaultHeaders,
            ...finalConfig.headers,
        });

        // TR: Modern Zaman Aşımı Kontrolü (AbortSignal.timeout)
        // setTimeout kullanmayarak Zone.js ve SSR performansını koruyoruz.
        // EN: Modern Timeout Control (AbortSignal.timeout)
        // Preserving Zone.js and SSR performance by avoiding setTimeout.
        const timeout = finalConfig.timeout ?? this.config.timeout ?? 30000;
        let timeoutSignal: AbortSignal | undefined;

        try {
            // TR: Modern tarayıcılar ve Node 18+ için
            // EN: For modern browsers and Node 18+
            timeoutSignal = AbortSignal.timeout(timeout);
        } catch {
            // TR: Eski ortamlar için fallback (Opsiyonel olarak polyfill eklenebilir)
            // EN: Fallback for older environments (Polyfill can be added optionally)
        }

        // TR: Kullanıcı sinyali ile timeout sinyalini birleştirme (Basit yaklaşım)
        // EN: Merging user signal with timeout signal (Simple approach)
        const requestSignal = finalConfig.signal || timeoutSignal;

        try {
            const response = await fetch(url, {
                method,
                headers,
                body: finalConfig.body ? JSON.stringify(finalConfig.body) : undefined,
                signal: requestSignal,
            });

            // TR: Content-Type'a göre otomatik parse
            // EN: Automatic parse based on Content-Type
            let data: T;
            const contentType = response.headers.get('content-type');

            if (contentType?.includes('application/json')) {
                data = await response.json();
            } else if (contentType?.includes('text/')) {
                data = await response.text() as unknown as T;
            } else {
                data = await response.blob() as unknown as T;
            }

            // Check for errors
            if (!response.ok) {
                const error: ApiError = {
                    message: this.getErrorMessage(data, response.status),
                    status: response.status,
                    code: (data as Record<string, unknown>)?.['code'] as string,
                    details: data,
                };

                this.config.onError?.(error);
                throw error;
            }

            let apiResponse: ApiResponse<T> = {
                data,
                status: response.status,
                headers: response.headers,
                ok: response.ok,
            };

            // Apply response interceptor
            if (this.config.onResponse) {
                apiResponse = await this.config.onResponse(apiResponse);
            }

            return apiResponse;
        } catch (error) {
            // TR: Zaman aşımı hatası kontrolü (Modern & Legacy)
            // EN: Timeout error check (Modern & Legacy)
            if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
                // TR: Eğer kullanıcı manuel iptal etmediyse, bu bir timeout'tur.
                // EN: If user didn't manually abort, it's a timeout.
                const isUserAbort = finalConfig.signal?.aborted;

                if (!isUserAbort) {
                    const apiError: ApiError = {
                        message: 'İstek zaman aşımına uğradı',
                        status: 408,
                        code: 'TIMEOUT',
                    };
                    this.config.onError?.(apiError);
                    throw apiError;
                }
            }

            if ((error as ApiError).status) {
                throw error;
            }

            const apiError: ApiError = {
                message: (error as Error).message || 'Ağ hatası',
                status: 0,
                code: 'NETWORK_ERROR',
            };
            this.config.onError?.(apiError);
            throw apiError;
        }
    }

    /**
     * TR: URL ve Query parametrelerini birleştirir.
     * SSR durumunda 'serverBaseUrl' kullanır.
     *
     * EN: Combines URL and Query parameters.
     * Uses 'serverBaseUrl' in SSR mode.
     */
    private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
        // TR: Ortama göre Base URL seçimi
        // EN: Base URL selection based on environment
        let baseUrl = this.config.baseUrl;

        if (this.config.isServer && this.config.serverBaseUrl) {
            baseUrl = this.config.serverBaseUrl;
        }

        // Remove trailing slash
        baseUrl = baseUrl.endsWith('/')
            ? baseUrl.slice(0, -1)
            : baseUrl;

        const fullPath = path.startsWith('/') ? path : `/${path}`;
        let url = `${baseUrl}${fullPath}`;

        if (params) {
            const searchParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined) {
                    searchParams.append(key, String(value));
                }
            }
            const queryString = searchParams.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
        }

        return url;
    }

    /**
     * TR: Backend yanıtından anlamlı hata mesajını çıkarır.
     * Standart HTTP durum kodları için varsayılan mesajlar sunar.
     *
     * EN: Extracts meaningful error message from backend response.
     * Provides default messages for standard HTTP status codes.
     */
    private getErrorMessage(data: unknown, status: number): string {
        if (typeof data === 'object' && data !== null) {
            const obj = data as Record<string, unknown>;
            if (typeof obj['message'] === 'string') return obj['message'];
            if (typeof obj['error'] === 'string') return obj['error'];
        }

        const statusMessages: Record<number, string> = {
            400: 'Geçersiz istek',
            401: 'Oturum açmanız gerekiyor',
            403: 'Bu işlem için yetkiniz yok',
            404: 'Kaynak bulunamadı',
            409: 'Çakışma hatası',
            422: 'Doğrulama hatası',
            429: 'Çok fazla istek',
            500: 'Sunucu hatası',
            502: 'Sunucu bağlantı hatası',
            503: 'Servis kullanılamıyor',
        };

        return statusMessages[status] || 'Bilinmeyen hata';
    }


    /**
     * TR: Bir HTTP isteği için reaktif durum (State) oluşturur.
     * UI bileşenlerinde loading/error durumlarını manuel yönetme zahmetinden kurtarır.
     *
     * EN: Creates a reactive state for an HTTP request.
     * Saves UI components from the hassle of manually managing loading/error states.
     *
     * @param method - TR: HTTP metodu. / EN: HTTP method.
     * @param path - TR: İstek yolu. / EN: Request path.
     * @returns TR: Reaktif istek durumu. / EN: Reactive request state.
     */
    createRequest<T>(
        method: HttpMethod,
        path: string,
        config?: RequestConfig
    ): RequestState<T> {
        const data = signal<T | null>(null);
        const loading = signal(false);
        const error = signal<ApiError | null>(null);

        const execute = async (): Promise<T> => {
            loading.set(true);
            error.set(null);

            try {
                const response = await this.request<T>(method, path, config);
                data.set(response.data);
                return response.data;
            } catch (e) {
                error.set(e as ApiError);
                throw e;
            } finally {
                loading.set(false);
            }
        };

        const reset = () => {
            data.set(null);
            loading.set(false);
            error.set(null);
        };

        return {data, loading, error, execute, reset};
    }

    /**
     * TR: Çalışma zamanında Base URL'i günceller.
     *
     * EN: Updates Base URL at runtime.
     */
    setBaseUrl(url: string): void {
        this.config.baseUrl = url;
    }

    /**
     * TR: Varsayılan başlıkları günceller.
     *
     * EN: Updates default headers.
     */
    setDefaultHeaders(headers: Record<string, string>): void {
        this.config.defaultHeaders = {...this.config.defaultHeaders, ...headers};
    }

    /**
     * TR: Authorization başlığına token ekler.
     *
     * EN: Adds token to Authorization header.
     */
    setAuthToken(token: string, type: 'Bearer' | 'Basic' = 'Bearer'): void {
        this.setDefaultHeaders({Authorization: `${type} ${token}`});
    }

    /**
     * TR: Authorization başlığını temizler (Logout).
     *
     * EN: Clears Authorization header (Logout).
     */
    clearAuthToken(): void {
        if (this.config.defaultHeaders) {
            delete this.config.defaultHeaders['Authorization'];
        }
    }
}

/**
 * TR: Yeni bir HttpClient örneği oluşturur (Factory Function).
 *
 * EN: Creates a new HttpClient instance (Factory Function).
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
    return new HttpClient(config);
}