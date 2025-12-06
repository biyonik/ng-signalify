import { JsonField } from './json-field';
import { z } from 'zod';

describe('JsonField (Complex)', () => {
    let field: JsonField;

    beforeEach(() => {
        field = new JsonField('settings', 'Ayarlar', {
            required: true,
            prettyPrint: true,
            // Opsiyonel şema
            schema: z.object({ theme: z.string(), version: z.number() })
        });
    });

    it('should validate against custom schema', () => {
        const state = field.createValue();

        // 1. Geçerli Veri
        state.value.set({ theme: 'dark', version: 1 });
        expect(state.valid()).toBe(true);

        // 2. Geçersiz Veri (Tip hatası)
        state.value.set({ theme: 'dark', version: '1' } as any);
        state.touched.set(true);
        expect(state.valid()).toBe(false);
        expect(state.error()).toBeTruthy();
    });

    it('should format presentation (Pretty Print)', () => {
        const data = { a: 1 };
        const text = field.present(data);

        // Pretty print varsa newline karakteri içermeli
        expect(text).toContain('\n');
        expect(text).toContain('"a": 1');
    });

    it('should handle import logic (String or Object)', () => {
        // 1. JSON String
        const jsonStr = '{"a": 1}';
        expect(field.fromImport(jsonStr)).toEqual({ a: 1 });

        // 2. Direct Object
        expect(field.fromImport({ b: 2 })).toEqual({ b: 2 });

        // 3. Array (Reddedilmeli, sadece {} kabul ediyoruz)
        expect(field.fromImport('[1, 2]')).toBeNull();
    });

    it('should access deep properties via dot notation (getValue)', () => {
        const data = { user: { address: { city: 'Istanbul' } } };

        expect(field.getValue(data, 'user.address.city')).toBe('Istanbul');
        expect(field.getValue(data, 'user.name')).toBeUndefined();
    });

    it('should update deep properties immutably (setValue)', () => {
        const data = { user: { name: 'Ahmet' } };
        const newData = field.setValue(data, 'user.age', 30);

        // Yeni veri güncellenmiş olmalı
        expect((newData as any).user.age).toBe(30);
        // Eski veri değişmemiş olmalı (Immutability)
        expect((data as any).user.age).toBeUndefined();
        // Referans farkı
        expect(newData).not.toBe(data);
    });
});