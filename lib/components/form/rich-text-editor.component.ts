import {
    Component,
    ChangeDetectionStrategy,
    forwardRef,
    input,
    model,
    output,
    signal,
    viewChild,
    ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface ToolbarAction {
    id: string;
    icon: string;
    title: string;
    command: string;
    value?: string;
}

/**
 * SigRichTextEditor - Signal-based WYSIWYG editor
 * 
 * Usage:
 * <sig-rich-text-editor
 *   [(value)]="content"
 *   [placeholder]="'İçerik yazın...'"
 *   [minHeight]="200"
 * />
 */
@Component({
    selector: 'sig-rich-text-editor',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SigRichTextEditorComponent),
            multi: true,
        },
    ],
    template: `
    <div 
      class="sig-rte"
      [class.sig-rte--focused]="isFocused()"
      [class.sig-rte--disabled]="disabled()"
    >
      <!-- Toolbar -->
      @if (showToolbar()) {
        <div class="sig-rte__toolbar">
          <!-- Text Formatting -->
          <div class="sig-rte__toolbar-group">
            @for (action of formattingActions; track action.id) {
              <button
                type="button"
                class="sig-rte__tool"
                [class.sig-rte__tool--active]="isActive(action.command)"
                [title]="action.title"
                (click)="execCommand(action.command, action.value)"
              >
                {{ action.icon }}
              </button>
            }
          </div>

          <div class="sig-rte__toolbar-divider"></div>

          <!-- Headings -->
          <div class="sig-rte__toolbar-group">
            <select
              class="sig-rte__select"
              (change)="onHeadingChange($event)"
            >
              <option value="">Normal</option>
              <option value="h1">Başlık 1</option>
              <option value="h2">Başlık 2</option>
              <option value="h3">Başlık 3</option>
            </select>
          </div>

          <div class="sig-rte__toolbar-divider"></div>

          <!-- Lists -->
          <div class="sig-rte__toolbar-group">
            <button
              type="button"
              class="sig-rte__tool"
              title="Madde listesi"
              (click)="execCommand('insertUnorderedList')"
            >
              •
            </button>
            <button
              type="button"
              class="sig-rte__tool"
              title="Numaralı liste"
              (click)="execCommand('insertOrderedList')"
            >
              1.
            </button>
          </div>

          <div class="sig-rte__toolbar-divider"></div>

          <!-- Alignment -->
          <div class="sig-rte__toolbar-group">
            <button
              type="button"
              class="sig-rte__tool"
              title="Sola hizala"
              (click)="execCommand('justifyLeft')"
            >
              ⬅
            </button>
            <button
              type="button"
              class="sig-rte__tool"
              title="Ortala"
              (click)="execCommand('justifyCenter')"
            >
              ⬌
            </button>
            <button
              type="button"
              class="sig-rte__tool"
              title="Sağa hizala"
              (click)="execCommand('justifyRight')"
            >
              ➡
            </button>
          </div>

          <div class="sig-rte__toolbar-divider"></div>

          <!-- Insert -->
          <div class="sig-rte__toolbar-group">
            <button
              type="button"
              class="sig-rte__tool"
              title="Link ekle"
              (click)="insertLink()"
            >
              🔗
            </button>
            <button
              type="button"
              class="sig-rte__tool"
              title="Resim ekle"
              (click)="insertImage()"
            >
              🖼️
            </button>
          </div>

          <div class="sig-rte__toolbar-divider"></div>

          <!-- Undo/Redo -->
          <div class="sig-rte__toolbar-group">
            <button
              type="button"
              class="sig-rte__tool"
              title="Geri al"
              (click)="execCommand('undo')"
            >
              ↩
            </button>
            <button
              type="button"
              class="sig-rte__tool"
              title="Yinele"
              (click)="execCommand('redo')"
            >
              ↪
            </button>
          </div>

          <!-- Source -->
          @if (showSource()) {
            <div class="sig-rte__toolbar-group sig-rte__toolbar-group--right">
              <button
                type="button"
                class="sig-rte__tool"
                [class.sig-rte__tool--active]="isSourceMode()"
                title="Kaynak kodu"
                (click)="toggleSourceMode()"
              >
                &lt;/&gt;
              </button>
            </div>
          }
        </div>
      }

      <!-- Editor -->
      @if (!isSourceMode()) {
        <div
          #editor
          class="sig-rte__editor"
          contenteditable="true"
          [style.min-height.px]="minHeight()"
          [attr.placeholder]="placeholder()"
          (input)="onInput()"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (paste)="onPaste($event)"
        ></div>
      } @else {
        <textarea
          class="sig-rte__source"
          [style.min-height.px]="minHeight()"
          [value]="value()"
          (input)="onSourceInput($event)"
        ></textarea>
      }

      <!-- Character Count -->
      @if (showCharCount()) {
        <div class="sig-rte__footer">
          <span class="sig-rte__char-count">
            {{ charCount() }} karakter
            @if (maxLength()) {
              / {{ maxLength() }}
            }
          </span>
        </div>
      }
    </div>
  `,
    styles: [`
    .sig-rte {
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      overflow: hidden;
      background-color: white;
    }

    .sig-rte--focused {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .sig-rte--disabled {
      opacity: 0.6;
      pointer-events: none;
    }

    .sig-rte__toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem;
      border-bottom: 1px solid #e5e7eb;
      background-color: #f9fafb;
    }

    .sig-rte__toolbar-group {
      display: flex;
      align-items: center;
      gap: 0.125rem;
    }

    .sig-rte__toolbar-group--right {
      margin-left: auto;
    }

    .sig-rte__toolbar-divider {
  width: 1px;
  height: 1.5rem;
  margin: 0 0.25rem;
  background-color: #e5e7eb;
}

.sig-rte__tool {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 0.25rem;
  background: none;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.1s;
}

.sig-rte__tool:hover {
  background-color: #e5e7eb;
}

.sig-rte__tool--active {
  background-color: #dbeafe;
  color: #3b82f6;
}

.sig-rte__select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  background: white;
}

.sig-rte__editor {
  padding: 1rem;
  font-size: 0.875rem;
  line-height: 1.6;
  outline: none;
}

.sig-rte__editor:empty::before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
}

.sig-rte__editor p {
  margin: 0 0 0.5rem;
}

.sig-rte__editor h1,
.sig-rte__editor h2,
.sig-rte__editor h3 {
  margin: 1rem 0 0.5rem;
  line-height: 1.3;
}

.sig-rte__editor h1 { font-size: 1.5rem; }
.sig-rte__editor h2 { font-size: 1.25rem; }
.sig-rte__editor h3 { font-size: 1.125rem; }

.sig-rte__editor ul,
.sig-rte__editor ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.sig-rte__editor a {
  color: #3b82f6;
  text-decoration: underline;
}

.sig-rte__editor img {
  max-width: 100%;
  height: auto;
  border-radius: 0.25rem;
}

.sig-rte__source {
  width: 100%;
  padding: 1rem;
  border: none;
  font-family: monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  resize: vertical;
  outline: none;
}

.sig-rte__footer {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.sig-rte__char-count {
  font-size: 0.75rem;
  color: #6b7280;
}`],
})

export class SigRichTextEditorComponent implements ControlValueAccessor {
    readonly editorRef = viewChild<ElementRef>('editor');
    readonly value = model<string>('');
    readonly placeholder = input<string>('İçerik yazın...');
    readonly minHeight = input<number>(200);
    readonly maxLength = input<number | null>(null);
    readonly disabled = input<boolean>(false);
    readonly showToolbar = input<boolean>(true);
    readonly showCharCount = input<boolean>(true);
    readonly showSource = input<boolean>(true);
    readonly contentChange = output<string>();
    readonly isFocused = signal(false);
    readonly isSourceMode = signal(false);
    readonly charCount = signal(0);
    readonly formattingActions: ToolbarAction[] = [
        { id: 'bold', icon: 'B', title: 'Kalın', command: 'bold' },
        { id: 'italic', icon: 'I', title: 'İtalik', command: 'italic' },
        { id: 'underline', icon: 'U', title: 'Altı çizili', command: 'underline' },
        { id: 'strike', icon: 'S', title: 'Üstü çizili', command: 'strikeThrough' },
    ];
    private _onChange: (value: string) => void = () => { };
    private _onTouched: () => void = () => { };
    isActive(command: string): boolean {
        return document.queryCommandState(command);
    }
    execCommand(command: string, value?: string): void {
        document.execCommand(command, false, value);
        this.editorRef()?.nativeElement.focus();
        this.updateValue();
    }
    onHeadingChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        const value = select.value;

        if (value) {
            document.execCommand('formatBlock', false, value);
        } else {
            document.execCommand('formatBlock', false, 'p');
        }

        this.editorRef()?.nativeElement.focus();
        this.updateValue();
        select.value = '';
    }
    insertLink(): void {
        const url = prompt('Link URL:');
        if (url) {
            document.execCommand('createLink', false, url);
            this.updateValue();
        }
    }
    insertImage(): void {
        const url = prompt('Resim URL:');
        if (url) {
            document.execCommand('insertImage', false, url);
            this.updateValue();
        }
    }
    toggleSourceMode(): void {
        this.isSourceMode.update((v) => !v);
    }
    onInput(): void {
        this.updateValue();
    }
    onSourceInput(event: Event): void {
        const textarea = event.target as HTMLTextAreaElement;
        this.value.set(textarea.value);
        this._onChange(textarea.value);
        this.contentChange.emit(textarea.value);
        this.updateCharCount();
    }
    onFocus(): void {
        this.isFocused.set(true);
    }
    onBlur(): void {
        this.isFocused.set(false);
        this._onTouched();
    }
    onPaste(event: ClipboardEvent): void {
        event.preventDefault();
        const text = event.clipboardData?.getData('text/plain') || '';
        document.execCommand('insertText', false, text);
        this.updateValue();
    }
    private updateValue(): void {
        const el = this.editorRef()?.nativeElement;
        if (!el) return;

        const html = el.innerHTML;
        this.value.set(html);
        this._onChange(html);
        this.contentChange.emit(html);
        this.updateCharCount();

    }
    private updateCharCount(): void {
        const el = this.editorRef()?.nativeElement;
        if (el) {
            this.charCount.set(el.textContent?.length || 0);
        } else {
            this.charCount.set(this.value().replace(/<[^>]*>/g, '').length);
        }
    }
    writeValue(value: string): void {
        this.value.set(value || '');
        const el = this.editorRef()?.nativeElement;
        if (el) {
            el.innerHTML = value || '';
        }
        this.updateCharCount();
    }
    registerOnChange(fn: (value: string) => void): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }
    setDisabledState(_isDisabled: boolean): void { }
    // Public API
    focus(): void {
        this.editorRef()?.nativeElement.focus();
    }
    clear(): void {
        const el = this.editorRef()?.nativeElement;
        if (el) {
            el.innerHTML = '';
        }
        this.value.set('');
        this._onChange('');
    }
    getPlainText(): string {
        const el = this.editorRef()?.nativeElement;
        return el?.textContent || '';
    }
}