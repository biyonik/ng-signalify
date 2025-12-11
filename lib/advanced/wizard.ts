import {computed, signal, Signal} from '@angular/core';
import {z} from 'zod';

/**
 * TR: Bir adımın alabileceği yaşam döngüsü durumları.
 * - pending: Henüz ziyaret edilmedi.
 * - active: Şu anki adım.
 * - completed: Başarıyla tamamlandı ve geçildi.
 * - error: Doğrulama hatası var.
 * - skipped: İsteğe bağlı (optional) olduğu için atlandı.
 *
 * EN: Lifecycle statuses a step can take.
 * - pending: Not visited yet.
 * - active: Current step.
 * - completed: Successfully completed and passed.
 * - error: Has validation error.
 * - skipped: Skipped because it was optional.
 */
export type StepStatus = 'pending' | 'active' | 'completed' | 'error' | 'skipped';

/**
 * TR: Sihirbaz adımı tanımı.
 * Adımın başlığı, açıklaması, şeması ve özel kancalarını (hooks) içerir.
 *
 * EN: Wizard step definition.
 * Includes step title, description, schema, and custom hooks.
 *
 * @template T - TR: Adım verisinin tipi. / EN: Type of step data.
 */
export interface WizardStep<T = unknown> {
    /**
     * TR: Adımın benzersiz kimliği.
     *
     * EN: Unique identifier of the step.
     */
    id: string;

    /**
     * TR: UI'da gösterilecek başlık.
     *
     * EN: Title to be displayed in the UI.
     */
    title: string;

    description?: string;
    icon?: string;

    /**
     * TR: Adım verisini doğrulamak için Zod şeması.
     *
     * EN: Zod schema to validate step data.
     */
    schema?: z.ZodSchema<T>;

    /**
     * TR: Bu adımda bulunan alanların isimleri (Form entegrasyonu için).
     *
     * EN: Names of the fields present in this step (For form integration).
     */
    fields?: string[];

    /**
     * TR: Adımın atlanabilir olup olmadığı.
     *
     * EN: Whether the step is skippable.
     */
    optional?: boolean;

    /**
     * TR: Özel doğrulama fonksiyonu.
     * Şema yeterli olmadığında (örn: API kontrolü) kullanılır.
     *
     * EN: Custom validation function.
     * Used when schema is not enough (e.g., API check).
     */
    validate?: (data: T, allData: Record<string, unknown>) => string | null | Promise<string | null>;

    /**
     * TR: Adımdan ayrılmadan önce çalışacak kanca.
     * False dönerse geçiş engellenir.
     *
     * EN: Hook to run before leaving the step.
     * If returns false, transition is blocked.
     */
    beforeLeave?: (data: T) => boolean | Promise<boolean>;

    /**
     * TR: Adıma girmeden önce çalışacak kanca.
     * False dönerse giriş engellenir.
     *
     * EN: Hook to run before entering the step.
     * If returns false, entry is blocked.
     */
    beforeEnter?: (allData: Record<string, unknown>) => boolean | Promise<boolean>;
}

/**
 * TR: Bir adımın çalışma zamanı durumu.
 * Durum, veri ve hata bilgisini tutar.
 *
 * EN: Runtime state of a step.
 * Holds status, data, and error information.
 */
export interface StepState {
    id: string;
    status: StepStatus;
    /**
     * TR: Kullanıcının bu adımı daha önce görüp görmediği.
     *
     * EN: Whether the user has seen this step before.
     */
    visited: boolean;
    error: string | null;
    data: unknown;
}

/**
 * TR: Sihirbazın genel durumu ve yönetim API'si.
 * Angular Signals ile reaktif olarak tüm süreci yönetir.
 *
 * EN: Overall state and management API of the wizard.
 * Manages the entire process reactively with Angular Signals.
 *
 * @template T - TR: Tüm sihirbaz verisinin tipi. / EN: Type of the entire wizard data.
 */
export interface WizardState<T extends Record<string, unknown>> {
    /**
     * TR: Tüm adımların durum listesi.
     *
     * EN: List of states of all steps.
     */
    steps: Signal<StepState[]>;

    /**
     * TR: Mevcut adımın indeksi (0-based).
     *
     * EN: Index of the current step (0-based).
     */
    currentIndex: Signal<number>;

    /**
     * TR: Mevcut adımın tanımı (Config).
     *
     * EN: Definition of the current step (Config).
     */
    currentStep: Signal<WizardStep | null>;

    /**
     * TR: Mevcut adımın durumu (Runtime State).
     *
     * EN: State of the current step (Runtime State).
     */
    currentState: Signal<StepState | null>;

    isFirst: Signal<boolean>;
    isLast: Signal<boolean>;
    canNext: Signal<boolean>;
    canPrev: Signal<boolean>;

    /**
     * TR: İlerleme yüzdesi (0-100).
     *
     * EN: Progress percentage (0-100).
     */
    progress: Signal<number>;

    /**
     * TR: Tüm adımlardan toplanan birleştirilmiş veri.
     *
     * EN: Aggregated data collected from all steps.
     */
    data: Signal<Partial<T>>;

    isComplete: Signal<boolean>;
    isValidating: Signal<boolean>;

    next: () => Promise<boolean>;
    prev: () => Promise<boolean>;
    goTo: (indexOrId: number | string) => Promise<boolean>;
    skip: () => Promise<boolean>;
    setStepData: (stepId: string, data: unknown) => void;
    getStepData: <S>(stepId: string) => S | undefined;
    validateCurrent: () => Promise<boolean>;
    validateAll: () => Promise<boolean>;
    reset: () => void;
    complete: () => Promise<T | null>;
}

/**
 * TR: Sihirbaz yapılandırma seçenekleri.
 * Navigasyon kurallarını belirler.
 *
 * EN: Wizard configuration options.
 * Determines navigation rules.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface WizardConfig {
    /**
     * TR: Geriye gitmeye izin ver.
     *
     * EN: Allow going back.
     */
    allowBack?: boolean;

    /**
     * TR: Herhangi bir adıma (sırasız) atlamaya izin ver.
     *
     * EN: Allow jumping to any step (unordered).
     */
    allowJump?: boolean;

    /**
     * TR: Adımdan ayrılırken doğrulama yap.
     *
     * EN: Validate when leaving the step.
     */
    validateOnLeave?: boolean;

    /**
     * TR: Sadece doğrusal ilerlemeye (1 -> 2 -> 3) izin ver.
     * False ise atlanarak gidilebilir.
     *
     * EN: Allow only linear progression (1 -> 2 -> 3).
     * If false, skipping is allowed.
     */
    linear?: boolean;

    onStepChange?: (from: number, to: number) => void;
    onComplete?: (data: Record<string, unknown>) => void;
}

/**
 * TR: Reaktif Sihirbaz Durumu oluşturur.
 * Çok adımlı süreçleri yönetmek için kapsamlı bir durum makinesi (State Machine) sağlar.
 *
 * EN: Creates Reactive Wizard State.
 * Provides a comprehensive State Machine to manage multi-step processes.
 *
 * @param steps - TR: Adım tanımları. / EN: Step definitions.
 * @param initialData - TR: Başlangıç verileri. / EN: Initial data.
 * @param config - TR: Ayarlar. / EN: Settings.
 * @returns TR: Sihirbaz durumu. / EN: Wizard state.
 */
export function createWizard<T extends Record<string, unknown>>(
    steps: WizardStep[],
    initialData: Partial<T> = {},
    config: WizardConfig = {}
): WizardState<T> {
    const {
        allowBack = true,
        allowJump = false,
        validateOnLeave = true,
        linear = true,
        onStepChange,
        onComplete,
    } = config;

    // Initialize step states
    const initialStates: StepState[] = steps.map((step, index) => ({
        id: step.id,
        status: index === 0 ? 'active' : 'pending',
        visited: index === 0,
        error: null,
        data: initialData[step.id as keyof T] ?? {},
    }));

    const stepStates = signal<StepState[]>(initialStates);
    const currentIndex = signal(0);
    const isValidating = signal(false);

    // Computed values
    const currentStep = computed(() => steps[currentIndex()] ?? null);
    const currentState = computed(() => stepStates()[currentIndex()] ?? null);
    const isFirst = computed(() => currentIndex() === 0);
    const isLast = computed(() => currentIndex() === steps.length - 1);

    const canNext = computed(() => {
        const current = currentState();
        return !isLast() && current?.status !== 'error';
    });

    const canPrev = computed(() => allowBack && !isFirst());

    const progress = computed(() => {
        const completed = stepStates().filter((s) => s.status === 'completed').length;
        return Math.round((completed / steps.length) * 100);
    });

    // TR: Tüm adım verilerini tek bir objede birleştir
    // EN: Merge all step data into a single object
    const data = computed(() => {
        const result: Partial<T> = {};
        for (const state of stepStates()) {
            if (state.data) {
                result[state.id as keyof T] = state.data as T[keyof T];
            }
        }
        return result;
    });

    const isComplete = computed(() => {
        return stepStates().every(
            (s) => s.status === 'completed' || s.status === 'skipped'
        );
    });

    // Actions

    /**
     * TR: Belirtilen adımın verilerini doğrular.
     * Şema ve özel validasyon fonksiyonlarını çalıştırır.
     *
     * EN: Validates data of the specified step.
     * Runs schema and custom validation functions.
     */
    const validateStep = async (index: number): Promise<boolean> => {
        const step = steps[index];
        const state = stepStates()[index];

        if (!step || !state) return false;

        isValidating.set(true);

        try {
            // Schema validation
            if (step.schema) {
                const result = step.schema.safeParse(state.data);
                if (!result.success) {
                    updateStepState(index, {
                        status: 'error',
                        error: result.error.errors[0]?.message ?? 'Doğrulama hatası',
                    });
                    return false;
                }
            }

            // Custom validation
            if (step.validate) {
                const error = await step.validate(state.data, data());
                if (error) {
                    updateStepState(index, {status: 'error', error});
                    return false;
                }
            }

            updateStepState(index, {error: null});
            return true;
        } finally {
            isValidating.set(false);
        }
    };

    const updateStepState = (index: number, partial: Partial<StepState>) => {
        stepStates.update((states) =>
            states.map((s, i) => (i === index ? {...s, ...partial} : s))
        );
    };

    /**
     * TR: Belirtilen adıma geçiş yapar.
     * Navigasyon kurallarını (linear, allowJump) ve kancaları (hooks) kontrol eder.
     *
     * EN: Transitions to the specified step.
     * Checks navigation rules (linear, allowJump) and hooks.
     */
    const goTo = async (indexOrId: number | string): Promise<boolean> => {
        const targetIndex = typeof indexOrId === 'number'
            ? indexOrId
            : steps.findIndex((s) => s.id === indexOrId);

        if (targetIndex < 0 || targetIndex >= steps.length) {
            return false;
        }

        const current = currentIndex();

        if (!allowJump && linear) {
            const targetState = stepStates()[targetIndex];
            // TR: İleriye doğru sıçrama engeli (Daha önce ziyaret edilmediyse)
            // EN: Forward jump prevention (If not visited before)
            if (!targetState.visited && targetIndex > current && targetIndex !== current + 1) {
                return false;
            }
        }

        let validationPassed = false;
        if (targetIndex > current) {
            if (validateOnLeave) {
                const valid = await validateStep(current);
                if (!valid) return false;
                validationPassed = true;
            }
        }

        // Before leave hook
        const currentStepDef = steps[current];
        if (currentStepDef.beforeLeave) {
            const canLeave = await currentStepDef.beforeLeave(stepStates()[current].data);
            if (!canLeave) return false;
        }

        // Before enter hook
        const targetStep = steps[targetIndex];
        if (targetStep.beforeEnter) {
            const canEnter = await targetStep.beforeEnter(data());
            if (!canEnter) return false;
        }

        if (targetIndex > current) {
            const currentState = stepStates()[current];
            // İleri gidiyoruz
            // Sadece validation geçtiyse 'completed', aksi halde 'pending' (yarım kaldı)
            if (currentState.status !== 'skipped') {
                updateStepState(current, {
                    status: validationPassed ? 'completed' : 'pending'
                });
            }
        } else {
            updateStepState(current, {status: 'pending'});
        }

        updateStepState(targetIndex, {status: 'active', visited: true});

        currentIndex.set(targetIndex);
        onStepChange?.(current, targetIndex);

        return true;
    };

    /**
     * TR: Sonraki adıma ilerler.
     * Linear mode etkinse, mevcut adım tamamlanmadan ilerlenemez.
     *
     * EN: Moves to the next step.
     * If linear mode is active, cannot proceed without completing the current step.
     */
    const next = async (): Promise<boolean> => {
        if (isLast()) return false;
        
        // goTo will handle validation, so just delegate to it
        return goTo(currentIndex() + 1);
    };

    const prev = async (): Promise<boolean> => {
        if (isFirst() || !allowBack) return false;
        return goTo(currentIndex() - 1);
    };

    /**
     * TR: Opsiyonel adımı atlar.
     *
     * EN: Skips the optional step.
     */
    const skip = async (): Promise<boolean> => {
        const current = currentIndex();
        const step = steps[current];

        if (!step.optional) return false;

        updateStepState(current, {status: 'skipped'});

        if (!isLast()) {
            return goTo(current + 1);
        }
        return true;
    };

    const setStepData = (stepId: string, stepData: unknown) => {
        const index = steps.findIndex((s) => s.id === stepId);
        if (index >= 0) {
            updateStepState(index, {data: stepData, error: null});
        }
    };

    const getStepData = <S>(stepId: string): S | undefined => {
        const state = stepStates().find((s) => s.id === stepId);
        return state?.data as S | undefined;
    };

    const validateCurrent = async (): Promise<boolean> => {
        return validateStep(currentIndex());
    };

    const validateAll = async (): Promise<boolean> => {
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (step.optional) continue;

            const valid = await validateStep(i);
            if (!valid) {
                // TR: İlk hatada dur ve o adıma git
                // EN: Stop at first error and go to that step
                await goTo(i);
                return false;
            }
        }
        return true;
    };

    const reset = () => {
        stepStates.set(initialStates.map((s, i) => ({
            ...s,
            status: i === 0 ? 'active' : 'pending',
            visited: i === 0,
            error: null,
            data: initialData[s.id as keyof T] ?? {},
        })));
        currentIndex.set(0);
    };

    const complete = async (): Promise<T | null> => {
        const valid = await validateAll();
        if (!valid) return null;

        const finalData = data() as T;
        onComplete?.(finalData);
        return finalData;
    };

    return {
        steps: stepStates.asReadonly(),
        currentIndex: currentIndex.asReadonly(),
        currentStep,
        currentState,
        isFirst,
        isLast,
        canNext,
        canPrev,
        progress,
        data,
        isComplete,
        isValidating: isValidating.asReadonly(),
        next,
        prev,
        goTo,
        skip,
        setStepData,
        getStepData,
        validateCurrent,
        validateAll,
        reset,
        complete,
    };
}

/**
 * TR: Adım durumuna göre CSS sınıfını döndürür.
 *
 * EN: Returns CSS class based on step status.
 */
export function getStepIndicatorClass(status: StepStatus): string {
    const classes: Record<StepStatus, string> = {
        pending: 'step-pending',
        active: 'step-active',
        completed: 'step-completed',
        error: 'step-error',
        skipped: 'step-skipped',
    };
    return classes[status];
}