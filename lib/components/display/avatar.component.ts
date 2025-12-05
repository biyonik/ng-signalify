import {
  Component,
  ChangeDetectionStrategy,
  computed,
  input,
  signal,
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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
  })
export class SigAvatarGroupComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly max = input<number>(5);
  readonly remaining = input<number>(0);
}