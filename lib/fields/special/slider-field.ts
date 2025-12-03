import { z } from 'zod';
import { BaseField } from '../base-field';
import { FieldConfig } from '../field.interface';

/**
 * TR: Slider üzerinde belirli noktaları (işaretleri) temsil eden yapı.
 * Kullanıcıya kritik eşikleri (örn: %0, %50, %100) göstermek için kullanılır.
 *
 * EN: Structure representing specific points (marks) on the slider.
 * Used to show critical thresholds (e.g., 0%, 50%, 100%) to the user.
 */
export interface SliderMark {
  /**
   * TR: İşaretin sayısal değeri.
   *
   * EN: Numeric value of the mark.
   */
  value: number;

  /**
   * TR: İşaretin altında görünecek etiket (Opsiyonel).
   *
   * EN: Label to appear below the mark (Optional).
   */
  label?: string;
}

/**
 * TR: Slider alanı için yapılandırma seçenekleri.
 * Min/Max sınırları, adım aralığı (step), aralık modu (range) ve görsel işaretleri yönetir.
 *
 * EN: Configuration options for the slider field.
 * Manages Min/Max limits, step interval, range mode, and visual marks.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface SliderFieldConfig extends FieldConfig {
  /**
   * TR: Seçilebilecek minimum değer.
   * Varsayılan: 0.
   *
   * EN: Minimum selectable value.
   * Default: 0.
   */
  min?: number;

  /**
   * TR: Seçilebilecek maksimum değer.
   * Varsayılan: 100.
   *
   * EN: Maximum selectable value.
   * Default: 100.
   */
  max?: number;

  /**
   * TR: Değerin artış/azalış adımı.
   * Örn: 0.1, 1, 10.
   *
   * EN: Increment/decrement step of the value.
   * E.g., 0.1, 1, 10.
   */
  step?: number;

  /**
   * TR: Slider çubuğu üzerinde gösterilecek özel işaretler dizisi.
   *
   * EN: Array of special marks to be displayed on the slider bar.
   */
  marks?: SliderMark[];

  /**
   * TR: Başlangıç ve bitiş etiketlerinin (Min/Max) gösterilip gösterilmeyeceği.
   *
   * EN: Whether to show start and end labels (Min/Max).
   */
  showLimits?: boolean;

  /**
   * TR: Anlık seçili değerin gösterilip gösterilmeyeceği (Tooltip veya Label olarak).
   *
   * EN: Whether to show the currently selected value (as Tooltip or Label).
   */
  showValue?: boolean;

  /**
   * TR: Aralık seçimi (Range Slider) modunu aktif eder.
   * True ise değer `[başlangıç, bitiş]` şeklinde bir Tuple olur.
   *
   * EN: Activates range selection (Range Slider) mode.
   * If true, the value becomes a Tuple in the form `[start, end]`.
   */
  range?: boolean;

  /**
   * TR: Değerin yanına eklenecek birim eki (%, px, kg vb.).
   *
   * EN: Unit suffix to be added next to the value (%, px, kg, etc.).
   */
  unit?: string;

  /**
   * TR: Değerin gösterimi için özel formatlama fonksiyonu.
   *
   * EN: Custom formatting function for value display.
   */
  formatValue?: (value: number) => string;
}



/**
 * TR: Sayısal değerleri görsel bir sürgü (Slider) üzerinden seçtiren alan sınıfı.
 * Tekil seçim (number) veya Aralık seçimi ([number, number]) modlarını destekler.
 * CSS konumlandırma için yüzde hesaplamaları ve adım (step) yuvarlama fonksiyonları içerir.
 * BaseField sınıfından türetilmiştir.
 *
 * EN: Field class allowing selection of numeric values via a visual slider.
 * Supports Single selection (number) or Range selection ([number, number]) modes.
 * Includes percentage calculations for CSS positioning and step rounding functions.
 * Derived from the BaseField class.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class SliderField extends BaseField<number | [number, number]> {
  /**
   * TR: SliderField sınıfını başlatır.
   *
   * EN: Initializes the SliderField class.
   *
   * @param name - TR: Alan anahtarı. / EN: Field key.
   * @param label - TR: Alan etiketi. / EN: Field label.
   * @param config - TR: Slider yapılandırması. / EN: Slider configuration.
   */
  constructor(
    name: string,
    label: string,
    public override config: SliderFieldConfig = {}
  ) {
    super(name, label, config);
  }

  /**
   * TR: Slider modu (Range/Single) baz alınarak Zod doğrulama şemasını oluşturur.
   * Range modunda: Başlangıç <= Bitiş kontrolü yapan bir Tuple şeması döner.
   * Single modunda: Min/Max ve Step (MultipleOf) kontrolleri yapan sayı şeması döner.
   *
   * EN: Creates the Zod validation schema based on Slider mode (Range/Single).
   * In Range mode: Returns a Tuple schema checking Start <= End.
   * In Single mode: Returns a number schema checking Min/Max and Step (MultipleOf).
   *
   * @returns TR: Sayı veya Sayı Dizisi (Tuple) Zod şeması. / EN: Number or Number Array (Tuple) Zod schema.
   */
  schema(): z.ZodType<number | [number, number]> {
    const min = this.config.min ?? 0;
    const max = this.config.max ?? 100;

    if (this.config.range) {
      // Range slider (Tuple validation)
      const tupleSchema = z
        .tuple([z.number(), z.number()])
        .refine(([start, end]) => start <= end, 'Başlangıç değeri bitiş değerinden büyük olamaz')
        .refine(([start]) => start >= min, `Değer en az ${min} olmalı`)
        .refine(([, end]) => end <= max, `Değer en fazla ${max} olabilir`);

      if (!this.config.required) {
        return tupleSchema.nullable().optional() as unknown as z.ZodType<[number, number]>;
      }
      return tupleSchema as unknown as z.ZodType<[number, number]>;
    }

    // Single slider (Number validation)
    let s = z
      .number({ required_error: `${this.label} zorunludur` })
      .min(min, `${this.label} en az ${min} olmalı`)
      .max(max, `${this.label} en fazla ${max} olabilir`);

    if (this.config.step) {
      s = s.multipleOf(this.config.step, `Değer ${this.config.step}'in katı olmalı`);
    }

    if (!this.config.required) {
      return s.nullable().optional() as unknown as z.ZodType<number>;
    }
    return s as z.ZodType<number>;
  }

  /**
   * TR: Değeri kullanıcı dostu bir formata çevirir.
   * Varsa birim (unit) ekler veya özel formatlayıcıyı çalıştırır.
   * Range modunda "10 - 20" şeklinde gösterir.
   *
   * EN: Converts the value to a user-friendly format.
   * Appends unit if present or executes the custom formatter.
   * Displays as "10 - 20" in Range mode.
   */
  override present(value: number | [number, number] | null): string {
    if (value == null) return '-';

    const format = (v: number) => {
      if (this.config.formatValue) {
        return this.config.formatValue(v);
      }
      const unit = this.config.unit ?? '';
      return `${v}${unit}`;
    };

    if (Array.isArray(value)) {
      return `${format(value[0])} - ${format(value[1])}`;
    }

    return format(value);
  }

  /**
   * TR: Dış kaynaktan gelen veriyi işler.
   * String aralıkları ("10 - 50") parse ederek Tuple formatına çevirir.
   *
   * EN: Processes data from an external source.
   * Parses string ranges ("10 - 50") and converts them to Tuple format.
   *
   * @param raw - TR: Ham veri. / EN: Raw data.
   */
  override fromImport(raw: unknown): number | [number, number] | null {
    if (raw == null || raw === '') return null;

    // Range: "10 - 50" or "10-50"
    if (typeof raw === 'string' && raw.includes('-')) {
      const parts = raw.split('-').map((p) => Number(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return [parts[0], parts[1]];
      }
    }

    // Single number
    const num = Number(raw);
    return isNaN(num) ? null : num;
  }

  /**
   * TR: Filtre önizlemesi.
   *
   * EN: Filter preview.
   */
  override filterPreview(value: number | [number, number] | null): string | null {
    return this.present(value);
  }

  /**
   * TR: Sayısal değeri CSS konumlandırması için (left/width) yüzdeye (0-100) çevirir.
   * Formül: (değer - min) / (max - min) * 100
   *
   * EN: Converts numeric value to percentage (0-100) for CSS positioning (left/width).
   * Formula: (value - min) / (max - min) * 100
   *
   * @param value - TR: Gerçek sayısal değer. / EN: Actual numeric value.
   * @returns TR: Yüzdelik karşılığı. / EN: Percentage equivalent.
   */
  toPercent(value: number): number {
    const min = this.config.min ?? 0;
    const max = this.config.max ?? 100;
    return ((value - min) / (max - min)) * 100;
  }

  /**
   * TR: UI üzerindeki yüzde değerini (0-100), gerçek sayısal değere geri çevirir.
   * Step yapılandırması varsa, değeri en yakın adıma yuvarlar (snap).
   *
   * EN: Converts percentage value (0-100) on UI back to actual numeric value.
   * If step is configured, snaps the value to the nearest step.
   *
   * @param percent - TR: Yüzde değeri. / EN: Percentage value.
   * @returns TR: Gerçek sayısal değer. / EN: Actual numeric value.
   */
  fromPercent(percent: number): number {
    const min = this.config.min ?? 0;
    const max = this.config.max ?? 100;
    const value = min + (percent / 100) * (max - min);

    // TR: Step'e yuvarla
    // EN: Round to step
    if (this.config.step) {
      return Math.round(value / this.config.step) * this.config.step;
    }
    return value;
  }

  /**
   * TR: Slider üzerinde gösterilecek işaret noktalarını (Marks) hesaplar.
   * Config içinde tanımlı değilse; otomatik olarak Min, Orta ve Max noktalarını döndürür.
   *
   * EN: Calculates mark points (Marks) to be displayed on the slider.
   * If not defined in config; automatically returns Min, Mid, and Max points.
   */
  getMarks(): SliderMark[] {
    if (this.config.marks) {
      return this.config.marks;
    }

    // Default marks: min, mid, max
    const min = this.config.min ?? 0;
    const max = this.config.max ?? 100;
    const mid = (min + max) / 2;

    return [
      { value: min, label: this.formatMarkLabel(min) },
      { value: mid, label: this.formatMarkLabel(mid) },
      { value: max, label: this.formatMarkLabel(max) },
    ];
  }

  /**
   * TR: Mark etiketini birimle beraber formatlar.
   *
   * EN: Formats mark label with unit.
   */
  private formatMarkLabel(value: number): string {
    const unit = this.config.unit ?? '';
    return `${value}${unit}`;
  }

  /**
   * TR: Değeri tanımlanan Min/Max sınırları içinde tutar (Clamping).
   * Değer Min'den küçükse Min, Max'tan büyükse Max döner.
   *
   * EN: Keeps the value within defined Min/Max limits (Clamping).
   * Returns Min if value is less than Min, Max if greater than Max.
   */
  clamp(value: number): number {
    const min = this.config.min ?? 0;
    const max = this.config.max ?? 100;
    return Math.max(min, Math.min(max, value));
  }

  /**
   * TR: Verilen bir değeri, konfigürasyondaki adım (step) aralığına oturtur (Snap).
   * Örn: Step 10 ise, 14 -> 10, 16 -> 20 olur.
   *
   * EN: Fits (Snaps) a given value to the step interval in the configuration.
   * E.g., if Step is 10, 14 -> 10, 16 -> 20.
   */
  snapToStep(value: number): number {
    if (!this.config.step) return value;

    const min = this.config.min ?? 0;
    const stepped = Math.round((value - min) / this.config.step) * this.config.step + min;
    return this.clamp(stepped);
  }
}