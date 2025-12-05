import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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