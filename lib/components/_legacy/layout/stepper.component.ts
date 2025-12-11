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
  ViewEncapsulation,
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
  encapsulation: ViewEncapsulation.None,
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