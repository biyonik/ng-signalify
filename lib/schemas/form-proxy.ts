import {Signal} from '@angular/core';
import {FormState} from './form-schema';
import {EnhancedFormState} from './form-state';

/**
 * TR: Bir alanın sahip olduğu sinyaller ve metodlar.
 * Proxy üzerinden erişildiğinde bu arayüz kullanılır.
 *
 * EN: Signals and methods possessed by a field.
 * Used when accessed via Proxy.
 */
export interface FieldSignals<T> {
    /**
     * TR: Alanın güncel değeri (Signal).
     * EN: Current value of the field (Signal).
     */
    value: Signal<T | null>;

    /**
     * TR: Alanın hata mesajı (Signal).
     * EN: Field error message (Signal).
     */
    error: Signal<string | null>;

    /**
     * TR: Alanın "touched" (dokunulmuş) durumu.
     * EN: Field "touched" status.
     */
    touched: Signal<boolean>;

    /**
     * TR: Alana yeni değer atar.
     * EN: Sets a new value to the field.
     */
    setValue(value: T | null): void;

    /**
     * TR: Alanı "touched" olarak işaretler.
     * EN: Marks the field as "touched".
     */
    markAsTouched(): void;

    // Gelişmiş form kullanılıyorsa ekstra özellikler (Opsiyonel)
    asyncValidating?: Signal<boolean>;
    visible?: Signal<boolean>;
    enabled?: Signal<boolean>;
}

/**
 * TR: Form verisi üzerinde derinlemesine (nested) tip güvenli erişim sağlayan Proxy tipi.
 * Hem nesne ağacında gezinmeyi sağlar hem de her düğümde Field özelliklerine erişim sunar.
 *
 * EN: Proxy type providing deep type-safe access on form data.
 * Allows traversing the object tree and offers access to Field properties at each node.
 */
export type FormProxy<T> = {
    [K in keyof T]-?: T[K] extends object
        ? FormProxy<T[K]> & FieldSignals<T[K]> // Eğer obje ise hem derinleşebilir hem field özelliklerine erişebilir
        : FieldSignals<T[K]> // Primitif ise sadece field özelliklerine erişebilir
};

/**
 * TR: Form State için Proxy oluşturur.
 * Nested erişimleri (örn: form.proxy.address.city.value()) otomatik olarak
 * düzleştirilmiş (flattened) alan yapısına (örn: 'address.city') yönlendirir.
 *
 * EN: Creates a Proxy for Form State.
 * Automatically redirects nested accesses (e.g., form.proxy.address.city.value())
 * to the flattened field structure (e.g., 'address.city').
 *
 * @template T - Form veri tipi
 * @param formState - Mevcut FormState veya EnhancedFormState nesnesi
 * * @author Ahmet ALTUN
 * @github github.com/biyonik
 */
export function createFormProxy<T extends Record<string, any>>(
    formState: FormState<T> | EnhancedFormState<T>
): FormProxy<T> {

    /**
     * TR: Proxy Handler (Yakalayıcı).
     * Tüm özellik erişimlerini (get) yakalar ve yönetir.
     * * EN: Proxy Handler.
     * Intercepts and manages all property accesses (get).
     */
    const handler = (path: string[] = []) => ({
        get(target: any, prop: string | symbol): any {
            // 1. Symbol ve özel durumları pas geç
            if (typeof prop === 'symbol') return Reflect.get(target, prop);

            // 2. Field metodları/sinyalleri mi isteniyor? (value, error, setValue vb.)
            const fieldProps = ['value', 'error', 'touched', 'setValue', 'markAsTouched', 'asyncValidating', 'visible', 'enabled'];

            if (fieldProps.includes(prop as string)) {
                // TR: Yolu "nokta" ile birleştir (address.city)
                // EN: Join path with "dot" (address.city)
                const fieldName = path.join('.');

                // TR: FormState içinden gerçek alanı bul
                // EN: Find the actual field within FormState
                // @ts-ignore - Dinamik erişim
                const field = formState.fields[fieldName];

                if (!field) {
                    console.warn(`ng-signalify: Field not found for path "${fieldName}"`);
                    return undefined;
                }

                // TR: İlgili sinyali veya metodu döndür
                // EN: Return the relevant signal or method
                if (prop === 'setValue') {
                    return (val: any) => {
                        if ('value' in field && typeof field.value.set === 'function') {
                            field.value.set(val);
                        }
                    };
                }

                if (prop === 'markAsTouched') {
                    return () => {
                        if ('touched' in field && typeof field.touched.set === 'function') {
                            field.touched.set(true);
                        }
                    }
                }

                // Signal erişimi (value, error, touched)
                return field[prop as keyof typeof field];
            }

            // 3. Eğer field özelliği istenmiyorsa, daha derine inmek istiyordur.
            // Yeni bir proxy döndür ve yolu güncelle.
            // EN: If not accessing a field property, user wants to go deeper.
            // Return a new proxy and update the path.
            return new Proxy({}, handler([...path, prop as string]));
        }
    });

    // TR: Kök proxy'yi boş bir obje ve boş yol ile başlat
    // EN: Initialize root proxy with an empty object and empty path
    return new Proxy({}, handler([])) as FormProxy<T>;
}