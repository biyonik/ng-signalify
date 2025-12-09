import {
    Component,
    ChangeDetectionStrategy,
    input,
    output,
    signal,
    ViewEncapsulation,
    OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateId } from '../../utils/a11y.utils';

/**
 * SigAlert - Signal-based accessible inline alert component
 *
 * Uses role="alert" for important messages, role="status" for informational
 */
@Component({
    selector: 'sig-alert',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    template: `
        @if (!dismissed()) {
            <div
                    class="sig-alert"
                    [class.sig-alert--info]="variant() === 'info'"
                    [class.sig-alert--success]="variant() === 'success'"
                    [class.sig-alert--warning]="variant() === 'warning'"
                    [class.sig-alert--danger]="variant() === 'danger'"
                    [class.sig-alert--outline]="outline()"
                    [class.sig-alert--compact]="compact()"
                    [attr.role]="getRole()"
                    [attr.aria-live]="getAriaLive()"
                    [attr.aria-atomic]="true"
                    [id]="alertId"
            >
                <!-- Icon -->
                @if (showIcon()) {
                    <div class="sig-alert__icon" aria-hidden="true">
                        @if (icon()) {
                            {{ icon() }}
                        } @else {
                            @switch (variant()) {
                                @case ('info') { ℹ️ }
                                @case ('success') { ✅ }
                                @case ('warning') { ⚠️ }
                                @case ('danger') { ❌ }
                            }
                        }
                    </div>
                }

                <!-- Content -->
                <div class="sig-alert__content">
                    @if (title()) {
                        <div [id]="titleId" class="sig-alert__title">{{ title() }}</div>
                    }
                    <div class="sig-alert__message">
                        <ng-content></ng-content>
                    </div>

                    @if (hasActions()) {
                        <div class="sig-alert__actions">
                            <ng-content select="[alert-actions]"></ng-content>
                        </div>
                    }
                </div>

                <!-- Dismiss button -->
                @if (dismissible()) {
                    <button
                            type="button"
                            class="sig-alert__dismiss"
                            (click)="dismiss()"
                            [attr.aria-label]="'Uyarıyı kapat' + (title() ? ': ' + title() : '')"
                    >
                        <span aria-hidden="true">✕</span>
                    </button>
                }
            </div>
        }
    `,
})
export class SigAlertComponent implements OnInit {
    readonly variant = input<'info' | 'success' | 'warning' | 'danger'>('info');
    readonly title = input<string>('');
    readonly icon = input<string>('');
    readonly showIcon = input<boolean>(true);
    readonly dismissible = input<boolean>(false);
    readonly outline = input<boolean>(false);
    readonly compact = input<boolean>(false);
    readonly hasActions = input<boolean>(false);

    readonly dismissedEvent = output<void>();

    readonly dismissed = signal(false);

    alertId = '';
    titleId = '';

    ngOnInit(): void {
        this.alertId = generateId('sig-alert');
        this.titleId = `${this.alertId}-title`;
    }

    getRole(): string {
        // Use 'alert' for warnings/dangers, 'status' for info/success
        const variant = this.variant();
        return variant === 'warning' || variant === 'danger' ? 'alert' : 'status';
    }

    getAriaLive(): string {
        const variant = this.variant();
        return variant === 'danger' ? 'assertive' : 'polite';
    }

    dismiss(): void {
        this.dismissed.set(true);
        this.dismissedEvent.emit();
    }

    show(): void {
        this.dismissed.set(false);
    }
}
