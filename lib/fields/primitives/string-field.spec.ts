import { StringField } from './string-field';

describe('StringField', () => {
    describe('schema', () => {
        it('zorunlu alan için boş değer reddedilmeli', () => {
            const field = new StringField('name', 'Ad', { required: true });
            const schema = field.schema();

            const result = schema.safeParse('');
            expect(result.success).toBe(false);
        });

        it('minimum karakter sayısı kontrolü yapılmalı', () => {
            const field = new StringField('name', 'Ad', { min: 3 });
            const schema = field.schema();

            expect(schema.safeParse('ab').success).toBe(false);
            expect(schema.safeParse('abc').success).toBe(true);
        });

        it('maksimum karakter sayısı kontrolü yapılmalı', () => {
            const field = new StringField('name', 'Ad', { max: 5 });
            const schema = field.schema();

            expect(schema.safeParse('abcdef').success).toBe(false);
            expect(schema.safeParse('abcde').success).toBe(true);
        });

        it('email formatı doğrulanmalı', () => {
            const field = new StringField('email', 'E-posta', { email: true });
            const schema = field.schema();

            expect(schema.safeParse('invalid').success).toBe(false);
            expect(schema.safeParse('test@example.com').success).toBe(true);
        });

        it('URL formatı doğrulanmalı', () => {
            const field = new StringField('website', 'Website', { url: true });
            const schema = field.schema();

            expect(schema.safeParse('not-a-url').success).toBe(false);
            expect(schema.safeParse('https://example.com').success).toBe(true);
        });

        it('regex pattern kontrolü yapılmalı', () => {
            const field = new StringField('code', 'Kod', { regex: /^[A-Z]{3}$/ });
            const schema = field.schema();

            expect(schema.safeParse('abc').success).toBe(false);
            expect(schema.safeParse('ABCD').success).toBe(false);
            expect(schema.safeParse('ABC').success).toBe(true);
        });

        it('opsiyonel alan null kabul etmeli', () => {
            const field = new StringField('name', 'Ad', { required: false });
            const schema = field.schema();

            expect(schema.safeParse(null).success).toBe(true);
        });
    });

    describe('fromImport', () => {
        it('null ve boş string için null döndürmeli', () => {
            const field = new StringField('name', 'Ad');

            expect(field.fromImport(null)).toBeNull();
            expect(field.fromImport('')).toBeNull();
            expect(field.fromImport(undefined)).toBeNull();
        });

        it('değeri stringe çevirmeli', () => {
            const field = new StringField('name', 'Ad');

            expect(field.fromImport(123)).toBe('123');
            expect(field.fromImport(true)).toBe('true');
        });

        it('whitespace temizlenmeli (trim)', () => {
            const field = new StringField('name', 'Ad');

            expect(field.fromImport('  hello world  ')).toBe('hello world');
        });
    });

    describe('createValue', () => {
        it('başlangıç değeri ile oluşturulmalı', () => {
            const field = new StringField('name', 'Ad');
            const state = field.createValue('Test');

            expect(state.value()).toBe('Test');
        });

        it('touched başlangıçta false olmalı', () => {
            const field = new StringField('name', 'Ad');
            const state = field.createValue();

            expect(state.touched()).toBe(false);
        });

        it('valid computed doğru hesaplanmalı', () => {
            const field = new StringField('name', 'Ad', { required: true, min: 2 });
            const state = field.createValue('A');

            expect(state.valid()).toBe(false);

            state.value.set('AB');
            expect(state.valid()).toBe(true);
        });

        it('error sadece touched ise gösterilmeli', () => {
            const field = new StringField('name', 'Ad', { required: true });
            const state = field.createValue('');

            // touched değilken error null olmalı
            expect(state.error()).toBeNull();

            // touched olunca error gösterilmeli
            state.touched.set(true);
            expect(state.error()).not.toBeNull();
        });
    });
});
