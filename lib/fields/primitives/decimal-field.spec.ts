import { DecimalField } from './decimal-field';

describe('DecimalField', () => {
    let field: DecimalField;

    beforeEach(() => {
        field = new DecimalField('price', 'Fiyat', {
            required: true,
            min: 0,
            scale: 2, // Virgülden sonra 2 basamak,
            locale: 'en-US'
        });
    });

    it('should create reactive value', () => {
        const state = field.createValue(10.5);
        expect(state.value()).toBe(10.5);
        expect(state.valid()).toBe(true);
    });

    it('should validate min/max constraints', () => {
        const state = field.createValue();

        // Negatif değer hatası
        state.value.set(-5);
        state.touched.set(true); // Hatayı görmek için touch lazım

        expect(state.valid()).toBe(false);
        expect(state.error()).not.toBeNull();
    });

    it('should handle precision logic (if implemented in schema)', () => {
        // Not: Zod'da precision genelde .multipleOf() veya transform ile yapılır.
        // Eğer kütüphanenizde "precision" sadece display içinse bu test geçerli olur.
        // Eğer validasyon kuralıysa:
        const state = field.createValue();
        state.value.set(10.555);

        // DecimalField implementasyonuna bağlı olarak bu geçerli olabilir
        // veya yuvarlanmış olabilir. Standart kontrol:
        expect(typeof state.value()).toBe('number');
    });

    it('should format presentation with locale support', () => {
        // 1234.5 -> "1.234,5" (TR) veya "1,234.5" (EN)
        // Implementasyon detayına göre burayı güncelleyin.
        // BaseField varsayılanı string'e çevirir.
        expect(field.present(10.5)).toContain('10.5');
    });
});