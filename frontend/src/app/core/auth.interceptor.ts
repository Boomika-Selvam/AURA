import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('aura.accessToken');
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error?.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
        // Session expired or invalid — don't let the app silently fall back to stale/demo state.
        localStorage.removeItem('aura.accessToken');
        localStorage.removeItem('aura.refreshToken');
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    })
  );
};
