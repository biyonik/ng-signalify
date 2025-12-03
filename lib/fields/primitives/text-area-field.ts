import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Çok satırlı metin alanları (Textarea) için özel yapılandırma seçenekleri.
 * Görsel yükseklik (satır sayısı) ve karakter uzunluk kısıtlamalarını yönetir.
 *
 * EN: Special configuration options for multi-line text fields (Textarea).
 * Manages visual height (row count) and character length constraints.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface TextAreaFieldConfig extends FieldConfig {
  /**
   * TR: Girilmesi gereken minimum karakter sayısı.
   *
   * EN: Minimum number of characters required.
   */
  minLength?: number;

  /**
   * TR: İzin verilen maksimum karakter sayısı.
   * Genellikle veritabanındaki sütun limitine göre belirlenir.
   *
   * EN: Maximum number of characters allowed.
   * Usually determined by the column limit in the database.
   */
  maxLength?: number;

  /**
   * TR: Textarea bileşeninin varsayılan satır yüksekliği (HTML 'rows' attribute).
   * Kullanıcı arayüzünde alanın ne kadar yer kaplayacağını belirler.
   *
   * EN: Default row height of the Textarea component (HTML 'rows' attribute).
   * Determines how much space the field will occupy in the UI.
   */
  rows?: number;
}

/**
 * TR: Uzun metin girişleri, açıklamalar, notlar veya adres bilgileri için tasarlanmış alan sınıfı.
 * Standart metin girdisinden farklı olarak çok satırlı desteği ve metin özetleme (truncation) özellikleri sunar.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class designed for long text inputs, descriptions, notes, or address information.
 * Unlike standard text input, it offers multi-line support and text truncation features.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class TextAreaField extends BaseField<string> {
  /**
   * TR: TextAreaField sınıfını başlatır.
   *
   * EN: Initializes the TextAreaField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Textarea yapılandırması. / EN: Textarea configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: TextAreaFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Metin değeri için Zod doğrulama şemasını oluşturur.
   * Zorunluluk durumu ve min/max karakter uzunluğu kurallarını zincirleme (chaining) yöntemiyle ekler.
   *
   * EN: Creates the Zod validation schema for the text value.
   * Adds requirement status and min/max character length rules via chaining method.
   *
   * @returns TR: String Zod şeması. / EN: String Zod schema.
   */
  schema(): z.ZodType<string> {
    let s = z.string({ required_error: `${this.label} zorunludur` });

    if (this.config.minLength) {
      s = s.min(this.config.minLength, `${this.label} en az ${this.config.minLength} karakter olmalı`);
    }
    if (this.config.maxLength) {
      s = s.max(this.config.maxLength, `${this.label} en fazla ${this.config.maxLength} karakter olmalı`);
    }

    // TR: Zorunlu değilse, boş bırakılabilir (nullable/optional).
    // EN: If not required, can be left empty (nullable/optional).
    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<string>;
    }
    return s;
  }

  /**
   * TR: Uzun metinleri tablo veya özet görünümlerde göstermek için formatlar.
   * Eğer metin 100 karakterden uzunsa, sonuna '...' ekleyerek kırpar (truncate).
   *
   * EN: Formats long texts for display in tables or summary views.
   * If the text is longer than 100 characters, it truncates it by adding '...'.
   *
   * @param value - TR: Gösterilecek metin. / EN: Text to be displayed.
   * @returns TR: Özetlenmiş metin. / EN: Summarized text.
   */
  override present(value: string | null): string {
    if (value == null || value === '') return '-';
    
    // TR: Uzun metinleri kısalt
    // EN: Truncate long texts
    if (value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return value;
  }

  /**
   * TR: Dış kaynaktan gelen veriyi string'e çevirir ve temizler.
   * Başındaki ve sonundaki gereksiz boşlukları (whitespace) `trim()` ile kaldırır.
   *
   * EN: Converts data from external source to string and cleans it.
   * Removes unnecessary leading and trailing whitespace using `trim()`.
   *
   * @param raw - TR: Ham veri. / EN: Raw data.
   * @returns TR: Temizlenmiş string veya null. / EN: Cleaned string or null.
   */
  override fromImport(raw: unknown): string | null {
    if (raw == null || raw === '') return null;
    return String(raw).trim();
  }

  /**
   * TR: UI üzerinde karakter sayacı (character counter) göstermek için yardımcı metod.
   * Mevcut uzunluğu ve varsa maksimum limiti döndürür (örn: 150/500).
   *
   * EN: Helper method to display a character counter on the UI.
   * Returns the current length and the maximum limit if available (e.g., 150/500).
   *
   * @param value - TR: Mevcut metin değeri. / EN: Current text value.
   * @returns TR: Sayaç verisi. / EN: Counter data.
   */
  getCharacterCount(value: string | null): { current: number; max: number | null } {
    return {
      current: value?.length ?? 0,
      max: this.config.maxLength ?? null,
    };
  }
}