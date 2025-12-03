import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: JSON veri alanları için yapılandırma seçenekleri.
 * Verinin yapısal doğrulaması (Schema) ve görüntüleme formatlarını (Pretty Print) yönetir.
 *
 * EN: Configuration options for JSON data fields.
 * Manages structural validation (Schema) and display formats (Pretty Print).
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface JsonFieldConfig extends FieldConfig {
  /**
   * TR: JSON içeriğini doğrulamak için kullanılacak özel Zod şeması.
   * Eğer belirtilmezse, herhangi bir geçerli obje kabul edilir.
   *
   * EN: Custom Zod schema used to validate JSON content.
   * If not specified, any valid object is accepted.
   */
  schema?: z.ZodType<unknown>;

  /**
   * TR: Görüntüleme sırasında JSON'un okunabilir (Pretty Print) formatta olup olmayacağı.
   * True ise girintili (indentation) gösterim yapılır.
   *
   * EN: Whether the JSON should be in readable (Pretty Print) format during display.
   * If true, indented display is used.
   */
  prettyPrint?: boolean;

  /**
   * TR: JSON ağacının gösterim derinliği sınırı.
   * Çok derin objelerin UI'da performans sorunu yaratmaması için kullanılır.
   *
   * EN: Display depth limit of the JSON tree.
   * Used to prevent very deep objects from causing performance issues in the UI.
   */
  maxDisplayDepth?: number;
}

/**
 * TR: Karmaşık nesneleri ve dinamik veri yapılarını yöneten alan sınıfı.
 * Metin tabanlı düzenleme (Editor), şema validasyonu ve derinlemesine veri erişimi (Dot Notation) sağlar.
 * Veri bütünlüğünü korumak için immutable (değişmez) güncelleme yöntemleri kullanır.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class managing complex objects and dynamic data structures.
 * Provides text-based editing, schema validation, and deep data access (Dot Notation).
 * Uses immutable update methods to maintain data integrity.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class JsonField extends BaseField<Record<string, unknown>> {
  /**
   * TR: JsonField sınıfını başlatır.
   *
   * EN: Initializes the JsonField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: JSON yapılandırması. / EN: JSON configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: JsonFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: JSON verisi için Zod doğrulama şemasını oluşturur.
   * Eğer config içinde özel bir `schema` verilmişse onu kullanır.
   * Verilmemişse, genel bir `Record<string, unknown>` (Key-Value nesnesi) bekler.
   *
   * EN: Creates the Zod validation schema for JSON data.
   * If a custom `schema` is provided in the config, it uses that.
   * If not, it expects a generic `Record<string, unknown>` (Key-Value object).
   *
   * @returns TR: Record Zod şeması. / EN: Record Zod schema.
   */
  schema(): z.ZodType<Record<string, unknown>> {
    // TR: Custom schema varsa onu kullan
    // EN: Use custom schema if exists
    if (this.config.schema) {
      if (this.config.required) {
        return this.config.schema as z.ZodType<Record<string, unknown>>;
      }
      return this.config.schema
        .nullable()
        .optional() as unknown as z.ZodType<Record<string, unknown>>;
    }

    // TR: Default: Herhangi bir object kabul et
    // EN: Default: Accept any object
    const s = z.record(z.unknown(), {
      required_error: `${this.label} zorunludur`,
    });

    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<Record<string, unknown>>;
    }
    return s as z.ZodType<Record<string, unknown>>;
  }

  /**
   * TR: JSON nesnesini UI'da gösterilmek üzere string formatına çevirir.
   * `prettyPrint` ayarına göre formatlar. Hatalı JSON durumunda fallback mesajı döner.
   * Uzun verileri otomatik olarak kısaltır (truncate).
   *
   * EN: Converts the JSON object to string format for display in the UI.
   * Formats according to `prettyPrint` setting. Returns a fallback message in case of invalid JSON.
   * Automatically truncates long data.
   */
  override present(value: Record<string, unknown> | null): string {
    if (value == null) return '-';

    try {
      if (this.config.prettyPrint) {
        return JSON.stringify(value, null, 2);
      }
      const str = JSON.stringify(value);
      // TR: Çok uzunsa kısalt
      // EN: Truncate if too long
      if (str.length > 100) {
        return str.substring(0, 100) + '...';
      }
      return str;
    } catch {
      return '[Invalid JSON]';
    }
  }

  /**
   * TR: Dışa aktarım için veriyi JSON string'e dönüştürür (Serialize).
   *
   * EN: Converts data to JSON string for export (Serialize).
   */
  override toExport(value: Record<string, unknown> | null): string | null {
    if (value == null) return null;
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  /**
   * TR: Dış kaynaktan gelen veriyi (Import) işler.
   * Hem string formatındaki JSON'u hem de halihazırda obje olan veriyi kabul eder.
   * Dizi (Array) formatındaki JSON köklerini reddeder (sadece Object kabul eder).
   *
   * EN: Processes data from an external source (Import).
   * Accepts both JSON in string format and data that is already an object.
   * Rejects JSON roots in Array format (accepts only Object).
   */
  override fromImport(raw: unknown): Record<string, unknown> | null {
    if (raw == null || raw === '') return null;

    // TR: Zaten bir obje ise (ve array değilse)
    // EN: If already an object (and not an array)
    if (typeof raw === 'object' && !Array.isArray(raw)) {
      return raw as Record<string, unknown>;
    }

    // TR: JSON string parse denemesi
    // EN: JSON string parse attempt
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * TR: Veriyi config içinde tanımlanan özel şemaya (varsa) göre doğrular.
   * Metin editöründeki anlık değişiklikleri kontrol etmek için kullanılır.
   *
   * EN: Validates data against the custom schema defined in config (if any).
   * Used to check instant changes in the text editor.
   *
   * @param value - TR: Kontrol edilecek veri. / EN: Data to check.
   * @returns TR: Validasyon sonucu ve varsa hata mesajı. / EN: Validation result and error message if any.
   */
  validateJson(value: unknown): { valid: boolean; error?: string } {
    if (this.config.schema) {
      const result = this.config.schema.safeParse(value);
      if (!result.success) {
        return {
          valid: false,
          error: result.error.errors[0]?.message ?? 'Geçersiz JSON yapısı',
        };
      }
    }
    return { valid: true };
  }

  /**
   * TR: Bir string'i güvenli bir şekilde JSON objesine parse eder.
   * Array veya Primitive tipleri (sayı, boolean vb.) reddeder, sadece `{}` yapısını kabul eder.
   *
   * EN: Safely parses a string into a JSON object.
   * Rejects Array or Primitive types (number, boolean, etc.), accepts only `{}` structure.
   */
  parseJsonString(str: string): { value: Record<string, unknown> | null; error?: string } {
    try {
      const parsed = JSON.parse(str);
      if (typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { value: null, error: 'JSON bir obje olmalı' };
      }
      return { value: parsed };
    } catch (e) {
      return { value: null, error: 'Geçersiz JSON formatı' };
    }
  }

  /**
   * TR: Nokta notasyonu (dot notation) kullanarak derinlikli veri okur.
   * Örn: `getValue(data, 'user.address.city')`.
   * Yol üzerindeki herhangi bir parça eksikse `undefined` döner.
   *
   * EN: Reads deep data using dot notation.
   * E.g., `getValue(data, 'user.address.city')`.
   * Returns `undefined` if any part of the path is missing.
   *
   * @param obj - TR: Kaynak obje. / EN: Source object.
   * @param path - TR: Erişim yolu (örn: 'a.b.c'). / EN: Access path (e.g., 'a.b.c').
   */
  getValue<T>(obj: Record<string, unknown> | null, path: string): T | undefined {
    if (!obj) return undefined;

    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current == null || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }

    return current as T;
  }

  /**
   * TR: Nokta notasyonu kullanarak veriyi günceller ve yeni bir obje döndürür (Immutable).
   * Orijinal objeyi değiştirmez (Mutation yapmaz), yol üzerindeki nesnelerin kopyasını oluşturur.
   * Angular Change Detection stratejileri için uygundur.
   *
   * EN: Updates data using dot notation and returns a new object (Immutable).
   * Does not modify the original object (No mutation), creates copies of objects along the path.
   * Suitable for Angular Change Detection strategies.
   *
   * @param obj - TR: Kaynak obje. / EN: Source object.
   * @param path - TR: Güncellenecek yol. / EN: Path to update.
   * @param value - TR: Yeni değer. / EN: New value.
   */
  setValue(
    obj: Record<string, unknown> | null,
    path: string,
    value: unknown
  ): Record<string, unknown> {
    const result = { ...(obj ?? {}) };
    const keys = path.split('.');
    let current: Record<string, unknown> = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      // TR: Yol yoksa veya obje değilse yeni obje oluştur
      // EN: Create new object if path doesn't exist or not an object
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      } else {
        // TR: Shallow copy ile referansı kopar (Immutability)
        // EN: Break reference with shallow copy (Immutability)
        current[key] = { ...(current[key] as Record<string, unknown>) };
      }
      current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    return result;
  }

  /**
   * TR: Objenin en üst seviyedeki anahtarlarını listeler.
   *
   * EN: Lists the top-level keys of the object.
   */
  getKeys(obj: Record<string, unknown> | null): string[] {
    if (!obj) return [];
    return Object.keys(obj);
  }
}