import {
    EnvironmentProviders,
    makeEnvironmentProviders,
    InjectionToken,
    PLATFORM_ID,
    inject
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient, HttpClientConfig } from './api/http-client';

/**
 * TR: Global HttpClient yapılandırma token'ı.
 *
 * EN: Global HttpClient configuration token.
 */
export const SIGNALIFY_CONFIG = new InjectionToken<HttpClientConfig>('SIGNALIFY_CONFIG');

/**
 * TR: Enjekte edilebilir HttpClient örneği.
 *
 * EN: Injectable HttpClient instance.
 */
export const SIGNALIFY_HTTP = new InjectionToken<HttpClient>('SIGNALIFY_HTTP');

/**
 * TR: ng-signalify kütüphanesini uygulamaya entegre eder.
 * SSR desteği için platform kontrolünü otomatik yapar.
 *
 * EN: Integrates ng-signalify library into the application.
 * Automatically handles platform check for SSR support.
 *
 * @param config - TR: İstemci ve sunucu URL ayarları. / EN: Client and server URL settings.
 */
export function provideSignalify(config: HttpClientConfig): EnvironmentProviders {
    return makeEnvironmentProviders([
        {
            provide: SIGNALIFY_CONFIG,
            useValue: config
        },
        {
            provide: SIGNALIFY_HTTP,
            useFactory: () => {
                const userConfig = inject(SIGNALIFY_CONFIG);
                const platformId = inject(PLATFORM_ID);

                // TR: Platformu kontrol et (Browser vs Server)
                // EN: Check platform (Browser vs Server)
                const isServer = isPlatformServer(platformId);

                return new HttpClient({
                    ...userConfig,
                    isServer
                });
            }
        }
    ]);
}

/**
 * TR: HttpClient servisine erişim için yardımcı fonksiyon (inject).
 *
 * EN: Helper function to access HttpClient service (inject).
 */
export function injectHttp(): HttpClient {
    return inject(SIGNALIFY_HTTP);
}