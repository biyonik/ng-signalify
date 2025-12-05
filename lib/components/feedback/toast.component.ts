import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  Injectable,
  inject,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 
  | 'top-left' | 'top-center' | 'top-right' 
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastConfig {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  closable?: boolean;
  action?: { label: string; onClick: () => void };
}

export interface Toast extends Required<Omit<ToastConfig, 'action'>> {
  action?: ToastConfig['action'];
  createdAt: number;
}

export interface ToastServiceConfig {
  maxToasts?: number;
  queueMode?: boolean;
  defaultDuration?: number;
}

/**
 * ToastService - Signal-based toast management
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  private readonly _queue = signal<Toast[]>([]);
  private readonly _timers = new Map<string, ReturnType<typeof setTimeout>>();
  private _counter = 0;

  private _config: Required<ToastServiceConfig> = {
    maxToasts: 5,
    queueMode: false,
    defaultDuration: 5000,
  };

  readonly toasts = this._toasts.asReadonly();
  readonly queueCount = computed(() => this._queue().length);

  configure(config: Partial<ToastServiceConfig>): void {
    this._config = { ...this._config, ...config };
  }

  show(config: ToastConfig): string {
    const id = config.id ?? `toast-${++this._counter}`;
    
    const toast: Toast = {
      id,
      type: config.type ?? 'info',
      title: config.title ?? this.getDefaultTitle(config.type ?? 'info'),
      message: config.message,
      duration: config.duration ?? this._config.defaultDuration,
      closable: config.closable ?? true,
      action: config.action,
      createdAt: Date.now(),
    };

    const currentToasts = this._toasts();
    
    if (currentToasts.length >= this._config.maxToasts) {
      if (this._config.queueMode) {
        this._queue.update((q) => [...q, toast]);
        return id;
      } else {
        const oldest = currentToasts[0];
        if (oldest) this.dismiss(oldest.id);
      }
    }

    this._toasts.update((t) => [...t, toast]);
    this.scheduleAutoDismiss(toast);
    return id;
  }

  success(message: string, title?: string): string {
    return this.show({ type: 'success', message, title });
  }

  error(message: string, title?: string, duration = 10000): string {
    return this.show({ type: 'error', message, title, duration });
  }

  persistentError(message: string, title?: string): string {
    return this.show({ type: 'error', message, title, duration: 0 });
  }

  warning(message: string, title?: string): string {
    return this.show({ type: 'warning', message, title });
  }

  info(message: string, title?: string): string {
    return this.show({ type: 'info', message, title });
  }

  dismiss(id: string): void {
    const timer = this._timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this._timers.delete(id);
    }

    this._toasts.update((t) => t.filter((toast) => toast.id !== id));

    if (this._config.queueMode) {
      setTimeout(() => this.showNextFromQueue(), 100);
    }
  }

  dismissAll(): void {
    this._timers.forEach((timer) => clearTimeout(timer));
    this._timers.clear();
    this._toasts.set([]);
    this._queue.set([]);
  }

  private scheduleAutoDismiss(toast: Toast): void {
    if (toast.duration > 0) {
      const timer = setTimeout(() => this.dismiss(toast.id), toast.duration);
      this._timers.set(toast.id, timer);
    }
  }

  private showNextFromQueue(): void {
    const queue = this._queue();
    if (queue.length === 0) return;

    if (this._toasts().length >= this._config.maxToasts) return;

    const [next, ...remaining] = queue;
    this._queue.set(remaining);
    this._toasts.update((t) => [...t, next]);
    this.scheduleAutoDismiss(next);
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
 * SigToastItem - Single toast component
 */
@Component({
  selector: 'sig-toast-item',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-toast"
      [class.sig-toast--success]="toast().type === 'success'"
      [class.sig-toast--error]="toast().type === 'error'"
      [class.sig-toast--warning]="toast().type === 'warning'"
      [class.sig-toast--info]="toast().type === 'info'"
      role="alert"
    >
      <div class="sig-toast__icon">
        @switch (toast().type) {
          @case ('success') { ✓ }
          @case ('error') { ✕ }
          @case ('warning') { ⚠ }
          @case ('info') { ℹ }
        }
      </div>

      <div class="sig-toast__content">
        @if (toast().title) {
          <div class="sig-toast__title">{{ toast().title }}</div>
        }
        <div class="sig-toast__message">{{ toast().message }}</div>
        
        @if (toast().action) {
          <button 
            class="sig-toast__action"
            (click)="toast().action!.onClick()"
          >
            {{ toast().action!.label }}
          </button>
        }
      </div>

      @if (toast().closable) {
        <button
          class="sig-toast__close"
          (click)="onClose()"
          aria-label="Kapat"
        >
          ✕
        </button>
      }

      @if (toast().duration > 0) {
        <div 
          class="sig-toast__progress"
          [style.animation-duration.ms]="toast().duration"
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
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
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

    .sig-toast__content { flex: 1; min-width: 0; }
    .sig-toast__title { font-weight: 600; color: #111827; margin-bottom: 0.25rem; }
    .sig-toast__message { font-size: 0.875rem; color: #4b5563; }

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

    .sig-toast__action:hover { text-decoration: underline; }

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

    .sig-toast__close:hover { color: #6b7280; background-color: #f3f4f6; }

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
  readonly toast = input.required<Toast>();
  
  private readonly toastService = inject(ToastService);

  onClose(): void {
    this.toastService.dismiss(this.toast().id);
  }
}

/**
 * SigToastContainer - Toast container
 */
@Component({
  selector: 'sig-toast-container',
  standalone: true,
  imports: [CommonModule, SigToastItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-toast-container"
      [class.sig-toast-container--top-left]="position() === 'top-left'"
      [class.sig-toast-container--top-center]="position() === 'top-center'"
      [class.sig-toast-container--top-right]="position() === 'top-right'"
      [class.sig-toast-container--bottom-left]="position() === 'bottom-left'"
      [class.sig-toast-container--bottom-center]="position() === 'bottom-center'"
      [class.sig-toast-container--bottom-right]="position() === 'bottom-right'"
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

    .sig-toast-container > * { pointer-events: auto; }

    .sig-toast-container--top-left { top: 0; left: 0; align-items: flex-start; }
    .sig-toast-container--top-center { top: 0; left: 50%; transform: translateX(-50%); align-items: center; }
    .sig-toast-container--top-right { top: 0; right: 0; align-items: flex-end; }
    .sig-toast-container--bottom-left { bottom: 0; left: 0; align-items: flex-start; flex-direction: column-reverse; }
    .sig-toast-container--bottom-center { bottom: 0; left: 50%; transform: translateX(-50%); align-items: center; flex-direction: column-reverse; }
    .sig-toast-container--bottom-right { bottom: 0; right: 0; align-items: flex-end; flex-direction: column-reverse; }
  `],
})
export class SigToastContainerComponent {
  readonly position = input<ToastPosition>('top-right');
  
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;
}