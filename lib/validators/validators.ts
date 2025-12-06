import { z } from 'zod';

/**
 * TR: Özel Zod refinement'ları ve validator factory'leri.
 * Bu dosya, Türkiye standartlarına (TCKN, IBAN, Plaka) uygun hazır şemalar ve
 * dinamik form validasyonları için yardımcı fonksiyonlar içerir.
 *
 * EN: Custom Zod refinements and validator factories.
 * This file contains ready-to-use schemas compliant with Turkish standards (TCKN, IBAN, Plate)
 * and helper functions for dynamic form validations.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */

/**
 * TR: TC Kimlik Numarası doğrulama şeması.
 * 11 haneli rakam kontrolü, ilk hanenin 0 olmaması ve 10. ile 11. hanelerin
 * algoritmik sağlama (checksum) kurallarına uygunluğunu denetler.
 *
 * EN: Turkish Identity Number (TCKN) validation schema.
 * Checks for 11 digits, first digit not being 0, and validates the 10th and 11th digits
 * according to the algorithmic checksum rules.
 */
export const tcKimlikNo = z.string().length(11).regex(/^\d+$/).refine(
  (val: string) => {
    if (!/^\d{11}$/.test(val)) return false;
    if (val[0] === '0') return false;

    const digits = val.split('').map(Number);
    const odd = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const even = digits[1] + digits[3] + digits[5] + digits[7];

    // 10. hane kontrolü / 10th digit check
    const check10 = (odd * 7 - even) % 10;
    if (check10 !== digits[9]) return false;

    // 11. hane kontrolü / 11th digit check
    const sum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
    return sum % 10 === digits[10];
  },
  { message: 'Geçerli bir TC Kimlik No girin' }
);

/**
 * TR: Türkiye formatında telefon numarası doğrulama şeması.
 * +90 veya 0 ile başlayabilir (opsiyonel), ardından 5 ve 9 rakam gelmelidir.
 *
 * EN: Phone number validation schema in Turkish format.
 * Can start with +90 or 0 (optional), followed by 5 and 9 digits.
 */
export const phoneNumber = z
  .string()
  .regex(/^(\+90|0)?[5][0-9]{9}$/, 'Geçerli bir telefon numarası girin');

/**
 * TR: Türk IBAN numarası doğrulama şeması.
 * TR ile başlamalı ve toplam 26 karakter (TR + 24 hane) olmalıdır.
 * Otomatik olarak büyük harfe dönüştürür (transform).
 *
 * EN: Turkish IBAN number validation schema.
 * Must start with TR and contain a total of 26 characters (TR + 24 digits).
 * Automatically transforms to uppercase.
 */
export const iban = z.preprocess(
    (val) => String(val).toUpperCase(),
    z.string().regex(/^TR\d{24}$/, 'Geçerli bir IBAN girin')
);

/**
 * TR: Vergi Kimlik Numarası doğrulama şeması.
 * 10 haneli rakamlardan oluşmalıdır.
 *
 * EN: Tax Identification Number validation schema.
 * Must consist of 10 digits.
 */
export const vergiNo = z.string().length(10).regex(/^\d+$/, 'Vergi No 10 haneli olmalı');

/**
 * TR: Türkiye araç plakası doğrulama şeması.
 * İl kodu (01-81), harf grubu (1-3 harf) ve rakam grubu (2-4 rakam) formatını kontrol eder.
 *
 * EN: Turkish vehicle license plate validation schema.
 * Validates province code (01-81), letter group (1-3 chars), and number group (2-4 digits) format.
 */
export const plaka = z.preprocess(
    (val) => String(val).toUpperCase(),
    z.string().regex(/^(0[1-9]|[1-7][0-9]|8[01])[A-Z]{1,3}\d{2,4}$/, 'Geçerli bir plaka girin')
);

/**
 * TR: Para birimi doğrulama şeması.
 * Negatif olamaz ve en fazla 2 ondalık basamak (kuruş) içerebilir.
 *
 * EN: Currency validation schema.
 * Cannot be negative and can contain at most 2 decimal places.
 */
export const currency = z
  .number()
  .multipleOf(0.01, 'En fazla 2 basamak ondalık olabilir')
  .nonnegative('Negatif olamaz');

/**
 * TR: Yüzdelik değer doğrulama şeması.
 * 0 ile 100 arasında bir sayı olmalıdır.
 *
 * EN: Percentage value validation schema.
 * Must be a number between 0 and 100.
 */
export const percentage = z.number().min(0).max(100, 'Yüzde 0-100 arası olmalı');

/**
 * TR: Güçlü şifre politikası şeması.
 * En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam ve 1 özel karakter içermelidir.
 *
 * EN: Strong password policy schema.
 * Must contain at least 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 special char.
 */
export const strongPassword = z
  .string()
  .min(8, 'En az 8 karakter')
  .regex(/[A-Z]/, 'En az bir büyük harf')
  .regex(/[a-z]/, 'En az bir küçük harf')
  .regex(/[0-9]/, 'En az bir rakam')
  .regex(/[^A-Za-z0-9]/, 'En az bir özel karakter');

/**
 * TR: Tarih formatı (String) doğrulama şeması.
 * YYYY-MM-DD formatında string bekler.
 *
 * EN: Date format (String) validation schema.
 * Expects a string in YYYY-MM-DD format.
 */
export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih formatı: YYYY-MM-DD');

/**
 * TR: Gelecek tarih doğrulama şeması.
 * Verilen tarihin şimdiki zamandan sonra olup olmadığını kontrol eder.
 *
 * EN: Future date validation schema.
 * Checks if the given date is after the current time.
 */
export const futureDate = z.coerce.date().refine((d) => d > new Date(), 'Gelecek bir tarih olmalı');

/**
 * TR: Geçmiş tarih doğrulama şeması.
 * Verilen tarihin şimdiki zamandan önce olup olmadığını kontrol eder.
 *
 * EN: Past date validation schema.
 * Checks if the given date is before the current time.
 */
export const pastDate = z.coerce.date().refine((d) => d < new Date(), 'Geçmiş bir tarih olmalı');

/**
 * TR: Dinamik validatör oluşturucu fonksiyonlar koleksiyonu.
 * Parametre alarak duruma özel Zod şemaları üretir.
 *
 * EN: Collection of validator factory functions.
 * Generates context-specific Zod schemas by accepting parameters.
 */
export const Validators = {
  /**
   * TR: Sayısal aralık doğrulayıcısı.
   *
   * EN: Numeric range validator.
   */
  range: (min: number, max: number) =>
    z.number().min(min, `En az ${min}`).max(max, `En fazla ${max}`),

  /**
   * TR: Metin uzunluk aralığı doğrulayıcısı.
   *
   * EN: String length range validator.
   */
  lengthRange: (min: number, max: number) =>
    z.string().min(min, `En az ${min} karakter`).max(max, `En fazla ${max} karakter`),

  /**
   * TR: Enum (Seçenekler) doğrulayıcısı.
   * Değerin verilen listedeki elemanlardan biri olup olmadığını kontrol eder.
   *
   * EN: Enum (Options) validator.
   * Checks if the value is one of the elements in the provided list.
   */
  oneOf: <T extends string | number>(values: readonly T[], message?: string) => {
    // If there's only one allowed value, return a literal schema directly (avoids z.union requiring >=2)
    if (values.length === 1) {
      return z.literal(values[0] as T).refine(() => true, {
        message: message ?? `Geçerli değerler: ${values.join(', ')}`,
      });
    }

    const lits = values.map((v) => z.literal(v) as z.ZodLiteral<T>);
    return z.union(lits as [z.ZodLiteral<T>, z.ZodLiteral<T>, ...z.ZodLiteral<T>[]]).refine(() => true, {
      message: message ?? `Geçerli değerler: ${values.join(', ')}`,
    });
  },

  /**
   * TR: Dizi eleman sayısı doğrulayıcısı.
   * Dizinin min/max eleman sayısını kontrol eder.
   *
   * EN: Array length validator.
   * Checks the min/max element count of the array.
   */
  arrayLength: (min: number, max?: number) => {
    let schema = z.array(z.unknown()).min(min, `En az ${min} eleman`);
    if (max != null) {
      schema = schema.max(max, `En fazla ${max} eleman`);
    }
    return schema;
  },

  /**
   * TR: Değer eşleştirme doğrulayıcısı (Örn: Şifre Tekrar).
   * Girilen değerin, belirtilen sabit değere (fieldName) eşit olup olmadığını kontrol eder.
   *
   * EN: Value match validator (E.g., Confirm Password).
   * Checks if the entered value is equal to the specified constant value (fieldName).
   */
  match: (fieldName: string) =>
    z.string().refine((val) => val === fieldName, { message: 'Alanlar eşleşmiyor' }),

  /**
   * TR: Dosya boyutu doğrulayıcısı.
   * File objesinin byte cinsinden boyutunu kontrol eder.
   *
   * EN: File size validator.
   * Checks the size of the File object in bytes.
   */
  fileSize: (maxBytes: number) =>
    z.custom<File>().refine((f) => f.size <= maxBytes, `Dosya en fazla ${Math.round(maxBytes / 1024 / 1024)}MB olabilir`),

  /**
   * TR: Dosya tipi (MIME type) doğrulayıcısı.
   * File objesinin 'type' özelliğinin izin verilen listede olup olmadığını kontrol eder.
   *
   * EN: File type (MIME type) validator.
   * Checks if the 'type' property of the File object is in the allowed list.
   */
  fileType: (types: string[]) =>
    z.custom<File>().refine((f) => types.includes(f.type), `Geçerli tipler: ${types.join(', ')}`),
};

/**
 * TR: Zod şemasını Angular/Frontend uyumlu bir doğrulayıcı fonksiyona dönüştürür.
 * Zod parse işlemi başarılıysa `null`, başarısızsa hata mesajı (`string`) döndürür.
 * Bu yapı, UI bileşenlerinde hatayı doğrudan göstermek için idealdir.
 *
 * EN: Converts a Zod schema into an Angular/Frontend compatible validator function.
 * Returns `null` if Zod parse is successful, otherwise returns the error message (`string`).
 * This structure is ideal for displaying errors directly in UI components.
 *
 * @param schema - TR: Dönüştürülecek Zod şeması. / EN: Zod schema to convert.
 * @returns TR: Validator fonksiyonu. / EN: Validator function.
 */
export function zodToValidator<T>(schema: z.ZodType<T>) {
  return (value: unknown): string | null => {
    const result = schema.safeParse(value);
    if (result.success) return null;
    return result.error.errors[0]?.message ?? 'Geçersiz değer';
  };
}