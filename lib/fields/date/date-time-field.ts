import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Tarih ve Saat (Datetime) alanları için gelişmiş yapılandırma seçenekleri.
 * Zaman dilimi (Timezone), saniye gösterimi ve locale ayarlarını yönetir.
 *
 * EN: Advanced configuration options for Date and Time (Datetime) fields.
 * Manages timezone, second display, and locale settings.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface DateTimeFieldConfig extends FieldConfig {
  /**
   * TR: Seçilebilecek en erken tarih ve saat.
   *
   * EN: The earliest date and time that can be selected.
   */
  min?: Date | string;

  /**
   * TR: Seçilebilecek en geç tarih ve saat.
   *
   * EN: The latest date and time that can be selected.
   */
  max?: Date | string;

  /**
   * TR: Tarih/Saat gösteriminde kullanılacak zaman dilimi tanımlayıcısı.
   * Örn: 'Europe/Istanbul', 'UTC', 'America/New_York'.
   * Belirtilmezse tarayıcının varsayılan zaman dilimi kullanılır.
   *
   * EN: Timezone identifier to be used in Date/Time display.
   * E.g., 'Europe/Istanbul', 'UTC', 'America/New_York'.
   * If not specified, the browser's default timezone is used.
   */
  timezone?: string;

  /**
   * TR: Saat gösteriminde saniyelerin de yer alıp almayacağını belirler.
   * Varsayılan: false (Sadece Saat:Dakika).
   *
   * EN: Determines whether seconds are included in the time display.
   * Default: false (Hour:Minute only).
   */
  showSeconds?: boolean;

  /**
   * TR: Formatlama için kullanılacak yerel ayar.
   *
   * EN: Locale setting to be used for formatting.
   */
  locale?: string;
}

/**
 * TR: Tam zaman damgası (Timestamp) verilerini yöneten alan sınıfı.
 * Tarih ve saati tek bir Date objesi olarak tutar. Zaman dilimi duyarlı (Timezone-aware)
 * formatlama, Excel'den ondalıklı zaman dönüşümü ve bağıl zaman (Relative Time) hesaplamaları sunar.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class managing full timestamp data.
 * Holds date and time as a single Date object. Offers timezone-aware formatting,
 * fractional time conversion from Excel, and relative time calculations.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class DateTimeField extends BaseField<Date> {
  /**
   * TR: DateTimeField sınıfını başlatır.
   *
   * EN: Initializes the DateTimeField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Tarih/Saat yapılandırması. / EN: Date/Time configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: DateTimeFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Tarih ve Saat değeri için Zod doğrulama şemasını oluşturur.
   * `z.coerce.date` sayesinde ISO stringleri otomatik olarak Date objesine dönüştürülür.
   *
   * EN: Creates the Zod validation schema for the Date and Time value.
   * ISO strings are automatically converted to Date objects thanks to `z.coerce.date`.
   *
   * @returns TR: Date Zod şeması. / EN: Date Zod schema.
   */
  schema(): z.ZodType<Date> {
    let s = z.coerce.date({
      required_error: `${this.label} zorunludur`,
      invalid_type_error: `${this.label} geçerli bir tarih/saat olmalı`,
    });

    if (this.config.min) {
      const minDate = new Date(this.config.min);
      s = s.min(minDate, `${this.label} en erken ${this.formatDateTime(minDate)} olabilir`);
    }
    if (this.config.max) {
      const maxDate = new Date(this.config.max);
      s = s.max(maxDate, `${this.label} en geç ${this.formatDateTime(maxDate)} olabilir`);
    }

    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<Date>;
    }
    return s;
  }

  /**
   * TR: Değeri, yapılandırılan locale ve timezone ayarlarına göre formatlar.
   *
   * EN: Formats the value according to the configured locale and timezone settings.
   */
  override present(value: Date | null): string {
    if (value == null) return '-';
    return this.formatDateTime(value);
  }

  /**
   * TR: Dışa aktarım için ISO 8601 formatında (UTC) string döndürür.
   * Örn: "2023-10-25T14:30:00.000Z". Bu format sistemler arası veri transferi için standarttır.
   *
   * EN: Returns a string in ISO 8601 format (UTC) for export.
   * E.g., "2023-10-25T14:30:00.000Z". This format is standard for inter-system data transfer.
   */
  override toExport(value: Date | null): string | null {
    if (value == null) return null;
    return value.toISOString();
  }

  /**
   * TR: Dış kaynaktan gelen veriyi işler.
   * Excel'den gelen sayılarda, tam sayı kısmı günü, ondalık kısmı (fraction) ise saati ifade eder.
   * Bu metod her iki durumu da (ISO string ve Excel Number) kapsar.
   *
   * EN: Processes data from an external source.
   * For numbers from Excel, the integer part represents the day, and the decimal part (fraction) represents the time.
   * This method covers both cases (ISO string and Excel Number).
   */
  override fromImport(raw: unknown): Date | null {
    if (raw == null || raw === '') return null;

    // TR: Excel tarih ve saat seri numarası (Örn: 44567.5 = Öğlen 12:00)
    // EN: Excel date and time serial number (E.g., 44567.5 = Noon 12:00)
    if (typeof raw === 'number') {
      return this.excelDateTimeToJs(raw);
    }

    // TR: ISO string veya diğer formatlar
    // EN: ISO string or other formats
    const date = new Date(raw as string);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * TR: Tarih ve saati yerel ayarlara ve zaman dilimine göre formatlayan ana metod.
   * `Intl.DateTimeFormat` API'sini kullanır.
   *
   * EN: Main method formatting date and time according to locale and timezone settings.
   * Uses the `Intl.DateTimeFormat` API.
   */
  private formatDateTime(date: Date): string {
    const locale = this.config.locale ?? 'tr-TR';
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      // TR: Saniye gösterimi opsiyoneldir
      // EN: Second display is optional
      ...(this.config.showSeconds && { second: '2-digit' }),
      // TR: Zaman dilimi desteği
      // EN: Timezone support
      ...(this.config.timezone && { timeZone: this.config.timezone }),
    };
    return date.toLocaleString(locale, options);
  }

  /**
   * TR: Excel seri numarasını (Tarih + Saat) JS Date objesine çevirir.
   * Excel'de 1 gün = 1 tam sayıdır. 1 saat ise 1/24 ondalık değere eşittir.
   *
   * EN: Converts Excel serial number (Date + Time) to JS Date object.
   * In Excel, 1 day = 1 integer. 1 hour equals 1/24 decimal value.
   *
   * @param serial - TR: Excel seri numarası (örn: 44123.45). / EN: Excel serial number (e.g., 44123.45).
   */
  private excelDateTimeToJs(serial: number): Date {
    // 25569 = Days between 1970-01-01 and 1899-12-30
    const utcDays = serial - 25569;
    const utcValue = utcDays * 86400 * 1000; // Days * Seconds * Milliseconds
    return new Date(utcValue);
  }

  /**
   * TR: Zaman damgasının sadece "Tarih" kısmını izole edip döndürür.
   *
   * EN: Isolates and returns only the "Date" part of the timestamp.
   */
  getDatePart(value: Date | null): string {
    if (!value) return '-';
    const locale = this.config.locale ?? 'tr-TR';
    return value.toLocaleDateString(locale);
  }

  /**
   * TR: Zaman damgasının sadece "Saat" kısmını izole edip döndürür.
   *
   * EN: Isolates and returns only the "Time" part of the timestamp.
   */
  getTimePart(value: Date | null): string {
    if (!value) return '-';
    const locale = this.config.locale ?? 'tr-TR';
    return value.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...(this.config.showSeconds && { second: '2-digit' }),
    });
  }

  /**
   * TR: Verilen tarihin şimdiki zamana göre göreceli durumunu hesaplar.
   * "5 dakika önce", "2 gün sonra", "şimdi" gibi insancıl (human-readable) çıktılar üretir.
   * `Intl.RelativeTimeFormat` API'sini kullanır.
   *
   * EN: Calculates the relative state of the given date compared to the current time.
   * Generates human-readable outputs like "5 minutes ago", "in 2 days", "now".
   * Uses the `Intl.RelativeTimeFormat` API.
   *
   * @param value - TR: Kıyaslanacak tarih. / EN: Date to compare.
   * @returns TR: Göreceli zaman stringi. / EN: Relative time string.
   */
  getRelativeTime(value: Date | null): string {
    if (!value) return '-';

    const now = new Date();
    const diffMs = value.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);

    const rtf = new Intl.RelativeTimeFormat(this.config.locale ?? 'tr-TR', { numeric: 'auto' });

    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
    return rtf.format(diffDay, 'day');
  }
}