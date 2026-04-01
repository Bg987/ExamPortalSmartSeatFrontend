import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { Router,RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; // Import this
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environment';


@Component({
  selector: 'app-dashboard',
  imports: [CommonModule,RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
  
export class Dashboard {
  isBackendReady1 :any = false;
  isBackendReady2: any = false;
  isLoggingOut = false;
  constructor(private router: Router,
    private http: HttpClient,
  private cdr :ChangeDetectorRef) { }

  ngOnInit() {
    this.checkSystem2();
  }


    checkSystem2() {
      this.http.get(`${environment.apiUrl}/exam/health`, { 
        responseType: 'text',//tells Angular NOT to parse it as JSON
        withCredentials: true,
        })
        .subscribe({
          next: () => {
            this.isBackendReady2 = true;
            this.cdr.detectChanges();
          },
          error: () => {
            this.isBackendReady2 = false;
            this.cdr.detectChanges();
                  // 
          }
        });
  }
  
  logout() {
    this.isLoggingOut = true;
  // 1. Call the backend logout endpoint first
  // We use apiUrl2 since you mentioned it's on your friend's server
    this.http.post(`${environment.apiUrl}/Auth/logout`, {}, {
      withCredentials: true,
      responseType: 'text'
    })
    .subscribe({
      next: (res) => {
        console.log("Server logout successful:", res);
        this.finalizeLogout();
      },
      error: (err) => {
        console.error("Server logout failed, clearing local data anyway:", err);
        // We still call finalizeLogout so the user isn't "stuck" logged in locally
      }
    });
    this.finalizeLogout();
}

// 2. Private helper to handle the local cleanup
private finalizeLogout() {
  // Remove the token
  localStorage.removeItem('token');
  localStorage.removeItem("enrollmentNo");
  // Reset your backend status variables
  this.isBackendReady1 = null;
  this.isBackendReady2 = null;
  // Redirect to login page
  this.isLoggingOut = false;
  this.router.navigate(['/']);
}
}
