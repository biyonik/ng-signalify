import { Signal, WritableSignal } from '@angular/core';
import { z } from 'zod';

/**
 * TR: Alan (Field) konfigürasyon seçeneklerini tanımlayan arayüz.
 * Bu arayüz, bir form alanının görünürlüğü, zorunluluğu ve kullanıcıya sunulan ipuçları gibi
 * temel yapılandırma ayarlarını belirler.
 *
 * EN: Interface defining field configuration options.
 * This interface determines the basic configuration settings of a form field,
 * such as visibility, requirement status, and hints presented to the user.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface FieldConfig {
  /**
   * TR: Alanın doldurulmasının zorunlu olup olmadığını belirtir.
   * Eğer true ise, doğrulama şeması bu alanı zorunlu kılar.
   *
   * EN: Indicates whether filling the field is mandatory.
   * If true, the validation schema enforces this field as required.
   */
  required?: boolean;

  /**
   * TR: Kullanıcı arayüzünde alanın altında veya yanında gösterilecek yardımcı metin.
   * Kullanıcıya beklenen veri formatı hakkında bilgi vermek için kullanılır.
   *
   * EN: Helper text to be displayed below or next to the field in the user interface.
   * Used to inform the user about the expected data format.
   */
  hint?: string;

  /**
   * TR: Alan boşken içerisinde görünecek olan yer tutucu metin.
   *
   * EN: Placeholder text to appear inside the field when it is empty.
   */
  placeholder?: string;
}

/**
 * TR: Alan değerini ve durumunu yöneten Signal tabanlı sarmalayıcı yapı.
 * Angular Signals mimarisini kullanarak, veri akışını reaktif bir şekilde yönetir.
 * Değerin kendisi, doğrulama hataları, etkileşim durumu ve geçerlilik bilgisini içerir.
 *
 * EN: Signal-based wrapper structure managing the field value and state.
 * Manages data flow reactively using the Angular Signals architecture.
 * Contains the value itself, validation errors, interaction status, and validity information.
 *
 * @template T - TR: Alanın taşıyacağı verinin tipi. / EN: The type of data the field will hold.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface FieldValue<T> {
  /**
   * TR: Alanın anlık değerini tutan yazılabilir sinyal (WritableSignal).
   * UI üzerinden veya programatik olarak güncellenebilir.
   *
   * EN: Writable signal holding the instant value of the field.
   * Can be updated via the UI or programmatically.
   */
  value: WritableSignal<T>;

  /**
   * TR: Doğrulama sonucu oluşan hata mesajını taşıyan salt okunur sinyal.
   * Eğer değer geçerli ise null döner.
   *
   * EN: Read-only signal carrying the error message resulting from validation.
   * Returns null if the value is valid.
   */
  error: Signal<string | null>;

  /**
   * TR: Kullanıcının alanla etkileşime girip girmediğini (focus/blur) belirten yazılabilir sinyal.
   * Genellikle hata mesajlarının ne zaman gösterileceğini belirlemek için kullanılır.
   *
   * EN: Writable signal indicating whether the user has interacted with the field (focus/blur).
   * Usually used to determine when to display error messages.
   */
  touched: WritableSignal<boolean>;

  /**
   * TR: Alanın geçerlilik durumunu belirten salt okunur sinyal.
   * Zod şeması ile yapılan doğrulama sonucuna göre true veya false döner.
   *
   * EN: Read-only signal indicating the validity status of the field.
   * Returns true or false based on the validation result performed with the Zod schema.
   */
  valid: Signal<boolean>;
}

/**
 * TR: Tüm alan türleri için temel sözleşmeyi (contract) tanımlayan ana arayüz.
 * Her bir alan tipi (metin, sayı, tarih vb.) bu arayüzü implemente ederek
 * kendi mantığını, doğrulama kurallarını ve veri dönüşümlerini sağlamalıdır.
 *
 * EN: The main interface defining the core contract for all field types.
 * Each field type (text, number, date, etc.) must implement this interface
 * to provide its own logic, validation rules, and data transformations.
 *
 * @template T - TR: Alanın işlediği veri tipi (varsayılan: unknown). / EN: Data type processed by the field (default: unknown).
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface IField<T = unknown> {
  /**
   * TR: Alanın sistemdeki benzersiz tanımlayıcısı (key).
   * Veritabanı sütun adı veya API parametre adı olarak kullanılır.
   *
   * EN: Unique identifier (key) of the field in the system.
   * Used as a database column name or API parameter name.
   */
  readonly name: string;

  /**
   * TR: Kullanıcı arayüzünde gösterilecek okunabilir etiket.
   *
   * EN: Readable label to be displayed in the user interface.
   */
  readonly label: string;

  /**
   * TR: Alana özgü yapılandırma ayarlarını tutan nesne.
   *
   * EN: Object holding configuration settings specific to the field.
   */
  readonly config: FieldConfig;

  /**
   * TR: Alanın doğrulama kurallarını içeren Zod şemasını oluşturur ve döndürür.
   * Bu şema, veri bütünlüğünü ve tip güvenliğini sağlamak için kullanılır.
   *
   * EN: Creates and returns the Zod schema containing the validation rules for the field.
   * This schema is used to ensure data integrity and type safety.
   *
   * @returns TR: Zod tip tanımlaması. / EN: Zod type definition.
   */
  schema(): z.ZodType<T>;

  /**
   * TR: Alan için reaktif durum nesnesini (FieldValue) oluşturur.
   * Başlangıç değeri verilirse durumu buna göre ilklendirir.
   *
   * EN: Creates the reactive state object (FieldValue) for the field.
   * Initializes the state accordingly if an initial value is provided.
   *
   * @param initial - TR: Başlangıç değeri (opsiyonel). / EN: Initial value (optional).
   * @returns TR: Yönetilebilir alan değeri nesnesi. / EN: Manageable field value object.
   */
  createValue(initial?: T): FieldValue<T>;

  /**
   * TR: Ham veriyi kullanıcı arayüzünde gösterilmek üzere formatlar.
   * Örn: Tarih objesini "DD.MM.YYYY" formatına çevirmek veya para birimi eklemek gibi.
   *
   * EN: Formats raw data for display in the user interface.
   * E.g., Converting a date object to "DD.MM.YYYY" format or adding currency symbols.
   *
   * @param value - TR: Formatlanacak ham değer. / EN: Raw value to be formatted.
   * @returns TR: Kullanıcı dostu string gösterimi. / EN: User-friendly string representation.
   */
  present(value: T | null): string;

  /**
   * TR: Uygulama içi veriyi dışa aktarım (API gönderimi, JSON çıktı vb.) için hazırlar.
   * Tip dönüşümleri ve serileştirme işlemleri burada yapılır.
   *
   * EN: Prepares in-app data for export (API submission, JSON output, etc.).
   * Type conversions and serialization operations are performed here.
   *
   * @param value - TR: Uygulama içi değer. / EN: In-app value.
   * @returns TR: Dışa aktarılmaya uygun veri formatı. / EN: Data format suitable for export.
   */
  toExport(value: T | null): unknown;

  /**
   * TR: Dış kaynaktan (API, dosya vb.) gelen ham veriyi uygulamanın kullanabileceği tipe dönüştürür.
   * Deserileştirme ve tip zorlama (type coercion) işlemleri burada yapılır.
   *
   * EN: Converts raw data from an external source (API, file, etc.) into a type usable by the application.
   * Deserialization and type coercion operations are performed here.
   *
   * @param raw - TR: Dış kaynaktan gelen ham veri. / EN: Raw data from external source.
   * @returns TR: Uygulama içi kullanıma uygun tipte değer. / EN: Value in a type suitable for in-app use.
   */
  fromImport(raw: unknown): T | null;

  /**
   * TR: Filtreleme arayüzlerinde veya özet görünümlerde kullanılacak kısa önizleme metni oluşturur.
   * Değer boşsa veya gösterim için uygun değilse null dönebilir.
   *
   * EN: Generates a short preview text to be used in filtering interfaces or summary views.
   * Can return null if the value is empty or not suitable for display.
   *
   * @param value - TR: Önizlenecek değer. / EN: Value to be previewed.
   * @returns TR: Kısa önizleme metni veya null. / EN: Short preview text or null.
   */
  filterPreview(value: T | null): string | null;
}

/**
 * TR: Desteklenen alan türlerini belirten ayırıcı (discriminator) tip tanımı.
 * Dinamik form oluşturma süreçlerinde ve tip güvenliğinde hangi bileşenin render edileceğini belirlemek için kullanılır.
 *
 * EN: Discriminator type definition specifying the supported field types.
 * Used to determine which component to render in dynamic form generation processes and for type safety.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export type FieldType =
  | 'string'    // TR: Metin tabanlı alanlar / EN: Text-based fields
  | 'integer'   // TR: Tam sayı alanları / EN: Integer fields
  | 'decimal'   // TR: Ondalıklı sayı alanları / EN: Decimal number fields
  | 'boolean'   // TR: Mantıksal (E/H) alanlar / EN: Logical (Y/N) fields
  | 'date'      // TR: Sadece tarih içeren alanlar / EN: Fields containing only date
  | 'datetime'  // TR: Tarih ve saat içeren alanlar / EN: Fields containing date and time
  | 'enum'      // TR: Belirli seçeneklerden birini seçtiren alanlar / EN: Fields allowing selection from specific options
  | 'relation'  // TR: Başka bir veri setiyle ilişkili alanlar / EN: Fields related to another dataset
  | 'file';     // TR: Dosya yükleme alanları / EN: File upload fields