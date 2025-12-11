import {
    EnvironmentProviders,
    makeEnvironmentProviders,
    InjectionToken,
    PLATFORM_ID,
    inject
} from '@angular/core';
import { isPlatformServer } from '@angular/common';

// Modül importları (Dosya yollarının projenizle eşleştiğinden emin olun)
import {HttpClient, HttpClientConfig, ApiError, RequestConfig, RequestContext} from './api/http-client';
import { ToastService } from './components/_legacy/feedback/toast.component'; // Toast servisi component dosyasındaysa
import { DevTools, DevToolsConfig, getDevTools } from './infrastructure/devtools';

/**
 * TR: Kütüphane konfigürasyonu.
 * HttpClient ayarlarına ek olarak DevTools ayarlarını da içerir.
 *
 * EN: Library configuration.
 * Includes DevTools settings in addition to HttpClient settings.
 */
export interface SignalifyConfig extends HttpClientConfig {
    devtools?: DevToolsConfig;
}

/**
 * TR: Yapılandırma token'ı.
 * EN: Configuration token.
 */
export const SIGNALIFY_CONFIG = new InjectionToken<SignalifyConfig>('SIGNALIFY_CONFIG');

/**
 * TR: HttpClient token'ı.
 * EN: HttpClient token.
 */
export const SIGNALIFY_HTTP = new InjectionToken<HttpClient>('SIGNALIFY_HTTP');

/**
 * TR: ng-signalify kütüphanesini uygulamaya entegre eder.
 * - SSR desteğini ayarlar.
 * - DevTools'u başlatır.
 * - Global Hata Yönetimi (Toast) ve Loglamayı HttpClient'a bağlar.
 *
 * EN: Integrates ng-signalify library into the application.
 * - Sets up SSR support.
 * - Initializes DevTools.
 * - Connects Global Error Handling (Toast) and Logging to HttpClient.
 *
 * @param config - TR: Kütüphane ayarları. / EN: Library settings.
 */
export function provideSignalify(config: SignalifyConfig): EnvironmentProviders {
    return makeEnvironmentProviders([
        {
            provide: SIGNALIFY_CONFIG,
            useValue: config
        },
        // 1. DevTools Sağlayıcısı (Singleton Factory)
        {
            provide: DevTools,
            useFactory: () => getDevTools(config.devtools)
        },
        // 2. Toast Servisi (Eğer root değilse buradan sağlanır)
        ToastService,
        // 3. Akıllı HttpClient Sağlayıcısı
        {
            provide: SIGNALIFY_HTTP,
            useFactory: () => {
                // Dependency Injection
                const userConfig = inject(SIGNALIFY_CONFIG);
                const platformId = inject(PLATFORM_ID);
                const toastService = inject(ToastService);
                const devTools = inject(DevTools);

                const isServer = isPlatformServer(platformId);

                // HttpClient Instance Oluşturma
                return new HttpClient({
                    ...userConfig,
                    isServer,

                    // --- Interceptor: İstek Başlangıcı ---
                    onRequest: async (reqConfig: RequestConfig | Promise<RequestConfig>, context: RequestContext) => {
                        // DevTools: Zamanlayıcı başlat
                        const actionName = `HTTP ${context.method} ${context.path}`;
                        devTools.startTimer(actionName, 'HTTP');

                        // Kullanıcının özel onRequest'i varsa çalıştır
                        if (userConfig.onRequest) {
                            return userConfig.onRequest(reqConfig, context);
                        }
                        return reqConfig;
                    },

                    // --- Interceptor: Yanıt Başarılı ---
                    onResponse: async (response) => {
                        // DevTools: Zamanlayıcı bitir
                        // Not: HttpClient içindeki implementasyona göre onResponse çağrılmayabilir,
                        // ancak yapı olarak burada durması doğrudur.
                        if (userConfig.onResponse) {
                            return userConfig.onResponse(response);
                        }
                        return response;
                    },

                    // --- Interceptor: Hata Yönetimi ---
                    onError: (error: ApiError) => {
                        // 1. DevTools: Hatayı logla
                        devTools.error('HTTP', `Request Failed: ${error.status}`, error);

                        // 2. Toast: Kullanıcıya göster (401 hariç)
                        // 401 genellikle auth redirect gerektirir, toast kirliliği yapmasın.
                        if (error.status !== 401) {
                            const title = error.status ? `Hata (${error.status})` : 'Hata';
                            const message = error.message || 'Beklenmedik bir hata oluştu';

                            // ToastService entegrasyonu
                            toastService.error(message, title);
                        }

                        // 3. User Config: Kullanıcının özel hata yönetimi varsa çalıştır
                        if (userConfig.onError) {
                            userConfig.onError(error);
                        }
                    }
                });
            }
        }
    ]);
}

/**
 * TR: HttpClient servisine erişim için yardımcı fonksiyon.
 * Componentlerde `inject(HttpClient)` yerine `injectHttp()` kullanılabilir.
 *
 * EN: Helper function to access HttpClient service.
 * Can be used as `injectHttp()` instead of `inject(HttpClient)` in components.
 */
export function injectHttp(): HttpClient {
    return inject(SIGNALIFY_HTTP);
}