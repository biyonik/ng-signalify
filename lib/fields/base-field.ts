import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { z } from 'zod';
import { IField, FieldConfig, FieldValue } from './field.interface';

/**
 * TR: Tüm form alanı türlerinin (Input, Select, Datepicker vb.) türetildiği soyut temel sınıf.
 * IField arayüzünü implemente eder ve tüm alanlar için ortak olan reaktif durum yönetimi,
 * validasyon tetikleme mantığı ve veri dönüştürme işlemlerini merkezi olarak yönetir.
 * Alt sınıflar (subclasses) sadece kendilerine özgü şema ve gösterim mantığını tanımlarlar.
 *
 * EN: Abstract base class from which all form field types (Input, Select, Datepicker, etc.) are derived.
 * Implements the IField interface and centrally manages reactive state management,
 * validation triggering logic, and data transformation operations common to all fields.
 * Subclasses define only their specific schema and presentation logic.
 *
 * @template T - TR: Alanın taşıdığı veri tipi. / EN: The data type held by the field.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export abstract class BaseField<T> implements IField<T> {
  /**
   * TR: Temel alan sınıfını başlatır.
   *
   * EN: Initializes the base field class.
   *
   * @param name - TR: Alanın benzersiz anahtarı (örn: 'firstName'). / EN: Unique key of the field (e.g., 'firstName').
   * @param label - TR: Kullanıcıya gösterilecek etiket. / EN: Label to be displayed to the user.
   * @param config - TR: Opsiyonel yapılandırma (zorunluluk, ipucu vb.). / EN: Optional configuration (required, hint, etc.).
   */
  constructor(
    public readonly name: string,
    public readonly label: string,
    public readonly config: FieldConfig = {}
  ) {}

  /**
   * TR: Alt sınıflar tarafından implemente edilmesi zorunlu olan soyut metod.
   * Her alan tipi, kendi veri yapısına uygun Zod doğrulama şemasını burada tanımlamalıdır.
   *
   * EN: Abstract method required to be implemented by subclasses.
   * Each field type must define the Zod validation schema appropriate for its data structure here.
   *
   * @returns TR: Zod tip tanımlaması. / EN: Zod type definition.
   */
  abstract schema(): z.ZodType<T>;

  /**
   * TR: Alan için reaktif veri yapısını (Signals) oluşturur.
   * Angular'ın `computed` sinyallerini kullanarak, değer değiştiğinde veya alanla
   * etkileşime girildiğinde (touched) validasyon durumunu otomatik olarak yeniden hesaplar.
   *
   * EN: Creates the reactive data structure (Signals) for the field.
   * Uses Angular's `computed` signals to automatically recalculate the validation status
   * when the value changes or the field is interacted with (touched).
   *
   * @param initial - TR: Başlangıç değeri (varsayılan: null). / EN: Initial value (default: null).
   * @returns TR: Değer, hata ve durum sinyallerini içeren nesne. / EN: Object containing value, error, and status signals.
   */
  createValue(initial: T | null = null): FieldValue<T> {
    // TR: Değeri tutan ana sinyal
    // EN: Main signal holding the value
    const value = signal<T | null>(initial);

    // TR: Kullanıcı etkileşimini izleyen sinyal
    // EN: Signal tracking user interaction
    const touched = signal(false);

    // TR: Hata durumu: Sadece alan 'touched' ise ve şema doğrulaması başarısızsa hata döner.
    // EN: Error state: Returns an error only if the field is 'touched' and schema validation fails.
    const error = computed(() => {
      if (!touched()) return null;
      const result = this.schema().safeParse(value());
      // TR: Hata varsa ilk hata mesajını, yoksa genel bir mesaj döndür.
      // EN: Return the first error message if exists, otherwise a generic message.
      return result.success ? null : result.error.errors[0]?.message ?? 'Geçersiz';
    });

    // TR: Geçerlilik durumu: Hata yoksa alan geçerlidir.
    // EN: Validity state: The field is valid if there are no errors.
    const valid = computed(() => error() === null);

    return { value, error, touched, valid };
  }

  /**
   * TR: Değerin kullanıcı arayüzünde nasıl görüneceğini belirleyen varsayılan sunum metodu.
   * Değer null ise tire (-) işareti, değilse string karşılığını döner.
   * Alt sınıflar daha spesifik formatlama için bunu ezebilir (override).
   *
   * EN: Default presentation method determining how the value appears in the UI.
   * Returns a dash (-) if value is null, otherwise returns its string representation.
   * Subclasses can override this for specific formatting.
   */
  present(value: T | null): string {
    if (value == null) return '-';
    return String(value);
  }

  /**
   * TR: Veriyi dışa aktarım (API vb.) için hazırlar.
   * Varsayılan olarak değeri olduğu gibi döndürür.
   *
   * EN: Prepares data for export (API, etc.).
   * Returns the value as is by default.
   */
  toExport(value: T | null): unknown {
    return value;
  }

  /**
   * TR: Dış kaynaktan gelen veriyi işler.
   * Gelen veriyi şema (schema) üzerinden geçirerek güvenli bir şekilde parse eder (`safeParse`).
   *
   * EN: Processes data coming from an external source.
   * Safely parses the incoming data by passing it through the schema (`safeParse`).
   */
  fromImport(raw: unknown): T | null {
    const result = this.schema().safeParse(raw);
    return result.success ? result.data : null;
  }

  /**
   * TR: Filtreleme alanlarında kullanılacak önizleme metni.
   * Varsayılan olarak `present` metodunu kullanır.
   *
   * EN: Preview text to be used in filtering fields.
   * Uses the `present` method by default.
   */
  filterPreview(value: T | null): string | null {
    if (value == null) return null;
    return this.present(value);
  }

  /**
   * TR: Şemaya 'zorunlu alan' kuralını dinamik olarak uygular.
   * Config dosyasındaki `required` ayarına göre Zod şemasını nullable/optional hale getirir veya olduğu gibi bırakır.
   *
   * EN: Dynamically applies the 'required field' rule to the schema.
   * Makes the Zod schema nullable/optional or leaves it as is based on the `required` setting in the config.
   *
   * @param schema - TR: İşlenecek Zod şeması. / EN: Zod schema to be processed.
   * @returns TR: Modifiye edilmiş şema. / EN: Modified schema.
   */
  protected applyRequired<S extends z.ZodType>(schema: S): S {
    if (this.config.required) {
      return schema as S;
    }
    // TR: Zorunlu değilse null veya undefined olabilir.
    // EN: Can be null or undefined if not required.
    return schema.nullable().optional() as unknown as S;
  }
}