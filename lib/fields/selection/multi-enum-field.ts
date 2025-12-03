import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Bir seçenek listesindeki tekil öğeyi temsil eden arayüz.
 * Her seçenek benzersiz bir kimliğe (ID) ve kullanıcıya gösterilecek bir etikete (Label) sahiptir.
 * Ayrıca pasif durumu ve gruplama özelliği desteklenir.
 *
 * EN: Interface representing a single item in an option list.
 * Each option has a unique identifier (ID) and a label to be displayed to the user.
 * Also supports disabled status and grouping feature.
 */
export interface MultiEnumOption {
  /**
   * TR: Seçeneğin benzersiz değeri (Veritabanı ID'si veya kodu).
   *
   * EN: Unique value of the option (Database ID or code).
   */
  id: string | number;

  /**
   * TR: Kullanıcı arayüzünde gösterilecek metin.
   *
   * EN: Text to be displayed in the user interface.
   */
  label: string;

  /**
   * TR: Seçeneğin seçilebilir olup olmadığını belirler.
   * True ise kullanıcı bu seçeneği işaretleyemez.
   *
   * EN: Determines if the option is selectable.
   * If true, the user cannot check this option.
   */
  disabled?: boolean;

  /**
   * TR: Seçeneğin ait olduğu kategori veya grup adı.
   * Select bileşenlerinde 'optgroup' oluşturmak için kullanılır.
   *
   * EN: The category or group name to which the option belongs.
   * Used to create 'optgroup' in select components.
   */
  group?: string;
}

/**
 * TR: Çoklu seçim alanları için yapılandırma seçenekleri.
 * Minimum ve maksimum seçim adetlerini ve gruplama davranışını kontrol eder.
 *
 * EN: Configuration options for multi-selection fields.
 * Controls minimum and maximum selection counts and grouping behavior.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface MultiEnumFieldConfig extends FieldConfig {
  /**
   * TR: En az kaç adet seçim yapılması gerektiğini belirtir.
   *
   * EN: Specifies the minimum number of selections required.
   */
  min?: number;

  /**
   * TR: En fazla kaç adet seçim yapılabileceğini belirtir.
   *
   * EN: Specifies the maximum number of selections allowed.
   */
  max?: number;

  /**
   * TR: Seçeneklerin gruplandırılmış (grouped) şekilde gösterilip gösterilmeyeceğini belirler.
   *
   * EN: Determines whether options are shown in a grouped manner.
   */
  grouped?: boolean;
}

/**
 * TR: Birden fazla değerin seçilebildiği (Checkbox Group, Multi-Select Dropdown) alan sınıfı.
 * Seçilen değerleri bir dizi (Array) olarak tutar.
 * Seçeneklerin geçerliliğini, seçilen adet sınırlarını ve veri içe/dışa aktarımını yönetir.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class where multiple values can be selected (Checkbox Group, Multi-Select Dropdown).
 * Holds selected values as an array.
 * Manages option validity, selection count limits, and data import/export.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class MultiEnumField extends BaseField<(string | number)[]> {
  /**
   * TR: MultiEnumField sınıfını başlatır.
   *
   * EN: Initializes the MultiEnumField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param options - TR: Kullanılabilir seçenekler listesi. / EN: List of available options.
   * @param config - TR: Çoklu seçim yapılandırması. / EN: Multi-selection configuration.
   */
  constructor(
    name: string,
    label: string,
    public readonly options: MultiEnumOption[],
    public override config: MultiEnumFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Seçim dizisi için Zod doğrulama şemasını oluşturur.
   * 1. Tip Kontrolü: Değer bir array olmalı ve içindekiler string veya number olmalı.
   * 2. Bütünlük Kontrolü (Refine): Seçilen her bir ID, tanımlı `options` listesinde mevcut olmalı (Whitelist).
   * 3. Adet Kontrolü: Min ve Max seçim sayılarını doğrular.
   *
   * EN: Creates the Zod validation schema for the selection array.
   * 1. Type Check: Value must be an array containing strings or numbers.
   * 2. Integrity Check (Refine): Each selected ID must exist in the defined `options` list (Whitelist).
   * 3. Quantity Check: Validates min and max selection counts.
   *
   * @returns TR: Array Zod şeması. / EN: Array Zod schema.
   */
  schema(): z.ZodType<(string | number)[]> {
    // TR: Sadece aktif olan seçeneklerin ID'lerini al
    // EN: Get IDs of only active options
    const validIds = this.options.filter((o) => !o.disabled).map((o) => o.id);

    let s = z
      .array(z.union([z.string(), z.number()]))
      // TR: Seçilen değerlerin listede olup olmadığını kontrol et
      // EN: Check if selected values exist in the list
      .refine((arr) => arr.every((id) => validIds.includes(id)), {
        message: `${this.label} geçerli seçenekler içermeli`,
      }) as z.ZodType<(string | number)[]>;

    if (this.config.min != null) {
      s = s.refine((arr) => arr.length >= this.config.min!, {
        message: `${this.label} en az ${this.config.min} seçim olmalı`,
      });
    }

    if (this.config.max != null) {
      s = s.refine((arr) => arr.length <= this.config.max!, {
        message: `${this.label} en fazla ${this.config.max} seçim olabilir`,
      });
    }

    if (this.config.required) {
      s = s.refine((arr) => arr.length > 0, {
        message: `${this.label} zorunludur`,
      });
    }

    return s.nullable().optional() as unknown as z.ZodType<(string | number)[]>;
  }

  /**
   * TR: Seçilen ID'leri kullanıcı dostu etiketlere (Label) dönüştürür.
   * Birden fazla seçim varsa bunları virgül ile birleştirir.
   *
   * EN: Converts selected IDs into user-friendly labels.
   * Joins them with commas if there are multiple selections.
   */
  override present(value: (string | number)[] | null): string {
    if (!value || value.length === 0) return '-';
    return value
      .map((id) => {
        const option = this.options.find((o) => o.id === id);
        return option?.label ?? String(id);
      })
      .join(', ');
  }

  /**
   * TR: Dışa aktarım için `present` metodunu kullanır (Etiketlerin listesi).
   *
   * EN: Uses the `present` method for export (List of labels).
   */
  override toExport(value: (string | number)[] | null): string {
    return this.present(value);
  }

  /**
   * TR: Dış kaynaktan gelen veriyi (Import) işler.
   * Hem virgülle ayrılmış stringleri (CSV mantığı) hem de ham array verisini kabul eder.
   * Akıllı eşleştirme yapar: Gelen veri ID ile eşleşmiyorsa, Label (metin) ile eşleştirmeyi dener.
   *
   * EN: Processes data from an external source (Import).
   * Accepts both comma-separated strings (CSV logic) and raw array data.
   * Performs smart matching: If incoming data doesn't match an ID, it tries to match with the Label (text).
   *
   * @param raw - TR: Ham veri (String veya Array). / EN: Raw data (String or Array).
   */
  override fromImport(raw: unknown): (string | number)[] | null {
    if (raw == null || raw === '') return null;

    // TR: Virgülle ayrılmış string (Örn: "Elma, Armut" veya "1, 2")
    // EN: Comma-separated string (E.g., "Apple, Pear" or "1, 2")
    if (typeof raw === 'string') {
      const parts = raw.split(',').map((p) => p.trim());
      return parts
        .map((part) => {
          // TR: ID olarak ara
          // EN: Search as ID
          const byId = this.options.find((o) => String(o.id) === part);
          if (byId) return byId.id;

          // TR: Label olarak ara (Case insensitive)
          // EN: Search as Label (Case insensitive)
          const byLabel = this.options.find(
            (o) => o.label.toLowerCase() === part.toLowerCase()
          );
          return byLabel?.id;
        })
        .filter((id): id is string | number => id != null);
    }

    // TR: Doğrudan Array gelirse
    // EN: If raw Array comes directly
    if (Array.isArray(raw)) {
      // TR: Sadece tanımlı olanları filtrele
      // EN: Filter only defined ones
      return raw.filter((id) => this.options.some((o) => o.id === id));
    }

    return null;
  }

  /**
   * TR: Filtre önizleme metni oluşturur.
   * Tek seçim varsa ismini gösterir, çoklu seçim varsa "3 seçim" şeklinde özet geçer.
   *
   * EN: Generates filter preview text.
   * Shows the name if single selection, summarizes as "3 selections" if multiple.
   */
  override filterPreview(value: (string | number)[] | null): string | null {
    if (!value || value.length === 0) return null;
    if (value.length === 1) {
      const option = this.options.find((o) => o.id === value[0]);
      return option?.label ?? null;
    }
    return `${value.length} seçim`;
  }

  /**
   * TR: Seçenekleri tanımlı gruplarına (group field) göre kategorize eder.
   * UI tarafında `<optgroup>` oluşturmak veya gruplu liste göstermek için kullanılır.
   *
   * EN: Categorizes options based on their defined groups.
   * Used to create `<optgroup>` or display a grouped list on the UI side.
   *
   * @returns TR: Grup adına göre haritalanmış seçenekler. / EN: Options mapped by group name.
   */
  getGroupedOptions(): Map<string, MultiEnumOption[]> {
    const groups = new Map<string, MultiEnumOption[]>();

    for (const option of this.options) {
      const group = option.group ?? '';
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(option);
    }

    return groups;
  }

  /**
   * TR: Seçili olan ID listesinden tam `EnumOption` nesnelerini döndürür.
   * Seçilen öğelerin detaylarına (etiket, grup vb.) erişmek için kullanılır.
   *
   * EN: Returns full `EnumOption` objects from the selected ID list.
   * Used to access details (label, group, etc.) of selected items.
   */
  getSelectedOptions(value: (string | number)[] | null): MultiEnumOption[] {
    if (!value) return [];
    return value
      .map((id) => this.options.find((o) => o.id === id))
      .filter((o): o is MultiEnumOption => o != null);
  }

  /**
   * TR: Tüm aktif (disabled olmayan) seçeneklerin ID'lerini döndürür.
   * "Tümünü Seç" butonu işlevi için kullanılır.
   *
   * EN: Returns IDs of all active (non-disabled) options.
   * Used for "Select All" button functionality.
   */
  selectAll(): (string | number)[] {
    return this.options.filter((o) => !o.disabled).map((o) => o.id);
  }

  /**
   * TR: Bir seçeneğin seçim durumunu tersine çevirir (Toggle).
   * Seçiliyse listeden çıkarır, seçili değilse listeye ekler.
   * Checkbox tıklama olaylarını yönetmek için yardımcı metod.
   *
   * EN: Toggles the selection status of an option.
   * Removes from list if selected, adds to list if not.
   * Helper method to manage checkbox click events.
   *
   * @param current - TR: Mevcut seçim dizisi. / EN: Current selection array.
   * @param id - TR: İşlem yapılacak ID. / EN: ID to operate on.
   */
  toggleSelection(
    current: (string | number)[] | null,
    id: string | number
  ): (string | number)[] {
    const arr = current ?? [];
    if (arr.includes(id)) {
      return arr.filter((i) => i !== id);
    }
    return [...arr, id];
  }
}