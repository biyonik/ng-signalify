import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  Injectable,
  inject,
  input,
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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
  })
export class SigToastContainerComponent {
  readonly position = input<ToastPosition>('top-right');
  
  private readonly toastService = inject(ToastService);
  readonly toasts = this.toastService.toasts;
}