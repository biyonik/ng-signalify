import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Yüklenen resmin meta verilerini ve görsel özelliklerini taşıyan nesne.
 * Standart dosya bilgilerine ek olarak genişlik, yükseklik ve küçük resim (thumbnail) URL'ini içerir.
 *
 * EN: Object carrying metadata and visual properties of the uploaded image.
 * In addition to standard file info, it includes width, height, and thumbnail URL.
 */
export interface ImageRef {
  /**
   * TR: Resmin benzersiz kimliği.
   *
   * EN: Unique identifier of the image.
   */
  id: string;

  /**
   * TR: Resmin dosya adı.
   *
   * EN: Filename of the image.
   */
  name: string;

  /**
   * TR: Resmin orijinal boyutundaki erişim adresi.
   *
   * EN: Access URL of the image in original size.
   */
  url: string;

  /**
   * TR: Önizleme için oluşturulmuş küçük resim adresi (Opsiyonel).
   *
   * EN: Thumbnail URL generated for preview (Optional).
   */
  thumbnailUrl?: string;

  /**
   * TR: Byte cinsinden dosya boyutu.
   *
   * EN: File size in bytes.
   */
  size: number;

  /**
   * TR: Resmin piksel cinsinden genişliği.
   *
   * EN: Width of the image in pixels.
   */
  width?: number;

  /**
   * TR: Resmin piksel cinsinden yüksekliği.
   *
   * EN: Height of the image in pixels.
   */
  height?: number;
}

/**
 * TR: Resim boyut kısıtlamalarını tanımlayan yapılandırma.
 * Minimum/maksimum piksel sınırları ve zorunlu en-boy oranı (aspect ratio) tanımlanabilir.
 *
 * EN: Configuration defining image dimension constraints.
 * Minimum/maximum pixel limits and mandatory aspect ratio can be defined.
 */
export interface ImageDimensions {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  /**
   * TR: Zorunlu en-boy oranı (Genişlik / Yükseklik).
   * Örn: 1.0 (Kare), 1.77 (16:9).
   *
   * EN: Mandatory aspect ratio (Width / Height).
   * E.g., 1.0 (Square), 1.77 (16:9).
   */
  aspectRatio?: number; 
}

/**
 * TR: Resim yükleme alanı için gelişmiş yapılandırma seçenekleri.
 * Format kısıtlamaları, boyut kontrolleri ve kırpma (crop) özelliklerini yönetir.
 *
 * EN: Advanced configuration options for the image upload field.
 * Manages format constraints, dimension checks, and crop features.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface ImageFieldConfig extends FieldConfig {
  /**
   * TR: Maksimum dosya boyutu (Byte).
   *
   * EN: Maximum file size (Bytes).
   */
  maxSize?: number;

  /**
   * TR: İzin verilen resim formatları.
   * Örn: ['image/jpeg', 'image/png'].
   *
   * EN: Allowed image formats.
   */
  accept?: ('image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')[];

  /**
   * TR: Piksel boyut kısıtlamaları (Min/Max Width-Height).
   *
   * EN: Pixel dimension constraints (Min/Max Width-Height).
   */
  dimensions?: ImageDimensions;

  /**
   * TR: Çoklu resim yükleme izni.
   *
   * EN: Allow multiple image uploads.
   */
  multiple?: boolean;

  /**
   * TR: Maksimum yüklenebilecek resim sayısı.
   *
   * EN: Maximum number of images allowed to upload.
   */
  maxImages?: number;

  /**
   * TR: Yükleme öncesi veya sonrası kırpma (crop) aracının aktif olup olmayacağı.
   *
   * EN: Whether the crop tool is active before or after upload.
   */
  crop?: boolean;

  /**
   * TR: Kırpma aracı için varsayılan en-boy oranı.
   *
   * EN: Default aspect ratio for the crop tool.
   */
  cropAspectRatio?: number;
}

/**
 * TR: Görsel medya yönetimi için özelleştirilmiş alan sınıfı.
 * Standart dosya yüklemenin ötesinde; resim boyutlarını (pixel) okuma,
 * en-boy oranı doğrulama ve galeri sıralama (reorder) özelliklerini barındırır.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Specialized field class for visual media management.
 * Beyond standard file upload, it includes features for reading image dimensions (pixel),
 * aspect ratio validation, and gallery reordering.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class ImageField extends BaseField<ImageRef | ImageRef[]> {
  /**
   * TR: ImageField sınıfını başlatır.
   *
   * EN: Initializes the ImageField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Resim yapılandırması. / EN: Image configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: ImageFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Resim verisi için Zod doğrulama şemasını oluşturur.
   * Resim genişliği, yüksekliği ve küçük resim (thumbnail) alanlarını da içeren kapsamlı bir şema döner.
   * Çoklu seçim durumunda dizi (Array) validasyonu uygular.
   *
   * EN: Creates the Zod validation schema for image data.
   * Returns a comprehensive schema including image width, height, and thumbnail fields.
   * Applies array validation in case of multiple selection.
   *
   * @returns TR: ImageRef veya ImageRef[] Zod şeması. / EN: ImageRef or ImageRef[] Zod schema.
   */
  schema(): z.ZodType<ImageRef | ImageRef[]> {
    const imageRefSchema = z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
      thumbnailUrl: z.string().optional(),
      size: z.number(),
      width: z.number().optional(),
      height: z.number().optional(),
    });

    if (this.config.multiple) {
      let arraySchema = z.array(imageRefSchema);

      if (this.config.maxImages) {
        arraySchema = arraySchema.max(
          this.config.maxImages,
          `En fazla ${this.config.maxImages} resim yüklenebilir`
        );
      }

      if (this.config.required) {
        arraySchema = arraySchema.min(1, `${this.label} zorunludur`);
      }

      return arraySchema.nullable().optional() as unknown as z.ZodType<ImageRef[]>;
    }

    if (this.config.required) {
      return imageRefSchema as z.ZodType<ImageRef>;
    }

    return imageRefSchema.nullable().optional() as unknown as z.ZodType<ImageRef>;
  }

  /**
   * TR: Kullanıcı arayüzünde resim bilgisini metin olarak gösterir.
   *
   * EN: Displays image information as text in the user interface.
   */
  override present(value: ImageRef | ImageRef[] | null): string {
    if (!value) return '-';

    if (Array.isArray(value)) {
      if (value.length === 0) return '-';
      return `${value.length} resim`;
    }

    return value.name;
  }

  /**
   * TR: Dışa aktarım için resim URL'lerini döndürür.
   *
   * EN: Returns image URLs for export.
   */
  override toExport(value: ImageRef | ImageRef[] | null): string | null {
    if (!value) return null;

    if (Array.isArray(value)) {
      return value.map((f) => f.url).join(', ');
    }

    return value.url;
  }

  /**
   * TR: Dış kaynaktan gelen URL string'ini işler ve mock bir `ImageRef` oluşturur.
   *
   * EN: Processes the URL string from an external source and creates a mock `ImageRef`.
   */
  override fromImport(raw: unknown): ImageRef | ImageRef[] | null {
    if (raw == null || raw === '') return null;

    if (typeof raw === 'string') {
      return {
        id: this.generateId(),
        name: this.extractFilename(raw),
        url: raw,
        size: 0,
      };
    }

    return null;
  }

  /**
   * TR: Resim dosyasını asenkron olarak doğrular (Promise).
   * Standart dosya kontrollerine (Boyut, MIME Type) ek olarak, tarayıcı belleğinde
   * bir `Image` nesnesi oluşturarak piksel boyutlarını ve aspect ratio uyumluluğunu denetler.
   *
   * EN: Validates the image file asynchronously (Promise).
   * In addition to standard file checks (Size, MIME Type), creates an `Image` object
   * in browser memory to check pixel dimensions and aspect ratio compatibility.
   *
   * @param file - TR: Yüklenen dosya. / EN: Uploaded file.
   * @returns TR: Hata mesajı (Promise). / EN: Error message (Promise).
   */
  validateImage(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      // Size check
      if (this.config.maxSize && file.size > this.config.maxSize) {
        resolve(`Dosya boyutu en fazla ${this.formatSize(this.config.maxSize)} olabilir`);
        return;
      }

      // Type check
      const accept = this.config.accept ?? ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!accept.includes(file.type as typeof accept[number])) {
        resolve(`İzin verilen formatlar: ${accept.map((t) => t.replace('image/', '')).join(', ')}`);
        return;
      }

      // TR: Boyut (Dimension) kontrolü için resmi belleğe yükle
      // EN: Load image into memory for dimension check
      if (this.config.dimensions) {
        const img = new Image();
        img.onload = () => {
          const error = this.validateDimensions(img.width, img.height);
          // TR: Bellek sızıntısını önlemek için URL'i temizle
          // EN: Revoke URL to prevent memory leak
          URL.revokeObjectURL(img.src);
          resolve(error);
        };
        img.onerror = () => {
          resolve('Resim okunamadı');
        };
        img.src = URL.createObjectURL(file);
      } else {
        resolve(null);
      }
    });
  }

  /**
   * TR: Genişlik ve yükseklik değerlerinin config içindeki kısıtlamalara uyup uymadığını kontrol eder.
   * Aspect Ratio kontrolünde küçük sapmalar için tolerans (0.01) uygulanır.
   *
   * EN: Checks if width and height values comply with the constraints in the config.
   * A tolerance (0.01) is applied for minor deviations in Aspect Ratio check.
   */
  private validateDimensions(width: number, height: number): string | null {
    const dim = this.config.dimensions;
    if (!dim) return null;

    if (dim.minWidth && width < dim.minWidth) {
      return `Resim genişliği en az ${dim.minWidth}px olmalı`;
    }
    if (dim.maxWidth && width > dim.maxWidth) {
      return `Resim genişliği en fazla ${dim.maxWidth}px olabilir`;
    }
    if (dim.minHeight && height < dim.minHeight) {
      return `Resim yüksekliği en az ${dim.minHeight}px olmalı`;
    }
    if (dim.maxHeight && height > dim.maxHeight) {
      return `Resim yüksekliği en fazla ${dim.maxHeight}px olabilir`;
    }
    if (dim.aspectRatio) {
      const actualRatio = width / height;
      const tolerance = 0.01; // Floating point toleransı
      if (Math.abs(actualRatio - dim.aspectRatio) > tolerance) {
        return `Resim oranı ${dim.aspectRatio}:1 olmalı`;
      }
    }

    return null;
  }

  /**
   * TR: Dosya boyutunu (Byte) formatlar.
   *
   * EN: Formats file size (Bytes).
   */
  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * TR: Input elementi için accept string'i döndürür.
   *
   * EN: Returns the accept string for the input element.
   */
  getAcceptString(): string {
    const accept = this.config.accept ?? ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return accept.join(',');
  }

  /**
   * TR: Gösterim için resmin thumbnail (varsa) veya orijinal URL'ini döndürür.
   *
   * EN: Returns the thumbnail (if available) or original URL of the image for display.
   *
   * @param value - TR: Resim referansı. / EN: Image reference.
   * @param fallback - TR: Resim yoksa dönecek değer. / EN: Value to return if no image.
   */
  getThumbnail(value: ImageRef | null, fallback = ''): string {
    if (!value) return fallback;
    return value.thumbnailUrl ?? value.url;
  }

  /**
   * TR: URL'den dosya adı çıkarma.
   *
   * EN: Extracting filename from URL.
   */
  private extractFilename(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      return pathname.split('/').pop() ?? 'image';
    } catch {
      return url.split('/').pop() ?? 'image';
    }
  }

  /**
   * TR: Rastgele ID üretimi.
   *
   * EN: Random ID generation.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * TR: Listeden resim siler.
   *
   * EN: Removes image from the list.
   */
  removeImage(current: ImageRef[], imageId: string): ImageRef[] {
    return current.filter((f) => f.id !== imageId);
  }

  /**
   * TR: Listeye resim ekler.
   *
   * EN: Adds image to the list.
   */
  addImage(current: ImageRef[] | null, image: ImageRef): ImageRef[] {
    return [...(current ?? []), image];
  }

  /**
   * TR: Galeri görünümünde resimlerin sırasını değiştirir (Drag & Drop desteği için).
   * Dizideki bir elemanı `fromIndex` konumundan alıp `toIndex` konumuna taşır.
   *
   * EN: Reorders images in gallery view (for Drag & Drop support).
   * Moves an element in the array from `fromIndex` to `toIndex`.
   *
   * @param current - TR: Mevcut resim listesi. / EN: Current image list.
   * @param fromIndex - TR: Eski konum. / EN: Old position.
   * @param toIndex - TR: Yeni konum. / EN: New position.
   * @returns TR: Sıralanmış yeni dizi. / EN: Sorted new array.
   */
  reorderImages(current: ImageRef[], fromIndex: number, toIndex: number): ImageRef[] {
    const result = [...current];
    const [removed] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, removed);
    return result;
  }
}