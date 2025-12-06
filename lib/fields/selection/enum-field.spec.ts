import { EnumField } from './enum-field';

describe('EnumField (Expert)', () => {
    let field: EnumField;
    const options = [
        { id: 'active', label: 'Aktif' },
        { id: 'passive', label: 'Pasif' },
        { id: 101, label: 'Karmaşık ID' } // Number ID testi için
    ];

    beforeEach(() => {
        field = new EnumField('status', 'Durum', options, { required: true });
    });

    it('should validate against whitelist (Security Check)', () => {
        const state = field.createValue();

        // 1. Geçerli String ID
        state.value.set('active');
        expect(state.valid()).toBe(true);

        // 2. Geçerli Number ID
        state.value.set(101);
        expect(state.valid()).toBe(true);

        // 3. Listede Olmayan Değer (Hacker Attempt)
        state.value.set('admin'); // Whitelist dışı
        state.touched.set(true);

        expect(state.valid()).toBe(false);
        expect(state.error()).toContain('geçerli bir seçenek');
    });

    it('should present human-readable labels', () => {
        // ID -> Label dönüşümü
        expect(field.present('active')).toBe('Aktif');
        expect(field.present(101)).toBe('Karmaşık ID');

        // Bilinmeyen ID (Fallback)
        expect(field.present('unknown')).toBe('unknown');
        expect(field.present(null)).toBe('-');
    });

    it('should export Label instead of ID (User Friendly Export)', () => {
        // toExport metodunun label döndürdüğünü doğrula
        expect(field.toExport('active')).toBe('Aktif');
    });

    it('should perform Smart Import (ID or Label Matching)', () => {
        // 1. Doğrudan ID Eşleşmesi
        expect(field.fromImport('active')).toBe('active');
        expect(field.fromImport(101)).toBe(101);

        // 2. Type Coercion ID Eşleşmesi ("101" -> 101)
        expect(field.fromImport('101')).toBe(101);

        // 3. Label Eşleşmesi (En kritik özellik)
        expect(field.fromImport('Pasif')).toBe('passive');

        // 4. Case-Insensitive Label Eşleşmesi
        expect(field.fromImport('AKTIF')).toBe('active');
        expect(field.fromImport('  pasif  ')).toBe('passive'); // Trim testi

        // 5. Eşleşmeyen Veri
        expect(field.fromImport('Bilinmiyor')).toBeNull();
    });
});