/**
 * TR: Kullanıcı listesi bileşeni.
 * Material Table, pagination, sorting, search ve CRUD işlemleri içerir.
 *
 * EN: User list component.
 * Contains Material Table, pagination, sorting, search, and CRUD operations.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../shared/material.module';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { UserStore } from '../user.store';
import { User } from '../user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="user-list-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <div class="header-content">
              <h2>Users</h2>
              <button mat-raised-button color="primary" (click)="createUser()">
                <mat-icon>add</mat-icon>
                New User
              </button>
            </div>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Search Bar -->
          <div class="search-bar">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search users</mat-label>
              <input
                matInput
                [(ngModel)]="searchTerm"
                (ngModelChange)="onSearch()"
                placeholder="Search by name or email">
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>
          </div>

          <!-- Loading State -->
          <app-loading-spinner
            *ngIf="userStore.loading()"
            [message]="'Loading users...'"
          />

          <!-- Error State -->
          <div *ngIf="userStore.error()" class="error-message">
            <mat-icon color="warn">error</mat-icon>
            <p>{{ userStore.error() }}</p>
            <button mat-raised-button (click)="loadUsers()">Retry</button>
          </div>

          <!-- Data Table -->
          <div *ngIf="!userStore.loading() && !userStore.error()" class="table-container">
            <table mat-table [dataSource]="users()" class="user-table">
              <!-- ID Column -->
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let user">{{ user.id }}</td>
              </ng-container>

              <!-- First Name Column -->
              <ng-container matColumnDef="firstName">
                <th mat-header-cell *matHeaderCellDef>First Name</th>
                <td mat-cell *matCellDef="let user">{{ user.firstName }}</td>
              </ng-container>

              <!-- Last Name Column -->
              <ng-container matColumnDef="lastName">
                <th mat-header-cell *matHeaderCellDef>Last Name</th>
                <td mat-cell *matCellDef="let user">{{ user.lastName }}</td>
              </ng-container>

              <!-- Email Column -->
              <ng-container matColumnDef="email">
                <th mat-header-cell *matHeaderCellDef>Email</th>
                <td mat-cell *matCellDef="let user">{{ user.email }}</td>
              </ng-container>

              <!-- Role Column -->
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Role</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip [highlighted]="user.role === 'admin'">
                    {{ user.role | titlecase }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let user">
                  <mat-chip 
                    [class.status-active]="user.status === 'active'"
                    [class.status-inactive]="user.status === 'inactive'"
                    [class.status-pending]="user.status === 'pending'">
                    {{ user.status | titlecase }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let user">
                  <button
                    mat-icon-button
                    color="primary"
                    (click)="editUser(user.id)"
                    matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="deleteUser(user.id)"
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
              [length]="userStore.total()"
              [pageSize]="userStore.pageSize()"
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
    .user-list-container {
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

    .user-table {
      width: 100%;
      margin-top: 1rem;
    }

    mat-chip {
      font-size: 12px;
      min-height: 24px;
    }

    .status-active {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .status-inactive {
      background-color: #f44336 !important;
      color: white !important;
    }

    .status-pending {
      background-color: #ff9800 !important;
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
export class UserListComponent implements OnInit {
  userStore = inject(UserStore);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  searchTerm = '';
  displayedColumns = ['id', 'firstName', 'lastName', 'email', 'role', 'status', 'actions'];

  users = computed(() => this.userStore.entities());

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userStore.loadAll({
      page: 1,
      pageSize: 10
    });
  }

  onSearch() {
    this.userStore.loadAll({
      page: 1,
      pageSize: this.userStore.pageSize(),
      filters: { search: this.searchTerm }
    });
  }

  onPageChange(event: any) {
    this.userStore.loadAll({
      page: event.pageIndex + 1,
      pageSize: event.pageSize,
      filters: this.searchTerm ? { search: this.searchTerm } : undefined
    });
  }

  createUser() {
    this.router.navigate(['/users/new']);
  }

  editUser(id: number) {
    this.router.navigate(['/users/edit', id]);
  }

  async deleteUser(id: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete User',
        message: 'Are you sure you want to delete this user? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    
    if (confirmed) {
      try {
        await this.userStore.delete(id);
        this.snackBar.open('User deleted successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      } catch (error) {
        this.snackBar.open('Failed to delete user', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    }
  }
}
