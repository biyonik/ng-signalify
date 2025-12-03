import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Metin tabanlı alanlar için özel yapılandırma seçenekleri.
 * Karakter uzunluğu sınırları ve format (Email, URL, Regex) kontrollerini yönetir.
 *
 * EN: Special configuration options for text-based fields.
 * Manages character length limits and format (Email, URL, Regex) checks.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface StringFieldConfig extends FieldConfig {
  /**
   * TR: Girilmesi gereken minimum karakter sayısı.
   *
   * EN: Minimum number of characters required.
   */
  min?: number;

  /**
   * TR: Girilebilecek maksimum karakter sayısı.
   *
   * EN: Maximum number of characters allowed.
   */
  max?: number;

  /**
   * TR: Değerin geçerli bir e-posta adresi formatında olup olmadığını kontrol eder.
   *
   * EN: Checks if the value is in a valid email address format.
   */
  email?: boolean;

  /**
   * TR: Değerin geçerli bir URL formatında olup olmadığını kontrol eder.
   *
   * EN: Checks if the value is in a valid URL format.
   */
  url?: boolean;

  /**
   * TR: Özel format kontrolü için Düzenli İfade (Regular Expression).
   * Örn: Sadece harf, belirli bir kod formatı vb.
   *
   * EN: Regular Expression for custom format check.
   * E.g., Only letters, a specific code format, etc.
   */
  regex?: RegExp;
}

/**
 * TR: Standart metin girişi (Input Text) işlemlerini yöneten alan sınıfı.
 * Basit metinlerin yanı sıra E-posta ve URL gibi özel formatları da doğrular.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class managing standard text input operations.
 * Validates special formats like Email and URL in addition to simple text.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class StringField extends BaseField<string> {
  /**
   * TR: StringField sınıfını başlatır.
   *
   * EN: Initializes the StringField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Metin yapılandırması. / EN: Text configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: StringFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Metin değeri için Zod doğrulama şemasını oluşturur.
   * Konfigürasyondaki (min, max, email, url, regex) ayarları zincirleme (chaining) yöntemiyle şemaya ekler.
   *
   * EN: Creates the Zod validation schema for the text value.
   * Adds settings from configuration (min, max, email, url, regex) to the schema via chaining method.
   *
   * @returns TR: String Zod şeması. / EN: String Zod schema.
   */
  schema(): z.ZodType<string> {
    let s = z.string({ required_error: `${this.label} zorunludur` });

    if (this.config.min) {
      s = s.min(this.config.min, `${this.label} en az ${this.config.min} karakter olmalı`);
    }
    if (this.config.max) {
      s = s.max(this.config.max, `${this.label} en fazla ${this.config.max} karakter olmalı`);
    }
    if (this.config.email) {
      s = s.email(`${this.label} geçerli bir e-posta olmalı`);
    }
    if (this.config.url) {
      s = s.url(`${this.label} geçerli bir URL olmalı`);
    }
    if (this.config.regex) {
      s = s.regex(this.config.regex, `${this.label} geçerli formatta değil`);
    }

    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<string>;
    }
    return s;
  }

  /**
   * TR: Dış kaynaktan gelen veriyi string'e çevirir ve temizler.
   * Başındaki ve sonundaki boşlukları (whitespace) `trim()` ile temizler.
   *
   * EN: Converts data from external source to string and cleans it.
   * Removes leading and trailing whitespace using `trim()`.
   *
   * @param raw - TR: Ham veri. / EN: Raw data.
   * @returns TR: Temizlenmiş string veya null. / EN: Cleaned string or null.
   */
  override fromImport(raw: unknown): string | null {
    if (raw == null || raw === '') return null;
    return String(raw).trim();
  }
}