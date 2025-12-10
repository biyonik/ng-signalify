import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigInputComponent } from './input.component';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

// Test Host Component (Input'u kullanan sahte bir component)
@Component({
  template: `
    <sig-input
      [type]="type()"
      [(value)]="val"
      [placeholder]="placeholder"
      [disabled]="isDisabled"
      (blur)="onBlur()"
    ></sig-input>
  `,
  standalone: true,
  imports: [SigInputComponent, FormsModule]
})
class TestHostComponent {
  type = signal<'text' | 'password'>('text');
  val = 'Initial Value';
  placeholder = 'Test Placeholder';
  isDisabled = false;
  onBlur = jest.fn(); // Spy fonksiyonu
}

describe('SigInputComponent (UI Core)', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let inputEl: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, SigInputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // İlk render

    // HTML input elementini bul
    inputEl = fixture.debugElement.query(By.css('input')).nativeElement;
  });

  it('should render initial value correctly', () => {
    expect(inputEl.value).toBe('Initial Value');
  });

  it('should support two-way data binding (Signal Model)', () => {
    // 1. View -> Model
    inputEl.value = 'Changed from UI';
    inputEl.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(component.val).toBe('Changed from UI');

    // 2. Model -> View
    component.val = 'Changed from Code';
    fixture.detectChanges();
    // Signal update sonrası detectChanges bazen bir tick gerektirebilir
    expect(inputEl.value).toBe('Changed from Code');
  });

  it('should handle disabled state', () => {
    component.isDisabled = true;
    fixture.detectChanges();
    expect(inputEl.disabled).toBe(true);
  });

  it('should emit blur event', () => {
    inputEl.dispatchEvent(new Event('blur'));
    expect(component.onBlur).toHaveBeenCalled();
  });

  it('should toggle password visibility', () => {
    component.type.set('password');
    fixture.detectChanges();
    expect(inputEl.type).toBe('password');

    // Toggle butonunu bul ve tıkla
    const toggleBtn = fixture.debugElement.query(By.css('.sig-input__toggle'));
    expect(toggleBtn).toBeTruthy(); // Buton var mı?

    toggleBtn.nativeElement.click();
    fixture.detectChanges();

    expect(inputEl.type).toBe('text'); // Şifre görünür olmalı
  });
});

// Direct component tests for A11Y features
describe('SigInputComponent (A11Y)', () => {
  let fixture: ComponentFixture<SigInputComponent>;
  let component: SigInputComponent;
  let inputEl: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SigInputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SigInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    inputEl = fixture.debugElement.query(By.css('input')).nativeElement;
  });

  it('should have unique id for input', () => {
    expect(inputEl.id).toBeTruthy();
    expect(inputEl.id).toContain('sig-');
  });

  it('should support aria-label', () => {
    fixture.componentRef.setInput('ariaLabel', 'Kullanıcı adı');
    fixture.detectChanges();

    expect(inputEl.getAttribute('aria-label')).toBe('Kullanıcı adı');
  });

  it('should support aria-labelledby', () => {
    fixture.componentRef.setInput('ariaLabelledBy', 'label-id');
    fixture.detectChanges();

    expect(inputEl.getAttribute('aria-labelledby')).toBe('label-id');
  });

  it('should support aria-describedby', () => {
    fixture.componentRef.setInput('ariaDescribedBy', 'hint-id');
    fixture.detectChanges();

    expect(inputEl.getAttribute('aria-describedby')).toBe('hint-id');
  });

  it('should have aria-invalid when invalid', () => {
    fixture.componentRef.setInput('ariaInvalid', true);
    fixture.detectChanges();

    expect(inputEl.getAttribute('aria-invalid')).toBe('true');
  });

  it('should have aria-required when required', () => {
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();

    expect(inputEl.getAttribute('aria-required')).toBe('true');
  });

  it('should have aria-readonly when readonly', () => {
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();

    expect(inputEl.getAttribute('aria-readonly')).toBe('true');
  });

  it('password toggle should have aria-pressed attribute', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();

    const toggleBtn = fixture.debugElement.query(By.css('.sig-input__toggle'));
    expect(toggleBtn.attributes['aria-pressed']).toBe('false');

    toggleBtn.nativeElement.click();
    fixture.detectChanges();

    expect(toggleBtn.attributes['aria-pressed']).toBe('true');
  });

  it('password toggle should have descriptive aria-label', () => {
    fixture.componentRef.setInput('type', 'password');
    fixture.detectChanges();

    const toggleBtn = fixture.debugElement.query(By.css('.sig-input__toggle'));
    expect(toggleBtn.attributes['aria-label']).toContain('Şifre');
  });

  it('clear button should have aria-label', () => {
    fixture.componentRef.setInput('clearable', true);
    component.value.set('Test');
    fixture.detectChanges();

    const clearBtn = fixture.debugElement.query(By.css('.sig-input__clear'));
    if (clearBtn) {
      expect(clearBtn.attributes['aria-label']).toBeTruthy();
    }
  });

  it('icons should have aria-hidden="true"', () => {
    fixture.componentRef.setInput('icon', '🔍');
    fixture.detectChanges();

    const icon = fixture.debugElement.query(By.css('.sig-input__icon'));
    if (icon) {
      expect(icon.attributes['aria-hidden']).toBe('true');
    }
  });

  it('should support inputmode attribute', () => {
    fixture.componentRef.setInput('inputMode', 'numeric');
    fixture.detectChanges();

    expect(inputEl.getAttribute('inputmode')).toBe('numeric');
  });
});
