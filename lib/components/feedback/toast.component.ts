import {
    Component,
    ChangeDetectionStrategy,
    signal,
    input,
    output,
    Injectable,
    ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateId, announce } from '../../utils/a11y.utils';

export interface ToastConfig {
    id?: string;
    message: string;
    title?: string;
    variant?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    dismissible?: boolean;
    action?: {
        label: string;
        callback: () => void;
    };
}

/**
 * SigToast - Signal-based accessible toast notification
 */
@Component({
    selector: 'sig-toast',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    template: `
    <div 
      class="sig-toast"
      [class.sig-toast--info]="variant() === 'info'"
      [class.sig-toast--success]="variant() === 'success'"
      [class.sig-toast--warning]="variant() === 'warning'"
      [class.sig-toast--error]="variant() === 'error'"
      [id]="toastId"
      role="alert"
      [attr.aria-live]="variant() === 'error' ? 'assertive' : 'polite'"
      aria-atomic="true"
    >
      <!-- Icon -->
      <div class="sig-toast__icon" aria-hidden="true">
        @switch (variant()) {
          @case ('info') { ℹ️ }
          @case ('success') { ✅ }
          @case ('warning') { ⚠️ }
          @case ('error') { ❌ }
        }
      </div>

      <!-- Content -->
      <div class="sig-toast__content">
        @if (title()) {
          <div class="sig-toast__title">{{ title() }}</div>
        }
        <div class="sig-toast__message">{{ message() }}</div>
      </div>

      <!-- Action -->
      @if (actionLabel()) {
        <button
          type="button"
          class="sig-toast__action"
          (click)="onAction()"
        >
          {{ actionLabel() }}
        </button>
      }

      <!-- Dismiss -->
      @if (dismissible()) {
        <button
          type="button"
          class="sig-toast__dismiss"
          (click)="dismiss()"
          aria-label="Bildirimi kapat"
        >
          <span aria-hidden="true">✕</span>
        </button>
      }
    </div>
  `,
})
export class SigToastComponent {
    readonly message = input.required<string>();
    readonly title = input<string>('');
    readonly variant = input<'info' | 'success' | 'warning' | 'error'>('info');
    readonly dismissible = input<boolean>(true);
    readonly actionLabel = input<string>('');

    readonly dismissed = output<void>();
    readonly actionClicked = output<void>();

    toastId = generateId('sig-toast');

    dismiss(): void {
        this.dismissed.emit();
    }

    onAction(): void {
        this.actionClicked.emit();
    }
}

/**
 * Toast Service - Manages toast notifications with accessibility
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
    private readonly _toasts = signal<ToastConfig[]>([]);
    readonly toasts = this._toasts.asReadonly();

    show(config: ToastConfig): string {
        const id = config.id || generateId('toast');
        const toast: ToastConfig = {
            ...config,
            id,
            duration: config.duration ?? 5000,
            dismissible: config.dismissible ?? true,
        };

        this._toasts.update(t => [...t, toast]);

        // Announce to screen readers
        const priority = toast.variant === 'error' ? 'assertive' : 'polite';
        const message = toast.title ? `${toast.title}: ${toast.message}` : toast.message;
        announce(message, priority);

        // Auto dismiss
        if (toast.duration && toast.duration > 0) {
            setTimeout(() => this.dismiss(id), toast.duration);
        }

        return id;
    }

    success(message: string, title?: string): string {
        return this.show({ message, title, variant: 'success' });
    }

    error(message: string, title?: string): string {
        return this.show({ message, title, variant: 'error', duration: 0 });
    }

    warning(message: string, title?: string): string {
        return this.show({ message, title, variant: 'warning' });
    }

    info(message: string, title?: string): string {
        return this.show({ message, title, variant: 'info' });
    }

    dismiss(id: string): void {
        this._toasts.update(t => t.filter(toast => toast.id !== id));
    }

    dismissAll(): void {
        this._toasts.set([]);
    }
}
