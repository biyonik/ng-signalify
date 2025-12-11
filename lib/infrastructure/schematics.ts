/**
 * TR: Kod Üretim Yardımcıları (Code Generators).
 * Sinyal tabanlı mimariye uygun Interface, Store, Schema ve Component dosyalarını otomatik oluşturur.
 * Geliştirme hızını artırır ve standartizasyon sağlar.
 *
 * EN: Code Generation Helpers.
 * Automatically generates Interface, Store, Schema, and Component files suitable for signal-based architecture.
 * Increases development speed and ensures standardization.
 */

/** Field type definition */
export type SchematicsFieldType =
  | 'string'
  | 'text'
  | 'integer'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'enum'
  | 'multi-enum'
  | 'relation'
  | 'file'
  | 'image'
  | 'json'
  | 'array'
  | 'password'
  | 'color'
  | 'slider';

/**
 * TR: Kod üretimi için alan tanımı.
 * Alanın tipi, doğrulama kuralları ve UI etiketleri burada belirlenir.
 *
 * EN: Field definition for code generation.
 * Field type, validation rules, and UI labels are defined here.
 */
export interface FieldDefinition {
  name: string;
  type: SchematicsFieldType;
  label: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  options?: Array<{ value: string; label: string }>;
  relationEntity?: string;
  defaultValue?: unknown;
}

/**
 * TR: Varlık tanımı.
 * Bir varlığın (Entity) adını ve sahip olduğu alanları içerir.
 *
 * EN: Entity definition.
 * Contains the name of an entity and its fields.
 */
export interface EntityDefinition {
  name: string;
  pluralName: string;
  fields: FieldDefinition[];
  timestamps?: boolean;
  softDelete?: boolean;
}

/**
 * TR: Alan tiplerine göre gerekli import ifadelerini oluşturur.
 * Tekrarlayan importları engeller.
 *
 * EN: Generates necessary import statements based on field types.
 * Prevents duplicate imports.
 */
export function generateFieldImport(types: SchematicsFieldType[]): string {
  const fieldMap: Record<SchematicsFieldType, string> = {
    string: 'StringField',
    text: 'TextAreaField',
    integer: 'IntegerField',
    decimal: 'DecimalField',
    boolean: 'BooleanField',
    date: 'DateField',
    datetime: 'DateTimeField',
    time: 'TimeField',
    enum: 'EnumField',
    'multi-enum': 'MultiEnumField',
    relation: 'RelationField',
    file: 'FileField',
    image: 'ImageField',
    json: 'JsonField',
    array: 'ArrayField',
    password: 'PasswordField',
    color: 'ColorField',
    slider: 'SliderField',
  };

  const imports = [...new Set(types.map((t) => fieldMap[t]))];
  return `import { ${imports.join(', ')} } from '@signal-shared/fields';`;
}

/**
 * TR: Alan tanımına göre TypeScript kodunu (Field Instance) üretir.
 * Doğrulama kurallarını (min, max, required vb.) koda dahil eder.
 *
 * EN: Generates TypeScript code (Field Instance) based on field definition.
 * Includes validation rules (min, max, required, etc.) in the code.
 */
export function generateFieldCode(field: FieldDefinition): string {
  const fieldFactories: Record<SchematicsFieldType, () => string> = {
    string: () => {
      const opts: string[] = [];
      if (field.required) opts.push('required: true');
      if (field.minLength) opts.push(`minLength: ${field.minLength}`);
      if (field.maxLength) opts.push(`maxLength: ${field.maxLength}`);
      if (field.pattern) opts.push(`pattern: '${field.pattern}'`);
      if (field.placeholder) opts.push(`placeholder: '${field.placeholder}'`);
      return `StringField('${field.name}', '${field.label}'${opts.length ? `, { ${opts.join(', ')} }` : ''})`;
    },
    text: () => {
      const opts: string[] = [];
      if (field.required) opts.push('required: true');
      if (field.maxLength) opts.push(`maxLength: ${field.maxLength}`);
      return `TextAreaField('${field.name}', '${field.label}'${opts.length ? `, { ${opts.join(', ')} }` : ''})`;
    },
    integer: () => {
      const opts: string[] = [];
      if (field.required) opts.push('required: true');
      if (field.min !== undefined) opts.push(`min: ${field.min}`);
      if (field.max !== undefined) opts.push(`max: ${field.max}`);
      return `IntegerField('${field.name}', '${field.label}'${opts.length ? `, { ${opts.join(', ')} }` : ''})`;
    },
    decimal: () => {
      const opts: string[] = [];
      if (field.required) opts.push('required: true');
      if (field.min !== undefined) opts.push(`min: ${field.min}`);
      if (field.max !== undefined) opts.push(`max: ${field.max}`);
      return `DecimalField('${field.name}', '${field.label}'${opts.length ? `, { ${opts.join(', ')} }` : ''})`;
    },
    boolean: () => `BooleanField('${field.name}', '${field.label}')`,
    date: () => {
      const opts: string[] = [];
      if (field.required) opts.push('required: true');
      return `DateField('${field.name}', '${field.label}'${opts.length ? `, { ${opts.join(', ')} }` : ''})`;
    },
    datetime: () => {
      const opts: string[] = [];
      if (field.required) opts.push('required: true');
      return `DateTimeField('${field.name}', '${field.label}'${opts.length ? `, { ${opts.join(', ')} }` : ''})`;
    },
    time: () => `TimeField('${field.name}', '${field.label}')`,
    enum: () => {
      const options = field.options?.map((o) => `{ id: '${o.value}', label: '${o.label}' }`).join(', ') ?? '';
      const opts = field.required ? ', { required: true }' : '';
      return `EnumField('${field.name}', '${field.label}', [${options}]${opts})`;
    },
    'multi-enum': () => {
      const options = field.options?.map((o) => `{ id: '${o.value}', label: '${o.label}' }`).join(', ') ?? '';
      const opts = field.required ? ', { required: true }' : '';
      return `MultiEnumField('${field.name}', '${field.label}', [${options}]${opts})`;
    },
    relation: () => {
      const opts: string[] = [];
      if (field.required) opts.push('required: true');
      return `RelationField('${field.name}', '${field.label}', '${field.relationEntity}'${opts.length ? `, { ${opts.join(', ')} }` : ''})`;
    },
    file: () => `FileField('${field.name}', '${field.label}')`,
    image: () => `ImageField('${field.name}', '${field.label}')`,
    json: () => `JsonField('${field.name}', '${field.label}')`,
    array: () => `ArrayField('${field.name}', '${field.label}')`,
    password: () => `PasswordField('${field.name}', '${field.label}')`,
    color: () => `ColorField('${field.name}', '${field.label}')`,
    slider: () => {
      const min = field.min ?? 0;
      const max = field.max ?? 100;
      return `SliderField('${field.name}', '${field.label}', ${min}, ${max})`;
    },
  };

  return fieldFactories[field.type]();
}

/**
 * TR: Varlık tanımına göre TypeScript Interface kodunu üretir.
 *
 * EN: Generates TypeScript Interface code based on entity definition.
 */
export function generateInterface(entity: EntityDefinition): string {
  const typeMap: Record<SchematicsFieldType, string> = {
    string: 'string',
    text: 'string',
    integer: 'number',
    decimal: 'number',
    boolean: 'boolean',
    date: 'string',
    datetime: 'string',
    time: 'string',
    enum: 'string',
    'multi-enum': 'string[]',
    relation: 'string | number',
    file: 'File | null',
    image: 'File | null',
    json: 'Record<string, unknown>',
    array: 'unknown[]',
    password: 'string',
    color: 'string',
    slider: 'number',
  };

  const fields = entity.fields.map((f) => {
    const optional = !f.required ? '?' : '';
    return `  ${f.name}${optional}: ${typeMap[f.type]};`;
  });

  if (entity.timestamps) {
    fields.push('  createdAt: string;');
    fields.push('  updatedAt: string;');
  }

  if (entity.softDelete) {
    fields.push('  deletedAt?: string | null;');
  }

  return `export interface ${entity.name} {\n  id: string | number;\n${fields.join('\n')}\n}`;
}

/**
 * TR: Form şeması kodunu üretir.
 *
 * EN: Generates form schema code.
 */
export function generateFormSchema(entity: EntityDefinition): string {
  const imports = generateFieldImport(entity.fields.map((f) => f.type));
  const fields = entity.fields.map((f) => `  ${f.name}: ${generateFieldCode(f)},`);

  return `${imports}
import { FormSchema } from '@signal-shared/schemas';

export const ${entity.name.toLowerCase()}Fields = {
${fields.join('\n')}
};

export const ${entity.name}FormSchema = FormSchema(${entity.name.toLowerCase()}Fields);`;
}

/**
 * TR: Entity Store (Servis) kodunu üretir.
 * Standart CRUD metodları ve API endpointleri ile birlikte.
 *
 * EN: Generates Entity Store (Service) code.
 * Along with standard CRUD methods and API endpoints.
 */
export function generateEntityStore(entity: EntityDefinition): string {
  const name = entity.name;
  const plural = entity.pluralName;
  const lower = name.toLowerCase();

  return `import { Injectable } from '@angular/core';
import { EntityStore, PaginatedResponse, FetchParams } from '@signal-shared/store';
import { ${name} } from './${lower}.interface';

export interface Create${name}Dto {
  // Define create DTO fields
}

export interface Update${name}Dto {
  // Define update DTO fields
}

@Injectable({ providedIn: 'root' })
export class ${name}Store extends EntityStore<${name}, Create${name}Dto, Update${name}Dto> {
  constructor(private http: HttpClient) {
    super({
      name: '${plural.toLowerCase()}',
      defaultPageSize: 20,
      cacheTTL: 5 * 60 * 1000,
      optimistic: true,
    });
  }

  protected async fetchAll(params: FetchParams): Promise<PaginatedResponse<${name}>> {
    const response = await this.http.get<PaginatedResponse<${name}>>(\`/api/${plural.toLowerCase()}\`, {
      params: { ...params.filters, page: params.page, pageSize: params.pageSize },
    });
    return response.data;
  }

  protected async fetchOne(id: string | number): Promise<${name}> {
    const response = await this.http.get<${name}>(\`/api/${plural.toLowerCase()}/\${id}\`);
    return response.data;
  }

  protected async createOne(data: Create${name}Dto): Promise<${name}> {
    const response = await this.http.post<${name}>('/api/${plural.toLowerCase()}', data);
    return response.data;
  }

  protected async updateOne(id: string | number, data: Update${name}Dto): Promise<${name}> {
    const response = await this.http.patch<${name}>(\`/api/${plural.toLowerCase()}/\${id}\`, data);
    return response.data;
  }

  protected async deleteOne(id: string | number): Promise<void> {
    await this.http.delete(\`/api/${plural.toLowerCase()}/\${id}\`);
  }
}`;
}

/**
 * TR: Liste bileşeni (Component) kodunu üretir.
 *
 * EN: Generates list component code.
 */
export function generateListComponent(entity: EntityDefinition): string {
  const name = entity.name;
  const lower = name.toLowerCase();
  const plural = entity.pluralName.toLowerCase();

  const columns = entity.fields
    .slice(0, 5)
    .map((f) => `    { key: '${f.name}', label: '${f.label}', sortable: true },`)
    .join('\n');

  return `import { Component, inject } from '@angular/core';
import { ${name}Store } from './${lower}.store';

@Component({
  selector: 'app-${lower}-list',
  standalone: true,
  template: \`
    <div class="container">
      <header class="header">
        <h1>${entity.pluralName}</h1>
        <button (click)="openCreate()">Yeni Ekle</button>
      </header>

      <sig-table
        [data]="store.signals.all()"
        [columns]="columns"
        [loading]="store.signals.isLoading()"
        [selectable]="true"
        (sortChange)="onSort($event)"
        (rowClicked)="onRowClick($event)"
      >
        <ng-template sigColumn="actions" let-row>
          <button (click)="edit(row)">Düzenle</button>
          <button (click)="delete(row)">Sil</button>
        </ng-template>
      </sig-table>

      <sig-pagination
        [page]="store.pagination.page()"
        [pageSize]="store.pagination.pageSize()"
        [total]="store.pagination.total()"
        (pageChange)="store.goToPage($event)"
        (pageSizeChanged)="store.setPageSize($event)"
      />
    </div>
  \`,
})
export class ${name}ListComponent {
  protected store = inject(${name}Store);

  columns = [
${columns}
    { key: 'actions', label: 'İşlemler', sortable: false },
  ];

  ngOnInit() {
    this.store.loadAll();
  }

  onSort(sort: { key: string; direction: 'asc' | 'desc' }) {
    this.store.setSort(sort.key, sort.direction);
  }

  onRowClick(row: unknown) {
    // Handle row click
  }

  openCreate() {
    // Open create modal/page
  }

  edit(row: unknown) {
    // Navigate to edit
  }

  delete(row: unknown) {
    // Confirm and delete
  }
}`;
}

/**
 * TR: Form bileşeni (Component) kodunu üretir.
 *
 * EN: Generates form component code.
 */
export function generateFormComponent(entity: EntityDefinition): string {
  const name = entity.name;
  const lower = name.toLowerCase();

  const formFields = entity.fields.map((f) => {
    if (f.type === 'boolean') {
      return `        <sig-checkbox
          [(checked)]="form.fields.${f.name}.value()"
          label="${f.label}"
        />`;
    }
    if (f.type === 'text') {
      return `        <sig-form-field label="${f.label}" [error]="form.fields.${f.name}.error()">
          <sig-textarea [(value)]="form.fields.${f.name}.value()" />
        </sig-form-field>`;
    }
    if (f.type === 'enum') {
      return `        <sig-form-field label="${f.label}" [error]="form.fields.${f.name}.error()">
          <sig-select
            [options]="${f.name}Options"
            [(value)]="form.fields.${f.name}.value()"
          />
        </sig-form-field>`;
    }
    return `        <sig-form-field label="${f.label}" [error]="form.fields.${f.name}.error()">
          <sig-input
            type="${f.type === 'integer' || f.type === 'decimal' ? 'number' : 'text'}"
            [(value)]="form.fields.${f.name}.value()"
            placeholder="${f.placeholder ?? ''}"
          />
        </sig-form-field>`;
  }).join('\n\n');

  return `import { Component, inject, input, output } from '@angular/core';
import { ${name}FormSchema } from './${lower}.schema';
import { createForm } from '@signal-shared/schemas';

@Component({
  selector: 'app-${lower}-form',
  standalone: true,
  template: \`
    <form (ngSubmit)="onSubmit()">
${formFields}

      <div class="actions">
        <button type="button" (click)="cancel.emit()">İptal</button>
        <button type="submit" [disabled]="!form.signals.valid()">
          {{ isEdit() ? 'Güncelle' : 'Kaydet' }}
        </button>
      </div>
    </form>
  \`,
})
export class ${name}FormComponent {
  initialData = input<Partial<${name}>>({});
  isEdit = input(false);
  
  saved = output<${name}>();
  cancel = output<void>();

  protected form = createForm(${name}FormSchema);

  ngOnInit() {
    if (this.initialData()) {
      // Set initial values
      Object.entries(this.initialData()).forEach(([key, value]) => {
        this.form.fields[key]?.value.set(value);
      });
    }
  }

  async onSubmit() {
    const valid = await this.form.validateAll();
    if (valid) {
      this.saved.emit(this.form.getValues() as ${name});
    }
  }
}`;
}

/**
 * TR: Bir varlık için gerekli tüm dosyaları üretir (Interface, Store, Schema, Components).
 *
 * EN: Generates all necessary files for an entity (Interface, Store, Schema, Components).
 */
export function generateEntity(entity: EntityDefinition): Record<string, string> {
  const lower = entity.name.toLowerCase();

  return {
    [`${lower}.interface.ts`]: generateInterface(entity),
    [`${lower}.schema.ts`]: generateFormSchema(entity),
    [`${lower}.store.ts`]: generateEntityStore(entity),
    [`${lower}-list.component.ts`]: generateListComponent(entity),
    [`${lower}-form.component.ts`]: generateFormComponent(entity),
  };
}

/**
 * TR: Hızlı Varlık Oluşturucu (Builder Pattern).
 * Zincirleme metodlarla (Fluent Interface) varlık tanımlamayı kolaylaştırır.
 *
 * EN: Quick Entity Builder (Builder Pattern).
 * Simplifies entity definition with chaining methods (Fluent Interface).
 */
export class EntityBuilder {
  private entity: EntityDefinition;

  constructor(name: string, pluralName?: string) {
    this.entity = {
      name,
      pluralName: pluralName ?? `${name}s`,
      fields: [],
    };
  }

  string(name: string, label: string, options?: Partial<FieldDefinition>): this {
    this.entity.fields.push({ name, label, type: 'string', ...options });
    return this;
  }

  text(name: string, label: string, options?: Partial<FieldDefinition>): this {
    this.entity.fields.push({ name, label, type: 'text', ...options });
    return this;
  }

  integer(name: string, label: string, options?: Partial<FieldDefinition>): this {
    this.entity.fields.push({ name, label, type: 'integer', ...options });
    return this;
  }

  decimal(name: string, label: string, options?: Partial<FieldDefinition>): this {
    this.entity.fields.push({ name, label, type: 'decimal', ...options });
    return this;
  }

  boolean(name: string, label: string): this {
    this.entity.fields.push({ name, label, type: 'boolean' });
    return this;
  }

  date(name: string, label: string, options?: Partial<FieldDefinition>): this {
    this.entity.fields.push({ name, label, type: 'date', ...options });
    return this;
  }

  datetime(name: string, label: string, options?: Partial<FieldDefinition>): this {
    this.entity.fields.push({ name, label, type: 'datetime', ...options });
    return this;
  }

  enum(name: string, label: string, options: Array<{ value: string; label: string }>, fieldOptions?: Partial<FieldDefinition>): this {
    this.entity.fields.push({ name, label, type: 'enum', options, ...fieldOptions });
    return this;
  }

  relation(name: string, label: string, relationEntity: string, options?: Partial<FieldDefinition>): this {
    this.entity.fields.push({ name, label, type: 'relation', relationEntity, ...options });
    return this;
  }

  timestamps(): this {
    this.entity.timestamps = true;
    return this;
  }

  softDelete(): this {
    this.entity.softDelete = true;
    return this;
  }

  build(): EntityDefinition {
    return this.entity;
  }

  generate(): Record<string, string> {
    return generateEntity(this.entity);
  }
}