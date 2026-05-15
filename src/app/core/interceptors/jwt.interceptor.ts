import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const user = authService.getUser();

  let modifiedReq = req;

  if (token) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  if (user && user.id) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role || ''
      }
    });
  }

  return next(modifiedReq);
};
