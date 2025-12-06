import { StringField } from './string-field';
import { z } from 'zod';

describe('StringField (Primitive)', () => {
    let field: StringField;

    beforeEach(() => {
        field = new StringField('username', 'Kullanıcı Adı', {
            required: true,
            min: 3,
            max: 10
        });
    });

    it('should initialize with correct metadata', () => {
        // Field sınıfı sadece konfigürasyonu tutar
        expect(field.name).toBe('username');
        expect(field.label).toBe('Kullanıcı Adı');
        // getConfig public değilse veya yoksa direkt config'e erişilemeyebilir,
        // ama testte public özellikler kontrol edilir.
    });

    it('should create reactive value container', () => {
        // State (Durum) burada oluşturulur
        const fieldState = field.createValue(null);

        expect(fieldState.value()).toBeNull();
        expect(fieldState.error()).toBeNull();
    });

    it('should validate using Zod schema', () => {
        const schema = field.schema();

        // Validasyon Zod şeması üzerinden yapılır
        const validResult = schema.safeParse('ahmet');
        expect(validResult.success).toBe(true);

        const shortResult = schema.safeParse('ab'); // min: 3
        expect(shortResult.success).toBe(false);

        const emptyResult = schema.safeParse(''); // required
        expect(emptyResult.success).toBe(false);
    });

    it('should handle import transformation', () => {
        const imported = field.fromImport(12345);
        expect(imported).toBe('12345');
    });
});