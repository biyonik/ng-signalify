/**
 * TR: Sidenav bileşeni.
 * Yan menü navigasyon listesini içerir.
 *
 * EN: Sidenav component.
 * Contains side menu navigation list.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [MaterialModule, RouterLink, RouterLinkActive],
  template: `
    <div class="sidenav-header">
      <h2>Menu</h2>
    </div>
    
    <mat-nav-list>
      @for (item of menuItems; track item.route) {
        <a
          mat-list-item
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }">
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          <span matListItemTitle>{{ item.label }}</span>
        </a>
      }
    </mat-nav-list>
  `,
  styles: [`
    .sidenav-header {
      padding: 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      background-color: #f5f5f5;
    }

    .sidenav-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.87);
    }

    mat-nav-list {
      padding-top: 0.5rem;
    }

    a.active {
      background-color: rgba(63, 81, 181, 0.08);
      color: #3f51b5;
    }

    a.active mat-icon {
      color: #3f51b5;
    }

    a:hover:not(.active) {
      background-color: rgba(0, 0, 0, 0.04);
    }
  `]
})
export class SidenavComponent {
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Users',
      icon: 'people',
      route: '/users'
    },
    {
      label: 'Products',
      icon: 'inventory_2',
      route: '/products'
    },
    {
      label: 'Field Examples',
      icon: 'widgets',
      route: '/field-examples'
    }
  ];
}
