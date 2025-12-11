/**
 * ng-signalify v2.0 - Headless Adapter Example
 * 
 * This example demonstrates how to use ng-signalify with custom/headless UI.
 * It shows how to build your own UI components while leveraging ng-signalify's
 * powerful form and state management logic.
 */

import { Component, inject, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationConfig } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ng-signalify imports
import { StringField, IntegerField, EnumField, BooleanField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { EntityStore, PaginatedResponse, FetchParams, EntityId } from 'ng-signalify/store';
import { createHttpClient } from 'ng-signalify/api';
import { provideSigUI, HeadlessAdapter } from 'ng-signalify/adapters';
import { SigFormField } from 'ng-signalify/components/core';

// ============================================================================
// 1. APP CONFIGURATION
// ============================================================================

export const appConfig: ApplicationConfig = {
  providers: [
    // Register Headless adapter - use your own UI
    provideSigUI(new HeadlessAdapter()),
    // ... other providers
  ]
};

// ============================================================================
// 2. DOMAIN MODELS
// ============================================================================

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  featured: boolean;
}

interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  featured: boolean;
}

interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  featured?: boolean;
}

// ============================================================================
// 3. ENTITY STORE
// ============================================================================

const http = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000,
});

class ProductStore extends EntityStore<Product, CreateProductDto, UpdateProductDto> {
  constructor() {
    super({
      name: 'products',
      selectId: (product) => product.id,
      defaultPageSize: 12,
      cacheTTL: 5 * 60 * 1000,
      optimistic: true,
    });
  }

  protected async fetchAll(params: FetchParams): Promise<PaginatedResponse<Product>> {
    const response = await http.get<PaginatedResponse<Product>>('/api/products', { params });
    return response.data;
  }

  protected async fetchOne(id: EntityId): Promise<Product> {
    const response = await http.get<Product>(`/api/products/${id}`);
    return response.data;
  }

  protected async createOne(data: CreateProductDto): Promise<Product> {
    const response = await http.post<Product>('/api/products', { body: data });
    return response.data;
  }

  protected async updateOne(id: EntityId, data: UpdateProductDto): Promise<Product> {
    const response = await http.patch<Product>(`/api/products/${id}`, { body: data });
    return response.data;
  }

  protected async deleteOne(id: EntityId): Promise<void> {
    await http.delete(`/api/products/${id}`);
  }
}

// ============================================================================
// 4. CUSTOM INPUT COMPONENT
// ============================================================================

@Component({
  selector: 'app-custom-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="custom-input" [class.has-error]="error && touched">
      @if (label) {
        <label class="input-label">
          {{ label }}
          @if (required) {
            <span class="required">*</span>
          }
        </label>
      }
      
      <div class="input-wrapper">
        <input
          [type]="type"
          [value]="value"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          (input)="onInputChange($event)"
          (blur)="onBlurEvent()"
          (focus)="onFocusEvent()"
          class="input-field"
        />
        
        @if (loading) {
          <span class="input-icon loading">⏳</span>
        }
      </div>
      
      @if (error && touched) {
        <span class="error-message">{{ error }}</span>
      }
      
      @if (hint && !error) {
        <span class="hint-message">{{ hint }}</span>
      }
    </div>
  `,
  styles: [`
    .custom-input {
      margin-bottom: 20px;
      
      .input-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 6px;
        
        .required {
          color: #ef4444;
          margin-left: 2px;
        }
      }
      
      .input-wrapper {
        position: relative;
        
        .input-field {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          transition: all 0.2s;
          
          &:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          &:disabled {
            background: #f3f4f6;
            cursor: not-allowed;
          }
        }
        
        .input-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
        }
      }
      
      &.has-error .input-field {
        border-color: #ef4444;
        
        &:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      }
      
      .error-message {
        display: block;
        margin-top: 6px;
        font-size: 12px;
        color: #ef4444;
      }
      
      .hint-message {
        display: block;
        margin-top: 6px;
        font-size: 12px;
        color: #6b7280;
      }
    }
  `]
})
export class CustomInputComponent {
  @Input() label = '';
  @Input() type = 'text';
  @Input() value: any = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() error: string | null = null;
  @Input() touched = false;
  @Input() hint = '';
  @Input() loading = false;
  
  @Output() valueChange = new EventEmitter<any>();
  @Output() blur = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();

  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newValue = this.type === 'number' ? +target.value : target.value;
    this.valueChange.emit(newValue);
  }

  onBlurEvent() {
    this.blur.emit();
  }

  onFocusEvent() {
    this.focus.emit();
  }
}

// ============================================================================
// 5. CUSTOM SELECT COMPONENT
// ============================================================================

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="custom-select" [class.has-error]="error && touched">
      @if (label) {
        <label class="select-label">
          {{ label }}
          @if (required) {
            <span class="required">*</span>
          }
        </label>
      }
      
      <div class="select-wrapper">
        <select
          [value]="value"
          [disabled]="disabled"
          (change)="onChangeEvent($event)"
          (blur)="onBlurEvent()"
          class="select-field"
        >
          @if (placeholder) {
            <option value="">{{ placeholder }}</option>
          }
          @for (option of options; track option.id) {
            <option [value]="option.id">{{ option.label }}</option>
          }
        </select>
        <span class="select-icon">▼</span>
      </div>
      
      @if (error && touched) {
        <span class="error-message">{{ error }}</span>
      }
    </div>
  `,
  styles: [`
    .custom-select {
      margin-bottom: 20px;
      
      .select-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 6px;
        
        .required {
          color: #ef4444;
          margin-left: 2px;
        }
      }
      
      .select-wrapper {
        position: relative;
        
        .select-field {
          width: 100%;
          padding: 10px 12px;
          padding-right: 32px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          appearance: none;
          transition: all 0.2s;
          
          &:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          &:disabled {
            background: #f3f4f6;
            cursor: not-allowed;
          }
        }
        
        .select-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          font-size: 10px;
          color: #6b7280;
        }
      }
      
      &.has-error .select-field {
        border-color: #ef4444;
        
        &:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      }
      
      .error-message {
        display: block;
        margin-top: 6px;
        font-size: 12px;
        color: #ef4444;
      }
    }
  `]
})
export class CustomSelectComponent {
  @Input() label = '';
  @Input() value: any = '';
  @Input() options: Array<{ id: string; label: string }> = [];
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() required = false;
  @Input() error: string | null = null;
  @Input() touched = false;

  @Output() valueChange = new EventEmitter<any>();
  @Output() blur = new EventEmitter<void>();

  onChangeEvent(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.valueChange.emit(target.value);
  }

  onBlurEvent() {
    this.blur.emit();
  }
}

// ============================================================================
// 6. FORM COMPONENT WITH HEADLESS UI
// ============================================================================

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SigFormField,
    CustomInputComponent,
    CustomSelectComponent,
  ],
  template: `
    <form (ngSubmit)="onSubmit()" class="product-form">
      <h2>{{ isEdit ? 'Edit Product' : 'Create Product' }}</h2>

      <!-- Using SigFormField wrapper with custom input -->
      <sig-form-field
        label="Product Name"
        [error]="form.fields.name.combinedError()"
        [touched]="form.fields.name.touched()"
        [required]="true"
        [loading]="form.fields.name.asyncValidating()"
      >
        <input
          type="text"
          [value]="form.fields.name.value()"
          (input)="form.fields.name.value.set($any($event.target).value)"
          (blur)="form.fields.name.touch()"
          placeholder="Enter product name"
        />
      </sig-form-field>

      <!-- Or use custom component directly -->
      <app-custom-input
        label="Description"
        type="text"
        [value]="form.fields.description.value()"
        [error]="form.fields.description.error()"
        [touched]="form.fields.description.touched()"
        placeholder="Product description"
        hint="Brief description of the product"
        (valueChange)="form.fields.description.value.set($event)"
        (blur)="form.fields.description.touch()"
      />

      <div class="form-row">
        <app-custom-input
          label="Price"
          type="number"
          [value]="form.fields.price.value()"
          [error]="form.fields.price.error()"
          [touched]="form.fields.price.touched()"
          [required]="true"
          placeholder="0.00"
          (valueChange)="form.fields.price.value.set($event)"
          (blur)="form.fields.price.touch()"
        />

        <app-custom-input
          label="Stock"
          type="number"
          [value]="form.fields.stock.value()"
          [error]="form.fields.stock.error()"
          [touched]="form.fields.stock.touched()"
          [required]="true"
          placeholder="0"
          (valueChange)="form.fields.stock.value.set($event)"
          (blur)="form.fields.stock.touch()"
        />
      </div>

      <app-custom-select
        label="Category"
        [value]="form.fields.category.value()"
        [options]="categoryOptions"
        [error]="form.fields.category.error()"
        [touched]="form.fields.category.touched()"
        [required]="true"
        placeholder="Select category"
        (valueChange)="form.fields.category.value.set($event)"
        (blur)="form.fields.category.touch()"
      />

      <label class="checkbox-label">
        <input
          type="checkbox"
          [checked]="form.fields.featured.value()"
          (change)="form.fields.featured.value.set($any($event.target).checked)"
        />
        <span>Featured Product</span>
      </label>

      <div class="form-actions">
        <button type="button" class="btn btn-secondary" (click)="onCancel()">
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="!form.valid() || form.validating()"
        >
          {{ isEdit ? 'Update' : 'Create' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .product-form {
      max-width: 600px;
      padding: 24px;
      
      h2 {
        margin-bottom: 24px;
        font-size: 24px;
        font-weight: 600;
        color: #111827;
      }
      
      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 24px;
        cursor: pointer;
        
        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        span {
          font-size: 14px;
          color: #374151;
        }
      }
      
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
        
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          
          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          &.btn-primary {
            background: #3b82f6;
            color: white;
            
            &:hover:not(:disabled) {
              background: #2563eb;
            }
          }
          
          &.btn-secondary {
            background: #e5e7eb;
            color: #374151;
            
            &:hover {
              background: #d1d5db;
            }
          }
        }
      }
    }
  `]
})
export class ProductFormComponent {
  isEdit = false;

  private fields = [
    new StringField('name', 'Product Name', { 
      required: true, 
      min: 2, 
      max: 100 
    }),
    new StringField('description', 'Description', { 
      required: true, 
      max: 500 
    }),
    new IntegerField('price', 'Price', { 
      required: true, 
      min: 0 
    }),
    new IntegerField('stock', 'Stock', { 
      required: true, 
      min: 0 
    }),
    new EnumField('category', 'Category', [
      { id: 'electronics', label: 'Electronics' },
      { id: 'clothing', label: 'Clothing' },
      { id: 'home', label: 'Home & Garden' },
      { id: 'sports', label: 'Sports' },
    ], { required: true }),
    new BooleanField('featured', 'Featured', {
      yesLabel: 'Yes',
      noLabel: 'No',
    }),
  ];

  protected form = createEnhancedForm(this.fields, {
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    featured: false,
  });

  protected categoryOptions = [
    { id: 'electronics', label: 'Electronics' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'home', label: 'Home & Garden' },
    { id: 'sports', label: 'Sports' },
  ];

  async onSubmit() {
    if (await this.form.validateAll()) {
      const values = this.form.getValues();
      console.log('Product submitted:', values);
    }
  }

  onCancel() {
    this.form.reset();
  }
}

// ============================================================================
// 7. PRODUCT GRID COMPONENT
// ============================================================================

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="product-grid-container">
      <div class="header">
        <h1>Products</h1>
        <button class="btn btn-primary" (click)="openCreateForm()">
          + Add Product
        </button>
      </div>

      @if (store.signals.isLoading()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Loading products...</p>
        </div>
      }

      @if (store.signals.error()) {
        <div class="error">
          <p>{{ store.signals.error() }}</p>
          <button class="btn btn-secondary" (click)="store.loadAll()">
            Retry
          </button>
        </div>
      }

      @if (!store.signals.isLoading() && !store.signals.error()) {
        <div class="product-grid">
          @for (product of store.signals.all(); track product.id) {
            <div class="product-card">
              @if (product.featured) {
                <span class="badge featured">Featured</span>
              }
              <h3>{{ product.name }}</h3>
              <p class="description">{{ product.description }}</p>
              <div class="details">
                <span class="price">${{ product.price.toFixed(2) }}</span>
                <span class="stock">Stock: {{ product.stock }}</span>
              </div>
              <div class="actions">
                <button class="btn-icon" (click)="editProduct(product)">✏️</button>
                <button class="btn-icon" (click)="deleteProduct(product)">🗑️</button>
              </div>
            </div>
          }
        </div>

        <div class="pagination">
          <button 
            class="btn btn-secondary"
            [disabled]="!store.pagination.hasPrev()"
            (click)="store.prevPage()"
          >
            ← Previous
          </button>
          <span class="page-info">
            Page {{ store.pagination.page() }} of {{ store.pagination.totalPages() }}
          </span>
          <button 
            class="btn btn-secondary"
            [disabled]="!store.pagination.hasNext()"
            (click)="store.nextPage()"
          >
            Next →
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .product-grid-container {
      padding: 24px;
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        
        h1 {
          font-size: 28px;
          font-weight: 600;
          color: #111827;
        }
      }
      
      .loading, .error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        
        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      }
      
      .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 24px;
        margin-bottom: 32px;
        
        .product-card {
          position: relative;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          transition: all 0.2s;
          
          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .badge {
            position: absolute;
            top: 12px;
            right: 12px;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            
            &.featured {
              background: #fef3c7;
              color: #92400e;
            }
          }
          
          h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
            color: #111827;
          }
          
          .description {
            margin: 0 0 16px 0;
            font-size: 14px;
            color: #6b7280;
            line-height: 1.5;
          }
          
          .details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 16px;
            
            .price {
              font-size: 20px;
              font-weight: 700;
              color: #3b82f6;
            }
            
            .stock {
              font-size: 12px;
              color: #6b7280;
            }
          }
          
          .actions {
            display: flex;
            gap: 8px;
            
            .btn-icon {
              padding: 6px 12px;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              background: white;
              cursor: pointer;
              transition: all 0.2s;
              
              &:hover {
                background: #f9fafb;
              }
            }
          }
        }
      }
      
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 16px;
        
        .page-info {
          font-size: 14px;
          color: #6b7280;
        }
      }
      
      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        &.btn-primary {
          background: #3b82f6;
          color: white;
          
          &:hover:not(:disabled) {
            background: #2563eb;
          }
        }
        
        &.btn-secondary {
          background: #e5e7eb;
          color: #374151;
          
          &:hover:not(:disabled) {
            background: #d1d5db;
          }
        }
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ProductGridComponent implements OnInit {
  readonly store = inject(ProductStore);

  ngOnInit() {
    this.store.loadAll();
  }

  openCreateForm() {
    console.log('Open create form');
  }

  editProduct(product: Product) {
    console.log('Edit product:', product);
  }

  async deleteProduct(product: Product) {
    if (confirm(`Delete ${product.name}?`)) {
      try {
        await this.store.delete(product.id);
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  }
}

// ============================================================================
// 8. SUMMARY
// ============================================================================

/**
 * KEY TAKEAWAYS:
 * 
 * 1. ng-signalify provides the LOGIC (same as Material example):
 *    - Field definitions and validation
 *    - Form state management
 *    - Entity store with CRUD
 *    - API client
 * 
 * 2. YOU provide the UI:
 *    - Custom input components
 *    - Custom select components
 *    - Custom cards, grids, layouts
 *    - Complete design freedom
 * 
 * 3. Benefits of Headless:
 *    - ✅ Total design control
 *    - ✅ No UI library lock-in
 *    - ✅ Smaller bundle (no Material)
 *    - ✅ Use with any CSS framework (Tailwind, Bootstrap, etc.)
 *    - ✅ Use SigFormField wrapper for consistency
 * 
 * 4. Use Cases:
 *    - Custom design systems
 *    - Branded applications
 *    - Non-Material projects
 *    - Lightweight applications
 *    - Using other UI libraries (PrimeNG, Spartan, etc.)
 * 
 * 5. Migration from v1.x:
 *    - Form logic: UNCHANGED ✅
 *    - Store logic: UNCHANGED ✅
 *    - Build custom UI components OR use existing ones
 *    - Optional: Use SigFormField from components/core
 */
