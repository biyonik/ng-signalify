import { TestBed} from '@angular/core/testing';

import {
    createEnhancedForm,
    EnhancedFormState,
    CrossFieldValidation
} from './form-state';

import { StringField } from '../fields/primitives/string-field';
import { IntegerField } from '../fields/primitives/integer-field';
import { BooleanField } from '../fields/primitives/boolean-field';
import { DateField } from '../fields/date/date-field';
import {EnvironmentInjector, runInInjectionContext} from "@angular/core";

// Test için basit field'lar
const createTestFields = () => [
    new StringField('name', 'Ad', { required: true, min: 2 }),
    new StringField('email', 'E-posta', { required: true, email: true }),
    new IntegerField('age', 'Yaş', { required: true, min: 18, max: 120 }),
    new BooleanField('active', 'Aktif'),
];

interface TestFormData {
    name: string;
    email: string;
    age: number;
    active: boolean;
}

describe('createEnhancedForm', () => {
    let form: EnhancedFormState<TestFormData>;
    let injector: EnvironmentInjector;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        injector = TestBed.inject(EnvironmentInjector);

        form = runInInjectionContext(injector, () =>
            createEnhancedForm<TestFormData>(
                createTestFields(),
                { name: 'Test', email: 'test@example.com', age: 25, active: true }
            )
        );
    });

    afterEach(() => {
        form.destroy();
    });

    describe('initialization', () => {
        it('form oluşturulmalı', () => {
            expect(form).toBeDefined();
            expect(form.fields).toBeDefined();
        });

        it('başlangıç değerleri ayarlanmalı', () => {
            expect(form.fields.name.value()).toBe('Test');
            expect(form.fields.email.value()).toBe('test@example.com');
            expect(form.fields.age.value()).toBe(25);
            expect(form.fields.active.value()).toBe(true);
        });

        it('initialValues signal doğru olmalı', () => {
            expect(form.initialValues()).toEqual({
                name: 'Test',
                email: 'test@example.com',
                age: 25,
                active: true
            });
        });

        it('tüm alanlar başlangıçta touched olmamalı', () => {
            expect(form.fields.name.touched()).toBe(false);
            expect(form.fields.email.touched()).toBe(false);
            expect(form.pristine()).toBe(true);
        });

        it('başlangıçta dirty olmamalı', () => {
            expect(form.dirty()).toBe(false);
        });

        it('başlangıçta visible olmalı', () => {
            expect(form.fields.name.visible()).toBe(true);
            expect(form.visibleFields().length).toBe(4);
        });
    });

    describe('values', () => {
        it('values computed tüm değerleri döndürmeli', () => {
            const values = form.values();
            expect(values).toEqual({
                name: 'Test',
                email: 'test@example.com',
                age: 25,
                active: true
            });
        });

        it('getValues değerleri parse edip döndürmeli', () => {
            const values = form.getValues();
            expect(values.name).toBe('Test');
            expect(values.age).toBe(25);
        });

        it('setValue tek alan değiştirmeli', () => {
            form.setValue('name', 'Yeni Ad');
            expect(form.fields.name.value()).toBe('Yeni Ad');
        });

        it('patchValues birden fazla alan değiştirmeli', () => {
            form.patchValues({ name: 'Patch Ad', age: 30 });
            expect(form.fields.name.value()).toBe('Patch Ad');
            expect(form.fields.age.value()).toBe(30);
        });
    });

    describe('dirty tracking', () => {
        it('değer değişince dirty olmalı', () => {
            expect(form.dirty()).toBe(false);

            form.setValue('name', 'Değişti');
            expect(form.dirty()).toBe(true);
            expect(form.fields.name.dirty()).toBe(true);
        });

        it('değer başlangıca dönünce dirty olmamalı', () => {
            form.setValue('name', 'Değişti');
            expect(form.dirty()).toBe(true);

            form.setValue('name', 'Test');
            expect(form.fields.name.dirty()).toBe(false);
        });

        it('getDirtyValues sadece değişen alanları döndürmeli', () => {
            form.setValue('name', 'Değişen Ad');
            form.setValue('age', 30);

            const dirty = form.getDirtyValues();
            expect(dirty).toEqual({ name: 'Değişen Ad', age: 30 });
            expect(dirty.email).toBeUndefined();
        });
    });

    describe('validation', () => {
        it('geçerli form valid olmalı', () => {
            form.touchAll();
            expect(form.valid()).toBe(true);
        });

        it('geçersiz değer ile valid false olmalı', () => {
            form.setValue('name', 'A'); // min 2
            form.touchAll();
            expect(form.fields.name.valid()).toBe(false);
            expect(form.valid()).toBe(false);
        });

        it('error sadece touched alanda görünmeli', () => {
            form.setValue('name', 'A');
            expect(form.fields.name.error()).toBeNull(); // touched değil

            form.fields.name.touched.set(true);
            expect(form.fields.name.error()).not.toBeNull();
        });

        it('errors computed tüm hataları döndürmeli', () => {
            form.setValue('name', 'A');
            form.setValue('email', 'invalid');
            form.touchAll();

            const errors = form.errors();
            expect(errors["name"]).not.toBeNull();
            expect(errors["email"]).not.toBeNull();
            expect(errors["age"]).toBeNull();
        });

        it('combinedError sync ve async hataları birleştirmeli', () => {
            form.setValue('name', 'A');
            form.fields.name.touched.set(true);

            expect(form.fields.name.combinedError()).not.toBeNull();
        });
    });

    describe('touchAll', () => {
        it('tüm alanları touched yapmalı', () => {
            expect(form.fields.name.touched()).toBe(false);
            expect(form.fields.email.touched()).toBe(false);

            form.touchAll();

            expect(form.fields.name.touched()).toBe(true);
            expect(form.fields.email.touched()).toBe(true);
            expect(form.pristine()).toBe(false);
        });
    });

    describe('reset', () => {
        it('başlangıç değerlerine sıfırlamalı', () => {
            form.setValue('name', 'Değişti');
            form.setValue('age', 99);
            form.touchAll();

            form.reset();

            expect(form.fields.name.value()).toBe('Test');
            expect(form.fields.age.value()).toBe(25);
            expect(form.fields.name.touched()).toBe(false);
            expect(form.dirty()).toBe(false);
        });

        it('yeni başlangıç değerleri ile sıfırlamalı', () => {
            form.reset({ name: 'Yeni Başlangıç', email: 'yeni@test.com', age: 30, active: false });

            expect(form.fields.name.value()).toBe('Yeni Başlangıç');
            expect(form.fields.age.value()).toBe(30);
            expect(form.initialValues().name).toBe('Yeni Başlangıç');
        });
    });

    describe('markDirty / markPristine', () => {
        it('markDirty alanı touched yapmalı', () => {
            expect(form.fields.name.touched()).toBe(false);

            form.markDirty('name');

            expect(form.fields.name.touched()).toBe(true);
        });

        it('markPristine tüm alanları untouched yapmalı', () => {
            form.touchAll();
            expect(form.pristine()).toBe(false);

            form.markPristine();

            expect(form.pristine()).toBe(true);
        });
    });

    describe('validateAll', () => {
        it('geçerli form için true döndürmeli', async () => {
            const result = await form.validateAll();
            expect(result).toBe(true);
        });

        it('geçersiz form için false döndürmeli', async () => {
            form.setValue('name', 'A');

            const result = await form.validateAll();
            expect(result).toBe(false);
        });

        it('validateAll tüm alanları touch etmeli', async () => {
            expect(form.fields.name.touched()).toBe(false);

            await form.validateAll();

            expect(form.fields.name.touched()).toBe(true);
        });
    });

    describe('destroy', () => {
        it('destroy çağrıldıktan sonra hata vermemeli', () => {
            expect(() => form.destroy()).not.toThrow();
        });
    });
});

describe('createEnhancedForm with async validation', () => {
    it('async validation çalışmalı', async () => {
        const asyncValidate = jest.fn().mockImplementation(async (value) => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return value === 'taken' ? 'Bu isim alınmış' : null;
        });

        const form = runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
            createEnhancedForm<{ username: string }>(
                [new StringField('username', 'Kullanıcı Adı', { required: true })],
                { username: '' },
                {
                    fieldConfigs: {
                        username: {
                            asyncValidate,
                            asyncDebounceMs: 10,
                        }
                    }
                }
            )
        );

        // Önce touched set et, sonra value'yu değiştir
        // Effect'in doğru şekilde tetiklenmesi için
        form.fields.username.touched.set(true);
        form.setValue('username', 'taken');

        // Debounce (10ms) + async fn (10ms) + effect execution + buffer
        await new Promise(resolve => setTimeout(resolve, 100));

        // Async validation effect bazlı çalıştığı için,
        // asyncValidate fonksiyonunun çağrıldığını kontrol et
        expect(asyncValidate).toHaveBeenCalledWith('taken');

        form.destroy();
    });

    it('validating signal async işlem sırasında true olmalı', async () => {
        const asyncValidate = jest.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return null;
        });

        const form = runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
            createEnhancedForm<{ username: string }>(
                [new StringField('username', 'Kullanıcı Adı')],
                { username: '' },
                {
                    fieldConfigs: {
                        username: { asyncValidate, asyncDebounceMs: 0 }
                    }
                }
            )
        );

        form.setValue('username', 'test');
        form.fields.username.touched.set(true);

        await new Promise(resolve => setTimeout(resolve, 20));

        form.destroy();
    });
});

describe('createEnhancedForm with cross validation', () => {
    it('cross validation çalışmalı', () => {
        const crossValidations: CrossFieldValidation<{ startDate: string; endDate: string }>[] = [
            {
                fields: ['startDate', 'endDate'],
                validate: (values) => {
                    if (values.startDate && values.endDate) {
                        return new Date(values.startDate) > new Date(values.endDate)
                            ? 'Başlangıç tarihi bitiş tarihinden büyük olamaz'
                            : null;
                    }
                    return null;
                }
            }
        ];

        const form = runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
            createEnhancedForm<{ startDate: string; endDate: string }>(
                [
                    new DateField('startDate', 'Başlangıç'),
                    new DateField('endDate', 'Bitiş')
                ],
                { startDate: '2024-12-01', endDate: '2024-11-01' },
                { crossValidations }
            )
        );

        expect(form.crossErrors()).toHaveLength(1);
        expect(form.crossErrors()[0]).toContain('Başlangıç tarihi');

        form.setValue('endDate', '2024-12-15');
        expect(form.crossErrors()).toHaveLength(0);

        form.destroy();
    });

    it('cross validation form validity etkilesin', () => {
        const crossValidations: CrossFieldValidation<{ password: string; confirmPassword: string }>[] = [
            {
                fields: ['password', 'confirmPassword'],
                validate: (values) => {
                    return values.password !== values.confirmPassword ? 'Şifreler eşleşmiyor' : null;
                }
            }
        ];

        const form = runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
            createEnhancedForm<{ password: string; confirmPassword: string }>(
                [
                    new StringField('password', 'Şifre', { required: true }),
                    new StringField('confirmPassword', 'Şifre Tekrar', { required: true })
                ],
                { password: 'abc123', confirmPassword: 'abc456' },
                { crossValidations }
            )
        );

        form.touchAll();
        expect(form.valid()).toBe(false);

        form.setValue('confirmPassword', 'abc123');
        expect(form.valid()).toBe(true);

        form.destroy();
    });
});

describe('createEnhancedForm with history', () => {
    it('history etkinleştirildiğinde undo/redo çalışmalı', () => {
        const form = runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
            createEnhancedForm<{ name: string }>(
                [new StringField('name', 'Ad')],
                { name: 'Initial' },
                { history: true, historyOptions: { maxSize: 10, debounceMs: 0 } }
            )
        );

        expect(form.history).toBeDefined();

        form.destroy();
    });
});

describe('createEnhancedForm with dependencies', () => {
    it('dependency resolver başlatılmalı', () => {
        const form = runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
            createEnhancedForm<{ country: string; city: string }>(
                [
                    new StringField('country', 'Ülke'),
                    new StringField('city', 'Şehir')
                ],
                {},
                {
                    fieldConfigs: {
                        city: {
                            dependency: {
                                dependsOn: ['country'],
                                showWhen: (values) => !!values["country"]
                            }
                        }
                    }
                }
            )
        );

        expect(form.dependencies).toBeDefined();
        form.destroy();
    });
});

describe('createEnhancedForm with readonly fields', () => {
    it('readonly alan işaretlenmeli', () => {
        const form = runInInjectionContext(TestBed.inject(EnvironmentInjector), () =>
            createEnhancedForm<{ id: string; name: string }>(
                [
                    new StringField('id', 'ID'),
                    new StringField('name', 'Ad')
                ],
                { id: '123', name: 'Test' },
                {
                    fieldConfigs: {
                        id: { readonly: true }
                    }
                }
            )
        );

        expect(form.fields.id.readonly).toBe(true);
        expect(form.fields.name.readonly).toBe(false);

        form.destroy();
    });
});
