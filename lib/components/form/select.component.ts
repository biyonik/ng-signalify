import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  id: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

/**
 * SigSelect - Dropdown select with search
 * 
 * Usage:
 * <sig-select
 *   [options]="countries"
 *   [(value)]="selectedCountry"
 *   placeholder="Ülke seçin"
 *   [searchable]="true"
 * />
 */
@Component({
  selector: 'sig-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      [class.sig-select--disabled]="disabled"
    >
      <!-- Trigger -->
      <button
        type="button"
        class="sig-select__trigger"
        [disabled]="disabled"
        (click)="toggle()"
        (keydown)="onKeydown($event)"
      >
        <span class="sig-select__value">
          @if (selectedOption()) {
            {{ selectedOption()?.label }}
          } @else {
            <span class="sig-select__placeholder">{{ placeholder }}</span>
          }
        </span>
        <span class="sig-select__arrow">▼</span>
      </button>

      <!-- Dropdown -->
      @if (isOpen()) {
        <div class="sig-select__dropdown">
          <!-- Search -->
          @if (searchable) {
            <div class="sig-select__search">
              <input
                type="text"
                [value]="searchQuery()"
                (input)="onSearch($event)"
                placeholder="Ara..."
                class="sig-select__search-input"
              />
            </div>
          }

          <!-- Options -->
          <div class="sig-select__options">
            @if (clearable && value !== null) {
              <button
                type="button"
                class="sig-select__option sig-select__option--clear"
                (click)="onClear()"
              >
                Temizle
              </button>
            }

            @for (option of filteredOptions(); track option.id) {
              <button
                type="button"
                class="sig-select__option"
                [class.sig-select__option--selected]="option.id === value"
                [class.sig-select__option--disabled]="option.disabled"
                [disabled]="option.disabled"
                (click)="onSelect(option)"
              >
                {{ option.label }}
                @if (option.id === value) {
                  <span class="sig-select__check">✓</span>
                }
              </button>
            } @empty {
              <div class="sig-select__empty">
                {{ emptyText }}
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-select {
      position: relative;
      width: 100%;
    }

    .sig-select__trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      font-size: 0.875rem;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .sig-select__trigger:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .sig-select--disabled .sig-select__trigger {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }

    .sig-select--open .sig-select__trigger {
      border-color: #3b82f6;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }

    .sig-select__value {
      flex: 1;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sig-select__placeholder {
      color: #9ca3af;
    }

    .sig-select__arrow {
      font-size: 0.625rem;
      color: #6b7280;
      transition: transform 0.15s;
    }

    .sig-select--open .sig-select__arrow {
      transform: rotate(180deg);
    }

    .sig-select__dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 50;
      background: white;
      border: 1px solid #3b82f6;
      border-top: none;
      border-radius: 0 0 0.375rem 0.375rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      max-height: 15rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .sig-select__search {
      padding: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-select__search-input {
      width: 100%;
      padding: 0.375rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      font-size: 0.875rem;
    }

    .sig-select__search-input:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .sig-select__options {
      overflow-y: auto;
      max-height: 12rem;
    }

    .sig-select__option {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      border: none;
      background: none;
      font-size: 0.875rem;
      cursor: pointer;
      text-align: left;
    }

    .sig-select__option:hover {
      background-color: #f3f4f6;
    }

    .sig-select__option--selected {
      background-color: #eff6ff;
      color: #1d4ed8;
    }

    .sig-select__option--disabled {
      color: #9ca3af;
      cursor: not-allowed;
    }

    .sig-select__option--clear {
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-select__check {
      color: #3b82f6;
    }

    .sig-select__empty {
      padding: 1rem;
      text-align: center;
      color: #9ca3af;
      font-size: 0.875rem;
    }
  `],
  host: {
    '(document:click)': 'onClickOutside($event)',
  },
})
export class SigSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() value: string | number | null = null;
  @Input() placeholder = 'Seçiniz';
  @Input() disabled = false;
  @Input() searchable = false;
  @Input() clearable = false;
  @Input() emptyText = 'Sonuç bulunamadı';

  @Output() valueChange = new EventEmitter<string | number | null>();

  isOpen = signal(false);
  searchQuery = signal('');

  selectedOption = computed(() => {
    return this.options.find((o) => o.id === this.value) ?? null;
  });

  filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.options;
    return this.options.filter((o) =>
      o.label.toLowerCase().includes(query)
    );
  });

  private onChange: (value: string | number | null) => void = () => {};
  private onTouched: () => void = () => {};

  toggle() {
    if (!this.disabled) {
      this.isOpen.update((v) => !v);
      if (!this.isOpen()) {
        this.searchQuery.set('');
      }
    }
  }

  onSelect(option: SelectOption) {
    if (option.disabled) return;
    
    this.value = option.id;
    this.valueChange.emit(option.id);
    this.onChange(option.id);
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  onClear() {
    this.value = null;
    this.valueChange.emit(null);
    this.onChange(null);
    this.isOpen.set(false);
  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
    } else if (event.key === 'Escape') {
      this.isOpen.set(false);
    }
  }

  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.sig-select')) {
      this.isOpen.set(false);
      this.searchQuery.set('');
    }
  }

  // ControlValueAccessor
  writeValue(value: string | number | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}