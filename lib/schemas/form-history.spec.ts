import { createFormHistory } from './form-history';
import { TestBed } from '@angular/core/testing';

describe('FormHistory (Time Travel)', () => {
    it('should perform Undo/Redo operations', () => {
        // History context içinde çalışmalı (Signals)
        TestBed.runInInjectionContext(() => {
            const history = createFormHistory({ step: 0 });

            // Step 1
            history.push({ step: 1 });
            expect(history.current()?.step).toBe(1);
            expect(history.canUndo()).toBe(true);

            // Step 2
            history.push({ step: 2 });

            // Undo -> 1
            const undoState = history.undo();
            expect(undoState?.step).toBe(1);
            expect(history.current()?.step).toBe(1);
            expect(history.canRedo()).toBe(true); // Artık ileri gidebiliriz

            // Redo -> 2
            const redoState = history.redo();
            expect(redoState?.step).toBe(2);
        });
    });

    it('should manage Checkpoints', () => {
        TestBed.runInInjectionContext(() => {
            const history = createFormHistory({ val: 'init' });

            history.push({ val: 'draft' });
            history.checkpoint('Draft Saved'); // Etiketle

            history.push({ val: 'final' });

            // Checkpoint'e geri dön
            const state = history.goToCheckpoint('Draft Saved');
            expect(state?.val).toBe('draft');

            // İleri (final) artık "future" stack'inde olmalı
            expect(history.futureCount()).toBeGreaterThan(0);
        });
    });

    it('should limit history size (Memory Management)', () => {
        TestBed.runInInjectionContext(() => {
            const history = createFormHistory(0, { maxSize: 2 });

            history.push(1);
            history.push(2);
            history.push(3); // 0 (initial) silinmeli çünkü sınır 2

            // Geriye doğru: 3 -> 2 -> 1
            history.undo(); // 2
            history.undo(); // 1
            expect(history.undo()).toBeUndefined(); // 0 silindiği için gidemez
        });
    });
});