import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  input,
  model,
  output,
  ElementRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * SigTagsInput - Signal-based tags/chips input
 * 
 * Usage:
 * <sig-tags-input
 *   [(value)]="tags"
 *   placeholder="Etiket ekle..."
 *   [maxTags]="5"
 * />
 */
@Component({
  selector: 'sig-tags-input',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigTagsInputComponent),
      multi: true,
    },
  ],
  template: `
    <div 
      class="sig-tags-input"
      [class.sig-tags-input--focused]="isFocused()"
      [class.sig-tags-input--disabled]="disabled()"
      (click)="focusInput()"
    >
      <div class="sig-tags-input__tags">
        @for (tag of value(); track tag) {
          <span class="sig-tags-input__tag">
            <span class="sig-tags-input__tag-text">{{ tag }}</span>
            @if (!disabled()) {
              <button
                type="button"
                class="sig-tags-input__tag-remove"
                (click)="removeTag(tag); $event.stopPropagation()"
                tabindex="-1"
              >
                ✕
              </button>
            }
          </span>
        }

        @if (!maxReached()) {
          <input
            #inputRef
            type="text"
            [value]="inputValue()"
            [placeholder]="value().length === 0 ? placeholder() : ''"
            [disabled]="disabled()"
            (input)="onInput($event)"
            (keydown)="onKeydown($event)"
            (focus)="isFocused.set(true)"
            (blur)="onBlur()"
            (paste)="onPaste($event)"
            class="sig-tags-input__input"
          />
        }
      </div>

      @if (showCounter() && maxTags() > 0) {
        <span class="sig-tags-input__counter">
          {{ value().length }} / {{ maxTags() }}
        </span>
      }
    </div>

    @if (error()) {
      <div class="sig-tags-input__error">{{ error() }}</div>
    }

    @if (suggestions().length > 0 && isFocused() && inputValue()) {
      <div class="sig-tags-input__suggestions">
        @for (suggestion of filteredSuggestions(); track suggestion) {
          <button
            type="button"
            class="sig-tags-input__suggestion"
            (mousedown)="addTag(suggestion)"
          >
            {{ suggestion }}
          </button>
        }
      </div>
    }
  `,
    host: {
    style: 'position: relative; display: block;',
  },
})
export class SigTagsInputComponent implements ControlValueAccessor {
  readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('inputRef');

  readonly value = model<string[]>([]);
  readonly placeholder = input<string>('Etiket ekle...');
  readonly disabled = input<boolean>(false);
  readonly maxTags = input<number>(0);
  readonly maxLength = input<number>(50);
  readonly allowDuplicates = input<boolean>(false);
  readonly separator = input<string>(',');
  readonly suggestions = input<string[]>([]);
  readonly showCounter = input<boolean>(true);
  readonly transform = input<'none' | 'lowercase' | 'uppercase'>('none');

  readonly tagAdded = output<string>();
  readonly tagRemoved = output<string>();

  readonly inputValue = signal('');
  readonly isFocused = signal(false);
  readonly error = signal<string | null>(null);

  readonly maxReached = signal(false);

  readonly filteredSuggestions = signal<string[]>([]);

  private _onChange: (value: string[]) => void = () => {};
  private _onTouched: () => void = () => {};

  constructor() {
    // Watch for max reached
    // Using effect would be better but keeping it simple
  }

  focusInput(): void {
    if (!this.disabled()) {
      this.inputRef()?.nativeElement.focus();
    }
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.inputValue.set(value);
    this.error.set(null);

    // Update filtered suggestions
    if (value && this.suggestions().length > 0) {
      const lower = value.toLowerCase();
      const currentTags = this.value();
      this.filteredSuggestions.set(
        this.suggestions().filter(
          (s) => s.toLowerCase().includes(lower) && !currentTags.includes(s)
        )
      );
    } else {
      this.filteredSuggestions.set([]);
    }

    // Check for separator
    const sep = this.separator();
    if (value.includes(sep)) {
      const parts = value.split(sep).map((p) => p.trim()).filter(Boolean);
      parts.forEach((part) => this.addTag(part));
      this.inputValue.set('');
    }
  }

  onKeydown(event: KeyboardEvent): void {
    const value = this.inputValue().trim();

    if (event.key === 'Enter' || event.key === 'Tab') {
      if (value) {
        event.preventDefault();
        this.addTag(value);
      }
    } else if (event.key === 'Backspace' && !value) {
      const tags = this.value();
      if (tags.length > 0) {
        this.removeTag(tags[tags.length - 1]);
      }
    }
  }

  onBlur(): void {
    const value = this.inputValue().trim();
    if (value) {
      this.addTag(value);
    }
    this.isFocused.set(false);
    this._onTouched();
  }

  onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    const sep = this.separator();
    
    if (pastedText.includes(sep)) {
      event.preventDefault();
      const parts = pastedText.split(sep).map((p) => p.trim()).filter(Boolean);
      parts.forEach((part) => this.addTag(part));
    }
  }

  addTag(tag: string): void {
    let processed = tag.trim();
    if (!processed) return;

    // Transform
    switch (this.transform()) {
      case 'lowercase':
        processed = processed.toLowerCase();
        break;
      case 'uppercase':
        processed = processed.toUpperCase();
        break;
    }

    // Validations
    if (processed.length > this.maxLength()) {
      this.error.set(`Maksimum ${this.maxLength()} karakter`);
      return;
    }

    const currentTags = this.value();

    if (!this.allowDuplicates() && currentTags.includes(processed)) {
      this.error.set('Bu etiket zaten ekli');
      return;
    }

    const max = this.maxTags();
    if (max > 0 && currentTags.length >= max) {
      this.error.set(`Maksimum ${max} etiket eklenebilir`);
      return;
    }

    // Add tag
    const newTags = [...currentTags, processed];
    this.value.set(newTags);
    this._onChange(newTags);
    this.inputValue.set('');
    this.filteredSuggestions.set([]);
    this.tagAdded.emit(processed);

    // Update max reached
    this.maxReached.set(max > 0 && newTags.length >= max);
  }

  removeTag(tag: string): void {
    const newTags = this.value().filter((t) => t !== tag);
    this.value.set(newTags);
    this._onChange(newTags);
    this.tagRemoved.emit(tag);
    this.maxReached.set(false);
    this.error.set(null);
  }

  writeValue(value: string[]): void {
    this.value.set(value ?? []);
    const max = this.maxTags();
    this.maxReached.set(max > 0 && (value?.length ?? 0) >= max);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}
}