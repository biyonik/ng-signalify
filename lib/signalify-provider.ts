import {
    EnvironmentProviders,
    makeEnvironmentProviders,
    InjectionToken,
    PLATFORM_ID,
    inject
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient, HttpClientConfig, ApiError } from './api/http-client';
import { ToastService } from './components/feedback/toast.component';

export const SIGNALIFY_CONFIG = new InjectionToken<HttpClientConfig>('SIGNALIFY_CONFIG');
export const SIGNALIFY_HTTP = new InjectionToken<HttpClient>('SIGNALIFY_HTTP');

/**
 * TR: ng-signalify kütüphanesini uygulamaya entegre eder.
 * SSR desteği ve Global Hata Yönetimi (Toast) otomatik bağlanır.
 *
 * EN: Integrates ng-signalify library into the application.
 * SSR support and Global Error Handling (Toast) are automatically connected.
 */
export function provideSignalify(config: HttpClientConfig): EnvironmentProviders {
    return makeEnvironmentProviders([
        {
            provide: SIGNALIFY_CONFIG,
            useValue: config
        },
        ToastService,
        {
            provide: SIGNALIFY_HTTP,
            useFactory: () => {
                const userConfig = inject(SIGNALIFY_CONFIG);
                const platformId = inject(PLATFORM_ID);
                const toastService = inject(ToastService); // Senin servisin

                const isServer = isPlatformServer(platformId);

                return new HttpClient({
                    ...userConfig,
                    isServer,
                    // TR: Global Hata Yakalayıcı
                    onError: (error: ApiError) => {
                        // 1. 401 gibi özel durumları filtrele
                        if (error.status !== 401) {
                            // 2. Senin servisini kullan
                            // error.message'ı mesaj olarak, HTTP kodunu başlık olarak geçebiliriz
                            const title = `Hata (${error.status})`;
                            const message = error.message || 'Beklenmedik bir hata oluştu';

                            // Senin servisin error metodu: error(message, title?)
                            toastService.error(message, title);
                        }

                        // 3. Kullanıcı config'indeki onError'u çalıştır
                        if (userConfig.onError) {
                            userConfig.onError(error);
                        }
                    }
                });
            }
        }
    ]);
}

export function injectHttp(): HttpClient {
    return inject(SIGNALIFY_HTTP);
}