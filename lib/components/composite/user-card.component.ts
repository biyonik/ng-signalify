import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
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
  styles: [`
    .sig-user-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1.5rem;
      background-color: white;
      border-radius: 0.75rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .sig-user-card--horizontal {
      flex-direction: row;
      text-align: left;
      gap: 1rem;
    }

    .sig-user-card--compact {
      padding: 1rem;
    }

    .sig-user-card--bordered {
      box-shadow: none;
      border: 1px solid #e5e7eb;
    }

    .sig-user-card__cover {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 80px;
      background-size: cover;
      background-position: center;
    }

    .sig-user-card__avatar-container {
      position: relative;
      margin-bottom: 0.75rem;
    }

    .sig-user-card--horizontal .sig-user-card__avatar-container {
      margin-bottom: 0;
      flex-shrink: 0;
    }

    .sig-user-card__avatar {
      width: 5rem;
      height: 5rem;
      border-radius: 50%;
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 600;
      color: white;
      border: 4px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .sig-user-card__avatar--sm {
      width: 3.5rem;
      height: 3.5rem;
      font-size: 1rem;
      border-width: 2px;
    }

    .sig-user-card__initials {
      text-transform: uppercase;
    }

    .sig-user-card__status {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid white;
    }

    .sig-user-card__status--online { background-color: #10b981; }
    .sig-user-card__status--offline { background-color: #9ca3af; }
    .sig-user-card__status--busy { background-color: #ef4444; }
    .sig-user-card__status--away { background-color: #f59e0b; }

    .sig-user-card__verified {
      position: absolute;
      top: 0;
      right: 0;
      width: 1.25rem;
      height: 1.25rem;
      background-color: #3b82f6;
      color: white;
      border-radius: 50%;
      font-size: 0.625rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
    }

    .sig-user-card__info {
      flex: 1;
      min-width: 0;
    }

    .sig-user-card__name {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .sig-user-card--horizontal .sig-user-card__name {
      justify-content: flex-start;
    }

    .sig-user-card__badge {
      padding: 0.125rem 0.5rem;
      font-size: 0.625rem;
      font-weight: 600;
      background-color: #dbeafe;
      color: #1d4ed8;
      border-radius: 9999px;
    }

    .sig-user-card__role {
      margin: 0.25rem 0 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .sig-user-card__email {
      margin: 0.25rem 0 0;
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .sig-user-card__bio {
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
      color: #4b5563;
      line-height: 1.5;
    }

    .sig-user-card__rating {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      margin-top: 0.5rem;
    }

    .sig-user-card--horizontal .sig-user-card__rating {
      justify-content: flex-start;
    }

    .sig-user-card__stars {
      color: #d1d5db;
    }

    .sig-user-card__star--filled {
      color: #fbbf24;
    }

    .sig-user-card__rating-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .sig-user-card__review-count {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .sig-user-card__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      justify-content: center;
      margin-top: 0.5rem;
    }

    .sig-user-card--horizontal .sig-user-card__tags {
      justify-content: flex-start;
    }

    .sig-user-card__tag {
      padding: 0.125rem 0.5rem;
      font-size: 0.625rem;
      background-color: #f3f4f6;
      color: #6b7280;
      border-radius: 0.25rem;
    }

    .sig-user-card__stats {
      display: flex;
      gap: 1.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      width: 100%;
      justify-content: center;
    }

    .sig-user-card--horizontal .sig-user-card__stats {
      justify-content: flex-start;
      border-top: none;
      border-left: 1px solid #e5e7eb;
      padding-top: 0;
      padding-left: 1rem;
      margin-top: 0;
      margin-left: 1rem;
    }

    .sig-user-card__stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .sig-user-card__stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
    }

    .sig-user-card__stat-label {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .sig-user-card__actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      width: 100%;
    }

    .sig-user-card__action {
      flex: 1;
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      transition: all 0.15s;
    }

    .sig-user-card__action:hover {
      background-color: #f9fafb;
    }

    .sig-user-card__action--primary {
      background-color: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .sig-user-card__action--primary:hover {
      background-color: #2563eb;
    }

    .sig-user-card__action--danger {
      color: #ef4444;
      border-color: #fecaca;
    }

    .sig-user-card__action--danger:hover {
      background-color: #fef2f2;
    }

    .sig-user-card__social {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .sig-user-card__social-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background-color: #f3f4f6;
      color: #6b7280;
      text-decoration: none;
      transition: all 0.15s;
    }

    .sig-user-card__social-link:hover {
      background-color: #e5e7eb;
      color: #374151;
    }
  `],
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