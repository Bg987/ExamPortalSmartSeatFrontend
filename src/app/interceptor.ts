import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from './environment'; 

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const http = inject(HttpClient);
  const token = localStorage.getItem('token');

  // --- PART 1: REQUEST LOGIC (Adding Headers) ---
  let modifiedReq = req;

  // We check if we have a token and if the request is for the compiler server
  if (token && environment.apiUrl2 !== "" && req.url.includes(environment.apiUrl2)) {
    modifiedReq = req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'X-Bypass-DB': 'true' // Your bypass flag for the backend filter
      }
    });
  }

  // --- PART 2: RESPONSE LOGIC (Error Handling) ---
  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // If backend returns 401 (Unauthorized), the toked

      if (error.status === 401) {
        //alert("Unauthorized! logout.....");
        //1. Clear local session
        localStorage.clear();

        //2. Call your friend's logout API to be safe
        //Note: Using apiUrl2 since that's where the compiler/auth lives
        http.post(`${environment.apiUrl}/Auth/logout`, {}, {
          responseType: 'text',
          withCredentials : true,
         })
          .subscribe({
            next: () => console.log("Backend session invalidated"),
            error: (err) => console.error("Could not reach logout API", err)
          });
        // 3. Force redirect to landing page
        router.navigate(['/']);
      }

      return throwError(() => error);
    })
  );
};