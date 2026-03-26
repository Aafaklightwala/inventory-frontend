// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const router = inject(Router);

  let authReq = req;

  // ✅ Attach token
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // 🔥 AUTO LOGOUT WHEN TOKEN EXPIRED / INVALID
      if (error.status === 401) {
        localStorage.clear(); // better than removeItem
        router.navigate(['/login']);
      }

      return throwError(() => error);
    }),
  );
};
