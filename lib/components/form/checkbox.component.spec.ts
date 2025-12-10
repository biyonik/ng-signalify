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

        // A11Y Tests
        describe('accessibility', () => {
            it('should have unique id', () => {
                const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;
                expect(inputEl.id).toBeTruthy();
                expect(inputEl.id).toContain('sig-checkbox');
            });

            it('should have aria-checked="true" when checked', () => {
                const inputEl = fixture.debugElement.query(By.css('input'));
                inputEl.nativeElement.click();
                fixture.detectChanges();

                expect(inputEl.nativeElement.getAttribute('aria-checked')).toBe('true');
            });

            it('should have aria-checked="false" when unchecked', () => {
                const inputEl = fixture.debugElement.query(By.css('input'));
                expect(inputEl.nativeElement.getAttribute('aria-checked')).toBe('false');
            });

            it('should have aria-checked="mixed" when indeterminate', () => {
                fixture.componentRef.setInput('indeterminate', true);
                fixture.detectChanges();

                const inputEl = fixture.debugElement.query(By.css('input'));
                expect(inputEl.nativeElement.getAttribute('aria-checked')).toBe('mixed');
            });

            it('should have aria-describedby when provided', () => {
                fixture.componentRef.setInput('ariaDescribedBy', 'hint-text');
                fixture.detectChanges();

                const inputEl = fixture.debugElement.query(By.css('input'));
                expect(inputEl.nativeElement.getAttribute('aria-describedby')).toBe('hint-text');
            });

            it('should have aria-invalid when invalid', () => {
                fixture.componentRef.setInput('ariaInvalid', true);
                fixture.detectChanges();

                const inputEl = fixture.debugElement.query(By.css('input'));
                expect(inputEl.nativeElement.getAttribute('aria-invalid')).toBe('true');
            });

            it('should have aria-required when required', () => {
                fixture.componentRef.setInput('required', true);
                fixture.detectChanges();

                const inputEl = fixture.debugElement.query(By.css('input'));
                expect(inputEl.nativeElement.getAttribute('aria-required')).toBe('true');
            });

            it('label should be associated with input via for attribute', () => {
                fixture.componentRef.setInput('label', 'Test Label');
                fixture.detectChanges();

                const label = fixture.debugElement.query(By.css('label'));
                const input = fixture.debugElement.query(By.css('input'));
                expect(label.nativeElement.getAttribute('for')).toBe(input.nativeElement.id);
            });

            it('checkbox box should have aria-hidden="true"', () => {
                const box = fixture.debugElement.query(By.css('.sig-checkbox__box'));
                expect(box.attributes['aria-hidden']).toBe('true');
            });

            it('should be focusable and respond to keyboard', () => {
                const inputEl = fixture.debugElement.query(By.css('input'));

                // Input focusable olmalı (tabindex -1 değil)
                expect(inputEl.nativeElement.tabIndex).not.toBe(-1);

                // Native checkbox Space key'e yanıt verir (change event trigger'lanır)
                inputEl.nativeElement.click(); // Native davranışı simüle et
                fixture.detectChanges();

                expect(component.checked()).toBe(true);
            });
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

        // A11Y Tests for Switch
        describe('accessibility', () => {
            it('should have role="switch"', () => {
                const inputEl = fixture.debugElement.query(By.css('input'));
                expect(inputEl.nativeElement.getAttribute('role')).toBe('switch');
            });

            it('should have unique id', () => {
                const inputEl = fixture.debugElement.query(By.css('input')).nativeElement;
                expect(inputEl.id).toBeTruthy();
                expect(inputEl.id).toContain('sig-switch');
            });

            it('should have aria-checked when toggled', () => {
                const inputEl = fixture.debugElement.query(By.css('input'));

                expect(inputEl.nativeElement.getAttribute('aria-checked')).toBe('false');

                inputEl.nativeElement.click();
                fixture.detectChanges();

                expect(inputEl.nativeElement.getAttribute('aria-checked')).toBe('true');
            });

            it('should have aria-label describing state', () => {
                fixture.componentRef.setInput('label', 'Bildirimleri Aç');
                fixture.detectChanges();

                const inputEl = fixture.debugElement.query(By.css('input'));
                // aria-label olmalı veya label ile ilişkilendirilmiş olmalı
                const label = fixture.debugElement.query(By.css('.sig-switch__label'));
                expect(label || inputEl.attributes['aria-label']).toBeTruthy();
            });

            it('switch track should have aria-hidden="true"', () => {
                const track = fixture.debugElement.query(By.css('.sig-switch__track'));
                expect(track.attributes['aria-hidden']).toBe('true');
            });
        });
    });
});