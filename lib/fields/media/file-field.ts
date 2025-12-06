import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Yüklenen bir dosyanın sunucu tarafındaki veya istemci tarafındaki referansını tutan nesne.
 * Dosyanın fiziksel verisini (Blob) değil, metadata bilgilerini içerir.
 *
 * EN: Object holding the server-side or client-side reference of an uploaded file.
 * Contains metadata information, not the physical data (Blob) of the file.
 */
export interface FileRef {
  /**
   * TR: Dosyanın benzersiz kimliği.
   *
   * EN: Unique identifier of the file.
   */
  id: string;

  /**
   * TR: Dosyanın orijinal adı (Örn: "belge.pdf").
   *
   * EN: Original name of the file (E.g., "document.pdf").
   */
  name: string;

  /**
   * TR: Dosyanın erişilebilir URL adresi.
   *
   * EN: Accessible URL address of the file.
   */
  url: string;

  /**
   * TR: Byte cinsinden dosya boyutu.
   *
   * EN: File size in bytes.
   */
  size: number;

  /**
   * TR: Dosyanın MIME türü (Örn: "image/jpeg", "application/pdf").
   *
   * EN: MIME type of the file (E.g., "image/jpeg", "application/pdf").
   */
  mimeType: string;
}

/**
 * TR: Dosya yükleme alanı için yapılandırma seçenekleri.
 * Dosya boyutu, türü ve çoklu seçim kısıtlamalarını yönetir.
 *
 * EN: Configuration options for the file upload field.
 * Manages file size, type, and multi-selection constraints.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface FileFieldConfig extends FieldConfig {
  /**
   * TR: İzin verilen maksimum dosya boyutu (Byte cinsinden).
   *
   * EN: Maximum allowed file size (in Bytes).
   */
  maxSize?: number;

  /**
   * TR: İzin verilen MIME türleri listesi.
   * Örn: ['image/*', '.pdf', 'application/vnd.ms-excel'].
   *
   * EN: List of allowed MIME types.
   * E.g., ['image/*', '.pdf', 'application/vnd.ms-excel'].
   */
  accept?: string[];

  /**
   * TR: Birden fazla dosya yüklenmesine izin verilip verilmediği.
   *
   * EN: Whether multiple file uploads are allowed.
   */
  multiple?: boolean;

  /**
   * TR: Eğer çoklu yükleme açıksa, maksimum kaç dosya yüklenebileceği.
   *
   * EN: If multi-upload is enabled, the maximum number of files that can be uploaded.
   */
  maxFiles?: number;
}

/**
 * TR: Dosya yükleme işlemlerini, validasyonlarını ve önizlemelerini yöneten alan sınıfı.
 * Tekli (Single) veya Çoklu (Multiple) modda çalışabilir.
 * Dosya boyutu kontrolü, MIME type filtrelemesi ve görsel formatlama özelliklerine sahiptir.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class managing file upload operations, validations, and previews.
 * Can operate in Single or Multiple mode.
 * Features file size control, MIME type filtering, and visual formatting.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class FileField extends BaseField<FileRef | FileRef[]> {
  /**
   * TR: FileField sınıfını başlatır.
   *
   * EN: Initializes the FileField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Dosya yapılandırması. / EN: File configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: FileFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Dosya verisi için dinamik Zod doğrulama şemasını oluşturur.
   * `multiple` konfigürasyonuna göre tek bir nesne veya nesne dizisi (Array) şeması döner.
   * Maksimum dosya sayısı ve zorunluluk kontrollerini içerir.
   *
   * EN: Creates the dynamic Zod validation schema for file data.
   * Returns a single object or object array schema based on the `multiple` configuration.
   * Includes maximum file count and requirement checks.
   *
   * @returns TR: FileRef veya FileRef[] Zod şeması. / EN: FileRef or FileRef[] Zod schema.
   */
  schema(): z.ZodType<FileRef | FileRef[]> {
    const fileRefSchema = z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
      size: z.number(),
      mimeType: z.string(),
    });

    // TR: Çoklu dosya modu
    // EN: Multi-file mode
    if (this.config.multiple) {
      let arraySchema = z.array(fileRefSchema);

      if (this.config.maxFiles) {
        arraySchema = arraySchema.max(
          this.config.maxFiles,
          `En fazla ${this.config.maxFiles} dosya yüklenebilir`
        );
      }

      if (this.config.required) {
        arraySchema = arraySchema.min(1, `${this.label} zorunludur`);
      }

      return arraySchema.nullable().optional() as unknown as z.ZodType<FileRef[]>;
    }

    // TR: Tekli dosya modu
    // EN: Single-file mode
    if (this.config.required) {
      return fileRefSchema as z.ZodType<FileRef>;
    }

    return fileRefSchema.nullable().optional() as unknown as z.ZodType<FileRef>;
  }

  /**
   * TR: Kullanıcı arayüzünde dosya bilgisini gösterir.
   * Tekli modda dosya adını, çoklu modda toplam dosya sayısını (örn: "3 dosya") döner.
   *
   * EN: Displays file information in the user interface.
   * Returns the filename in single mode, and the total file count (e.g., "3 files") in multi-mode.
   */
  override present(value: FileRef | FileRef[] | null): string {
    if (!value) return '-';

    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      return `${value.length} dosya`;
    }

    return value.name;
  }

  /**
   * TR: Dışa aktarım için dosya URL'lerini döndürür.
   * Çoklu dosyalarda URL'leri virgül ile birleştirir.
   *
   * EN: Returns file URLs for export.
   * Joins URLs with commas for multiple files.
   */
  override toExport(value: FileRef | FileRef[] | null): string | null {
    if (!value) return null;

    if (Array.isArray(value)) {
      return value.map((f) => f.url).join(', ');
    }

    return value.url;
  }

  /**
   * TR: Dış kaynaktan gelen veriyi (Import) işler.
   * Import sırasında fiziksel dosya yüklenemeyeceği için, gelen URL string'ini
   * sahte bir `FileRef` nesnesine dönüştürür.
   *
   * EN: Processes data from an external source (Import).
   * Since a physical file cannot be uploaded during import, converts the incoming URL string
   * into a mock `FileRef` object.
   *
   * @param raw - TR: Dosya URL stringi. / EN: File URL string.
   */
  override fromImport(raw: unknown): FileRef | FileRef[] | null {
    // Import'ta dosya yüklenemez, sadece URL kabul edilir
    if (raw == null || raw === '') return null;

    if (typeof raw === 'string') {
      // TR: URL'den dosya adı ve ID türet
      // EN: Derive filename and ID from URL
      return {
        id: this.generateId(),
        name: this.extractFilename(raw),
        url: raw,
        size: 0, // TR: Boyut bilinmiyor / EN: Size unknown
        mimeType: 'application/octet-stream',
      };
    }

    return null;
  }

  /**
   * TR: Dosya boyutunu (Byte) insan tarafından okunabilir formata çevirir.
   * Örn: 1024 -> "1 KB", 1048576 -> "1 MB".
   *
   * EN: Converts file size (Byte) to a human-readable format.
   * E.g., 1024 -> "1 KB", 1048576 -> "1 MB".
   *
   * @param bytes - TR: Ham byte değeri. / EN: Raw byte value.
   */
  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * TR: Dosya seçimi sırasında (Upload öncesi) tarayıcı tarafında doğrulama yapar.
   * Dosya boyutu sınırını ve MIME türü uyumluluğunu kontrol eder.
   * Wildcard desteği (örn: 'image/*') mevcuttur.
   *
   * EN: Performs browser-side validation during file selection (pre-upload).
   * Checks file size limit and MIME type compatibility.
   * Wildcard support (e.g., 'image/*') is available.
   *
   * @param file - TR: Tarayıcıdan gelen ham File objesi. / EN: Raw File object from the browser.
   * @returns TR: Hata mesajı veya null. / EN: Error message or null.
   */
  validateFile(file: File): string | null {
      // Size check
      if (this.config.maxSize && file.size > this.config.maxSize) {
          return `Dosya boyutu en fazla ${this.formatSize(this.config.maxSize)} olabilir`;
      }

      // Type check
      if (this.config.accept && this.config.accept.length > 0) {
          const fileName = file.name.toLowerCase();
          const fileType = file.type.toLowerCase();

          const isValidType = this.config.accept.some((accept) => {
              const type = accept.toLowerCase();

              // 1. Wildcard (image/*)
              if (type.endsWith('/*')) {
                  const prefix = type.replace('/*', '');
                  return fileType.startsWith(prefix);
              }

              // 2. Extension (.pdf)
              if (type.startsWith('.')) {
                  return fileName.endsWith(type);
              }

              // 3. Exact MIME (application/pdf)
              return fileType === type;
          });

          if (!isValidType) {
              return `İzin verilen dosya tipleri: ${this.config.accept.join(', ')}`;
          }
      }

      return null;
  }

  /**
   * TR: HTML input elementinin `accept` attribute'u için uygun string'i döndürür.
   *
   * EN: Returns the appropriate string for the HTML input element's `accept` attribute.
   */
  getAcceptString(): string {
    return this.config.accept?.join(',') ?? '*/*';
  }

  /**
   * TR: Verilen bir URL'den dosya adını ayıklayan yardımcı metod.
   * URL parse edilemezse son segmenti dosya adı olarak kabul eder.
   *
   * EN: Helper method extracting the filename from a given URL.
   * If URL cannot be parsed, accepts the last segment as the filename.
   */
  private extractFilename(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split('/').pop() ?? 'file';
    } catch {
      return url.split('/').pop() ?? 'file';
    }
  }

  /**
   * TR: Rastgele geçici bir ID oluşturur.
   *
   * EN: Generates a random temporary ID.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * TR: Mevcut dosya listesinden belirtilen ID'ye sahip dosyayı siler.
   * State (Immutable) güncellemesi için yeni bir dizi döndürür.
   *
   * EN: Removes the file with the specified ID from the current file list.
   * Returns a new array for State (Immutable) update.
   */
  removeFile(current: FileRef[], fileId: string): FileRef[] {
    return current.filter((f) => f.id !== fileId);
  }

  /**
   * TR: Mevcut dosya listesine yeni bir dosya ekler.
   * State (Immutable) güncellemesi için yeni bir dizi döndürür.
   *
   * EN: Adds a new file to the current file list.
   * Returns a new array for State (Immutable) update.
   */
  addFile(current: FileRef[] | null, file: FileRef): FileRef[] {
    return [...(current ?? []), file];
  }
}