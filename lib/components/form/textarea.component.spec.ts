import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigTextareaComponent } from './textarea.component';
import { By } from '@angular/platform-browser';

describe('SigTextareaComponent', () => {
    let component: SigTextareaComponent;
    let fixture: ComponentFixture<SigTextareaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigTextareaComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigTextareaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update model on input', () => {
        const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement;
        textarea.value = 'Hello World';
        textarea.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.value()).toBe('Hello World');
        expect(component.charCount()).toBe(11);
    });

    it('should display character counter correctly', () => {
        fixture.componentRef.setInput('maxLength', 100);
        fixture.componentRef.setInput('showCounter', true);
        fixture.detectChanges();

        component.writeValue('Test');
        fixture.detectChanges();

        const counter = fixture.debugElement.query(By.css('.sig-textarea__counter'));
        expect(counter.nativeElement.textContent).toContain('4 / 100');
    });

    it('should show visual warnings when near/at limit', () => {
        fixture.componentRef.setInput('maxLength', 10);
        fixture.detectChanges();

        // 1. Normal Durum
        component.writeValue('123'); // 3 chars
        fixture.detectChanges();
        expect(component.isNearLimit()).toBe(false);

        // 2. Near Limit (> 90% -> 9 chars is exactly 90%, need > 90% so 10 chars is tricky if limit is 10)
        // Kodda: charCount > max * 0.9.  10 * 0.9 = 9.
        // Eğer 9 karakter yazarsam: 9 > 9 False.
        // Eğer 10 karakter yazarsam: 10 > 9 True. (Hem Near hem At limit olur)

        // Let's use larger limit for clarity
        fixture.componentRef.setInput('maxLength', 20);
        fixture.detectChanges(); // Limit 20. 90% = 18.

        component.writeValue('1234567890123456789'); // 19 chars
        fixture.detectChanges();

        expect(component.isNearLimit()).toBe(true);
        expect(fixture.debugElement.query(By.css('.sig-textarea__counter--warning'))).toBeTruthy();

        // 3. At Limit
        component.writeValue('12345678901234567890'); // 20 chars
        fixture.detectChanges();

        expect(component.isAtLimit()).toBe(true);
        expect(fixture.debugElement.query(By.css('.sig-textarea__counter--error'))).toBeTruthy();
    });

    it('should emit focus and blur events', () => {
        const focusSpy = jest.spyOn(component.focus, 'emit');
        const blurSpy = jest.spyOn(component.blur, 'emit');
        const textarea = fixture.debugElement.query(By.css('textarea'));

        textarea.triggerEventHandler('focus', {});
        expect(focusSpy).toHaveBeenCalled();

        textarea.triggerEventHandler('blur', {});
        expect(blurSpy).toHaveBeenCalled();
    });

    it('should trigger autoResize on input', () => {
        // Resize methodunun private olmasi teste engel değil,
        // stil değişikliğini kontrol etmek zor (JSDOM limitations).
        // Ancak component instance üzerinden fonksiyonu spy edebiliriz (eğer public olsaydı)
        // Ya da input eventinden sonra hatasız çalıştığını doğrularız.

        fixture.componentRef.setInput('autoResize', true);
        fixture.detectChanges();

        const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement;
        textarea.value = 'New Line\nNew Line\nNew Line';

        // Hata atmadığını kontrol et
        expect(() => textarea.dispatchEvent(new Event('input'))).not.toThrow();
    });
});