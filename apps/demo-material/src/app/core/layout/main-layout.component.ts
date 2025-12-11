/**
 * TR: Ana layout bileşeni.
 * Sidenav, header ve content alanını içeren ana yapı.
 *
 * EN: Main layout component.
 * Main structure containing sidenav, header, and content area.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { HeaderComponent } from './header.component';
import { SidenavComponent } from './sidenav.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MaterialModule,
    HeaderComponent,
    SidenavComponent
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav
        #sidenav
        mode="side"
        [opened]="sidenavOpened()"
        class="sidenav">
        <app-sidenav />
      </mat-sidenav>

      <mat-sidenav-content>
        <app-header (menuToggle)="toggleSidenav()" />
        
        <main class="main-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }

    .sidenav-container {
      height: 100%;
    }

    .sidenav {
      width: 250px;
      border-right: 1px solid rgba(0, 0, 0, 0.12);
    }

    .main-content {
      padding: 1.5rem;
      min-height: calc(100vh - 64px);
      background-color: #fafafa;
    }

    @media (max-width: 768px) {
      .sidenav {
        width: 200px;
      }

      .main-content {
        padding: 1rem;
      }
    }
  `]
})
export class MainLayoutComponent {
  sidenavOpened = signal(true);

  toggleSidenav() {
    this.sidenavOpened.update(v => !v);
  }
}
