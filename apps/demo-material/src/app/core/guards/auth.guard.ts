/**
 * TR: Mock authentication guard.
 * Gerçek bir auth sistemi olmadığı için her zaman true döner.
 *
 * EN: Mock authentication guard.
 * Always returns true since there's no real auth system.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Mock: Always authenticated
  const isAuthenticated = true;
  
  if (!isAuthenticated) {
    router.navigate(['/login']);
    return false;
  }
  
  return true;
};
