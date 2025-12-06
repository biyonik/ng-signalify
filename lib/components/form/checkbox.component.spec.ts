import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigCheckboxComponent, SigSwitchComponent } from './checkbox.component';
import { By } from '@angular/platform-browser';

describe('Checkbox & Switch Suite', () => {

    // --- CHECKBOX TESTLERİ ---
    describe('SigCheckboxComponent', () => {
        let component: SigCheckboxComponent;
        let fixture: ComponentFixture<SigCheckboxComponent>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [SigCheckboxComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(SigCheckboxComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should toggle state on click', () => {
            const inputEl = fixture.debugElement.query(By.css('input[type="checkbox"]'));

            // Tıkla (Checked)
            inputEl.nativeElement.click();
            fixture.detectChanges();
            expect(component.checked()).toBe(true);
            expect(fixture.debugElement.query(By.css('.sig-checkbox__check'))).toBeTruthy();

            // Tekrar Tıkla (Unchecked)
            inputEl.nativeElement.click();
            fixture.detectChanges();
            expect(component.checked()).toBe(false);
        });

        it('should display label', () => {
            fixture.componentRef.setInput('label', 'Kullanım Şartları');
            fixture.detectChanges();

            const labelEl = fixture.debugElement.query(By.css('.sig-checkbox__label'));
            expect(labelEl.nativeElement.textContent).toContain('Kullanım Şartları');
        });

        it('should handle indeterminate state', () => {
            fixture.componentRef.setInput('indeterminate', true);
            fixture.detectChanges();

            // Indeterminate ikonu görünmeli
            const dashIcon = fixture.debugElement.query(By.css('.sig-checkbox__indeterminate'));
            expect(dashIcon).toBeTruthy();
            expect(dashIcon.nativeElement.textContent).toContain('−');

            // Checked ikonu görünmemeli
            expect(fixture.debugElement.query(By.css('.sig-checkbox__check'))).toBeFalsy();
        });

        it('should be disabled', () => {
            fixture.componentRef.setInput('disabled', true);
            fixture.detectChanges();

            const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;
            expect(inputEl.disabled).toBe(true);

            const hostClass = fixture.debugElement.query(By.css('.sig-checkbox--disabled'));
            expect(hostClass).toBeTruthy();
        });
    });

    // --- SWITCH TESTLERİ ---
    describe('SigSwitchComponent', () => {
        let component: SigSwitchComponent;
        let fixture: ComponentFixture<SigSwitchComponent>;

        beforeEach(async () => {
            await TestBed.configureTestingModule({
                imports: [SigSwitchComponent]
            }).compileComponents();

            fixture = TestBed.createComponent(SigSwitchComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
        });

        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should toggle switch on click', () => {
            const inputEl = fixture.debugElement.query(By.css('input'));

            inputEl.nativeElement.click();
            fixture.detectChanges();

            expect(component.checked()).toBe(true);
            expect(fixture.debugElement.query(By.css('.sig-switch--checked'))).toBeTruthy();
        });

        it('should apply size classes', () => {
            fixture.componentRef.setInput('size', 'large');
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.css('.sig-switch--large'))).toBeTruthy();

            fixture.componentRef.setInput('size', 'small');
            fixture.detectChanges();
            expect(fixture.debugElement.query(By.css('.sig-switch--small'))).toBeTruthy();
        });

        it('should support ControlValueAccessor (writeValue)', () => {
            // Dışarıdan değer geldiğinde (ngModel veya formControl)
            component.writeValue(true);
            fixture.detectChanges();

            expect(component.checked()).toBe(true);
            const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;
            expect(inputEl.checked).toBe(true);
        });
    });
});