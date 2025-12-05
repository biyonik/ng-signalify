import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PasswordStrengthRule {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const DEFAULT_RULES: PasswordStrengthRule[] = [
  { id: 'length', label: 'En az 8 karakter', test: (p) => p.length >= 8 },
  { id: 'lowercase', label: 'Küçük harf', test: (p) => /[a-z]/.test(p) },
  { id: 'uppercase', label: 'Büyük harf', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Rakam', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'Özel karakter', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

/**
 * SigPasswordStrength - Signal-based password strength indicator
 * 
 * Usage:
 * <sig-password-strength
 *   [password]="passwordValue"
 *   [showRules]="true"
 * />
 */
@Component({
  selector: 'sig-password-strength',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sig-password-strength">
      <!-- Strength Bar -->
      <div class="sig-password-strength__bar-container">
        <div 
          class="sig-password-strength__bar"
          [class.sig-password-strength__bar--weak]="strengthLevel() === 1"
          [class.sig-password-strength__bar--fair]="strengthLevel() === 2"
          [class.sig-password-strength__bar--good]="strengthLevel() === 3"
          [class.sig-password-strength__bar--strong]="strengthLevel() === 4"
          [style.width.%]="strengthPercentage()"
        ></div>
      </div>

      <!-- Label -->
      @if (showLabel()) {
        <div 
          class="sig-password-strength__label"
          [class.sig-password-strength__label--weak]="strengthLevel() === 1"
          [class.sig-password-strength__label--fair]="strengthLevel() === 2"
          [class.sig-password-strength__label--good]="strengthLevel() === 3"
          [class.sig-password-strength__label--strong]="strengthLevel() === 4"
        >
          {{ strengthLabel() }}
        </div>
      }

      <!-- Rules -->
      @if (showRules()) {
        <div class="sig-password-strength__rules">
          @for (rule of rulesWithStatus(); track rule.id) {
            <div 
              class="sig-password-strength__rule"
              [class.sig-password-strength__rule--passed]="rule.passed"
            >
              <span class="sig-password-strength__rule-icon">
                {{ rule.passed ? '✓' : '○' }}
              </span>
              <span class="sig-password-strength__rule-label">
                {{ rule.label }}
              </span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .sig-password-strength {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .sig-password-strength__bar-container {
      height: 4px;
      background-color: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
    }

    .sig-password-strength__bar {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s, background-color 0.3s;
    }

    .sig-password-strength__bar--weak {
      background-color: #ef4444;
    }

    .sig-password-strength__bar--fair {
      background-color: #f59e0b;
    }

    .sig-password-strength__bar--good {
      background-color: #10b981;
    }

    .sig-password-strength__bar--strong {
      background-color: #059669;
    }

    .sig-password-strength__label {
      font-size: 0.75rem;
      font-weight: 500;
    }

    .sig-password-strength__label--weak {
      color: #ef4444;
    }

    .sig-password-strength__label--fair {
      color: #f59e0b;
    }

    .sig-password-strength__label--good {
      color: #10b981;
    }

    .sig-password-strength__label--strong {
      color: #059669;
    }

    .sig-password-strength__rules {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .sig-password-strength__rule {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .sig-password-strength__rule--passed {
      color: #10b981;
    }

    .sig-password-strength__rule-icon {
      font-size: 0.625rem;
    }
  `],
})
export class SigPasswordStrengthComponent {
  readonly password = input<string>('');
  readonly rules = input<PasswordStrengthRule[]>(DEFAULT_RULES);
  readonly showLabel = input<boolean>(true);
  readonly showRules = input<boolean>(true);
  readonly minStrengthLevel = input<number>(3);

  readonly rulesWithStatus = computed(() => {
    const pwd = this.password();
    return this.rules().map((rule) => ({
      ...rule,
      passed: rule.test(pwd),
    }));
  });

  readonly passedRulesCount = computed(() => {
    return this.rulesWithStatus().filter((r) => r.passed).length;
  });

  readonly strengthPercentage = computed(() => {
    const total = this.rules().length;
    const passed = this.passedRulesCount();
    return total > 0 ? (passed / total) * 100 : 0;
  });

  readonly strengthLevel = computed(() => {
    const percentage = this.strengthPercentage();
    if (percentage === 0) return 0;
    if (percentage < 40) return 1; // Weak
    if (percentage < 60) return 2; // Fair
    if (percentage < 80) return 3; // Good
    return 4; // Strong
  });

  readonly strengthLabel = computed(() => {
    const level = this.strengthLevel();
    switch (level) {
      case 0: return '';
      case 1: return 'Zayıf';
      case 2: return 'Orta';
      case 3: return 'İyi';
      case 4: return 'Güçlü';
      default: return '';
    }
  });

  readonly isValid = computed(() => {
    return this.strengthLevel() >= this.minStrengthLevel();
  });
}