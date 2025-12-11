import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    signal,
    computed,
    input,
    model,
    ViewEncapsulation,
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId, Keys, announce } from '../../utils/a11y.utils';

/**
 * SigNumberStepper - Signal-based accessible number stepper
 *
 * ARIA Pattern: Spinbutton
 */
@Component({
    selector: 'sig-number-stepper',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SigNumberStepperComponent),
            multi: true,
        },
    ],
    template: `
        <div
                class="sig-number-stepper"
                [class.sig-number-stepper--disabled]="isDisabled()"
                [class.sig-number-stepper--sm]="size() === 'sm'"
                [class.sig-number-stepper--lg]="size() === 'lg'"
        >
            @if (label()) {
                <label [id]="labelId" [for]="inputId" class="sig-number-stepper__label">
                    {{ label() }}
                    @if (required()) {
                        <span aria-hidden="true">*</span>
                    }
                </label>
            }

            <div class="sig-number-stepper__control">
                <button
                        type="button"
                        class="sig-number-stepper__btn sig-number-stepper__btn--decrement"
                        [disabled]="isDisabled() || isAtMin()"
                        [attr.aria-label]="'Azalt: ' + step() + ' azalt'"
                        [attr.aria-controls]="inputId"
                        (click)="decrement()"
                        tabindex="-1"
                >
                    <span aria-hidden="true">−</span>
                </button>

                <input
                        type="text"
                        inputmode="numeric"
                        [id]="inputId"
                        [value]="displayValue()"
                        [disabled]="isDisabled()"
                        [attr.aria-labelledby]="label() ? labelId : null"
                        [attr.aria-label]="!label() ? ariaLabel() : null"
                        [attr.aria-describedby]="getDescribedBy()"
                        [attr.aria-valuemin]="min()"
                        [attr.aria-valuemax]="max()"
                        [attr.aria-valuenow]="value()"
                        [attr.aria-invalid]="ariaInvalid()"
                        [attr.aria-required]="required()"
                        role="spinbutton"
                        (input)="onInput($event)"
                        (keydown)="onKeydown($event)"
                        (blur)="onBlur()"
                        class="sig-number-stepper__input"
                />

                <button
                        type="button"
                        class="sig-number-stepper__btn sig-number-stepper__btn--increment"
                        [disabled]="isDisabled() || isAtMax()"
                        [attr.aria-label]="'Artır: ' + step() + ' artır'"
                        [attr.aria-controls]="inputId"
                        (click)="increment()"
                        tabindex="-1"
                >
                    <span aria-hidden="true">+</span>
                </button>
            </div>

            @if (hint()) {
                <div [id]="hintId" class="sig-number-stepper__hint">
                    {{ hint() }}
                </div>
            }
        </div>
    `,
})
export class SigNumberStepperComponent implements ControlValueAccessor, OnInit {
    readonly value = model<number>(0);
    readonly min = input<number>(0);
    readonly max = input<number>(100);
    readonly step = input<number>(1);
    readonly disabled = input<boolean>(false);
    readonly label = input<string>('');
    readonly ariaLabel = input<string>('Sayı seçici');
    readonly hint = input<string>('');
    readonly size = input<'sm' | 'md' | 'lg'>('md');
    readonly required = input<boolean>(false);
    readonly ariaInvalid = input<boolean>(false);
    readonly precision = input<number>(0);

    // IDs
    inputId = '';
    labelId = '';
    hintId = '';

    private _disabledByForm = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByForm());

    readonly isAtMin = computed(() => this.value() <= this.min());
    readonly isAtMax = computed(() => this.value() >= this.max());

    readonly displayValue = computed(() => {
        const prec = this.precision();
        return prec > 0 ? this.value().toFixed(prec) : this.value().toString();
    });

    private _onChange: (value: number) => void = () => {};
    private _onTouched: () => void = () => {};

    ngOnInit(): void {
        this.inputId = generateId('sig-stepper-input');
        this.labelId = generateId('sig-stepper-label');
        this.hintId = generateId('sig-stepper-hint');
    }

    getDescribedBy(): string | null {
        const parts: string[] = [];
        if (this.hint()) parts.push(this.hintId);
        return parts.length > 0 ? parts.join(' ') : null;
    }

    increment(): void {
        if (this.isDisabled() || this.isAtMax()) return;
        const newVal = Math.min(this.max(), this.value() + this.step());
        this.setValue(newVal);
        announce(`${this.displayValue()}`, 'polite');
    }

    decrement(): void {
        if (this.isDisabled() || this.isAtMin()) return;
        const newVal = Math.max(this.min(), this.value() - this.step());
        this.setValue(newVal);
        announce(`${this.displayValue()}`, 'polite');
    }

    onInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        const parsed = parseFloat(input.value);

        if (!isNaN(parsed)) {
            const clamped = Math.max(this.min(), Math.min(this.max(), parsed));
            this.setValue(clamped);
        }
    }

    onKeydown(event: KeyboardEvent): void {
        switch (event.key) {
            case Keys.ARROW_UP:
                event.preventDefault();
                this.increment();
                break;
            case Keys.ARROW_DOWN:
                event.preventDefault();
                this.decrement();
                break;
            case Keys.HOME:
                event.preventDefault();
                this.setValue(this.min());
                announce(`Minimum: ${this.min()}`, 'polite');
                break;
            case Keys.END:
                event.preventDefault();
                this.setValue(this.max());
                announce(`Maksimum: ${this.max()}`, 'polite');
                break;
            case 'PageUp':
                event.preventDefault();
                const bigStep = this.step() * 10;
                this.setValue(Math.min(this.max(), this.value() + bigStep));
                break;
            case 'PageDown':
                event.preventDefault();
                const bigStepDown = this.step() * 10;
                this.setValue(Math.max(this.min(), this.value() - bigStepDown));
                break;
        }
    }

    onBlur(): void {
        this._onTouched();
    }

    private setValue(val: number): void {
        const prec = this.precision();
        const rounded = prec > 0 ? parseFloat(val.toFixed(prec)) : Math.round(val);
        this.value.set(rounded);
        this._onChange(rounded);
    }

    writeValue(value: number): void {
        this.value.set(value ?? 0);
    }

    registerOnChange(fn: (value: number) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._disabledByForm.set(isDisabled);
    }
}
