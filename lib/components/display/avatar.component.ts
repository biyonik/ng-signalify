import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SigAvatar - Signal-based avatar component
 * 
 * Usage:
 * <sig-avatar 
 *   src="https://example.com/photo.jpg"
 *   name="Ahmet Altun"
 *   size="lg"
 *   [online]="true"
 * />
 */
@Component({
  selector: 'sig-avatar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-avatar"
      [class.sig-avatar--xs]="size() === 'xs'"
      [class.sig-avatar--sm]="size() === 'sm'"
      [class.sig-avatar--md]="size() === 'md'"
      [class.sig-avatar--lg]="size() === 'lg'"
      [class.sig-avatar--xl]="size() === 'xl'"
      [class.sig-avatar--2xl]="size() === '2xl'"
      [class.sig-avatar--square]="shape() === 'square'"
      [class.sig-avatar--rounded]="shape() === 'rounded'"
      [class.sig-avatar--clickable]="clickable()"
      [style.--avatar-bg]="backgroundColor()"
      [attr.title]="name()"
    >
      @if (src() && !imageError()) {
        <img 
          [src]="src()" 
          [alt]="name()"
          class="sig-avatar__image"
          (error)="onImageError()"
        />
      } @else if (icon()) {
        <span class="sig-avatar__icon">{{ icon() }}</span>
      } @else {
        <span class="sig-avatar__initials">{{ initials() }}</span>
      }

      <!-- Status indicator -->
      @if (status()) {
        <span 
          class="sig-avatar__status"
          [class.sig-avatar__status--online]="status() === 'online'"
          [class.sig-avatar__status--offline]="status() === 'offline'"
          [class.sig-avatar__status--busy]="status() === 'busy'"
          [class.sig-avatar__status--away]="status() === 'away'"
        ></span>
      }

      <!-- Badge -->
      @if (badge() !== null) {
        <span class="sig-avatar__badge">
          {{ badge() }}
        </span>
      }
    </div>
  `,
  styles: [`
    .sig-avatar {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: var(--avatar-bg, #e5e7eb);
      color: #374151;
      font-weight: 600;
      overflow: hidden;
      flex-shrink: 0;
    }

    .sig-avatar--clickable {
      cursor: pointer;
    }

    .sig-avatar--square {
      border-radius: 0.25rem;
    }

    .sig-avatar--rounded {
      border-radius: 0.5rem;
    }

    /* Sizes */
    .sig-avatar--xs {
      width: 1.5rem;
      height: 1.5rem;
      font-size: 0.625rem;
    }

    .sig-avatar--sm {
      width: 2rem;
      height: 2rem;
      font-size: 0.75rem;
    }

    .sig-avatar--md {
      width: 2.5rem;
      height: 2.5rem;
      font-size: 0.875rem;
    }

    .sig-avatar--lg {
      width: 3rem;
      height: 3rem;
      font-size: 1rem;
    }

    .sig-avatar--xl {
      width: 4rem;
      height: 4rem;
      font-size: 1.25rem;
    }

    .sig-avatar--2xl {
      width: 5rem;
      height: 5rem;
      font-size: 1.5rem;
    }

    .sig-avatar__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sig-avatar__icon {
      font-size: 1.25em;
    }

    .sig-avatar__initials {
      text-transform: uppercase;
      user-select: none;
    }

    /* Status */
    .sig-avatar__status {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 25%;
      height: 25%;
      min-width: 8px;
      min-height: 8px;
      border-radius: 50%;
      border: 2px solid white;
    }

    .sig-avatar__status--online {
      background-color: #10b981;
    }

    .sig-avatar__status--offline {
      background-color: #9ca3af;
    }

    .sig-avatar__status--busy {
      background-color: #ef4444;
    }

    .sig-avatar__status--away {
      background-color: #f59e0b;
    }

    /* Badge */
    .sig-avatar__badge {
      position: absolute;
      top: -2px;
      right: -2px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 1.25rem;
      height: 1.25rem;
      padding: 0 0.25rem;
      background-color: #ef4444;
      color: white;
      font-size: 0.625rem;
      font-weight: 600;
      border-radius: 9999px;
      border: 2px solid white;
    }
  `],
})
export class SigAvatarComponent {
  readonly src = input<string>('');
  readonly name = input<string>('');
  readonly icon = input<string>('');
  readonly size = input<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('md');
  readonly shape = input<'circle' | 'square' | 'rounded'>('circle');
  readonly status = input<'online' | 'offline' | 'busy' | 'away' | null>(null);
  readonly badge = input<string | number | null>(null);
  readonly clickable = input<boolean>(false);
  readonly color = input<string>('');

  readonly imageError = signal(false);

  readonly initials = computed(() => {
    const name = this.name();
    if (!name) return '?';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  readonly backgroundColor = computed(() => {
    if (this.color()) return this.color();
    if (this.src() && !this.imageError()) return 'transparent';
    
    // Generate color from name
    const name = this.name();
    if (!name) return '#e5e7eb';
    
    const colors = [
      '#f87171', '#fb923c', '#fbbf24', '#a3e635',
      '#34d399', '#22d3ee', '#60a5fa', '#a78bfa',
      '#f472b6', '#fb7185',
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  });

  onImageError(): void {
    this.imageError.set(true);
  }
}

/**
 * SigAvatarGroup - Group of avatars with stacking
 */
@Component({
  selector: 'sig-avatar-group',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-avatar-group"
      [class.sig-avatar-group--sm]="size() === 'sm'"
      [class.sig-avatar-group--lg]="size() === 'lg'"
    >
      <ng-content></ng-content>
      
      @if (remaining() > 0) {
        <div class="sig-avatar-group__remaining">
          +{{ remaining() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-avatar-group {
      display: flex;
      align-items: center;
    }

    .sig-avatar-group ::ng-deep .sig-avatar {
      margin-left: -0.5rem;
      border: 2px solid white;
    }

    .sig-avatar-group ::ng-deep .sig-avatar:first-child {
      margin-left: 0;
    }

    .sig-avatar-group--sm ::ng-deep .sig-avatar {
      margin-left: -0.375rem;
    }

    .sig-avatar-group--lg ::ng-deep .sig-avatar {
      margin-left: -0.75rem;
    }

    .sig-avatar-group__remaining {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      margin-left: -0.5rem;
      border-radius: 50%;
      background-color: #e5e7eb;
      color: #374151;
      font-size: 0.75rem;
      font-weight: 600;
      border: 2px solid white;
    }

    .sig-avatar-group--sm .sig-avatar-group__remaining {
      width: 2rem;
      height: 2rem;
      font-size: 0.625rem;
    }

    .sig-avatar-group--lg .sig-avatar-group__remaining {
      width: 3rem;
      height: 3rem;
      font-size: 0.875rem;
    }
  `],
})
export class SigAvatarGroupComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly max = input<number>(5);
  readonly remaining = input<number>(0);
}