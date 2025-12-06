import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigTimePickerComponent } from './time-picker.component';
import { By } from '@angular/platform-browser';

describe('SigTimePickerComponent', () => {
    let component: SigTimePickerComponent;
    let fixture: ComponentFixture<SigTimePickerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigTimePickerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigTimePickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should format time correctly (24h format)', () => {
        fixture.componentRef.setInput('use24Hour', true);
        component.writeValue({ hours: 14, minutes: 30 }); // 14:30
        fixture.detectChanges();

        const valueEl = fixture.debugElement.query(By.css('.sig-time-picker__value'));
        expect(valueEl.nativeElement.textContent).toContain('14:30');
    });

    it('should format time correctly (12h format)', () => {
        fixture.componentRef.setInput('use24Hour', false);
        component.writeValue({ hours: 14, minutes: 30 }); // 2:30 PM
        fixture.detectChanges();

        const valueEl = fixture.debugElement.query(By.css('.sig-time-picker__value'));
        expect(valueEl.nativeElement.textContent).toContain('02:30 PM');
    });

    it('should select hour and minute', () => {
        component.toggle();
        fixture.detectChanges();

        // Saat seç (Örn: 10)
        // DOM listesi uzun olabilir, direkt methodu çağırmak da bir test yöntemidir ama tıklamayı simüle edelim
        const hourOptions = fixture.debugElement.queryAll(By.css('.sig-time-picker__column'))[0]
            .queryAll(By.css('.sig-time-picker__option'));

        hourOptions[10].nativeElement.click(); // 10. index (veya içerik kontrolü)

        // Dakika seç
        component.selectMinute(45);

        // Confirm
        const confirmBtn = fixture.debugElement.query(By.css('.sig-time-picker__confirm'));
        confirmBtn.nativeElement.click();
        fixture.detectChanges();

        expect(component.value()?.hours).toBeDefined();
        expect(component.value()?.minutes).toBe(45);
    });

    it('should handle "Now" selection', () => {
        component.toggle();
        fixture.detectChanges();

        const nowBtn = fixture.debugElement.query(By.css('.sig-time-picker__now'));
        nowBtn.nativeElement.click();

        // Confirm basmadan value güncellenmez (kod mantığına göre), ama selectedHour güncellenir
        const now = new Date();
        expect(component.selectedMinute()).toBe(now.getMinutes());

        // Confirm ile onayla
        component.confirm();
        expect(component.value()).not.toBeNull();
    });

    it('should convert AM/PM back to 24h on confirm', () => {
        fixture.componentRef.setInput('use24Hour', false);
        component.toggle();

        // 02:00 PM seçelim
        component.selectHour(2);
        component.selectPeriod('PM');
        component.selectMinute(0);

        component.confirm();

        // Modelde 14:00 olmalı
        expect(component.value()?.hours).toBe(14);
    });
});