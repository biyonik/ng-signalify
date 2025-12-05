import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  signal,
  computed,
  input,
  output,
  model,
  viewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * SigTextarea - Signal-based multiline text input
 */
@Component({
  selector: 'sig-textarea',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SigTextareaComponent),
      multi: true,
    },
  ],
  template: `
    <div class="sig-textarea" [class.sig-textarea--disabled]="disabled()">
      <textarea
        #textareaRef
        [value]="value()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [rows]="rows()"
        [maxlength]="maxLength()"
        (input)="onInput($event)"
        (blur)="onBlur()"
        (focus)="onFocusEvent()"
        class="sig-textarea__field"
        [class.sig-textarea__field--resize-none]="!resize()"
        [class.sig-textarea__field--resize-vertical]="resize() === 'vertical'"
        [class.sig-textarea__field--resize-horizontal]="resize() === 'horizontal'"
      ></textarea>

      @if (showCounter() && maxLength()) {
        <div 
          class="sig-textarea__counter"
          [class.sig-textarea__counter--warning]="isNearLimit()"
          [class.sig-textarea__counter--error]="isAtLimit()"
        >
          {{ charCount() }} / {{ maxLength() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-textarea {
      position: relative;
      width: 100%;
    }

    .sig-textarea__field {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-family: inherit;
      line-height: 1.5;
      transition: border-color 0.15s, box-shadow 0.15s;
    }

    .sig-textarea__field:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .sig-textarea__field:disabled {
      background-color: #f3f4f6;
      cursor: not-allowed;
    }

    .sig-textarea__field::placeholder {
      color: #9ca3af;
    }

    .sig-textarea__field--resize-none { resize: none; }
    .sig-textarea__field--resize-vertical { resize: vertical; }
    .sig-textarea__field--resize-horizontal { resize: horizontal; }

    .sig-textarea--disabled .sig-textarea__field {
      background-color: #f3f4f6;
    }

    .sig-textarea__counter {
      position: absolute;
      bottom: 0.5rem;
      right: 0.5rem;
      font-size: 0.75rem;
      color: #9ca3af;
      background: white;
      padding: 0 0.25rem;
    }

    .sig-textarea__counter--warning { color: #f59e0b; }
    .sig-textarea__counter--error { color: #ef4444; }
  `],
})
export class SigTextareaComponent implements ControlValueAccessor, AfterViewInit {
  readonly textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textareaRef');

  readonly value = model<string>('');
  readonly placeholder = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly readonly = input<boolean>(false);
  readonly rows = input<number>(3);
  readonly maxLength = input<number | null>(null);
  readonly resize = input<'none' | 'vertical' | 'horizontal' | 'both'>('vertical');
  readonly autoResize = input<boolean>(false);
  readonly showCounter = input<boolean>(true);

  readonly focus = output<void>();
  readonly blur = output<void>();

  readonly charCount = signal(0);

  readonly isNearLimit = computed(() => {
    const max = this.maxLength();
    if (!max) return false;
    return this.charCount() > max * 0.9;
  });

  readonly isAtLimit = computed(() => {
    const max = this.maxLength();
    if (!max) return false;
    return this.charCount() >= max;
  });

  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    if (this.autoResize()) {
      this.adjustHeight();
    }
    this.charCount.set(this.value().length);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value.set(target.value);
    this.charCount.set(target.value.length);
    this._onChange(target.value);

    if (this.autoResize()) {
      this.adjustHeight();
    }
  }

  onBlur(): void {
    this._onTouched();
    this.blur.emit();
  }

  onFocusEvent(): void {
    this.focus.emit();
  }

  private adjustHeight(): void {
    const textarea = this.textareaRef()?.nativeElement;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  writeValue(value: string): void {
    this.value.set(value ?? '');
    this.charCount.set(this.value().length);

    if (this.autoResize() && this.textareaRef()) {
      setTimeout(() => this.adjustHeight());
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}
}