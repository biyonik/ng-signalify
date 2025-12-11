/**
 * TR: Yükleme göstergesi bileşeni.
 * Asenkron işlemler sırasında kullanıcıya loading durumu gösterir.
 *
 * EN: Loading spinner component.
 * Shows loading state to user during async operations.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-container" *ngIf="loading">
      <mat-spinner [diameter]="diameter" [color]="color"></mat-spinner>
      <p *ngIf="message" class="loading-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .loading-message {
      margin-top: 1rem;
      color: rgba(0, 0, 0, 0.54);
      font-size: 14px;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() loading = true;
  @Input() message = '';
  @Input() diameter = 50;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
}
