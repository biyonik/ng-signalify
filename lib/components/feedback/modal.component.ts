import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  signal,
  inject,
  Injectable,
  TemplateRef,
  ViewContainerRef,
  ComponentRef,
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';

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
 * SigModal - Modal dialog component
 * 
 * Usage:
 * <sig-modal
 *   [open]="isModalOpen"
 *   title="Kullanıcı Ekle"
 *   size="md"
 *   (closed)="isModalOpen = false"
 *   (confirmed)="onConfirm()"
 * >
 *   <p>Modal içeriği buraya...</p>
 * </sig-modal>
 */
@Component({
  selector: 'sig-modal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open) {
      <div 
        class="sig-modal-overlay"
        (click)="onBackdropClick($event)"
        (keydown)="onKeydown($event)"
      >
        <div 
          class="sig-modal"
          [class.sig-modal--sm]="size === 'sm'"
          [class.sig-modal--lg]="size === 'lg'"
          [class.sig-modal--xl]="size === 'xl'"
          [class.sig-modal--full]="size === 'full'"
          role="dialog"
          aria-modal="true"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          @if (showHeader) {
            <div class="sig-modal__header">
              <h3 class="sig-modal__title">{{ title }}</h3>
              @if (closable) {
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

          <!-- Body -->
          <div class="sig-modal__body">
            <ng-content></ng-content>
          </div>

          <!-- Footer -->
          @if (showFooter) {
            <div class="sig-modal__footer">
              <ng-content select="[modal-footer]"></ng-content>
              
              @if (!hasCustomFooter) {
                @if (cancelText) {
                  <button
                    type="button"
                    class="sig-modal__btn sig-modal__btn--cancel"
                    (click)="onCancel()"
                  >
                    {{ cancelText }}
                  </button>
                }
                @if (confirmText) {
                  <button
                    type="button"
                    class="sig-modal__btn sig-modal__btn--confirm"
                    [disabled]="confirmDisabled"
                    (click)="onConfirm()"
                  >
                    {{ confirmText }}
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
  host: {
    '(document:keydown.escape)': 'onEscapeKey()',
  },
})
export class SigModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md';
  @Input() closable = true;
  @Input() closeOnBackdrop = true;
  @Input() closeOnEsc = true;
  @Input() showHeader = true;
  @Input() showFooter = true;
  @Input() confirmText = 'Onayla';
  @Input() cancelText = 'İptal';
  @Input() confirmDisabled = false;
  @Input() hasCustomFooter = false;

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  close() {
    if (this.closable) {
      this.closed.emit();
    }
  }

  onBackdropClick(event: Event) {
    if (this.closeOnBackdrop && event.target === event.currentTarget) {
      this.close();
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.closeOnEsc) {
      this.close();
    }
  }

  onEscapeKey() {
    if (this.open && this.closeOnEsc) {
      this.close();
    }
  }

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
    this.close();
  }
}

/**
 * Confirm dialog result
 */
export interface ConfirmResult {
  confirmed: boolean;
}

/**
 * Modal Service - Programmatic modal control
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private modals = signal<Map<string, boolean>>(new Map());

  open(id: string) {
    this.modals.update((m) => new Map(m).set(id, true));
  }

  close(id: string) {
    this.modals.update((m) => new Map(m).set(id, false));
  }

  isOpen(id: string): boolean {
    return this.modals().get(id) ?? false;
  }

  toggle(id: string) {
    if (this.isOpen(id)) {
      this.close(id);
    } else {
      this.open(id);
    }
  }

  closeAll() {
    this.modals.set(new Map());
  }

  /** Simple confirm dialog */
  async confirm(message: string, title = 'Onay'): Promise<boolean> {
    return new Promise((resolve) => {
      // In a real implementation, this would create a dynamic modal
      // For simplicity, using native confirm
      const result = window.confirm(`${title}\n\n${message}`);
      resolve(result);
    });
  }

  /** Simple alert dialog */
  async alert(message: string, title = 'Uyarı'): Promise<void> {
    return new Promise((resolve) => {
      window.alert(`${title}\n\n${message}`);
      resolve();
    });
  }
}