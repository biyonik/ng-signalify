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
    ViewChild,
    ElementRef,
    AfterViewInit,
    effect,
    Injector,
    inject,
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
                #inputElement
                [id]="inputId"
                [type]="actualType()"
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
export class SigInputComponent implements ControlValueAccessor, OnInit, AfterViewInit {
    private readonly injector = inject(Injector);

    // ViewChild for direct DOM access
    @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

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

    // TR: Kullanıcı girişi mi yoksa external değişiklik mi olduğunu takip eder
    // EN: Tracks whether change is from user input or external
    private _isUserInput = false;

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

    ngAfterViewInit(): void {
        // TR: İlk değeri set et
        // EN: Set initial value
        this.syncInputValue(this.value());

        // TR: Signal değişikliklerini izle ve sadece external değişikliklerde DOM'u güncelle
        // EN: Watch signal changes and update DOM only on external changes
        effect(() => {
            const currentValue = this.value();

            // TR: Kullanıcı girişi ise DOM'u güncelleme (zaten güncel)
            // EN: If user input, don't update DOM (already up to date)
            if (this._isUserInput) {
                this._isUserInput = false;
                return;
            }

            // TR: External değişiklik - DOM'u güncelle
            // EN: External change - update DOM
            this.syncInputValue(currentValue);
        }, { injector: this.injector, allowSignalWrites: true });
    }

    /**
     * TR: Input elementinin değerini senkronize eder
     * EN: Syncs the input element value
     */
    private syncInputValue(value: string | number | null): void {
        if (this.inputElement?.nativeElement) {
            const displayValue = value ?? '';
            if (this.inputElement.nativeElement.value !== String(displayValue)) {
                this.inputElement.nativeElement.value = String(displayValue);
            }
        }
    }

    onInput(event: Event): void {
        const target = event.target as HTMLInputElement;

        // TR: Kullanıcı girişi olduğunu işaretle (effect'in DOM'u override etmesini engelle)
        // EN: Mark as user input (prevent effect from overriding DOM)
        this._isUserInput = true;

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
        // TR: Input elementini de temizle
        // EN: Clear the input element too
        this.syncInputValue(null);
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
