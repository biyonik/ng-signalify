import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    signal,
    input,
    model,
    ViewEncapsulation,
    OnInit, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId } from '../../utils/a11y.utils';

/**
 * SigCheckbox - Signal-based accessible checkbox
 *
 * ARIA Pattern: Checkbox
 * https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/
 */
@Component({
    selector: 'sig-checkbox',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SigCheckboxComponent),
            multi: true,
        },
    ],
    template: `
        <label
                class="sig-checkbox"
                [class.sig-checkbox--disabled]="isDisabled()"
                [class.sig-checkbox--checked]="checked()"
                [for]="inputId"
        >
            <input
                    type="checkbox"
                    [id]="inputId"
                    [checked]="checked()"
                    [disabled]="isDisabled()"
                    [indeterminate]="indeterminate()"
                    [attr.aria-checked]="getAriaChecked()"
                    [attr.aria-describedby]="ariaDescribedBy() || null"
                    [attr.aria-invalid]="ariaInvalid()"
                    [attr.aria-required]="required()"
                    [attr.name]="name()"
                    (change)="onChange($event)"
                    (keydown)="onKeydown($event)"
                    class="sig-checkbox__input"
            />
            <span
                    class="sig-checkbox__box"
                    aria-hidden="true"
                    [attr.data-state]="getCheckState()"
            >
                @if (checked()) {
                    <span class="sig-checkbox__check">✓</span>
                } @else if (indeterminate()) {
                    <span class="sig-checkbox__indeterminate">−</span>
                }
            </span>
            @if (label()) {
                <span class="sig-checkbox__label">{{ label() }}</span>
            }
        </label>
    `,
})
export class SigCheckboxComponent implements ControlValueAccessor, OnInit {
    readonly checked = model<boolean>(false);
    readonly label = input<string>('');
    readonly disabled = input<boolean>(false);
    readonly indeterminate = input<boolean>(false);

    // YENİ: A11y input'ları
    readonly ariaDescribedBy = input<string>('');
    readonly ariaInvalid = input<boolean>(false);
    readonly required = input<boolean>(false);
    readonly name = input<string>('');

    // YENİ: Unique ID
    inputId = '';

    private _disabledByForm = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByForm());

    private _onChangeFn: (value: boolean) => void = () => {};
    private _onTouchedFn: () => void = () => {};

    ngOnInit(): void {
        this.inputId = generateId('sig-checkbox');
    }

    // YENİ: ARIA checked state for indeterminate
    getAriaChecked(): 'true' | 'false' | 'mixed' {
        if (this.indeterminate()) return 'mixed';
        return this.checked() ? 'true' : 'false';
    }

    getCheckState(): 'checked' | 'unchecked' | 'indeterminate' {
        if (this.indeterminate()) return 'indeterminate';
        return this.checked() ? 'checked' : 'unchecked';
    }

    onChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.checked.set(target.checked);
        this._onChangeFn(target.checked);
        this._onTouchedFn();
    }

    // YENİ: Keyboard support
    onKeydown(event: KeyboardEvent): void {
        // Space is handled by native checkbox, but we ensure it works
        if (event.key === ' ' || event.key === 'Enter') {
            // Let default behavior handle space
            // Enter is not standard for checkbox but some users expect it
            if (event.key === 'Enter') {
                event.preventDefault();
                this.toggle();
            }
        }
    }

    private toggle(): void {
        if (!this.isDisabled()) {
            const newValue = !this.checked();
            this.checked.set(newValue);
            this._onChangeFn(newValue);
            this._onTouchedFn();
        }
    }

    writeValue(value: boolean): void {
        this.checked.set(value ?? false);
    }

    registerOnChange(fn: (value: boolean) => void): void {
        this._onChangeFn = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouchedFn = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._disabledByForm.set(isDisabled);
    }
}


/**
 * SigSwitch - Signal-based accessible toggle switch
 *
 * ARIA Pattern: Switch
 * https://www.w3.org/WAI/ARIA/apg/patterns/switch/
 */
@Component({
    selector: 'sig-switch',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SigSwitchComponent),
            multi: true,
        },
    ],
    template: `
        <label 
            class="sig-switch"
            [class.sig-switch--disabled]="isDisabled()"
            [class.sig-switch--checked]="checked()"
            [class.sig-switch--small]="size() === 'small'"
            [class.sig-switch--large]="size() === 'large'"
            [for]="inputId"
        >
            <input
                type="checkbox"
                role="switch"
                [id]="inputId"
                [checked]="checked()"
                [disabled]="isDisabled()"
                [attr.aria-checked]="checked()"
                [attr.aria-describedby]="ariaDescribedBy() || null"
                [attr.name]="name()"
                (change)="onChange($event)"
                class="sig-switch__input"
            />
            <span class="sig-switch__track" aria-hidden="true">
                <span class="sig-switch__thumb"></span>
            </span>
            @if (label()) {
                <span class="sig-switch__label">{{ label() }}</span>
            }
            @if (onLabel() && offLabel()) {
                <span class="sig-switch__state-label" aria-hidden="true">
                    {{ checked() ? onLabel() : offLabel() }}
                </span>
            }
        </label>
    `,
})
export class SigSwitchComponent implements ControlValueAccessor, OnInit {
    readonly checked = model<boolean>(false);
    readonly label = input<string>('');
    readonly disabled = input<boolean>(false);
    readonly size = input<'small' | 'medium' | 'large'>('medium');

    // YENİ: A11y input'ları
    readonly ariaDescribedBy = input<string>('');
    readonly name = input<string>('');
    readonly onLabel = input<string>('');
    readonly offLabel = input<string>('');

    inputId = '';

    private _disabledByForm = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByForm());

    private _onChangeFn: (value: boolean) => void = () => {};
    private _onTouchedFn: () => void = () => {};

    ngOnInit(): void {
        this.inputId = generateId('sig-switch');
    }

    onChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.checked.set(target.checked);
        this._onChangeFn(target.checked);
        this._onTouchedFn();
    }

    writeValue(value: boolean): void {
        this.checked.set(value ?? false);
    }

    registerOnChange(fn: (value: boolean) => void): void {
        this._onChangeFn = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouchedFn = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._disabledByForm.set(isDisabled);
    }
}
