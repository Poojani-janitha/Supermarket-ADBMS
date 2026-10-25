import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * JWT HTTP Interceptor (Angular 17+ Functional Interceptor)
 * Primary Owner: Member 5 (Security & Client Infrastructure)
 * 
 * Injects Authorization: Bearer <token> header and catches 403 Forbidden
 * security violations to trigger the universal security alert popup.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  let requestToForward = req;
  if (token) {
    requestToForward = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(requestToForward).pipe(
    catchError((error) => {
      if (error && error.status === 403) {
        const targetObj = error.error?.object || error.error?.objectName || req.url.split('/').pop() || 'DATABASE_OBJECT';
        const action = req.method;
        const msg = error.error?.message || `Security Violation: Your active role '${authService.currentUser().role}' is restricted from executing '${action}' on '${targetObj}'.`;
        authService.triggerSecurityAlert(targetObj, action, msg);
      }
      return throwError(() => error);
    })
  );
};

