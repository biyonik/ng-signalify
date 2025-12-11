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
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from '../../../shared/material.module';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { UserStore } from '../user.store';
import { userFields } from '../user.fields';
import { User } from '../user.model';
import { createEnhancedForm } from 'ng-signalify/schemas';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
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

          <form *ngIf="!loading()" class="user-form">
            <!-- First Name -->
            <mat-form-field appearance="outline">
              <mat-label>{{ form.fields.firstName.label }}</mat-label>
              <input 
                matInput 
                [value]="form.fields.firstName.value()"
                (input)="form.fields.firstName.value.set($any($event.target).value)"
                (blur)="form.fields.firstName.touch()"
                placeholder="Enter first name"
              />
              @if (form.fields.firstName.hint) {
                <mat-hint>{{ form.fields.firstName.hint }}</mat-hint>
              }
              @if (form.fields.firstName.error() && form.fields.firstName.touched()) {
                <mat-error>{{ form.fields.firstName.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Last Name -->
            <mat-form-field appearance="outline">
              <mat-label>{{ form.fields.lastName.label }}</mat-label>
              <input 
                matInput 
                [value]="form.fields.lastName.value()"
                (input)="form.fields.lastName.value.set($any($event.target).value)"
                (blur)="form.fields.lastName.touch()"
                placeholder="Enter last name"
              />
              @if (form.fields.lastName.error() && form.fields.lastName.touched()) {
                <mat-error>{{ form.fields.lastName.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Email -->
            <mat-form-field appearance="outline">
              <mat-label>{{ form.fields.email.label }}</mat-label>
              <input 
                matInput 
                type="email"
                [value]="form.fields.email.value()"
                (input)="form.fields.email.value.set($any($event.target).value)"
                (blur)="form.fields.email.touch()"
                placeholder="Enter email"
              />
              @if (form.fields.email.hint) {
                <mat-hint>{{ form.fields.email.hint }}</mat-hint>
              }
              @if (form.fields.email.error() && form.fields.email.touched()) {
                <mat-error>{{ form.fields.email.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Age -->
            <mat-form-field appearance="outline">
              <mat-label>{{ form.fields.age.label }}</mat-label>
              <input 
                matInput 
                type="number"
                [value]="form.fields.age.value()"
                (input)="form.fields.age.value.set(+$any($event.target).value)"
                (blur)="form.fields.age.touch()"
                placeholder="Enter age"
              />
              @if (form.fields.age.error() && form.fields.age.touched()) {
                <mat-error>{{ form.fields.age.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Role -->
            <mat-form-field appearance="outline">
              <mat-label>{{ form.fields.role.label }}</mat-label>
              <mat-select 
                [value]="form.fields.role.value()"
                (selectionChange)="form.fields.role.value.set($event.value)"
                (blur)="form.fields.role.touch()"
              >
                <mat-option value="admin">Administrator</mat-option>
                <mat-option value="user">User</mat-option>
                <mat-option value="guest">Guest</mat-option>
              </mat-select>
              @if (form.fields.role.error() && form.fields.role.touched()) {
                <mat-error>{{ form.fields.role.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Status -->
            <mat-form-field appearance="outline">
              <mat-label>{{ form.fields.status.label }}</mat-label>
              <mat-select 
                [value]="form.fields.status.value()"
                (selectionChange)="form.fields.status.value.set($event.value)"
                (blur)="form.fields.status.touch()"
              >
                <mat-option value="active">Active</mat-option>
                <mat-option value="inactive">Inactive</mat-option>
                <mat-option value="pending">Pending</mat-option>
              </mat-select>
              @if (form.fields.status.error() && form.fields.status.touched()) {
                <mat-error>{{ form.fields.status.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Birth Date -->
            <mat-form-field appearance="outline">
              <mat-label>{{ form.fields.birthDate.label }}</mat-label>
              <input 
                matInput 
                [matDatepicker]="picker"
                [value]="form.fields.birthDate.value()"
                (dateChange)="form.fields.birthDate.value.set($event.value)"
                (blur)="form.fields.birthDate.touch()"
              />
              @if (form.fields.birthDate.hint) {
                <mat-hint>{{ form.fields.birthDate.hint }}</mat-hint>
              }
              <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              @if (form.fields.birthDate.error() && form.fields.birthDate.touched()) {
                <mat-error>{{ form.fields.birthDate.error() }}</mat-error>
              }
            </mat-form-field>

            <!-- Email Verified -->
            <div class="checkbox-field">
              <mat-checkbox 
                [checked]="form.fields.emailVerified.value()"
                (change)="form.fields.emailVerified.value.set($event.checked)"
              >
                {{ form.fields.emailVerified.label }}
              </mat-checkbox>
            </div>

            <!-- Bio -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ form.fields.bio.label }}</mat-label>
              <textarea
                matInput
                [value]="form.fields.bio.value()"
                (input)="form.fields.bio.value.set($any($event.target).value)"
                (blur)="form.fields.bio.touch()"
                rows="4"
                placeholder="Tell us about yourself"
                maxlength="500"></textarea>
              <mat-hint align="end">{{ form.fields.bio.value()?.length || 0 }}/500</mat-hint>
              @if (form.fields.bio.hint) {
                <mat-hint>{{ form.fields.bio.hint }}</mat-hint>
              }
              @if (form.fields.bio.error() && form.fields.bio.touched()) {
                <mat-error>{{ form.fields.bio.error() }}</mat-error>
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

  form = createEnhancedForm(userFields, {
    firstName: '',
    lastName: '',
    email: '',
    age: 18,
    role: 'user',
    status: 'active',
    birthDate: null,
    emailVerified: false,
    bio: ''
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
        this.form.patchValues({
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
    if (!this.form.valid()) {
      this.form.touchAll();
      this.snackBar.open('Please fix validation errors', 'Close', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    
    try {
      const data = this.form.getValues();
      
      if (this.isEditMode() && this.userId) {
        await this.userStore.update(this.userId, data);
        this.snackBar.open('User updated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      } else {
        await this.userStore.create(data as Omit<User, 'id'>);
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
