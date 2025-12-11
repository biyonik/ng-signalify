/**
 * TR: Ürün form bileşeni.
 * Ürün oluşturma ve düzenleme formu.
 *
 * EN: Product form component.
 * Product creation and editing form.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../shared/material.module';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ProductStore } from '../product.store';
import { Product } from '../product.model';
import { productFields } from '../product.fields';
import { createEnhancedForm, EnhancedFormState } from 'ng-signalify/schemas';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="product-form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <div class="header-content">
              <h2>{{ isEditMode() ? 'Edit Product' : 'Create Product' }}</h2>
              <button mat-icon-button (click)="goBack()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <app-loading-spinner
            *ngIf="loading()"
            [message]="'Loading product data...'"
          />

          <form *ngIf="!loading()" class="product-form">
            <!-- Product Name -->
            <mat-form-field appearance="outline">
              <mat-label>Product Name</mat-label>
              <input 
                matInput 
                [value]="form.fields.name.value()"
                (input)="form.fields.name.value.set($any($event.target).value)"
                (blur)="form.fields.name.touched.set(true)"
                placeholder="Enter product name"
              />
              <mat-hint>Enter the product name</mat-hint>
              @if (form.fields.name.error() && form.fields.name.touched()) {
                <mat-error>{{ form.fields.name.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- SKU -->
            <mat-form-field appearance="outline">
              <mat-label>SKU</mat-label>
              <input 
                matInput 
                [value]="form.fields.sku.value()"
                (input)="form.fields.sku.value.set($any($event.target).value)"
                (blur)="form.fields.sku.touched.set(true)"
                placeholder="Enter SKU"
              />
              <mat-hint>Stock Keeping Unit</mat-hint>
              @if (form.fields.sku.error() && form.fields.sku.touched()) {
                <mat-error>{{ form.fields.sku.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Price -->
            <mat-form-field appearance="outline">
              <mat-label>Price</mat-label>
              <input 
                matInput 
                type="number" 
                step="0.01"
                [value]="form.fields.price.value()"
                (input)="form.fields.price.value.set(+$any($event.target).value)"
                (blur)="form.fields.price.touched.set(true)"
              />
              <span matTextPrefix>$&nbsp;</span>
              <mat-hint>Product price in USD</mat-hint>
              @if (form.fields.price.error() && form.fields.price.touched()) {
                <mat-error>{{ form.fields.price.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Discount -->
            <mat-form-field appearance="outline">
              <mat-label>Discount %</mat-label>
              <input 
                matInput 
                type="number"
                [value]="form.fields.discount.value()"
                (input)="form.fields.discount.value.set(+$any($event.target).value)"
                (blur)="form.fields.discount.touched.set(true)"
              />
              <span matTextSuffix>%</span>
              <mat-hint>Discount percentage (0-100)</mat-hint>
              @if (form.fields.discount.error() && form.fields.discount.touched()) {
                <mat-error>{{ form.fields.discount.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Categories -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Categories</mat-label>
              <mat-select 
                multiple
                [value]="form.fields.categories.value()"
                (selectionChange)="form.fields.categories.value.set($event.value)"
                (blur)="form.fields.categories.touched.set(true)"
              >
                <mat-option value="electronics">Electronics</mat-option>
                <mat-option value="clothing">Clothing</mat-option>
                <mat-option value="books">Books</mat-option>
                <mat-option value="home">Home & Garden</mat-option>
                <mat-option value="sports">Sports</mat-option>
                <mat-option value="toys">Toys</mat-option>
              </mat-select>
              @if (form.fields.categories.error() && form.fields.categories.touched()) {
                <mat-error>{{ form.fields.categories.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Tags -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tags</mat-label>
              <mat-select 
                multiple
                [value]="form.fields.tags.value()"
                (selectionChange)="form.fields.tags.value.set($event.value)"
                (blur)="form.fields.tags.touched.set(true)"
              >
                <mat-option value="new">New Arrival</mat-option>
                <mat-option value="sale">On Sale</mat-option>
                <mat-option value="featured">Featured</mat-option>
                <mat-option value="trending">Trending</mat-option>
                <mat-option value="bestseller">Best Seller</mat-option>
              </mat-select>
              @if (form.fields.tags.error() && form.fields.tags.touched()) {
                <mat-error>{{ form.fields.tags.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Stock Level -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Stock Level</mat-label>
              <mat-slider min="0" max="1000" step="10" discrete showTickMarks>
                <input 
                  matSliderThumb 
                  [value]="form.fields.stockLevel.value()"
                  (valueChange)="form.fields.stockLevel.value.set($event)"
                />
              </mat-slider>
              <mat-hint>Current stock: {{ form.fields.stockLevel.value() }}</mat-hint>
              @if (form.fields.stockLevel.error() && form.fields.stockLevel.touched()) {
                <mat-error>{{ form.fields.stockLevel.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Primary Color -->
            <mat-form-field appearance="outline">
              <mat-label>Primary Color</mat-label>
              <input 
                matInput 
                type="color"
                [value]="form.fields.primaryColor.value()"
                (input)="form.fields.primaryColor.value.set($any($event.target).value)"
                (blur)="form.fields.primaryColor.touched.set(true)"
              />
              <mat-hint>Main product color</mat-hint>
              @if (form.fields.primaryColor.error() && form.fields.primaryColor.touched()) {
                <mat-error>{{ form.fields.primaryColor.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Active Status -->
            <div class="checkbox-field">
              <mat-checkbox 
                [checked]="form.fields.isActive.value()"
                (change)="form.fields.isActive.value.set($event.checked)"
              >
                Product is active
              </mat-checkbox>
            </div>

            <!-- Description -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea
                matInput
                [value]="form.fields.description.value()"
                (input)="form.fields.description.value.set($any($event.target).value)"
                (blur)="form.fields.description.touched.set(true)"
                rows="4"
                placeholder="Enter product description"
                maxlength="1000"></textarea>
              <mat-hint align="end">{{ form.fields.description.value().length }}/1000</mat-hint>
              @if (form.fields.description.error() && form.fields.description.touched()) {
                <mat-error>{{ form.fields.description.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Form Actions -->
            <div class="form-actions">
              <button
                mat-raised-button
                type="button"
                (click)="goBack()">
                Cancel
              </button>
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="!form.valid() || saving()"
                (click)="onSubmit()">
                {{ saving() ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .product-form-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 1rem 0;
    }

    .header-content h2 {
      margin: 0;
    }

    .product-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      padding: 1rem 0;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .checkbox-field {
      grid-column: 1 / -1;
      padding: 0.5rem 0;
    }

    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }

    @media (max-width: 768px) {
      .product-form {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ProductFormComponent implements OnInit {
  private productStore = inject(ProductStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  productId: number | null = null;

  form!: EnhancedFormState<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'productImage'>>;

  constructor() {
    // Create form in constructor to ensure injection context for effect()
    this.form = createEnhancedForm(productFields, {
      name: '',
      sku: '',
      description: '',
      price: 0,
      discount: 0,
      categories: [] as string[],
      tags: [] as string[],
      stockLevel: 0,
      primaryColor: '#000000',
      isActive: true
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.productId = Number(id);
      await this.loadProduct(this.productId);
    }
  }

  async loadProduct(id: number) {
    this.loading.set(true);
    try {
      await this.productStore.loadOne(id);
      const product = this.productStore.getById(id);
      
      if (product) {
        this.form.patchValues({
          name: product.name,
          sku: product.sku,
          description: product.description,
          price: product.price,
          discount: product.discount,
          categories: product.categories,
          tags: product.tags,
          stockLevel: product.stockLevel,
          primaryColor: product.primaryColor,
          isActive: product.isActive
        });
      }
    } catch (error) {
      this.snackBar.open('Failed to load product', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    if (!this.form.valid()) {
      this.form.touchAll();
      this.snackBar.open('Please fix validation errors', 'Close', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    
    try {
      const data = this.form.getValues();
      
      if (this.isEditMode() && this.productId) {
        await this.productStore.update(this.productId, data);
        this.snackBar.open('Product updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      } else {
        await this.productStore.create(data as Omit<Product, 'id'>);
        this.snackBar.open('Product created successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
      
      this.goBack();
    } catch (error) {
      this.snackBar.open(
        `Failed to ${this.isEditMode() ? 'update' : 'create'} product`,
        'Close',
        {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        }
      );
    } finally {
      this.saving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/products']);
  }
}
