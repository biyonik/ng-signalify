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

    it('should update value via writeValue', () => {
        component.writeValue('#FF0000');
        fixture.detectChanges();
        expect(component.value()).toBe('#FF0000');

        // Toggle butonundaki preview rengi
        const preview = fixture.debugElement.query(By.css('.sig-color-picker__preview'));
        expect(preview.styles['background-color']).toBe('rgb(255, 0, 0)');
    });

    it('should select preset', () => {
        fixture.componentRef.setInput('presetColors', ['#000000', '#FFFFFF']);
        component.toggle();
        fixture.detectChanges();

        const presets = fixture.debugElement.queryAll(By.css('.sig-color-picker__preset'));
        presets[1].nativeElement.click(); // White
        fixture.detectChanges();

        expect(component.value()).toBe('#FFFFFF');
    });

    it('should parse manual input correctly', () => {
        component.toggle();
        fixture.detectChanges();

        const inputEl = fixture.debugElement.query(By.css('.sig-color-picker__input')).nativeElement;
        inputEl.value = '#00FF00';
        inputEl.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        expect(component.value()).toBe('#00FF00');
        // Hue/Saturation signalleri de güncellenmeli (private oldukları için computed rgbString ile anlayabiliriz)
        expect(component.rgbString()).toBe('rgb(0, 255, 0)');
    });
});