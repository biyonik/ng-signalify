import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Tam sayı (Integer) alanları için yapılandırma seçenekleri.
 * Ondalıklı sayıların aksine sadece minimum ve maksimum sınırları yönetir.
 *
 * EN: Configuration options for Integer fields.
 * Unlike decimal numbers, it manages only minimum and maximum limits.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface IntegerFieldConfig extends FieldConfig {
  /**
   * TR: Girilebilecek en düşük tam sayı değeri.
   *
   * EN: The minimum integer value that can be entered.
   */
  min?: number;

  /**
   * TR: Girilebilecek en yüksek tam sayı değeri.
   *
   * EN: The maximum integer value that can be entered.
   */
  max?: number;
}

/**
 * TR: Adet, yaş, yıl veya ID gibi tam sayı verilerini yöneten alan sınıfı.
 * Zod şemasında `.int()` kuralını kullanarak veri bütünlüğünü garanti eder.
 * Dış kaynaklardan gelen verileri otomatik olarak en yakın alt tam sayıya yuvarlar.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class managing integer data like quantity, age, year, or ID.
 * Ensures data integrity by using the `.int()` rule in the Zod schema.
 * Automatically floors data coming from external sources to the nearest integer.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class IntegerField extends BaseField<number> {
  /**
   * TR: IntegerField sınıfını başlatır.
   *
   * EN: Initializes the IntegerField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Tam sayı yapılandırması. / EN: Integer configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: IntegerFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Tam sayı değeri için Zod doğrulama şemasını oluşturur.
   * Standart sayı kontrolüne ek olarak `.int()` validasyonunu uygular.
   *
   * EN: Creates the Zod validation schema for the integer value.
   * Applies `.int()` validation in addition to the standard number check.
   *
   * @returns TR: Integer Zod şeması. / EN: Integer Zod schema.
   */
  schema(): z.ZodType<number> {
    let s = z
      .number({
        required_error: `${this.label} zorunludur`,
        invalid_type_error: `${this.label} sayı olmalı`,
      })
      .int(`${this.label} tam sayı olmalı`);

    if (this.config.min != null) {
      s = s.min(this.config.min, `${this.label} en az ${this.config.min} olmalı`);
    }
    if (this.config.max != null) {
      s = s.max(this.config.max, `${this.label} en fazla ${this.config.max} olmalı`);
    }

    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<number>;
    }
    return s;
  }

  /**
   * TR: Dış kaynaktan gelen veriyi (Import) işler.
   * Gelen değer ondalıklı olsa bile `Math.floor()` ile tam sayıya indirger.
   * Bu işlem, veritabanı tutarlılığı için kritiktir.
   *
   * EN: Processes data from an external source (Import).
   * Reduces the value to an integer using `Math.floor()` even if it comes as a decimal.
   * This operation is critical for database consistency.
   *
   * @param raw - TR: Ham veri. / EN: Raw data.
   * @returns TR: İşlenmiş tam sayı veya null. / EN: Processed integer or null.
   */
  override fromImport(raw: unknown): number | null {
    if (raw == null || raw === '') return null;
    const num = Number(raw);
    // TR: Sayı değilse null, sayıysa aşağı yuvarla
    // EN: Return null if not a number, floor if it is
    return isNaN(num) ? null : Math.floor(num);
  }

  /**
   * TR: Aralık filtrelemesi (Range Filter) için özel önizleme metni oluşturur.
   * Kullanıcı arayüzünde "10 - 50" veya "≥ 100" gibi ifadeler gösterir.
   *
   * EN: Generates special preview text for Range Filter.
   * Displays expressions like "10 - 50" or "≥ 100" in the user interface.
   *
   * @param value - TR: [Başlangıç, Bitiş] değer dizisi. / EN: [Start, End] value array.
   */
  filterPreviewRange(value: [number | null, number | null]): string | null {
    const [start, end] = value;
    if (start == null && end == null) return null;
    if (start != null && end == null) return `≥ ${start}`;
    if (start == null && end != null) return `≤ ${end}`;
    return `${start} - ${end}`;
  }
}