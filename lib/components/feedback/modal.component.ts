import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  output,
  model,
  Injectable,
  HostListener,
  ViewEncapsulation,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

/** Modal configuration */
export interface ModalConfig {
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  confirmText?: string;
  cancelText?: string;
}

/**
 * SigModal - Signal-based modal dialog
 */
@Component({
  selector: 'sig-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @if (open()) {
      <div 
        class="sig-modal-overlay"
        (click)="onBackdropClick($event)"
      >
        <div 
          class="sig-modal"
          [class.sig-modal--sm]="size() === 'sm'"
          [class.sig-modal--lg]="size() === 'lg'"
          [class.sig-modal--xl]="size() === 'xl'"
          [class.sig-modal--full]="size() === 'full'"
          role="dialog"
          aria-modal="true"
          (click)="$event.stopPropagation()"
        >
          @if (showHeader()) {
            <div class="sig-modal__header">
              <h3 class="sig-modal__title">{{ title() }}</h3>
              @if (closable()) {
                <button
                  type="button"
                  class="sig-modal__close"
                  (click)="close()"
                  aria-label="Kapat"
                >
                  ✕
                </button>
              }
            </div>
          }

          <div class="sig-modal__body">
            <ng-content></ng-content>
          </div>

          @if (showFooter()) {
            <div class="sig-modal__footer">
              <ng-content select="[modal-footer]"></ng-content>
              
              @if (!hasCustomFooter()) {
                @if (cancelText()) {
                  <button
                    type="button"
                    class="sig-modal__btn sig-modal__btn--cancel"
                    (click)="onCancel()"
                  >
                    {{ cancelText() }}
                  </button>
                }
                @if (confirmText()) {
                  <button
                    type="button"
                    class="sig-modal__btn sig-modal__btn--confirm"
                    [disabled]="confirmDisabled()"
                    (click)="onConfirm()"
                  >
                    {{ confirmText() }}
                  </button>
                }
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  })
export class SigModalComponent {
  // Two-way binding for open state
  readonly open = model<boolean>(false);
  
  // Inputs
  readonly title = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');
  readonly closable = input<boolean>(true);
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnEsc = input<boolean>(true);
  readonly showHeader = input<boolean>(true);
  readonly showFooter = input<boolean>(true);
  readonly confirmText = input<string>('Onayla');
  readonly cancelText = input<string>('İptal');
  readonly confirmDisabled = input<boolean>(false);
  readonly hasCustomFooter = input<boolean>(false);

  // Outputs
  readonly closed = output<void>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.open() && this.closeOnEsc()) {
      this.close();
    }
  }

  close(): void {
    if (this.closable()) {
      this.open.set(false);
      this.closed.emit();
    }
  }

  onBackdropClick(event: Event): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.close();
    }
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
    this.close();
  }
}

/**
 * Modal Service - Programmatic modal control
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly _modals = signal<Map<string, boolean>>(new Map());
  private readonly platformId = inject(PLATFORM_ID);

  open(id: string): void {
    this._modals.update((m) => new Map(m).set(id, true));
  }

  close(id: string): void {
    this._modals.update((m) => new Map(m).set(id, false));
  }

  isOpen(id: string): boolean {
    return this._modals().get(id) ?? false;
  }

  toggle(id: string): void {
    this.isOpen(id) ? this.close(id) : this.open(id);
  }

  closeAll(): void {
    this._modals.set(new Map());
  }

  async confirm(message: string, title = 'Onay'): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return new Promise((resolve) => {
      const result = window.confirm(`${title}\n\n${message}`);
      resolve(result);
    });
  }

  async alert(message: string, title = 'Uyarı'): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    return new Promise((resolve) => {
      window.alert(`${title}\n\n${message}`);
      resolve();
    });
  }
}