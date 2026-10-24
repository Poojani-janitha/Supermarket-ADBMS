import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * JWT HTTP Interceptor (Angular 17+ Functional Interceptor)
 * Primary Owner: Member 5 (Security & Client Infrastructure)
 * 
 * Injects Authorization: Bearer <token> header into outgoing REST calls.
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
