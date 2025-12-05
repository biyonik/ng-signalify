import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  Directive,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Card Header Directive
 */
@Directive({
  selector: '[sigCardHeader], sig-card-header',
  standalone: true,
  host: { class: 'sig-card__header' },
})
export class SigCardHeaderDirective {}

/**
 * Card Footer Directive
 */
@Directive({
  selector: '[sigCardFooter], sig-card-footer',
  standalone: true,
  host: { class: 'sig-card__footer' },
})
export class SigCardFooterDirective {}

/**
 * Card Actions Directive
 */
@Directive({
  selector: '[sigCardActions], sig-card-actions',
  standalone: true,
  host: { class: 'sig-card__actions' },
})
export class SigCardActionsDirective {}

/**
 * SigCard - Signal-based card component
 * 
 * Usage:
 * <sig-card [hoverable]="true" [clickable]="true" (clicked)="onCardClick()">
 *   <sig-card-header>
 *     <h3>Card Title</h3>
 *   </sig-card-header>
 *   
 *   <p>Card content...</p>
 *   
 *   <sig-card-footer>
 *     <button>Action</button>
 *   </sig-card-footer>
 * </sig-card>
 */
@Component({
  selector: 'sig-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-card"
      [class.sig-card--hoverable]="hoverable()"
      [class.sig-card--clickable]="clickable()"
      [class.sig-card--selected]="selected()"
      [class.sig-card--disabled]="disabled()"
      [class.sig-card--bordered]="bordered()"
      [class.sig-card--flat]="flat()"
      [class.sig-card--compact]="compact()"
      [class]="'sig-card--' + variant()"
      [attr.tabindex]="clickable() && !disabled() ? 0 : null"
      (click)="onClick($event)"
      (keydown.enter)="onClick($event)"
    >
      <!-- Image -->
      @if (image()) {
        <div class="sig-card__image-container">
          <img 
            [src]="image()" 
            [alt]="imageAlt()"
            class="sig-card__image"
            [class.sig-card__image--cover]="imageFit() === 'cover'"
            [class.sig-card__image--contain]="imageFit() === 'contain'"
          />
          @if (imageOverlay()) {
            <div class="sig-card__image-overlay">
              <ng-content select="[card-overlay]"></ng-content>
            </div>
          }
        </div>
      }

      <!-- Header (projected) -->
      <ng-content select="[sigCardHeader], sig-card-header"></ng-content>

      <!-- Body -->
      <div class="sig-card__body" [class.sig-card__body--no-padding]="noPadding()">
        <ng-content></ng-content>
      </div>

      <!-- Actions (projected) -->
      <ng-content select="[sigCardActions], sig-card-actions"></ng-content>

      <!-- Footer (projected) -->
      <ng-content select="[sigCardFooter], sig-card-footer"></ng-content>

      <!-- Loading overlay -->
      @if (loading()) {
        <div class="sig-card__loading">
          <div class="sig-card__spinner"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-card {
      position: relative;
      display: flex;
      flex-direction: column;
      background-color: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      transition: all 0.2s;
    }

    .sig-card--bordered {
      box-shadow: none;
      border: 1px solid #e5e7eb;
    }

    .sig-card--flat {
      box-shadow: none;
      border: none;
      background-color: #f9fafb;
    }

    .sig-card--hoverable:hover {
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      transform: translateY(-2px);
    }

    .sig-card--clickable {
      cursor: pointer;
    }

    .sig-card--clickable:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    }

    .sig-card--selected {
      border: 2px solid #3b82f6;
    }

    .sig-card--disabled {
      opacity: 0.6;
      pointer-events: none;
    }

    .sig-card--compact .sig-card__body {
      padding: 0.75rem;
    }

    /* Variants */
    .sig-card--primary {
      border-top: 4px solid #3b82f6;
    }

    .sig-card--success {
      border-top: 4px solid #10b981;
    }

    .sig-card--warning {
      border-top: 4px solid #f59e0b;
    }

    .sig-card--danger {
      border-top: 4px solid #ef4444;
    }

    /* Image */
    .sig-card__image-container {
      position: relative;
      width: 100%;
      overflow: hidden;
    }

    .sig-card__image {
      width: 100%;
      height: 200px;
      object-fit: cover;
    }

    .sig-card__image--cover {
      object-fit: cover;
    }

    .sig-card__image--contain {
      object-fit: contain;
      background-color: #f3f4f6;
    }

    .sig-card__image-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
      display: flex;
      align-items: flex-end;
      padding: 1rem;
      color: white;
    }

    /* Header */
    :host ::ng-deep .sig-card__header {
      padding: 1rem 1rem 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    :host ::ng-deep .sig-card__header h1,
    :host ::ng-deep .sig-card__header h2,
    :host ::ng-deep .sig-card__header h3,
    :host ::ng-deep .sig-card__header h4 {
      margin: 0;
      font-weight: 600;
      color: #111827;
    }

    /* Body */
    .sig-card__body {
      flex: 1;
      padding: 1rem;
    }

    .sig-card__body--no-padding {
      padding: 0;
    }

    /* Actions */
    :host ::ng-deep .sig-card__actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0 1rem 1rem;
    }

    /* Footer */
    :host ::ng-deep .sig-card__footer {
      padding: 0.75rem 1rem;
      background-color: #f9fafb;
      border-top: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Loading */
    .sig-card__loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.8);
      z-index: 10;
    }

    .sig-card__spinner {
      width: 2rem;
      height: 2rem;
      border: 3px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class SigCardComponent {
  readonly image = input<string>('');
  readonly imageAlt = input<string>('');
  readonly imageFit = input<'cover' | 'contain'>('cover');
  readonly imageOverlay = input<boolean>(false);
  
  readonly hoverable = input<boolean>(false);
  readonly clickable = input<boolean>(false);
  readonly selected = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly bordered = input<boolean>(false);
  readonly flat = input<boolean>(false);
  readonly compact = input<boolean>(false);
  readonly noPadding = input<boolean>(false);
  readonly variant = input<'default' | 'primary' | 'success' | 'warning' | 'danger'>('default');

  readonly clicked = output<MouseEvent | KeyboardEvent>();

  onClick(event: MouseEvent | KeyboardEvent): void {
    if (this.clickable() && !this.disabled()) {
      this.clicked.emit(event);
    }
  }
}