import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  input,
  output,
  ElementRef,
  viewChildren,
  computed,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * SigOtpInput - Signal-based OTP/PIN input
 * 
 * Usage:
 * <sig-otp-input
 *   [length]="6"
 *   (completed)="onOtpComplete($event)"
 * />
 */
@Component({
  selector: 'sig-otp-input',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigOtpInputComponent),
      multi: true,
    },
  ],
  template: `
    <div 
      class="sig-otp"
      [class.sig-otp--error]="error()"
      [class.sig-otp--disabled]="disabled()"
    >
      @if (label()) {
        <div class="sig-otp__label">{{ label() }}</div>
      }

      <div class="sig-otp__inputs">
        @for (digit of digits(); track $index; let i = $index) {
          <input
            #digitInput
            type="text"
            inputmode="numeric"
            [value]="digit"
            [disabled]="disabled()"
            [attr.aria-label]="'Digit ' + (i + 1)"
            (input)="onInput(i, $event)"
            (keydown)="onKeydown(i, $event)"
            (paste)="onPaste($event)"
            (focus)="onFocus(i)"
            class="sig-otp__input"
            [class.sig-otp__input--filled]="digit !== ''"
            [class.sig-otp__input--masked]="masked()"
            maxlength="1"
            autocomplete="one-time-code"
          />
          @if (separator() && i === Math.floor(length() / 2) - 1) {
            <span class="sig-otp__separator">{{ separator() }}</span>
          }
        }
      </div>

      @if (error()) {
        <div class="sig-otp__error">{{ error() }}</div>
      }
    </div>
  `,
  })
export class SigOtpInputComponent implements ControlValueAccessor {
  readonly digitInputs = viewChildren<ElementRef<HTMLInputElement>>('digitInput');

  readonly length = input<number>(6);
  readonly label = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly masked = input<boolean>(false);
  readonly separator = input<string>('');
  readonly autoFocus = input<boolean>(true);
  readonly allowLetters = input<boolean>(false);

  readonly completed = output<string>();

  readonly digits = signal<string[]>([]);
  readonly error = signal<string | null>(null);

  protected readonly Math = Math;

  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  readonly value = computed(() => this.digits().join(''));

  constructor() {
    // Initialize empty digits
    setTimeout(() => {
      const len = this.length();
      this.digits.set(Array(len).fill(''));
      
      if (this.autoFocus()) {
        this.focusInput(0);
      }
    });
  }

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Validate input
    if (!this.allowLetters()) {
      value = value.replace(/\D/g, '');
    }

    // Take only first character
    value = value.slice(0, 1);

    // Update digit
    this.digits.update((d) => {
      const newDigits = [...d];
      newDigits[index] = value;
      return newDigits;
    });

    // Clear error
    this.error.set(null);

    // Emit change
    this._onChange(this.value());

    // Move to next input
    if (value && index < this.length() - 1) {
      this.focusInput(index + 1);
    }

    // Check if completed
    if (this.isComplete()) {
      this.completed.emit(this.value());
    }
  }

  onKeydown(index: number, event: KeyboardEvent): void {
    const digit = this.digits()[index];

    switch (event.key) {
      case 'Backspace':
        if (!digit && index > 0) {
          // Move to previous and clear it
          this.digits.update((d) => {
            const newDigits = [...d];
            newDigits[index - 1] = '';
            return newDigits;
          });
          this.focusInput(index - 1);
          this._onChange(this.value());
        }
        break;

      case 'ArrowLeft':
        event.preventDefault();
        if (index > 0) {
          this.focusInput(index - 1);
        }
        break;

      case 'ArrowRight':
        event.preventDefault();
        if (index < this.length() - 1) {
          this.focusInput(index + 1);
        }
        break;

      case 'Delete':
        this.digits.update((d) => {
          const newDigits = [...d];
          newDigits[index] = '';
          return newDigits;
        });
        this._onChange(this.value());
        break;
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    
    let cleaned = pastedData;
    if (!this.allowLetters()) {
      cleaned = pastedData.replace(/\D/g, '');
    }

    const chars = cleaned.slice(0, this.length()).split('');
    
    this.digits.update((d) => {
      const newDigits = [...d];
      chars.forEach((char, i) => {
        newDigits[i] = char;
      });
      return newDigits;
    });

    this._onChange(this.value());

    // Focus last filled or next empty
    const lastIndex = Math.min(chars.length, this.length() - 1);
    this.focusInput(lastIndex);

    // Check if completed
    if (this.isComplete()) {
      this.completed.emit(this.value());
    }
  }

  onFocus(index: number): void {
    // Select content on focus
    const inputs = this.digitInputs();
    if (inputs[index]) {
      inputs[index].nativeElement.select();
    }
  }

  private focusInput(index: number): void {
    setTimeout(() => {
      const inputs = this.digitInputs();
      if (inputs[index]) {
        inputs[index].nativeElement.focus();
      }
    });
  }

  private isComplete(): boolean {
    return this.digits().every((d) => d !== '');
  }

  // Public API
  clear(): void {
    this.digits.set(Array(this.length()).fill(''));
    this._onChange('');
    this.focusInput(0);
  }

  setError(message: string): void {
    this.error.set(message);
  }

  writeValue(value: string): void {
    if (value) {
      const chars = value.slice(0, this.length()).split('');
      const newDigits = Array(this.length()).fill('');
      chars.forEach((char, i) => {
        newDigits[i] = char;
      });
      this.digits.set(newDigits);
    } else {
      this.digits.set(Array(this.length()).fill(''));
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}
}