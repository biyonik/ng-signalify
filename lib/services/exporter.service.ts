import { IField } from '../fields';
import * as XLSX from 'xlsx';

/**
 * TR: Veri dışa aktarım işlemleri için yapılandırma seçenekleri.
 * Dosya adı, sayfa ismi ve formatlama tercihlerini içerir.
 *
 * EN: Configuration options for data export operations.
 * Includes filename, sheet name, and formatting preferences.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface ExportOptions {
  /**
   * TR: İndirilecek dosyanın adı (uzantı hariç).
   *
   * EN: Name of the file to be downloaded (excluding extension).
   */
  filename: string;

  /**
   * TR: Excel çalışma sayfası (Worksheet) adı.
   * Varsayılan: 'Data'.
   *
   * EN: Excel worksheet name.
   * Default: 'Data'.
   */
  sheetName?: string;

  /**
   * TR: Tarih alanları için kullanılacak format stringi.
   *
   * EN: Format string to be used for date fields.
   */
  dateFormat?: string;
}

/**
 * TR: Veri setlerini farklı formatlarda (Excel, CSV, JSON) dışa aktaran servis sınıfı.
 * Alan tanımlarını (`IField`) kullanarak veriyi ham haliyle değil, kullanıcı dostu formatlanmış haliyle (`toExport`) dışa aktarır.
 * Excel sütun genişliklerini otomatik ayarlar ve CSV için UTF-8 uyumluluğunu sağlar.
 *
 * EN: Service class exporting datasets in different formats (Excel, CSV, JSON).
 * Uses field definitions (`IField`) to export data in a user-friendly formatted state (`toExport`), not raw.
 * Auto-adjusts Excel column widths and ensures UTF-8 compatibility for CSV.
 *
 * @author Ahmet ALTUN
 * @github  github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export class ExporterService {
  /**
   * TR: ExporterService sınıfını başlatır.
   *
   * EN: Initializes the ExporterService class.
   *
   * @param fields - TR: Dışa aktarılacak alanların tanımları. / EN: Definitions of fields to be exported.
   */
  constructor(private fields: IField<unknown>[]) {}

  /**
   * TR: Veriyi Excel (.xlsx) formatında tarayıcı üzerinden indirir.
   * `field.toExport()` metodunu kullanarak verileri dönüştürür.
   * Sütun genişliklerini içeriğe veya başlığa göre otomatik ayarlar.
   *
   * EN: Downloads data in Excel (.xlsx) format via the browser.
   * Transforms data using the `field.toExport()` method.
   * Automatically adjusts column widths based on content or header.
   *
   * @param data - TR: Dışa aktarılacak veri listesi. / EN: List of data to be exported.
   * @param options - TR: Export ayarları. / EN: Export settings.
   */
  export(data: Record<string, unknown>[], options: ExportOptions): void {
    const { filename, sheetName = 'Data' } = options;

    // TR: Başlıkları oluştur
    // EN: Generate headers
    const headers = this.fields.map((f) => f.label);

    // TR: Satırları işle ve formatla
    // EN: Process and format rows
    const rows = data.map((item) => {
      return this.fields.map((field) => {
        const value = item[field.name];
        return field.toExport(value);
      });
    });

    // TR: Sheet oluştur (Başlık + Veri)
    // EN: Create Sheet (Header + Data)
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // TR: Kolon genişliklerini ayarla (En az 15 karakter)
    // EN: Set column widths (Minimum 15 characters)
    ws['!cols'] = this.fields.map((f) => ({
      wch: Math.max(f.label.length, 15),
    }));

    // TR: Workbook oluştur ve sheet'i ekle
    // EN: Create Workbook and append sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // TR: Dosyayı indir (Dosya adına zaman damgası eklenir)
    // EN: Download file (Timestamp added to filename)
    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
  }

  /**
   * TR: Veriyi CSV (.csv) formatında indirir.
   * Excel'in Türkçe karakterleri doğru göstermesi için dosya başına BOM (\ufeff) ekler.
   * Özel karakter içeren (virgül, tırnak) verileri RFC 4180 standardına göre escape eder.
   *
   * EN: Downloads data in CSV (.csv) format.
   * Adds BOM (\ufeff) to the beginning of the file for Excel to display characters correctly.
   * Escapes data containing special characters (comma, quote) according to RFC 4180 standard.
   */
  exportCsv(data: Record<string, unknown>[], options: ExportOptions): void {
    const { filename } = options;

    // Header
    const headers = this.fields.map((f) => f.label);

    // Rows
    const rows = data.map((item) => {
      return this.fields.map((field) => {
        const value = field.toExport(item[field.name]);
        
        // TR: CSV escape işlemi (Virgül veya tırnak içeriyorsa tırnak içine al)
        // EN: CSV escape operation (Quote if it contains comma or quote)
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
    });

    // TR: CSV içeriğini oluştur
    // EN: Build CSV content
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    // TR: Blob oluştur ve indir (BOM eklemesi önemli)
    // EN: Create Blob and download (BOM addition is important)
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * TR: Veriyi JSON (.json) formatında indirir.
   * Veriler ham haliyle değil, `toExport` dönüşümü yapılmış haliyle kaydedilir.
   *
   * EN: Downloads data in JSON (.json) format.
   * Data is saved in `toExport` transformed state, not raw.
   */
  exportJson(data: Record<string, unknown>[], options: ExportOptions): void {
    const { filename } = options;

    // TR: Her satırı field.toExport ile dönüştür
    // EN: Transform each row with field.toExport
    const transformed = data.map((item) => {
      const result: Record<string, unknown> = {};
      for (const field of this.fields) {
        result[field.name] = field.toExport(item[field.name]);
      }
      return result;
    });

    const json = JSON.stringify(transformed, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * TR: Tablo görünümleri için sütun başlıklarını döndürür.
   *
   * EN: Returns column headers for table views.
   */
  getHeaders(): { name: string; label: string }[] {
    return this.fields.map((f) => ({ name: f.name, label: f.label }));
  }

  /**
   * TR: Tek bir veri satırını, UI tablosunda gösterilmek üzere formatlar (`present` metodunu kullanır).
   * Export işleminden farklı olarak, buradaki amaç insan okuması için (Human Readable) çıktı üretmektir.
   *
   * EN: Formats a single data row for display in a UI table (uses `present` method).
   * Unlike export, the goal here is to produce Human Readable output.
   *
   * @param item - TR: Ham veri satırı. / EN: Raw data row.
   * @returns TR: Formatlanmış değerler. / EN: Formatted values.
   */
  presentRow(item: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const field of this.fields) {
      result[field.name] = field.present(item[field.name]);
    }
    return result;
  }
}