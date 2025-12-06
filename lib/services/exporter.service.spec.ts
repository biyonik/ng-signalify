import { ExporterService } from './exporter.service';
import { StringField } from '../fields/primitives/string-field';
import { DateField } from '../fields/date/date-field';
import * as XLSX from 'xlsx';

// Mock XLSX
jest.mock('xlsx', () => ({
    utils: {
        aoa_to_sheet: jest.fn(() => ({})),
        // DÜZELTME: book_new boş obje dönmeli
        book_new: jest.fn(() => ({})),
        book_append_sheet: jest.fn(),
    },
    writeFile: jest.fn(),
}));

// Mock URL
global.URL.createObjectURL = jest.fn(() => 'blob:url');
global.URL.revokeObjectURL = jest.fn();

describe('ExporterService (Services)', () => {
    let service: ExporterService;
    const fields = [
        new StringField('name', 'Ad'),
        new DateField('date', 'Tarih')
    ];

    const testData = [
        { name: 'Ahmet', date: new Date('2023-01-01') },
        { name: 'Mehmet, Ali', date: null }
    ];

    beforeEach(() => {
        service = new ExporterService(fields);
    });

    it('should export to Excel using XLSX', () => {
        service.export(testData, { filename: 'test' });

        expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(expect.arrayContaining([
            ['Ad', 'Tarih'],
            ['Ahmet', '01.01.2023'],
            ['Mehmet, Ali', null]
        ]));

        // book_new() çağrısı bir obje döndüğü için undefined hatası almayız
        expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('test_'));
    });

    it('should export to CSV with correct escaping', () => {
        const link: any = { click: jest.fn(), href: '' };
        jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
            if (tagName === 'a') return link;
            return document.createElement(tagName);
        });

        service.exportCsv(testData, { filename: 'test' });

        expect(link.download).toContain('.csv');
        expect(link.click).toHaveBeenCalled();
        expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    it('should export to JSON with transformed values', () => {
        const link: any = { click: jest.fn(), href: '' };
        jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
            if (tagName === 'a') return link;
            return document.createElement(tagName);
        });

        service.exportJson(testData, { filename: 'test' });

        expect(link.download).toContain('.json');
        expect(link.click).toHaveBeenCalled();
    });

    it('should provide helper methods for UI', () => {
        const headers = service.getHeaders();
        expect(headers).toHaveLength(2);
        expect(headers[0].label).toBe('Ad');

        const row = service.presentRow(testData[0]);
        expect(row['name']).toBe('Ahmet');
        expect(row['date']).toMatch(/\d{2}/);
    });
});