import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role-Based Access Control Route Guard
 * Primary Owner: Member 5 (Security & Access Control)
 * 
 * Restricts access to Admin endpoints exclusively to ADMIN role.
 */
export const adminRoleGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  return router.parseUrl('/pos');
};
