import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  output,
  model,
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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
        [attr.min]="min()"
        [attr.max]="max()"
        [attr.step]="step()"
        [maxLength]="maxLength()"
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