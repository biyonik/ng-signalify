/**
 * TR: Ana uygulama route yapılandırması.
 * Tüm feature module'lerin lazy loading ile yüklenmesini sağlar.
 *
 * EN: Main application routing configuration.
 * Enables lazy loading of all feature modules.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
  },
  {
    path: 'users',
    loadChildren: () => import('./features/users/user.routes').then(m => m.USER_ROUTES)
  },
  {
    path: 'products',
    loadChildren: () => import('./features/products/product.routes').then(m => m.PRODUCT_ROUTES)
  },
  {
    path: 'field-examples',
    loadChildren: () => import('./features/field-examples/field-examples.routes').then(m => m.FIELD_EXAMPLES_ROUTES)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
