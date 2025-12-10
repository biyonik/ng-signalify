import {
    SchematicsFieldType,
    FieldDefinition,
    EntityDefinition,
    generateFieldImport,
    generateFieldCode,
    generateInterface,
    generateFormSchema,
    generateEntityStore,
    generateListComponent,
    generateFormComponent,
    generateEntity,
    EntityBuilder,
} from './schematics';

describe('generateFieldImport', () => {
    it('tek tip için import üretmeli', () => {
        const result = generateFieldImport(['string']);
        expect(result).toBe("import { StringField } from '@signal-shared/fields';");
    });

    it('birden fazla tip için import üretmeli', () => {
        const result = generateFieldImport(['string', 'integer', 'boolean']);
        expect(result).toContain('StringField');
        expect(result).toContain('IntegerField');
        expect(result).toContain('BooleanField');
    });

    it('tekrar eden tipleri tekilleştirmeli', () => {
        const result = generateFieldImport(['string', 'string', 'integer']);
        const matches = result.match(/StringField/g);
        expect(matches?.length).toBe(1);
    });

    it('tüm field tiplerini desteklemeli', () => {
        const allTypes: SchematicsFieldType[] = [
            'string', 'text', 'integer', 'decimal', 'boolean',
            'date', 'datetime', 'time', 'enum', 'multi-enum',
            'relation', 'file', 'image', 'json', 'array',
            'password', 'color', 'slider'
        ];

        const result = generateFieldImport(allTypes);
        expect(result).toContain('StringField');
        expect(result).toContain('TextAreaField');
        expect(result).toContain('DateField');
        expect(result).toContain('EnumField');
        expect(result).toContain('PasswordField');
    });
});

describe('generateFieldCode', () => {
    it('basit string field üretmeli', () => {
        const field: FieldDefinition = {
            name: 'title',
            type: 'string',
            label: 'Başlık',
        };

        const result = generateFieldCode(field);
        expect(result).toBe("StringField('Başlık')");
    });

    it('required string field üretmeli', () => {
        const field: FieldDefinition = {
            name: 'title',
            type: 'string',
            label: 'Başlık',
            required: true,
        };

        const result = generateFieldCode(field);
        expect(result).toContain('required: true');
    });

    it('min/max length ile string field üretmeli', () => {
        const field: FieldDefinition = {
            name: 'username',
            type: 'string',
            label: 'Kullanıcı Adı',
            minLength: 3,
            maxLength: 20,
        };

        const result = generateFieldCode(field);
        expect(result).toContain('minLength: 3');
        expect(result).toContain('maxLength: 20');
    });

    it('pattern ile string field üretmeli', () => {
        const field: FieldDefinition = {
            name: 'code',
            type: 'string',
            label: 'Kod',
            pattern: '^[A-Z]{3}$',
        };

        const result = generateFieldCode(field);
        expect(result).toContain("pattern: '^[A-Z]{3}$'");
    });

    it('integer field üretmeli', () => {
        const field: FieldDefinition = {
            name: 'age',
            type: 'integer',
            label: 'Yaş',
            required: true,
            min: 18,
            max: 100,
        };

        const result = generateFieldCode(field);
        expect(result).toContain("IntegerField('Yaş'");
        expect(result).toContain('min: 18');
        expect(result).toContain('max: 100');
    });

    it('decimal field üretmeli', () => {
        const field: FieldDefinition = {
            name: 'price',
            type: 'decimal',
            label: 'Fiyat',
            min: 0,
        };

        const result = generateFieldCode(field);
        expect(result).toContain("DecimalField('Fiyat'");
        expect(result).toContain('min: 0');
    });

    it('boolean field üretmeli', () => {
        const field: FieldDefinition = {
            name: 'active',
            type: 'boolean',
            label: 'Aktif',
        };

        const result = generateFieldCode(field);
        expect(result).toBe("BooleanField('Aktif')");
    });

    it('date field üretmeli', () => {
        const field: FieldDefinition = {
            name: 'birthDate',
            type: 'date',
            label: 'Doğum Tarihi',
            required: true,
        };

        const result = generateFieldCode(field);
        expect(result).toContain("DateField('Doğum Tarihi'");
        expect(result).toContain('required: true');
    });

    it('enum field üretmeli', () => {
        const field: FieldDefinition = {
            name: 'status',
            type: 'enum',
            label: 'Durum',
            options: [
                { value: 'active', label: 'Aktif' },
                { value: 'passive', label: 'Pasif' },
            ],
            required: true,
        };

        const result = generateFieldCode(field);
        expect(result).toContain("EnumField('Durum'");
        expect(result).toContain("value: 'active'");
        expect(result).toContain("label: 'Aktif'");
    });

    it('relation field üretmeli', () => {
        const field: FieldDefinition = {
            name: 'categoryId',
            type: 'relation',
            label: 'Kategori',
            relationEntity: 'Category',
            required: true,
        };

        const result = generateFieldCode(field);
        expect(result).toContain("RelationField('Kategori', 'Category'");
        expect(result).toContain('required: true');
    });

    it('slider field üretmeli', () => {
        const field: FieldDefinition = {
            name: 'rating',
            type: 'slider',
            label: 'Puan',
            min: 1,
            max: 10,
        };

        const result = generateFieldCode(field);
        expect(result).toContain("SliderField('Puan', 1, 10)");
    });

    it('slider default min/max kullanmalı', () => {
        const field: FieldDefinition = {
            name: 'value',
            type: 'slider',
            label: 'Değer',
        };

        const result = generateFieldCode(field);
        expect(result).toContain("SliderField('Değer', 0, 100)");
    });
});

describe('generateInterface', () => {
    it('basit interface üretmeli', () => {
        const entity: EntityDefinition = {
            name: 'User',
            pluralName: 'Users',
            fields: [
                { name: 'name', type: 'string', label: 'Ad', required: true },
                { name: 'age', type: 'integer', label: 'Yaş' },
            ],
        };

        const result = generateInterface(entity);

        expect(result).toContain('export interface User');
        expect(result).toContain('id: string | number;');
        expect(result).toContain('name: string;');
        expect(result).toContain('age?: number;'); // required değil, opsiyonel
    });

    it('timestamps ile interface üretmeli', () => {
        const entity: EntityDefinition = {
            name: 'Post',
            pluralName: 'Posts',
            fields: [],
            timestamps: true,
        };

        const result = generateInterface(entity);

        expect(result).toContain('createdAt: string;');
        expect(result).toContain('updatedAt: string;');
    });

    it('softDelete ile interface üretmeli', () => {
        const entity: EntityDefinition = {
            name: 'Post',
            pluralName: 'Posts',
            fields: [],
            softDelete: true,
        };

        const result = generateInterface(entity);

        expect(result).toContain('deletedAt?: string | null;');
    });

    it('tüm field tiplerini doğru TypeScript tipine çevirmeli', () => {
        const entity: EntityDefinition = {
            name: 'Test',
            pluralName: 'Tests',
            fields: [
                { name: 'str', type: 'string', label: 'Str', required: true },
                { name: 'num', type: 'integer', label: 'Num', required: true },
                { name: 'dec', type: 'decimal', label: 'Dec', required: true },
                { name: 'bool', type: 'boolean', label: 'Bool', required: true },
                { name: 'multi', type: 'multi-enum', label: 'Multi', required: true },
                { name: 'file', type: 'file', label: 'File', required: true },
                { name: 'json', type: 'json', label: 'Json', required: true },
                { name: 'arr', type: 'array', label: 'Arr', required: true },
            ],
        };

        const result = generateInterface(entity);

        expect(result).toContain('str: string;');
        expect(result).toContain('num: number;');
        expect(result).toContain('dec: number;');
        expect(result).toContain('bool: boolean;');
        expect(result).toContain('multi: string[];');
        expect(result).toContain('file: File | null;');
        expect(result).toContain('json: Record<string, unknown>;');
        expect(result).toContain('arr: unknown[];');
    });
});

describe('generateFormSchema', () => {
    it('form schema kodu üretmeli', () => {
        const entity: EntityDefinition = {
            name: 'Product',
            pluralName: 'Products',
            fields: [
                { name: 'name', type: 'string', label: 'Ürün Adı', required: true },
                { name: 'price', type: 'decimal', label: 'Fiyat', min: 0 },
            ],
        };

        const result = generateFormSchema(entity);

        expect(result).toContain("import { StringField, DecimalField }");
        expect(result).toContain("import { FormSchema } from '@signal-shared/schemas'");
        expect(result).toContain('export const productFields = {');
        expect(result).toContain('export const ProductFormSchema = FormSchema(productFields)');
    });
});

describe('generateEntityStore', () => {
    it('entity store kodu üretmeli', () => {
        const entity: EntityDefinition = {
            name: 'Product',
            pluralName: 'Products',
            fields: [],
        };

        const result = generateEntityStore(entity);

        expect(result).toContain('@Injectable({ providedIn:');
        expect(result).toContain('export class ProductStore extends EntityStore<Product');
        expect(result).toContain('CreateProductDto');
        expect(result).toContain('UpdateProductDto');
        expect(result).toContain('/api/products');
        expect(result).toContain('fetchAll');
        expect(result).toContain('fetchOne');
        expect(result).toContain('createOne');
        expect(result).toContain('updateOne');
        expect(result).toContain('deleteOne');
    });
});

describe('generateListComponent', () => {
    it('liste component kodu üretmeli', () => {
        const entity: EntityDefinition = {
            name: 'Product',
            pluralName: 'Products',
            fields: [
                { name: 'name', type: 'string', label: 'Ürün Adı' },
                { name: 'price', type: 'decimal', label: 'Fiyat' },
            ],
        };

        const result = generateListComponent(entity);

        expect(result).toContain('ProductListComponent');
        expect(result).toContain('ProductStore');
        expect(result).toContain('sig-table');
        expect(result).toContain('sig-pagination');
        expect(result).toContain("key: 'name'");
        expect(result).toContain("label: 'Ürün Adı'");
    });
});

describe('generateFormComponent', () => {
    it('form component kodu üretmeli', () => {
        const entity: EntityDefinition = {
            name: 'Product',
            pluralName: 'Products',
            fields: [
                { name: 'name', type: 'string', label: 'Ürün Adı' },
                { name: 'description', type: 'text', label: 'Açıklama' },
                { name: 'active', type: 'boolean', label: 'Aktif' },
            ],
        };

        const result = generateFormComponent(entity);

        expect(result).toContain('ProductFormComponent');
        expect(result).toContain('sig-form-field');
        expect(result).toContain('sig-input');
        expect(result).toContain('sig-textarea');
        expect(result).toContain('sig-checkbox');
        expect(result).toContain('saved = output');
        expect(result).toContain('cancel = output');
    });
});

describe('generateEntity', () => {
    it('tüm dosyaları üretmeli', () => {
        const entity: EntityDefinition = {
            name: 'Product',
            pluralName: 'Products',
            fields: [
                { name: 'name', type: 'string', label: 'Ürün Adı', required: true },
            ],
        };

        const result = generateEntity(entity);

        expect(result['product.interface.ts']).toBeDefined();
        expect(result['product.schema.ts']).toBeDefined();
        expect(result['product.store.ts']).toBeDefined();
        expect(result['product-list.component.ts']).toBeDefined();
        expect(result['product-form.component.ts']).toBeDefined();
    });
});

describe('EntityBuilder', () => {
    it('fluent interface ile entity oluşturmalı', () => {
        const entity = new EntityBuilder('Product', 'Products')
            .string('name', 'Ürün Adı', { required: true, minLength: 3 })
            .text('description', 'Açıklama')
            .integer('stock', 'Stok', { min: 0 })
            .decimal('price', 'Fiyat', { required: true, min: 0 })
            .boolean('active', 'Aktif')
            .date('releaseDate', 'Çıkış Tarihi')
            .enum('status', 'Durum', [
                { value: 'draft', label: 'Taslak' },
                { value: 'published', label: 'Yayında' },
            ])
            .relation('categoryId', 'Kategori', 'Category', { required: true })
            .timestamps()
            .softDelete()
            .build();

        expect(entity.name).toBe('Product');
        expect(entity.pluralName).toBe('Products');
        // string, text, integer, decimal, boolean, date, enum, relation = 8 field
        expect(entity.fields.length).toBe(8);
        expect(entity.timestamps).toBe(true);
        expect(entity.softDelete).toBe(true);

        // Field kontrolü
        const nameField = entity.fields.find(f => f.name === 'name');
        expect(nameField?.type).toBe('string');
        expect(nameField?.required).toBe(true);
        expect(nameField?.minLength).toBe(3);

        const categoryField = entity.fields.find(f => f.name === 'categoryId');
        expect(categoryField?.type).toBe('relation');
        expect(categoryField?.relationEntity).toBe('Category');
    });

    it('generate() tüm dosyaları üretmeli', () => {
        const files = new EntityBuilder('User')
            .string('email', 'E-posta', { required: true })
            .generate();

        expect(Object.keys(files).length).toBe(5);
        expect(files['user.interface.ts']).toContain('export interface User');
    });

    it('default plural name kullanmalı', () => {
        const entity = new EntityBuilder('Category').build();
        expect(entity.pluralName).toBe('Categorys'); // Basit s ekleme
    });
});
