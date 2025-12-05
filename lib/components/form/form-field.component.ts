import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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