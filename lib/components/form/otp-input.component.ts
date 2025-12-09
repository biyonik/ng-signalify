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
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId, Keys, announce } from '../../utils/a11y.utils';

/**
 * SigOtpInput - Signal-based accessible OTP/PIN input
 *
 * ARIA: Uses group role with individual labeled inputs
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
      [class.sig-otp--disabled]="isDisabled()"
      role="group"
      [attr.aria-labelledby]="label() ? labelId : null"
      [attr.aria-describedby]="getDescribedBy()"
      [attr.aria-invalid]="!!error()"
    >
      @if (label()) {
        <div [id]="labelId" class="sig-otp__label">
          {{ label() }}
          @if (required()) {
            <span aria-hidden="true">*</span>
          }
        </div>
      }

      <div 
        [id]="instructionsId" 
        class="sig-visually-hidden"
      >
        {{ length() }} haneli doğrulama kodu girin. Her kutuya bir rakam.
      </div>

      <div class="sig-otp__inputs" role="presentation">
        @for (digit of digits(); track i; let i = $index) {
          <input
            #digitInput
            type="text"
            inputmode="numeric"
            [id]="getInputId(i)"
            [value]="digit"
            [disabled]="isDisabled()"
            [attr.aria-label]="'Hane ' + (i + 1) + ' / ' + length()"
            [attr.aria-invalid]="!!error()"
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
            <span class="sig-otp__separator" aria-hidden="true">{{ separator() }}</span>
          }
        }
      </div>

      @if (error()) {
        <div 
          [id]="errorId" 
          class="sig-otp__error" 
          role="alert"
          aria-live="polite"
        >
          {{ error() }}
        </div>
      }

      @if (hint() && !error()) {
        <div [id]="hintId" class="sig-otp__hint">
          {{ hint() }}
        </div>
      }
    </div>
  `,
    styles: [`
    .sig-visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class SigOtpInputComponent implements ControlValueAccessor, OnInit {
    readonly digitInputs = viewChildren<ElementRef<HTMLInputElement>>('digitInput');

    readonly length = input<number>(6);
    readonly label = input<string>('');
    readonly disabled = input<boolean>(false);
    readonly masked = input<boolean>(false);
    readonly separator = input<string>('');
    readonly autoFocus = input<boolean>(true);
    readonly allowLetters = input<boolean>(false);
    readonly required = input<boolean>(false);
    readonly hint = input<string>('');

    readonly completed = output<string>();

    readonly digits = signal<string[]>([]);
    readonly error = signal<string | null>(null);

    protected readonly Math = Math;

    // IDs
    groupId = '';
    labelId = '';
    errorId = '';
    hintId = '';
    instructionsId = '';

    private _disabledByForm = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByForm());

    private _onChange: (value: string) => void = () => {};
    private _onTouched: () => void = () => {};

    readonly value = computed(() => this.digits().join(''));

    ngOnInit(): void {
        this.groupId = generateId('sig-otp');
        this.labelId = `${this.groupId}-label`;
        this.errorId = `${this.groupId}-error`;
        this.hintId = `${this.groupId}-hint`;
        this.instructionsId = `${this.groupId}-instructions`;

        // Initialize empty digits
        setTimeout(() => {
            const len = this.length();
            this.digits.set(Array(len).fill(''));

            if (this.autoFocus()) {
                this.focusInput(0);
            }
        });
    }

    getInputId(index: number): string {
        return `${this.groupId}-input-${index}`;
    }

    getDescribedBy(): string {
        const parts = [this.instructionsId];
        if (this.error()) parts.push(this.errorId);
        else if (this.hint()) parts.push(this.hintId);
        return parts.join(' ');
    }

    onInput(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;
        let value = input.value;

        if (!this.allowLetters()) {
            value = value.replace(/\D/g, '');
        }

        value = value.slice(0, 1);

        this.digits.update((d) => {
            const newDigits = [...d];
            newDigits[index] = value;
            return newDigits;
        });

        this.error.set(null);
        this._onChange(this.value());

        if (value && index < this.length() - 1) {
            this.focusInput(index + 1);
        }

        if (this.isComplete()) {
            this.completed.emit(this.value());
            announce('Doğrulama kodu tamamlandı', 'polite');
        }
    }

    onKeydown(index: number, event: KeyboardEvent): void {
        const digit = this.digits()[index];

        switch (event.key) {
            case Keys.BACKSPACE:
                if (!digit && index > 0) {
                    this.digits.update((d) => {
                        const newDigits = [...d];
                        newDigits[index - 1] = '';
                        return newDigits;
                    });
                    this.focusInput(index - 1);
                    this._onChange(this.value());
                }
                break;

            case Keys.ARROW_LEFT:
                event.preventDefault();
                if (index > 0) {
                    this.focusInput(index - 1);
                }
                break;

            case Keys.ARROW_RIGHT:
                event.preventDefault();
                if (index < this.length() - 1) {
                    this.focusInput(index + 1);
                }
                break;

            case Keys.HOME:
                event.preventDefault();
                this.focusInput(0);
                break;

            case Keys.END:
                event.preventDefault();
                this.focusInput(this.length() - 1);
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

        const lastIndex = Math.min(chars.length, this.length() - 1);
        this.focusInput(lastIndex);

        if (this.isComplete()) {
            this.completed.emit(this.value());
            announce('Doğrulama kodu yapıştırıldı ve tamamlandı', 'polite');
        } else {
            announce(`${chars.length} hane yapıştırıldı`, 'polite');
        }
    }

    onFocus(index: number): void {
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

    clear(): void {
        this.digits.set(Array(this.length()).fill(''));
        this._onChange('');
        this.focusInput(0);
        announce('Doğrulama kodu temizlendi', 'polite');
    }

    setError(message: string): void {
        this.error.set(message);
        announce(message, 'assertive');
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

    setDisabledState(isDisabled: boolean): void {
        this._disabledByForm.set(isDisabled);
    }
}
