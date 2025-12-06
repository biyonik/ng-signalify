import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SigNumberStepperComponent } from './number-stepper.component';
import { By } from '@angular/platform-browser';

describe('SigNumberStepperComponent', () => {
    let component: SigNumberStepperComponent;
    let fixture: ComponentFixture<SigNumberStepperComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigNumberStepperComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigNumberStepperComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should increment and decrement value', () => {
        // Default 0
        expect(component.value()).toBe(0);

        // Click Plus
        const plusBtn = fixture.debugElement.query(By.css('.sig-stepper__btn--plus'));
        plusBtn.nativeElement.click();
        fixture.detectChanges();
        expect(component.value()).toBe(1);

        // Click Minus
        const minusBtn = fixture.debugElement.query(By.css('.sig-stepper__btn--minus'));
        minusBtn.nativeElement.click();
        fixture.detectChanges();
        expect(component.value()).toBe(0);
    });

    it('should respect Min and Max limits', () => {
        fixture.componentRef.setInput('min', 0);
        fixture.componentRef.setInput('max', 2);
        fixture.detectChanges();

        component.writeValue(2); // Set to Max
        fixture.detectChanges();

        // Try increment
        component.increment();
        expect(component.value()).toBe(2); // Should not increase
        expect(component.isAtMax()).toBe(true);

        // UI check: Plus button should be disabled
        const plusBtn = fixture.debugElement.query(By.css('.sig-stepper__btn--plus'));
        expect(plusBtn.nativeElement.disabled).toBe(true);
    });

    it('should handle decimals correctly', () => {
        fixture.componentRef.setInput('step', 0.1);
        fixture.componentRef.setInput('decimals', 1);
        fixture.detectChanges();

        component.increment(); // 0 -> 0.1
        expect(component.value()).toBe(0.1);

        // Javascript floating point error check (0.1 + 0.2 != 0.3 normally)
        component.increment(); // 0.1 -> 0.2
        component.increment(); // 0.2 -> 0.3
        expect(component.value()).toBe(0.3); // Component handles formatting internally
    });

    it('should handle "Hold to Increment" logic', fakeAsync(() => {
        fixture.componentRef.setInput('holdDelay', 500);
        fixture.componentRef.setInput('holdInterval', 100);
        fixture.detectChanges();

        const plusBtn = fixture.debugElement.query(By.css('.sig-stepper__btn--plus'));

        // Mouse Down (Hold Starts)
        plusBtn.triggerEventHandler('mousedown', {});

        // Wait for initial delay (500ms)
        tick(500);

        // Should start incrementing periodically
        tick(100); // +1
        tick(100); // +1
        tick(100); // +1

        // Toplam 3 artış olmalı (Mouse down anında artış yapmıyor kod, timer ile başlıyor)
        // Kodda startHold timer başlatıyor, ilk action timer içinde.
        expect(component.value()).toBe(3);

        // Mouse Up (Hold Stops)
        plusBtn.triggerEventHandler('mouseup', {});

        tick(1000); // Wait more time
        expect(component.value()).toBe(3); // Should stop incrementing
    }));

    it('should validate manual input', () => {
        fixture.componentRef.setInput('max', 10);
        fixture.detectChanges();

        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;

        // User types 50 (over max)
        inputEl.value = '50';
        inputEl.dispatchEvent(new Event('input'));
        inputEl.dispatchEvent(new Event('blur')); // Blur clamps the value
        fixture.detectChanges();

        expect(component.value()).toBe(10); // Clamped to Max
    });
});