import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    signal,
    computed,
    input,
    output,
    model,
    effect,
    ElementRef,
    viewChild,
    ViewEncapsulation,
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { generateId, Keys, announce } from '../../utils/a11y.utils';

export interface AutocompleteOption {
    value: string | number;
    label: string;
    disabled?: boolean;
    data?: unknown;
}

/**
 * SigAutocomplete - Signal-based accessible autocomplete/combobox
 *
 * ARIA Pattern: Combobox with Listbox Popup
 */
@Component({
    selector: 'sig-autocomplete',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SigAutocompleteComponent),
            multi: true,
        },
    ],
    template: `
    <div 
      class="sig-autocomplete"
      [class.sig-autocomplete--open]="isOpen()"
      [class.sig-autocomplete--disabled]="isDisabled()"
    >
      <!-- Input -->
      <div class="sig-autocomplete__input-wrapper">
        <input
          #inputRef
          type="text"
          role="combobox"
          [id]="inputId"
          [value]="searchText()"
          [placeholder]="placeholder()"
          [disabled]="isDisabled()"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-controls]="listboxId"
          [attr.aria-activedescendant]="activeDescendant()"
          [attr.aria-autocomplete]="'list'"
          [attr.aria-label]="ariaLabel() || null"
          [attr.aria-labelledby]="ariaLabelledBy() || null"
          [attr.aria-describedby]="ariaDescribedBy() || null"
          [attr.aria-invalid]="ariaInvalid()"
          [attr.aria-required]="required()"
          autocomplete="off"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (keydown)="onKeydown($event)"
          (blur)="onBlur()"
          class="sig-autocomplete__input"
        />

        @if (loading()) {
          <span class="sig-autocomplete__spinner" aria-hidden="true"></span>
          <span class="sig-visually-hidden">Aranıyor...</span>
        } @else if (searchText() && clearable()) {
          <button
            type="button"
            class="sig-autocomplete__clear"
            (click)="clear()"
            tabindex="-1"
            aria-label="Temizle"
          >
            <span aria-hidden="true">✕</span>
          </button>
        } @else {
          <span class="sig-autocomplete__icon" aria-hidden="true">▼</span>
        }
      </div>

      <!-- Dropdown -->
      @if (isOpen()) {
        <div 
          [id]="listboxId"
          class="sig-autocomplete__dropdown" 
          role="listbox"
          [attr.aria-label]="placeholder()"
        >
          @if (loading()) {
            <div class="sig-autocomplete__loading" role="status">
              Aranıyor...
            </div>
          } @else if (filteredOptions().length === 0) {
            <div class="sig-autocomplete__empty" role="status">
              {{ emptyText() }}
            </div>
          } @else {
            @for (option of filteredOptions(); track option.value; let i = $index) {
              <button
                type="button"
                role="option"
                [id]="getOptionId(option.value)"
                class="sig-autocomplete__option"
                [class.sig-autocomplete__option--highlighted]="i === highlightedIndex()"
                [class.sig-autocomplete__option--selected]="option.value === value()"
                [class.sig-autocomplete__option--disabled]="option.disabled"
                [attr.aria-selected]="option.value === value()"
                [attr.aria-disabled]="option.disabled"
                [disabled]="option.disabled"
                (click)="selectOption(option)"
                (mouseenter)="highlightedIndex.set(i)"
              >
                @if (highlightSearch() && searchText()) {
                  <span [innerHTML]="highlightMatch(option.label, searchText())"></span>
                } @else {
                  {{ option.label }}
                }
              </button>
            }
          }
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
  `],
    host: {
        '(document:click)': 'onClickOutside($event)',
    },
})
export class SigAutocompleteComponent implements ControlValueAccessor, OnInit {
    readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('inputRef');

    readonly options = input<AutocompleteOption[]>([]);
    readonly value = model<string | number | null>(null);
    readonly placeholder = input<string>('Ara...');
    readonly disabled = input<boolean>(false);
    readonly loading = input<boolean>(false);
    readonly clearable = input<boolean>(true);
    readonly emptyText = input<string>('Sonuç bulunamadı');
    readonly minChars = input<number>(0);
    readonly debounceMs = input<number>(300);
    readonly highlightSearch = input<boolean>(true);
    readonly filterLocally = input<boolean>(true);

    // A11y inputs
    readonly ariaLabel = input<string>('');
    readonly ariaLabelledBy = input<string>('');
    readonly ariaDescribedBy = input<string>('');
    readonly ariaInvalid = input<boolean>(false);
    readonly required = input<boolean>(false);

    readonly search = output<string>();
    readonly optionSelected = output<AutocompleteOption>();

    readonly isOpen = signal(false);
    readonly searchText = signal('');
    readonly highlightedIndex = signal(0);

    // IDs
    inputId = '';
    listboxId = '';

    private _disabledByForm = signal(false);
    readonly isDisabled = computed(() => this.disabled() || this._disabledByForm());

    private _onChange: (value: string | number | null) => void = () => {};
    private _onTouched: () => void = () => {};
    private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

    ngOnInit(): void {
        this.inputId = generateId('sig-autocomplete-input');
        this.listboxId = generateId('sig-autocomplete-listbox');
    }

    readonly filteredOptions = computed(() => {
        const opts = this.options();
        const text = this.searchText().toLowerCase();

        if (!this.filterLocally() || !text) {
            return opts;
        }

        return opts.filter((opt) =>
            opt.label.toLowerCase().includes(text)
        );
    });

    readonly selectedOption = computed(() => {
        return this.options().find((o) => o.value === this.value()) ?? null;
    });

    readonly activeDescendant = computed(() => {
        if (!this.isOpen() || this.filteredOptions().length === 0) return null;
        const option = this.filteredOptions()[this.highlightedIndex()];
        return option ? this.getOptionId(option.value) : null;
    });

    getOptionId(value: string | number): string {
        return `${this.listboxId}-option-${value}`;
    }

    constructor() {
        effect(() => {
            const selected = this.selectedOption();
            if (selected && !this.isOpen()) {
                this.searchText.set(selected.label);
            }
        }, {allowSignalWrites: true});
    }

    onInput(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.searchText.set(value);
        this.highlightedIndex.set(0);

        if (!this.isOpen()) {
            this.isOpen.set(true);
        }

        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }

        if (value.length >= this.minChars()) {
            this._debounceTimer = setTimeout(() => {
                this.search.emit(value);
            }, this.debounceMs());
        }
    }

    onFocus(): void {
        if (!this.isDisabled()) {
            this.isOpen.set(true);
            this.inputRef()?.nativeElement.select();

            const count = this.filteredOptions().length;
            if (count > 0) {
                announce(`${count} seçenek mevcut`, 'polite');
            }
        }
    }

    onBlur(): void {
        this._onTouched();
    }

    onKeydown(event: KeyboardEvent): void {
        const options = this.filteredOptions();

        switch (event.key) {
            case Keys.ARROW_DOWN:
                event.preventDefault();
                if (!this.isOpen()) {
                    this.isOpen.set(true);
                } else {
                    this.highlightedIndex.update((i) =>
                        i < options.length - 1 ? i + 1 : 0
                    );
                }
                break;

            case Keys.ARROW_UP:
                event.preventDefault();
                this.highlightedIndex.update((i) =>
                    i > 0 ? i - 1 : options.length - 1
                );
                break;

            case Keys.ENTER:
                event.preventDefault();
                const highlighted = options[this.highlightedIndex()];
                if (highlighted && !highlighted.disabled) {
                    this.selectOption(highlighted);
                }
                break;

            case Keys.ESCAPE:
                event.preventDefault();
                this.isOpen.set(false);
                break;

            case Keys.TAB:
                this.isOpen.set(false);
                break;

            case Keys.HOME:
                if (this.isOpen()) {
                    event.preventDefault();
                    this.highlightedIndex.set(0);
                }
                break;

            case Keys.END:
                if (this.isOpen()) {
                    event.preventDefault();
                    this.highlightedIndex.set(options.length - 1);
                }
                break;
        }
    }

    selectOption(option: AutocompleteOption): void {
        this.value.set(option.value);
        this.searchText.set(option.label);
        this._onChange(option.value);
        this._onTouched();
        this.optionSelected.emit(option);
        this.isOpen.set(false);
        announce(`${option.label} seçildi`, 'polite');
    }

    clear(): void {
        this.value.set(null);
        this.searchText.set('');
        this._onChange(null);
        this.inputRef()?.nativeElement.focus();
        announce('Alan temizlendi', 'polite');
    }

    onClickOutside(event: Event): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.sig-autocomplete')) {
            this.isOpen.set(false);
            const selected = this.selectedOption();
            if (selected) {
                this.searchText.set(selected.label);
            }
        }
    }

    highlightMatch(text: string, query: string): string {
        if (!query) return text;
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    writeValue(value: string | number | null): void {
        this.value.set(value);
        const option = this.options().find((o) => o.value === value);
        if (option) {
            this.searchText.set(option.label);
        }
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
