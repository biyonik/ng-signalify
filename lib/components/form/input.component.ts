import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';

export type InputType = 'text' | 'number' | 'email' | 'password' | 'tel' | 'url';

/**
 * SigInput - Text/Number input with signal support
 * 
 * Usage:
 * <sig-input
 *   type="email"
 *   [(value)]="email"
 *   placeholder="E-posta adresiniz"
 *   [disabled]="false"
 * />
 * 
 * Or with ngModel:
 * <sig-input type="text" [(ngModel)]="name" />
 */
@Component({
  selector: 'sig-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="sig-input" [class.sig-input--with-icon]="icon">
      @if (icon && iconPosition === 'left') {
        <span class="sig-input__icon sig-input__icon--left">{{ icon }}</span>
      }

      <input
        [type]="actualType()"
        [value]="value"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        [min]="min"
        [max]="max"
        [step]="step"
        [maxlength]="maxLength"
        [autocomplete]="autocomplete"
        (input)="onInput($event)"
        (blur)="onBlur()"
        (focus)="onFocus()"
        class="sig-input__field"
      />

      @if (type === 'password') {
        <button
          type="button"
          class="sig-input__toggle"
          (click)="togglePassword()"
          tabindex="-1"
        >
          {{ showPassword() ? '👁️' : '👁️‍🗨️' }}
        </button>
      }

      @if (clearable && value) {
        <button
          type="button"
          class="sig-input__clear"
          (click)="onClear()"
          tabindex="-1"
        >
          ✕
        </button>
      }

      @if (icon && iconPosition === 'right') {
        <span class="sig-input__icon sig-input__icon--right">{{ icon }}</span>
      }
    </div>
  `,
  styles: [`
    .sig-input {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .sig-input__field {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .sig-input--with-icon .sig-input__field {
      padding-left: 2.25rem;
    }

    .sig-input__field:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .sig-input__field:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }

    .sig-input__field::placeholder {
      color: #9ca3af;
    }

    .sig-input__icon {
      position: absolute;
      color: #9ca3af;
      font-size: 1rem;
    }

    .sig-input__icon--left {
      left: 0.75rem;
    }

    .sig-input__icon--right {
      right: 0.75rem;
    }

    .sig-input__toggle,
    .sig-input__clear {
      position: absolute;
      right: 0.5rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .sig-input__toggle:hover,
    .sig-input__clear:hover {
      color: #374151;
    }

    /* Number input arrows */
    .sig-input__field[type="number"]::-webkit-outer-spin-button,
    .sig-input__field[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .sig-input__field[type="number"] {
      -moz-appearance: textfield;
    }
  `],
})
export class SigInputComponent implements ControlValueAccessor {
  @Input() type: InputType = 'text';
  @Input() value: string | number = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() clearable = false;
  @Input() icon = '';
  @Input() iconPosition: 'left' | 'right' = 'left';
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() step: number | null = null;
  @Input() maxLength: number | null = null;
  @Input() autocomplete = 'off';

  @Output() valueChange = new EventEmitter<string | number>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  showPassword = signal(false);

  actualType = computed(() => {
    if (this.type === 'password' && this.showPassword()) {
      return 'text';
    }
    return this.type;
  });

  private onChange: (value: string | number) => void = () => {};
  private onTouched: () => void = () => {};

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = this.type === 'number' ? Number(target.value) : target.value;
    this.value = value;
    this.valueChange.emit(value);
    this.onChange(value);
  }

  onBlur() {
    this.onTouched();
    this.blur.emit();
  }

  onFocus() {
    this.focus.emit();
  }

  onClear() {
    this.value = '';
    this.valueChange.emit('');
    this.onChange('');
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }

  // ControlValueAccessor
  writeValue(value: string | number): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}