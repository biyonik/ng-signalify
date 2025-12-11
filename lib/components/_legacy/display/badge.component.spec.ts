import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SigBadgeComponent, SigBadgeCountComponent } from './badge.component';

describe('SigBadgeComponent', () => {
    let fixture: ComponentFixture<SigBadgeComponent>;
    let component: SigBadgeComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigBadgeComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SigBadgeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('oluşturulmalı', () => {
        expect(component).toBeTruthy();
    });

    describe('variant', () => {
        it('default variant sınıfı olmamalı', () => {
            const badge = fixture.debugElement.query(By.css('.sig-badge'));
            expect(badge.classes['sig-badge--primary']).toBeFalsy();
        });

        it('primary variant sınıfı eklenmeli', () => {
            fixture.componentRef.setInput('variant', 'primary');
            fixture.detectChanges();

            const badge = fixture.debugElement.query(By.css('.sig-badge'));
            expect(badge.classes['sig-badge--primary']).toBeTruthy();
        });

        it('success variant sınıfı eklenmeli', () => {
            fixture.componentRef.setInput('variant', 'success');
            fixture.detectChanges();

            const badge = fixture.debugElement.query(By.css('.sig-badge'));
            expect(badge.classes['sig-badge--success']).toBeTruthy();
        });

        it('danger variant sınıfı eklenmeli', () => {
            fixture.componentRef.setInput('variant', 'danger');
            fixture.detectChanges();

            const badge = fixture.debugElement.query(By.css('.sig-badge'));
            expect(badge.classes['sig-badge--danger']).toBeTruthy();
        });
    });

    describe('size', () => {
        it('sm size sınıfı eklenmeli', () => {
            fixture.componentRef.setInput('size', 'sm');
            fixture.detectChanges();

            const badge = fixture.debugElement.query(By.css('.sig-badge'));
            expect(badge.classes['sig-badge--sm']).toBeTruthy();
        });

        it('lg size sınıfı eklenmeli', () => {
            fixture.componentRef.setInput('size', 'lg');
            fixture.detectChanges();

            const badge = fixture.debugElement.query(By.css('.sig-badge'));
            expect(badge.classes['sig-badge--lg']).toBeTruthy();
        });
    });

    describe('dot', () => {
        it('dot elementi gösterilmeli', () => {
            fixture.componentRef.setInput('dot', true);
            fixture.detectChanges();

            const dot = fixture.debugElement.query(By.css('.sig-badge__dot'));
            expect(dot).toBeTruthy();
        });

        it('dot false iken görünmemeli', () => {
            fixture.componentRef.setInput('dot', false);
            fixture.detectChanges();

            const dot = fixture.debugElement.query(By.css('.sig-badge__dot'));
            expect(dot).toBeFalsy();
        });
    });

    describe('icon', () => {
        it('icon gösterilmeli', () => {
            fixture.componentRef.setInput('icon', '🔥');
            fixture.detectChanges();

            const icon = fixture.debugElement.query(By.css('.sig-badge__icon'));
            expect(icon).toBeTruthy();
            expect(icon.nativeElement.textContent).toContain('🔥');
        });
    });

    describe('outline', () => {
        it('outline sınıfı eklenmeli', () => {
            fixture.componentRef.setInput('outline', true);
            fixture.detectChanges();

            const badge = fixture.debugElement.query(By.css('.sig-badge'));
            expect(badge.classes['sig-badge--outline']).toBeTruthy();
        });
    });

    describe('rounded', () => {
        it('rounded sınıfı eklenmeli', () => {
            fixture.componentRef.setInput('rounded', true);
            fixture.detectChanges();

            const badge = fixture.debugElement.query(By.css('.sig-badge'));
            expect(badge.classes['sig-badge--rounded']).toBeTruthy();
        });
    });

    describe('removable', () => {
        it('remove butonu gösterilmeli', () => {
            fixture.componentRef.setInput('removable', true);
            fixture.detectChanges();

            const removeBtn = fixture.debugElement.query(By.css('.sig-badge__remove'));
            expect(removeBtn).toBeTruthy();
        });

        it('remove tıklaması stopPropagation çağırmalı', () => {
            fixture.componentRef.setInput('removable', true);
            fixture.detectChanges();

            const removeBtn = fixture.debugElement.query(By.css('.sig-badge__remove'));
            const event = new Event('click');
            const stopSpy = jest.spyOn(event, 'stopPropagation');

            removeBtn.nativeElement.dispatchEvent(event);

            expect(stopSpy).toHaveBeenCalled();
        });
    });
});

describe('SigBadgeCountComponent', () => {
    let fixture: ComponentFixture<SigBadgeCountComponent>;
    let component: SigBadgeCountComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigBadgeCountComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(SigBadgeCountComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('oluşturulmalı', () => {
        expect(component).toBeTruthy();
    });

    describe('show', () => {
        it('count 0 iken badge gösterilmemeli', () => {
            fixture.componentRef.setInput('count', 0);
            fixture.detectChanges();

            expect(component.show()).toBe(false);
        });

        it('showZero true iken 0 için badge gösterilmeli', () => {
            fixture.componentRef.setInput('count', 0);
            fixture.componentRef.setInput('showZero', true);
            fixture.detectChanges();

            expect(component.show()).toBe(true);
        });

        it('dot true iken badge gösterilmeli', () => {
            fixture.componentRef.setInput('count', 0);
            fixture.componentRef.setInput('dot', true);
            fixture.detectChanges();

            expect(component.show()).toBe(true);
        });
    });

    describe('displayCount', () => {
        it('count değerini göstermeli', () => {
            fixture.componentRef.setInput('count', 5);
            fixture.detectChanges();

            expect(component.displayCount()).toBe('5');
        });

        it('max aşılınca "99+" göstermeli', () => {
            fixture.componentRef.setInput('count', 150);
            fixture.componentRef.setInput('max', 99);
            fixture.detectChanges();

            expect(component.displayCount()).toBe('99+');
        });

        it('özel max değeri kullanılmalı', () => {
            fixture.componentRef.setInput('count', 15);
            fixture.componentRef.setInput('max', 10);
            fixture.detectChanges();

            expect(component.displayCount()).toBe('10+');
        });
    });

    describe('dot mode', () => {
        it('dot modunda sayı gösterilmemeli', () => {
            fixture.componentRef.setInput('dot', true);
            fixture.componentRef.setInput('count', 5);
            fixture.detectChanges();

            const badge = fixture.debugElement.query(By.css('.sig-badge-count__badge'));
            expect(badge.classes['sig-badge-count__badge--dot']).toBeTruthy();
        });
    });

    describe('color', () => {
        it('özel renk uygulanmalı', () => {
            fixture.componentRef.setInput('count', 1);
            fixture.componentRef.setInput('color', '#22c55e');
            fixture.detectChanges();

            const badge = fixture.debugElement.query(By.css('.sig-badge-count__badge'));
            expect(badge.styles['background-color']).toBe('rgb(34, 197, 94)');
        });
    });
});
