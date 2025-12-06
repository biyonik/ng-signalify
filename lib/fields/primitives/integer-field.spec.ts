import { IntegerField } from './integer-field';

describe('IntegerField', () => {
    let field: IntegerField;

    beforeEach(() => {
        field = new IntegerField('age', 'Yaş', {
            required: true,
            min: 18,
            max: 120
        });
    });

    it('should initialize with correct metadata', () => {
        expect(field.name).toBe('age');
        expect(field.label).toBe('Yaş');
        expect(field.config.min).toBe(18);
    });

    it('should validate integer constraints', () => {
        const state = field.createValue();

        // 1. Geçerli Değer
        state.value.set(25);
        state.touched.set(true);
        expect(state.valid()).toBe(true);
        expect(state.error()).toBeNull();

        // 2. Ondalıklı Sayı Hatası (Integer Check)
        state.value.set(25.5);
        // Zod.int() ondalıklı sayıları reddeder
        expect(state.valid()).toBe(false);
        expect(state.error()).toBeTruthy();

        // 3. Min Değer Hatası
        state.value.set(10);
        expect(state.valid()).toBe(false);

        // 4. Max Değer Hatası
        state.value.set(150);
        expect(state.valid()).toBe(false);
    });

    it('should handle string input transformations in import', () => {
        // "25" -> 25 dönüşümü
        expect(field.fromImport('25')).toBe(25);

        // "25.5" -> 25 (veya null, implementasyona bağlı, genelde parseInt/Number kullanılır)
        // Eğer logic z.coerce.number().int() ise yuvarlar veya hata verir.
        // Varsayılan number parser davranışını test edelim:
        const val = field.fromImport('100');
        expect(val).toBe(100);

        // Geçersiz string
        expect(field.fromImport('abc')).toBeNull();
    });

    it('should format presentation correctly', () => {
        expect(field.present(1234)).toBe('1234'); // TR locale varsayımıyla (veya düz string)
        // Eğer özel bir formatlayıcı yoksa String(1234) döner.
        // BaseField varsayılanı:
        expect(field.present(null)).toBe('-');
    });
});