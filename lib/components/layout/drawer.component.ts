import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  model,
  signal,
  effect,
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
  styles: [`
    .sig-drawer__backdrop {
      position: fixed;
      inset: 0;
      z-index: 998;
      background-color: rgba(0, 0, 0, 0.5);
      animation: drawer-backdrop-fade 0.2s ease-out;
    }

    .sig-drawer__backdrop--transparent {
      background-color: transparent;
    }

    @keyframes drawer-backdrop-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .sig-drawer {
      position: fixed;
      z-index: 999;
      display: flex;
      flex-direction: column;
      background-color: white;
      box-shadow: -4px 0 16px rgba(0, 0, 0, 0.1);
    }

    /* Positions */
    .sig-drawer--left {
      top: 0;
      left: 0;
      bottom: 0;
      animation: drawer-slide-left 0.3s ease-out;
    }

    .sig-drawer--right {
      top: 0;
      right: 0;
      bottom: 0;
      animation: drawer-slide-right 0.3s ease-out;
    }

    .sig-drawer--top {
      top: 0;
      left: 0;
      right: 0;
      animation: drawer-slide-top 0.3s ease-out;
    }

    .sig-drawer--bottom {
      bottom: 0;
      left: 0;
      right: 0;
      animation: drawer-slide-bottom 0.3s ease-out;
    }

    @keyframes drawer-slide-left {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }

    @keyframes drawer-slide-right {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    @keyframes drawer-slide-top {
      from { transform: translateY(-100%); }
      to { transform: translateY(0); }
    }

    @keyframes drawer-slide-bottom {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .sig-drawer__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }

    .sig-drawer__title {
      flex: 1;
      font-weight: 600;
      color: #111827;
    }

    .sig-drawer__close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: none;
      background: none;
      color: #6b7280;
      font-size: 1rem;
      cursor: pointer;
      border-radius: 0.375rem;
      transition: all 0.15s;
    }

    .sig-drawer__close:hover {
      background-color: #f3f4f6;
      color: #374151;
    }

    .sig-drawer__content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .sig-drawer__footer {
      padding: 1rem;
      border-top: 1px solid #e5e7eb;
      flex-shrink: 0;
    }
  `],
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