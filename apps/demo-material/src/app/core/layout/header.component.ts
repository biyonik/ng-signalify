/**
 * TR: Header bileşeni.
 * Üst menü çubuğu, menü toggle butonu ve başlık içerir.
 *
 * EN: Header component.
 * Top menu bar with menu toggle button and title.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Component, Output, EventEmitter } from '@angular/core';
import { MaterialModule } from '../../shared/material.module';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MaterialModule],
  template: `
    <mat-toolbar color="primary" class="header">
      <button mat-icon-button (click)="menuToggle.emit()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="title">ng-signalify Material Demo</span>
      <span class="spacer"></span>
      <button mat-icon-button [matMenuTriggerFor]="menu">
        <mat-icon>more_vert</mat-icon>
      </button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item>
          <mat-icon>settings</mat-icon>
          <span>Settings</span>
        </button>
        <button mat-menu-item>
          <mat-icon>help</mat-icon>
          <span>Help</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item>
          <mat-icon>exit_to_app</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .header {
      position: sticky;
      top: 0;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .title {
      font-size: 1.25rem;
      font-weight: 500;
    }

    .spacer {
      flex: 1 1 auto;
    }

    @media (max-width: 768px) {
      .title {
        font-size: 1rem;
      }
    }
  `]
})
export class HeaderComponent {
  @Output() menuToggle = new EventEmitter<void>();
}
