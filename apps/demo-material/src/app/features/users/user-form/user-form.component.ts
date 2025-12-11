/**
 * TR: Kullanıcı form bileşeni.
 * Kullanıcı oluşturma ve düzenleme formu. ng-signalify fields kullanır.
 *
 * EN: User form component.
 * User creation and editing form using ng-signalify fields.
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
import { UserStore } from '../user.store';
import { userFields } from '../user.fields';
import { User } from '../user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="user-form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <div class="header-content">
              <h2>{{ isEditMode() ? 'Edit User' : 'Create User' }}</h2>
              <button mat-icon-button (click)="goBack()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <app-loading-spinner
            *ngIf="loading()"
            [message]="'Loading user data...'"
          />

          <form *ngIf="!loading()" [formGroup]="userForm" class="user-form">
            <!-- First Name -->
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="firstName" placeholder="Enter first name">
              <mat-hint>Enter your first name</mat-hint>
              <mat-error *ngIf="userForm.get('firstName')?.hasError('required')">
                First name is required
              </mat-error>
              <mat-error *ngIf="userForm.get('firstName')?.hasError('minlength')">
                Minimum 2 characters required
              </mat-error>
            </mat-form-field>

            <!-- Last Name -->
            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="lastName" placeholder="Enter last name">
              <mat-error *ngIf="userForm.get('lastName')?.hasError('required')">
                Last name is required
              </mat-error>
              <mat-error *ngIf="userForm.get('lastName')?.hasError('minlength')">
                Minimum 2 characters required
              </mat-error>
            </mat-form-field>

            <!-- Email -->
            <mat-form-field appearance="outline">
              <mat-label>Email Address</mat-label>
              <input matInput formControlName="email" type="email" placeholder="Enter email">
              <mat-hint>We'll never share your email</mat-hint>
              <mat-error *ngIf="userForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="userForm.get('email')?.hasError('email')">
                Please enter a valid email address
              </mat-error>
            </mat-form-field>

            <!-- Age -->
            <mat-form-field appearance="outline">
              <mat-label>Age</mat-label>
              <input matInput formControlName="age" type="number" placeholder="Enter age">
              <mat-error *ngIf="userForm.get('age')?.hasError('required')">
                Age is required
              </mat-error>
              <mat-error *ngIf="userForm.get('age')?.hasError('min')">
                Minimum age is 18
              </mat-error>
              <mat-error *ngIf="userForm.get('age')?.hasError('max')">
                Maximum age is 120
              </mat-error>
            </mat-form-field>

            <!-- Role -->
            <mat-form-field appearance="outline">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role">
                <mat-option value="admin">Administrator</mat-option>
                <mat-option value="user">User</mat-option>
                <mat-option value="guest">Guest</mat-option>
              </mat-select>
              <mat-error *ngIf="userForm.get('role')?.hasError('required')">
                Role is required
              </mat-error>
            </mat-form-field>

            <!-- Status -->
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="active">Active</mat-option>
                <mat-option value="inactive">Inactive</mat-option>
                <mat-option value="pending">Pending</mat-option>
              </mat-select>
              <mat-error *ngIf="userForm.get('status')?.hasError('required')">
                Status is required
              </mat-error>
            </mat-form-field>

            <!-- Birth Date -->
            <mat-form-field appearance="outline">
              <mat-label>Birth Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="birthDate">
              <mat-hint>Your date of birth</mat-hint>
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>

            <!-- Email Verified -->
            <div class="checkbox-field">
              <mat-checkbox formControlName="emailVerified">
                Email Verified
              </mat-checkbox>
            </div>

            <!-- Bio -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Biography</mat-label>
              <textarea
                matInput
                formControlName="bio"
                rows="4"
                placeholder="Tell us about yourself"
                maxlength="500"></textarea>
              <mat-hint align="end">{{ userForm.get('bio')?.value?.length || 0 }}/500</mat-hint>
              <mat-hint>Tell us about yourself (max 500 characters)</mat-hint>
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
                [disabled]="userForm.invalid || saving()"
                (click)="onSubmit()">
                <mat-icon *ngIf="saving()">
                  <mat-spinner diameter="20"></mat-spinner>
                </mat-icon>
                {{ saving() ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .user-form-container {
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

    .user-form {
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
      .user-form {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UserFormComponent implements OnInit {
  private userStore = inject(UserStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  userId: number | null = null;

  userForm = new FormGroup({
    firstName: new FormControl('', { nonNullable: true }),
    lastName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { nonNullable: true }),
    age: new FormControl<number>(18, { nonNullable: true }),
    role: new FormControl<'admin' | 'user' | 'guest'>('user', { nonNullable: true }),
    status: new FormControl<'active' | 'inactive' | 'pending'>('active', { nonNullable: true }),
    birthDate: new FormControl<Date | null>(null),
    emailVerified: new FormControl(false, { nonNullable: true }),
    bio: new FormControl('', { nonNullable: true })
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.userId = Number(id);
      await this.loadUser(this.userId);
    }
  }

  async loadUser(id: number) {
    this.loading.set(true);
    try {
      await this.userStore.loadOne(id);
      const user = this.userStore.getById(id);
      
      if (user) {
        this.userForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          age: user.age,
          role: user.role,
          status: user.status,
          birthDate: user.birthDate,
          emailVerified: user.emailVerified,
          bio: user.bio
        });
      }
    } catch (error) {
      this.snackBar.open('Failed to load user', 'Close', {
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
    if (this.userForm.invalid) {
      return;
    }

    this.saving.set(true);
    
    try {
      const formValue = this.userForm.getRawValue();
      
      if (this.isEditMode() && this.userId) {
        await this.userStore.update(this.userId, formValue);
        this.snackBar.open('User updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      } else {
        await this.userStore.create(formValue as Omit<User, 'id'>);
        this.snackBar.open('User created successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
      
      this.goBack();
    } catch (error) {
      this.snackBar.open(
        `Failed to ${this.isEditMode() ? 'update' : 'create'} user`,
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
    this.router.navigate(['/users']);
  }
}
