import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SigBadge - Signal-based badge/tag component
 * 
 * Usage:
 * <sig-badge>Default</sig-badge>
 * <sig-badge variant="success">Active</sig-badge>
 * <sig-badge variant="danger" [dot]="true">Error</sig-badge>
 * <sig-badge variant="primary" [removable]="true" (removed)="onRemove()">Tag</sig-badge>
 */
@Component({
  selector: 'sig-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span 
      class="sig-badge"
      [class.sig-badge--primary]="variant() === 'primary'"
      [class.sig-badge--secondary]="variant() === 'secondary'"
      [class.sig-badge--success]="variant() === 'success'"
      [class.sig-badge--danger]="variant() === 'danger'"
      [class.sig-badge--warning]="variant() === 'warning'"
      [class.sig-badge--info]="variant() === 'info'"
      [class.sig-badge--outline]="outline()"
      [class.sig-badge--sm]="size() === 'sm'"
      [class.sig-badge--lg]="size() === 'lg'"
      [class.sig-badge--rounded]="rounded()"
      [class.sig-badge--clickable]="clickable()"
    >
      @if (dot()) {
        <span class="sig-badge__dot"></span>
      }
      
      @if (icon()) {
        <span class="sig-badge__icon">{{ icon() }}</span>
      }
      
      <span class="sig-badge__content">
        <ng-content></ng-content>
      </span>

      @if (removable()) {
        <button
          type="button"
          class="sig-badge__remove"
          (click)="onRemove($event)"
          aria-label="Kaldır"
        >
          ✕
        </button>
      }
    </span>
  `,
  styles: [`
    .sig-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1.5;
      border-radius: 0.25rem;
      white-space: nowrap;
      transition: all 0.15s;
    }

    /* Sizes */
    .sig-badge--sm {
      padding: 0 0.375rem;
      font-size: 0.625rem;
    }

    .sig-badge--lg {
      padding: 0.25rem 0.625rem;
      font-size: 0.875rem;
    }

    .sig-badge--rounded {
      border-radius: 9999px;
    }

    .sig-badge--clickable {
      cursor: pointer;
    }

    /* Variants - Filled */
    .sig-badge {
      background-color: #e5e7eb;
      color: #374151;
    }

    .sig-badge--primary {
      background-color: #dbeafe;
      color: #1d4ed8;
    }

    .sig-badge--secondary {
      background-color: #f3f4f6;
      color: #4b5563;
    }

    .sig-badge--success {
      background-color: #d1fae5;
      color: #047857;
    }

    .sig-badge--danger {
      background-color: #fee2e2;
      color: #b91c1c;
    }

    .sig-badge--warning {
      background-color: #fef3c7;
      color: #b45309;
    }

    .sig-badge--info {
      background-color: #e0f2fe;
      color: #0369a1;
    }

    /* Variants - Outline */
    .sig-badge--outline {
      background-color: transparent;
      border: 1px solid currentColor;
    }

    .sig-badge--outline.sig-badge--primary {
      color: #3b82f6;
    }

    .sig-badge--outline.sig-badge--success {
      color: #10b981;
    }

    .sig-badge--outline.sig-badge--danger {
      color: #ef4444;
    }

    .sig-badge--outline.sig-badge--warning {
      color: #f59e0b;
    }

    .sig-badge--outline.sig-badge--info {
      color: #0ea5e9;
    }

    /* Dot */
    .sig-badge__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background-color: currentColor;
    }

    /* Icon */
    .sig-badge__icon {
      font-size: 0.875em;
    }

    /* Remove button */
    .sig-badge__remove {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1rem;
      height: 1rem;
      margin-left: 0.125rem;
      margin-right: -0.25rem;
      padding: 0;
      border: none;
      background: none;
      color: currentColor;
      opacity: 0.7;
      cursor: pointer;
      border-radius: 50%;
      font-size: 0.625rem;
      transition: all 0.15s;
    }

    .sig-badge__remove:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);
    }
  `],
})
export class SigBadgeComponent {
  readonly variant = input<'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'>('default');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly outline = input<boolean>(false);
  readonly rounded = input<boolean>(false);
  readonly dot = input<boolean>(false);
  readonly icon = input<string>('');
  readonly removable = input<boolean>(false);
  readonly clickable = input<boolean>(false);

  onRemove(event: Event): void {
    event.stopPropagation();
    // Parent can listen via (click) on the badge or use template reference
  }
}

/**
 * SigBadgeCount - Notification badge for icons/avatars
 * 
 * Usage:
 * <sig-badge-count [count]="5">
 *   <button>🔔</button>
 * </sig-badge-count>
 */
@Component({
  selector: 'sig-badge-count',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sig-badge-count">
      <ng-content></ng-content>
      
      @if (show()) {
        <span 
          class="sig-badge-count__badge"
          [class.sig-badge-count__badge--dot]="dot()"
          [class.sig-badge-count__badge--sm]="size() === 'sm'"
          [class.sig-badge-count__badge--lg]="size() === 'lg'"
          [style.background-color]="color()"
        >
          @if (!dot()) {
            {{ displayCount() }}
          }
        </span>
      }
    </div>
  `,
  styles: [`
    .sig-badge-count {
      position: relative;
      display: inline-flex;
    }

    .sig-badge-count__badge {
      position: absolute;
      top: 0;
      right: 0;
      transform: translate(50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.375rem;
      background-color: #ef4444;
      color: white;
      font-size: 0.625rem;
      font-weight: 600;
      border-radius: 9999px;
      border: 2px solid white;
    }

    .sig-badge-count__badge--sm {
      min-width: 1rem;
      height: 1rem;
      font-size: 0.5rem;
      padding: 0 0.25rem;
    }

    .sig-badge-count__badge--lg {
      min-width: 1.5rem;
      height: 1.5rem;
      font-size: 0.75rem;
    }

    .sig-badge-count__badge--dot {
      min-width: 0.5rem;
      width: 0.5rem;
      height: 0.5rem;
      padding: 0;
    }

    .sig-badge-count__badge--dot.sig-badge-count__badge--sm {
      min-width: 0.375rem;
      width: 0.375rem;
      height: 0.375rem;
    }

    .sig-badge-count__badge--dot.sig-badge-count__badge--lg {
      min-width: 0.75rem;
      width: 0.75rem;
      height: 0.75rem;
    }
  `],
})
export class SigBadgeCountComponent {
  readonly count = input<number>(0);
  readonly max = input<number>(99);
  readonly dot = input<boolean>(false);
  readonly showZero = input<boolean>(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly color = input<string>('#ef4444');

  readonly show = computed(() => {
    return this.dot() || this.count() > 0 || this.showZero();
  });

  readonly displayCount = computed(() => {
    const count = this.count();
    const max = this.max();
    return count > max ? `${max}+` : count.toString();
  });
}