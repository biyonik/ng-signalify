import { BooleanField } from './boolean-field';

describe('BooleanField', () => {
    let field: BooleanField;

    beforeEach(() => {
        field = new BooleanField('isActive', 'Aktif mi?', {
            required: true // Boolean'da required genellikle true/false olmasıdır, null olmamasıdır.
        });
    });

    it('should validate boolean values', () => {
        const state = field.createValue();

        state.value.set(true);
        expect(state.valid()).toBe(true);

        state.value.set(false);
        expect(state.valid()).toBe(true);
    });

    it('should handle import transformations', () => {
        // String "true" -> true dönüşümü
        expect(field.fromImport('true')).toBe(true);
        expect(field.fromImport('True')).toBe(true);
        expect(field.fromImport('1')).toBe(true);

        // String "false" -> false dönüşümü
        expect(field.fromImport('false')).toBe(false);
        expect(field.fromImport('0')).toBe(false);

        // Geçersiz
        expect(field.fromImport('random')).toBeNull();
    });

    it('should present human readable labels', () => {
        // BooleanField genelde "Evet/Hayır" veya "Aktif/Pasif" döner
        // Varsayılan BaseField davranışı "true"/"false" stringidir.
        // Eğer override edildiyse (örn: check icon) ona göre test yazılır.

        expect(field.present(true)).toBeTruthy();
        expect(field.present(null)).toBe('-');
    });
});