import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Ondalıklı sayı alanları için özelleştirilmiş yapılandırma seçenekleri.
 * Para birimi, ondalık hassasiyeti (scale) ve formatlama ayarlarını içerir.
 *
 * EN: Customized configuration options for decimal number fields.
 * Includes currency, decimal precision (scale), and formatting settings.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface DecimalFieldConfig extends FieldConfig {
  /**
   * TR: Virgülden sonra kaç basamak gösterileceğini belirler.
   * Varsayılan değer 2'dir. (Örn: scale 2 için 10.50)
   *
   * EN: Determines how many digits will be shown after the decimal point.
   * Default value is 2. (E.g., 10.50 for scale 2)
   */
  scale?: number;

  /**
   * TR: Girilebilecek en düşük sayısal değer.
   *
   * EN: The minimum numeric value that can be entered.
   */
  min?: number;

  /**
   * TR: Girilebilecek en yüksek sayısal değer.
   *
   * EN: The maximum numeric value that can be entered.
   */
  max?: number;

  /**
   * TR: Görüntüleme sırasında kullanılacak para birimi kodu.
   * Örn: 'TRY', 'USD', 'EUR'. Tanımlanırsa `Intl.NumberFormat` currency modunda çalışır.
   *
   * EN: Currency code to be used during display.
   * E.g., 'TRY', 'USD', 'EUR'. If defined, `Intl.NumberFormat` operates in currency mode.
   */
  currency?: string;

  /**
   * TR: Sayı formatlamasında kullanılacak yerel ayar (Locale).
   * Varsayılan olarak 'tr-TR' kullanılır.
   *
   * EN: Locale setting to be used in number formatting.
   * Defaults to 'tr-TR'.
   */
  locale?: string;
}

/**
 * TR: Ondalıklı sayılar, para birimleri ve hassas ölçümler için tasarlanmış alan sınıfı.
 * Sayısal doğrulama, hassasiyet kontrolü ve yerelleştirilmiş formatlama özelliklerini barındırır.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class designed for decimal numbers, currencies, and precise measurements.
 * Contains numerical validation, precision control, and localized formatting features.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class DecimalField extends BaseField<number> {
  /**
   * TR: DecimalField sınıfını başlatır.
   *
   * EN: Initializes the DecimalField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Ondalık sayı yapılandırması. / EN: Decimal number configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: DecimalFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Sayısal değer için Zod doğrulama şemasını oluşturur.
   * Tip kontrolü, ondalık basamak (multipleOf) kontrolü ve aralık (min/max) kontrollerini uygular.
   *
   * EN: Creates the Zod validation schema for the numeric value.
   * Applies type check, decimal digit (multipleOf) check, and range (min/max) checks.
   *
   * @returns TR: Sayısal Zod şeması. / EN: Numeric Zod schema.
   */
  schema(): z.ZodType<number> {
    // TR: Temel sayı doğrulaması ve hata mesajları
    // EN: Basic number validation and error messages
    let s = z.number({
      required_error: `${this.label} zorunludur`,
      invalid_type_error: `${this.label} sayı olmalı`,
    });

    const scale = this.config.scale ?? 2;
    // TR: Hassasiyet kontrolü için çarpan hesaplama (örn: scale 2 için 0.01)
    // EN: Calculating the multiplier for precision check (e.g., 0.01 for scale 2)
    const precision = Math.pow(10, -scale);
    
    // TR: Girilen sayının belirtilen ondalık düzene uygun olup olmadığını denetler.
    // EN: Checks if the entered number conforms to the specified decimal pattern.
    s = s.multipleOf(precision, `${this.label} en fazla ${scale} ondalık basamak olabilir`);

    if (this.config.min != null) {
      s = s.min(this.config.min, `${this.label} en az ${this.config.min} olmalı`);
    }
    if (this.config.max != null) {
      s = s.max(this.config.max, `${this.label} en fazla ${this.config.max} olmalı`);
    }

    // TR: Eğer alan zorunlu değilse, null veya undefined olmasına izin ver.
    // EN: If the field is not required, allow it to be null or undefined.
    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<number>;
    }
    return s;
  }

  /**
   * TR: Sayısal değeri kullanıcı dostu bir formata dönüştürür.
   * `Intl.NumberFormat` API'sini kullanarak para birimi sembolü ekler veya binlik ayırıcıları düzenler.
   *
   * EN: Converts the numeric value into a user-friendly format.
   * Adds currency symbols or organizes thousands separators using the `Intl.NumberFormat` API.
   *
   * @param value - TR: Formatlanacak sayı. / EN: Number to be formatted.
   * @returns TR: Formatlanmış string (örn: 1.250,50 ₺). / EN: Formatted string (e.g., 1,250.50 ₺).
   */
  override present(value: number | null): string {
    if (value == null) return '-';

    const locale = this.config.locale ?? 'tr-TR';
    const scale = this.config.scale ?? 2;

    // TR: Para birimi tanımlıysa 'currency' stilinde formatla
    // EN: If currency is defined, format in 'currency' style
    if (this.config.currency) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: this.config.currency,
        minimumFractionDigits: scale,
        maximumFractionDigits: scale,
      }).format(value);
    }

    // TR: Standart ondalıklı sayı formatı
    // EN: Standard decimal number format
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: scale,
      maximumFractionDigits: scale,
    }).format(value);
  }

  /**
   * TR: Dış kaynaktan gelen veriyi (string veya number) güvenli bir sayıya çevirir.
   * JavaScript'in kayan noktalı sayı (floating point) hatalarını önlemek için matematiksel yuvarlama yapar.
   *
   * EN: Converts data from an external source (string or number) into a safe number.
   * Performs mathematical rounding to prevent JavaScript floating-point errors.
   *
   * @param raw - TR: Ham veri. / EN: Raw data.
   * @returns TR: İşlenmiş sayı veya null. / EN: Processed number or null.
   */
  override fromImport(raw: unknown): number | null {
    if (raw == null || raw === '') return null;
    const num = Number(raw);
    if (isNaN(num)) return null;
    
    const scale = this.config.scale ?? 2;
    // TR: Hassasiyeti koruyarak yuvarlama (Floating point hatasını giderir)
    // EN: Rounding while preserving precision (Fixes floating point error)
    return Math.round(num * Math.pow(10, scale)) / Math.pow(10, scale);
  }

  /**
   * TR: Aralık filtrelemesi (Range Filter) için önizleme metni oluşturur.
   * Kullanıcıya "100 - 200 arası" veya "≥ 50" gibi anlamlı bir özet sunar.
   *
   * EN: Generates preview text for Range Filter.
   * Presents a meaningful summary to the user like "between 100 - 200" or "≥ 50".
   *
   * @param value - TR: [Başlangıç, Bitiş] değer dizisi. / EN: [Start, End] value array.
   * @returns TR: Formatlanmış aralık metni. / EN: Formatted range text.
   */
  filterPreviewRange(value: [number | null, number | null]): string | null {
    const [start, end] = value;
    if (start == null && end == null) return null;
    if (start != null && end == null) return `≥ ${this.present(start)}`;
    if (start == null && end != null) return `≤ ${this.present(end)}`;
    return `${this.present(start)} - ${this.present(end)}`;
  }
}