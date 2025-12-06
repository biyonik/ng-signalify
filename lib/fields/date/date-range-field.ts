import {z} from 'zod';
import {BaseField} from '../base-field';
import {FieldConfig} from '../field.interface';

/**
 * TR: Tarih aralığı veri yapısını tanımlayan arayüz.
 * Başlangıç ve bitiş tarihlerini içerir. Her ikisi de null olabilir (açık uçlu aralıklar için).
 *
 * EN: Interface defining the date range data structure.
 * Contains start and end dates. Both can be null (for open-ended ranges).
 */
export interface DateRange {
    start: Date | null;
    end: Date | null;
}

/**
 * TR: Tarih aralığı alanları için yapılandırma seçenekleri.
 * Mutlak tarih sınırlarının (minDate/maxDate) yanı sıra, aralığın süresini (gün sayısı) kısıtlayan ayarlar içerir.
 *
 * EN: Configuration options for date range fields.
 * Includes absolute date limits (minDate/maxDate) as well as settings restricting the duration (number of days) of the range.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface DateRangeFieldConfig extends FieldConfig {
    /**
     * TR: Seçilebilecek en erken tarih (Mutlak sınır).
     *
     * EN: The earliest date that can be selected (Absolute limit).
     */
    minDate?: Date | string;

    /**
     * TR: Seçilebilecek en geç tarih (Mutlak sınır).
     *
     * EN: The latest date that can be selected (Absolute limit).
     */
    maxDate?: Date | string;

    /**
     * TR: İki tarih arasındaki minimum gün farkı.
     * Örn: "En az 3 günlük bir aralık seçmelisiniz."
     *
     * EN: Minimum day difference between two dates.
     * E.g., "You must select a range of at least 3 days."
     */
    minRange?: number;

    /**
     * TR: İki tarih arasındaki maksimum gün farkı.
     * Örn: "En fazla 30 günlük rapor alabilirsiniz."
     *
     * EN: Maximum day difference between two dates.
     * E.g., "You can generate a report for a maximum of 30 days."
     */
    maxRange?: number;

    /**
     * TR: Tarih formatlaması için yerel ayar.
     *
     * EN: Locale setting for date formatting.
     */
    locale?: string;
}

/**
 * TR: Başlangıç ve Bitiş tarihi seçimlerini yöneten kapsamlı alan sınıfı.
 * Tarihlerin birbirine göre sırasını (Start <= End) ve aralık süresini (Range Duration) doğrular.
 * Ayrıca "Bugün", "Bu Ay" gibi hazır seçim setlerini (Presets) barındırır.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Comprehensive field class managing Start and End date selections.
 * Validates the order of dates relative to each other (Start <= End) and the range duration.
 * Also houses preset selection sets like "Today", "This Month".
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class DateRangeField extends BaseField<DateRange> {
    /**
     * TR: DateRangeField sınıfını başlatır.
     *
     * EN: Initializes the DateRangeField class.
     *
     * @param name - TR: Alan anahtarı. / EN: Field key.
     * @param label - TR: Alan etiketi. / EN: Field label.
     * @param config - TR: Aralık yapılandırması. / EN: Range configuration.
     */
    constructor(
        name: string,
        label: string,
        public override config: DateRangeFieldConfig = {}
    ) {
        super(name, label, config);
    }

    /**
     * TR: Tarih aralığı için karmaşık Zod doğrulama şemasını oluşturur.
     * Çok adımlı doğrulama (Refinement) uygular:
     * 1. Mantıksal Sıra: Başlangıç tarihi bitiş tarihinden sonra olamaz.
     * 2. Min Süre: Aralık belirtilen günden kısa olamaz.
     * 3. Max Süre: Aralık belirtilen günden uzun olamaz.
     *
     * EN: Creates the complex Zod validation schema for the date range.
     * Applies multi-step validation (Refinement):
     * 1. Logical Order: Start date cannot be after end date.
     * 2. Min Duration: Range cannot be shorter than the specified days.
     * 3. Max Duration: Range cannot be longer than the specified days.
     *
     * @returns TR: DateRange Zod şeması. / EN: DateRange Zod schema.
     */
    schema(): z.ZodType<DateRange> {
        const rangeSchema = z
            .object({
                start: z.coerce.date().nullable(),
                end: z.coerce.date().nullable(),
            })
            // TR: Kural 1: Başlangıç <= Bitiş
            // EN: Rule 1: Start <= End
            .refine(
                (data) => {
                    if (data.start && data.end) {
                        return data.start <= data.end;
                    }
                    return true;
                },
                {message: 'Başlangıç tarihi bitiş tarihinden büyük olamaz'}
            )
            // TR: Kural 2: Minimum gün aralığı kontrolü
            // EN: Rule 2: Minimum day range check
            .refine(
                (data) => {
                    if (this.config.minRange && data.start && data.end) {
                        const diffDays = this.getDaysDiff(data.start, data.end);
                        return diffDays >= this.config.minRange;
                    }
                    return true;
                },
                {message: `Aralık en az ${this.config.minRange} gün olmalı`}
            )
            // TR: Kural 3: Maksimum gün aralığı kontrolü
            // EN: Rule 3: Maximum day range check
            .refine(
                (data) => {
                    if (this.config.maxRange && data.start && data.end) {
                        const diffDays = this.getDaysDiff(data.start, data.end);
                        return diffDays <= this.config.maxRange;
                    }
                    return true;
                },
                {message: `Aralık en fazla ${this.config.maxRange} gün olabilir`}
            );

        // TR: Zorunlu değilse, null/optional olabilir.
        // EN: If not required, can be null/optional.
        if (!this.config.required) {
            return rangeSchema.nullable().optional() as unknown as z.ZodType<DateRange>;
        }

        // TR: Zorunluysa, her iki tarihin de dolu olması gerekir.
        // EN: If required, both dates must be filled.
        return rangeSchema.refine(
            (data) => data.start != null && data.end != null,
            {message: `${this.label} zorunludur`}
        ) as unknown as z.ZodType<DateRange>;
    }

    /**
     * TR: Tarih aralığını kullanıcı dostu bir string olarak formatlar.
     * Açık uçlu aralıkları (Örn: "01.01.2023 ve sonrası") destekler.
     *
     * EN: Formats the date range as a user-friendly string.
     * Supports open-ended ranges (E.g., "01.01.2023 and after").
     */
    override present(value: DateRange | null): string {
        if (!value || (!value.start && !value.end)) return '-';

        const locale = this.config.locale ?? 'tr-TR';
        const format = (d: Date) =>
            d.toLocaleDateString(locale, {day: '2-digit', month: '2-digit', year: 'numeric'});

        if (value.start && value.end) {
            return `${format(value.start)} - ${format(value.end)}`;
        }
        if (value.start) return `${format(value.start)} ve sonrası`;
        if (value.end) return `${format(value.end)} ve öncesi`;

        return '-';
    }

    /**
     * TR: Export işlemi için present metodunu kullanır.
     *
     * EN: Uses the present method for the export operation.
     */
    override toExport(value: DateRange | null): string | null {
        return this.present(value);
    }

    /**
     * TR: String formatındaki bir aralığı ("Tarih1 - Tarih2") parse eder.
     * Genellikle panoya kopyalanmış verileri yapıştırmak veya CSV import işlemleri için kullanılır.
     *
     * EN: Parses a range in string format ("Date1 - Date2").
     * Usually used for pasting clipboard data or CSV import operations.
     */
    override fromImport(raw: unknown): DateRange | null {
        if (raw == null || raw === '') return null;

        // TR: "01.01.2024 - 31.01.2024" formatını parse et
        // EN: Parse format "01.01.2024 - 31.01.2024"
        if (typeof raw === 'string') {
            const parts = raw.split(/\s+-\s+/);
            if (parts.length === 2) {
                const start = new Date(parts[0]);
                const end = new Date(parts[1]);
                return {
                    start: isNaN(start.getTime()) ? null : start,
                    end: isNaN(end.getTime()) ? null : end,
                };
            }
        }

        return null;
    }

    /**
     * TR: Filtre önizlemesi.
     *
     * EN: Filter preview.
     */
    override filterPreview(value: DateRange | null): string | null {
        return this.present(value);
    }

    /**
     * TR: İki tarih arasındaki farkı gün cinsinden hesaplayan yardımcı metod.
     * Matematiksel yuvarlama yaparak tam sayı döndürür.
     *
     * EN: Helper method calculating the difference between two dates in days.
     * Returns an integer by performing mathematical rounding.
     */
    private getDaysDiff(start: Date, end: Date): number {
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.round((end.getTime() - start.getTime()) / msPerDay);
    }

    /**
     * TR: Seçili aralığın toplam kaç gün sürdüğünü döndürür.
     *
     * EN: Returns the total duration of the selected range in days.
     */
    getRangeDays(value: DateRange | null): number | null {
        if (!value?.start || !value?.end) return null;
        return this.getDaysDiff(value.start, value.end);
    }

    /**
     * TR: Belirli bir tarihin, seçili aralığın içinde olup olmadığını kontrol eder.
     * Varsayılan olarak bugünün aralıkta olup olmadığına bakar.
     *
     * EN: Checks if a specific date falls within the selected range.
     * Checks if today is in the range by default.
     *
     * @param value - TR: Kontrol edilecek aralık. / EN: Range to check.
     * @param date - TR: Sorgulanan tarih (Varsayılan: Şimdi). / EN: Queried date (Default: Now).
     */
    includesDate(value: DateRange | null, date: Date = new Date()): boolean {
        if (!value?.start || !value?.end) return false;
        return date >= value.start && date <= value.end;
    }

    /**
     * TR: UI üzerinde hızlı seçim yapmak için kullanılan ön tanımlı tarih setleri.
     * Raporlama ekranlarında "Bu Hafta", "Geçen Ay" gibi butonlar için idealdir.
     *
     * EN: Pre-defined date sets used for quick selection on the UI.
     * Ideal for buttons like "This Week", "Last Month" on reporting screens.
     */
    static readonly PRESETS = {
        // TR: Bugünün başlangıcından (00:00) sonuna (23:59) kadar.
        // EN: From the start of today (00:00) to the end (23:59).
        today: (): DateRange => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const end = new Date(today);
            end.setHours(23, 59, 59, 999);
            return {start: today, end};
        },
        // TR: İçinde bulunulan haftanın Pazartesi gününden Pazar gününe kadar.
        // EN: From Monday to Sunday of the current week.
        thisWeek: (): DateRange => {
            const today = new Date();
            const start = new Date(today);
            start.setDate(today.getDate() - today.getDay() + 1); // Monday adjustment might need locale check usually, but assumes ISO week roughly
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return {start, end};
        },
        // TR: Bu ayın ilk gününden son gününe kadar.
        // EN: From the first day to the last day of this month.
        thisMonth: (): DateRange => {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
            return {start, end};
        },
        // TR: Bir önceki ayın tamamı.
        // EN: The entire previous month.
        lastMonth: (): DateRange => {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
            return {start, end};
        },
        // TR: Bu yılın başından (1 Ocak) sonuna (31 Aralık) kadar.
        // EN: From the start (Jan 1) to the end (Dec 31) of this year.
        thisYear: (): DateRange => {
            const today = new Date();
            const start = new Date(today.getFullYear(), 0, 1);
            const end = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
            return {start, end};
        },
    };
}