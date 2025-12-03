import {
  Component,
  Input,
  ChangeDetectionStrategy,
  signal,
  computed,
  Injectable,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/** Toast type */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Toast position */
export type ToastPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

/** Toast configuration */
export interface ToastConfig {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  closable?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/** Toast item */
export interface Toast extends Required<Omit<ToastConfig, 'action'>> {
  action?: ToastConfig['action'];
  createdAt: number;
}

/**
 * Toast Service - Manage toasts globally
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  private counter = 0;

  readonly toasts = this._toasts.asReadonly();

  /** Show toast */
  show(config: ToastConfig): string {
    const id = config.id ?? `toast-${++this.counter}`;
    
    const toast: Toast = {
      id,
      type: config.type ?? 'info',
      title: config.title ?? this.getDefaultTitle(config.type ?? 'info'),
      message: config.message,
      duration: config.duration ?? 5000,
      closable: config.closable ?? true,
      action: config.action,
      createdAt: Date.now(),
    };

    this._toasts.update((toasts) => [...toasts, toast]);

    // Auto dismiss
    if (toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }

    return id;
  }

  /** Shorthand methods */
  success(message: string, title?: string): string {
    return this.show({ type: 'success', message, title });
  }

  error(message: string, title?: string): string {
    return this.show({ type: 'error', message, title, duration: 0 });
  }

  warning(message: string, title?: string): string {
    return this.show({ type: 'warning', message, title });
  }

  info(message: string, title?: string): string {
    return this.show({ type: 'info', message, title });
  }

  /** Dismiss toast */
  dismiss(id: string) {
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  /** Dismiss all toasts */
  dismissAll() {
    this._toasts.set([]);
  }

  private getDefaultTitle(type: ToastType): string {
    const titles: Record<ToastType, string> = {
      success: 'Başarılı',
      error: 'Hata',
      warning: 'Uyarı',
      info: 'Bilgi',
    };
    return titles[type];
  }
}

/**
 * Single Toast Component
 */
@Component({
  selector: 'sig-toast-item',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-toast"
      [class.sig-toast--success]="toast.type === 'success'"
      [class.sig-toast--error]="toast.type === 'error'"
      [class.sig-toast--warning]="toast.type === 'warning'"
      [class.sig-toast--info]="toast.type === 'info'"
      role="alert"
    >
      <div class="sig-toast__icon">
        @switch (toast.type) {
          @case ('success') { ✓ }
          @case ('error') { ✕ }
          @case ('warning') { ⚠ }
          @case ('info') { ℹ }
        }
      </div>

      <div class="sig-toast__content">
        @if (toast.title) {
          <div class="sig-toast__title">{{ toast.title }}</div>
        }
        <div class="sig-toast__message">{{ toast.message }}</div>
        
        @if (toast.action) {
          <button 
            class="sig-toast__action"
            (click)="toast.action.onClick()"
          >
            {{ toast.action.label }}
          </button>
        }
      </div>

      @if (toast.closable) {
        <button
          class="sig-toast__close"
          (click)="onClose()"
          aria-label="Kapat"
        >
          ✕
        </button>
      }

      @if (toast.duration > 0) {
        <div 
          class="sig-toast__progress"
          [style.animation-duration.ms]="toast.duration"
        ></div>
      }
    </div>
  `,
  styles: [`
    .sig-toast {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      width: 100%;
      max-width: 24rem;
      padding: 1rem;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      border-left: 4px solid;
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .sig-toast--success { border-color: #10b981; }
    .sig-toast--error { border-color: #ef4444; }
    .sig-toast--warning { border-color: #f59e0b; }
    .sig-toast--info { border-color: #3b82f6; }

    .sig-toast__icon {
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 0.875rem;
      font-weight: bold;
    }

    .sig-toast--success .sig-toast__icon { background: #d1fae5; color: #059669; }
    .sig-toast--error .sig-toast__icon { background: #fee2e2; color: #dc2626; }
    .sig-toast--warning .sig-toast__icon { background: #fef3c7; color: #d97706; }
    .sig-toast--info .sig-toast__icon { background: #dbeafe; color: #2563eb; }

    .sig-toast__content {
      flex: 1;
      min-width: 0;
    }

    .sig-toast__title {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .sig-toast__message {
      font-size: 0.875rem;
      color: #4b5563;
    }

    .sig-toast__action {
      margin-top: 0.5rem;
      padding: 0;
      background: none;
      border: none;
      font-size: 0.875rem;
      font-weight: 500;
      color: #3b82f6;
      cursor: pointer;
    }

    .sig-toast__action:hover {
      text-decoration: underline;
    }

    .sig-toast__close {
      flex-shrink: 0;
      padding: 0.25rem;
      background: none;
      border: none;
      font-size: 1rem;
      color: #9ca3af;
      cursor: pointer;
      border-radius: 0.25rem;
    }

    .sig-toast__close:hover {
      color: #6b7280;
      background-color: #f3f4f6;
    }

    .sig-toast__progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background-color: currentColor;
      opacity: 0.3;
      animation: shrink linear forwards;
    }

    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
  `],
})
export class SigToastItemComponent {
  @Input({ required: true }) toast!: Toast;

  private toastService = inject(ToastService);

  onClose() {
    this.toastService.dismiss(this.toast.id);
  }
}

/**
 * Toast Container Component
 * 
 * Usage:
 * Add to app.component.html:
 * <sig-toast-container position="top-right" />
 */
@Component({
  selector: 'sig-toast-container',
  standalone: true,
  imports: [CommonModule, SigToastItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-toast-container"
      [class.sig-toast-container--top-left]="position === 'top-left'"
      [class.sig-toast-container--top-center]="position === 'top-center'"
      [class.sig-toast-container--top-right]="position === 'top-right'"
      [class.sig-toast-container--bottom-left]="position === 'bottom-left'"
      [class.sig-toast-container--bottom-center]="position === 'bottom-center'"
      [class.sig-toast-container--bottom-right]="position === 'bottom-right'"
    >
      @for (toast of toasts(); track toast.id) {
        <sig-toast-item [toast]="toast" />
      }
    </div>
  `,
  styles: [`
    .sig-toast-container {
      position: fixed;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      pointer-events: none;
    }

    .sig-toast-container > * {
      pointer-events: auto;
    }

    .sig-toast-container--top-left {
      top: 0;
      left: 0;
      align-items: flex-start;
    }

    .sig-toast-container--top-center {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      align-items: center;
    }

    .sig-toast-container--top-right {
      top: 0;
      right: 0;
      align-items: flex-end;
    }

    .sig-toast-container--bottom-left {
      bottom: 0;
      left: 0;
      align-items: flex-start;
      flex-direction: column-reverse;
    }

    .sig-toast-container--bottom-center {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      align-items: center;
      flex-direction: column-reverse;
    }

    .sig-toast-container--bottom-right {
      bottom: 0;
      right: 0;
      align-items: flex-end;
      flex-direction: column-reverse;
    }
  `],
})
export class SigToastContainerComponent {
  @Input() position: ToastPosition = 'top-right';

  private toastService = inject(ToastService);

  toasts = this.toastService.toasts;
}