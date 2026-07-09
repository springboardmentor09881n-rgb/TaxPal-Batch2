import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  let cloned = req;
  if (token) {
    cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(cloned).pipe(
    catchError((error: any) => {
      // Do not perform automatic 401 redirect for authentication endpoints themselves
      const isAuthRequest = req.url.includes('/login') || req.url.includes('/register') || req.url.includes('/auth');
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
