import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateId } from '../../../utils/a11y.utils';

@Component({
  selector: 'sig-form-field',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'sig-form-field',
    '[class.sig-form-field--error]': 'hasError()',
    '[class.sig-form-field--required]': 'required()',
    '[class.sig-form-field--disabled]': 'disabled()',
  },
  template: `
    <div class="sig-form-field__container">
      @if (label()) {
        <label 
          [for]="inputId()" 
          class="sig-form-field__label"
        >
          {{ label() }}
          @if (required()) {
            <span class="sig-form-field__required-indicator">*</span>
          }
        </label>
      }
      
      <div class="sig-form-field__content">
        <ng-content></ng-content>
      </div>
      
      @if (hasError()) {
        <div class="sig-form-field__error" role="alert">
          <span>⚠</span>
          <span>{{ error() }}</span>
        </div>
      }
      
      @if (hint() && !hasError()) {
        <div class="sig-form-field__hint">
          {{ hint() }}
          @if (showCharCount() && charCount() !== null && maxLength()) {
            <span class="sig-form-field__char-count">
              {{ charCount() }} / {{ maxLength() }}
            </span>
          }
        </div>
      }
      
      @if (loading()) {
        <div class="sig-form-field__loading">
          <span class="sig-form-field__spinner"></span>
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-form-field { display: block; margin-bottom: 1rem; }
    .sig-form-field__label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .sig-form-field__required-indicator { color: #ef4444; margin-left: 0.25rem; }
    .sig-form-field__error { color: #ef4444; font-size: 0.75rem; margin-top: 0.375rem; }
    .sig-form-field__hint { color: #6b7280; font-size: 0.75rem; margin-top: 0.375rem; }
    .sig-form-field__spinner { 
      display: inline-block; 
      width: 1rem; 
      height: 1rem; 
      border: 2px solid #8b5cf6;
      border-right-color: transparent;
      border-radius: 50%;
      will-change: transform;
      animation-name: spin;
      animation-duration: 0.6s;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SigFormFieldComponent {
  readonly label = input<string>('');
  readonly error = input<string | null>(null);
  readonly touched = input<boolean>(false);
  readonly hint = input<string>('');
  readonly required = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly inputId = input<string>(generateId('sig-input'));
  readonly showCharCount = input<boolean>(false);
  readonly charCount = input<number | null>(null);
  readonly maxLength = input<number | null>(null);
  
  readonly hasError = computed(() => !!this.error() && this.touched());
  readonly errorId = computed(() => `${this.inputId()}-error`);
  readonly hintId = computed(() => `${this.inputId()}-hint`);
}
