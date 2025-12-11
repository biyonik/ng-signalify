import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { IField } from '../fields';
import * as XLSX from 'xlsx';

/**
 * TR: İçe aktarım sırasında bir satırın alabileceği durumlar.
 * - pending: İşlenmeyi bekliyor.
 * - importing: Şu an işleniyor (API isteği gönderildi).
 * - imported: Başarıyla tamamlandı.
 * - error: Doğrulama veya işlem hatası oluştu.
 *
 * EN: Possible statuses a row can take during import.
 * - pending: Waiting to be processed.
 * - importing: Currently processing (API request sent).
 * - imported: Successfully completed.
 * - error: Validation or processing error occurred.
 */
export type RowStatus = 'pending' | 'importing' | 'imported' | 'error';

/**
 * TR: İşlenecek Excel satırını ve meta verilerini temsil eden arayüz.
 * Satır numarası, işlem durumu ve varsa hata mesajını barındırır.
 * Dinamik alanlar (Excel sütunları) key-value olarak bu nesnede tutulur.
 *
 * EN: Interface representing the Excel row to be processed and its metadata.
 * Contains row number, processing status, and error message if any.
 * Dynamic fields (Excel columns) are stored as key-value pairs in this object.
 */
export interface ImportRow {
  /**
   * TR: Excel dosyasındaki satır numarası (Hata takibi için).
   *
   * EN: Row number in the Excel file (For error tracking).
   */
  _line: number;

  /**
   * TR: Satırın anlık işlem durumu.
   *
   * EN: Current processing status of the row.
   */
  _status: RowStatus;

  /**
   * TR: Varsa hata mesajı.
   *
   * EN: Error message if exists.
   */
  _error?: string;

  /**
   * TR: Dinamik sütun verileri.
   *
   * EN: Dynamic column data.
   */
  [key: string]: unknown;
}

/**
 * TR: İçe aktarım sürecinin tüm reaktif durumunu (State) barındıran arayüz.
 * Angular Signals ile yönetilir; bu sayede UI tarafında ilerleme çubuğu (Progress Bar),
 * istatistikler ve veri tablosu anlık olarak güncellenir.
 *
 * EN: Interface holding the entire reactive state of the import process.
 * Managed with Angular Signals; ensuring Progress Bar, statistics, and data table
 * are updated instantly on the UI side.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface ImporterState {
  /**
   * TR: Okunan ve işlenen tüm satırların listesi.
   *
   * EN: List of all read and processed rows.
   */
  rows: Signal<ImportRow[]>;

  /**
   * TR: Genel süreç durumu.
   * Dosya okuma, hazır olma, işleme veya duraklatma durumlarını belirtir.
   *
   * EN: Overall process status.
   * Indicates reading, ready, processing, or paused states.
   */
  status: Signal<'idle' | 'reading' | 'ready' | 'importing' | 'paused' | 'completed'>;

  /**
   * TR: Dosya okuma veya genel işlem hatası (Satır bazlı hatalar hariç).
   *
   * EN: File reading or general processing error (Excluding row-based errors).
   */
  error: Signal<string | null>;

  /**
   * TR: Süreç istatistikleri.
   * Toplam, bekleyen, tamamlanan ve hatalı kayıt sayılarını ve ilerleme yüzdesini içerir.
   *
   * EN: Process statistics.
   * Contains total, pending, completed, and error record counts and progress percentage.
   */
  stats: Signal<{
    total: number;
    pending: number;
    imported: number;
    error: number;
    percent: number;
  }>;

  /**
   * TR: Seçilen dosyayı okur ve analize başlar.
   *
   * EN: Reads the selected file and starts analysis.
   */
  readFile: (file: File) => Promise<void>;

  /**
   * TR: Bekleyen satırları işlemeye (Import) başlar.
   *
   * EN: Starts processing (Import) pending rows.
   */
  start: () => Promise<void>;

  /**
   * TR: İşlemi geçici olarak durdurur (Mevcut batch tamamlandıktan sonra).
   *
   * EN: Temporarily pauses the process (After the current batch is completed).
   */
  pause: () => void;

  /**
   * TR: Durumu sıfırlar ve yeni bir dosya yüklemeye hazır hale getirir.
   *
   * EN: Resets the state and makes it ready for a new file upload.
   */
  reset: () => void;

  /**
   * TR: Beklenen formatta boş bir Excel şablonu oluşturup indirir.
   *
   * EN: Generates and downloads an empty Excel template in the expected format.
   */
  downloadTemplate: (filename: string) => void;
}

/**
 * TR: Tek bir satırın veritabanına kaydedilmesi işlemini yapan asenkron fonksiyon tipi.
 *
 * EN: Async function type performing the database saving operation of a single row.
 */
export type ImportFn = (row: Record<string, unknown>, hash: string) => Promise<void>;

/**
 * TR: FNV-1a hash algoritması sabitleri.
 * EN: FNV-1a hash algorithm constants.
 */
const FNV_OFFSET_BASIS = 2166136261;
const FNV_PRIME = 16777619;
const EMPTY_HASH = '';

/**
 * TR: Toplu veri içe aktarım (Bulk Import) süreçlerini yöneten servis sınıfı.
 * Excel dosyalarını okur (`xlsx` kütüphanesi ile), tanımlı alanlara (`IField`) göre map eder,
 * validasyonları çalıştırır ve veriyi parçalar halinde (Batch Processing) işler.
 *
 * EN: Service class managing bulk data import processes.
 * Reads Excel files (via `xlsx` library), maps them according to defined fields (`IField`),
 * runs validations, and processes data in batches.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class ImporterService {
  /**
   * TR: ImporterService sınıfını başlatır.
   *
   * EN: Initializes the ImporterService class.
   *
   * @param fields - TR: Excel sütunlarının eşleşeceği alan tanımları. / EN: Field definitions to map Excel columns.
   * @param importFn - TR: Her satır için çalıştırılacak kayıt fonksiyonu. / EN: Save function to be executed for each row.
   * @param batchSize - TR: Aynı anda işlenecek satır sayısı (Varsayılan: 10). / EN: Number of rows to process simultaneously (Default: 10).
   */
  constructor(
    private fields: IField<unknown>[],
    private importFn: ImportFn,
    private batchSize = 10
  ) {}

  /**
   * TR: Yeni bir içe aktarım oturumu (State) oluşturur.
   * Bu state, UI bileşenine (Component) bağlanarak süreci reaktif hale getirir.
   *
   * EN: Creates a new import session (State).
   * This state makes the process reactive by binding to the UI component.
   *
   * @returns TR: Yönetilebilir importer durumu. / EN: Manageable importer state.
   */
  create(): ImporterState {
    const rows = signal<ImportRow[]>([]);
    const status = signal<ImporterState['status']['arguments']>('idle');
    const error = signal<string | null>(null);

    // TR: İstatistiklerin hesaplanması (Computed Signal)
    // EN: Calculation of statistics (Computed Signal)
    const stats = computed(() => {
      const all = rows();
      const total = all.length;
      const pending = all.filter((r) => r._status === 'pending').length;
      const imported = all.filter((r) => r._status === 'imported').length;
      const errorCount = all.filter((r) => r._status === 'error').length;
      // TR: Tamamlanan + Hatalı / Toplam = Yüzde
      // EN: Completed + Error / Total = Percent
      const percent = total > 0 ? Math.round(((imported + errorCount) / total) * 100) : 0;

      return { total, pending, imported, error: errorCount, percent };
    });

    // TR: Dosya okuma fonksiyonu
    // EN: File reading function
    const readFile = async (file: File) => {
      status.set('reading');
      error.set(null);

      try {
        const data = await this.parseExcel(file);
        const parsed = this.mapToRows(data);
        rows.set(parsed);
        status.set('ready');
      } catch (e) {
        error.set(e instanceof Error ? e.message : 'Dosya okunamadı');
        status.set('idle');
      }
    };

    // TR: İşlemi başlatma fonksiyonu (Batch Processing)
    // EN: Start process function (Batch Processing)
    const start = async () => {
      status.set('importing');

      const pending = rows().filter((r) => r._status === 'pending');
      // TR: Veriyi küçük parçalara (chunk) böl
      // EN: Split data into small chunks
      const batches = this.chunk(pending, this.batchSize);

      for (const batch of batches) {
        // TR: Duraklatma kontrolü
        // EN: Pause check
        if (status() === 'paused') return;

        // TR: Batch içindeki satırları paralel işle
        // EN: Process rows in batch in parallel
        await Promise.all(
          batch.map(async (row) => {
            await this.importRow(row, rows);
          })
        );
      }

      status.set('completed');
    };

    // TR: Duraklatma fonksiyonu
    // EN: Pause function
    const pause = () => {
      if (status() === 'importing') {
        status.set('paused');
      }
    };

    // TR: Sıfırlama fonksiyonu
    // EN: Reset function
    const reset = () => {
      rows.set([]);
      status.set('idle');
      error.set(null);
    };

    // TR: Şablon indirme fonksiyonu
    // EN: Template download function
    const downloadTemplate = (filename: string) => {
      const headers = this.fields.map((f) => f.label);
      const ws = XLSX.utils.aoa_to_sheet([headers]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    return { rows, status, error, stats, readFile, start, pause, reset, downloadTemplate };
  }

  /**
   * TR: Excel dosyasını tarayıcıda okur ve ham JSON array dizisine çevirir.
   * `FileReader` ve `XLSX` kütüphanesini kullanır.
   *
   * EN: Reads the Excel file in the browser and converts it to a raw JSON array.
   * Uses `FileReader` and `XLSX` library.
   *
   * @param file - TR: Yüklenen dosya. / EN: Uploaded file.
   * @returns TR: Satır verileri dizisi. / EN: Array of row data.
   */
  private async parseExcel(file: File): Promise<unknown[][]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array', cellDates: true });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false }) as unknown[][];
          // TR: İlk satır başlık (Header) olduğu için atla
          // EN: Skip the first row as it is the Header
          resolve(json.slice(1));
        } catch (err) {
          reject(new Error('Excel dosyası okunamadı'));
        }
      };

      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * TR: Ham Excel verilerini `ImportRow` nesnelerine dönüştürür.
   * Her sütunu ilgili `Field` tanımıyla eşleştirir (`fromImport`).
   * Bu aşamada Zod şeması ile validasyon yapılır ve hatalı satırlar işaretlenir.
   *
   * EN: Converts raw Excel data into `ImportRow` objects.
   * Maps each column to the corresponding `Field` definition (`fromImport`).
   * At this stage, validation is performed with the Zod schema and erroneous rows are marked.
   *
   * @param data - TR: Ham veri dizisi. / EN: Raw data array.
   * @returns TR: İşlenmiş satırlar. / EN: Processed rows.
   */
  private mapToRows(data: unknown[][]): ImportRow[] {
    return data.map((row, index) => {
      const mapped: ImportRow = {
        _line: index + 2, // TR: Excel satır no (header + 0-index) / EN: Excel row no (header + 0-index)
        _status: 'pending',
      };

      // TR: Her field için değer ata ve parse et
      // EN: Assign and parse value for each field
      this.fields.forEach((field, colIndex) => {
        const raw = row[colIndex];
        const parsed = field.fromImport(raw);
        mapped[field.name] = parsed;

        // TR: Validasyon kontrolü (Hatalıysa status 'error' olur)
        // EN: Validation check (Status becomes 'error' if invalid)
        const result = field.schema().safeParse(parsed);
        if (!result.success && mapped._status === 'pending') {
          mapped._status = 'error';
          mapped._error = `${field.label}: ${result.error.errors[0]?.message}`;
        }
      });

      return mapped;
    });
  }

  /**
   * TR: Tek bir satırı sunucuya veya veritabanına kaydeder.
   * İşlem durumunu (importing -> imported/error) anlık olarak günceller.
   * Duplicate kontrolü için satır verisinin Hash'ini oluşturur.
   *
   * EN: Saves a single row to the server or database.
   * Instantly updates the processing status (importing -> imported/error).
   * Generates a Hash of the row data for duplicate checking.
   */
  private async importRow(row: ImportRow, rows: WritableSignal<ImportRow[]>) {
    // TR: State güncelleme yardımcısı
    // EN: State update helper
    const updateRow = (updates: Partial<ImportRow>) => {
      rows.update((all) =>
        all.map((r) => (r._line === row._line ? { ...r, ...updates } : r))
      );
    };

    updateRow({ _status: 'importing' });

    try {
      // TR: Row'dan sadece field değerlerini al (Meta verileri temizle)
      // EN: Get only field values from Row (Clean metadata)
      const data: Record<string, unknown> = {};
      for (const field of this.fields) {
        data[field.name] = row[field.name];
      }

      // TR: Hash oluştur (duplicate kontrolü için)
      // EN: Create hash (for duplicate check)
      const hash = this.simpleHash(JSON.stringify(data));

      await this.importFn(data, hash);
      updateRow({ _status: 'imported', _error: undefined });
    } catch (e) {
      updateRow({
        _status: 'error',
        _error: e instanceof Error ? e.message : 'Import hatası',
      });
    }
  }

  /**
   * TR: Verinin hash'ini oluşturur (duplicate kontrolü için).
   * FNV-1a hash algoritması kullanarak collision riskini minimize eder.
   *
   * EN: Generates hash of data (for duplicate checking).
   * Uses FNV-1a hash algorithm to minimize collision risk.
   */
  private simpleHash(str: string): string {
    if (str.length === 0) return EMPTY_HASH;
    
    // FNV-1a hash (better distribution than simple hash)
    let hash = FNV_OFFSET_BASIS;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, FNV_PRIME);
    }
    
    // Convert to positive hex string
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  /**
   * TR: Büyük bir diziyi belirtilen boyutta küçük parçalara böler.
   *
   * EN: Splits a large array into smaller chunks of specified size.
   */
  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}