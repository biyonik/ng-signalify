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
    ElementRef,
    ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId, Keys, announce } from '../../utils/a11y.utils';

/**
 * SigColorPicker - Signal-based accessible color picker
 */
@Component({
    selector: 'sig-color-picker',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SigColorPickerComponent),
            multi: true,
        },
    ],
    template: `
        <div
                class="sig-color-picker"
                [class.sig-color-picker--open]="isOpen()"
                [class.sig-color-picker--disabled]="isDisabled()"
        >
            @if (label()) {
                <label [id]="labelId" [for]="triggerId" class="sig-color-picker__label">
                    {{ label() }}
                </label>
            }

            <button
                    #triggerBtn
                    type="button"
                    class="sig-color-picker__trigger"
                    [id]="triggerId"
                    [disabled]="isDisabled()"
                    [attr.aria-expanded]="isOpen()"
                    [attr.aria-haspopup]="'dialog'"
                    [attr.aria-controls]="dialogId"
                    [attr.aria-label]="getButtonLabel()"
                    [attr.aria-labelledby]="label() ? labelId : null"
                    [attr.aria-describedby]="ariaDescribedBy() || null"
                    (click)="toggle()"
                    (keydown)="onTriggerKeydown($event)"
            >
        <span
                class="sig-color-picker__swatch"
                [style.backgroundColor]="value() || '#ffffff'"
                aria-hidden="true"
        ></span>
                <span class="sig-color-picker__value">{{ value() || placeholder() }}</span>
            </button>

            @if (isOpen()) {
                <div
                        #dialog
                        class="sig-color-picker__dropdown"
                        [id]="dialogId"
                        role="dialog"
                        aria-modal="true"
                        [attr.aria-label]="'Renk seçici'"
                        (keydown)="onDialogKeydown($event)"
                >
                    <!-- Preset Colors -->
                    @if (presets().length > 0) {
                        <div
                                class="sig-color-picker__presets"
                                role="listbox"
                                [attr.aria-label]="'Hazır renkler'"
                        >
                            @for (color of presets(); track color; let i = $index) {
                                <button
                                        type="button"
                                        role="option"
                                        class="sig-color-picker__preset"
                                        [class.sig-color-picker__preset--selected]="color === value()"
                                        [style.backgroundColor]="color"
                                        [attr.aria-selected]="color === value()"
                                        [attr.aria-label]="'Renk: ' + color"
                                        [tabindex]="color === value() ? 0 : -1"
                                        (click)="selectColor(color)"
                                        (keydown)="onPresetKeydown($event, i)"
                                >
                                    @if (color === value()) {
                                        <span class="sig-color-picker__check" aria-hidden="true">✓</span>
                                    }
                                </button>
                            }
                        </div>
                    }

                    <!-- Custom Color Input -->
                    <div class="sig-color-picker__custom">
                        <label [for]="customInputId" class="sig-color-picker__custom-label">
                            Özel renk
                        </label>
                        <div class="sig-color-picker__custom-row">
                            <input
                                    type="color"
                                    [id]="customInputId"
                                    [value]="value() || '#000000'"
                                    (input)="onColorInput($event)"
                                    class="sig-color-picker__native"
                                    [attr.aria-label]="'Özel renk seçici'"
                            />
                            <input
                                    type="text"
                                    [value]="value()"
                                    (input)="onTextInput($event)"
                                    (blur)="onTextBlur()"
                                    placeholder="#000000"
                                    class="sig-color-picker__hex"
                                    [attr.aria-label]="'HEX renk kodu'"
                                    maxlength="7"
                            />
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="sig-color-picker__actions">
                        @if (clearable()) {
                            <button
                                    type="button"
                                    class="sig-color-picker__clear"
                                    (click)="clear()"
                            >
                                Temizle
                            </button>
                        }
                        <button
                                type="button"
                                class="sig-color-picker__done"
                                (click)="close()"
                        >
                            Tamam
                        </button>
                    </div>
                </div>
            }
        </div>
    `,
    host: {
        '(document:click)': 'onClickOutside($event)',
    },
})
export class SigColorPickerComponent implements ControlValueAccessor, OnInit {
    @ViewChild('triggerBtn') triggerBtn!: ElementRef<HTMLButtonElement>;
    @ViewChild('dialog') dialog?: ElementRef<HTMLDivElement>;

    readonly value = model<string | null>(null);
    readonly placeholder = input<string>('Renk seçin');
    readonly disabled = input<boolean>(false);
    readonly label = input<string>('');
    readonly ariaDescribedBy = input<string>('');
    readonly clearable = input<boolean>(true);
    readonly presets = input<string[]>([
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
        '#3b82f6', '#8b5cf6', '#ec4899', '#000000', '#ffffff'
    ]);

    readonly isOpen = signal(false);

    // IDs
    triggerId = '';
    dialogId = '';
    labelId = '';
    customInputId = '';

    private _disabledByForm = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByForm());

    private _onChange: (value: string | null) => void = () => {};
    private _onTouched: () => void = () => {};

    ngOnInit(): void {
        const baseId = generateId('sig-color');
        this.triggerId = `${baseId}-trigger`;
        this.dialogId = `${baseId}-dialog`;
        this.labelId = `${baseId}-label`;
        this.customInputId = `${baseId}-custom`;
    }

    getButtonLabel(): string {
        const val = this.value();
        if (val) {
            return `Seçili renk: ${val}. Değiştirmek için tıklayın.`;
        }
        return 'Renk seçmek için tıklayın';
    }

    toggle(): void {
        if (this.isDisabled()) return;

        if (this.isOpen()) {
            this.close();
        } else {
            this.open();
        }
    }

    private open(): void {
        this.isOpen.set(true);
        announce('Renk seçici açıldı', 'polite');
    }

    close(): void {
        this.isOpen.set(false);
        this.triggerBtn.nativeElement.focus();
    }

    selectColor(color: string): void {
        this.value.set(color);
        this._onChange(color);
        announce(`${color} seçildi`, 'polite');
    }

    onColorInput(event: Event): void {
        const color = (event.target as HTMLInputElement).value;
        this.selectColor(color);
    }

    onTextInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        let color = input.value;

        if (color && !color.startsWith('#')) {
            color = '#' + color;
        }

        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
            this.selectColor(color);
        }
    }

    onTextBlur(): void {
        this._onTouched();
    }

    clear(): void {
        this.value.set(null);
        this._onChange(null);
        announce('Renk temizlendi', 'polite');
    }

    onTriggerKeydown(event: KeyboardEvent): void {
        if (event.key === Keys.ARROW_DOWN || event.key === Keys.ENTER || event.key === Keys.SPACE) {
            event.preventDefault();
            if (!this.isOpen()) {
                this.open();
            }
        }
    }

    onDialogKeydown(event: KeyboardEvent): void {
        if (event.key === Keys.ESCAPE) {
            event.preventDefault();
            this.close();
        }
    }

    onPresetKeydown(event: KeyboardEvent, index: number): void {
        const presets = this.presets();
        let newIndex = index;

        switch (event.key) {
            case Keys.ARROW_RIGHT:
            case Keys.ARROW_DOWN:
                event.preventDefault();
                newIndex = (index + 1) % presets.length;
                break;
            case Keys.ARROW_LEFT:
            case Keys.ARROW_UP:
                event.preventDefault();
                newIndex = (index - 1 + presets.length) % presets.length;
                break;
            case Keys.HOME:
                event.preventDefault();
                newIndex = 0;
                break;
            case Keys.END:
                event.preventDefault();
                newIndex = presets.length - 1;
                break;
            case Keys.ENTER:
            case Keys.SPACE:
                event.preventDefault();
                this.selectColor(presets[index]);
                return;
        }

        if (newIndex !== index) {
            const buttons = this.dialog?.nativeElement.querySelectorAll('.sig-color-picker__preset');
            (buttons?.[newIndex] as HTMLButtonElement)?.focus();
        }
    }

    onClickOutside(event: Event): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.sig-color-picker') && this.isOpen()) {
            this.close();
        }
    }

    writeValue(value: string | null): void {
        this.value.set(value);
    }

    registerOnChange(fn: (value: string | null) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._disabledByForm.set(isDisabled);
    }
}
