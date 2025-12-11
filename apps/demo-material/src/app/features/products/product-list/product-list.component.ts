/**
 * TR: Ürün listesi bileşeni.
 * Material Table ile ürün listesini gösterir.
 *
 * EN: Product list component.
 * Displays product list with Material Table.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../shared/material.module';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ProductStore } from '../product.store';
import { Product } from '../product.model';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="product-list-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <div class="header-content">
              <h2>Products</h2>
              <button mat-raised-button color="primary" (click)="createProduct()">
                <mat-icon>add</mat-icon>
                New Product
              </button>
            </div>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Search Bar -->
          <div class="search-bar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search products</mat-label>
              <input
                matInput
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearch()"
                placeholder="Search by name, SKU, or description">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
          </div>

          <!-- Loading State -->
          <app-loading-spinner
            *ngIf="productStore.signals.isLoading()"
            [message]="'Loading products...'"
          />

          <!-- Error State -->
          <div *ngIf="productStore.signals.error()" class="error-message">
            <mat-icon color="warn">error</mat-icon>
            <p>{{ productStore.signals.error() }}</p>
            <button mat-raised-button (click)="loadProducts()">Retry</button>
          </div>

          <!-- Data Table -->
          <div *ngIf="!productStore.signals.isLoading() && !productStore.signals.error()" class="table-container">
            <table mat-table [dataSource]="products()" class="product-table">
              <!-- ID Column -->
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let product">{{ product.id }}</td>
              </ng-container>

              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let product">{{ product.name }}</td>
              </ng-container>

              <!-- SKU Column -->
              <ng-container matColumnDef="sku">
                <th mat-header-cell *matHeaderCellDef>SKU</th>
                <td mat-cell *matCellDef="let product">
                  <code>{{ product.sku }}</code>
                </td>
              </ng-container>

              <!-- Price Column -->
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Price</th>
                <td mat-cell *matCellDef="let product">
                  \${{ product.price.toFixed(2) }}
                </td>
              </ng-container>

              <!-- Discount Column -->
              <ng-container matColumnDef="discount">
                <th mat-header-cell *matHeaderCellDef>Discount</th>
                <td mat-cell *matCellDef="let product">
                  <mat-chip *ngIf="product.discount > 0" class="discount-chip">
                    {{ product.discount }}% OFF
                  </mat-chip>
                  <span *ngIf="product.discount === 0">-</span>
                </td>
              </ng-container>

              <!-- Stock Column -->
              <ng-container matColumnDef="stock">
                <th mat-header-cell *matHeaderCellDef>Stock</th>
                <td mat-cell *matCellDef="let product">
                  <mat-chip
                    [class.stock-low]="product.stockLevel < 50"
                    [class.stock-medium]="product.stockLevel >= 50 && product.stockLevel < 200"
                    [class.stock-high]="product.stockLevel >= 200">
                    {{ product.stockLevel }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let product">
                  <mat-chip
                    [class.status-active]="product.isActive"
                    [class.status-inactive]="!product.isActive">
                    {{ product.isActive ? 'Active' : 'Inactive' }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let product">
                  <button
                    mat-icon-button
                    color="primary"
                    (click)="editProduct(product.id)"
                    matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="deleteProduct(product.id)"
                    matTooltip="Delete">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Paginator -->
            <mat-paginator
              [length]="productStore.pagination.total()"
              [pageSize]="productStore.pagination.pageSize()"
              [pageSizeOptions]="[5, 10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons>
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .product-list-container {
      max-width: 1200px;
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

    .search-bar {
      margin: 1rem 0;
    }

    .search-field {
      width: 100%;
      max-width: 400px;
    }

    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      text-align: center;
    }

    .error-message mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
    }

    .table-container {
      overflow-x: auto;
    }

    .product-table {
      width: 100%;
      margin-top: 1rem;
    }

    code {
      background-color: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-size: 0.9em;
    }

    mat-chip {
      font-size: 12px;
      min-height: 24px;
    }

    .discount-chip {
      background-color: #ff5722 !important;
      color: white !important;
    }

    .stock-low {
      background-color: #f44336 !important;
      color: white !important;
    }

    .stock-medium {
      background-color: #ff9800 !important;
      color: white !important;
    }

    .stock-high {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .status-active {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .status-inactive {
      background-color: #9e9e9e !important;
      color: white !important;
    }

    mat-paginator {
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .search-field {
        max-width: 100%;
      }
    }
  `]
})
export class ProductListComponent implements OnInit {
  productStore = inject(ProductStore);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  searchTerm = '';
  displayedColumns = ['id', 'name', 'sku', 'price', 'discount', 'stock', 'status', 'actions'];

  products = computed(() => this.productStore.signals.all());

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.productStore.loadAll({
      page: 1,
      pageSize: 10
    });
  }

  onSearch() {
    this.productStore.loadAll({
      page: 1,
      pageSize: this.productStore.pagination.pageSize(),
      filters: { search: this.searchTerm }
    });
  }

  onPageChange(event: any) {
    this.productStore.loadAll({
      page: event.pageIndex + 1,
      pageSize: event.pageSize,
      filters: this.searchTerm ? { search: this.searchTerm } : undefined
    });
  }

  createProduct() {
    this.router.navigate(['/products/new']);
  }

  editProduct(id: number) {
    this.router.navigate(['/products/edit', id]);
  }

  async deleteProduct(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Product',
        message: 'Are you sure you want to delete this product? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    
    if (confirmed) {
      try {
        await this.productStore.delete(id);
        this.snackBar.open('Product deleted successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      } catch (error) {
        this.snackBar.open('Failed to delete product', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    }
  }
}
