import {
  Component,
  Directive,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  contentChildren,
  model,
  TemplateRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Step Directive
 */
@Directive({
  selector: '[sigStep]',
  standalone: true,
})
export class SigStepDirective {
  readonly label = input.required<string>();
  readonly description = input<string>('');
  readonly icon = input<string>('');
  readonly optional = input<boolean>(false);
  readonly completed = input<boolean>(false);
  readonly error = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly template = inject(TemplateRef);
}

/**
 * SigStepper - Signal-based stepper/wizard component
 * 
 * Usage:
 * <sig-stepper [(activeStep)]="currentStep" [linear]="true">
 *   <ng-template sigStep label="Kişisel Bilgiler" description="Ad, soyad, email">
 *     Step 1 content...
 *   </ng-template>
 *   <ng-template sigStep label="Adres Bilgileri">
 *     Step 2 content...
 *   </ng-template>
 *   <ng-template sigStep label="Onay" [optional]="true">
 *     Step 3 content...
 *   </ng-template>
 * </sig-stepper>
 */
@Component({
  selector: 'sig-stepper',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="sig-stepper"
      [class.sig-stepper--vertical]="orientation() === 'vertical'"
      [class.sig-stepper--compact]="compact()"
    >
      <!-- Step Headers -->
      <div class="sig-stepper__header">
        @for (step of steps(); track $index; let i = $index, last = $last) {
          <div 
            class="sig-stepper__step"
            [class.sig-stepper__step--active]="i === activeStep()"
            [class.sig-stepper__step--completed]="isStepCompleted(i)"
            [class.sig-stepper__step--error]="step.error()"
            [class.sig-stepper__step--disabled]="step.disabled()"
            [class.sig-stepper__step--clickable]="!linear() && !step.disabled()"
            (click)="onStepClick(i)"
          >
            <!-- Step indicator -->
            <div class="sig-stepper__indicator">
              @if (step.error()) {
                <span class="sig-stepper__icon sig-stepper__icon--error">!</span>
              } @else if (isStepCompleted(i)) {
                <span class="sig-stepper__icon sig-stepper__icon--check">✓</span>
              } @else if (step.icon()) {
                <span class="sig-stepper__icon">{{ step.icon() }}</span>
              } @else {
                <span class="sig-stepper__number">{{ i + 1 }}</span>
              }
            </div>

            <!-- Step label -->
            <div class="sig-stepper__label-container">
              <span class="sig-stepper__label">
                {{ step.label() }}
                @if (step.optional()) {
                  <span class="sig-stepper__optional">(İsteğe bağlı)</span>
                }
              </span>
              @if (step.description()) {
                <span class="sig-stepper__description">{{ step.description() }}</span>
              }
            </div>
          </div>

          <!-- Connector -->
          @if (!last) {
            <div 
              class="sig-stepper__connector"
              [class.sig-stepper__connector--completed]="isStepCompleted(i)"
            ></div>
          }
        }
      </div>

      <!-- Step Content -->
      <div class="sig-stepper__content">
        @for (step of steps(); track $index; let i = $index) {
          @if (i === activeStep()) {
            <div class="sig-stepper__panel" [@.disabled]="true">
              <ng-container [ngTemplateOutlet]="step.template"></ng-container>
            </div>
          }
        }
      </div>

      <!-- Navigation (optional) -->
      @if (showNavigation()) {
        <div class="sig-stepper__navigation">
          <button
            type="button"
            class="sig-stepper__btn sig-stepper__btn--prev"
            [disabled]="!canGoPrev()"
            (click)="prev()"
          >
            ← Geri
          </button>

          <div class="sig-stepper__info">
            {{ activeStep() + 1 }} / {{ steps().length }}
          </div>

          @if (isLastStep()) {
            <button
              type="button"
              class="sig-stepper__btn sig-stepper__btn--complete"
              (click)="complete()"
            >
              Tamamla ✓
            </button>
          } @else {
            <button
              type="button"
              class="sig-stepper__btn sig-stepper__btn--next"
              [disabled]="!canGoNext()"
              (click)="next()"
            >
              İleri →
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-stepper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Header */
    .sig-stepper__header {
      display: flex;
      align-items: flex-start;
    }

    .sig-stepper--vertical .sig-stepper__header {
      flex-direction: column;
    }

    /* Step */
    .sig-stepper__step {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .sig-stepper--compact .sig-stepper__step {
      flex-direction: column;
      text-align: center;
      gap: 0.5rem;
    }

    .sig-stepper__step--clickable {
      cursor: pointer;
    }

    .sig-stepper__step--disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Indicator */
    .sig-stepper__indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background-color: #e5e7eb;
      color: #6b7280;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .sig-stepper__step--active .sig-stepper__indicator {
      background-color: #3b82f6;
      color: white;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
    }

    .sig-stepper__step--completed .sig-stepper__indicator {
      background-color: #10b981;
      color: white;
    }

    .sig-stepper__step--error .sig-stepper__indicator {
      background-color: #ef4444;
      color: white;
    }

    .sig-stepper__icon {
      font-size: 1rem;
    }

    .sig-stepper__icon--check {
      font-size: 1.125rem;
    }

    .sig-stepper__icon--error {
      font-weight: 700;
    }

    .sig-stepper__number {
      font-size: 0.875rem;
    }

    /* Label */
    .sig-stepper__label-container {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .sig-stepper__label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .sig-stepper__step--active .sig-stepper__label {
      color: #3b82f6;
    }

    .sig-stepper__step--completed .sig-stepper__label {
      color: #10b981;
    }

    .sig-stepper__optional {
      font-size: 0.75rem;
      font-weight: 400;
      color: #9ca3af;
      margin-left: 0.25rem;
    }

    .sig-stepper__description {
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Connector */
    .sig-stepper__connector {
      flex: 1;
      height: 2px;
      min-width: 2rem;
      margin: 0 0.5rem;
      background-color: #e5e7eb;
      align-self: center;
      margin-top: 1.25rem;
      transform: translateY(-50%);
    }

    .sig-stepper--vertical .sig-stepper__connector {
      width: 2px;
      height: 2rem;
      min-height: 2rem;
      margin: 0.5rem 0;
      margin-left: 1.25rem;
      transform: none;
    }

    .sig-stepper__connector--completed {
      background-color: #10b981;
    }

    .sig-stepper--compact .sig-stepper__connector {
      margin-top: 1.25rem;
    }

    /* Content */
    .sig-stepper__content {
      min-height: 100px;
    }

    .sig-stepper__panel {
      animation: stepper-fade 0.2s ease-out;
    }

    @keyframes stepper-fade {
      from {
        opacity: 0;
        transform: translateX(10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Navigation */
    .sig-stepper__navigation {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .sig-stepper__btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background: white;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s;
    }

    .sig-stepper__btn:hover:not(:disabled) {
      background-color: #f9fafb;
    }

    .sig-stepper__btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .sig-stepper__btn--next,
    .sig-stepper__btn--complete {
      background-color: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .sig-stepper__btn--next:hover:not(:disabled),
    .sig-stepper__btn--complete:hover:not(:disabled) {
      background-color: #2563eb;
    }

    .sig-stepper__btn--complete {
      background-color: #10b981;
      border-color: #10b981;
    }

    .sig-stepper__btn--complete:hover:not(:disabled) {
      background-color: #059669;
    }

    .sig-stepper__info {
      font-size: 0.875rem;
      color: #6b7280;
    }
  `],
})
export class SigStepperComponent {
  readonly steps = contentChildren(SigStepDirective);

  readonly activeStep = model<number>(0);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly linear = input<boolean>(false);
  readonly compact = input<boolean>(false);
  readonly showNavigation = input<boolean>(true);

  readonly stepChanged = output<number>();
  readonly completed = output<void>();

  readonly canGoPrev = computed(() => this.activeStep() > 0);
  
  readonly canGoNext = computed(() => {
    const current = this.activeStep();
    const stepsArray = this.steps();
    
    if (current >= stepsArray.length - 1) return false;
    if (this.linear() && stepsArray[current]?.error()) return false;
    
    return true;
  });

  readonly isLastStep = computed(() => {
    return this.activeStep() === this.steps().length - 1;
  });

  isStepCompleted(index: number): boolean {
    const step = this.steps()[index];
    if (step?.completed()) return true;
    if (this.linear()) return index < this.activeStep();
    return false;
  }

  onStepClick(index: number): void {
    if (this.linear()) return;
    
    const step = this.steps()[index];
    if (step?.disabled()) return;
    
    this.goTo(index);
  }

  next(): void {
    if (this.canGoNext()) {
      this.goTo(this.activeStep() + 1);
    }
  }

  prev(): void {
    if (this.canGoPrev()) {
      this.goTo(this.activeStep() - 1);
    }
  }

  goTo(index: number): void {
    const stepsArray = this.steps();
    if (index >= 0 && index < stepsArray.length) {
      this.activeStep.set(index);
      this.stepChanged.emit(index);
    }
  }

  complete(): void {
    this.completed.emit();
  }

  // Public API
  reset(): void {
    this.activeStep.set(0);
  }

  first(): void {
    this.goTo(0);
  }

  last(): void {
    this.goTo(this.steps().length - 1);
  }
}