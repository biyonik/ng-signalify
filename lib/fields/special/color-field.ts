import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Desteklenen renk formatlarını belirten tip tanımı.
 * HEX (Onaltılık), RGB (Kırmızı-Yeşil-Mavi) ve HSL (Ton-Doygunluk-Parlaklık) formatlarını içerir.
 *
 * EN: Type definition specifying supported color formats.
 * Includes HEX (Hexadecimal), RGB (Red-Green-Blue), and HSL (Hue-Saturation-Lightness) formats.
 */
export type ColorFormat = 'hex' | 'rgb' | 'hsl';

/**
 * TR: Renk alanı için yapılandırma seçenekleri.
 * Format türü, şeffaflık (alpha) desteği ve özel renk paletlerini yönetir.
 *
 * EN: Configuration options for the color field.
 * Manages format type, transparency (alpha) support, and custom color palettes.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface ColorFieldConfig extends FieldConfig {
  /**
   * TR: Kullanılacak renk formatı.
   * Varsayılan: 'hex'.
   *
   * EN: Color format to be used.
   * Default: 'hex'.
   */
  format?: ColorFormat;

  /**
   * TR: Kullanıcıya sunulacak ön tanımlı renk paleti.
   * HEX kodlarından oluşan bir dizi.
   *
   * EN: Predefined color palette to be presented to the user.
   * An array consisting of HEX codes.
   */
  palette?: string[];

  /**
   * TR: Şeffaflık (Alpha kanalı) seçimine izin verilip verilmeyeceği.
   * True ise RGBA veya HEX8 (#RRGGBBAA) formatları desteklenir.
   *
   * EN: Whether to allow transparency (Alpha channel) selection.
   * If true, RGBA or HEX8 (#RRGGBBAA) formats are supported.
   */
  alpha?: boolean;
}

/**
 * TR: Renk seçimi ve manipülasyonu için özelleştirilmiş alan sınıfı.
 * Renk formatı doğrulama (Regex), format dönüşümleri (HEX<->RGB<->HSL) ve
 * kontrast/parlaklık hesaplamaları gibi yardımcı araçlar sunar.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Specialized field class for color selection and manipulation.
 * Offers utilities like color format validation (Regex), format conversions (HEX<->RGB<->HSL),
 * and contrast/brightness calculations.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class ColorField extends BaseField<string> {
  /**
   * TR: Varsayılan renk paleti.
   * Modern web tasarımlarında sık kullanılan standart renkleri içerir (Tailwind benzeri).
   *
   * EN: Default color palette.
   * Contains standard colors frequently used in modern web designs (Tailwind-like).
   */
  static readonly DEFAULT_PALETTE = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#000000', '#6b7280', '#ffffff',
  ];

  /**
   * TR: ColorField sınıfını başlatır.
   *
   * EN: Initializes the ColorField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Renk yapılandırması. / EN: Color configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: ColorFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Seçilen renk formatına uygun Zod doğrulama şemasını oluşturur.
   * HEX, RGB ve HSL formatları için ayrı Regex desenleri kullanarak string validasyonu yapar.
   * Alpha kanalı açıksa desenler buna göre güncellenir.
   *
   * EN: Creates the Zod validation schema appropriate for the selected color format.
   * Performs string validation using separate Regex patterns for HEX, RGB, and HSL formats.
   * If alpha channel is enabled, patterns are updated accordingly.
   *
   * @returns TR: String Zod şeması. / EN: String Zod schema.
   */
  schema(): z.ZodType<string> {
    const format = this.config.format ?? 'hex';

    let s: z.ZodString;

    switch (format) {
      case 'hex':
        if (this.config.alpha) {
          // TR: Alpha destekli HEX (6 veya 8 karakter)
          // EN: Alpha supported HEX (6 or 8 characters)
          s = z.string().regex(/^#[0-9A-Fa-f]{6,8}$/, 'Geçerli bir HEX renk kodu girin');
        } else {
          // TR: Standart HEX (6 karakter)
          // EN: Standard HEX (6 characters)
          s = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir HEX renk kodu girin (örn: #FF0000)');
        }
        break;
      case 'rgb':
        // TR: RGB veya RGBA formatı
        // EN: RGB or RGBA format
        s = z.string().regex(
          /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*[\d.]+)?\s*\)$/,
          'Geçerli bir RGB renk kodu girin (örn: rgb(255, 0, 0))'
        );
        break;
      case 'hsl':
        // TR: HSL veya HSLA formatı
        // EN: HSL or HSLA format
        s = z.string().regex(
          /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*[\d.]+)?\s*\)$/,
          'Geçerli bir HSL renk kodu girin (örn: hsl(0, 100%, 50%))'
        );
        break;
      default:
        s = z.string();
    }

    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<string>;
    }
    return s as z.ZodType<string>;
  }

  /**
   * TR: Rengi string olarak döndürür.
   *
   * EN: Returns the color as a string.
   */
  override present(value: string | null): string {
    return value ?? '-';
  }

  /**
   * TR: Dış kaynaktan gelen veriyi işler.
   * Özellikle HEX kodlarında başında '#' işareti unutulmuşsa otomatik tamamlar.
   *
   * EN: Processes data from an external source.
   * Automatically completes HEX codes specifically if the '#' sign is missing at the beginning.
   */
  override fromImport(raw: unknown): string | null {
    if (raw == null || raw === '') return null;

    const str = String(raw).trim();

    // TR: Başında # olmayan HEX kodunu düzelt
    // EN: Fix HEX code without # prefix
    if (/^[0-9A-Fa-f]{6,8}$/.test(str)) {
      return '#' + str;
    }

    return str;
  }

  /**
   * TR: Kullanılacak renk paletini döndürür.
   * Config içinde tanımlıysa onu, yoksa varsayılan paleti kullanır.
   *
   * EN: Returns the color palette to be used.
   * Uses the one defined in config if available, otherwise uses the default palette.
   */
  getPalette(): string[] {
    return this.config.palette ?? ColorField.DEFAULT_PALETTE;
  }

  /**
   * TR: HEX formatındaki rengi RGB nesnesine dönüştürür.
   * Matematiksel hesaplamalar ve renk manipülasyonu için kullanılır.
   *
   * EN: Converts color in HEX format to RGB object.
   * Used for mathematical calculations and color manipulation.
   *
   * @param hex - TR: HEX kodu (örn: #FF0000). / EN: HEX code (e.g., #FF0000).
   * @returns TR: {r, g, b} nesnesi veya null. / EN: {r, g, b} object or null.
   */
  hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * TR: RGB değerlerini HEX stringine dönüştürür.
   *
   * EN: Converts RGB values to HEX string.
   */
  rgbToHex(r: number, g: number, b: number): string {
    // TR: Her kanalı 16'lık tabana çevir ve 2 haneye tamamla
    // EN: Convert each channel to base 16 and pad to 2 digits
    return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  }

  /**
   * TR: HEX formatındaki rengi HSL (Hue, Saturation, Lightness) formatına çevirir.
   *
   * EN: Converts color in HEX format to HSL (Hue, Saturation, Lightness) format.
   */
  hexToHsl(hex: string): { h: number; s: number; l: number } | null {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return null;

    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  /**
   * TR: Rengin parlaklık değerine (Luminance) göre açık mı koyu mu olduğunu belirler.
   * Metin rengini (Siyah/Beyaz) dinamik olarak seçmek için kullanılır.
   * Formül: (0.299*R + 0.587*G + 0.114*B) / 255
   *
   * EN: Determines whether the color is light or dark based on its luminance value.
   * Used to dynamically select text color (Black/White).
   * Formula: (0.299*R + 0.587*G + 0.114*B) / 255
   *
   * @param hex - TR: HEX kodu. / EN: HEX code.
   * @returns TR: Açık renkse true. / EN: True if light color.
   */
  isLight(hex: string): boolean {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return true;

    // Luminance formula (Human eye perception)
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5;
  }

  /**
   * TR: Verilen arka plan rengine göre en okunaklı kontrast metin rengini (Siyah veya Beyaz) döndürür.
   * Erişilebilirlik (Accessibility) için önemlidir.
   *
   * EN: Returns the most readable contrast text color (Black or White) based on the given background color.
   * Important for accessibility.
   */
  getContrastColor(hex: string): string {
    return this.isLight(hex) ? '#000000' : '#ffffff';
  }

  /**
   * TR: Rengin parlaklığını belirtilen yüzde oranında artırır veya azaltır.
   * Pozitif değer açar, negatif değer koyulaştırır.
   *
   * EN: Increases or decreases the brightness of the color by the specified percentage.
   * Positive value lightens, negative value darkens.
   *
   * @param hex - TR: Kaynak renk. / EN: Source color.
   * @param percent - TR: Değişim yüzdesi (Örn: 20 veya -20). / EN: Change percentage (E.g., 20 or -20).
   * @returns TR: Yeni HEX kodu. / EN: New HEX code.
   */
  adjustBrightness(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const adjust = (value: number) => {
      const adjusted = value + (value * percent) / 100;
      // TR: 0-255 aralığına sabitle
      // EN: Clamp to 0-255 range
      return Math.max(0, Math.min(255, Math.round(adjusted)));
    };

    return this.rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
  }
}