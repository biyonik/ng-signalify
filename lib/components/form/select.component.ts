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
 * SigSelect - Signal-based dropdown select
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
        type="button"
        class="sig-select__trigger"
        [disabled]="disabled()"
        (click)="toggle()"
        (keydown)="onKeydown($event)"
      >
        <span class="sig-select__value">
          @if (selectedOption()) {
            {{ selectedOption()?.label }}
          } @else {
            <span class="sig-select__placeholder">{{ placeholder() }}</span>
          }
        </span>
        <span class="sig-select__arrow">▼</span>
      </button>

      @if (isOpen()) {
        <div class="sig-select__dropdown">
          @if (searchable()) {
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

          <div class="sig-select__options">
            @if (clearable() && value() !== null) {
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
                [class.sig-select__option--selected]="option.id === value()"
                [class.sig-select__option--disabled]="option.disabled"
                [disabled]="option.disabled"
                (click)="onSelect(option)"
              >
                {{ option.label }}
                @if (option.id === value()) {
                  <span class="sig-select__check">✓</span>
                }
              </button>
            } @empty {
              <div class="sig-select__empty">
                {{ emptyText() }}
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  })
export class SigSelectComponent implements ControlValueAccessor {
  readonly options = input<SelectOption[]>([]);
  readonly value = model<string | number | null>(null);
  readonly placeholder = input<string>('Seçiniz');
  readonly disabled = input<boolean>(false);
  readonly searchable = input<boolean>(false);
  readonly clearable = input<boolean>(false);
  readonly emptyText = input<string>('Sonuç bulunamadı');

  readonly isOpen = signal(false);
  readonly searchQuery = signal('');

  readonly selectedOption = computed(() => {
    return this.options().find((o) => o.id === this.value()) ?? null;
  });

  readonly filteredOptions = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.options();
    return this.options().filter((o) => o.label.toLowerCase().includes(query));
  });

  private _onChange: (value: string | number | null) => void = () => {};
  private _onTouched: () => void = () => {};

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.sig-select')) {
      this.isOpen.set(false);
      this.searchQuery.set('');
    }
  }

  toggle(): void {
    if (!this.disabled()) {
      this.isOpen.update((v) => !v);
      if (!this.isOpen()) {
        this.searchQuery.set('');
      }
    }
  }

  onSelect(option: SelectOption): void {
    if (option.disabled) return;
    
    this.value.set(option.id);
    this._onChange(option.id);
    this.isOpen.set(false);
    this.searchQuery.set('');
  }

  onClear(): void {
    this.value.set(null);
    this._onChange(null);
    this.isOpen.set(false);
  }

  onSearch(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggle();
    } else if (event.key === 'Escape') {
      this.isOpen.set(false);
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

  setDisabledState(_isDisabled: boolean): void {}
}