import {computed, Signal} from '@angular/core';
import {z} from 'zod';
import {FieldValue, IField} from '../fields';

/**
 * TR: Formun anlık durumunu (State) ve yönetim fonksiyonlarını barındıran arayüz.
 * Angular Signals tabanlıdır; bu sayede formdaki herhangi bir değişiklik (değer, hata, validasyon)
 * anında ve performanslı bir şekilde UI'a yansır (Fine-grained reactivity).
 *
 * EN: Interface holding the instant state and management functions of the form.
 * Based on Angular Signals; ensuring any change in the form (value, error, validation)
 * is reflected to the UI instantly and performantly (Fine-grained reactivity).
 *
 * @template T - TR: Form verisinin tipi. / EN: Type of the form data.
 */
export interface FormState<T extends Record<string, unknown>> {
    /**
     * TR: Formdaki her bir alanın (Field) kendi durumunu tutan nesne haritası.
     * Alan adına göre erişim sağlar. Her alan kendi value, error, touched sinyallerine sahiptir.
     *
     * EN: Object map holding the state of each field in the form.
     * Provides access by field name. Each field has its own value, error, and touched signals.
     */
    fields: { [K in keyof T]: FieldValue<T[K]> };

    /**
     * TR: Formun tamamındaki verileri tek bir nesne olarak döndüren hesaplanmış (computed) sinyal.
     * Alanlardan herhangi biri değiştiğinde bu sinyal otomatik olarak güncellenir.
     *
     * EN: Computed signal returning data of the entire form as a single object.
     * Automatically updates when any of the fields changes.
     */
    values: Signal<T>;

    /**
     * TR: Formun genel geçerlilik durumu.
     * Tüm alanlar geçerliyse `true`, en az bir hata varsa `false` döner.
     *
     * EN: Overall validity status of the form.
     * Returns `true` if all fields are valid, `false` if there is at least one error.
     */
    valid: Signal<boolean>;

    /**
     * TR: Formdaki tüm hataları (alan bazlı) içeren sinyal.
     * Örn: { email: "Geçersiz format", password: "Çok kısa" }
     *
     * EN: Signal containing all errors (field-based) in the form.
     * E.g., { email: "Invalid format", password: "Too short" }
     */
    errors: Signal<Record<string, string | null>>;

    /**
     * TR: Formun "kirli" (dirty) olup olmadığını belirten sinyal.
     * Kullanıcı en az bir alanla etkileşime girdiyse veya değer değiştirdiyse `true` olur.
     *
     * EN: Signal indicating whether the form is "dirty".
     * Becomes `true` if the user has interacted with or changed the value of at least one field.
     */
    dirty: Signal<boolean>;

    /**
     * TR: Formdaki tüm alanları "dokunulmuş" (touched) olarak işaretler.
     * Genellikle "Kaydet" butonuna basıldığında tüm validasyon hatalarını görünür kılmak için çağrılır.
     *
     * EN: Marks all fields in the form as "touched".
     * Usually called when the "Save" button is clicked to make all validation errors visible.
     */
    touchAll: () => void;

    /**
     * TR: Formu belirtilen değerlerle veya varsayılan haliyle sıfırlar.
     * Hata mesajlarını ve "touched" durumlarını temizler.
     *
     * EN: Resets the form with specified values or to its default state.
     * Clears error messages and "touched" statuses.
     */
    reset: (values?: Partial<T>) => void;

    /**
     * TR: Form verilerini Zod şeması üzerinden geçirerek (parse/transform) son halini döndürür.
     * Tip güvenli (Type-safe) veri çıktısı almak için kullanılır.
     *
     * EN: Returns the final version of form data by passing it through the Zod schema (parse/transform).
     * Used to retrieve type-safe data output.
     */
    getValues: () => T;

    /**
     * TR: Tüm alanları manuel olarak doğrular (Validate).
     * Submit işleminden önce çağrılması önerilir.
     * * EN: Manually validates all fields.
     * Recommended to call before submit.
     */
    validateAll: () => Promise<boolean>;
}

/**
 * TR: Form yapısını tanımlayan, yöneten ve çalışma zamanında (runtime) inşa eden ana sınıf.
 * Bağımsız alan (Field) tanımlarını birleştirir, merkezi bir validasyon şeması (Zod Object) oluşturur
 * ve reaktif form durumunu (FormState) başlatır.
 *
 * EN: Main class defining, managing, and constructing the form structure at runtime.
 * Combines independent Field definitions, creates a central validation schema (Zod Object),
 * and initializes the reactive form state (FormState).
 *
 * @template T - TR: Formun veri yapısı. / EN: Data structure of the form.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class FormSchema<T extends Record<string, unknown>> {
    private fieldMap: Map<string, IField<unknown>>;
    private zodSchema: z.ZodObject<z.ZodRawShape>;

    /**
     * TR: FormSchema sınıfını başlatır.
     *
     * EN: Initializes the FormSchema class.
     *
     * @param fields - TR: Formu oluşturacak alanların listesi. / EN: List of fields to create the form.
     */
    constructor(private fields: IField<unknown>[]) {
        // TR: Hızlı erişim için alanları bir Map'e dönüştür
        // EN: Convert fields to a Map for quick access
        this.fieldMap = new Map(fields.map((f) => [f.name, f]));
        this.zodSchema = this.buildZodSchema();
    }

    /**
     * TR: Formdaki tüm alanların bireysel şemalarını birleştirerek tek bir Zod Nesne Şeması oluşturur.
     * Bu sayede formun bütünü üzerinde validasyon (örn: birbirine bağlı alanlar) yapılabilir hale gelir.
     *
     * EN: Creates a single Zod Object Schema by combining individual schemas of all fields in the form.
     * This enables validation over the entire form (e.g., interdependent fields).
     */
    private buildZodSchema(): z.ZodObject<z.ZodRawShape> {
        const shape: z.ZodRawShape = {};
        for (const field of this.fields) {
            shape[field.name] = field.schema();
        }
        return z.object(shape);
    }

    /**
     * TR: Tanımlanan şemaya göre yeni bir reaktif form durumu (FormState) oluşturur.
     * Angular'ın `signal` ve `computed` özelliklerini kullanarak veri akışını kurgular.
     *
     * EN: Creates a new reactive form state (FormState) based on the defined schema.
     * Orchestrates data flow using Angular's `signal` and `computed` features.
     *
     * @param initial - TR: Formun başlangıç değerleri (Opsiyonel). / EN: Initial values of the form (Optional).
     * @returns TR: Yönetilebilir form durumu nesnesi. / EN: Manageable form state object.
     */
    public createForm(initial: Partial<T> = {}): FormState<T> {
        // TR: 1. Adım: Her bir alan için FieldValue (Signal wrapper) oluştur.
        // EN: Step 1: Create FieldValue (Signal wrapper) for each field.
        const fieldEntries = this.fields.map((field) => {
            const initValue = initial[field.name as keyof T] ?? null;
            return [field.name, field.createValue(initValue)] as const;
        });

        const fields = Object.fromEntries(fieldEntries) as FormState<T>['fields'];

        // TR: 2. Adım: Tüm alanların değerlerini dinleyen merkezi 'values' sinyali.
        // EN: Step 2: Central 'values' signal listening to values of all fields.
        const values = computed(() => {
            const result: Record<string, unknown> = {};
            for (const [name, fv] of Object.entries(fields)) {
                result[name] = (fv as FieldValue<unknown>).value();
            }
            return result as T;
        });

        // TR: 3. Adım: Hataları toplayan sinyal.
        // EN: Step 3: Signal collecting errors.
        const errors = computed(() => {
            const result: Record<string, string | null> = {};
            for (const [name, fv] of Object.entries(fields)) {
                result[name] = (fv as FieldValue<unknown>).error();
            }
            return result;
        });

        // TR: 4. Adım: Genel geçerlilik (validity) kontrolü.
        // EN: Step 4: Overall validity check.
        const valid = computed(() => {
            return Object.values(fields).every((fv) => (fv as FieldValue<unknown>).valid());
        });

        // TR: 5. Adım: Kirli (dirty) kontrolü - Herhangi bir alana dokunuldu mu?
        // EN: Step 5: Dirty check - Has any field been touched?
        const dirty = computed(() => {
            return Object.values(fields).some((fv) => (fv as FieldValue<unknown>).touched());
        });

        // TR: Yardımcı Fonksiyon: Tüm alanları 'touched' yap (Hataları göster).
        // EN: Helper Function: Mark all fields as 'touched' (Show errors).
        const touchAll = () => {
            for (const fv of Object.values(fields)) {
                (fv as FieldValue<unknown>).touched.set(true);
            }
        };

        // TR: Yardımcı Fonksiyon: Formu sıfırla.
        // EN: Helper Function: Reset the form.
        const reset = (newValues: Partial<T> = {}) => {
            for (const [name, fv] of Object.entries(fields)) {
                const fieldValue = fv as FieldValue<unknown>;
                fieldValue.value.set(newValues[name as keyof T] ?? null);
                fieldValue.touched.set(false);
            }
        };

        // TR: Yardımcı Fonksiyon: Validasyondan geçmiş temiz veriyi al.
        // EN: Helper Function: Get validated clean data.
        const getValues = (): T => {
            return this.zodSchema.parse(values()) as T;
        };

        const validateAll = async (): Promise<boolean> => {
            // 1. Tüm alanları touch et (UI'da hataların görünmesini sağlar)
            touchAll();

            // 2. Zod validasyonunu çalıştır (Genel durum kontrolü için)
            // BaseField validasyonları senkron olduğu için valid() sinyali anında güncellenmiştir.
            // Ancak asenkron durumlar için safeParseAsync kullanmak iyi bir pratiktir.
            const result = await this.zodSchema.safeParseAsync(values());

            return result.success;
        };

        return {fields, values, valid, errors, dirty, touchAll, reset, getValues, validateAll};
    }

    /**
     * TR: İsme göre alan tanımını getirir.
     *
     * EN: Gets the field definition by name.
     */
    getField(name: string): IField<unknown> | undefined {
        return this.fieldMap.get(name);
    }

    /**
     * TR: Tüm alan listesini döndürür.
     *
     * EN: Returns the list of all fields.
     */
    getFields(): IField<unknown>[] {
        return this.fields;
    }

    /**
     * TR: Tüm alanların etiketlerini (Label) döndürür. CSV export başlıkları için kullanışlıdır.
     *
     * EN: Returns labels of all fields. Useful for CSV export headers.
     */
    getLabels(): string[] {
        return this.fields.map((f) => f.label);
    }

    /**
     * TR: Tüm alanların anahtar (Key/Name) isimlerini döndürür.
     *
     * EN: Returns key/name of all fields.
     */
    getNames(): string[] {
        return this.fields.map((f) => f.name);
    }
}