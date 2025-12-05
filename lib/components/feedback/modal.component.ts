import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  output,
  model,
  Injectable,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

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
  styles: [`
    .sig-modal-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background-color: rgba(0, 0, 0, 0.5);
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .sig-modal {
      width: 100%;
      max-width: 32rem;
      max-height: calc(100vh - 2rem);
      display: flex;
      flex-direction: column;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.15s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .sig-modal--sm { max-width: 24rem; }
    .sig-modal--lg { max-width: 48rem; }
    .sig-modal--xl { max-width: 64rem; }
    .sig-modal--full { 
      max-width: calc(100vw - 2rem);
      max-height: calc(100vh - 2rem);
    }

    .sig-modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .sig-modal__title {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }

    .sig-modal__close {
      padding: 0.25rem;
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #6b7280;
      cursor: pointer;
      border-radius: 0.25rem;
    }

    .sig-modal__close:hover {
      color: #374151;
      background-color: #f3f4f6;
    }

    .sig-modal__body {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }

    .sig-modal__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      background-color: #f9fafb;
      border-radius: 0 0 0.5rem 0.5rem;
    }

    .sig-modal__btn {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 0.375rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .sig-modal__btn--cancel {
      background: white;
      border: 1px solid #d1d5db;
      color: #374151;
    }

    .sig-modal__btn--cancel:hover {
      background-color: #f3f4f6;
    }

    .sig-modal__btn--confirm {
      background-color: #3b82f6;
      border: 1px solid #3b82f6;
      color: white;
    }

    .sig-modal__btn--confirm:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .sig-modal__btn--confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `],
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
    return new Promise((resolve) => {
      const result = window.confirm(`${title}\n\n${message}`);
      resolve(result);
    });
  }

  async alert(message: string, title = 'Uyarı'): Promise<void> {
    return new Promise((resolve) => {
      window.alert(`${title}\n\n${message}`);
      resolve();
    });
  }
}