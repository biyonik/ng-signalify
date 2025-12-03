import { signal, computed, Signal, effect } from '@angular/core';

/**
 * TR: Desteklenen dil kodu (Locale).
 * Örn: 'tr', 'en-US', 'de-DE'.
 *
 * EN: Supported language code (Locale).
 * E.g., 'tr', 'en-US', 'de-DE'.
 */
export type Locale = string;

/**
 * TR: Çeviri sözlüğü yapısı.
 * İç içe geçmiş (Nested) anahtar-değer çiftlerini destekler.
 *
 * EN: Translation dictionary structure.
 * Supports nested key-value pairs.
 */
export type TranslationDictionary = Record<string, string | Record<string, string>>;

/**
 * TR: Tüm dillerin çevirilerini tutan harita.
 *
 * EN: Map holding translations for all languages.
 */
export type Translations = Record<Locale, TranslationDictionary>;

/**
 * TR: Çoğullaştırma (Pluralization) kuralı fonksiyonu.
 * Sayıya göre doğru dilbilgisi formunu ('one', 'other' vb.) döndürür.
 *
 * EN: Pluralization rule function.
 * Returns the correct grammatical form ('one', 'other', etc.) based on the number.
 */
export type PluralRule = (n: number) => 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';

/**
 * TR: i18n (Internationalization) yapılandırma ayarları.
 * Varsayılan dil, yedek dil ve kalıcılık ayarlarını yönetir.
 *
 * EN: i18n (Internationalization) configuration settings.
 * Manages default language, fallback language, and persistence settings.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface I18nConfig {
  /**
   * TR: Uygulamanın varsayılan dili.
   *
   * EN: Default language of the application.
   */
  defaultLocale: Locale;

  /**
   * TR: İstenen dilde çeviri bulunamazsa kullanılacak yedek dil.
   *
   * EN: Fallback language to use if translation is not found in the requested language.
   */
  fallbackLocale?: Locale;

  /**
   * TR: Başlangıç çevirileri (Eager loading için).
   *
   * EN: Initial translations (For eager loading).
   */
  translations?: Translations;

  /**
   * TR: Eksik anahtar durumunda çalışacak özel işleyici.
   *
   * EN: Custom handler to execute on missing key.
   */
  onMissingKey?: (key: string, locale: Locale) => string;

  /**
   * TR: Seçilen dilin tarayıcıda saklanıp saklanmayacağı.
   *
   * EN: Whether to persist the selected language in the browser.
   */
  persistLocale?: boolean;

  /**
   * TR: LocalStorage anahtarı.
   *
   * EN: LocalStorage key.
   */
  storageKey?: string;

  /**
   * TR: Özel çoğullaştırma kuralları.
   *
   * EN: Custom pluralization rules.
   */
  pluralRules?: Record<Locale, PluralRule>;
}

/**
 * TR: Metin içine yerleştirilecek dinamik parametreler.
 *
 * EN: Dynamic parameters to be interpolated into the text.
 */
export type InterpolationParams = Record<string, string | number>;

/**
 * TR: i18n Durumu ve Yönetim API'si.
 * Dil değişimi, çeviri fonksiyonları (t, tp) ve formatlayıcıları içerir.
 * Angular Signals ile dil değişimi anında tüm uygulamaya yansır.
 *
 * EN: i18n State and Management API.
 * Includes language switching, translation functions (t, tp), and formatters.
 * Language changes are instantly reflected across the app via Angular Signals.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface I18nState {
  /**
   * TR: Mevcut dil.
   *
   * EN: Current locale.
   */
  locale: Signal<Locale>;

  /**
   * TR: Yüklü diller listesi.
   *
   * EN: List of loaded locales.
   */
  availableLocales: Signal<Locale[]>;

  /**
   * TR: Mevcut dilin çevirilerinin yüklenip yüklenmediği.
   *
   * EN: Whether translations for the current locale are loaded.
   */
  isLoaded: Signal<boolean>;

  /**
   * TR: Dili değiştirir.
   *
   * EN: Sets the locale.
   */
  setLocale: (locale: Locale) => void;

  /**
   * TR: Anahtarı çevirir (Translate).
   * Parametreler ile metin enterpolasyonu yapar.
   *
   * EN: Translates the key.
   * Performs text interpolation with parameters.
   */
  t: (key: string, params?: InterpolationParams) => string;

  /**
   * TR: Çoğullaştırma desteği ile çeviri yapar (Translate Plural).
   *
   * EN: Translates with pluralization support.
   */
  tp: (key: string, count: number, params?: InterpolationParams) => string;

  /**
   * TR: Anahtarın var olup olmadığını kontrol eder.
   *
   * EN: Checks if the key exists.
   */
  hasKey: (key: string) => boolean;

  /**
   * TR: Yeni çeviriler ekler.
   *
   * EN: Adds new translations.
   */
  addTranslations: (locale: Locale, translations: TranslationDictionary) => void;

  /**
   * TR: Çevirileri asenkron olarak yükler (Lazy Loading).
   *
   * EN: Loads translations asynchronously (Lazy Loading).
   */
  loadTranslations: (locale: Locale, loader: () => Promise<TranslationDictionary>) => Promise<void>;

  /**
   * TR: Belirli bir dilin tüm çevirilerini getirir.
   *
   * EN: Gets all translations for a specific locale.
   */
  getTranslations: (locale?: Locale) => TranslationDictionary;

  /**
   * TR: Sayıyı yerel formata göre biçimlendirir.
   *
   * EN: Formats number according to locale.
   */
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;

  /**
   * TR: Para birimini yerel formata göre biçimlendirir.
   *
   * EN: Formats currency according to locale.
   */
  formatCurrency: (value: number, currency?: string) => string;

  /**
   * TR: Tarihi yerel formata göre biçimlendirir.
   *
   * EN: Formats date according to locale.
   */
  formatDate: (date: Date | number, options?: Intl.DateTimeFormatOptions) => string;

  /**
   * TR: Göreceli zamanı (örn: "3 gün önce") biçimlendirir.
   *
   * EN: Formats relative time (e.g., "3 days ago").
   */
  formatRelativeTime: (date: Date | number) => string;
}

/**
 * TR: Türkçe için çoğullaştırma kuralı.
 * Türkçe'de genellikle tekil ve çoğul ayrımı basittir (1 elma, 5 elma - çoğul eki almaz).
 * Ancak i18n standartlarında 'other' genel durumdur.
 *
 * EN: Pluralization rule for Turkish.
 * In Turkish, plural distinction is generally simple.
 * However, 'other' is the general case in i18n standards.
 */
const turkishPluralRule: PluralRule = (n) => {
  return n === 1 ? 'one' : 'other';
};

/**
 * TR: Varsayılan çoğullaştırma kuralları.
 *
 * EN: Default pluralization rules.
 */
const defaultPluralRules: Record<string, PluralRule> = {
  tr: turkishPluralRule,
  en: (n) => (n === 1 ? 'one' : 'other'),
  ar: (n) => {
    // TR: Arapça karmaşık çoğullaştırma kuralları
    // EN: Complex pluralization rules for Arabic
    if (n === 0) return 'zero';
    if (n === 1) return 'one';
    if (n === 2) return 'two';
    if (n % 100 >= 3 && n % 100 <= 10) return 'few';
    if (n % 100 >= 11 && n % 100 <= 99) return 'many';
    return 'other';
  },
};

/**
 * TR: i18n motorunu başlatan fabrika fonksiyonu.
 * Yapılandırma ayarlarına göre reaktif bir dil yönetim sistemi kurar.
 *
 * EN: Factory function initializing the i18n engine.
 * Sets up a reactive language management system based on configuration settings.
 *
 * @param config - TR: i18n ayarları. / EN: i18n settings.
 * @returns TR: i18n durumu. / EN: i18n state.
 */
export function createI18n(config: I18nConfig): I18nState {
  const {
    defaultLocale,
    fallbackLocale = defaultLocale,
    translations: initialTranslations = {},
    onMissingKey,
    persistLocale = true,
    storageKey = 'app_locale',
    pluralRules = {},
  } = config;

  // TR: Kayıtlı dili yükle
  // EN: Load persisted locale
  let savedLocale: string | null = null;
  if (persistLocale && typeof localStorage !== 'undefined') {
    savedLocale = localStorage.getItem(storageKey);
  }

  const translations = signal<Translations>(initialTranslations);
  const currentLocale = signal<Locale>(savedLocale ?? defaultLocale);
  const loadedLocales = signal<Set<Locale>>(new Set(Object.keys(initialTranslations)));

  // Computed
  const availableLocales = computed(() => Object.keys(translations()));
  const isLoaded = computed(() => loadedLocales().has(currentLocale()));

  // TR: Dil değişimini kaydet (Effect)
  // EN: Persist locale change (Effect)
  if (persistLocale && typeof localStorage !== 'undefined') {
    effect(() => {
      localStorage.setItem(storageKey, currentLocale());
    });
  }

  /**
   * TR: İç içe geçmiş nesneden değer okuyan yardımcı.
   *
   * EN: Helper to read value from nested object.
   */
  const getNestedValue = (obj: TranslationDictionary, path: string): string | undefined => {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  };

  /**
   * TR: String içine parametre yerleştirir (Interpolation).
   *
   * EN: Interpolates parameters into string.
   */
  const interpolate = (str: string, params?: InterpolationParams): string => {
    if (!params) return str;

    return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return params[key]?.toString() ?? `{{${key}}}`;
    });
  };

  const getPluralForm = (locale: Locale, count: number): string => {
    const rule = pluralRules[locale] ?? defaultPluralRules[locale] ?? defaultPluralRules['en'];
    return rule(count);
  };

  const t = (key: string, params?: InterpolationParams): string => {
    const locale = currentLocale();
    const dict = translations()[locale];

    // Try current locale
    let value = dict ? getNestedValue(dict, key) : undefined;

    // Try fallback locale
    if (value === undefined && fallbackLocale !== locale) {
      const fallbackDict = translations()[fallbackLocale];
      value = fallbackDict ? getNestedValue(fallbackDict, key) : undefined;
    }

    // Handle missing key
    if (value === undefined) {
      if (onMissingKey) {
        return onMissingKey(key, locale);
      }
      return key;
    }

    return interpolate(value, params);
  };

  const tp = (key: string, count: number, params?: InterpolationParams): string => {
    const locale = currentLocale();
    const pluralForm = getPluralForm(locale, count);
    const pluralKey = `${key}.${pluralForm}`;

    // Try plural form first
    let value = t(pluralKey, { ...params, count });

    // If plural form not found, try base key
    if (value === pluralKey) {
      value = t(key, { ...params, count });
    }

    return value;
  };

  const setLocale = (locale: Locale) => {
    // TR: Dil yüklüyse veya fallback ise değiştir
    // EN: Change if locale is loaded or fallback
    if (translations()[locale] || locale === fallbackLocale) {
      currentLocale.set(locale);
    } else {
      console.warn(`Locale "${locale}" not available`);
    }
  };

  const hasKey = (key: string): boolean => {
    const locale = currentLocale();
    const dict = translations()[locale];
    return dict ? getNestedValue(dict, key) !== undefined : false;
  };

  const addTranslations = (locale: Locale, newTranslations: TranslationDictionary) => {
    translations.update((t) => ({
      ...t,
      [locale]: {
        ...t[locale],
        ...newTranslations,
      },
    }));
    loadedLocales.update((s) => new Set([...s, locale]));
  };

  const loadTranslations = async (
    locale: Locale,
    loader: () => Promise<TranslationDictionary>
  ): Promise<void> => {
    if (loadedLocales().has(locale)) return;

    const newTranslations = await loader();
    addTranslations(locale, newTranslations);
  };

  const getTranslations = (locale?: Locale): TranslationDictionary => {
    return translations()[locale ?? currentLocale()] ?? {};
  };

  // Formatter Implementations using Intl API

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions): string => {
    return new Intl.NumberFormat(currentLocale(), options).format(value);
  };

  const formatCurrency = (value: number, currency = 'TRY'): string => {
    return new Intl.NumberFormat(currentLocale(), {
      style: 'currency',
      currency,
    }).format(value);
  };

  const formatDate = (date: Date | number, options?: Intl.DateTimeFormatOptions): string => {
    const d = typeof date === 'number' ? new Date(date) : date;
    return new Intl.DateTimeFormat(currentLocale(), options).format(d);
  };

  const formatRelativeTime = (date: Date | number): string => {
    const d = typeof date === 'number' ? new Date(date) : date;
    const now = Date.now();
    const diff = now - d.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const rtf = new Intl.RelativeTimeFormat(currentLocale(), { numeric: 'auto' });

    if (days > 0) return rtf.format(-days, 'day');
    if (hours > 0) return rtf.format(-hours, 'hour');
    if (minutes > 0) return rtf.format(-minutes, 'minute');
    return rtf.format(-seconds, 'second');
  };

  return {
    locale: currentLocale.asReadonly(),
    availableLocales,
    isLoaded,
    setLocale,
    t,
    tp,
    hasKey,
    addTranslations,
    loadTranslations,
    getTranslations,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
  };
}

/**
 * TR: Hazır Türkçe çeviri seti (Doğrulama ve genel terimler).
 *
 * EN: Ready-to-use Turkish translation set (Validation and common terms).
 */
export const trValidationMessages: TranslationDictionary = {
  // ... (Kod içindeki çeviriler)
  validation: {
    required: 'Bu alan zorunludur',
    // ...
  },
  // ...
};

/**
 * TR: Hazır İngilizce çeviri seti.
 *
 * EN: Ready-to-use English translation set.
 */
export const enValidationMessages: TranslationDictionary = {
  // ... (Kod içindeki çeviriler)
  validation: {
    required: 'This field is required',
    // ...
  },
  // ...
};

/** Global i18n instance */
let globalI18n: I18nState | null = null;

/**
 * TR: Global i18n örneğini getirir veya oluşturur (Singleton).
 * Uygulamanın her yerinden erişim için kullanılır.
 *
 * EN: Gets or creates global i18n instance (Singleton).
 * Used for access from anywhere in the app.
 */
export function getGlobalI18n(config?: I18nConfig): I18nState {
  if (!globalI18n && config) {
    globalI18n = createI18n(config);
  }
  if (!globalI18n) {
    throw new Error('i18n not initialized. Call createI18n first.');
  }
  return globalI18n;
}

/**
 * TR: Hızlı çeviri için kısayol fonksiyonu (Global instance kullanır).
 *
 * EN: Shortcut function for quick translation (Uses global instance).
 */
export function t(key: string, params?: InterpolationParams): string {
  return getGlobalI18n().t(key, params);
}

/**
 * TR: Hızlı çoğul çeviri için kısayol fonksiyonu.
 *
 * EN: Shortcut function for quick plural translation.
 */
export function tp(key: string, count: number, params?: InterpolationParams): string {
  return getGlobalI18n().tp(key, count, params);
}