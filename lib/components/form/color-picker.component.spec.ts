import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigColorPickerComponent } from './color-picker.component';
import { By } from '@angular/platform-browser';

describe('SigColorPickerComponent', () => {
    let component: SigColorPickerComponent;
    let fixture: ComponentFixture<SigColorPickerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigColorPickerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigColorPickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should update value via writeValue', () => {
        component.writeValue('#FF0000');
        fixture.detectChanges();
        expect(component.value()).toBe('#FF0000');

        // Toggle butonundaki swatch rengi
        const swatch = fixture.debugElement.query(By.css('.sig-color-picker__swatch'));
        expect(swatch.styles['backgroundColor']).toBe('rgb(255, 0, 0)');
    });

    it('should toggle dropdown on trigger click', () => {
        expect(component.isOpen()).toBe(false);

        const trigger = fixture.debugElement.query(By.css('.sig-color-picker__trigger'));
        trigger.nativeElement.click();
        fixture.detectChanges();

        expect(component.isOpen()).toBe(true);

        trigger.nativeElement.click();
        fixture.detectChanges();

        expect(component.isOpen()).toBe(false);
    });

    it('should select preset color', () => {
        component.toggle();
        fixture.detectChanges();

        const presets = fixture.debugElement.queryAll(By.css('.sig-color-picker__preset'));
        expect(presets.length).toBeGreaterThan(0);

        presets[0].nativeElement.click();
        fixture.detectChanges();

        expect(component.value()).toBeTruthy();
    });

    it('should parse manual HEX input correctly', () => {
        component.toggle();
        fixture.detectChanges();

        const hexInput = fixture.debugElement.query(By.css('.sig-color-picker__hex'));
        if (hexInput) {
            hexInput.nativeElement.value = '#00FF00';
            hexInput.nativeElement.dispatchEvent(new Event('input'));
            fixture.detectChanges();

            expect(component.value()).toBe('#00FF00');
        }
    });

    it('should display label when provided', () => {
        fixture.componentRef.setInput('label', 'Renk Seç');
        fixture.detectChanges();

        const label = fixture.debugElement.query(By.css('.sig-color-picker__label'));
        expect(label).toBeTruthy();
        expect(label.nativeElement.textContent.trim()).toBe('Renk Seç');
    });

    it('should be disabled when disabled input is true', () => {
        fixture.componentRef.setInput('disabled', true);
        fixture.detectChanges();

        const trigger = fixture.debugElement.query(By.css('.sig-color-picker__trigger'));
        expect(trigger.nativeElement.disabled).toBe(true);
    });

    it('should clear value when clear button clicked', () => {
        component.writeValue('#FF0000');
        component.toggle();
        fixture.detectChanges();

        const clearBtn = fixture.debugElement.query(By.css('.sig-color-picker__clear'));
        if (clearBtn) {
            clearBtn.nativeElement.click();
            fixture.detectChanges();

            expect(component.value()).toBeNull();
        }
    });

    it('should close dropdown on Escape key', () => {
        component.toggle();
        fixture.detectChanges();
        expect(component.isOpen()).toBe(true);

        const dialog = fixture.debugElement.query(By.css('.sig-color-picker__dropdown'));
        dialog.triggerEventHandler('keydown', { key: 'Escape', preventDefault: () => {} });
        fixture.detectChanges();

        expect(component.isOpen()).toBe(false);
    });

    // A11Y Tests
    describe('accessibility', () => {
        it('should have aria-expanded on trigger', () => {
            const trigger = fixture.debugElement.query(By.css('.sig-color-picker__trigger'));
            expect(trigger.attributes['aria-expanded']).toBe('false');

            component.toggle();
            fixture.detectChanges();

            expect(trigger.attributes['aria-expanded']).toBe('true');
        });

        it('should have aria-haspopup on trigger', () => {
            const trigger = fixture.debugElement.query(By.css('.sig-color-picker__trigger'));
            expect(trigger.attributes['aria-haspopup']).toBe('dialog');
        });

        it('should have role="dialog" on dropdown', () => {
            component.toggle();
            fixture.detectChanges();

            const dialog = fixture.debugElement.query(By.css('.sig-color-picker__dropdown'));
            expect(dialog.attributes['role']).toBe('dialog');
        });

        it('should have aria-modal on dropdown', () => {
            component.toggle();
            fixture.detectChanges();

            const dialog = fixture.debugElement.query(By.css('.sig-color-picker__dropdown'));
            expect(dialog.attributes['aria-modal']).toBe('true');
        });

        it('presets should have role="listbox"', () => {
            component.toggle();
            fixture.detectChanges();

            const presets = fixture.debugElement.query(By.css('.sig-color-picker__presets'));
            expect(presets.attributes['role']).toBe('listbox');
        });

        it('preset buttons should have role="option"', () => {
            component.toggle();
            fixture.detectChanges();

            const preset = fixture.debugElement.query(By.css('.sig-color-picker__preset'));
            expect(preset.attributes['role']).toBe('option');
        });

        it('selected preset should have aria-selected="true"', () => {
            const firstPreset = component.presets()[0];
            component.writeValue(firstPreset);
            component.toggle();
            fixture.detectChanges();

            const selectedPreset = fixture.debugElement.query(By.css('.sig-color-picker__preset--selected'));
            expect(selectedPreset.attributes['aria-selected']).toBe('true');
        });

        it('trigger should have aria-label describing current color', () => {
            component.writeValue('#FF0000');
            fixture.detectChanges();

            const trigger = fixture.debugElement.query(By.css('.sig-color-picker__trigger'));
            expect(trigger.attributes['aria-label']).toContain('#FF0000');
        });
    });
});
