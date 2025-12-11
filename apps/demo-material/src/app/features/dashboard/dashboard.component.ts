/**
 * TR: Dashboard bileşeni.
 * İstatistik kartları ve özet bilgileri gösterir.
 *
 * EN: Dashboard component.
 * Displays stats cards and summary information.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { UserStore } from '../users/user.store';
import { ProductStore } from '../products/product.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard</h1>
      
      <div class="stats-grid">
        <!-- Total Users Card -->
        <mat-card class="stat-card">
          <mat-card-header>
            <div class="card-header-content">
              <div class="icon-container primary">
                <mat-icon>people</mat-icon>
              </div>
              <div class="stat-info">
                <h3>Total Users</h3>
                <p class="stat-value">{{ totalUsers() }}</p>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <button mat-button color="primary" (click)="navigateToUsers()">
              View All
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </mat-card-content>
        </mat-card>

        <!-- Total Products Card -->
        <mat-card class="stat-card">
          <mat-card-header>
            <div class="card-header-content">
              <div class="icon-container accent">
                <mat-icon>inventory_2</mat-icon>
              </div>
              <div class="stat-info">
                <h3>Total Products</h3>
                <p class="stat-value">{{ totalProducts() }}</p>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <button mat-button color="primary" (click)="navigateToProducts()">
              View All
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </mat-card-content>
        </mat-card>

        <!-- Active Users Card -->
        <mat-card class="stat-card">
          <mat-card-header>
            <div class="card-header-content">
              <div class="icon-container success">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="stat-info">
                <h3>Active Users</h3>
                <p class="stat-value">{{ activeUsers() }}</p>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <p class="stat-description">Users with active status</p>
          </mat-card-content>
        </mat-card>

        <!-- Total Stock Card -->
        <mat-card class="stat-card">
          <mat-card-header>
            <div class="card-header-content">
              <div class="icon-container warning">
                <mat-icon>warehouse</mat-icon>
              </div>
              <div class="stat-info">
                <h3>Total Stock</h3>
                <p class="stat-value">{{ totalStock() }}</p>
              </div>
            </div>
          </mat-card-header>
          <mat-card-content>
            <p class="stat-description">Items in inventory</p>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Welcome Card -->
      <mat-card class="welcome-card">
        <mat-card-header>
          <mat-card-title>
            <h2>Welcome to ng-signalify Material Demo</h2>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>
            This demo application showcases the integration of <strong>ng-signalify</strong> with 
            <strong>Angular Material</strong>. Explore the following features:
          </p>
          
          <mat-list>
            <mat-list-item>
              <mat-icon matListItemIcon>check</mat-icon>
              <div matListItemTitle>Full CRUD operations for Users and Products</div>
              <div matListItemLine>Create, Read, Update, and Delete entities with ease</div>
            </mat-list-item>
            
            <mat-list-item>
              <mat-icon matListItemIcon>check</mat-icon>
              <div matListItemTitle>Material Table with Pagination & Sorting</div>
              <div matListItemLine>Efficient data display and navigation</div>
            </mat-list-item>
            
            <mat-list-item>
              <mat-icon matListItemIcon>check</mat-icon>
              <div matListItemTitle>Form Validation & Error Handling</div>
              <div matListItemLine>Comprehensive validation using ng-signalify fields</div>
            </mat-list-item>
            
            <mat-list-item>
              <mat-icon matListItemIcon>check</mat-icon>
              <div matListItemTitle>Loading States & Error Messages</div>
              <div matListItemLine>User-friendly feedback during async operations</div>
            </mat-list-item>
            
            <mat-list-item>
              <mat-icon matListItemIcon>check</mat-icon>
              <div matListItemTitle>Responsive Design</div>
              <div matListItemLine>Works seamlessly on all device sizes</div>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="navigateToFieldExamples()">
            <mat-icon>widgets</mat-icon>
            Explore Field Examples
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin: 0 0 2rem 0;
      font-size: 2rem;
      font-weight: 500;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .card-header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
    }

    .icon-container {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-container mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
    }

    .icon-container.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .icon-container.accent {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .icon-container.success {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .icon-container.warning {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }

    .stat-info h3 {
      margin: 0;
      font-size: 0.875rem;
      color: rgba(0, 0, 0, 0.6);
      font-weight: 500;
    }

    .stat-value {
      margin: 0.25rem 0 0 0;
      font-size: 2rem;
      font-weight: 600;
      color: rgba(0, 0, 0, 0.87);
    }

    .stat-description {
      color: rgba(0, 0, 0, 0.6);
      font-size: 0.875rem;
      margin: 0;
    }

    .welcome-card {
      margin-top: 2rem;
    }

    .welcome-card h2 {
      margin: 0;
      font-size: 1.5rem;
    }

    .welcome-card p {
      line-height: 1.6;
      color: rgba(0, 0, 0, 0.87);
    }

    mat-list {
      margin: 1rem 0;
    }

    mat-list-item {
      margin-bottom: 0.5rem;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private userStore = inject(UserStore);
  private productStore = inject(ProductStore);
  private router = inject(Router);

  totalUsers = computed(() => this.userStore.total());
  totalProducts = computed(() => this.productStore.total());
  
  activeUsers = computed(() => {
    return this.userStore.entities().filter(u => u.status === 'active').length;
  });
  
  totalStock = computed(() => {
    return this.productStore.entities().reduce((sum, p) => sum + p.stockLevel, 0);
  });

  ngOnInit() {
    // Load initial data
    this.userStore.loadAll({ page: 1, pageSize: 100 });
    this.productStore.loadAll({ page: 1, pageSize: 100 });
  }

  navigateToUsers() {
    this.router.navigate(['/users']);
  }

  navigateToProducts() {
    this.router.navigate(['/products']);
  }

  navigateToFieldExamples() {
    this.router.navigate(['/field-examples']);
  }
}
