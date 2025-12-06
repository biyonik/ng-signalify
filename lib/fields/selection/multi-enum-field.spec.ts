import { MultiEnumField } from './multi-enum-field';

describe('MultiEnumField (Expert)', () => {
    let field: MultiEnumField;
    const options = [
        { id: 1, label: 'Elma', group: 'Meyve' },
        { id: 2, label: 'Armut', group: 'Meyve' },
        { id: 3, label: 'Ispanak', group: 'Sebze', disabled: true }, // Seçilemez!
        { id: 4, label: 'Pırasa', group: 'Sebze' }
    ];

    beforeEach(() => {
        field = new MultiEnumField('preferences', 'Tercihler', options, {
            min: 1,
            max: 2,
            required: true
        });
    });

    it('should enforce Min/Max selection limits', () => {
        const state = field.createValue();

        // 1. Min Hatası (Boş array)
        state.value.set([]);
        state.touched.set(true);
        expect(state.valid()).toBe(false);
        expect(state.error()).toContain('en az 1'); // Required veya Min mesajı

        // 2. Max Hatası (3 seçim, sınır 2)
        state.value.set([1, 2, 4]);
        expect(state.valid()).toBe(false);
        expect(state.error()).toContain('en fazla 2');

        // 3. Geçerli Seçim
        state.value.set([1, 4]);
        expect(state.valid()).toBe(true);
    });

    it('should REJECT disabled options (Business Logic)', () => {
        const state = field.createValue();

        // ID: 3 (Ispanak) disabled durumda
        state.value.set([3]);
        state.touched.set(true);

        expect(state.valid()).toBe(false);
        // Schema içinde validIds filtresi disabled olanları elediği için
        // bu değer "geçersiz seçenek" olarak işaretlenmeli
    });

    it('should parse CSV strings in Import (Excel/CSV Support)', () => {
        // 1. ID bazlı CSV
        const rawIds = "1, 4";
        const resultIds = field.fromImport(rawIds);
        expect(resultIds).toEqual([1, 4]);

        // 2. Label bazlı CSV (Case insensitive)
        const rawLabels = "elma, armut"; // Küçük harf
        const resultLabels = field.fromImport(rawLabels);
        expect(resultLabels).toEqual([1, 2]);

        // 3. Karışık ve Hatalı Veri
        const mixed = "Elma, Uzaylı, 4"; // Uzaylı yok
        const resultMixed = field.fromImport(mixed);
        expect(resultMixed).toEqual([1, 4]); // Sadece geçerlileri almalı
    });

    it('should handle helper methods (Grouping & Toggling)', () => {
        // Grouping
        const groups = field.getGroupedOptions();
        expect(groups.get('Meyve')?.length).toBe(2);
        expect(groups.get('Sebze')?.length).toBe(2);

        // Toggling
        let selection: (string | number)[] = [1];
        // Varsa çıkar
        selection = field.toggleSelection(selection, 1);
        expect(selection).toEqual([]);
        // Yoksa ekle
        selection = field.toggleSelection(selection, 2);
        expect(selection).toEqual([2]);
    });

    it('should handle Select All (excluding disabled)', () => {
        const all = field.selectAll();
        // 1, 2, 4 gelmeli. 3 (disabled) gelmemeli.
        expect(all).toContain(1);
        expect(all).toContain(4);
        expect(all).not.toContain(3);
    });

    it('should export labels joined by comma', () => {
        expect(field.toExport([1, 2])).toBe('Elma, Armut');
        expect(field.toExport([])).toBe('-');
    });
});