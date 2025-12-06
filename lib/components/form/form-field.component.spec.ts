import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field.component';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';

// Projection Testi için Host Component
@Component({
    template: `
    <sig-form-field [label]="label" [error]="error" [touched]="touched">
      <input type="text" id="projected-input">
    </sig-form-field>
  `
})
class TestHostComponent {
    label = 'Test Label';
    error: string | null = null;
    touched = false;
}

describe('FormFieldComponent (Wrapper)', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let hostComponent: TestHostComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormFieldComponent],
            declarations: [TestHostComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TestHostComponent);
        hostComponent = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should project content correctly', () => {
        const input = fixture.debugElement.query(By.css('#projected-input'));
        expect(input).toBeTruthy();
    });

    it('should display label', () => {
        const labelEl = fixture.debugElement.query(By.css('.sig-form-field__label'));
        expect(labelEl.nativeElement.textContent).toContain('Test Label');
    });

    it('should NOT show error initially (untouched)', () => {
        hostComponent.error = 'Zorunlu alan';
        hostComponent.touched = false;
        fixture.detectChanges();

        const errorEl = fixture.debugElement.query(By.css('.sig-form-field__error'));
        expect(errorEl).toBeFalsy();
    });

    it('should show error when touched AND error exists', () => {
        hostComponent.error = 'Hata var!';
        hostComponent.touched = true;
        fixture.detectChanges();

        const errorEl = fixture.debugElement.query(By.css('.sig-form-field__error'));
        expect(errorEl).toBeTruthy();
        expect(errorEl.nativeElement.textContent).toContain('Hata var!');
    });

    it('should show spinner when loading', () => {
        // Host component'i güncellemek yerine direkt component instance testi de yapılabilir
        // Ama template üzerinden gitmek daha gerçekçi.
        // Host component'e loading prop eklemedim,
        // bu yüzden DebugElement üzerinden direkt componentRef'e ulaşıp setInput yapacağım.

        const formFieldDebug = fixture.debugElement.query(By.directive(FormFieldComponent));
        const formFieldRef = formFieldDebug.componentInstance as FormFieldComponent;

        // Angular 17+ Signals Input update via fixture/ref is easier in unit tests,
        // but here we are in integration. Let's force it.
        // Note: In real integration test, host should pass input.
        // Let's stick to simple selector check if we can mock it or assume simple usage.

        // Basit yöntem: Yeni bir test case ile direkt component testi
    });
});

// Direkt Component Testi (Daha izole kontrol için)
describe('FormFieldComponent (Isolated)', () => {
    let fixture: ComponentFixture<FormFieldComponent>;
    let component: FormFieldComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormFieldComponent]
        }).compileComponents();
        fixture = TestBed.createComponent(FormFieldComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should show loading spinner', () => {
        fixture.componentRef.setInput('loading', true);
        fixture.detectChanges();

        const spinner = fixture.debugElement.query(By.css('.sig-form-field__spinner'));
        expect(spinner).toBeTruthy();
    });

    it('should show hint text', () => {
        fixture.componentRef.setInput('hint', 'İpucu metni');
        fixture.detectChanges();

        const hint = fixture.debugElement.query(By.css('.sig-form-field__hint'));
        expect(hint.nativeElement.textContent).toContain('İpucu metni');
    });
});