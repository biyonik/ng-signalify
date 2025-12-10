import {signal, computed, effect, Signal, WritableSignal} from '@angular/core';
import {z} from 'zod';
import {IField, FieldValue} from '../fields';
import {AsyncValidator, AsyncValidatorFn} from './async-validator';
import {DependencyResolver, FieldDependency} from './field-dependencies';
import {createFormHistory, FormHistory, deepClone} from './form-history';

/**
 * TR: Gelişmiş alan yapılandırması.
 *
 * EN: Extended field configuration.
 */
export interface ExtendedFieldConfig {
    /**
     * TR: Asenkron doğrulama fonksiyonu.
     * Tip güncellendi: AsyncValidateFn -> AsyncValidatorFn
     *
     * EN: Async validation function.
     * Type updated: AsyncValidateFn -> AsyncValidatorFn
     */
    asyncValidate?: AsyncValidatorFn<unknown>;

    /**
     * TR: Asenkron doğrulama için gecikme süresi (Debounce).
     *
     * EN: Delay time for async validation (Debounce).
     */
    asyncDebounceMs?: number;

    dependency?: FieldDependency;
    readonly?: boolean;
}

export interface CrossFieldValidation<T> {
    fields: (keyof T)[];
    validate: (values: Partial<T>) => string | null;
    errorField?: keyof T;
}

export interface EnhancedFormOptions<T> {
    fieldConfigs?: Partial<Record<keyof T, ExtendedFieldConfig>>;
    crossValidations?: CrossFieldValidation<T>[];
    history?: boolean;
    historyOptions?: {
        maxSize?: number;
        debounceMs?: number;
    };
    onAutoSave?: (values: T) => void | Promise<void>;
    autoSaveDebounceMs?: number;
}

export interface EnhancedFieldValue<T> extends FieldValue<T> {
    asyncValidating: Signal<boolean>;
    asyncError: Signal<string>;
    dirty: Signal<boolean>;
    visible: Signal<boolean>;
    enabled: Signal<boolean>;
    readonly: boolean;
    fullyValid: Signal<boolean>;
    combinedError: Signal<string>;
}

export interface EnhancedFormState<T extends Record<keyof T, unknown>> {
    fields: { [K in keyof T]: EnhancedFieldValue<T[K]> };
    values: Signal<T>;
    initialValues: Signal<T>;
    valid: Signal<boolean>;
    validating: Signal<boolean>;
    errors: Signal<Partial<Record<keyof T, string>>>;
    asyncErrors: Signal<Partial<Record<keyof T, string>>>;
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

function deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => deepEqual(item, b[index]));
    }
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
    let isDestroyed = false;

    const zodShape: z.ZodRawShape = {};
    for (const field of fields) {
        zodShape[field.name] = field.schema();
    }
    const zodSchema = z.object(zodShape);

    const initialValues = signal<T>({...initial} as T);
    const dependencies = new DependencyResolver();

    const fieldEntries: [string, EnhancedFieldValue<unknown>][] = [];

    // TR: Tip düzeltmesi: Map artık AsyncValidator sınıfını tutuyor
    // EN: Type fix: Map now holds the AsyncValidator class
    const asyncValidators = new Map<string, AsyncValidator<unknown>>();

    for (const field of fields) {
        const name = field.name as keyof T;
        const config = (fieldConfigs as Partial<Record<keyof T, ExtendedFieldConfig>>)[name];
        const initValue = initial[name] ?? null;

        const value = signal<unknown>(initValue);
        const touched = signal(false);
        const initialFieldValue = signal<unknown>(initValue);

        const error = computed(() => {
            if (!touched()) return null;
            const result = field.schema().safeParse(value());
            return result.success ? '' : result.error.errors[0]?.message ?? 'Geçersiz';
        });

        const valid = computed(() => error() === null);

        // TR: Async Validasyon Kurulumu (YENİ SINIF İLE)
        // EN: Async Validation Setup (WITH NEW CLASS)
        let asyncValidating: Signal<boolean> = signal(false);
        let asyncError: Signal<string> = signal('');

        if (config?.asyncValidate) {
            // TR: createAsyncValidator yerine new AsyncValidator
            // EN: new AsyncValidator instead of createAsyncValidator
            const asyncValidator = new AsyncValidator(
                config.asyncValidate,
                config.asyncDebounceMs ?? 300
            );
            asyncValidators.set(field.name, asyncValidator);

            // TR: Sınıfın public sinyallerini bağla
            // EN: Bind public signals of the class
            asyncValidating = asyncValidator.loading;
            asyncError = asyncValidator.error;

            const asyncEffect = effect(async () => {
                const v = value();
                if (isDestroyed) return;
                if (touched()) {
                    asyncValidator.validate(v);
                }
            }, {allowSignalWrites: true});

            effectRefs.push(asyncEffect);
        }

        const dirty = computed(() => {
            const current = value();
            const init = initialFieldValue();
            return !deepEqual(current, init);
        });

        const visible = signal(true);
        const enabled = signal(true);

        const fullyValid = computed(() => valid() && asyncError() === null);
        const combinedError = computed(() => error() ?? asyncError());

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

    const values = computed(() => {
        const result: Record<string, unknown> = {};
        for (const [name, fv] of Object.entries(formFields)) {
            result[name] = (fv as EnhancedFieldValue<unknown>).value();
        }
        return result as T;
    });

    dependencies.initialize(
        values,
        (name, value) => {
            const field = formFields[name as keyof T];
            if (field) {
                field.value.set(value as T[keyof T]);
            }
        },
        (name) => {
            const field = formFields[name as keyof T];
            if (field) {
                field.value.set(initialValues()[name as keyof T]);
                field.touched.set(false);
            }
        }
    );

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

    const crossErrors = computed(() => {
        const currentValues = values();
        const errs: string[] = [];
        for (const cv of crossValidations) {
            const err = cv.validate(currentValues);
            if (err) errs.push(err);
        }
        return errs;
    });

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
        const result: Partial<Record<keyof T, string>> = {};
        for (const [name, fv] of Object.entries(formFields)) {
            result[name as keyof T] = (fv as EnhancedFieldValue<unknown>).error();
        }
        return result;
    });

    const asyncErrors = computed(() => {
        const result: Partial<Record<keyof T, string>> = {};
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

        const valueSnapshots = new Map<string, unknown>();
        for (const [name] of asyncValidators) {
            const fv = formFields[name as keyof T];
            if (fv) {
                valueSnapshots.set(name, fv.value());
            }
        }

        // TR: AsyncValidator.validate şu an void dönüyor (Promise değil).
        // Ancak validatörü tetiklemek için çağırıyoruz.
        // Tam senkronizasyon için AsyncValidator sınıfına 'validateAsync' gibi
        // Promise dönen bir metod eklenmesi gerekebilir.
        // Şimdilik tetikleyip validasyonun bitmesini (loading false olana kadar) beklemek en doğrusu olurdu
        // ama basitlik için sadece tetikliyoruz.
        // EN: AsyncValidator.validate currently returns void (not Promise).
        // Triggering it anyway. Ideally AsyncValidator needs a Promise-returning method.
        for (const [name, validator] of asyncValidators) {
            const snapshotValue = valueSnapshots.get(name);
            if (snapshotValue !== undefined) {
                validator.validate(snapshotValue);
            }
        }

        // TR: Async işlemler için küçük bir gecikme/bekleme eklenebilir
        // Veya validating signal'i izlenebilir.
        // Şimdilik validation'ların tetiklendiğini varsayıyoruz.

        let valuesChanged = false;
        for (const [name] of asyncValidators) {
            const fv = formFields[name as keyof T];
            if (fv && !deepEqual(fv.value(), valueSnapshots.get(name))) {
                valuesChanged = true;
                break;
            }
        }

        if (valuesChanged) {
            return validateAll();
        }

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

    let formHistory: FormHistory<T> | undefined;
    if (enableHistory) {
        formHistory = createFormHistory(deepClone(initial as T), historyOptions);
        const historyEffect = effect(() => {
            const currentValues = values();
            formHistory!.push(deepClone(currentValues));
        });
        effectRefs.push(historyEffect);
    }

    const destroy = () => {
        isDestroyed = true;
        for (const effectRef of effectRefs) {
            try {
                effectRef.destroy();
            } catch (e) {
                console.warn('Effect cleanup warning:', e);
            }
        }
        effectRefs.length = 0;

        for (const [, validator] of asyncValidators) {
            // TR: cancel yerine reset (sınıf yapısına uygun)
            validator.reset();
        }
        asyncValidators.clear();
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