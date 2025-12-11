import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  model,
  signal,
  effect,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SigDrawer - Signal-based drawer/sidebar component
 * 
 * Usage:
 * <sig-drawer [(open)]="isDrawerOpen" position="right" [width]="400">
 *   <div drawer-header>
 *     <h3>Drawer Title</h3>
 *   </div>
 *   
 *   <div drawer-content>
 *     Content here...
 *   </div>
 *   
 *   <div drawer-footer>
 *     <button (click)="isDrawerOpen = false">Kapat</button>
 *   </div>
 * </sig-drawer>
 */
@Component({
  selector: 'sig-drawer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (open()) {
      <!-- Backdrop -->
      <div 
        class="sig-drawer__backdrop"
        [class.sig-drawer__backdrop--transparent]="!showBackdrop()"
        (click)="onBackdropClick()"
      ></div>

      <!-- Drawer -->
      <div 
        class="sig-drawer"
        [class.sig-drawer--left]="position() === 'left'"
        [class.sig-drawer--right]="position() === 'right'"
        [class.sig-drawer--top]="position() === 'top'"
        [class.sig-drawer--bottom]="position() === 'bottom'"
        [style.width.px]="isHorizontal() ? width() : null"
        [style.height.px]="!isHorizontal() ? height() : null"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        @if (showHeader()) {
          <div class="sig-drawer__header">
            <div class="sig-drawer__title">
              <ng-content select="[drawer-header]"></ng-content>
            </div>
            @if (showClose()) {
              <button
                type="button"
                class="sig-drawer__close"
                (click)="close()"
                aria-label="Kapat"
              >
                ✕
              </button>
            }
          </div>
        }

        <!-- Content -->
        <div class="sig-drawer__content">
          <ng-content select="[drawer-content]"></ng-content>
          <ng-content></ng-content>
        </div>

        <!-- Footer -->
        @if (showFooter()) {
          <div class="sig-drawer__footer">
            <ng-content select="[drawer-footer]"></ng-content>
          </div>
        }
      </div>
    }
  `,
    host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class SigDrawerComponent {
  readonly open = model<boolean>(false);
  readonly position = input<'left' | 'right' | 'top' | 'bottom'>('right');
  readonly width = input<number>(320);
  readonly height = input<number>(320);
  readonly showBackdrop = input<boolean>(true);
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnEscape = input<boolean>(true);
  readonly showHeader = input<boolean>(true);
  readonly showFooter = input<boolean>(true);
  readonly showClose = input<boolean>(true);

  readonly opened = output<void>();
  readonly closed = output<void>();

  readonly isHorizontal = signal(true);

  constructor() {
    effect(() => {
      const pos = this.position();
      this.isHorizontal.set(pos === 'left' || pos === 'right');
    });

    effect(() => {
      if (this.open()) {
        document.body.style.overflow = 'hidden';
        this.opened.emit();
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  close(): void {
    this.open.set(false);
    this.closed.emit();
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.close();
    }
  }

  onEscape(): void {
    if (this.closeOnEscape() && this.open()) {
      this.close();
    }
  }

  // Public API
  toggle(): void {
    this.open.update((v) => !v);
  }
}