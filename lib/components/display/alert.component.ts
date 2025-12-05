import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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