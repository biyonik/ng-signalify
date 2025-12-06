import { RelationField } from './relation-field';

describe('RelationField (Expert)', () => {
    let field: RelationField;

    // Mock fetch function
    const mockFetch = jest.fn();

    beforeEach(() => {
        field = new RelationField('manager', 'Yönetici', mockFetch, {
            required: true,
            viewUrl: '/users'
        });
    });

    it('should validate complete RelationRef object', () => {
        const state = field.createValue();

        // 1. Tam Obje
        state.value.set({ id: 123, label: 'Ahmet Yılmaz' });
        expect(state.valid()).toBe(true);

        // 2. Eksik Obje (Label yok)
        // TypeScript tip güvenliğinde bunu engelleriz ama runtime'da gelebilir
        state.value.set({ id: 123 } as any);
        state.touched.set(true);
        expect(state.valid()).toBe(false); // Schema {id, label} zorunlu kılıyor
    });

    it('should export ONLY ID (Foreign Key Logic)', () => {
        const val = { id: 999, label: 'Dış İlişki' };

        // UI'da obje görüyoruz ama API'ye ID gidiyor
        expect(field.toExport(val)).toBe(999);
        expect(field.toExport(null)).toBeNull();
    });

    it('should handle partial import (ID Only)', () => {
        // Excel'den sadece "105" gelir, isim gelmez.
        const rawId = 105;
        const imported = field.fromImport(rawId);

        // Beklenen: { id: 105, label: '' }
        // Label boş gelir çünkü lookup yapamayız (Async işlem gerekir)
        expect(imported).toEqual({ id: 105, label: '' });
    });

    it('should generate View URL correctly', () => {
        const val = { id: 55, label: 'Test' };

        // Config'deki viewUrl + ID
        expect(field.getViewUrl(val)).toBe('/users/55');

        // Null kontrolü
        expect(field.getViewUrl(null)).toBeNull();
    });
});