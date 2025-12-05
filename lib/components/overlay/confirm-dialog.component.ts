import {
    Component,
    Injectable,
    ChangeDetectionStrategy,
    input,
    signal,
    inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'info' | 'warning' | 'danger';
    icon?: string;
}

/**
 * ConfirmDialogService - Programmatic confirmation dialogs
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
    private _isOpen = signal(false);
    private _options = signal<ConfirmDialogOptions | null>(null);
    private _resolvePromise: ((value: boolean) => void) | null = null;

    readonly isOpen = this._isOpen.asReadonly();
    readonly options = this._options.asReadonly();

    confirm(options: ConfirmDialogOptions): Promise<boolean> {
        return new Promise((resolve) => {
            this._resolvePromise = resolve;
            this._options.set({
                title: 'Onay',
                confirmText: 'Onayla',
                cancelText: 'İptal',
                variant: 'info',
                ...options,
            });
            this._isOpen.set(true);
        });
    }

    close(result: boolean): void {
        this._isOpen.set(false);
        this._resolvePromise?.(result);
        this._resolvePromise = null;
    }
}

/**
 * SigConfirmDialog - Signal-based confirmation dialog
 * 
 * Usage:
 * // In template (once in app.component.html)
 * <sig-confirm-dialog />
 * 
 * // In component
 * async onDelete() {
 *   const confirmed = await this.confirmDialog.confirm({
 *     title: 'Silme İşlemi',
 *     message: 'Bu öğeyi silmek istediğinizden emin misiniz?',
 *     variant: 'danger',
 *     confirmText: 'Sil',
 *   });
 *   
 *   if (confirmed) {
 *     // Delete item
 *   }
 * }
 */
@Component({
    selector: 'sig-confirm-dialog',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    @if (service.isOpen()) {
      <div class="sig-confirm-dialog__backdrop" (click)="cancel()"></div>
      
      <div 
        class="sig-confirm-dialog"
        [class.sig-confirm-dialog--warning]="options()?.variant === 'warning'"
        [class.sig-confirm-dialog--danger]="options()?.variant === 'danger'"
        role="alertdialog"
        aria-modal="true"
      >
        <!-- Icon -->
        <div class="sig-confirm-dialog__icon">
          @if (options()?.icon) {
            {{ options()?.icon }}
          } @else {
            @switch (options()?.variant) {
              @case ('warning') { ⚠️ }
              @case ('danger') { 🗑️ }
              @default { ℹ️ }
            }
          }
        </div>

        <!-- Content -->
        <div class="sig-confirm-dialog__content">
          <h3 class="sig-confirm-dialog__title">{{ options()?.title }}</h3>
          <p class="sig-confirm-dialog__message">{{ options()?.message }}</p>
        </div>

        <!-- Actions -->
        <div class="sig-confirm-dialog__actions">
          <button
            type="button"
            class="sig-confirm-dialog__btn sig-confirm-dialog__btn--cancel"
            (click)="cancel()"
          >
            {{ options()?.cancelText }}
          </button>
          <button
            type="button"
            class="sig-confirm-dialog__btn sig-confirm-dialog__btn--confirm"
            [class.sig-confirm-dialog__btn--warning]="options()?.variant === 'warning'"
            [class.sig-confirm-dialog__btn--danger]="options()?.variant === 'danger'"
            (click)="confirm()"
          >
            {{ options()?.confirmText }}
          </button>
        </div>
      </div>
    }
  `,
    styles: [`
    .sig-confirm-dialog__backdrop {
      position: fixed;
      inset: 0;
      z-index: 998;
      background-color: rgba(0, 0, 0, 0.5);
      animation: confirm-backdrop-fade 0.15s ease-out;
    }

    @keyframes confirm-backdrop-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .sig-confirm-dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 999;
      width: 100%;
      max-width: 400px;
      padding: 1.5rem;
      background-color: white;
      border-radius: 0.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      animation: confirm-dialog-fade 0.2s ease-out;
    }

    @keyframes confirm-dialog-fade {
      from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    .sig-confirm-dialog__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      margin: 0 auto 1rem;
      font-size: 1.5rem;
      background-color: #dbeafe;
      border-radius: 50%;
    }

    .sig-confirm-dialog--warning .sig-confirm-dialog__icon {
      background-color: #fef3c7;
    }

    .sig-confirm-dialog--danger .sig-confirm-dialog__icon {
      background-color: #fee2e2;
    }

    .sig-confirm-dialog__content {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .sig-confirm-dialog__title {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }

    .sig-confirm-dialog__message {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .sig-confirm-dialog__actions {
      display: flex;
      gap: 0.75rem;
    }

    .sig-confirm-dialog__btn {
      flex: 1;
      padding: 0.625rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .sig-confirm-dialog__btn--cancel {
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
    }

    .sig-confirm-dialog__btn--cancel:hover {
      background-color: #f9fafb;
    }

    .sig-confirm-dialog__btn--confirm {
      border: none;
      background-color: #3b82f6;
      color: white;
    }

    .sig-confirm-dialog__btn--confirm:hover {
      background-color: #2563eb;
    }

    .sig-confirm-dialog__btn--warning {
      background-color: #f59e0b;
    }

    .sig-confirm-dialog__btn--warning:hover {
      background-color: #d97706;
    }

    .sig-confirm-dialog__btn--danger {
      background-color: #ef4444;
    }

    .sig-confirm-dialog__btn--danger:hover {
      background-color: #dc2626;
    }
  `],
    host: {
        '(document:keydown.escape)': 'cancel()',
    },
})
export class SigConfirmDialogComponent {
    readonly service = inject(ConfirmDialogService);
    constructor() { }

    readonly options = this.service.options;

    confirm(): void {
        this.service.close(true);
    }

    cancel(): void {
        this.service.close(false);
    }
}