import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Role-Based Access Control Route Guards
 * Primary Owner: Member 5 (Security & Access Control)
 * 
 * Enforces least-privilege security policy and triggers red warning
 * popup whenever an unauthorized role attempts access.
 */

export const adminRoleGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  authService.triggerSecurityAlert(
    'v_security_audit_log',
    'ADMIN_ACCESS',
    `Access Prohibited: Your active role '${authService.currentUser().role}' is restricted from accessing System Administration & Security.`
  );
  return router.parseUrl('/pos');
};

export const managerRoleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isManager()) {
    return true;
  }

  const path = route.routeConfig?.path || 'RESOURCE';
  const objectMap: Record<string, string> = {
    'inventory': 'inventory',
    'purchase-orders': 'purchase_order',
    'reports': 'v_daily_sales'
  };

  const targetObject = objectMap[path] || path;
  authService.triggerSecurityAlert(
    targetObject,
    'MANAGEMENT_ACCESS',
    `Restricted Action: Cashiers are not granted access to ${path.replace('-', ' ').toUpperCase()}. Manager or Admin role required.`
  );
  return router.parseUrl('/pos');
};
