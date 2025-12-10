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

        // Click increment button
        const incrementBtn = fixture.debugElement.query(By.css('.sig-number-stepper__btn--increment'));
        incrementBtn.nativeElement.click();
        fixture.detectChanges();
        expect(component.value()).toBe(1);

        // Click decrement button
        const decrementBtn = fixture.debugElement.query(By.css('.sig-number-stepper__btn--decrement'));
        decrementBtn.nativeElement.click();
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

        // UI check: increment button should be disabled
        const incrementBtn = fixture.debugElement.query(By.css('.sig-number-stepper__btn--increment'));
        expect(incrementBtn.nativeElement.disabled).toBe(true);
    });

    it('should handle decimals correctly with precision input', () => {
        fixture.componentRef.setInput('step', 0.1);
        fixture.componentRef.setInput('precision', 1);
        fixture.detectChanges();

        component.increment(); // 0 -> 0.1
        expect(component.value()).toBe(0.1);

        // Javascript floating point error check (0.1 + 0.2 != 0.3 normally)
        component.increment(); // 0.1 -> 0.2
        component.increment(); // 0.2 -> 0.3
        expect(component.value()).toBe(0.3); // Component handles formatting internally
    });

    it('should validate manual input', () => {
        fixture.componentRef.setInput('max', 10);
        fixture.detectChanges();

        const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;

        // User types 50 (over max)
        inputEl.value = '50';
        inputEl.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.value()).toBe(10); // Clamped to Max
    });

    it('should display label when provided', () => {
        fixture.componentRef.setInput('label', 'Miktar');
        fixture.detectChanges();

        const label = fixture.debugElement.query(By.css('.sig-number-stepper__label'));
        expect(label).toBeTruthy();
        expect(label.nativeElement.textContent).toContain('Miktar');
    });

    it('should display required indicator when required', () => {
        fixture.componentRef.setInput('label', 'Miktar');
        fixture.componentRef.setInput('required', true);
        fixture.detectChanges();

        const label = fixture.debugElement.query(By.css('.sig-number-stepper__label'));
        expect(label.nativeElement.textContent).toContain('*');
    });

    it('should be disabled when disabled input is true', () => {
        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();

        const input = fixture.debugElement.query(By.css('.sig-number-stepper__input'));
        expect(input.nativeElement.disabled).toBe(true);

        const incrementBtn = fixture.debugElement.query(By.css('.sig-number-stepper__btn--increment'));
        expect(incrementBtn.nativeElement.disabled).toBe(true);

        const decrementBtn = fixture.debugElement.query(By.css('.sig-number-stepper__btn--decrement'));
        expect(decrementBtn.nativeElement.disabled).toBe(true);
    });

    it('should handle keyboard navigation (ArrowUp/ArrowDown)', () => {
        const input = fixture.debugElement.query(By.css('.sig-number-stepper__input'));

        // Arrow Up should increment
        input.triggerEventHandler('keydown', { key: 'ArrowUp', preventDefault: () => {} });
        fixture.detectChanges();
        expect(component.value()).toBe(1);

        // Arrow Down should decrement
        input.triggerEventHandler('keydown', { key: 'ArrowDown', preventDefault: () => {} });
        fixture.detectChanges();
        expect(component.value()).toBe(0);
    });

    it('should handle Home/End keys', () => {
        fixture.componentRef.setInput('min', 0);
        fixture.componentRef.setInput('max', 100);
        component.writeValue(50);
        fixture.detectChanges();

        const input = fixture.debugElement.query(By.css('.sig-number-stepper__input'));

        // Home should go to min
        input.triggerEventHandler('keydown', { key: 'Home', preventDefault: () => {} });
        fixture.detectChanges();
        expect(component.value()).toBe(0);

        // End should go to max
        input.triggerEventHandler('keydown', { key: 'End', preventDefault: () => {} });
        fixture.detectChanges();
        expect(component.value()).toBe(100);
    });

    it('should show hint when provided', () => {
        fixture.componentRef.setInput('hint', 'Bir sayı girin');
        fixture.detectChanges();

        const hint = fixture.debugElement.query(By.css('.sig-number-stepper__hint'));
        expect(hint).toBeTruthy();
        expect(hint.nativeElement.textContent).toContain('Bir sayı girin');
    });

    // A11Y Tests
    describe('accessibility', () => {
        it('should have role="spinbutton" on input', () => {
            const input = fixture.debugElement.query(By.css('.sig-number-stepper__input'));
            expect(input.attributes['role']).toBe('spinbutton');
        });

        it('should have aria-valuemin and aria-valuemax', () => {
            fixture.componentRef.setInput('min', 5);
            fixture.componentRef.setInput('max', 50);
            fixture.detectChanges();

            const input = fixture.debugElement.query(By.css('.sig-number-stepper__input'));
            expect(input.attributes['aria-valuemin']).toBe('5');
            expect(input.attributes['aria-valuemax']).toBe('50');
        });

        it('should have aria-valuenow reflecting current value', () => {
            component.writeValue(25);
            fixture.detectChanges();

            const input = fixture.debugElement.query(By.css('.sig-number-stepper__input'));
            expect(input.attributes['aria-valuenow']).toBe('25');
        });

        it('should have aria-invalid when invalid', () => {
            fixture.componentRef.setInput('ariaInvalid', true);
            fixture.detectChanges();

            const input = fixture.debugElement.query(By.css('.sig-number-stepper__input'));
            expect(input.attributes['aria-invalid']).toBe('true');
        });

        it('should have aria-required when required', () => {
            fixture.componentRef.setInput('required', true);
            fixture.detectChanges();

            const input = fixture.debugElement.query(By.css('.sig-number-stepper__input'));
            expect(input.attributes['aria-required']).toBe('true');
        });

        it('increment/decrement buttons should have aria-label', () => {
            const incrementBtn = fixture.debugElement.query(By.css('.sig-number-stepper__btn--increment'));
            const decrementBtn = fixture.debugElement.query(By.css('.sig-number-stepper__btn--decrement'));

            expect(incrementBtn.attributes['aria-label']).toBeTruthy();
            expect(decrementBtn.attributes['aria-label']).toBeTruthy();
        });

        it('buttons should have aria-controls pointing to input', () => {
            const incrementBtn = fixture.debugElement.query(By.css('.sig-number-stepper__btn--increment'));
            const input = fixture.debugElement.query(By.css('.sig-number-stepper__input'));

            expect(incrementBtn.attributes['aria-controls']).toBe(input.attributes['id']);
        });

        it('input should have inputmode="numeric"', () => {
            const input = fixture.debugElement.query(By.css('.sig-number-stepper__input'));
            expect(input.attributes['inputmode']).toBe('numeric');
        });

        it('should have aria-describedby when hint is provided', () => {
            fixture.componentRef.setInput('hint', 'Help text');
            fixture.detectChanges();

            const input = fixture.debugElement.query(By.css('.sig-number-stepper__input'));
            const hint = fixture.debugElement.query(By.css('.sig-number-stepper__hint'));

            expect(input.attributes['aria-describedby']).toBe(hint.attributes['id']);
        });
    });
});
