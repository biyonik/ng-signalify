import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Seçenek listesindeki tek bir öğeyi temsil eden arayüz.
 * Hem veritabanında saklanacak değeri (ID) hem de kullanıcıya gösterilecek metni (Label) içerir.
 *
 * EN: Interface representing a single item in the option list.
 * Contains both the value to be stored in the database (ID) and the text to be displayed to the user (Label).
 */
export interface EnumOption {
  /**
   * TR: Seçeneğin benzersiz değeri (Primary Key veya Kod).
   *
   * EN: Unique value of the option (Primary Key or Code).
   */
  id: string | number;

  /**
   * TR: Kullanıcı arayüzünde görünecek okunabilir metin.
   *
   * EN: Human-readable text to appear in the user interface.
   */
  label: string;
}

/**
 * TR: Enum alanı için yapılandırma seçenekleri.
 * Çoklu seçim opsiyonu (UI davranışı için) eklenebilir.
 *
 * EN: Configuration options for the Enum field.
 * Multi-selection option (for UI behavior) can be added.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface EnumFieldConfig extends FieldConfig {
  /**
   * TR: Çoklu seçime izin verilip verilmediği.
   * Not: Veri yapısı tekil olsa bile UI'da farklı davranışlar için kullanılabilir.
   *
   * EN: Whether multiple selection is allowed.
   * Note: Even if the data structure is singular, it can be used for different behaviors in the UI.
   */
  multiple?: boolean;
}

/**
 * TR: Önceden tanımlanmış sabit bir listeden seçim yapılmasını sağlayan alan sınıfı.
 * Dropdown (Select), Radio Group veya Autocomplete bileşenleri için kullanılır.
 * Seçilen değerin geçerli listede olup olmadığını (Whitelist Validation) kontrol eder.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class enabling selection from a predefined static list.
 * Used for Dropdown (Select), Radio Group, or Autocomplete components.
 * Checks if the selected value exists in the valid list (Whitelist Validation).
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class EnumField extends BaseField<string | number> {
  /**
   * TR: EnumField sınıfını başlatır.
   *
   * EN: Initializes the EnumField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param options - TR: Seçenekler listesi. / EN: List of options.
   * @param config - TR: Enum yapılandırması. / EN: Enum configuration.
   */
  constructor(
    name: string,
    label: string,
    public readonly options: EnumOption[],
    public override config: EnumFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Seçim değeri için Zod doğrulama şemasını oluşturur.
   * Girilen değerin `options` listesindeki `id`'lerden biri olduğunu doğrular.
   * Bu, veritabanı bütünlüğü için kritik bir kontroldür.
   *
   * EN: Creates the Zod validation schema for the selection value.
   * Validates that the entered value is one of the `id`s in the `options` list.
   * This is a critical check for database integrity.
   *
   * @returns TR: Union (String | Number) Zod şeması. / EN: Union (String | Number) Zod schema.
   */
  schema(): z.ZodType<string | number> {
    // TR: Geçerli ID'lerin listesini çıkar
    // EN: Extract list of valid IDs
    const validIds = this.options.map((o) => o.id);

    // TR: Değerin bu listede olup olmadığını kontrol et (Refine)
    // EN: Check if the value is in this list (Refine)
    const s = z.union([z.string(), z.number()]).refine((val) => validIds.includes(val), {
      message: `${this.label} geçerli bir seçenek olmalı`,
    });

    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<string | number>;
    }
    return s as z.ZodType<string | number>;
  }

  /**
   * TR: Saklanan ID değerini (örn: 101) kullanıcı dostu etikete (örn: "Onaylandı") dönüştürür.
   * Tablo listelerinde veya detay sayfalarında ID yerine metin göstermek için kullanılır.
   *
   * EN: Converts the stored ID value (e.g., 101) to a user-friendly label (e.g., "Approved").
   * Used to display text instead of ID in table lists or detail pages.
   *
   * @param value - TR: Seçilen ID. / EN: Selected ID.
   * @returns TR: Etiket veya ID'nin kendisi. / EN: Label or the ID itself.
   */
  override present(value: string | number | null): string {
    if (value == null) return '-';
    const option = this.options.find((o) => o.id === value);
    return option?.label ?? String(value);
  }

  /**
   * TR: Dışa aktarım (Export) sırasında ID yerine okunabilir etiketi (Label) kullanır.
   * Excel/CSV çıktılarının daha anlaşılır olmasını sağlar.
   *
   * EN: Uses the readable label instead of ID during export.
   * Ensures Excel/CSV outputs are more understandable.
   */
  override toExport(value: string | number | null): string {
    return this.present(value);
  }

  /**
   * TR: Dış kaynaktan gelen veriyi (Import) işler ve geçerli bir ID'ye çevirmeye çalışır.
   * Akıllı eşleştirme (Smart Matching) yapar:
   * 1. Gelen değer doğrudan bir ID ile eşleşiyor mu?
   * 2. Gelen değer bir Etiket (Label) ile eşleşiyor mu? (Büyük/küçük harf duyarsız).
   *
   * EN: Processes data from an external source (Import) and tries to convert it to a valid ID.
   * Performs Smart Matching:
   * 1. Does the incoming value match an ID directly?
   * 2. Does the incoming value match a Label? (Case-insensitive).
   *
   * @param raw - TR: Ham veri. / EN: Raw data.
   * @returns TR: Eşleşen ID veya null. / EN: Matched ID or null.
   */
  override fromImport(raw: unknown): string | number | null {
    if (raw == null || raw === '') return null;

    // TR: Önce ID olarak ara (Type coercion yaparak)
    // EN: Search as ID first (using type coercion)
    const byId = this.options.find((o) => o.id === raw || String(o.id) === String(raw));
    if (byId) return byId.id;

    // TR: Label olarak ara (Trim ve Lowercase yaparak)
    // EN: Search as Label (using Trim and Lowercase)
    const byLabel = this.options.find((o) => o.label.toLowerCase() === String(raw).toLowerCase().trim());
    if (byLabel) return byLabel.id;

    return null;
  }

  /**
   * TR: UI bileşenleri (Select, Autocomplete) için seçenek listesini döndürür.
   *
   * EN: Returns the list of options for UI components (Select, Autocomplete).
   */
  getOptions(): EnumOption[] {
    return this.options;
  }
}