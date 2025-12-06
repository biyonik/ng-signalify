import { FormSchema } from './form-schema';
import { StringField } from '../fields/primitives/string-field';
import { IntegerField } from '../fields/primitives/integer-field';

describe('FormSchema & FormState', () => {
    const nameField = new StringField('name', 'Ad', { required: true });
    const ageField = new IntegerField('age', 'Yaş', { min: 18 });

    const schema = new FormSchema<{ name: string; age: number }>([
        nameField,
        ageField
    ]);

    let form: ReturnType<typeof schema.createForm>;

    beforeEach(() => {
        form = schema.createForm();
    });

    it('should track dirty state', () => {
        expect(form.dirty()).toBe(false);

        // Touch işlemini signal üzerinden yapıyoruz
        form.fields.name.touched.set(true);

        expect(form.dirty()).toBe(true);
    });

    it('should reset form to initial state', () => {
        form.fields.name.value.set('Mehmet');
        form.fields.name.touched.set(true);

        form.reset();

        expect(form.fields.name.value()).toBeNull();
        expect(form.fields.name.touched()).toBe(false);
        expect(form.dirty()).toBe(false);
    });

    it('should validate form validity based on fields', async () => {
        // FormState.valid, fieldların valid durumuna göre computed olarak değişir

        // 1. Geçersiz Durum
        form.fields.name.value.set(''); // Required
        form.fields.age.value.set(10);  // Min 18

        // Not: Sinyallerin senkronize olması gerekebilir.
        // FieldValue implementasyonunuzda 'valid' sinyali varsa:
        expect(form.valid()).toBe(false);

        // 2. Geçerli Durum
        form.fields.name.value.set('Ahmet');
        form.fields.age.value.set(20);

        await form.validateAll();

        expect(form.valid()).toBe(true);
    });
});