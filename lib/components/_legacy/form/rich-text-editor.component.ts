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
    ViewEncapsulation,
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
    encapsulation: ViewEncapsulation.None,
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