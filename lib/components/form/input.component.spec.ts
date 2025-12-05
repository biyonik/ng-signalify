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