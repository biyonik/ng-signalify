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
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId } from '../../utils/a11y.utils';

export type InputType = 'text' | 'number' | 'email' | 'password' | 'tel' | 'url';

/**
 * SigInput - Signal-based accessible text input
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
                <span class="sig-input__icon sig-input__icon--left" aria-hidden="true">{{ icon() }}</span>
            }

            <input
                [id]="inputId"
                [type]="actualType()"
                [value]="value() ?? ''"
                [placeholder]="placeholder()"
                [disabled]="disabled()"
                [readonly]="readonly()"
                [attr.min]="min()"
                [attr.max]="max()"
                [attr.step]="step()"
                [maxLength]="maxLength()"
                [autocomplete]="autocomplete()"
                [attr.aria-label]="ariaLabel() || null"
                [attr.aria-labelledby]="ariaLabelledBy() || null"
                [attr.aria-describedby]="ariaDescribedBy() || null"
                [attr.aria-invalid]="ariaInvalid()"
                [attr.aria-required]="required()"
                [attr.aria-readonly]="readonly() || null"
                [attr.inputmode]="inputMode()"
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
                    [attr.aria-label]="showPassword() ? 'Şifreyi gizle' : 'Şifreyi göster'"
                    [attr.aria-pressed]="showPassword()"
                >
                    <span aria-hidden="true">{{ showPassword() ? '👁️' : '👁️‍🗨️' }}</span>
                </button>
            }

            @if (clearable() && value()) {
                <button
                    type="button"
                    class="sig-input__clear"
                    (click)="onClear()"
                    tabindex="-1"
                    aria-label="Alanı temizle"
                >
                    <span aria-hidden="true">✕</span>
                </button>
            }

            @if (icon() && iconPosition() === 'right') {
                <span class="sig-input__icon sig-input__icon--right" aria-hidden="true">{{ icon() }}</span>
            }
        </div>
    `,
})
export class SigInputComponent implements ControlValueAccessor, OnInit {
    // Mevcut input'lar
    readonly type = input<InputType>('text');
    readonly value = model<string | number | null>(null);
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

    // YENİ: A11y input'ları
    readonly ariaLabel = input<string>('');
    readonly ariaLabelledBy = input<string>('');
    readonly ariaDescribedBy = input<string>('');
    readonly ariaInvalid = input<boolean>(false);
    readonly required = input<boolean>(false);
    readonly inputMode = input<'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'>('text');

    // Output'lar
    readonly focus = output<void>();
    readonly blur = output<void>();

    // Internal signals
    readonly showPassword = signal(false);

    // YENİ: Unique ID for input
    inputId = '';

    readonly actualType = computed(() => {
        if (this.type() === 'password' && this.showPassword()) {
            return 'text';
        }
        return this.type();
    });

    // setDisabledState için internal state
    private _disabledByForm = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByForm());

    private _onChange: (value: string | number | null) => void = () => {};
    private _onTouched: () => void = () => {};

    ngOnInit(): void {
        this.inputId = generateId('sig-input');
    }

    onInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        if (target.value === '') {
            this.value.set(null);
            this._onChange(null);
            return;
        }

        let val: string | number | null;
        if (this.type() === 'number') {
            const parsed = Number(target.value);
            val = Number.isNaN(parsed) ? null : parsed;
        } else {
            val = target.value;
        }

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
        this.value.set(null);
        this._onChange(null);
    }

    togglePassword(): void {
        this.showPassword.update((v) => !v);
    }

    writeValue(value: string | number | null): void {
        this.value.set(value);
    }

    registerOnChange(fn: (value: string | number | null) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._disabledByForm.set(isDisabled);
    }
}
