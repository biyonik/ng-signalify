import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigRatingComponent } from './rating.component';
import { By } from '@angular/platform-browser';

describe('SigRatingComponent', () => {
    let component: SigRatingComponent;
    let fixture: ComponentFixture<SigRatingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SigRatingComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(SigRatingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should render correct number of stars', () => {
        fixture.componentRef.setInput('max', 5);
        fixture.detectChanges();

        const stars = fixture.debugElement.queryAll(By.css('.sig-rating__star'));
        expect(stars.length).toBe(5);
    });

    it('should calculate star fill state correctly', () => {
        fixture.componentRef.setInput('max', 5);
        component.writeValue(3); // 3 Full Stars
        fixture.detectChanges();

        const stars = fixture.debugElement.queryAll(By.css('.sig-rating__star'));

        expect(stars[0].classes['sig-rating__star--filled']).toBe(true);
        expect(stars[2].classes['sig-rating__star--filled']).toBe(true);
        expect(stars[3].classes['sig-rating__star--filled']).toBeFalsy();
    });

    it('should handle half stars if allowed', () => {
        fixture.componentRef.setInput('allowHalf', true);
        component.writeValue(3.5);
        fixture.detectChanges();

        const stars = fixture.debugElement.queryAll(By.css('.sig-rating__star'));

        // 4th star (index 3) should be half
        expect(stars[3].classes['sig-rating__star--half']).toBe(true);
        expect(stars[3].classes['sig-rating__star--filled']).toBeFalsy();
    });

    it('should update value on click', () => {
        const stars = fixture.debugElement.queryAll(By.css('.sig-rating__star'));
        const secondStar = stars[1]; // Index 2 (1-based in loop logic)

        secondStar.triggerEventHandler('click', null);
        fixture.detectChanges();

        expect(component.value()).toBe(2);
    });

    it('should toggle half value on consecutive click', () => {
        fixture.componentRef.setInput('allowHalf', true);
        fixture.detectChanges();

        const thirdStar = fixture.debugElement.queryAll(By.css('.sig-rating__star'))[2]; // Index 3

        // First click -> 3
        thirdStar.triggerEventHandler('click', null);
        expect(component.value()).toBe(3);

        // Second click on same star -> 2.5
        thirdStar.triggerEventHandler('click', null);
        expect(component.value()).toBe(2.5);

        // Third click on same star -> 0 (Reset logic in code)
        thirdStar.triggerEventHandler('click', null);
        expect(component.value()).toBe(0);
    });

    it('should handle hover state temporarily', () => {
        const stars = fixture.debugElement.queryAll(By.css('.sig-rating__star'));

        // Hover over 5th star
        stars[4].triggerEventHandler('mouseenter', null);
        fixture.detectChanges();

        // Hover value set, component value unchanged (0)
        expect(component.hoverValue()).toBe(5);
        expect(component.value()).toBe(0);

        // Visual check: 5th star should look filled due to hover logic
        // (computed 'stars' uses hoverValue ?? value)
        expect(stars[4].classes['sig-rating__star--filled']).toBe(true);

        // Leave
        stars[4].triggerEventHandler('mouseleave', null);
        fixture.detectChanges();
        expect(component.hoverValue()).toBeNull();
    });

    it('should be readonly', () => {
        fixture.componentRef.setInput('readonly', true);
        fixture.detectChanges();

        const firstStar = fixture.debugElement.queryAll(By.css('.sig-rating__star'))[0];
        firstStar.triggerEventHandler('click', null);

        expect(component.value()).toBe(0); // Should not change
    });
});