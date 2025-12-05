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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface AutocompleteOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  data?: unknown;
}

/**
 * SigAutocomplete - Signal-based autocomplete/combobox
 * 
 * Usage:
 * <sig-autocomplete
 *   [(value)]="selectedCity"
 *   [options]="cities"
 *   [loading]="isSearching"
 *   placeholder="Şehir ara..."
 *   (search)="onSearch($event)"
 * />
 */
@Component({
  selector: 'sig-autocomplete',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      [class.sig-autocomplete--disabled]="disabled()"
    >
      <!-- Input -->
      <div class="sig-autocomplete__input-wrapper">
        <input
          #inputRef
          type="text"
          [value]="searchText()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          (input)="onInput($event)"
          (focus)="onFocus()"
          (keydown)="onKeydown($event)"
          class="sig-autocomplete__input"
          role="combobox"
          [attr.aria-expanded]="isOpen()"
          autocomplete="off"
        />

        @if (loading()) {
          <span class="sig-autocomplete__spinner"></span>
        } @else if (searchText() && clearable()) {
          <button
            type="button"
            class="sig-autocomplete__clear"
            (click)="clear()"
            tabindex="-1"
          >
            ✕
          </button>
        } @else {
          <span class="sig-autocomplete__icon">▼</span>
        }
      </div>

      <!-- Dropdown -->
      @if (isOpen()) {
        <div class="sig-autocomplete__dropdown" role="listbox">
          @if (loading()) {
            <div class="sig-autocomplete__loading">
              Aranıyor...
            </div>
          } @else if (filteredOptions().length === 0) {
            <div class="sig-autocomplete__empty">
              {{ emptyText() }}
            </div>
          } @else {
            @for (option of filteredOptions(); track option.value; let i = $index) {
              <button
                type="button"
                class="sig-autocomplete__option"
                [class.sig-autocomplete__option--highlighted]="i === highlightedIndex()"
                [class.sig-autocomplete__option--selected]="option.value === value()"
                [class.sig-autocomplete__option--disabled]="option.disabled"
                [disabled]="option.disabled"
                (click)="selectOption(option)"
                (mouseenter)="highlightedIndex.set(i)"
                role="option"
                [attr.aria-selected]="option.value === value()"
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
    .sig-autocomplete {
      position: relative;
      width: 100%;
    }

    .sig-autocomplete__input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .sig-autocomplete__input {
      width: 100%;
      padding: 0.5rem 2rem 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      transition: border-color 0.15s;
    }

    .sig-autocomplete__input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .sig-autocomplete__input:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }

    .sig-autocomplete__icon,
    .sig-autocomplete__clear {
      position: absolute;
      right: 0.75rem;
      color: #9ca3af;
    }

    .sig-autocomplete__icon {
      font-size: 0.625rem;
      pointer-events: none;
    }

    .sig-autocomplete__clear {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      font-size: 0.75rem;
    }

    .sig-autocomplete__clear:hover {
      color: #374151;
    }

    .sig-autocomplete__spinner {
      position: absolute;
      right: 0.75rem;
      width: 1rem;
      height: 1rem;
      border: 2px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .sig-autocomplete__dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 50;
      margin-top: 0.25rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      max-height: 15rem;
      overflow-y: auto;
    }

    .sig-autocomplete__option {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: none;
      background: none;
      text-align: left;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background-color 0.1s;
    }

    .sig-autocomplete__option:hover,
    .sig-autocomplete__option--highlighted {
      background-color: #f3f4f6;
    }

    .sig-autocomplete__option--selected {
      background-color: #eff6ff;
      color: #1d4ed8;
    }

    .sig-autocomplete__option--disabled {
      color: #9ca3af;
      cursor: not-allowed;
    }

    .sig-autocomplete__loading,
    .sig-autocomplete__empty {
      padding: 0.75rem;
      text-align: center;
      color: #9ca3af;
      font-size: 0.875rem;
    }

    .sig-autocomplete mark {
      background-color: #fef08a;
      color: inherit;
      padding: 0;
    }
  `],
  host: {
    '(document:click)': 'onClickOutside($event)',
  },
})
export class SigAutocompleteComponent implements ControlValueAccessor {
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

  readonly search = output<string>();
  readonly optionSelected = output<AutocompleteOption>();

  readonly isOpen = signal(false);
  readonly searchText = signal('');
  readonly highlightedIndex = signal(0);

  private _onChange: (value: string | number | null) => void = () => {};
  private _onTouched: () => void = () => {};
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

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

  constructor() {
    // Sync selected option label with search text
    effect(() => {
      const selected = this.selectedOption();
      if (selected && !this.isOpen()) {
        this.searchText.set(selected.label);
      }
    });
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchText.set(value);
    this.highlightedIndex.set(0);

    if (!this.isOpen()) {
      this.isOpen.set(true);
    }

    // Debounced search emit
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
    if (!this.disabled()) {
      this.isOpen.set(true);
      this.inputRef()?.nativeElement.select();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    const options = this.filteredOptions();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update((i) =>
          i < options.length - 1 ? i + 1 : 0
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update((i) =>
          i > 0 ? i - 1 : options.length - 1
        );
        break;

      case 'Enter':
        event.preventDefault();
        const highlighted = options[this.highlightedIndex()];
        if (highlighted && !highlighted.disabled) {
          this.selectOption(highlighted);
        }
        break;

      case 'Escape':
        this.isOpen.set(false);
        break;

      case 'Tab':
        this.isOpen.set(false);
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
  }

  clear(): void {
    this.value.set(null);
    this.searchText.set('');
    this._onChange(null);
    this.inputRef()?.nativeElement.focus();
  }

  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.sig-autocomplete')) {
      this.isOpen.set(false);
      // Restore selected label if cleared
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

  setDisabledState(_isDisabled: boolean): void {}
}