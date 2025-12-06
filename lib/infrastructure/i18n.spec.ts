// lib/infrastructure/i18n.spec.ts
import { createI18n } from './i18n';
import { TestBed } from '@angular/core/testing';

describe('i18n (Infrastructure)', () => {
    const translations = {
        tr: {
            hello: 'Merhaba {{name}}',
            items: {
                one: '{{count}} ürün',
                other: '{{count}} ürünler'
            },
            deep: {
                nested: 'Derin'
            }
        },
        en: {
            hello: 'Hello {{name}}',
            fallback_test: 'Available in EN'
        }
    };

    it('should translate with interpolation', () => {
        TestBed.runInInjectionContext(() => {
            const i18n = createI18n({ defaultLocale: 'tr', translations });

            expect(i18n.t('hello', { name: 'Ahmet' })).toBe('Merhaba Ahmet');
            expect(i18n.t('deep.nested')).toBe('Derin');
        });
    });

    it('should use fallback locale if key missing', () => {
        TestBed.runInInjectionContext(() => {
            const i18n = createI18n({
                defaultLocale: 'tr',
                fallbackLocale: 'en',
                translations
            });

            // TR'de yok, EN'den gelmeli
            expect(i18n.t('fallback_test')).toBe('Available in EN');
        });
    });

    it('should handle pluralization (Simple)', () => {
        TestBed.runInInjectionContext(() => {
            const i18n = createI18n({ defaultLocale: 'tr', translations });

            // tp (translate plural) fonksiyonu testi
            // Türkçe kuralı: 1 -> one, diğerleri -> other (kodda tanımlı kurala göre)
            expect(i18n.tp('items', 1)).toBe('1 ürün');
            expect(i18n.tp('items', 5)).toBe('5 ürünler');
        });
    });

    it('should switch language reactively', () => {
        TestBed.runInInjectionContext(() => {
            const i18n = createI18n({ defaultLocale: 'tr', translations });

            expect(i18n.t('hello', { name: 'X' })).toContain('Merhaba');

            i18n.setLocale('en');

            // Signal update sonrası okuma
            expect(i18n.locale()).toBe('en');
            expect(i18n.t('hello', { name: 'X' })).toContain('Hello');
        });
    });
});