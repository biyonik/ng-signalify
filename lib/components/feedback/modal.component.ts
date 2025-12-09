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
    OnInit,
    OnDestroy,
    ElementRef,
    ViewChild,
    AfterViewInit,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, DOCUMENT } from '@angular/common';
import { generateId, FocusTrap, announce } from '../../utils/a11y.utils';

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
 * SigModal - Signal-based accessible modal dialog
 *
 * ARIA Pattern: Dialog (Modal)
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
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
                [attr.aria-hidden]="true"
                (click)="onBackdropClick($event)"
            ></div>
            <div 
                #modalContainer
                class="sig-modal"
                [class.sig-modal--sm]="size() === 'sm'"
                [class.sig-modal--lg]="size() === 'lg'"
                [class.sig-modal--xl]="size() === 'xl'"
                [class.sig-modal--full]="size() === 'full'"
                role="dialog"
                aria-modal="true"
                [attr.aria-labelledby]="titleId"
                [attr.aria-describedby]="descriptionId"
                [id]="modalId"
                tabindex="-1"
            >
                @if (showHeader()) {
                    <div class="sig-modal__header">
                        <h2 
                            [id]="titleId" 
                            class="sig-modal__title"
                        >
                            {{ title() }}
                        </h2>
                        @if (closable()) {
                            <button
                                type="button"
                                class="sig-modal__close"
                                (click)="close()"
                                aria-label="Dialogu kapat"
                            >
                                <span aria-hidden="true">✕</span>
                            </button>
                        }
                    </div>
                }

                <div 
                    [id]="descriptionId"
                    class="sig-modal__body"
                >
                    <ng-content></ng-content>
                </div>

                @if (showFooter()) {
                    <div class="sig-modal__footer" role="group" aria-label="Dialog işlemleri">
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
                                    #confirmButton
                                    type="button"
                                    class="sig-modal__btn sig-modal__btn--confirm"
                                    [disabled]="confirmDisabled()"
                                    [attr.aria-disabled]="confirmDisabled()"
                                    (click)="onConfirm()"
                                >
                                    {{ confirmText() }}
                                </button>
                            }
                        }
                    </div>
                }
            </div>
        }
    `,
})
export class SigModalComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('modalContainer') modalContainer?: ElementRef<HTMLDivElement>;
    @ViewChild('confirmButton') confirmButton?: ElementRef<HTMLButtonElement>;

    private document = inject(DOCUMENT);
    private platformId = inject(PLATFORM_ID);

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

    // YENİ: A11y inputs
    readonly autoFocus = input<'first' | 'confirm' | 'none'>('first');

    // Outputs
    readonly closed = output<void>();
    readonly confirmed = output<void>();
    readonly cancelled = output<void>();

    // YENİ: Unique ID'ler
    modalId = '';
    titleId = '';
    descriptionId = '';

    // YENİ: Focus trap instance
    private focusTrap?: FocusTrap;
    private previousOverflow = '';

    ngOnInit(): void {
        const baseId = generateId('sig-modal');
        this.modalId = baseId;
        this.titleId = `${baseId}-title`;
        this.descriptionId = `${baseId}-desc`;
    }

    ngAfterViewInit(): void {
        // Watch for open state changes
        // In a real implementation, you'd use effect() here
    }

    ngOnDestroy(): void {
        this.deactivateFocusTrap();
        this.restoreBodyScroll();
    }

    @HostListener('document:keydown.escape', ['$event'])
    onEscapeKey(event: KeyboardEvent): void {
        if (this.open() && this.closeOnEsc()) {
            event.preventDefault();
            this.close();
        }
    }

    // Modal açıldığında çağrılmalı (parent component'ten veya effect ile)
    onOpenChange(isOpen: boolean): void {
        if (isOpen) {
            this.activateModal();
        } else {
            this.deactivateModal();
        }
    }

    private activateModal(): void {
        if (!isPlatformBrowser(this.platformId)) return;

        // Body scroll'u engelle
        this.previousOverflow = this.document.body.style.overflow;
        this.document.body.style.overflow = 'hidden';

        // Focus trap'i aktifleştir
        setTimeout(() => {
            if (this.modalContainer) {
                this.focusTrap = new FocusTrap(this.modalContainer.nativeElement);
                this.focusTrap.activate();

                // Auto focus
                if (this.autoFocus() === 'confirm' && this.confirmButton) {
                    this.confirmButton.nativeElement.focus();
                } else if (this.autoFocus() === 'first') {
                    // FocusTrap already handles this
                }
            }
        });

        // Screen reader announcement
        announce(`${this.title()} dialogu açıldı`, 'assertive');
    }

    private deactivateModal(): void {
        this.deactivateFocusTrap();
        this.restoreBodyScroll();
    }

    private deactivateFocusTrap(): void {
        if (this.focusTrap) {
            this.focusTrap.deactivate();
            this.focusTrap = undefined;
        }
    }

    private restoreBodyScroll(): void {
        if (isPlatformBrowser(this.platformId)) {
            this.document.body.style.overflow = this.previousOverflow;
        }
    }

    close(): void {
        if (this.closable()) {
            this.open.set(false);
            this.closed.emit();
            announce('Dialog kapatıldı', 'polite');
            this.deactivateModal();
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
