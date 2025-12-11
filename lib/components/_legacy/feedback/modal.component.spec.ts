import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SigModalComponent, ModalService } from './modal.component';

describe('SigModalComponent', () => {
    let fixture: ComponentFixture<SigModalComponent>;
    let component: SigModalComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigModalComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SigModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('oluşturulmalı', () => {
        expect(component).toBeTruthy();
    });

    describe('open state', () => {
        it('kapalıyken overlay görünmemeli', () => {
            component.open.set(false);
            fixture.detectChanges();

            const overlay = fixture.debugElement.query(By.css('.sig-modal-overlay'));
            expect(overlay).toBeFalsy();
        });

        it('açıkken overlay görünmeli', () => {
            component.open.set(true);
            fixture.detectChanges();

            const overlay = fixture.debugElement.query(By.css('.sig-modal-overlay'));
            expect(overlay).toBeTruthy();
        });
    });

    describe('title', () => {
        it('başlık gösterilmeli', () => {
            component.open.set(true);
            fixture.componentRef.setInput('title', 'Test Modal');
            fixture.detectChanges();

            const title = fixture.debugElement.query(By.css('.sig-modal__title'));
            expect(title.nativeElement.textContent.trim()).toBe('Test Modal');
        });
    });

    describe('size', () => {
        it('sm size sınıfı eklenmeli', () => {
            component.open.set(true);
            fixture.componentRef.setInput('size', 'sm');
            fixture.detectChanges();

            const modal = fixture.debugElement.query(By.css('.sig-modal'));
            expect(modal.classes['sig-modal--sm']).toBeTruthy();
        });

        it('lg size sınıfı eklenmeli', () => {
            component.open.set(true);
            fixture.componentRef.setInput('size', 'lg');
            fixture.detectChanges();

            const modal = fixture.debugElement.query(By.css('.sig-modal'));
            expect(modal.classes['sig-modal--lg']).toBeTruthy();
        });

        it('full size sınıfı eklenmeli', () => {
            component.open.set(true);
            fixture.componentRef.setInput('size', 'full');
            fixture.detectChanges();

            const modal = fixture.debugElement.query(By.css('.sig-modal'));
            expect(modal.classes['sig-modal--full']).toBeTruthy();
        });
    });

    describe('close', () => {
        beforeEach(() => {
            component.open.set(true);
            fixture.detectChanges();
        });

        it('close butonu tıklanınca modal kapanmalı', () => {
            const closeBtn = fixture.debugElement.query(By.css('.sig-modal__close'));
            closeBtn.nativeElement.click();
            fixture.detectChanges();

            expect(component.open()).toBe(false);
        });

        it('closable false iken close butonu gizlenmeli', () => {
            fixture.componentRef.setInput('closable', false);
            fixture.detectChanges();

            const closeBtn = fixture.debugElement.query(By.css('.sig-modal__close'));
            expect(closeBtn).toBeFalsy();
        });

        it('closable false iken close çağrılsa bile kapanmamalı', () => {
            fixture.componentRef.setInput('closable', false);
            fixture.detectChanges();

            component.close();

            expect(component.open()).toBe(true);
        });

        it('closed eventi emit edilmeli', () => {
            const closedSpy = jest.fn();
            component.closed.subscribe(closedSpy);

            component.close();

            expect(closedSpy).toHaveBeenCalled();
        });
    });

    describe('backdrop click', () => {
        beforeEach(() => {
            component.open.set(true);
            fixture.detectChanges();
        });

        it('backdrop tıklanınca modal kapanmalı', () => {
            const overlay = fixture.debugElement.query(By.css('.sig-modal-overlay'));
            overlay.nativeElement.click();
            fixture.detectChanges();

            expect(component.open()).toBe(false);
        });

        it('closeOnBackdrop false iken kapanmamalı', () => {
            fixture.componentRef.setInput('closeOnBackdrop', false);
            fixture.detectChanges();

            const overlay = fixture.debugElement.query(By.css('.sig-modal-overlay'));
            overlay.nativeElement.click();
            fixture.detectChanges();

            expect(component.open()).toBe(true);
        });

        it('modal içine tıklanınca kapanmamalı', () => {
            const modal = fixture.debugElement.query(By.css('.sig-modal'));
            modal.nativeElement.click();
            fixture.detectChanges();

            expect(component.open()).toBe(true);
        });
    });

    describe('escape key', () => {
        it('ESC tuşu ile modal kapanmalı', () => {
            component.open.set(true);
            fixture.detectChanges();

            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            component.onEscapeKey(event);

            expect(component.open()).toBe(false);
        });

        it('closeOnEsc false iken ESC çalışmamalı', () => {
            component.open.set(true);
            fixture.componentRef.setInput('closeOnEsc', false);
            fixture.detectChanges();

            const event = new KeyboardEvent('keydown', { key: 'Escape' });
            component.onEscapeKey(event);

            expect(component.open()).toBe(true);
        });
    });

    describe('confirm/cancel', () => {
        beforeEach(() => {
            component.open.set(true);
            fixture.detectChanges();
        });

        it('confirm butonu tıklanınca confirmed eventi emit edilmeli', () => {
            const confirmedSpy = jest.fn();
            component.confirmed.subscribe(confirmedSpy);

            const confirmBtn = fixture.debugElement.query(By.css('.sig-modal__btn--confirm'));
            confirmBtn.nativeElement.click();

            expect(confirmedSpy).toHaveBeenCalled();
        });

        it('cancel butonu tıklanınca cancelled eventi emit edilmeli ve modal kapanmalı', () => {
            const cancelledSpy = jest.fn();
            component.cancelled.subscribe(cancelledSpy);

            const cancelBtn = fixture.debugElement.query(By.css('.sig-modal__btn--cancel'));
            cancelBtn.nativeElement.click();
            fixture.detectChanges();

            expect(cancelledSpy).toHaveBeenCalled();
            expect(component.open()).toBe(false);
        });

        it('confirmDisabled true iken confirm butonu disabled olmalı', () => {
            fixture.componentRef.setInput('confirmDisabled', true);
            fixture.detectChanges();

            const confirmBtn = fixture.debugElement.query(By.css('.sig-modal__btn--confirm'));
            expect(confirmBtn.nativeElement.disabled).toBe(true);
        });
    });

    describe('showHeader/showFooter', () => {
        it('showHeader false iken header gizlenmeli', () => {
            component.open.set(true);
            fixture.componentRef.setInput('showHeader', false);
            fixture.detectChanges();

            const header = fixture.debugElement.query(By.css('.sig-modal__header'));
            expect(header).toBeFalsy();
        });

        it('showFooter false iken footer gizlenmeli', () => {
            component.open.set(true);
            fixture.componentRef.setInput('showFooter', false);
            fixture.detectChanges();

            const footer = fixture.debugElement.query(By.css('.sig-modal__footer'));
            expect(footer).toBeFalsy();
        });
    });
});

describe('ModalService', () => {
    let service: ModalService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ModalService],
        });
        service = TestBed.inject(ModalService);
    });

    it('oluşturulmalı', () => {
        expect(service).toBeTruthy();
    });

    it('open modal açmalı', () => {
        service.open('test-modal');
        expect(service.isOpen('test-modal')).toBe(true);
    });

    it('close modal kapatmalı', () => {
        service.open('test-modal');
        service.close('test-modal');
        expect(service.isOpen('test-modal')).toBe(false);
    });

    it('toggle modal durumunu değiştirmeli', () => {
        expect(service.isOpen('test-modal')).toBe(false);

        service.toggle('test-modal');
        expect(service.isOpen('test-modal')).toBe(true);

        service.toggle('test-modal');
        expect(service.isOpen('test-modal')).toBe(false);
    });

    it('closeAll tüm modalları kapatmalı', () => {
        service.open('modal-1');
        service.open('modal-2');
        service.open('modal-3');

        service.closeAll();

        expect(service.isOpen('modal-1')).toBe(false);
        expect(service.isOpen('modal-2')).toBe(false);
        expect(service.isOpen('modal-3')).toBe(false);
    });
});
