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
  styles: [`
    .sig-tags-input {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      min-height: 2.5rem;
      padding: 0.25rem 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      cursor: text;
      transition: border-color 0.15s;
    }

    .sig-tags-input--focused {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .sig-tags-input--disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }

    .sig-tags-input__tags {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.25rem;
      flex: 1;
    }

    .sig-tags-input__tag {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.5rem;
      background-color: #eff6ff;
      color: #1d4ed8;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .sig-tags-input__tag-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1rem;
      height: 1rem;
      padding: 0;
      border: none;
      background: none;
      color: #3b82f6;
      cursor: pointer;
      border-radius: 50%;
      font-size: 0.625rem;
    }

    .sig-tags-input__tag-remove:hover {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .sig-tags-input__input {
      flex: 1;
      min-width: 80px;
      padding: 0.25rem;
      border: none;
      outline: none;
      font-size: 0.875rem;
      background: transparent;
    }

    .sig-tags-input__input::placeholder {
      color: #9ca3af;
    }

    .sig-tags-input__counter {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-left: 0.5rem;
    }

    .sig-tags-input__error {
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: #ef4444;
    }

    .sig-tags-input__suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 50;
      margin-top: 0.25rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      max-height: 10rem;
      overflow-y: auto;
    }

    .sig-tags-input__suggestion {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: none;
      background: none;
      text-align: left;
      font-size: 0.875rem;
      cursor: pointer;
    }

    .sig-tags-input__suggestion:hover {
      background-color: #f3f4f6;
    }
  `],
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