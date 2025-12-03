import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Tarih alanları için özel yapılandırma seçenekleri.
 * Minimum/maksimum tarih kısıtlamaları ve görüntüleme formatlarını yönetir.
 *
 * EN: Special configuration options for date fields.
 * Manages minimum/maximum date constraints and display formats.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface DateFieldConfig extends FieldConfig {
  /**
   * TR: Seçilebilecek en erken tarih.
   * Date objesi veya tarih stringi (ISO format) kabul eder.
   *
   * EN: The earliest date that can be selected.
   * Accepts a Date object or a date string (ISO format).
   */
  min?: Date | string;

  /**
   * TR: Seçilebilecek en geç tarih.
   *
   * EN: The latest date that can be selected.
   */
  max?: Date | string;

  /**
   * TR: Tarihin ekranda nasıl gösterileceğini belirleyen format stringi.
   * Varsayılan: 'dd.MM.yyyy' (Gün.Ay.Yıl).
   *
   * EN: Format string determining how the date is displayed on the screen.
   * Default: 'dd.MM.yyyy' (Day.Month.Year).
   */
  format?: string;

  /**
   * TR: Tarih formatlamasında kullanılacak yerel ayar (Locale).
   * Örn: 'tr-TR', 'en-US'.
   *
   * EN: Locale setting to be used in date formatting.
   * E.g., 'tr-TR', 'en-US'.
   */
  locale?: string;
}

/**
 * TR: Tarih seçimi, validasyon ve formatlama işlemlerini yöneten alan sınıfı.
 * String-Tarih dönüşümlerini (coercion), Excel import uyumluluğunu ve tarih karşılaştırmalarını (bugün/geçmiş/gelecek) destekler.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class managing date selection, validation, and formatting operations.
 * Supports String-Date conversions (coercion), Excel import compatibility, and date comparisons (today/past/future).
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class DateField extends BaseField<Date> {
  /**
   * TR: DateField sınıfını başlatır.
   *
   * EN: Initializes the DateField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Tarih yapılandırması. / EN: Date configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: DateFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Tarih değeri için Zod doğrulama şemasını oluşturur.
   * `z.coerce.date` kullanarak gelen string değerleri otomatik olarak Date objesine çevirir.
   * Min ve Max kısıtlamaları için kullanıcı dostu hata mesajları üretir.
   *
   * EN: Creates the Zod validation schema for the date value.
   * Automatically converts incoming string values to Date objects using `z.coerce.date`.
   * Generates user-friendly error messages for Min and Max constraints.
   *
   * @returns TR: Date Zod şeması. / EN: Date Zod schema.
   */
  schema(): z.ZodType<Date> {
    // TR: Coercion (zorlama) ile string -> date dönüşümü
    // EN: String -> date conversion via coercion
    let s = z.coerce.date({
      required_error: `${this.label} zorunludur`,
      invalid_type_error: `${this.label} geçerli bir tarih olmalı`,
    });

    if (this.config.min) {
      const minDate = new Date(this.config.min);
      s = s.min(minDate, `${this.label} en erken ${this.formatDate(minDate)} olabilir`);
    }
    if (this.config.max) {
      const maxDate = new Date(this.config.max);
      s = s.max(maxDate, `${this.label} en geç ${this.formatDate(maxDate)} olabilir`);
    }

    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<Date>;
    }
    return s;
  }

  /**
   * TR: Tarih objesini kullanıcı arayüzü için okunabilir string formatına çevirir.
   * Config içerisindeki locale bilgisini kullanır.
   *
   * EN: Converts the date object into a readable string format for the UI.
   * Uses the locale information in the config.
   *
   * @param value - TR: Tarih objesi. / EN: Date object.
   * @returns TR: Formatlanmış tarih stringi. / EN: Formatted date string.
   */
  override present(value: Date | null): string {
    if (value == null) return '-';
    return this.formatDate(value);
  }

  /**
   * TR: Dışa aktarım (Export) için veriyi string formatına dönüştürür.
   * Genellikle raporlama ve CSV çıktıları için kullanılır.
   *
   * EN: Converts data to string format for export.
   * Usually used for reporting and CSV outputs.
   */
  override toExport(value: Date | null): string | null {
    if (value == null) return null;
    return this.formatDate(value);
  }

  /**
   * TR: Dış kaynaktan gelen veriyi (Import) işler.
   * Excel'den gelen sayısal seri numaralarını (serial number) veya standart tarih stringlerini
   * geçerli bir JavaScript Date objesine dönüştürür.
   *
   * EN: Processes data from an external source (Import).
   * Converts numeric serial numbers from Excel or standard date strings
   * into a valid JavaScript Date object.
   *
   * @param raw - TR: Ham veri (number veya string). / EN: Raw data (number or string).
   * @returns TR: Date objesi veya null. / EN: Date object or null.
   */
  override fromImport(raw: unknown): Date | null {
    if (raw == null || raw === '') return null;

    // TR: Excel tarih seri numarası kontrolü (Örn: 44567)
    // EN: Excel date serial number check (E.g., 44567)
    if (typeof raw === 'number') {
      return this.excelDateToJs(raw);
    }

    // TR: Standart string parse işlemi
    // EN: Standard string parse operation
    const date = new Date(raw as string);
    // TR: Geçersiz tarih kontrolü (Invalid Date)
    // EN: Invalid date check
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * TR: Filtreleme önizlemesi için metin döndürür.
   *
   * EN: Returns text for filter preview.
   */
  override filterPreview(value: Date | null): string | null {
    return this.present(value);
  }

  /**
   * TR: Tarih aralığı filtrelemesi için kullanıcı dostu bir özet metni oluşturur.
   * Örn: "01.01.2024 ve sonrası", "31.12.2024 ve öncesi" veya iki tarih arası.
   *
   * EN: Generates a user-friendly summary text for date range filtering.
   * E.g., "01.01.2024 and after", "31.12.2024 and before", or between two dates.
   *
   * @param value - TR: [Başlangıç, Bitiş] tarihleri. / EN: [Start, End] dates.
   */
  filterPreviewRange(value: [Date | null, Date | null]): string | null {
    const [start, end] = value;
    if (start == null && end == null) return null;
    if (start != null && end == null) return `${this.present(start)} ve sonrası`;
    if (start == null && end != null) return `${this.present(end)} ve öncesi`;
    return `${this.present(start)} - ${this.present(end)}`;
  }

  /**
   * TR: Tarihi yerel ayarlara (Locale) göre formatlayan yardımcı metod.
   * Varsayılan olarak 'tr-TR' ve 'dd.MM.yyyy' (gün, ay, yıl) formatını kullanır.
   *
   * EN: Helper method formatting the date according to locale settings.
   * Uses 'tr-TR' and 'dd.MM.yyyy' (day, month, year) format by default.
   */
  private formatDate(date: Date): string {
    const locale = this.config.locale ?? 'tr-TR';
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * TR: Excel'in kullandığı sayısal tarih formatını JavaScript Date objesine çevirir.
   * Excel, tarihleri 30 Aralık 1899'dan itibaren geçen gün sayısı olarak saklar.
   * Bu metod aradaki farkı hesaplayarak doğru dönüşümü yapar.
   *
   * EN: Converts the numeric date format used by Excel to a JavaScript Date object.
   * Excel stores dates as the number of days elapsed since December 30, 1899.
   * This method performs the correct conversion by calculating the difference.
   *
   * @param serial - TR: Excel seri numarası. / EN: Excel serial number.
   */
  private excelDateToJs(serial: number): Date {
    // 25569 = Days between 1970-01-01 (Unix Epoch) and 1899-12-30 (Excel Epoch)
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400; // Seconds in a day
    return new Date(utcValue * 1000); // Convert to milliseconds
  }

  /**
   * TR: Verilen tarihin "bugün" olup olmadığını kontrol eder.
   * Gün, Ay ve Yıl bazında eşitlik arar (saat bilgisini göz ardı eder).
   *
   * EN: Checks if the given date is "today".
   * Looks for equality based on Day, Month, and Year (ignores time information).
   */
  isToday(value: Date | null): boolean {
    if (!value) return false;
    const today = new Date();
    return (
      value.getDate() === today.getDate() &&
      value.getMonth() === today.getMonth() &&
      value.getFullYear() === today.getFullYear()
    );
  }

  /**
   * TR: Verilen tarihin geçmişte kalıp kalmadığını kontrol eder.
   * Anlık zaman (new Date) ile kıyaslama yapar.
   *
   * EN: Checks if the given date is in the past.
   * Compares with the current time (new Date).
   */
  isPast(value: Date | null): boolean {
    if (!value) return false;
    return value < new Date();
  }

  /**
   * TR: Verilen tarihin gelecekte olup olmadığını kontrol eder.
   *
   * EN: Checks if the given date is in the future.
   */
  isFuture(value: Date | null): boolean {
    if (!value) return false;
    return value > new Date();
  }
}