import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UserCardAction {
  id: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'primary' | 'danger';
}

/**
 * SigUserCard - Signal-based user profile card
 * 
 * Usage:
 * <sig-user-card
 *   name="Ahmet Altun"
 *   role="Senior Developer"
 *   avatar="https://example.com/photo.jpg"
 *   [status]="'online'"
 *   [rating]="4.9"
 *   [stats]="[{label: 'Projeler', value: 24}, {label: 'Görevler', value: 142}]"
 *   [actions]="[{id: 'message', label: 'Mesaj', icon: '💬'}]"
 *   (actionClick)="onAction($event)"
 * />
 */
@Component({
  selector: 'sig-user-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div 
      class="sig-user-card"
      [class.sig-user-card--horizontal]="layout() === 'horizontal'"
      [class.sig-user-card--compact]="compact()"
      [class.sig-user-card--bordered]="bordered()"
    >
      <!-- Cover Image -->
      @if (coverImage() && layout() !== 'horizontal') {
        <div 
          class="sig-user-card__cover"
          [style.background-image]="'url(' + coverImage() + ')'"
        ></div>
      }

      <!-- Avatar -->
      <div class="sig-user-card__avatar-container">
        <div 
          class="sig-user-card__avatar"
          [class.sig-user-card__avatar--sm]="compact()"
          [style.background-image]="avatar() ? 'url(' + avatar() + ')' : null"
          [style.background-color]="!avatar() ? avatarColor() : null"
        >
          @if (!avatar()) {
            <span class="sig-user-card__initials">{{ initials() }}</span>
          }
        </div>
        
        @if (status()) {
          <span 
            class="sig-user-card__status"
            [class.sig-user-card__status--online]="status() === 'online'"
            [class.sig-user-card__status--offline]="status() === 'offline'"
            [class.sig-user-card__status--busy]="status() === 'busy'"
            [class.sig-user-card__status--away]="status() === 'away'"
          ></span>
        }

        @if (verified()) {
          <span class="sig-user-card__verified" title="Doğrulanmış">✓</span>
        }
      </div>

      <!-- Info -->
      <div class="sig-user-card__info">
        <h3 class="sig-user-card__name">
          {{ name() }}
          @if (badge()) {
            <span class="sig-user-card__badge">{{ badge() }}</span>
          }
        </h3>
        
        @if (role()) {
          <p class="sig-user-card__role">{{ role() }}</p>
        }

        @if (email()) {
          <p class="sig-user-card__email">{{ email() }}</p>
        }

        @if (bio()) {
          <p class="sig-user-card__bio">{{ bio() }}</p>
        }

        <!-- Rating -->
        @if (rating() !== null) {
          <div class="sig-user-card__rating">
            <span class="sig-user-card__stars">
              @for (star of [1,2,3,4,5]; track star) {
                <span [class.sig-user-card__star--filled]="star <= Math.round(rating()!)">
                  ★
                </span>
              }
            </span>
            <span class="sig-user-card__rating-value">{{ rating() }}</span>
            @if (reviewCount() !== null) {
              <span class="sig-user-card__review-count">({{ reviewCount() }})</span>
            }
          </div>
        }

        <!-- Tags -->
        @if (tags().length > 0) {
          <div class="sig-user-card__tags">
            @for (tag of tags(); track tag) {
              <span class="sig-user-card__tag">{{ tag }}</span>
            }
          </div>
        }
      </div>

      <!-- Stats -->
      @if (stats().length > 0) {
        <div class="sig-user-card__stats">
          @for (stat of stats(); track stat.label) {
            <div class="sig-user-card__stat">
              <span class="sig-user-card__stat-value">{{ stat.value }}</span>
              <span class="sig-user-card__stat-label">{{ stat.label }}</span>
            </div>
          }
        </div>
      }

      <!-- Actions -->
      @if (actions().length > 0) {
        <div class="sig-user-card__actions">
          @for (action of actions(); track action.id) {
            <button
              type="button"
              class="sig-user-card__action"
              [class.sig-user-card__action--primary]="action.variant === 'primary'"
              [class.sig-user-card__action--danger]="action.variant === 'danger'"
              (click)="onActionClick(action)"
            >
              @if (action.icon) {
                <span class="sig-user-card__action-icon">{{ action.icon }}</span>
              }
              {{ action.label }}
            </button>
          }
        </div>
      }

      <!-- Social Links -->
      @if (socialLinks().length > 0) {
        <div class="sig-user-card__social">
          @for (link of socialLinks(); track link.url) {
            <a 
              [href]="link.url" 
              target="_blank"
              class="sig-user-card__social-link"
              [title]="link.label"
            >
              {{ link.icon }}
            </a>
          }
        </div>
      }
    </div>
  `,
  })
export class SigUserCardComponent {
  readonly Math = Math;

  readonly name = input.required<string>();
  readonly avatar = input<string>('');
  readonly role = input<string>('');
  readonly email = input<string>('');
  readonly bio = input<string>('');
  readonly status = input<'online' | 'offline' | 'busy' | 'away' | null>(null);
  readonly verified = input<boolean>(false);
  readonly badge = input<string>('');
  readonly coverImage = input<string>('');
  readonly rating = input<number | null>(null);
  readonly reviewCount = input<number | null>(null);
  readonly tags = input<string[]>([]);
  readonly stats = input<Array<{ label: string; value: string | number }>>([]);
  readonly actions = input<UserCardAction[]>([]);
  readonly socialLinks = input<Array<{ icon: string; url: string; label: string }>>([]);
  readonly layout = input<'vertical' | 'horizontal'>('vertical');
  readonly compact = input<boolean>(false);
  readonly bordered = input<boolean>(false);

  readonly actionClick = output<UserCardAction>();

  readonly initials = () => {
    const n = this.name();
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  readonly avatarColor = () => {
    const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#f472b6'];
    let hash = 0;
    const n = this.name();
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  onActionClick(action: UserCardAction): void {
    this.actionClick.emit(action);
  }
}