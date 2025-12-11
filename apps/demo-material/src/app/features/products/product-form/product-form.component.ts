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
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../shared/material.module';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ProductStore } from '../product.store';
import { Product } from '../product.model';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
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

          <form *ngIf="!loading()" [formGroup]="productForm" class="product-form">
            <!-- Product Name -->
            <mat-form-field appearance="outline">
              <mat-label>Product Name</mat-label>
              <input matInput formControlName="name" placeholder="Enter product name">
              <mat-hint>Enter the product name</mat-hint>
              <mat-error *ngIf="productForm.get('name')?.hasError('required')">
                Product name is required
              </mat-error>
            </mat-form-field>

            <!-- SKU -->
            <mat-form-field appearance="outline">
              <mat-label>SKU</mat-label>
              <input matInput formControlName="sku" placeholder="Enter SKU">
              <mat-hint>Stock Keeping Unit</mat-hint>
              <mat-error *ngIf="productForm.get('sku')?.hasError('required')">
                SKU is required
              </mat-error>
            </mat-form-field>

            <!-- Price -->
            <mat-form-field appearance="outline">
              <mat-label>Price</mat-label>
              <input matInput formControlName="price" type="number" step="0.01">
              <span matTextPrefix>$&nbsp;</span>
              <mat-hint>Product price in USD</mat-hint>
              <mat-error *ngIf="productForm.get('price')?.hasError('required')">
                Price is required
              </mat-error>
            </mat-form-field>

            <!-- Discount -->
            <mat-form-field appearance="outline">
              <mat-label>Discount %</mat-label>
              <input matInput formControlName="discount" type="number">
              <span matTextSuffix>%</span>
              <mat-hint>Discount percentage (0-100)</mat-hint>
            </mat-form-field>

            <!-- Categories -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Categories</mat-label>
              <mat-select formControlName="categories" multiple>
                <mat-option value="electronics">Electronics</mat-option>
                <mat-option value="clothing">Clothing</mat-option>
                <mat-option value="books">Books</mat-option>
                <mat-option value="home">Home & Garden</mat-option>
                <mat-option value="sports">Sports</mat-option>
                <mat-option value="toys">Toys</mat-option>
              </mat-select>
              <mat-error *ngIf="productForm.get('categories')?.hasError('required')">
                At least one category is required
              </mat-error>
            </mat-form-field>

            <!-- Tags -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tags</mat-label>
              <mat-select formControlName="tags" multiple>
                <mat-option value="new">New Arrival</mat-option>
                <mat-option value="sale">On Sale</mat-option>
                <mat-option value="featured">Featured</mat-option>
                <mat-option value="trending">Trending</mat-option>
                <mat-option value="bestseller">Best Seller</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Stock Level -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Stock Level</mat-label>
              <mat-slider min="0" max="1000" step="10" discrete showTickMarks>
                <input matSliderThumb formControlName="stockLevel">
              </mat-slider>
              <mat-hint>Current stock: {{ productForm.get('stockLevel')?.value }}</mat-hint>
            </mat-form-field>

            <!-- Primary Color -->
            <mat-form-field appearance="outline">
              <mat-label>Primary Color</mat-label>
              <input matInput formControlName="primaryColor" type="color">
              <mat-hint>Main product color</mat-hint>
            </mat-form-field>

            <!-- Active Status -->
            <div class="checkbox-field">
              <mat-checkbox formControlName="isActive">
                Product is active
              </mat-checkbox>
            </div>

            <!-- Description -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Description</mat-label>
              <textarea
                matInput
                formControlName="description"
                rows="4"
                placeholder="Enter product description"
                maxlength="1000"></textarea>
              <mat-hint align="end">{{ productForm.get('description')?.value?.length || 0 }}/1000</mat-hint>
              <mat-error *ngIf="productForm.get('description')?.hasError('required')">
                Description is required
              </mat-error>
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
                [disabled]="productForm.invalid || saving()"
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

  productForm = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    sku: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    price: new FormControl<number>(0, { nonNullable: true }),
    discount: new FormControl<number>(0, { nonNullable: true }),
    categories: new FormControl<string[]>([], { nonNullable: true }),
    tags: new FormControl<string[]>([], { nonNullable: true }),
    stockLevel: new FormControl<number>(0, { nonNullable: true }),
    primaryColor: new FormControl('#000000', { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true })
  });

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
        this.productForm.patchValue({
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
    if (this.productForm.invalid) {
      return;
    }

    this.saving.set(true);
    
    try {
      const formValue = this.productForm.getRawValue();
      
      if (this.isEditMode() && this.productId) {
        await this.productStore.update(this.productId, formValue);
        this.snackBar.open('Product updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      } else {
        await this.productStore.create(formValue as Omit<Product, 'id'>);
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
