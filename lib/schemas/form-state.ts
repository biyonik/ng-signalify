import {signal, computed, effect, Signal, WritableSignal} from '@angular/core';
import {z} from 'zod';
import {IField, FieldValue} from '../fields';
import {createAsyncValidator, AsyncValidateFn, AsyncValidatorState} from './async-validator';
import {DependencyResolver, FieldDependency} from './field-dependencies';
import {createFormHistory, FormHistory, deepClone} from './form-history';

/**
 * TR: Gelişmiş alan yapılandırması.
 * Standart konfigürasyona ek olarak asenkron validasyon, bağımlılıklar ve salt okunur mod gibi özellikleri içerir.
 *
 * EN: Extended field configuration.
 * Includes features like async validation, dependencies, and readonly mode in addition to standard configuration.
 */
export interface ExtendedFieldConfig {
    /**
     * TR: Asenkron doğrulama fonksiyonu (Sunucu kontrolü vb.).
     *
     * EN: Async validation function (Server check etc.).
     */
    asyncValidate?: AsyncValidateFn<unknown>;

    /**
     * TR: Asenkron doğrulama için gecikme süresi (Debounce).
     *
     * EN: Delay time for async validation (Debounce).
     */
    asyncDebounceMs?: number;

    /**
     * TR: Alan bağımlılık ayarları (Görünürlük, Hesaplama vb.).
     *
     * EN: Field dependency settings (Visibility, Computation etc.).
     */
    dependency?: FieldDependency;

    /**
     * TR: Alanın salt okunur (readonly) olup olmadığı.
     *
     * EN: Whether the field is readonly.
     */
    readonly?: boolean;
}

/**
 * TR: Alanlar arası çapraz doğrulama kuralı.
 * Örn: "Başlangıç Tarihi, Bitiş Tarihinden büyük olamaz" gibi birden fazla alanı ilgilendiren kurallar.
 *
 * EN: Cross-field validation rule.
 * E.g., rules involving multiple fields like "Start Date cannot be greater than End Date".
 */
export interface CrossFieldValidation<T> {
    /**
     * TR: Bu kuralın etkilediği alanlar.
     *
     * EN: Fields affected by this rule.
     */
    fields: (keyof T)[];

    /**
     * TR: Doğrulama mantığını içeren fonksiyon.
     * Hata varsa mesaj döner, yoksa null döner.
     *
     * EN: Function containing the validation logic.
     * Returns a message if there is an error, otherwise returns null.
     */
    validate: (values: Partial<T>) => string | null;

    /**
     * TR: Hatanın hangi alana ekleneceği (Opsiyonel).
     * Belirtilmezse genel form hatası (crossError) olarak eklenir.
     *
     * EN: Which field to attach the error to (Optional).
     * If not specified, added as a general form error (crossError).
     */
    errorField?: keyof T;
}

/**
 * TR: Gelişmiş form oluşturma seçenekleri.
 *
 * EN: Enhanced form creation options.
 */
export interface EnhancedFormOptions<T> {
    /**
     * TR: Alan bazlı gelişmiş ayarlar.
     *
     * EN: Field-based advanced settings.
     */
    fieldConfigs?: Partial<Record<keyof T, ExtendedFieldConfig>>;

    /**
     * TR: Çapraz doğrulama kuralları listesi.
     *
     * EN: List of cross-validation rules.
     */
    crossValidations?: CrossFieldValidation<T>[];

    /**
     * TR: Geçmiş (Undo/Redo) özelliğinin aktif olup olmayacağı.
     *
     * EN: Whether history (Undo/Redo) feature is active.
     */
    history?: boolean;

    /**
     * TR: Geçmiş özelliği ayarları.
     *
     * EN: History feature settings.
     */
    historyOptions?: {
        maxSize?: number;
        debounceMs?: number;
    };

    /**
     * TR: Otomatik kaydetme (Auto-Save) geri çağırım fonksiyonu.
     * Form her değiştiğinde (debounce süresi sonunda) tetiklenir.
     *
     * EN: Auto-Save callback function.
     * Triggered every time the form changes (after debounce time).
     */
    onAutoSave?: (values: T) => void | Promise<void>;

    /**
     * TR: Otomatik kaydetme için gecikme süresi.
     *
     * EN: Delay time for auto-save.
     */
    autoSaveDebounceMs?: number;
}

/**
 * TR: Zenginleştirilmiş alan durumu.
 * Standart `FieldValue` arayüzüne ek olarak asenkron durumları, görünürlüğü ve kirli (dirty) bilgisini içerir.
 *
 * EN: Enhanced field state.
 * Includes async states, visibility, and dirty info in addition to the standard `FieldValue` interface.
 */
export interface EnhancedFieldValue<T> extends FieldValue<T> {
    asyncValidating: Signal<boolean>;
    asyncError: Signal<string | null>;
    dirty: Signal<boolean>;
    visible: Signal<boolean>;
    enabled: Signal<boolean>;
    readonly: boolean;
    fullyValid: Signal<boolean>;
    combinedError: Signal<string | null>;
}

/**
 * TR: Gelişmiş form durumu ve API'si.
 * Tüm form özelliklerini (Sync/Async Validation, History, Dependencies) tek bir merkezden yönetir.
 *
 * EN: Enhanced form state and API.
 * Manages all form features (Sync/Async Validation, History, Dependencies) from a single center.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface EnhancedFormState<T extends Record<keyof T, unknown>> {
    fields: { [K in keyof T]: EnhancedFieldValue<T[K]> };
    values: Signal<T>;
    initialValues: Signal<T>;
    valid: Signal<boolean>;
    validating: Signal<boolean>;
    errors: Signal<Partial<Record<keyof T, string | null>>>;
    asyncErrors: Signal<Partial<Record<keyof T, string | null>>>;
    crossErrors: Signal<string[]>;
    dirty: Signal<boolean>;
    pristine: Signal<boolean>;
    visibleFields: Signal<(keyof T)[]>;

    touchAll: () => void;
    reset: (newInitial?: Partial<T>) => void;
    setValue: <K extends keyof T>(name: K, value: T[K]) => void;
    patchValues: (values: Partial<T>) => void;
    getValues: () => T;
    getDirtyValues: () => Partial<T>;
    validateAll: () => Promise<boolean>;
    markDirty: (name: keyof T) => void;
    markPristine: () => void;
    destroy: () => void;

    history?: FormHistory<T>;
    dependencies: DependencyResolver;
}

/**
 * TR: İki değerin derin eşitliğini kontrol eder.
 * JSON.stringify'dan daha performanslı ve güvenlidir.
 *
 * EN: Checks deep equality of two values.
 * More performant and safer than JSON.stringify.
 */
function deepEqual(a: unknown, b: unknown): boolean {
    // TR: Aynı referans veya primitif eşitlik
    // EN: Same reference or primitive equality
    if (a === b) return true;

    // TR: Null/undefined kontrolü
    // EN: Null/undefined check
    if (a == null || b == null) return a === b;

    // TR: Tip kontrolü
    // EN: Type check
    if (typeof a !== typeof b) return false;

    // TR: Date karşılaştırması
    // EN: Date comparison
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }

    // TR: Array karşılaştırması
    // EN: Array comparison
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => deepEqual(item, b[index]));
    }

    // TR: Object karşılaştırması
    // EN: Object comparison
    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a as object);
        const keysB = Object.keys(b as object);

        if (keysA.length !== keysB.length) return false;

        return keysA.every(key =>
            Object.prototype.hasOwnProperty.call(b, key) &&
            deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
        );
    }

    return false;
}

/**
 * TR: Gelişmiş, sinyal tabanlı form yapısını oluşturan fabrika fonksiyonu.
 * Dependency Injection mantığıyla çalışır; alan tanımlarını ve ayarları alıp tam donanımlı bir form nesnesi döner.
 *
 * EN: Factory function creating the enhanced, signal-based form structure.
 * Works with Dependency Injection logic; takes field definitions and settings, returns a fully equipped form object.
 *
 * @param fields - TR: Form alanları. / EN: Form fields.
 * @param initial - TR: Başlangıç değerleri. / EN: Initial values.
 * @param options - TR: Gelişmiş seçenekler. / EN: Enhanced options.
 * @returns TR: Gelişmiş form durumu. / EN: Enhanced form state.
 */
export function createEnhancedForm<T extends Record<keyof T, unknown>>(
    fields: IField<unknown>[],
    initial: Partial<T> = {},
    options: EnhancedFormOptions<T> = {}
): EnhancedFormState<T> {
    const {
        fieldConfigs = {},
        crossValidations = [],
        history: enableHistory = false,
        historyOptions = {},
    } = options;

    const effectRefs: Array<{ destroy: () => void }> = [];


    // TR: Zod şemasını inşa et
    // EN: Build Zod schema
    const zodShape: z.ZodRawShape = {};
    for (const field of fields) {
        zodShape[field.name] = field.schema();
    }
    const zodSchema = z.object(zodShape);

    // TR: Başlangıç değerlerini sakla (Reset ve Dirty check için)
    // EN: Store initial values (For Reset and Dirty check)
    const initialValues = signal<T>({...initial} as T);

    // TR: Bağımlılık çözümleyiciyi başlat
    // EN: Initialize dependency resolver
    const dependencies = new DependencyResolver();

    const fieldEntries: [string, EnhancedFieldValue<unknown>][] = [];
    const asyncValidators = new Map<string, AsyncValidatorState>();

    // TR: Alanları döngüye al ve geliştirilmiş özellikleri ekle
    // EN: Loop through fields and add enhanced features
    for (const field of fields) {
        const name = field.name as keyof T;
        const config = (fieldConfigs as Partial<Record<keyof T, ExtendedFieldConfig>>)[name];
        const initValue = initial[name] ?? null;

        // TR: Temel sinyaller
        // EN: Base signals
        const value = signal<unknown>(initValue);
        const touched = signal(false);
        const initialFieldValue = signal<unknown>(initValue);

        // TR: Senkron Validasyon (Zod)
        // EN: Sync Validation (Zod)
        const error = computed(() => {
            if (!touched()) return null;
            const result = field.schema().safeParse(value());
            return result.success ? null : result.error.errors[0]?.message ?? 'Geçersiz';
        });

        const valid = computed(() => error() === null);

        // TR: Asenkron Validasyon Kurulumu
        // EN: Async Validation Setup
        let asyncValidating = signal(false);
        let asyncError = signal<string | null>(null);

        if (config?.asyncValidate) {
            const asyncValidator = createAsyncValidator(
                config.asyncValidate,
                config.asyncDebounceMs ?? 300
            );
            asyncValidators.set(field.name, asyncValidator);
            asyncValidating = asyncValidator.validating as WritableSignal<boolean>;
            asyncError = asyncValidator.error as WritableSignal<string | null>;

            // TR: Değer değişince asenkron validasyonu tetikle (Effect)
            // EN: Trigger async validation on value change (Effect)
            const asyncEffect = effect(async () => {
                const v = value();
                if (touched()) {
                    await asyncValidator.validate(v);
                }
            }, {allowSignalWrites: true});
            effectRefs.push(asyncEffect);
        }

        // TR: Dirty (Kirli) Kontrolü - Performans optimize edildi
        // EN: Dirty Check - Performance optimized
        const dirty = computed(() => {
            const current = value();
            const init = initialFieldValue();
            return !deepEqual(current, init);
        });


        const visible = signal(true);
        const enabled = signal(true);

        const fullyValid = computed(() => valid() && asyncError() === null);
        const combinedError = computed(() => error() ?? asyncError());

        // TR: Bağımlılık varsa kaydet
        // EN: Register dependency if exists
        if (config?.dependency) {
            dependencies.register(field.name, config.dependency);
        }

        const enhancedValue: EnhancedFieldValue<unknown> = {
            value,
            error,
            touched,
            valid,
            asyncValidating,
            asyncError,
            dirty,
            visible,
            enabled,
            readonly: config?.readonly ?? false,
            fullyValid,
            combinedError,
        };

        fieldEntries.push([field.name, enhancedValue]);
    }

    const formFields = Object.fromEntries(fieldEntries) as EnhancedFormState<T>['fields'];

    // TR: Tüm değerleri toplayan computed sinyal
    // EN: Computed signal aggregating all values
    const values = computed(() => {
        const result: Record<string, unknown> = {};
        for (const [name, fv] of Object.entries(formFields)) {
            result[name] = (fv as EnhancedFieldValue<unknown>).value();
        }
        return result as T;
    });

    // TR: Bağımlılıkları başlat ve callback fonksiyonlarını bağla
    // EN: Initialize dependencies and bind callback functions
    dependencies.initialize(
        values,
        (name, value) => {
            const field = formFields[name as keyof T];
            if (field) {
                field.value.set(value as T[keyof T] | null);
            }
        },
        (name) => {
            const field = formFields[name as keyof T];
            if (field) {
                field.value.set(initialValues()[name as keyof T] ?? null);
                field.touched.set(false);
            }
        }
    );

    // TR: Bağımlılık sonuçlarını (görünürlük/aktiflik) alanlara yansıt
    // EN: Reflect dependency results (visibility/enabled) to fields
    const dependencyEffect = effect(() => {
        for (const field of fields) {
            const state = dependencies.getState(field.name);
            const fv = formFields[field.name as keyof T];
            if (state && fv) {
                (fv.visible as WritableSignal<boolean>).set(state.visible());
                (fv.enabled as WritableSignal<boolean>).set(state.enabled());
            }
        }
    });
    effectRefs.push(dependencyEffect);

    // TR: Çapraz Validasyon Hataları
    // EN: Cross-Validation Errors
    const crossErrors = computed(() => {
        const currentValues = values();
        const errs: string[] = [];
        for (const cv of crossValidations) {
            const err = cv.validate(currentValues);
            if (err) errs.push(err);
        }
        return errs;
    });

    // TR: Genel Form Geçerliliği
    // EN: Overall Form Validity
    const valid = computed(() => {
        const allFieldsValid = Object.values(formFields).every(
            (fv) => (fv as EnhancedFieldValue<unknown>).fullyValid()
        );
        return allFieldsValid && crossErrors().length === 0;
    });

    const validating = computed(() => {
        return Object.values(formFields).some(
            (fv) => (fv as EnhancedFieldValue<unknown>).asyncValidating()
        );
    });

    const dirty = computed(() => {
        return Object.values(formFields).some(
            (fv) => (fv as EnhancedFieldValue<unknown>).dirty()
        );
    });

    const pristine = computed(() => {
        return Object.values(formFields).every(
            (fv) => !(fv as EnhancedFieldValue<unknown>).touched()
        );
    });

    const visibleFields = computed(() => {
        return Object.entries(formFields)
            .filter(([, fv]) => (fv as EnhancedFieldValue<unknown>).visible())
            .map(([name]) => name as keyof T);
    });

    const errors = computed(() => {
        const result: Partial<Record<keyof T, string | null>> = {};
        for (const [name, fv] of Object.entries(formFields)) {
            result[name as keyof T] = (fv as EnhancedFieldValue<unknown>).error();
        }
        return result;
    });

    const asyncErrors = computed(() => {
        const result: Partial<Record<keyof T, string | null>> = {};
        for (const [name, fv] of Object.entries(formFields)) {
            result[name as keyof T] = (fv as EnhancedFieldValue<unknown>).asyncError();
        }
        return result;
    });

    const touchAll = () => {
        for (const fv of Object.values(formFields)) {
            (fv as EnhancedFieldValue<unknown>).touched.set(true);
        }
    };

    const reset = (newInitial?: Partial<T>) => {
        const resetValues = newInitial ?? initialValues();
        initialValues.set({...resetValues} as T);

        for (const [name, fv] of Object.entries(formFields)) {
            const val = resetValues[name as keyof T] ?? null;
            (fv as EnhancedFieldValue<unknown>).value.set(val);
            (fv as EnhancedFieldValue<unknown>).touched.set(false);
        }

        asyncValidators.forEach((v) => v.reset());
    };

    const setValue = <K extends keyof T>(name: K, value: T[K]) => {
        const fv = formFields[name];
        if (fv) {
            fv.value.set(value);
        }
    };

    const patchValues = (vals: Partial<T>) => {
        for (const [name, value] of Object.entries(vals)) {
            setValue(name as keyof T, value as T[keyof T]);
        }
    };

    const getValues = (): T => {
        return zodSchema.parse(values()) as T;
    };

    const getDirtyValues = (): Partial<T> => {
        const result: Partial<T> = {};
        for (const [name, fv] of Object.entries(formFields)) {
            if ((fv as EnhancedFieldValue<unknown>).dirty()) {
                result[name as keyof T] = (fv as EnhancedFieldValue<unknown>).value() as T[keyof T];
            }
        }
        return result;
    };

    const validateAll = async (): Promise<boolean> => {
        touchAll();

        const promises: Promise<void>[] = [];
        for (const [name, validator] of asyncValidators) {
            const fv = formFields[name as keyof T];
            if (fv) {
                promises.push(validator.validate(fv.value()));
            }
        }
        await Promise.all(promises);

        return valid();
    };

    const markDirty = (name: keyof T) => {
        const fv = formFields[name];
        if (fv) {
            fv.touched.set(true);
        }
    };

    const markPristine = () => {
        for (const fv of Object.values(formFields)) {
            (fv as EnhancedFieldValue<unknown>).touched.set(false);
        }
    };

    // TR: Geçmiş Yönetimi (History)
    // EN: History Management
    let formHistory: FormHistory<T> | undefined;
    if (enableHistory) {
        formHistory = createFormHistory(deepClone(initial as T), historyOptions);

        // TR: Değişiklikleri tarihçeye kaydet
        // EN: Save changes to history
        const historyEffect = effect(() => {
            const currentValues = values();
            formHistory!.push(deepClone(currentValues));
        });
        effectRefs.push(historyEffect);
    }

    const destroy = () => {
        // Effect'leri temizle
        for (const effectRef of effectRefs) {
            effectRef.destroy();
        }

        // Async validator'ları iptal et ve temizle
        for (const [, validator] of asyncValidators) {
            validator.cancel();
            validator.reset();
        }
        asyncValidators.clear();

        // Dependency resolver'ı temizle
        dependencies.cleanup();
    };

    return {
        fields: formFields,
        values,
        initialValues,
        valid,
        validating,
        errors,
        asyncErrors,
        crossErrors,
        dirty,
        pristine,
        visibleFields,
        touchAll,
        reset,
        setValue,
        patchValues,
        getValues,
        getDirtyValues,
        validateAll,
        markDirty,
        markPristine,
        history: formHistory,
        dependencies,
        destroy
    };
}