import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigRadioGroupComponent, RadioOption } from './radio.component';
import { By } from '@angular/platform-browser';

describe('SigRadioGroupComponent', () => {
    let component: SigRadioGroupComponent;
    let fixture: ComponentFixture<SigRadioGroupComponent>;

    const options: RadioOption[] = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2', description: 'Detailed desc' },
        { value: 'opt3', label: 'Disabled Option', disabled: true },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigRadioGroupComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigRadioGroupComponent);
        component = fixture.componentInstance;

        // Zorunlu inputlar
        fixture.componentRef.setInput('name', 'test-radio');
        fixture.componentRef.setInput('options', options);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render all options', () => {
        const radios = fixture.debugElement.queryAll(By.css('.sig-radio'));
        expect(radios.length).toBe(3);

        // Label kontrolü
        const firstLabel = radios[0].query(By.css('.sig-radio__text')).nativeElement;
        expect(firstLabel.textContent).toContain('Option 1');
    });

    it('should render description if provided', () => {
        const desc = fixture.debugElement.query(By.css('.sig-radio__description'));
        expect(desc).toBeTruthy();
        expect(desc.nativeElement.textContent).toContain('Detailed desc');
    });

    it('should update value when option is clicked', () => {
        const inputs = fixture.debugElement.queryAll(By.css('input[type="radio"]'));
        const secondInput = inputs[1].nativeElement; // Option 2

        secondInput.click();
        secondInput.dispatchEvent(new Event('change')); // Angular change event'i için
        fixture.detectChanges();

        expect(component.value()).toBe('opt2');
        expect(fixture.debugElement.query(By.css('.sig-radio--checked'))).toBeTruthy();
    });

    it('should NOT update value when disabled option is clicked', () => {
        const inputs = fixture.debugElement.queryAll(By.css('input[type="radio"]'));
        const disabledInput = inputs[2].nativeElement; // Disabled Option

        expect(disabledInput.disabled).toBe(true);

        disabledInput.click();
        fixture.detectChanges();

        expect(component.value()).toBeNull();
    });

    it('should apply layout classes (Horizontal/Vertical)', () => {
        // Default vertical
        expect(fixture.debugElement.query(By.css('.sig-radio-group--vertical'))).toBeTruthy();

        // Change to horizontal
        fixture.componentRef.setInput('direction', 'horizontal');
        fixture.detectChanges();
        expect(fixture.debugElement.query(By.css('.sig-radio-group--horizontal'))).toBeTruthy();
    });

    it('should support ControlValueAccessor (writeValue)', () => {
        component.writeValue('opt1');
        fixture.detectChanges();

        expect(component.value()).toBe('opt1');
        const firstRadio = fixture.debugElement.queryAll(By.css('.sig-radio'))[0];
        expect(firstRadio.classes['sig-radio--checked']).toBe(true);
    });
});