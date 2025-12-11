/**
 * ng-signalify v2.0 - Material Adapter Example
 * 
 * This example demonstrates how to use ng-signalify with Angular Material.
 * It shows a complete CRUD application with forms, validation, and state management.
 */

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationConfig } from '@angular/core';

// Material imports
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ng-signalify imports
import { StringField, IntegerField, EnumField } from 'ng-signalify/fields';
import { createEnhancedForm } from 'ng-signalify/schemas';
import { EntityStore, PaginatedResponse, FetchParams, EntityId } from 'ng-signalify/store';
import { createHttpClient } from 'ng-signalify/api';
import { provideSigUI, MaterialAdapter } from 'ng-signalify/adapters';

// ============================================================================
// 1. APP CONFIGURATION
// ============================================================================

export const appConfig: ApplicationConfig = {
  providers: [
    // Register Material adapter for ng-signalify
    provideSigUI(new MaterialAdapter()),
    // ... other providers
  ]
};

// ============================================================================
// 2. DOMAIN MODELS
// ============================================================================

interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive';
}

interface CreateUserDto {
  name: string;
  email: string;
  age: number;
  role: string;
}

interface UpdateUserDto {
  name?: string;
  email?: string;
  age?: number;
  role?: string;
  status?: string;
}

// ============================================================================
// 3. ENTITY STORE
// ============================================================================

const http = createHttpClient({
  baseUrl: 'https://api.example.com',
  timeout: 30000,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
});

class UserStore extends EntityStore<User, CreateUserDto, UpdateUserDto> {
  constructor() {
    super({
      name: 'users',
      selectId: (user) => user.id,
      defaultPageSize: 10,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      optimistic: true,
    });
  }

  protected async fetchAll(params: FetchParams): Promise<PaginatedResponse<User>> {
    const response = await http.get<PaginatedResponse<User>>('/api/users', { params });
    return response.data;
  }

  protected async fetchOne(id: EntityId): Promise<User> {
    const response = await http.get<User>(`/api/users/${id}`);
    return response.data;
  }

  protected async createOne(data: CreateUserDto): Promise<User> {
    const response = await http.post<User>('/api/users', { body: data });
    return response.data;
  }

  protected async updateOne(id: EntityId, data: UpdateUserDto): Promise<User> {
    const response = await http.patch<User>(`/api/users/${id}`, { body: data });
    return response.data;
  }

  protected async deleteOne(id: EntityId): Promise<void> {
    await http.delete(`/api/users/${id}`);
  }
}

// ============================================================================
// 4. FORM COMPONENT
// ============================================================================

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <form (ngSubmit)="onSubmit()" class="user-form">
      <h2>{{ isEdit ? 'Edit User' : 'Create User' }}</h2>

      <!-- Name Field -->
      <mat-form-field appearance="outline">
        <mat-label>Full Name</mat-label>
        <input
          matInput
          [value]="form.fields.name.value()"
          (input)="form.fields.name.value.set($any($event.target).value)"
          (blur)="form.fields.name.touch()"
          placeholder="Enter full name"
        />
        @if (form.fields.name.error() && form.fields.name.touched()) {
          <mat-error>{{ form.fields.name.error() }}</mat-error>
        }
        @if (form.fields.name.asyncValidating()) {
          <mat-hint>Checking...</mat-hint>
        }
      </mat-form-field>

      <!-- Email Field -->
      <mat-form-field appearance="outline">
        <mat-label>Email Address</mat-label>
        <input
          matInput
          type="email"
          [value]="form.fields.email.value()"
          (input)="form.fields.email.value.set($any($event.target).value)"
          (blur)="form.fields.email.touch()"
          placeholder="user@example.com"
        />
        @if (form.fields.email.error() && form.fields.email.touched()) {
          <mat-error>{{ form.fields.email.error() }}</mat-error>
        }
      </mat-form-field>

      <!-- Age Field -->
      <mat-form-field appearance="outline">
        <mat-label>Age</mat-label>
        <input
          matInput
          type="number"
          [value]="form.fields.age.value()"
          (input)="form.fields.age.value.set(+$any($event.target).value)"
          (blur)="form.fields.age.touch()"
          placeholder="18"
        />
        @if (form.fields.age.error() && form.fields.age.touched()) {
          <mat-error>{{ form.fields.age.error() }}</mat-error>
        }
      </mat-form-field>

      <!-- Role Field -->
      <mat-form-field appearance="outline">
        <mat-label>Role</mat-label>
        <mat-select
          [value]="form.fields.role.value()"
          (selectionChange)="form.fields.role.value.set($event.value)"
        >
          @for (role of roleOptions; track role.id) {
            <mat-option [value]="role.id">{{ role.label }}</mat-option>
          }
        </mat-select>
        @if (form.fields.role.error() && form.fields.role.touched()) {
          <mat-error>{{ form.fields.role.error() }}</mat-error>
        }
      </mat-form-field>

      <!-- Actions -->
      <div class="form-actions">
        <button mat-button type="button" (click)="onCancel()">
          Cancel
        </button>
        <button
          mat-raised-button
          color="primary"
          type="submit"
          [disabled]="!form.valid() || form.validating()"
        >
          {{ isEdit ? 'Update' : 'Create' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .user-form {
      padding: 24px;
      max-width: 600px;
      
      mat-form-field {
        width: 100%;
        margin-bottom: 16px;
      }
      
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
      }
    }
  `]
})
export class UserFormComponent {
  isEdit = false;
  
  // Field definitions
  private fields = [
    new StringField('name', 'Full Name', { 
      required: true, 
      min: 2, 
      max: 100 
    }),
    new StringField('email', 'Email', { 
      required: true, 
      email: true 
    }),
    new IntegerField('age', 'Age', { 
      required: true, 
      min: 18, 
      max: 120 
    }),
    new EnumField('role', 'Role', {
      required: true,
      options: [
        { id: 'admin', label: 'Administrator' },
        { id: 'user', label: 'User' },
        { id: 'guest', label: 'Guest' },
      ]
    }),
  ];

  // Create form with ng-signalify
  protected form = createEnhancedForm(this.fields, {
    name: '',
    email: '',
    age: 18,
    role: 'user'
  });

  protected roleOptions = [
    { id: 'admin', label: 'Administrator' },
    { id: 'user', label: 'User' },
    { id: 'guest', label: 'Guest' },
  ];

  async onSubmit() {
    if (await this.form.validateAll()) {
      const values = this.form.getValues();
      console.log('Form submitted:', values);
      // Handle submission
    }
  }

  onCancel() {
    this.form.reset();
  }
}

// ============================================================================
// 5. LIST COMPONENT
// ============================================================================

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="user-list">
      <div class="header">
        <h1>Users</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Add User
        </button>
      </div>

      @if (store.signals.isLoading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
        </div>
      }

      @if (store.signals.error()) {
        <div class="error-container">
          <p>{{ store.signals.error() }}</p>
          <button mat-button (click)="store.loadAll()">Retry</button>
        </div>
      }

      @if (!store.signals.isLoading() && !store.signals.error()) {
        <table mat-table [dataSource]="store.signals.all()" class="user-table">
          <!-- ID Column -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let user">{{ user.id }}</td>
          </ng-container>

          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let user">{{ user.name }}</td>
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
              <span class="role-badge" [attr.data-role]="user.role">
                {{ user.role }}
              </span>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let user">
              <span class="status-badge" [attr.data-status]="user.status">
                {{ user.status }}
              </span>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let user">
              <button mat-icon-button (click)="editUser(user)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteUser(user)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator
          [length]="store.pagination.total()"
          [pageSize]="store.pagination.pageSize()"
          [pageIndex]="store.pagination.page() - 1"
          [pageSizeOptions]="[5, 10, 25, 50]"
          (page)="onPageChange($event)"
        />
      }
    </div>
  `,
  styles: [`
    .user-list {
      padding: 24px;
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
      }
      
      .loading-container,
      .error-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
      }
      
      .user-table {
        width: 100%;
        
        .role-badge,
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .role-badge[data-role="admin"] { background: #e3f2fd; color: #1976d2; }
        .role-badge[data-role="user"] { background: #f3e5f5; color: #7b1fa2; }
        .role-badge[data-role="guest"] { background: #f5f5f5; color: #616161; }
        
        .status-badge[data-status="active"] { background: #e8f5e9; color: #2e7d32; }
        .status-badge[data-status="inactive"] { background: #ffebee; color: #c62828; }
      }
    }
  `]
})
export class UserListComponent implements OnInit {
  readonly store = inject(UserStore);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['id', 'name', 'email', 'role', 'status', 'actions'];

  ngOnInit() {
    this.store.loadAll();
  }

  openCreateDialog() {
    // Open Material dialog with UserFormComponent
    // Implementation depends on your dialog setup
    this.snackBar.open('Create user dialog would open here', 'Close', { duration: 3000 });
  }

  editUser(user: User) {
    // Open edit dialog
    this.snackBar.open(`Editing user: ${user.name}`, 'Close', { duration: 2000 });
  }

  async deleteUser(user: User) {
    if (confirm(`Delete user ${user.name}?`)) {
      try {
        await this.store.delete(user.id);
        this.snackBar.open('User deleted successfully', 'Close', { duration: 3000 });
      } catch (error) {
        this.snackBar.open('Failed to delete user', 'Close', { duration: 3000 });
      }
    }
  }

  onPageChange(event: any) {
    const page = event.pageIndex + 1;
    const pageSize = event.pageSize;
    this.store.setPageSize(pageSize);
    this.store.goToPage(page);
  }
}

// ============================================================================
// 6. SUMMARY
// ============================================================================

/**
 * KEY TAKEAWAYS:
 * 
 * 1. ng-signalify provides the LOGIC:
 *    - Field definitions (StringField, IntegerField, EnumField)
 *    - Form state management (createEnhancedForm)
 *    - Entity store (UserStore with CRUD operations)
 *    - API client (createHttpClient)
 * 
 * 2. Angular Material provides the UI:
 *    - Input components (mat-input, mat-select)
 *    - Form field wrapper (mat-form-field)
 *    - Table (mat-table)
 *    - Pagination (mat-paginator)
 *    - Dialogs, Snackbars, Icons
 * 
 * 3. Benefits:
 *    - ✅ Full type safety from ng-signalify
 *    - ✅ Reactive signals for everything
 *    - ✅ Professional UI from Material
 *    - ✅ Separation of concerns (logic vs UI)
 *    - ✅ Smaller bundle (Material is tree-shakeable)
 *    - ✅ Use any Material component
 * 
 * 4. Migration from v1.x:
 *    - Form logic code: UNCHANGED ✅
 *    - Store logic code: UNCHANGED ✅
 *    - Only template/UI changes needed
 */
