import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: İlişkili kaydın (Entity) minimal referansını tutan nesne.
 * Veritabanı için gerekli olan kimlik (ID) ve kullanıcı arayüzü için gerekli olan metin (Label) bilgisini içerir.
 * Örn: { id: 101, label: "Ahmet Yılmaz" }
 *
 * EN: Object holding the minimal reference of the related record (Entity).
 * Contains the identity (ID) required for the database and the text (Label) required for the user interface.
 * E.g., { id: 101, label: "John Doe" }
 */
export interface RelationRef {
  /**
   * TR: Kaydın benzersiz kimliği (Foreign Key).
   *
   * EN: Unique identifier of the record (Foreign Key).
   */
  id: string | number;

  /**
   * TR: Kullanıcıya gösterilecek okunabilir metin.
   *
   * EN: Readable text to be displayed to the user.
   */
  label: string;
}

/**
 * TR: İlişki alanları için yapılandırma seçenekleri.
 * Çoklu seçim, detay sayfasına yönlendirme ve yetki kontrollerini yönetir.
 *
 * EN: Configuration options for relation fields.
 * Manages multi-selection, redirection to detail page, and permission checks.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface RelationFieldConfig extends FieldConfig {
  /**
   * TR: Birden fazla kayıt seçilmesine izin verilip verilmediği.
   *
   * EN: Whether selecting multiple records is allowed.
   */
  multiple?: boolean;

  /**
   * TR: Kaydın detay sayfasına gitmek için URL şablonu.
   * Örn: '/users' (Sonuna ID eklenir: /users/123).
   *
   * EN: URL pattern to navigate to the record's detail page.
   * E.g., '/users' (ID is appended: /users/123).
   */
  viewUrl?: string;

  /**
   * TR: Bu ilişkiyi görüntülemek veya düzenlemek için gereken yetki kodu.
   *
   * EN: Permission code required to view or edit this relation.
   */
  permission?: string;
}

/**
 * TR: Uzak sunucudan veri aramak için kullanılan asenkron fonksiyon tipi.
 * Autocomplete bileşenlerinde kullanıcının yazdığı metne göre (query) filtreleme yapar.
 *
 * EN: Async function type used to search data from a remote server.
 * Filters based on the text (query) typed by the user in Autocomplete components.
 */
export type FetchFn = (query: string, limit: number) => Promise<RelationRef[]>;

/**
 * TR: Ham veriyi `RelationRef` formatına dönüştüren haritalama fonksiyonu.
 *
 * EN: Mapping function converting raw data to `RelationRef` format.
 */
export type MapperFn<T> = (item: T) => RelationRef;

/**
 * TR: Başka bir veri kaynağıyla (Entity) ilişki kuran alan sınıfı.
 * Autocomplete (Otomatik Tamamlama) veya Modal seçiciler için altyapı sağlar.
 * Veriyi nesne olarak ({ id, label }) tutar ancak dışa aktarırken (Export) sadece ID kullanır.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class establishing a relationship with another data source (Entity).
 * Provides infrastructure for Autocomplete or Modal selectors.
 * Holds data as an object ({ id, label }) but uses only ID when exporting.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class RelationField extends BaseField<RelationRef> {
  /**
   * TR: RelationField sınıfını başlatır.
   *
   * EN: Initializes the RelationField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param fetchFn - TR: Veri getirme fonksiyonu. / EN: Data fetching function.
   * @param config - TR: İlişki yapılandırması. / EN: Relation configuration.
   */
  constructor(
    name: string,
    label: string,
    public readonly fetchFn: FetchFn,
    public override config: RelationFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: İlişki nesnesi için Zod doğrulama şemasını oluşturur.
   * Değerin `id` ve `label` alanlarına sahip geçerli bir obje olduğunu doğrular.
   *
   * EN: Creates the Zod validation schema for the relation object.
   * Validates that the value is a valid object with `id` and `label` fields.
   *
   * @returns TR: RelationRef Zod şeması. / EN: RelationRef Zod schema.
   */
  schema(): z.ZodType<RelationRef> {
    const refSchema = z.object({
      id: z.union([z.string(), z.number()]),
      label: z.string(),
    });

    if (!this.config.required) {
      return refSchema.nullable().optional() as unknown as z.ZodType<RelationRef>;
    }
    return refSchema as z.ZodType<RelationRef>;
  }

  /**
   * TR: Kullanıcı arayüzünde gösterilecek metni (Label) döndürür.
   *
   * EN: Returns the text (Label) to be displayed in the user interface.
   */
  override present(value: RelationRef | null): string {
    return value?.label ?? '-';
  }

  /**
   * TR: Dışa aktarım (API'ye gönderme veya CSV export) için veriyi hazırlar.
   * İlişki nesnesinin tamamı yerine, sadece "Foreign Key" olan ID bilgisini döndürür.
   *
   * EN: Prepares data for export (sending to API or CSV export).
   * Returns only the ID info (Foreign Key) instead of the entire relation object.
   */
  override toExport(value: RelationRef | null): string | number | null {
    return value?.id ?? null;
  }

  /**
   * TR: Dış kaynaktan (örn: Excel Import) gelen veriyi işler.
   * Import sırasında genellikle sadece ID bilinir, Label (isim) bilinmez.
   * Bu yüzden Label boş string olarak atanır. Daha sonra bir "Resolve" işlemi gerekebilir.
   *
   * EN: Processes data from an external source (e.g., Excel Import).
   * Usually only ID is known during import, Label (name) is unknown.
   * Therefore, Label is assigned as an empty string. A "Resolve" operation might be needed later.
   *
   * @param raw - TR: Ham ID verisi. / EN: Raw ID data.
   * @returns TR: Kısmi RelationRef nesnesi. / EN: Partial RelationRef object.
   */
  override fromImport(raw: unknown): RelationRef | null {
    if (raw == null || raw === '') return null;
    
    // TR: Import sırasında sadece ID biliniyor, etiket sonradan doldurulmalı
    // EN: Only ID is known during import, label needs to be filled later
    return { id: raw as string | number, label: '' };
  }

  /**
   * TR: Filtreleme önizlemesi için Label bilgisini kullanır.
   *
   * EN: Uses Label info for filter preview.
   */
  override filterPreview(value: RelationRef | null): string | null {
    return value?.label ?? null;
  }

  /**
   * TR: Seçili kaydın detay sayfasına gitmek için tam URL'i oluşturur.
   * Config içindeki `viewUrl` ve kaydın `id` bilgisini birleştirir.
   *
   * EN: Generates the full URL to navigate to the detail page of the selected record.
   * Combines `viewUrl` from config and the record's `id`.
   *
   * @param value - TR: İlişki verisi. / EN: Relation data.
   * @returns TR: Tam URL veya null. / EN: Full URL or null.
   */
  getViewUrl(value: RelationRef | null): string | null {
    if (!value?.id || !this.config.viewUrl) return null;
    // TR: URL birleştirme (Trailing slash kontrolü yapılabilir)
    // EN: URL concatenation (Trailing slash check can be done)
    return `${this.config.viewUrl}/${value.id}`;
  }
}