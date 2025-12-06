import { ImporterService, ImportRow } from './importer.service';
import { StringField } from '../fields/primitives/string-field';
import { IntegerField } from '../fields/primitives/integer-field';
import { WritableSignal } from '@angular/core';
import * as XLSX from 'xlsx';

// Mock XLSX
jest.mock('xlsx', () => ({
    read: jest.fn(),
    utils: {
        sheet_to_json: jest.fn(),
        aoa_to_sheet: jest.fn(),
        book_new: jest.fn(() => ({})),
        book_append_sheet: jest.fn(),
    },
    writeFile: jest.fn(),
}));

describe('ImporterService (Services)', () => {
    let service: ImporterService;
    let importFn: jest.Mock;
    const fields = [
        new StringField('name', 'İsim', { required: true }),
        new IntegerField('age', 'Yaş', { min: 18 })
    ];

    beforeEach(() => {
        importFn = jest.fn().mockResolvedValue(undefined);
        service = new ImporterService(fields, importFn, 2); // Batch size 2
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize state correctly', () => {
        const state = service.create();
        expect(state.status()).toBe('idle');
        expect(state.rows().length).toBe(0);
        expect(state.error()).toBeNull();
    });

    it('should read file and parse data', async () => {
        const mockFile = new File([''], 'test.xlsx');
        const mockData = [
            ['İsim', 'Yaş'], // Header
            ['Ahmet', 25],
            ['Mehmet', 17] // Hatalı yaş
        ];

        // Mock XLSX behavior
        (XLSX.read as jest.Mock).mockReturnValue({
            Sheets: { 'Sheet1': {} },
            SheetNames: ['Sheet1']
        });
        (XLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockData);

        // FileReader Mock
        const readerMock = {
            readAsArrayBuffer: jest.fn(function(this: any) {
                // Dosya okuma başarılı simülasyonu
                this.onload({ target: { result: new ArrayBuffer(0) } });
            }),
            onload: jest.fn(),
            onerror: jest.fn()
        };
        // @ts-ignore
        global.FileReader = jest.fn(() => readerMock);

        const state = service.create();
        await state.readFile(mockFile);

        expect(state.status()).toBe('ready');
        expect(state.rows().length).toBe(2); // Header hariç 2 satır

        const rows = state.rows();
        // İlk satır (Ahmet, 25) - Valid
        expect(rows[0]['name']).toBe('Ahmet');
        expect(rows[0]['age']).toBe(25);
        expect(rows[0]._status).toBe('pending');

        // İkinci satır (Mehmet, 17) - Invalid (Min 18)
        expect(rows[1]['age']).toBe(17);
        expect(rows[1]._status).toBe('error');
        expect(rows[1]._error).toContain('18');
    });

    it('should process valid rows in batches', async () => {
        const state = service.create();

        // Test verisi hazırlama
        const mockRows: ImportRow[] = [
            { _line: 2, _status: 'pending', name: 'A', age: 20 },
            { _line: 3, _status: 'pending', name: 'B', age: 21 },
            { _line: 4, _status: 'pending', name: 'C', age: 22 },
            { _line: 5, _status: 'error', name: 'D', age: 10 } // Hatalı, işlenmemeli
        ];

        // KRİTİK DÜZELTME: rows sinyalini WritableSignal'e cast ederek set ediyoruz
        (state.rows as WritableSignal<ImportRow[]>).set(mockRows);

        await state.start();

        expect(state.status()).toBe('completed');

        // Sadece 'pending' olan 3 kayıt işlenmeli
        expect(importFn).toHaveBeenCalledTimes(3);

        // Durumlar güncellenmiş olmalı
        const finalRows = state.rows();
        expect(finalRows[0]._status).toBe('imported');
        expect(finalRows[3]._status).toBe('error'); // D hala error kalmalı
    });

    it('should handle import errors', async () => {
        const state = service.create();

        // Import fonksiyonu hata fırlatsın
        importFn.mockRejectedValueOnce(new Error('DB Error'));

        const mockRows: ImportRow[] = [
            { _line: 1, _status: 'pending', name: 'A', age: 20 }
        ];
        (state.rows as WritableSignal<ImportRow[]>).set(mockRows);

        await state.start();

        const rows = state.rows();
        expect(rows[0]._status).toBe('error');
        expect(rows[0]._error).toBe('DB Error');
        expect(state.status()).toBe('completed');
    });

    it('should download template', () => {
        const state = service.create();
        state.downloadTemplate('sablon');

        expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([['İsim', 'Yaş']]);
        expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'sablon.xlsx');
    });
});