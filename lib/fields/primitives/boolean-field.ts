import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Mantıksal alanlar için yapılandırma seçenekleri.
 * Kullanıcı arayüzünde 'True/False' yerine gösterilecek özel etiketleri (Örn: Aktif/Pasif, Var/Yok) yönetir.
 *
 * EN: Configuration options for boolean fields.
 * Manages custom labels (e.g., Active/Passive, Exists/None) to be displayed in the UI instead of 'True/False'.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface BooleanFieldConfig extends FieldConfig {
  /**
   * TR: Değer `true` olduğunda gösterilecek metin.
   * Varsayılan: "Evet".
   *
   * EN: Text to display when the value is `true`.
   * Default: "Yes" (or localized equivalent "Evet").
   */
  yesLabel?: string;

  /**
   * TR: Değer `false` olduğunda gösterilecek metin.
   * Varsayılan: "Hayır".
   *
   * EN: Text to display when the value is `false`.
   * Default: "No" (or localized equivalent "Hayır").
   */
  noLabel?: string;
}

/**
 * TR: Onay kutuları (Checkbox) veya geçiş düğmeleri (Toggle Switch) için kullanılan alan sınıfı.
 * Veriyi boolean olarak saklar ancak dış dünyayla iletişimde (Import/Export/Display)
 * insan tarafından okunabilir formatlara dönüştürür.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class used for Checkboxes or Toggle Switches.
 * Stores data as boolean but converts it to human-readable formats
 * for external communication (Import/Export/Display).
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class BooleanField extends BaseField<boolean> {
  /**
   * TR: BooleanField sınıfını başlatır.
   *
   * EN: Initializes the BooleanField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Boolean yapılandırması. / EN: Boolean configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: BooleanFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Mantıksal değer için Zod doğrulama şemasını oluşturur.
   * Temel boolean kontrolü yapar. Zorunlu değilse null/undefined kabul eder.
   *
   * EN: Creates the Zod validation schema for the logical value.
   * Performs basic boolean check. Accepts null/undefined if not required.
   *
   * @returns TR: Boolean Zod şeması. / EN: Boolean Zod schema.
   */
  schema(): z.ZodType<boolean> {
    const s = z.boolean({ required_error: `${this.label} zorunludur` });

    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<boolean>;
    }
    return s;
  }

  /**
   * TR: Değeri kullanıcı arayüzünde gösterilmek üzere formatlar.
   * `true` için `yesLabel`, `false` için `noLabel` konfigürasyonunu kullanır.
   *
   * EN: Formats the value for display in the user interface.
   * Uses `yesLabel` configuration for `true`, and `noLabel` for `false`.
   */
  override present(value: boolean | null): string {
    if (value == null) return '-';
    const yes = this.config.yesLabel ?? 'Evet';
    const no = this.config.noLabel ?? 'Hayır';
    return value ? yes : no;
  }

  /**
   * TR: Dış kaynaktan gelen veriyi işler ve boolean'a çevirmeye çalışır.
   * Esnek eşleştirme (Fuzzy Matching) kullanır:
   * - String: 'true', 'evet', '1', 'yes' -> true
   * - String: 'false', 'hayır', '0', 'no' -> false
   * - Number: 0 harici her şey -> true
   *
   * EN: Processes data from an external source and tries to convert it to boolean.
   * Uses Fuzzy Matching:
   * - String: 'true', 'evet', '1', 'yes' -> true
   * - String: 'false', 'hayır', '0', 'no' -> false
   * - Number: Anything other than 0 -> true
   *
   * @param raw - TR: Ham veri. / EN: Raw data.
   * @returns TR: Boolean veya null. / EN: Boolean or null.
   */
  override fromImport(raw: unknown): boolean | null {
    if (raw == null || raw === '') return null;
    if (typeof raw === 'boolean') return raw;
    
    if (typeof raw === 'string') {
      const lower = raw.toLowerCase().trim();
      if (['true', 'evet', '1', 'yes'].includes(lower)) return true;
      if (['false', 'hayır', '0', 'no'].includes(lower)) return false;
    }
    
    if (typeof raw === 'number') return raw !== 0;
    
    return null;
  }

  /**
   * TR: Dışa aktarım (Export) için değeri metne dönüştürür.
   * `present` metodunu kullanarak Excel/CSV çıktılarında "True/False" yerine
   * anlamlı etiketlerin ("Aktif/Pasif") görünmesini sağlar.
   *
   * EN: Converts the value to text for export.
   * Uses the `present` method to ensure meaningful labels ("Active/Passive")
   * appear in Excel/CSV outputs instead of "True/False".
   */
  override toExport(value: boolean | null): string {
    return this.present(value);
  }
}