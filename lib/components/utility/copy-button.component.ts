import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SigCopyButton - Signal-based copy to clipboard button
 * 
 * Usage:
 * <sig-copy-button [content]="textToCopy" />
 * 
 * <sig-copy-button [content]="code" variant="icon" />
 */
@Component({
  selector: 'sig-copy-button',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="sig-copy-button"
      [class.sig-copy-button--icon]="variant() === 'icon'"
      [class.sig-copy-button--sm]="size() === 'sm'"
      [class.sig-copy-button--lg]="size() === 'lg'"
      [class.sig-copy-button--success]="copied()"
      [disabled]="disabled()"
      (click)="copy()"
      [title]="copied() ? successTooltip() : tooltip()"
    >
      @if (variant() === 'icon') {
        <span class="sig-copy-button__icon">
          {{ copied() ? '✓' : '📋' }}
        </span>
      } @else {
        <span class="sig-copy-button__icon">
          {{ copied() ? '✓' : '📋' }}
        </span>
        <span class="sig-copy-button__label">
          {{ copied() ? successLabel() : label() }}
        </span>
      }
    </button>
  `,
  styles: [`
    .sig-copy-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s;
    }

    .sig-copy-button:hover:not(:disabled) {
      background-color: #f9fafb;
      border-color: #9ca3af;
    }

    .sig-copy-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sig-copy-button--success {
      background-color: #d1fae5;
      border-color: #10b981;
      color: #047857;
    }

    .sig-copy-button--icon {
      padding: 0.375rem;
    }

    .sig-copy-button--sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }

    .sig-copy-button--sm.sig-copy-button--icon {
      padding: 0.25rem;
    }

    .sig-copy-button--lg {
      padding: 0.5rem 1rem;
      font-size: 1rem;
    }

    .sig-copy-button--lg.sig-copy-button--icon {
      padding: 0.5rem;
    }

    .sig-copy-button__icon {
      font-size: 1em;
    }
  `],
})
export class SigCopyButtonComponent {
  readonly content = input.required<string>();
  readonly variant = input<'button' | 'icon'>('button');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly label = input<string>('Kopyala');
  readonly successLabel = input<string>('Kopyalandı!');
  readonly tooltip = input<string>('Panoya kopyala');
  readonly successTooltip = input<string>('Kopyalandı!');
  readonly disabled = input<boolean>(false);
  readonly resetDelay = input<number>(2000);

  readonly copiedEvent = output<string>();
  readonly errorEvent = output<Error>();

  readonly copied = signal(false);

  private resetTimeout: ReturnType<typeof setTimeout> | null = null;

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.content());
      this.copied.set(true);
      this.copiedEvent.emit(this.content());

      // Reset after delay
      if (this.resetTimeout) {
        clearTimeout(this.resetTimeout);
      }
      this.resetTimeout = setTimeout(() => {
        this.copied.set(false);
      }, this.resetDelay());
    } catch (error) {
      this.errorEvent.emit(error as Error);
    }
  }
}

/**
 * SigCopyable - Wrapper that makes content copyable
 * 
 * Usage:
 * <sig-copyable [content]="code">
 *   <pre>{{ code }}</pre>
 * </sig-copyable>
 */
@Component({
  selector: 'sig-copyable',
  standalone: true,
  imports: [CommonModule, SigCopyButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sig-copyable">
      <div class="sig-copyable__content">
        <ng-content></ng-content>
      </div>
      <div class="sig-copyable__button">
        <sig-copy-button 
          [content]="content()" 
          variant="icon"
          size="sm"
        />
      </div>
    </div>
  `,
  styles: [`
    .sig-copyable {
      position: relative;
    }

    .sig-copyable__content {
      /* Content styling */
    }

    .sig-copyable__button {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      opacity: 0;
      transition: opacity 0.15s;
    }

    .sig-copyable:hover .sig-copyable__button {
      opacity: 1;
    }
  `],
})
export class SigCopyableComponent {
  readonly content = input.required<string>();
}