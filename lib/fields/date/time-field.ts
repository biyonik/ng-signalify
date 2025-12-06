import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Tarihten bağımsız, saf zaman verisini temsil eden arayüz.
 *
 * EN: Interface representing pure time data, independent of date.
 */
export interface Time {
  hours: number;
  minutes: number;
  seconds?: number;
}

/**
 * TR: Zaman alanı konfigürasyonu.
 * Minimum/maksimum saat sınırları, artış adımı (step) ve görüntüleme formatlarını (12h/24h) yönetir.
 *
 * EN: Time field configuration.
 * Manages minimum/maximum time limits, increment step, and display formats (12h/24h).
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface TimeFieldConfig extends FieldConfig {
  /**
   * TR: Seçilebilecek en erken saat (Örn: "09:00").
   *
   * EN: The earliest time that can be selected (E.g., "09:00").
   */
  min?: string;

  /**
   * TR: Seçilebilecek en geç saat (Örn: "18:00").
   *
   * EN: The latest time that can be selected (E.g., "18:00").
   */
  max?: string;

  /**
   * TR: Dakika seçimindeki artış aralığı.
   * Varsayılan: 1 (Her dakika seçilebilir). Örn: 15 verilirse sadece 00, 15, 30, 45 seçilebilir.
   *
   * EN: Increment interval in minute selection.
   * Default: 1 (Every minute can be selected). E.g., if 15 is given, only 00, 15, 30, 45 can be selected.
   */
  step?: number;

  /**
   * TR: Saniye bilgisinin gösterilip gösterilmeyeceği.
   * Varsayılan: false.
   *
   * EN: Whether to display seconds information.
   * Default: false.
   */
  showSeconds?: boolean;

  /**
   * TR: 24 saatlik formatın kullanılıp kullanılmayacağı.
   * True: 14:30, False: 02:30 PM. Varsayılan: true.
   *
   * EN: Whether to use the 24-hour format.
   * True: 14:30, False: 02:30 PM. Default: true.
   */
  format24h?: boolean;
}

/**
 * TR: Saat ve Dakika (opsiyonel Saniye) verilerini yöneten alan sınıfı.
 * Tarih bileşeni içermez, sadece günün saatini temsil eder.
 * Excel importlarında kullanılan ondalık gün (fractional day) formatını destekler.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class managing Hour and Minute (optional Second) data.
 * Does not contain a date component, represents only the time of day.
 * Supports the fractional day format used in Excel imports.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class TimeField extends BaseField<Time> {
  /**
   * TR: TimeField sınıfını başlatır.
   *
   * EN: Initializes the TimeField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Zaman yapılandırması. / EN: Time configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: TimeFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Zaman verisi için Zod doğrulama şemasını oluşturur.
   * Önce yapısal doğrulama (0-23 saat, 0-59 dakika) yapar.
   * Ardından konfigürasyondaki min/max string değerlerine göre mantıksal doğrulama (refine) ekler.
   *
   * EN: Creates the Zod validation schema for time data.
   * First performs structural validation (0-23 hours, 0-59 minutes).
   * Then adds logical validation (refine) based on min/max string values in the configuration.
   *
   * @returns TR: Time Zod şeması. / EN: Time Zod schema.
   */
  schema(): z.ZodType<Time> {
    const timeSchema = z
      .object({
        hours: z.number().min(0).max(23),
        minutes: z.number().min(0).max(59),
        seconds: z.number().min(0).max(59).optional(),
      })
      // TR: Minimum saat kontrolü
      // EN: Minimum time check
      .refine(
        (data: Time) => {
          if (this.config.min) {
            const minTime = this.parseTimeString(this.config.min);
            return this.compareTime(data, minTime) >= 0;
          }
          return true;
        },
        { message: `${this.label} en erken ${this.config.min} olabilir` }
      )
      // TR: Maksimum saat kontrolü
      // EN: Maximum time check
      .refine(
        (data: Time) => {
          if (this.config.max) {
            const maxTime = this.parseTimeString(this.config.max);
            return this.compareTime(data, maxTime) <= 0;
          }
          return true;
        },
        { message: `${this.label} en geç ${this.config.max} olabilir` }
      );

    if (!this.config.required) {
      return timeSchema.nullable().optional() as unknown as z.ZodType<Time>;
    }
    return timeSchema as z.ZodType<Time>;
  }

  /**
   * TR: Zaman nesnesini yapılandırılan formata (12h/24h) göre string'e çevirir.
   *
   * EN: Converts the time object to string according to the configured format (12h/24h).
   */
  override present(value: Time | null): string {
    if (value == null) return '-';
    return this.formatTime(value);
  }

  /**
   * TR: Dışa aktarım için zamanı string formatında döndürür.
   *
   * EN: Returns time in string format for export.
   */
  override toExport(value: Time | null): string | null {
    if (value == null) return null;
    return this.formatTime(value);
  }

  /**
   * TR: Dış kaynaktan gelen veriyi işler.
   * String ("14:30") veya Excel sayısal formatını (0.604) destekler.
   *
   * EN: Processes data from an external source.
   * Supports string ("14:30") or Excel numeric format (0.604).
   */
  override fromImport(raw: unknown): Time | null {
    if (raw == null || raw === '') return null;

    if (typeof raw === 'string') {
      return this.parseTimeString(raw);
    }

    // TR: Excel ondalık gün formatı (0.5 = günün yarısı = 12:00)
    // EN: Excel fractional day format (0.5 = half of the day = 12:00)
    if (typeof raw === 'number') {
      // TR: Gün içindeki toplam dakika sayısı
      // EN: Total number of minutes in a day
      const totalMinutes = Math.round(raw * 24 * 60);
      return {
        hours: Math.floor(totalMinutes / 60) % 24,
        minutes: totalMinutes % 60,
      };
    }

    return null;
  }

  /**
   * TR: "HH:mm" veya "HH:mm:ss" formatındaki stringi Time objesine çevirir.
   *
   * EN: Converts string in "HH:mm" or "HH:mm:ss" format to Time object.
   */
  private parseTimeString(str: string): Time {
    const parts = str.split(':').map(Number);
    return {
      hours: parts[0] ?? 0,
      minutes: parts[1] ?? 0,
      seconds: parts[2],
    };
  }

  /**
   * TR: Time objesini string formatına dönüştüren yardımcı metod.
   * 12 saatlik (AM/PM) veya 24 saatlik formata göre çıktı üretir.
   *
   * EN: Helper method converting Time object to string format.
   * Generates output based on 12-hour (AM/PM) or 24-hour format.
   */
  private formatTime(time: Time): string {
    // TR: Tek haneli sayıları başına '0' ekleyerek tamamlar (pad).
    // EN: Pads single-digit numbers by adding '0' to the beginning.
    const pad = (n: number) => n.toString().padStart(2, '0');

    if (this.config.format24h !== false) {
      // 24-hour format
      const base = `${pad(time.hours)}:${pad(time.minutes)}`;
      return this.config.showSeconds && time.seconds != null
        ? `${base}:${pad(time.seconds)}`
        : base;
    }

    // 12-hour format
    const period = time.hours >= 12 ? 'PM' : 'AM';
    const hours12 = time.hours % 12 || 12; // 0 should be 12
    const base = `${hours12}:${pad(time.minutes)}`;
    return this.config.showSeconds && time.seconds != null
      ? `${base}:${pad(time.seconds)} ${period}`
      : `${base} ${period}`;
  }

  /**
   * TR: İki zaman değerini karşılaştırır.
   * a < b ise -1, a > b ise 1, eşitse 0 döner.
   * Karşılaştırmayı toplam dakika üzerinden yapar.
   *
   * EN: Compares two time values.
   * Returns -1 if a < b, 1 if a > b, 0 if equal.
   * Performs comparison based on total minutes.
   */
  private compareTime(a: Time, b: Time): number {
    const aMinutes = a.hours * 60 + a.minutes;
    const bMinutes = b.hours * 60 + b.minutes;
    if (aMinutes < bMinutes) return -1;
    if (aMinutes > bMinutes) return 1;
    return 0;
  }

  /**
   * TR: Time objesini günün başlangıcından itibaren geçen toplam dakikaya çevirir.
   * Matematiksel hesaplamalar ve süre farkı bulmak için kullanışlıdır.
   *
   * EN: Converts Time object to total minutes elapsed since the beginning of the day.
   * Useful for mathematical calculations and finding duration difference.
   */
  toMinutes(value: Time | null): number | null {
    if (!value) return null;
    return value.hours * 60 + value.minutes;
  }

  /**
   * TR: Toplam dakika değerini tekrar Time objesine dönüştürür.
   *
   * EN: Converts total minute value back to Time object.
   */
  fromMinutes(minutes: number): Time {
    return {
      hours: Math.floor(minutes / 60) % 24,
      minutes: minutes % 60,
    };
  }

  /**
   * TR: Time objesini, bugünün tarihi ile birleştirerek tam bir JavaScript Date objesine çevirir.
   * Takvim bileşenleri veya veritabanı kayıtları için gerekli olabilir.
   *
   * EN: Converts Time object to a full JavaScript Date object by combining it with today's date.
   * Might be required for calendar components or database records.
   */
  toDate(value: Time | null): Date | null {
    if (!value) return null;
    const date = new Date();
    date.setHours(value.hours, value.minutes, value.seconds ?? 0, 0);
    return date;
  }
}