import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SigAlert - Signal-based inline alert component
 * 
 * Usage:
 * <sig-alert variant="success" title="Başarılı!">
 *   İşlem başarıyla tamamlandı.
 * </sig-alert>
 * 
 * <sig-alert variant="danger" [dismissible]="true" (dismissed)="onDismiss()">
 *   Bir hata oluştu.
 * </sig-alert>
 */
@Component({
  selector: 'sig-alert',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!dismissed()) {
      <div 
        class="sig-alert"
        [class.sig-alert--info]="variant() === 'info'"
        [class.sig-alert--success]="variant() === 'success'"
        [class.sig-alert--warning]="variant() === 'warning'"
        [class.sig-alert--danger]="variant() === 'danger'"
        [class.sig-alert--outline]="outline()"
        [class.sig-alert--compact]="compact()"
        role="alert"
      >
        <!-- Icon -->
        @if (showIcon()) {
          <div class="sig-alert__icon">
            @if (icon()) {
              {{ icon() }}
            } @else {
              @switch (variant()) {
                @case ('info') { ℹ️ }
                @case ('success') { ✅ }
                @case ('warning') { ⚠️ }
                @case ('danger') { ❌ }
              }
            }
          </div>
        }

        <!-- Content -->
        <div class="sig-alert__content">
          @if (title()) {
            <div class="sig-alert__title">{{ title() }}</div>
          }
          <div class="sig-alert__message">
            <ng-content></ng-content>
          </div>
          
          <!-- Actions -->
          @if (hasActions()) {
            <div class="sig-alert__actions">
              <ng-content select="[alert-actions]"></ng-content>
            </div>
          }
        </div>

        <!-- Dismiss button -->
        @if (dismissible()) {
          <button
            type="button"
            class="sig-alert__dismiss"
            (click)="dismiss()"
            aria-label="Kapat"
          >
            ✕
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .sig-alert {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid transparent;
    }

    .sig-alert--compact {
      padding: 0.75rem;
      gap: 0.5rem;
    }

    /* Variants - Filled */
    .sig-alert--info {
      background-color: #eff6ff;
      border-color: #bfdbfe;
      color: #1e40af;
    }

    .sig-alert--success {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }

    .sig-alert--warning {
      background-color: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }

    .sig-alert--danger {
      background-color: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }

    /* Variants - Outline */
    .sig-alert--outline {
      background-color: white;
    }

    .sig-alert--outline.sig-alert--info {
      border-color: #3b82f6;
    }

    .sig-alert--outline.sig-alert--success {
      border-color: #10b981;
    }

    .sig-alert--outline.sig-alert--warning {
      border-color: #f59e0b;
    }

    .sig-alert--outline.sig-alert--danger {
      border-color: #ef4444;
    }

    .sig-alert__icon {
      flex-shrink: 0;
      font-size: 1.25rem;
      line-height: 1;
    }

    .sig-alert__content {
      flex: 1;
      min-width: 0;
    }

    .sig-alert__title {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .sig-alert__message {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .sig-alert__actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .sig-alert__dismiss {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      border: none;
      background: none;
      color: currentColor;
      opacity: 0.5;
      cursor: pointer;
      border-radius: 0.25rem;
      transition: opacity 0.15s;
    }

    .sig-alert__dismiss:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);
    }
  `],
})
export class SigAlertComponent {
  readonly variant = input<'info' | 'success' | 'warning' | 'danger'>('info');
  readonly title = input<string>('');
  readonly icon = input<string>('');
  readonly showIcon = input<boolean>(true);
  readonly dismissible = input<boolean>(false);
  readonly outline = input<boolean>(false);
  readonly compact = input<boolean>(false);
  readonly hasActions = input<boolean>(false);

  readonly dismissedEvent = output<void>();

  readonly dismissed = signal(false);

  dismiss(): void {
    this.dismissed.set(true);
    this.dismissedEvent.emit();
  }

  // Public API
  show(): void {
    this.dismissed.set(false);
  }
}