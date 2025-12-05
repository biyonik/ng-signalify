import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  Directive,
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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