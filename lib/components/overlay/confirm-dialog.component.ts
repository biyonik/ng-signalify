import {
    Component,
    Injectable,
    ChangeDetectionStrategy,
    input,
    signal,
    inject,
    ViewEncapsulation,
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
    encapsulation: ViewEncapsulation.None,
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