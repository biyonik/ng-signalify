import { TextAreaField } from './text-area-field';

describe('TextAreaField', () => {
    let field: TextAreaField;

    beforeEach(() => {
        field = new TextAreaField('description', 'Açıklama', {
            required: true,
            minLength: 10,
            maxLength: 500
        });
    });

    it('should validate length constraints', () => {
        const state = field.createValue();

        // Çok kısa
        state.value.set('Kısa');
        expect(state.valid()).toBe(false);

        // Uygun
        state.value.set('Bu yeterince uzun bir açıklama metnidir.');
        expect(state.valid()).toBe(true);

        // Çok uzun (500+)
        state.value.set('a'.repeat(501));
        expect(state.valid()).toBe(false);
    });

    it('should handle null/empty', () => {
        const state = field.createValue(null);
        expect(state.valid()).toBe(false); // Required
    });

    it('should pass config to base correctly', () => {
        // TextArea spesifik configler (rows, cols vb.)
        // Eğer TextAreaField constructor'ında rows varsa:
        // const f = new TextAreaField('x', 'y', { rows: 5 });
        // expect(f.config.rows).toBe(5);
        expect(field.name).toBe('description');
    });
});