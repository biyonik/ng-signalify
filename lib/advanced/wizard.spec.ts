// lib/advanced/wizard.spec.ts
import { createWizard, WizardStep } from './wizard';
import { TestBed } from '@angular/core/testing';

describe('Wizard State Machine', () => {
    const steps: WizardStep[] = [
        { id: 'step1', title: 'Step 1' },
        { id: 'step2', title: 'Step 2' },
        { id: 'step3', title: 'Step 3' }
    ];

    it('should initialize correctly', () => {
        TestBed.runInInjectionContext(() => {
            const wizard = createWizard(steps);
            expect(wizard.currentIndex()).toBe(0);
            expect(wizard.isFirst()).toBe(true);
            expect(wizard.isLast()).toBe(false);
            expect(wizard.progress()).toBe(0);
        });
    });

    it('should navigate sequentially (Linear Flow)', async () => {
        await TestBed.runInInjectionContext(async () => {
            const wizard = createWizard(steps, {}, { linear: true });

            // Normal İlerleme
            await wizard.next();
            expect(wizard.currentIndex()).toBe(1);
            expect(wizard.steps()[0].status).toBe('completed');

            // Geri Gelme
            await wizard.prev();
            expect(wizard.currentIndex()).toBe(0);
        });
    });

    it('should respect "beforeLeave" guard', async () => {
        const guardedSteps = [
            {
                id: 's1',
                title: 'Guarded',
                beforeLeave: jest.fn().mockReturnValue(false) // İzin verme
            },
            { id: 's2', title: 'Next' }
        ];

        await TestBed.runInInjectionContext(async () => {
            const wizard = createWizard(guardedSteps);

            const result = await wizard.next();

            expect(result).toBe(false);
            expect(wizard.currentIndex()).toBe(0); // İlerleyemedi
            expect(guardedSteps[0].beforeLeave).toHaveBeenCalled();
        });
    });

    it('should handle optional steps (Skip)', async () => {
        const optionalSteps: WizardStep[] = [
            { id: 's1', title: 'Mandatory' },
            { id: 's2', title: 'Optional', optional: true },
            { id: 's3', title: 'Final' }
        ];

        await TestBed.runInInjectionContext(async () => {
            const wizard = createWizard(optionalSteps);

            // Step 2'ye gel
            await wizard.next();
            expect(wizard.currentIndex()).toBe(1);

            // Atla
            await wizard.skip();
            expect(wizard.currentIndex()).toBe(2);

            // Durumu 'skipped' olmalı
            expect(wizard.steps()[1].status).toBe('skipped');
        });
    });
});