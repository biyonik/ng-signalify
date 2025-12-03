import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * SigTextarea - Multiline text input
 * 
 * Usage:
 * <sig-textarea
 *   [(value)]="description"
 *   placeholder="Açıklama giriniz..."
 *   [rows]="4"
 *   [maxLength]="500"
 *   [autoResize]="true"
 * />
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
    <div class="sig-textarea" [class.sig-textarea--disabled]="disabled">
      <textarea
        #textareaRef
        [value]="value"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        [rows]="rows"
        [maxlength]="maxLength"
        (input)="onInput($event)"
        (blur)="onBlur()"
        (focus)="onFocus()"
        class="sig-textarea__field"
        [class.sig-textarea__field--resize-none]="!resize"
        [class.sig-textarea__field--resize-vertical]="resize === 'vertical'"
        [class.sig-textarea__field--resize-horizontal]="resize === 'horizontal'"
      ></textarea>

      @if (showCounter && maxLength) {
        <div 
          class="sig-textarea__counter"
          [class.sig-textarea__counter--warning]="isNearLimit()"
          [class.sig-textarea__counter--error]="isAtLimit()"
        >
          {{ charCount() }} / {{ maxLength }}
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

    .sig-textarea__field--resize-none {
      resize: none;
    }

    .sig-textarea__field--resize-vertical {
      resize: vertical;
    }

    .sig-textarea__field--resize-horizontal {
      resize: horizontal;
    }

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

    .sig-textarea__counter--warning {
      color: #f59e0b;
    }

    .sig-textarea__counter--error {
      color: #ef4444;
    }
  `],
})
export class SigTextareaComponent implements ControlValueAccessor, AfterViewInit {
  @ViewChild('textareaRef') textareaRef!: ElementRef<HTMLTextAreaElement>;

  @Input() value = '';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() rows = 3;
  @Input() maxLength: number | null = null;
  @Input() resize: 'none' | 'vertical' | 'horizontal' | 'both' = 'vertical';
  @Input() autoResize = false;
  @Input() showCounter = true;

  @Output() valueChange = new EventEmitter<string>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  charCount = signal(0);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit() {
    if (this.autoResize) {
      this.adjustHeight();
    }
    this.charCount.set(this.value.length);
  }

  isNearLimit = computed(() => {
    if (!this.maxLength) return false;
    return this.charCount() > this.maxLength * 0.9;
  });

  isAtLimit = computed(() => {
    if (!this.maxLength) return false;
    return this.charCount() >= this.maxLength;
  });

  onInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.charCount.set(target.value.length);
    this.valueChange.emit(this.value);
    this.onChange(this.value);

    if (this.autoResize) {
      this.adjustHeight();
    }
  }

  onBlur() {
    this.onTouched();
    this.blur.emit();
  }

  onFocus() {
    this.focus.emit();
  }

  private adjustHeight() {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  // ControlValueAccessor
  writeValue(value: string): void {
    this.value = value ?? '';
    this.charCount.set(this.value.length);
    
    if (this.autoResize && this.textareaRef) {
      setTimeout(() => this.adjustHeight());
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}