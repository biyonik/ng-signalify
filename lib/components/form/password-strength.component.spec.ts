import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigPasswordStrengthComponent } from './password-strength.component';
import { By } from '@angular/platform-browser';

describe('SigPasswordStrengthComponent', () => {
    let component: SigPasswordStrengthComponent;
    let fixture: ComponentFixture<SigPasswordStrengthComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigPasswordStrengthComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigPasswordStrengthComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should calculate strength correctly', () => {
        // Düzeltme: writeValue yok, setInput kullanıyoruz.
        fixture.componentRef.setInput('password', '123');
        fixture.detectChanges();

        // %40 altı -> Level 1 (Zayıf)
        expect(component.strengthLevel()).toBe(1);
        expect(component.strengthLabel()).toBe('Zayıf');

        // Harf + Sayı
        fixture.componentRef.setInput('password', 'password123');
        fixture.detectChanges();
        // Kurallar: length(ok), lowercase(ok), number(ok) -> 3/5 = 60% -> Level 3 (Good)
        // Kod mantığı: if < 80 return 3. 60 >= 60.
        expect(component.strengthLevel()).toBe(3);

        // Güçlü
        fixture.componentRef.setInput('password', 'P@ssw0rd!');
        fixture.detectChanges();
        expect(component.strengthLevel()).toBe(4);
        expect(component.strengthLabel()).toBe('Güçlü');
    });

    it('should mark rules as passed', () => {
        fixture.componentRef.setInput('password', 'abc'); // Sadece lowercase ve length < 8
        fixture.componentRef.setInput('showRules', true);
        fixture.detectChanges();

        const rules = component.rulesWithStatus();
        const lengthRule = rules.find(r => r.id === 'length');
        const lowerRule = rules.find(r => r.id === 'lowercase');

        expect(lengthRule?.passed).toBe(false);
        expect(lowerRule?.passed).toBe(true);

        // UI Kontrolü
        const passedRuleEl = fixture.debugElement.query(By.css('.sig-password-strength__rule--passed'));
        expect(passedRuleEl.nativeElement.textContent).toContain('Küçük harf');
    });
});