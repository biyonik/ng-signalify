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
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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