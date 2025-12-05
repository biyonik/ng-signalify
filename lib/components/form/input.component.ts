import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  output,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputType = 'text' | 'number' | 'email' | 'password' | 'tel' | 'url';

/**
 * SigInput - Signal-based text input
 */
@Component({
  selector: 'sig-input',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="sig-input" [class.sig-input--with-icon]="icon()">
      @if (icon() && iconPosition() === 'left') {
        <span class="sig-input__icon sig-input__icon--left">{{ icon() }}</span>
      }

      <input
        [type]="actualType()"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [maxlength]="maxLength()"
        [autocomplete]="autocomplete()"
        (input)="onInput($event)"
        (blur)="onBlur()"
        (focus)="onFocusEvent()"
        class="sig-input__field"
      />

      @if (type() === 'password') {
        <button
          type="button"
          class="sig-input__toggle"
          (click)="togglePassword()"
          tabindex="-1"
        >
          {{ showPassword() ? '👁️' : '👁️‍🗨️' }}
        </button>
      }

      @if (clearable() && value()) {
        <button
          type="button"
          class="sig-input__clear"
          (click)="onClear()"
          tabindex="-1"
        >
          ✕
        </button>
      }

      @if (icon() && iconPosition() === 'right') {
        <span class="sig-input__icon sig-input__icon--right">{{ icon() }}</span>
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

    .sig-input__icon--left { left: 0.75rem; }
    .sig-input__icon--right { right: 0.75rem; }

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
  readonly type = input<InputType>('text');
  readonly value = model<string | number>('');
  readonly placeholder = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly clearable = input<boolean>(false);
  readonly icon = input<string>('');
  readonly iconPosition = input<'left' | 'right'>('left');
  readonly min = input<number | null>(null);
  readonly max = input<number | null>(null);
  readonly step = input<number | null>(null);
  readonly maxLength = input<number | null>(null);
  readonly autocomplete = input<string>('off');

  readonly focus = output<void>();
  readonly blur = output<void>();

  readonly showPassword = signal(false);

  readonly actualType = computed(() => {
    if (this.type() === 'password' && this.showPassword()) {
      return 'text';
    }
    return this.type();
  });

  private _onChange: (value: string | number) => void = () => {};
  private _onTouched: () => void = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const val = this.type() === 'number' ? Number(target.value) : target.value;
    this.value.set(val);
    this._onChange(val);
  }

  onBlur(): void {
    this._onTouched();
    this.blur.emit();
  }

  onFocusEvent(): void {
    this.focus.emit();
  }

  onClear(): void {
    this.value.set('');
    this._onChange('');
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  writeValue(value: string | number): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}
}