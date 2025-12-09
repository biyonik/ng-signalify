import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    signal,
    computed,
    input,
    model,
    HostListener,
    ViewEncapsulation,
    OnInit,
    ElementRef,
    ViewChild,
    AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId, Keys, announce } from '../../utils/a11y.utils';

export interface SelectOption {
    id: string | number;
    label: string;
    disabled?: boolean;
    group?: string;
}

/**
 * SigSelect - Signal-based accessible dropdown select
 *
 * ARIA Pattern: Combobox with Listbox Popup
 * https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 */
@Component({
    selector: 'sig-select',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SigSelectComponent),
            multi: true,
        },
    ],
    template: `
        <div
                class="sig-select"
                [class.sig-select--open]="isOpen()"
                [class.sig-select--disabled]="disabled()"
        >
            <button
                    #triggerButton
                    type="button"
                    role="combobox"
                    class="sig-select__trigger"
                    [id]="triggerId"
                    [disabled]="disabled()"
                    [attr.aria-expanded]="isOpen()"
                    [attr.aria-haspopup]="'listbox'"
                    [attr.aria-controls]="listboxId"
                    [attr.aria-activedescendant]="activeDescendant()"
                    [attr.aria-label]="ariaLabel() || null"
                    [attr.aria-labelledby]="ariaLabelledBy() || null"
                    [attr.aria-describedby]="ariaDescribedBy() || null"
                    [attr.aria-invalid]="ariaInvalid()"
                    [attr.aria-required]="required()"
                    (click)="toggle()"
                    (keydown)="onTriggerKeydown($event)"
            >
                <span class="sig-select__value">
                    @if (selectedOption()) {
                        {{ selectedOption()?.label }}
                    } @else {
                        <span class="sig-select__placeholder">{{ placeholder() }}</span>
                    }
                </span>
                <span class="sig-select__arrow" aria-hidden="true">▼</span>
            </button>

            @if (isOpen()) {
                <div
                        class="sig-select__dropdown"
                        role="listbox"
                        [id]="listboxId"
                        [attr.aria-label]="placeholder()"
                        tabindex="-1"
                >
                    @if (searchable()) {
                        <div class="sig-select__search">
                            <input
                                    #searchInput
                                    type="text"
                                    role="searchbox"
                                    [value]="searchQuery()"
                                    (input)="onSearch($event)"
                                    (keydown)="onSearchKeydown($event)"
                                    [placeholder]="searchPlaceholder()"
                                    [attr.aria-label]="searchPlaceholder()"
                                    aria-autocomplete="list"
                                    [attr.aria-controls]="listboxId"
                                    class="sig-select__search-input"
                            />
                        </div>
                    }

                    <div class="sig-select__options" role="group">
                        @if (clearable() && value() !== null) {
                            <button
                                    type="button"
                                    role="option"
                                    class="sig-select__option sig-select__option--clear"
                                    [attr.aria-selected]="false"
                                    (click)="onClear()"
                                    (keydown)="onOptionKeydown($event, null)"
                            >
                                Temizle
                            </button>
                        }

                        @for (option of filteredOptions(); track option.id; let i = $index) {
                            <button
                                    type="button"
                                    role="option"
                                    class="sig-select__option"
                                    [id]="getOptionId(option.id)"
                                    [class.sig-select__option--selected]="option.id === value()"
                                    [class.sig-select__option--focused]="focusedIndex() === i"
                                    [class.sig-select__option--disabled]="option.disabled"
                                    [attr.aria-selected]="option.id === value()"
                                    [attr.aria-disabled]="option.disabled"
                                    [disabled]="option.disabled"
                                    (click)="onSelect(option)"
                                    (keydown)="onOptionKeydown($event, option)"
                                    (mouseenter)="focusedIndex.set(i)"
                            >
                                {{ option.label }}
                                @if (option.id === value()) {
                                    <span class="sig-select__check" aria-hidden="true">✓</span>
                                }
                            </button>
                        } @empty {
                            <div class="sig-select__empty" role="alert">
                                {{ emptyText() }}
                            </div>
                        }
                    </div>
                </div>
            }
        </div>
    `,
})
export class SigSelectComponent implements ControlValueAccessor, OnInit, AfterViewInit {
    @ViewChild('triggerButton') triggerButton!: ElementRef<HTMLButtonElement>;
    @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

    // Mevcut input'lar
    readonly options = input<SelectOption[]>([]);
    readonly value = model<string | number | null>(null);
    readonly placeholder = input<string>('Seçiniz');
    readonly disabled = input<boolean>(false);
    readonly searchable = input<boolean>(false);
    readonly clearable = input<boolean>(false);
    readonly emptyText = input<string>('Sonuç bulunamadı');
    readonly searchPlaceholder = input<string>('Ara...');

    // YENİ: A11y input'ları
    readonly ariaLabel = input<string>('');
    readonly ariaLabelledBy = input<string>('');
    readonly ariaDescribedBy = input<string>('');
    readonly ariaInvalid = input<boolean>(false);
    readonly required = input<boolean>(false);

    // Internal signals
    readonly isOpen = signal(false);
    readonly searchQuery = signal('');
    readonly focusedIndex = signal(-1);

    // YENİ: Unique ID'ler
    triggerId = '';
    listboxId = '';

    readonly selectedOption = computed(() => {
        return this.options().find((o) => o.id === this.value()) ?? null;
    });

    readonly filteredOptions = computed(() => {
        const query = this.searchQuery().toLowerCase();
        if (!query) return this.options();
        return this.options().filter((o) => o.label.toLowerCase().includes(query));
    });

    // YENİ: Active descendant for screen readers
    readonly activeDescendant = computed(() => {
        if (!this.isOpen() || this.focusedIndex() < 0) return null;
        const option = this.filteredOptions()[this.focusedIndex()];
        return option ? this.getOptionId(option.id) : null;
    });

    private _onChange: (value: string | number | null) => void = () => {};
    private _onTouched: () => void = () => {};
    private _disabledByForm = signal(false);

    ngOnInit(): void {
        const baseId = generateId('sig-select');
        this.triggerId = `${baseId}-trigger`;
        this.listboxId = `${baseId}-listbox`;
    }

    ngAfterViewInit(): void {
        // Focus search input when dropdown opens
    }

    getOptionId(optionId: string | number): string {
        return `${this.listboxId}-option-${optionId}`;
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: Event): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.sig-select')) {
            this.closeDropdown();
        }
    }

    toggle(): void {
        if (!this.disabled() && !this._disabledByForm()) {
            if (this.isOpen()) {
                this.closeDropdown();
            } else {
                this.openDropdown();
            }
        }
    }

    private openDropdown(): void {
        this.isOpen.set(true);
        this.focusedIndex.set(this.getSelectedIndex());

        // Announce to screen readers
        const count = this.options().length;
        announce(`${count} seçenek mevcut. Seçmek için ok tuşlarını kullanın.`, 'polite');

        // Focus search input if searchable
        setTimeout(() => {
            if (this.searchable() && this.searchInput) {
                this.searchInput.nativeElement.focus();
            }
        });
    }

    private closeDropdown(): void {
        this.isOpen.set(false);
        this.searchQuery.set('');
        this.focusedIndex.set(-1);
    }

    private getSelectedIndex(): number {
        if (this.value() === null) return 0;
        return this.filteredOptions().findIndex(o => o.id === this.value());
    }

    onSelect(option: SelectOption): void {
        if (option.disabled) return;

        this.value.set(option.id);
        this._onChange(option.id);
        this.closeDropdown();

        // Announce selection
        announce(`${option.label} seçildi`, 'polite');

        // Return focus to trigger
        this.triggerButton.nativeElement.focus();
    }

    onClear(): void {
        this.value.set(null);
        this._onChange(null);
        this.closeDropdown();
        announce('Seçim temizlendi', 'polite');
        this.triggerButton.nativeElement.focus();
    }

    onSearch(event: Event): void {
        const val = (event.target as HTMLInputElement).value;
        this.searchQuery.set(val);
        this.focusedIndex.set(0);

        // Announce filtered results count
        const count = this.filteredOptions().length;
        announce(`${count} sonuç bulundu`, 'polite');
    }

    onTriggerKeydown(event: KeyboardEvent): void {
        switch (event.key) {
            case Keys.ENTER:
            case Keys.SPACE:
            case Keys.ARROW_DOWN:
            case Keys.ARROW_UP:
                event.preventDefault();
                if (!this.isOpen()) {
                    this.openDropdown();
                }
                break;
            case Keys.ESCAPE:
                if (this.isOpen()) {
                    event.preventDefault();
                    this.closeDropdown();
                }
                break;
        }
    }

    onSearchKeydown(event: KeyboardEvent): void {
        switch (event.key) {
            case Keys.ARROW_DOWN:
                event.preventDefault();
                this.moveFocus(1);
                break;
            case Keys.ARROW_UP:
                event.preventDefault();
                this.moveFocus(-1);
                break;
            case Keys.ENTER:
                event.preventDefault();
                this.selectFocusedOption();
                break;
            case Keys.ESCAPE:
                event.preventDefault();
                this.closeDropdown();
                this.triggerButton.nativeElement.focus();
                break;
            case Keys.HOME:
                event.preventDefault();
                this.focusedIndex.set(0);
                break;
            case Keys.END:
                event.preventDefault();
                this.focusedIndex.set(this.filteredOptions().length - 1);
                break;
        }
    }

    onOptionKeydown(event: KeyboardEvent, option: SelectOption | null): void {
        switch (event.key) {
            case Keys.ENTER:
            case Keys.SPACE:
                event.preventDefault();
                if (option) {
                    this.onSelect(option);
                } else {
                    this.onClear();
                }
                break;
            case Keys.ESCAPE:
                event.preventDefault();
                this.closeDropdown();
                this.triggerButton.nativeElement.focus();
                break;
            case Keys.ARROW_DOWN:
                event.preventDefault();
                this.moveFocus(1);
                break;
            case Keys.ARROW_UP:
                event.preventDefault();
                this.moveFocus(-1);
                break;
        }
    }

    private moveFocus(delta: number): void {
        const options = this.filteredOptions();
        if (options.length === 0) return;

        let newIndex = this.focusedIndex() + delta;

        // Loop around
        if (newIndex < 0) newIndex = options.length - 1;
        if (newIndex >= options.length) newIndex = 0;

        // Skip disabled options
        let attempts = 0;
        while (options[newIndex]?.disabled && attempts < options.length) {
            newIndex += delta > 0 ? 1 : -1;
            if (newIndex < 0) newIndex = options.length - 1;
            if (newIndex >= options.length) newIndex = 0;
            attempts++;
        }

        this.focusedIndex.set(newIndex);
    }

    private selectFocusedOption(): void {
        const option = this.filteredOptions()[this.focusedIndex()];
        if (option && !option.disabled) {
            this.onSelect(option);
        }
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
