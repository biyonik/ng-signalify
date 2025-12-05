import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  output,
  model,
  ElementRef,
  viewChild,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SigSearchInput - Signal-based search input with debounce
 * 
 * Usage:
 * <sig-search-input
 *   [(value)]="searchQuery"
 *   [debounce]="300"
 *   (search)="onSearch($event)"
 *   placeholder="Ara..."
 * />
 */
@Component({
  selector: 'sig-search-input',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-search"
      [class.sig-search--focused]="isFocused()"
      [class.sig-search--loading]="loading()"
      [class.sig-search--disabled]="disabled()"
    >
      <span class="sig-search__icon">🔍</span>

      <input
        #inputRef
        type="text"
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        (input)="onInput($event)"
        (focus)="isFocused.set(true)"
        (blur)="isFocused.set(false)"
        (keydown.enter)="onEnter()"
        (keydown.escape)="onEscape()"
        class="sig-search__input"
      />

      @if (loading()) {
        <span class="sig-search__spinner"></span>
      } @else if (value() && showClear()) {
        <button
          type="button"
          class="sig-search__clear"
          (click)="clear()"
          tabindex="-1"
        >
          ✕
        </button>
      }

      @if (showButton()) {
        <button
          type="button"
          class="sig-search__button"
          [disabled]="disabled() || !value()"
          (click)="triggerSearch()"
        >
          {{ buttonText() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .sig-search {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      background: white;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .sig-search--focused {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .sig-search--disabled {
      background-color: #f3f4f6;
      opacity: 0.6;
    }

    .sig-search__icon {
      flex-shrink: 0;
      font-size: 1rem;
      opacity: 0.5;
    }

    .sig-search__input {
      flex: 1;
      min-width: 0;
      border: none;
      outline: none;
      font-size: 0.875rem;
      background: transparent;
    }

    .sig-search__input::placeholder {
      color: #9ca3af;
    }

    .sig-search__spinner {
      flex-shrink: 0;
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

    .sig-search__clear {
      flex-shrink: 0;
      padding: 0.125rem;
      border: none;
      background: none;
      color: #9ca3af;
      cursor: pointer;
      font-size: 0.75rem;
      border-radius: 0.25rem;
    }

    .sig-search__clear:hover {
      color: #374151;
      background-color: #f3f4f6;
    }

    .sig-search__button {
      flex-shrink: 0;
      padding: 0.375rem 0.75rem;
      border: none;
      background-color: #3b82f6;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .sig-search__button:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .sig-search__button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
})
export class SigSearchInputComponent implements OnDestroy {
  readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('inputRef');

  readonly value = model<string>('');
  readonly placeholder = input<string>('Ara...');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly debounce = input<number>(300);
  readonly minLength = input<number>(0);
  readonly showClear = input<boolean>(true);
  readonly showButton = input<boolean>(false);
  readonly buttonText = input<string>('Ara');
  readonly searchOnEnter = input<boolean>(true);

  readonly search = output<string>();
  readonly cleared = output<void>();

  readonly isFocused = signal(false);

  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);

    // Debounced search
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    const minLen = this.minLength();
    if (value.length >= minLen || value.length === 0) {
      this._debounceTimer = setTimeout(() => {
        this.search.emit(value);
      }, this.debounce());
    }
  }

  onEnter(): void {
    if (this.searchOnEnter()) {
      this.triggerSearch();
    }
  }

  onEscape(): void {
    if (this.value()) {
      this.clear();
    } else {
      this.inputRef()?.nativeElement.blur();
    }
  }

  triggerSearch(): void {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
    this.search.emit(this.value());
  }

  clear(): void {
    this.value.set('');
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
    this.search.emit('');
    this.cleared.emit();
    this.inputRef()?.nativeElement.focus();
  }

  focus(): void {
    this.inputRef()?.nativeElement.focus();
  }
}