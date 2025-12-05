import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * FormField - Signal-based form field wrapper
 */
@Component({
  selector: 'sig-form-field',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-form-field"
      [class.sig-form-field--error]="showError()"
      [class.sig-form-field--disabled]="disabled()"
    >
      @if (label()) {
        <label class="sig-form-field__label">
          {{ label() }}
          @if (required()) {
            <span class="sig-form-field__required">*</span>
          }
        </label>
      }

      <div class="sig-form-field__control">
        <ng-content></ng-content>
        
        @if (loading()) {
          <span class="sig-form-field__loading">
            <span class="sig-form-field__spinner"></span>
          </span>
        }
      </div>

      @if (showError() && error()) {
        <div class="sig-form-field__error">
          {{ error() }}
        </div>
      } @else if (hint()) {
        <div class="sig-form-field__hint">
          {{ hint() }}
        </div>
      }

      @if (charCount() !== null && maxLength()) {
        <div class="sig-form-field__counter">
          {{ charCount() }} / {{ maxLength() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-form-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 1rem;
    }

    .sig-form-field__label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .sig-form-field__required {
      color: #ef4444;
      margin-left: 0.125rem;
    }

    .sig-form-field__control {
      position: relative;
      display: flex;
      align-items: center;
    }

    .sig-form-field__control ::ng-deep input,
    .sig-form-field__control ::ng-deep select,
    .sig-form-field__control ::ng-deep textarea {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .sig-form-field__control ::ng-deep input:focus,
    .sig-form-field__control ::ng-deep select:focus,
    .sig-form-field__control ::ng-deep textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .sig-form-field--error .sig-form-field__control ::ng-deep input,
    .sig-form-field--error .sig-form-field__control ::ng-deep select,
    .sig-form-field--error .sig-form-field__control ::ng-deep textarea {
      border-color: #ef4444;
    }

    .sig-form-field--error .sig-form-field__control ::ng-deep input:focus,
    .sig-form-field--error .sig-form-field__control ::ng-deep select:focus,
    .sig-form-field--error .sig-form-field__control ::ng-deep textarea:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .sig-form-field--disabled .sig-form-field__control ::ng-deep input,
    .sig-form-field--disabled .sig-form-field__control ::ng-deep select,
    .sig-form-field--disabled .sig-form-field__control ::ng-deep textarea {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }

    .sig-form-field__loading {
      position: absolute;
      right: 0.75rem;
    }

    .sig-form-field__spinner {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .sig-form-field__error {
      font-size: 0.75rem;
      color: #ef4444;
    }

    .sig-form-field__hint {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .sig-form-field__counter {
      font-size: 0.75rem;
      color: #9ca3af;
      text-align: right;
    }
  `],
})
export class FormFieldComponent {
  readonly label = input<string>('');
  readonly error = input<string | null>(null);
  readonly touched = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly hint = input<string>('');
  readonly charCount = input<number | null>(null);
  readonly maxLength = input<number | null>(null);

  readonly showError = computed(() => this.touched() && this.error() !== null);
}